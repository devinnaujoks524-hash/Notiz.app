// Tresor: verschlüsselt alle Daten lokal (AES-256-GCM).
// Der Datenschlüssel (DEK) wird mit einem Schlüssel aus deinem Code (PBKDF2)
// und optional mit einem Schlüssel aus dem Fingerabdruck (WebAuthn PRF) verpackt.

const DB = 'notiz', STORE = 'kv', ITER = 600000;
const te = new TextEncoder(), td = new TextDecoder();
const rand = n => crypto.getRandomValues(new Uint8Array(n));

function idb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function tx(mode, fn) {
  const db = await idb();
  return new Promise((res, rej) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}
const get = k => tx('readonly', s => s.get(k));
const put = (k, v) => tx('readwrite', s => s.put(v, k));
const del = k => tx('readwrite', s => s.delete(k));

async function codeKey(code, salt, iter = ITER) {
  const base = await crypto.subtle.importKey('raw', te.encode(code), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['wrapKey', 'unwrapKey']);
}
async function prfKey(bytes) {
  const base = await crypto.subtle.importKey('raw', bytes, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: te.encode('notiz-kek-v1') },
    base, { name: 'AES-GCM', length: 256 }, false, ['wrapKey', 'unwrapKey']);
}
async function wrap(dek, kek) {
  const iv = rand(12);
  return { iv, w: new Uint8Array(await crypto.subtle.wrapKey('raw', dek, kek, { name: 'AES-GCM', iv })) };
}
function unwrap(o, kek) {
  return crypto.subtle.unwrapKey('raw', o.w, kek, { name: 'AES-GCM', iv: o.iv },
    { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}
async function prfGet(id, salt) {
  const a = await navigator.credentials.get({ publicKey: {
    challenge: rand(32), allowCredentials: [{ type: 'public-key', id }],
    userVerification: 'required', timeout: 60000,
    extensions: { prf: { eval: { first: salt } } } } });
  const r = a.getClientExtensionResults().prf?.results?.first;
  if (!r) throw new Error('noprf');
  return new Uint8Array(r);
}

// Uint8Array <-> Base64 für Backup-Dateien
const b64 = u => btoa(String.fromCharCode(...u));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
function ser(v) {
  if (v instanceof Uint8Array || v instanceof ArrayBuffer) return { $b: b64(new Uint8Array(v)) };
  if (Array.isArray(v)) return v.map(ser);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, ser(x)]));
  return v;
}
function deser(v) {
  if (v && typeof v === 'object' && typeof v.$b === 'string') return unb64(v.$b);
  if (Array.isArray(v)) return v.map(deser);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deser(x)]));
  return v;
}

export const Vault = {
  dek: null, rec: null,

  async exists() { this.rec = await get('vault'); return !!this.rec; },
  get unlocked() { return !!this.dek; },
  get hasBio() { return !!this.rec?.prf; },
  get hasCode() { return !!this.rec?.code; },

  // Ohne Code: Datenschlüssel liegt ungeschützt auf dem Gerät, die App öffnet sich von selbst.
  async autoOpen() {
    this.dek = await crypto.subtle.importKey('raw', this.rec.open, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    return this.load();
  },
  async disableCode(code) {
    if (!(await this.checkCode(code))) throw new Error('wrong');
    const raw = new Uint8Array(await crypto.subtle.exportKey('raw', this.dek));
    const { code: _c, salt: _s, iter: _i, ...rest } = this.rec;
    this.rec = { ...rest, open: raw, prf: null };
    await put('vault', this.rec);
  },
  async enableCode(newCode) {
    const salt = rand(16);
    const { open: _o, ...rest } = this.rec;
    this.rec = { ...rest, iter: ITER, salt, code: await wrap(this.dek, await codeKey(newCode, salt)), prf: null };
    await put('vault', this.rec);
  },

  async create(code, data) {
    const salt = rand(16);
    const dek = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    this.rec = { v: 1, iter: ITER, salt, code: await wrap(dek, await codeKey(code, salt)), prf: null };
    this.dek = dek;
    await this.save(data);
  },

  async unlockCode(code) {
    const kek = await codeKey(code, this.rec.salt, this.rec.iter);
    try { this.dek = await unwrap(this.rec.code, kek); } catch { throw new Error('wrong'); }
    return this.load();
  },

  async checkCode(code) {
    try { await unwrap(this.rec.code, await codeKey(code, this.rec.salt, this.rec.iter)); return true; }
    catch { return false; }
  },

  async load() {
    const d = this.rec.data;
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: d.iv }, this.dek, d.ct);
    return JSON.parse(td.decode(pt));
  },

  async save(obj) {
    if (!this.dek) return;
    const iv = rand(12);
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, this.dek, te.encode(JSON.stringify(obj))));
    this.rec.data = { iv, ct };
    await put('vault', this.rec);
  },

  lock() { this.dek = null; },

  async changeCode(newCode) {
    const salt = rand(16);
    this.rec.salt = salt; this.rec.iter = ITER;
    this.rec.code = await wrap(this.dek, await codeKey(newCode, salt));
    await put('vault', this.rec);
  },

  async bioAvailable() {
    try { return !!(window.PublicKeyCredential && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()); }
    catch { return false; }
  },

  async enrollBio() {
    const cred = await navigator.credentials.create({ publicKey: {
      challenge: rand(32), rp: { name: 'Lumen' },
      user: { id: rand(16), name: 'Lumen', displayName: 'Lumen' },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: 'platform', residentKey: 'preferred', userVerification: 'required' },
      timeout: 60000, extensions: { prf: {} } } });
    const ext = cred.getClientExtensionResults();
    if (!ext.prf || ext.prf.enabled === false) throw new Error('noprf');
    const id = new Uint8Array(cred.rawId), salt = rand(32);
    const kek = await prfKey(await prfGet(id, salt));
    this.rec.prf = { id, salt, ...(await wrap(this.dek, kek)) };
    await put('vault', this.rec);
  },

  async unlockBio() {
    const p = this.rec.prf;
    const kek = await prfKey(await prfGet(p.id, p.salt));
    try { this.dek = await unwrap(p, kek); } catch { throw new Error('bio'); }
    return this.load();
  },

  async disableBio() { this.rec.prf = null; await put('vault', this.rec); },

  exportText() {
    const { prf, ...rest } = this.rec; // Fingerabdruck gilt nur für dieses Gerät
    return JSON.stringify({ app: 'notiz', ...ser(rest) });
  },

  async importText(txt) {
    const raw = JSON.parse(txt);
    if (raw.app !== 'notiz') throw new Error('format');
    const { app, ...r } = raw;
    const rec = deser(r);
    if (!(rec.open || (rec.salt && rec.code?.w)) || !rec.data?.ct) throw new Error('format');
    rec.prf = null;
    await put('vault', rec);
    this.rec = rec; this.dek = null;
  },

  async wipe() { await del('vault'); this.rec = null; this.dek = null; },
};
