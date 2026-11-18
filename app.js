import { Vault } from './vault.js';
import { cardMarkup, mountViewer, THEMES } from './viz.js';

const $ = (s, r = document) => r.querySelector(s);
const app = $('#app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
const soundOn = () => { try { return localStorage.getItem('lumen-sound') !== '0'; } catch { return true; } };
const buzz = ms => { try { if (soundOn()) navigator.vibrate?.(ms); } catch {} };
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
// Im Glas-Design nur schieben statt einblenden: Durchsichtigkeit auf einem Behälter würde die Lichtbrechung seiner Glasflächen kurz abschalten
const fadeIn = el => { if (el && !reduced()) el.animate?.([document.documentElement.dataset.theme === 'glass' ? { transform: 'translateY(8px)' } : { opacity: .35, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.2,.8,.2,1)' }); };
const popEl = el => { if (el && !reduced()) el.animate?.([{ transform: 'scale(.94)', opacity: .5 }, { transform: 'none', opacity: 1 }], { duration: 300, easing: 'cubic-bezier(.2,.9,.25,1.1)' }); };
const shake = el => { if (el && !reduced()) el.animate?.([{ transform: 'translateX(0)' }, { transform: 'translateX(-9px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], { duration: 380, easing: 'ease-out' }); };

/* ---------- Icons ---------- */
const P = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  note: '<rect x="5" y="3" width="14" height="18" rx="3"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/>',
  card: '<rect x="3" y="6" width="18" height="12" rx="3"/><path d="M3 10h18"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 018 0v3"/>',
  gear: '<path d="M9.75 4.74 L10.38 2.54 L13.62 2.54 L14.25 4.74 L15.55 5.28 L17.54 4.16 L19.84 6.46 L18.72 8.45 L19.26 9.75 L21.46 10.38 L21.46 13.62 L19.26 14.25 L18.72 15.55 L19.84 17.54 L17.54 19.84 L15.55 18.72 L14.25 19.26 L13.62 21.46 L10.38 21.46 L9.75 19.26 L8.45 18.72 L6.46 19.84 L4.16 17.54 L5.28 15.55 L4.74 14.25 L2.54 13.62 L2.54 10.38 L4.74 9.75 L5.28 8.45 L4.16 6.46 L6.46 4.16 L8.45 5.28Z"/><circle cx="12" cy="12" r="3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  finger: '<path d="M12 11v2.5a7 7 0 01-1.2 4"/><path d="M8.7 10.2A3.5 3.5 0 0115.5 11v2.5a10 10 0 01-.6 3.4"/><path d="M6 13v-1.5a6 6 0 0111.6-2.2"/><path d="M18 13.5a14 14 0 01-.9 4.2"/><path d="M4.6 8.6a8 8 0 0113.8-2.2"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  pin: '<path d="M12 16v6M8 3h8l-1 6 3 4H6l3-4z"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  pause: '<path d="M8.5 5v14M15.5 5v14"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  wifi: '<path d="M8.5 8.5a5 5 0 010 7M12 6a8.5 8.5 0 010 12M15.5 3.5a12 12 0 010 17"/>',
  flame: '<path d="M12 3c.5 3.5 5.5 6 5.5 11a5.5 5.5 0 01-11 0c0-2.4 1.2-4 2.6-5.3.3 1.7 1.1 2.8 2.2 3.3C11 9.5 10.8 6 12 3z"/>',
  mic: '<rect x="9" y="2.5" width="6" height="11.5" rx="3"/><path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21"/>',
  stop: '<rect x="6.5" y="6.5" width="11" height="11" rx="2.5"/>',
  bell: '<path d="M6 16v-5a6 6 0 0112 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 004 0"/>',
  belloff: '<path d="M6 16v-5a6 6 0 0112 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 004 0"/><path d="M3.5 3.5l17 17"/>',
  battery: '<rect x="2.5" y="7" width="17" height="10" rx="2.5"/><path d="M22 10.5v3"/><path d="M6 10.5v3" stroke-width="3"/>',
  back10: '<path d="M4.5 13a7.5 7.5 0 107.5-7.5H8.5"/><path d="M11 2.5L8 5.5l3 3"/>',
  fwd10: '<path d="M19.5 13A7.5 7.5 0 1112 5.5h3.5"/><path d="M13 2.5l3 3-3 3"/>',
  play: '<path d="M8 5l11 7-11 7z"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M4 7.5l8 6 8-6"/>',
  eye: '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  bag: '<path d="M6 8h12l1 12H5z"/><path d="M9 8V6.5a3 3 0 016 0V8"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/>',
};
const ic = n => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${P[n]}</svg>`;

/* ---------- Zustand ---------- */
const empty = () => ({ v: 1, notes: [], todos: [], cards: [], invoices: [], settings: { autolock: 60 } });
let data = null, tab = 'home', saveT = null, hiddenAt = 0, bioOk = false, fails = 0, waitUntil = 0, enter = true, menuOpen = false, updateReady = false;
const freshIds = new Set();
const sheets = [];
const COLORS = ['yellow', 'orange', 'pink', 'violet', 'blue', 'green'];

function save() {
  clearTimeout(saveT);
  saveT = setTimeout(flush, 350);
}
async function flush() {
  clearTimeout(saveT); saveT = null;
  if (!data || !Vault.unlocked) return;
  try { await Vault.save(data); } catch { toast('Speichern fehlgeschlagen'); }
}

let toastT;
// Hinweis als kleine Insel: Symbol links, Text, rechts ggf. „An/Aus“ oder „Rückgängig“
const TOAST_KIND = [
  [/falsch|fehlgeschlagen|nicht|keine gültige|Abgebrochen/i, 'x', 'red'],
  [/gelöscht|verworfen/, 'trash', 'red'],
  [/angeheftet|gelöst/, 'pin', 'yellow'],
  [/Kopiert/, 'copy', 'blue'],
  [/Timer/, 'clock', 'pink'],
  [/^Lautlos/, 'belloff', 'red'],
  [/^Ton /, 'bell', 'green'],
  [/Gesperrt/, 'lock', 'violet'],
  [/Erinnerung/, 'clock', 'orange'],
  [/Wieder offen/, 'back', 'orange'],
  [/Sprachnotiz|Mikrofon|Aufnahme/, 'mic', 'red'],
  [/Fingerabdruck/, 'finger', 'green'],
  [/Code/, 'lock', 'green'],
];
const yieldLive = () => document.body.classList.toggle('isl-busy', !!($('#toast.show') || $('.island')));
function toast(msg, { undo } = {}) {
  const t = $('#toast');
  const [, icon, color] = TOAST_KIND.find(k => k[0].test(msg)) || [0, 'check', 'green'];
  const sw = msg.match(/^(.*) (an|aus)$/);
  t.innerHTML = `<span class="t-ic" style="--a:var(--${color})">${ic(icon)}</span><span class="t-tx">${esc(sw ? sw[1] : msg)}</span>${
    sw ? `<span class="t-val ${sw[2]}">${sw[2] === 'an' ? 'An' : 'Aus'}</span>` : ''}${undo ? '<button type="button">Rückgängig</button>' : ''}`;
  t.classList.toggle('act', !!undo); t.classList.toggle('sil', msg === 'Lautlos'); t.classList.add('show'); yieldLive();
  if (color === 'red' && icon === 'x') buzz([18, 50, 18]);
  const hide = () => { t.classList.remove('show'); yieldLive(); };
  if (undo) t.querySelector('button').onclick = () => { hide(); buzz(8); undo(); };
  clearTimeout(toastT); toastT = setTimeout(hide, undo ? 5200 : 2600);
}

// Konfetti: kleine bunte Teilchen fliegen von einem Punkt aus auseinander
function confetti(x, y) {
  if (reduced()) return;
  const box = document.createElement('div'); box.className = 'confetti'; box.setAttribute('aria-hidden', 'true'); document.body.append(box);
  for (let i = 0; i < 36; i++) {
    const p = document.createElement('i'), a = Math.random() * Math.PI * 2, d = 70 + Math.random() * 160, sz = 6 + Math.random() * 6, rot = () => (Math.random() * 900 - 450).toFixed(0);
    p.style.cssText = `left:${x}px;top:${y}px;width:${sz}px;height:${sz * (Math.random() < .5 ? 1 : .45)}px;background:var(--${COLORS[i % COLORS.length]});border-radius:${Math.random() < .4 ? '50%' : '2px'}`;
    box.append(p);
    p.animate([
      { transform: 'translate(-50%, -50%) scale(.3)', opacity: 1 },
      { transform: `translate(calc(-50% + ${(Math.cos(a) * d).toFixed(0)}px), calc(-50% + ${(Math.sin(a) * d - 40).toFixed(0)}px)) rotate(${rot()}deg)`, opacity: 1, offset: .5 },
      { transform: `translate(calc(-50% + ${(Math.cos(a) * d * 1.15).toFixed(0)}px), calc(-50% + ${(Math.sin(a) * d + 140).toFixed(0)}px)) rotate(${rot()}deg) scale(.8)`, opacity: 0 },
    ], { duration: 1100 + Math.random() * 500, easing: 'cubic-bezier(.15, .7, .3, 1)', fill: 'forwards' });
  }
  setTimeout(() => box.remove(), 1800);
}

/* ---------- Design: Klassisch (schwarz) oder Glas ---------- */
const lsGet = k => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
const WALLS = [['aurora', 'Aurora'], ['ocean', 'Ozean'], ['sunset', 'Abendrot'], ['forest', 'Wald'], ['graphite', 'Graphit']];
const THEMES_UI = ['classic', 'glass', 'ember'];
const getTheme = () => { const t = document.documentElement.dataset.theme; return t === 'glass' || t === 'ember' ? t : 'classic'; };
const getWall = () => document.documentElement.dataset.wall || 'aurora';
function applyTheme(theme, wall) {
  const r = document.documentElement;
  if (theme === 'glass' || theme === 'ember') r.dataset.theme = theme; else delete r.dataset.theme;
  r.dataset.wall = WALLS.some(w => w[0] === wall) ? wall : 'aurora';
  $('meta[name="theme-color"]')?.setAttribute('content', theme === 'glass' ? '#05050a' : theme === 'ember' ? '#0a0a0b' : '#000000');
  // offene Blätter an das Design anpassen (Glas: eigenes Hintergrundbild, kein Kreis-Ausschnitt – der würde die Lichtbrechung abschalten)
  sheets.forEach(({ el }) => {
    if (theme === 'glass' && !el.classList.contains('quick')) { if (!el.querySelector(':scope > .wall')) el.insertAdjacentHTML('afterbegin', '<div class="wall" aria-hidden="true"></div>'); }
  });
  lgSync(); glassSync();
}

/* ---------- Flüssiges Glas: echte Lichtbrechung am Rand ---------- */
// Jede Glasfläche bekommt einen eigenen SVG-Filter als backdrop-filter: Eine Verschiebungskarte biegt den Hintergrund am Rand
// wie eine Linse, eine zweite Karte legt den Lichtrand darüber. Das können nur Chromium-Browser (Chrome, Edge, Samsung Internet);
// überall sonst bleibt es bei mattem Glas mit Rand per CSS.
const LG_KINDS = [
  ['dark', '#toast, .island, .live, .dlg, .nbar, .ulock', { blur: 8, scale: 54, bezel: 20, rim: 1 }],
  ['bar', 'nav.tabs, .fab', { blur: 9, scale: 60, bezel: 22, rim: 1 }], // liegt über scrollendem Inhalt: stärker weichzeichnen, damit die Beschriftung lesbar bleibt
  ['clear', '.iconbtn:not(.sm), .fm-item, .search, .addrow, .seg, .dchip, .more, .btn:not(.primary):not(.danger)', { blur: 2.2, scale: 62, bezel: 22, rim: 1 }],
  ['frost', '.memo, .note, .todo, .group, .invrow, .prog, .pinnote, .sumbox, .pill, .hctile, .themetile, .hcprev, .nbody, .field input, .field select, .field textarea', { blur: 7, scale: 48, bezel: 18, rim: .9 }],
];
const LG_SEL = LG_KINDS.map(k => k[1]).join(', ');
// Akku schwach (≤ 20 %, lädt nicht): Lichtbrechung pausiert, bis wieder geladen wird
let lowPower = false, battNoted = false, battLevel = 1;
function battNote(wasLens) {
  if (battNoted || !data) return; battNoted = true;
  island({ icon: 'battery', color: 'red', title: `Akku schwach · ${Math.round(battLevel * 100)} %`, text: wasLens ? 'Lichtbrechung pausiert' : 'Lumen spart Strom', ms: 4200 });
}
navigator.getBattery?.().then(b => {
  const check = () => {
    battLevel = b.level;
    const low = !b.charging && b.level <= .2; if (low === lowPower) return;
    const wasLens = lg.on; lowPower = low; lgSync();
    if (low) battNote(wasLens); else if (!wasLens && lg.on) toast('Lichtbrechung wieder aktiv');
  };
  b.addEventListener('levelchange', check); b.addEventListener('chargingchange', check); check();
}).catch(() => {});
const lg = { ok: /Chrome\/\d+/.test(navigator.userAgent) && !!window.CSS?.supports?.('backdrop-filter', 'url(#a)'), on: false, n: 0, made: new Map(), timers: new WeakMap(), defs: null, ro: null, mo: null };
// Zeichnet die zwei Karten für eine abgerundete Fläche: Verschiebung (R = x, G = y) in halber Auflösung, Lichtrand in voller
function lgMaps(w, h, r, bez, rim) {
  const make = (cw, ch, fn) => {
    const c = document.createElement('canvas'); c.width = cw; c.height = ch;
    const ctx = c.getContext('2d'), img = ctx.createImageData(cw, ch), d = img.data, hx = w / 2, hy = h / 2, kx = w / cw, ky = h / ch;
    for (let py = 0, i = 0; py < ch; py++) for (let px = 0; px < cw; px++, i += 4) {
      const x = (px + .5) * kx - hx, y = (py + .5) * ky - hy, qx = Math.abs(x) - (hx - r), qy = Math.abs(y) - (hy - r);
      let nx = 0, ny = 0, dist; // dist = Abstand zum Rand (innen positiv), n = Richtung nach außen
      if (qx > 0 && qy > 0) { const l = Math.hypot(qx, qy) || 1; nx = qx / l * Math.sign(x); ny = qy / l * Math.sign(y); dist = r - l; }
      else if (qx > qy) { nx = Math.sign(x); dist = r - qx; } else { ny = Math.sign(y); dist = r - qy; }
      fn(d, i, nx, ny, dist);
    }
    ctx.putImageData(img, 0, 0); return c.toDataURL();
  };
  const L = Math.SQRT1_2; // Licht kommt von oben links
  return [
    make(Math.max(2, Math.ceil(w / 2)), Math.max(2, Math.ceil(h / 2)), (d, i, nx, ny, dist) => {
      const t = Math.min(1, Math.max(0, 1 - dist / bez)), m = t * t * t; // am Rand stark, nach innen schnell null
      d[i] = 128 - nx * m * 127; d[i + 1] = 128 - ny * m * 127; d[i + 2] = 128; d[i + 3] = 255;
    }),
    make(w, h, (d, i, nx, ny, dist) => {
      const t = Math.min(1, Math.max(0, 1 - dist / bez)), edge = Math.max(0, 1 - Math.abs(dist - .9) / 1.15), dir = Math.abs(nx * L + ny * L);
      d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = Math.min(255, (edge * (.14 + .86 * Math.pow(dir, 2)) + .07 * t * t) * rim * 255);
    }),
  ];
}
function lgSpec(el) {
  const w = el.offsetWidth, h = el.offsetHeight;
  if (w < 20 || h < 20 || w * h > 340000) return null;
  const kind = LG_KINDS.find(k => el.matches(k[1])); if (!kind) return null;
  const cs = getComputedStyle(el).borderTopLeftRadius; let r = parseFloat(cs) || 0; if (cs.includes('%')) r = r / 100 * Math.min(w, h);
  r = Math.round(Math.min(r, w / 2, h / 2));
  return { w, h, r, kind, key: `${kind[0]}-${w}-${h}-${r}` };
}
function lgFilter(sp) {
  let id = lg.made.get(sp.key); if (id) return id;
  const o = sp.kind[2], [dm, sm] = lgMaps(sp.w, sp.h, sp.r, Math.min(o.bezel, Math.min(sp.w, sp.h) / 2), o.rim), box = `x="0" y="0" width="${sp.w}" height="${sp.h}" preserveAspectRatio="none"`;
  id = 'lg' + (++lg.n);
  lg.defs.insertAdjacentHTML('beforeend', `<filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feGaussianBlur in="SourceGraphic" stdDeviation="${o.blur}" edgeMode="duplicate" result="b"/>
    <feImage href="${dm}" ${box} result="m"/>
    <feDisplacementMap in="b" in2="m" scale="${o.scale}" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feColorMatrix in="d" type="saturate" values="1.3" result="c"/>
    <feImage href="${sm}" ${box} result="s"/>
    <feComposite in="s" in2="c" operator="over"/></filter>`);
  lg.made.set(sp.key, id);
  return id;
}
function lgApply(el) {
  const sp = lgSpec(el);
  if (!sp) { el.style.removeProperty('--lg'); el._lgKey = ''; return; }
  el.style.setProperty('--lg', `url(#${lgFilter(sp)})`); el._lgKey = sp.key;
}
function lgScan(root) {
  if (root.matches?.(LG_SEL)) { lg.ro.observe(root); lgApply(root); }
  root.querySelectorAll?.(LG_SEL).forEach(el => { lg.ro.observe(el); lgApply(el); });
  if (lg.made.size > 90) { // alte, nicht mehr benutzte Filter wegräumen
    const used = new Set([...document.querySelectorAll('[style*="--lg"]')].map(el => el.style.getPropertyValue('--lg').slice(5, -1)));
    for (const [key, id] of lg.made) if (!used.has(id)) { document.getElementById(id)?.remove(); lg.made.delete(key); }
  }
}
function lgSync() {
  const want = lg.ok && !lowPower && getTheme() === 'glass' && lsGet('lumen-lens') !== '0' && !matchMedia('(prefers-reduced-transparency: reduce), (prefers-contrast: more)').matches;
  if (want === lg.on) return;
  lg.on = want; document.documentElement.toggleAttribute('data-lg', want);
  if (!want) {
    lg.mo.disconnect(); lg.ro.disconnect();
    document.querySelectorAll('[style*="--lg"]').forEach(el => { el.style.removeProperty('--lg'); el._lgKey = ''; });
    return;
  }
  if (!lg.defs) {
    document.body.insertAdjacentHTML('beforeend', '<svg width="0" height="0" aria-hidden="true" style="position:absolute"><defs id="lgdefs"></defs></svg>');
    lg.defs = $('#lgdefs');
    lg.mo = new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) lgScan(n); });
    lg.ro = new ResizeObserver(es => es.forEach(({ target: el }) => {
      if (!el.isConnected) return lg.ro.unobserve(el);
      const sp = lgSpec(el), key = sp ? sp.key : '';
      if (key === el._lgKey) return;
      clearTimeout(lg.timers.get(el));
      if (!sp || lg.made.has(key)) return lgApply(el);
      // Die Größe ändert sich gerade (Animation): so lange nur weichzeichnen, erst in Ruhe neu berechnen
      el.style.removeProperty('--lg'); el._lgKey = '';
      lg.timers.set(el, setTimeout(() => { if (lg.on && el.isConnected) lgApply(el); }, 150));
    }));
  }
  lg.mo.observe(document.body, { childList: true, subtree: true });
  lgScan(document.body);
}
matchMedia('(prefers-reduced-transparency: reduce), (prefers-contrast: more)').addEventListener?.('change', lgSync);
/* ---------- Glas: Bewegung ---------- */
// 1) Gleitende Auswahl: In Tab-Leiste und Umschaltern wandert ein Glastropfen zum gewählten Feld, dehnt sich dabei und federt nach.
const GLIDE_SEL = 'nav.tabs, .seg';
const glass = { on: false, mo: null, ro: null };
function glidePlace(box, animate) {
  const g = box.querySelector(':scope > .glide'); if (!g) return;
  const on = box.querySelector(':scope > [aria-current="page"], :scope > [aria-checked="true"]');
  if (!on || !on.offsetWidth) { g.style.opacity = '0'; g._x = null; return; }
  const x = on.offsetLeft, w = on.offsetWidth, prev = g._x;
  g.style.cssText = `opacity:1;width:${w}px;height:${on.offsetHeight}px;top:${on.offsetTop}px;transform:translateX(${x}px)`;
  g._x = x;
  if (!animate || prev == null || prev === x || reduced()) return;
  const d = x - prev, k = Math.min(Math.abs(d) / w, 2.5);
  g.getAnimations().forEach(a => a.cancel());
  g.animate([
    { transform: `translateX(${prev}px)` },
    { transform: `translateX(${prev + d * .5}px) scaleX(${1 + k * .1})`, offset: .45 },
    { transform: `translateX(${x}px)` },
  ], { duration: 480, easing: 'cubic-bezier(.3, .8, .3, 1)' }); // nur seitlich dehnen, kein Zoomen
}
function glideScan(root) {
  const boxes = root.matches?.(GLIDE_SEL) ? [root] : [...(root.querySelectorAll?.(GLIDE_SEL) || [])];
  boxes.forEach(box => {
    if (!box.querySelector(':scope > .glide')) box.insertAdjacentHTML('afterbegin', '<span class="glide" aria-hidden="true"></span>');
    glass.ro.observe(box); glidePlace(box, false);
  });
}
// 2) Licht unter dem Finger: Beim Drücken leuchtet das Glas dort auf, wo man es berührt, und das Leuchten folgt dem Finger.
const GLOW_SEL = 'nav.tabs button, .fab, .iconbtn:not(.sm), .btn, .dchip, .addbtn, .note, .todo, .invrow, .pinnote, .hctile, .themetile, .fm-item, .row, .seg button, .more, .search, .addrow';
document.addEventListener('pointerdown', e => {
  if (!glass.on || reduced()) return;
  const el = e.target.closest?.(GLOW_SEL); if (!el) return;
  const at = ev => { const r = el.getBoundingClientRect(); el.style.setProperty('--mx', (ev.clientX - r.left).toFixed(0) + 'px'); el.style.setProperty('--my', (ev.clientY - r.top).toFixed(0) + 'px'); };
  at(e); el.classList.add('lit'); // das Leuchten wird nur während der Berührung gezeichnet
  el._glow?.cancel(); el._glow = el.animate({ '--glow': [0, 1] }, { duration: 160, easing: 'ease-out', fill: 'forwards' });
  const off = () => {
    removeEventListener('pointermove', at, true); removeEventListener('pointerup', off, true); removeEventListener('pointercancel', off, true);
    el._glow?.cancel();
    const a = el._glow = el.animate({ '--glow': [1, 0] }, { duration: 700, easing: 'ease-out', fill: 'forwards' });
    a.finished.then(() => { if (el._glow === a) { a.cancel(); el._glow = null; el.classList.remove('lit'); } }).catch(() => {});
  };
  addEventListener('pointermove', at, true); addEventListener('pointerup', off, true); addEventListener('pointercancel', off, true);
}, true);
// 3) Der Hintergrund wandert beim Scrollen etwas langsamer mit (Tiefe)
let wallRaf = 0;
addEventListener('scroll', () => {
  if (!glass.on || wallRaf || reduced()) return;
  wallRaf = requestAnimationFrame(() => { wallRaf = 0; const w = $('body > .wall'); if (w) w.style.transform = `translate3d(0, ${-Math.min(scrollY * .12, 140).toFixed(1)}px, 0)`; });
}, { passive: true });
function glassSync() {
  const want = getTheme() === 'glass';
  if (want === glass.on) return;
  glass.on = want;
  if (!glass.mo) {
    glass.ro = new ResizeObserver(es => es.forEach(({ target }) => glidePlace(target, false)));
    glass.mo = new MutationObserver(ms => {
      const boxes = new Set();
      for (const m of ms) {
        if (m.type === 'attributes') { const b = m.target.parentElement; if (b?.matches(GLIDE_SEL)) boxes.add(b); }
        else for (const n of m.addedNodes) if (n.nodeType === 1) glideScan(n);
      }
      boxes.forEach(b => glidePlace(b, true));
    });
  }
  if (want) {
    glass.mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-current', 'aria-checked'] });
    glideScan(document.body);
  } else {
    glass.mo.disconnect(); glass.ro.disconnect();
    document.querySelectorAll('.glide').forEach(g => g.remove());
    const w = $('body > .wall'); if (w) w.style.transform = '';
  }
}
applyTheme(getTheme(), getWall()); // beim Start: Farbe der Statusleiste an das gewählte Design angleichen
// Wechselt das Design; das neue Aussehen wächst als Kreis aus dem angetippten Knopf
function setTheme(theme, wall, origin, after) {
  lsSet('lumen-theme', theme); lsSet('lumen-wall', wall);
  if (data) { data.settings.theme = theme; data.settings.wall = wall; save(); }
  const go = () => { applyTheme(theme, wall); after?.(); };
  if (!document.startViewTransition || reduced()) return go();
  const r = origin?.getBoundingClientRect(), x = r ? r.left + r.width / 2 : innerWidth / 2, y = r ? r.top + r.height / 2 : innerHeight / 2;
  const rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const vt = document.startViewTransition(go);
  vt.ready.then(() => document.documentElement.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${rad}px at ${x}px ${y}px)`] },
    { duration: 750, easing: 'cubic-bezier(.3, .7, .2, 1)', pseudoElement: '::view-transition-new(root)' })).catch(() => {});
}

/* ---------- Dialoge ---------- */
function dialog({ title, body = '', fields = [], ok = 'OK', cancel = 'Abbrechen', danger = false }) {
  return new Promise(res => {
    const d = document.createElement('dialog');
    d.className = 'dlg';
    d.innerHTML = `<form method="dialog">
      <h2>${title}</h2>${body ? `<p>${body}</p>` : ''}
      ${fields.map(f => `<label class="field"><span>${f.label}</span>
        <input name="${f.name}" type="${f.type || 'password'}" inputmode="${f.inputmode || 'numeric'}" autocomplete="off" ${f.min ? `minlength="${f.min}"` : ''} ${f.value != null ? `value="${esc(f.value)}" maxlength="300"` : ''} required></label>`).join('')}
      <div class="dlg-btns">
        ${cancel ? `<button class="btn" value="cancel" formnovalidate>${cancel}</button>` : ''}
        <button class="btn ${danger ? 'danger' : 'primary'}" value="ok">${ok}</button>
      </div></form>`;
    document.body.append(d);
    let done = false;
    const finish = v => {
      if (done) return; done = true;
      d.classList.add('out');
      setTimeout(() => { d.close(); d.remove(); res(v); }, reduced() ? 0 : 200);
    };
    d.querySelector('form').addEventListener('submit', e => {
      e.preventDefault();
      finish(e.submitter?.value === 'ok' ? Object.fromEntries(new FormData(e.currentTarget)) : null);
    });
    d.addEventListener('cancel', e => { e.preventDefault(); finish(null); });
    d.showModal();
  });
}

/* ---------- Sheets (mit Android-Zurück-Taste) ---------- */
function openSheet(html, { label, cls = '', onClose, origin, originIcon } = {}) {
  const el = document.createElement('div');
  el.className = 'sheet ' + cls;
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', label || '');
  el.innerHTML = html;
  // Aus einem Knopf heraus aufgehen: Der Knopf wächst als Kreis zum ganzen Blatt, das Symbol dreht sich weg.
  const glass = getTheme() === 'glass';
  if (glass && !/\b(quick|spot)\b/.test(cls)) el.insertAdjacentHTML('afterbegin', '<div class="wall" aria-hidden="true"></div>'); // Glas: das Blatt bringt sein eigenes Hintergrundbild mit (die Glasflächen darin brechen dieses Bild)
  if (origin?.isConnected && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const r = origin.getBoundingClientRect(), ox = r.left + r.width / 2, oy = r.top + r.height / 2;
    const rad = Math.hypot(Math.max(ox, innerWidth - ox), Math.max(oy, innerHeight - oy)) + 12;
    el.classList.add('morph');
    el.style.cssText = `--ox:${ox.toFixed(1)}px;--oy:${oy.toFixed(1)}px;--r:${rad.toFixed(1)}px;--r0:${(Math.min(r.width, r.height) / 2).toFixed(1)}px`;
    const close = el.querySelector('.sheet-top [data-close]');
    if ((originIcon || 'gear') === 'gear' && close) {
      // Zahnrad: bleibt genau an seinem Platz oben rechts, dreht sich in einer Bewegung, während das Blatt aus ihm wächst, und schließt es wieder
      close.style.visibility = 'hidden';
      el.insertAdjacentHTML('beforeend', `<button type="button" class="mgear keep iconbtn" data-close aria-label="Einstellungen schließen" style="left:${r.left.toFixed(1)}px;top:${r.top.toFixed(1)}px;width:${r.width.toFixed(1)}px;height:${r.height.toFixed(1)}px">${ic('gear')}</button>`);
    } else el.insertAdjacentHTML('beforeend', `<span class="mgear" aria-hidden="true" style="left:${ox.toFixed(1)}px;top:${oy.toFixed(1)}px">${ic(originIcon || 'gear')}</span>`);
  }
  document.body.append(el);
  requestAnimationFrame(() => el.classList.add('in'));
  const prevFocus = document.activeElement;
  sheets.push({ el, onClose, prevFocus }); syncCover();
  history.pushState({ sheet: sheets.length }, '');
  el.addEventListener('click', e => { if (e.target.closest('[data-close]')) history.back(); });
  return el;
}
function popSheet() {
  const s = sheets.pop(); if (!s) return;
  s.onClose?.();
  s.el.classList.remove('in');
  setTimeout(() => s.el.remove(), s.el.classList.contains('morph') ? 600 : getTheme() === 'glass' ? 520 : 260);
  syncCover();
  if (Vault.unlocked) renderTab();
  s.prevFocus?.focus?.({ preventScroll: true });
  sheets[sheets.length - 1]?.el.dispatchEvent(new Event('revive')); // darunterliegende Liste neu zeichnen
}
// Zurück-Taste: schließt zuerst Blätter, Menü und Bearbeiten-Modus, geht dann zu Home – und beendet die App nie von selbst.
// Schnellaktion vom App-Symbol (?a=note …) oder Text, der aus einer anderen App geteilt wurde (?text=…): merken, nach dem Entsperren ausführen
let pending = null;
{ const q = new URLSearchParams(location.search);
  if (q.has('a') || q.has('text') || q.has('url') || q.has('title')) {
    pending = { a: q.get('a'), title: q.get('title') || '', text: q.get('text') || '', url: q.get('url') || '' };
    history.replaceState(null, '', location.pathname);
  } }
function runPending() {
  const p = pending; pending = null; if (!p || !data) return;
  if (p.a === 'note') return openNote();
  if (p.a === 'todo') return openQuickTodo();
  if (p.a === 'timer') return openTimerSheet();
  if (p.a === 'search') return openSpot();
  const body = [p.text, p.url && !p.text.includes(p.url) ? p.url : ''].filter(Boolean).join('\n').trim();
  if (!body && !p.title) return;
  const n = { id: uid(), title: p.title.slice(0, 120), body, color: 'blue', pinned: false, updated: Date.now() };
  data.notes.push(n); save();
  island({ icon: 'note', color: 'blue', title: 'Aus einer anderen App', text: 'Als Notiz gespeichert', ms: 3000 });
  setTimeout(() => openNote(n.id), 500);
}
if (!history.state?.guard) { history.replaceState({ root: 1 }, ''); history.pushState({ guard: 1 }, ''); }
addEventListener('popstate', () => {
  if (sheets.length) return popSheet();
  history.pushState({ guard: 1 }, ''); // wieder auf die Schutz-Ebene, damit die App offen bleibt
  if (menuOpen) setMenu(false);
  else if (noteMode) exitNoteEdit();
  else if (data && tab !== 'home') switchTab('home');
});
function closeAllSheets() { while (sheets.length) { const s = sheets.pop(); s.onClose?.(); s.el.remove(); } syncCover(); }
// Liegt ein ganzes Blatt über der App, wird sie (nach dem Einfahren) ausgeblendet – spart im Glas-Design viel Rechenarbeit
function syncCover() {
  let cover = false;
  for (let i = sheets.length - 1; i >= 0; i--) { sheets[i].el.classList.toggle('under', cover); if (!sheets[i].el.matches('.quick, .spot')) cover = true; }
  document.body.classList.toggle('covered', cover);
}

/* ---------- Start ---------- */
async function boot() {
  if ('serviceWorker' in navigator) {
    const had = !!navigator.serviceWorker.controller;
    // Neue Version erkannt: neu laden, sobald die App gesperrt ist (nie mitten im Schreiben)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!had) return;
      if (!Vault.unlocked) location.reload(); else updateReady = true;
    });
    navigator.serviceWorker.register('sw.js').then(r => r.update()).catch(() => {});
  }
  try { navigator.storage?.persist?.(); } catch {}
  if (!window.crypto?.subtle) {
    app.innerHTML = `<div class="lock"><div class="logo"></div><h1>Lumen</h1><p class="sub">Die App braucht eine sichere Verbindung (https). Öffne sie über deinen GitHub-Pages-Link.</p></div>`;
    return;
  }
  bioOk = await Vault.bioAvailable();
  if (!(await Vault.exists())) return renderSetup();
  if (!Vault.hasCode) {
    try { data = Object.assign(empty(), await Vault.autoOpen()); return renderMain(); } catch { /* fällt auf den Sperrbildschirm zurück */ }
  }
  renderLock();
}

function renderSetup() {
  app.innerHTML = `<main class="lock">
    <div class="logo" aria-hidden="true"></div>
    <h1>Lumen</h1>
    <p class="sub">Leg einen Code fest. Damit wird alles auf diesem Handy verschlüsselt.</p>
    <form class="lockform" id="f">
      <label class="field"><span>Code (mind. 6 Zeichen)</span><input id="c1" type="password" inputmode="numeric" autocomplete="new-password" minlength="6" required></label>
      <label class="field"><span>Code wiederholen</span><input id="c2" type="password" inputmode="numeric" autocomplete="new-password" required></label>
      <p class="warn">${ic('shield')}<span>Merk ihn dir gut: Ohne Code kommt niemand an deine Daten – auch du nicht. Je länger der Code, desto sicherer.</span></p>
      <p class="err" id="err" role="alert"></p>
      <button class="btn primary big" type="submit">Los geht's</button>
    </form>
    <label class="link">Backup importieren<input type="file" id="imp" accept=".json,application/json" hidden></label>
  </main>`;
  $('#f').addEventListener('submit', async e => {
    e.preventDefault();
    const a = $('#c1').value, b = $('#c2').value;
    if (a.length < 6) return ($('#err').textContent = 'Der Code braucht mindestens 6 Zeichen.');
    if (a !== b) return ($('#err').textContent = 'Die Codes stimmen nicht überein.');
    busy(e.submitter, 'Verschlüssele …');
    data = empty();
    await Vault.create(a, data);
    renderMain();
    toast('Fertig! Alles ist verschlüsselt.');
  });
  $('#imp').addEventListener('change', importFile);
}

function busy(btn, txt) { if (btn) { btn.disabled = true; btn.dataset.t = btn.textContent; btn.textContent = txt; } }
function unbusy(btn) { if (btn) { btn.disabled = false; btn.textContent = btn.dataset.t; } }

function renderLock(msg = '') {
  closeAllSheets();
  app.innerHTML = `<main class="lock">
    <div class="logo" aria-hidden="true"></div>
    <h1>Lumen</h1>
    <p class="sub">${msg || 'Gesperrt'}</p>
    <form class="lockform" id="f">
      <label class="field"><span>Code</span><input id="c" type="password" inputmode="numeric" autocomplete="current-password" required></label>
      <p class="err" id="err" role="alert"></p>
      <button class="btn primary big" type="submit">Entsperren</button>
    </form>
    ${Vault.hasBio ? `<button class="btn bio" id="bio">${ic('finger')}Mit Fingerabdruck</button>` : ''}
    <button class="link" id="forgot">Code vergessen?</button>
  </main>`;
  $('#c').focus({ preventScroll: true });
  $('#f').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.submitter, err = $('#err');
    const wait = Math.ceil((waitUntil - Date.now()) / 1000);
    if (wait > 0) return (err.textContent = `Zu viele Versuche. Warte ${wait} s.`);
    busy(btn, 'Entsperre …');
    try {
      data = Object.assign(empty(), await Vault.unlockCode($('#c').value));
      fails = 0; playUnlock(renderMain);
    } catch {
      fails++; if (fails >= 3) waitUntil = Date.now() + 2 ** (fails - 2) * 1000;
      unbusy(btn); err.textContent = 'Falscher Code.'; $('#c').select(); buzz([30, 40, 30]); shake($('#f'));
    }
  });
  $('#bio')?.addEventListener('click', async () => {
    try { data = Object.assign(empty(), await Vault.unlockBio()); playUnlock(renderMain); }
    catch (e) { $('#err').textContent = e.name === 'NotAllowedError' ? 'Abgebrochen.' : 'Fingerabdruck hat nicht geklappt. Nutze deinen Code.'; }
  });
  $('#forgot').addEventListener('click', async () => {
    const ok = await dialog({ title: 'Code vergessen?', body: 'Ohne Code lassen sich die Daten nicht entschlüsseln – das ist der Sinn der Verschlüsselung. Du kannst nur alles löschen und neu anfangen (oder ein Backup importieren).', ok: 'Alles löschen', danger: true });
    if (ok) { await Vault.wipe(); data = null; renderSetup(); }
  });
}

/* ---------- Schloss-Animation beim Entsperren ---------- */
// Kleines grünes Schloss fällt über dem Logo von oben herein, klickt auf – dann geht's rein (~0,7 s).
function playUnlock(done) {
  const ease = 'cubic-bezier(.2,.9,.25,1.15)';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !document.body.animate) return done();
  const logo = document.querySelector('.lock .logo');
  const y = Math.max(24, (logo ? logo.getBoundingClientRect().top : 140) - 100);
  const el = document.createElement('div');
  el.className = 'ulock'; el.setAttribute('aria-hidden', 'true'); el.style.setProperty('--y', y + 'px');
  el.innerHTML = `<svg viewBox="0 0 96 96"><path class="shackle" d="M32 44V34a16 16 0 0132 0v10"/><rect class="body" x="19" y="42" width="58" height="42" rx="13"/><circle class="kh" cx="48" cy="60" r="4.5"/><rect class="kh" x="46" y="62" width="4" height="10" rx="2"/></svg>`;
  document.body.append(el);
  const away = `translateY(${-(y + 130)}px)`;
  el.animate([{ transform: away + ' scale(.8)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 300, easing: ease, fill: 'both' });
  setTimeout(() => {
    el.classList.add('open'); buzz([10, 30, 12]);
    el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 240, easing: 'ease-out' });
  }, 270);
  setTimeout(() => document.querySelector('.lock')?.classList.add('leaving'), 520);
  setTimeout(done, 680);
  setTimeout(() => el.animate([{ transform: 'none', opacity: 1 }, { transform: away, opacity: 0 }], { duration: 320, easing: 'cubic-bezier(.5,0,.8,.4)', fill: 'forwards' }).finished.then(() => el.remove()), 620);
}

async function lockNow() {
  if (!Vault.hasCode) return;
  if (rec) stopRec(); await recDone; stopPlay(); // laufende oder gerade gestoppte Aufnahme wird vorher gesichert
  await flush();
  Vault.lock(); data = null;
  if (updateReady) return location.reload();
  renderLock(); toast('Gesperrt');
}

document.addEventListener('visibilitychange', async () => {
  if (!Vault.unlocked) return;
  if (document.hidden) {
    hiddenAt = Date.now(); await flush();
    if (!Vault.hasCode) return;
    if ((data?.settings.autolock ?? 60) === 0) lockNow();
  } else if (Vault.hasCode && Date.now() - hiddenAt > (data?.settings.autolock ?? 60) * 1000) {
    lockNow();
  }
});

/* ---------- Hauptansicht ---------- */
const TABS = [
  { id: 'home', label: 'Home', icon: 'home', color: 'white' },
  { id: 'notes', label: 'Notizen', icon: 'note', color: 'yellow' },
  { id: 'todos', label: 'To-dos', icon: 'check', color: 'orange' },
  { id: 'cards', label: 'Visual', icon: 'card', color: 'violet' },
];

function renderMain() {
  app.innerHTML = `
    <div class="glowwrap" id="glowwrap" aria-hidden="true"><div class="glow"></div><div class="glow g2"></div></div>
    <main class="screen" id="screen"></main>
    <nav class="tabs" aria-label="Bereiche">
      ${TABS.map(t => `<button data-tab="${t.id}" style="--a:var(--${t.color})">${ic(t.icon)}<span>${t.label}</span></button>`).join('')}
    </nav>
    <div class="scrim" id="scrim"></div>
    <div class="fabmenu" id="fabmenu" role="menu" aria-label="Hinzufügen" inert>
      <button class="fm-item" role="menuitem" data-add="card" style="--i:2;--a:var(--violet)"><span>Visualisierung</span><span class="fm-ic">${ic('card')}</span></button>
      <button class="fm-item" role="menuitem" data-add="todo" style="--i:1;--a:var(--orange)"><span>To-do</span><span class="fm-ic">${ic('check')}</span></button>
      <button class="fm-item" role="menuitem" data-add="note" style="--i:0;--a:var(--yellow)"><span>Notiz</span><span class="fm-ic">${ic('note')}</span></button>
    </div>
    <button class="fab" id="fab" aria-label="Hinzufügen">${ic('plus')}</button>`;
  // Design aus den (verschlüsselten) Einstellungen übernehmen, z. B. nach einem Backup-Import auf einem neuen Gerät
  if (!lsGet('lumen-theme') && data.settings.theme) { applyTheme(data.settings.theme, data.settings.wall); lsSet('lumen-theme', getTheme()); lsSet('lumen-wall', getWall()); }
  enter = true;
  renderTab();
  if (pending) setTimeout(runPending, 450);
  setTimeout(() => { checkTodoIsland(true); if (lowPower) battNote(getTheme() === 'glass' && lsGet('lumen-lens') !== '0'); }, 1500);
}

// Das Plus-Menü passt sich dem Bereich an: Home = Notiz/To-do/Visual, Visual = Art der Karte
function menuHtml(t) {
  const item = (add, label, icon, i, color) => `<button class="fm-item" role="menuitem" data-add="${add}" style="--i:${i};--a:var(--${color})"><span>${label}</span><span class="fm-ic">${ic(icon)}</span></button>`;
  return t === 'cards'
    ? item('card:mail', 'E-Mail', 'mail', 2, 'blue') + item('card:member', 'Kundenkarte', 'bag', 1, 'green') + item('card:bank', 'Bankkarte', 'card', 0, 'violet')
    : item('timer', 'Fokus-Timer', 'clock', 4, 'pink') + item('invoice', 'Rechnung', 'receipt', 3, 'green') + item('card', 'Visualisierung', 'card', 2, 'violet') + item('todo', 'To-do', 'check', 1, 'orange') + item('note', 'Notiz', 'note', 0, 'yellow');
}
function renderTab() {
  const screen = $('#screen'); if (!screen || !data) return;
  setMenu(false);
  resetNoteMode();
  const fm = $('#fabmenu'); if (fm) fm.innerHTML = menuHtml(tab);
  $('#glowwrap')?.classList.toggle('on', tab === 'home');
  screen.innerHTML = { home: viewHome, notes: viewNotes, todos: viewTodos, cards: viewCards }[tab]();
  document.querySelectorAll('[data-tab]').forEach(b => b.dataset.tab === tab ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
  const fab = $('#fab');
  const fabCfg = { home: ['white', 'Hinzufügen'], notes: ['yellow', 'Neue Notiz'], todos: ['orange', 'Neue Aufgabe'], cards: ['violet', 'Neue Karte'] }[tab];
  fab.hidden = !fabCfg;
  fab.dataset.on = tab;
  if (fabCfg) { fab.style.setProperty('--a', `var(--${fabCfg[0]})`); fab.setAttribute('aria-label', fabCfg[1]); }
  if (tab === 'home' || tab === 'cards') { fab.setAttribute('aria-haspopup', 'menu'); fab.setAttribute('aria-expanded', 'false'); }
  else { fab.removeAttribute('aria-haspopup'); fab.removeAttribute('aria-expanded'); }
  if (tab === 'notes') { bindNoteSearch(); bindNoteEdit(); }
  if (tab === 'todos') bindTodoForm();
}

function staggerScreen() {
  const s = $('#screen'); if (!s || reduced()) return;
  s.querySelectorAll('.note, .cardmini, .todo, .invrow, .search, .empty, .prog, .pinnote, .addrow, .hsec').forEach((el, i) => el.style.setProperty('--i', Math.min(i, 12)));
  s.classList.add('stag'); setTimeout(() => s.classList.remove('stag'), 1100);
}

// Weicher Tab-Wechsel: alter Inhalt blendet kurz aus, neuer gleitet ein, die Leiste reagiert sofort.
let swapId = 0;
function switchTab(next) {
  const screen = $('#screen');
  if (next === tab) { scrollTo({ top: 0, behavior: 'smooth' }); return; }
  const order = TABS.map(t => t.id), dir = Math.sign(order.indexOf(next) - order.indexOf(tab)) || 1, glassy = getTheme() === 'glass';
  tab = next; buzz(6);
  document.querySelectorAll('[data-tab]').forEach(b => b.dataset.tab === tab ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
  setMenu(false);
  const id = ++swapId;
  const show = () => {
    if (id !== swapId) return;
    screen.getAnimations?.().forEach(a => a.cancel()); // Ausblend-Animation (fill: forwards) lösen, sonst bleibt der Bildschirm bei Opazität 0 hängen
    enter = true; renderTab(); scrollTo(0, 0); if (tab !== 'home') staggerScreen();
    if (glassy) { if (tab === 'home') staggerScreen(); screen.animate([{ transform: `translateX(${dir * 34}px)` }, { transform: 'none' }], { duration: 560, easing: 'cubic-bezier(.2,.9,.25,1)' }); }
    else if (tab !== 'home' && screen.animate) screen.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 340, easing: 'cubic-bezier(.2,.8,.2,1)' });
  };
  if (!screen?.animate || matchMedia('(prefers-reduced-motion: reduce)').matches) return show();
  if (glassy) { // die alten Glasflächen schweben einzeln weg, der Bildschirm selbst bleibt sichtbar
    const els = [...screen.querySelectorAll('.note, .todo, .invrow, .pinnote, .cardmini, .prog, .search, .addrow, .dchip, .empty, .hsec, header.top, .hello, .hdate, .htime, .hweek, .more, .invsum, .sub')].slice(0, 30);
    els.forEach((el, i) => el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-dir * 26}px) scale(.97)` }], { duration: 150, delay: Math.min(i, 8) * 8, easing: 'ease-in', fill: 'forwards' }));
    return setTimeout(show, 170);
  }
  const exit = screen.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-6px)' }], { duration: 120, easing: 'ease-in', fill: 'forwards' });
  exit.finished.then(show).catch(show);
}

const header = title => `<header class="top"><h1 data-crumb="Lumen / ${title}">${title}</h1><div class="hbtns">
  <button class="iconbtn" data-act="settings" aria-label="Einstellungen">${ic('gear')}</button>
  ${Vault.hasCode ? `<button class="iconbtn" data-act="lock" aria-label="Jetzt sperren">${ic('lock')}</button>` : ''}</div></header>`;

const fmtDay = ts => new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short' }).format(ts);

const greetFor = h => h >= 5 && h < 11 ? 'Guten Morgen' : h >= 11 && h < 17 ? 'Guten Tag' : 'Guten Abend';
function isoWeek(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  return Math.ceil(((t - Date.UTC(t.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7);
}
function homeParts() {
  const d = new Date();
  return {
    hello: greetFor(d.getHours()),
    date: new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }).format(d),
    week: `Kalenderwoche ${isoWeek(d)} · ${d.getFullYear()}`,
    time: new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' }).format(d),
  };
}
function tickHome() {
  if (tab !== 'home' || !$('.home')) return;
  const p = homeParts(), cfg = homeCfg();
  [['#hHello', p.hello], ['#hDate', p.date], ['#hWeek', p.week]].forEach(([id, v]) => { const el = $(id); if (el && el.textContent !== v) el.textContent = v; });
  const t = $('#hTime'); if (t && t.dataset.t !== p.time) { t.dataset.t = p.time; t.innerHTML = timeHtml(cfg.clock, p.time); }
}
setInterval(tickHome, 1000);

/* ---------- Ember: Wochenübersicht mit leuchtender Kurve ---------- */
function weekStats() {
  const days = [], dc = data.settings.dc || {};
  for (let i = 13; i >= 0; i--) { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - i); days.push(isoOf(d)); }
  const by = (list, f) => days.map(iso => list.filter(x => f(x) && isoOf(new Date(f(x))) === iso).length);
  const doneT = by(data.todos, t => t.done && t.doneAt);
  const done = days.map((iso, i) => Math.max(dc[iso] || 0, doneT[i]));
  const made = by(data.todos, t => t.created), notes = by(data.notes, n => n.updated);
  return { days, done, made, notes };
}
function smoothPath(pts, floor = Infinity) { // Catmull-Rom als weiche Bezier-Kurve (floor: Kurve nie unter die Nulllinie)
  const f = v => Math.min(floor, v).toFixed(1);
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${f(p1[1] + (p2[1] - p0[1]) / 6)}, ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${f(p2[1] - (p3[1] - p1[1]) / 6)}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}
// Ember-Startseite wie ein Dashboard: KPI-Karten (rechts angeschnitten), Glocken-Diagramm mit Spiegelung, Navigation und Kategorien
function emberDash() {
  const st = weekStats(), cur = a => a.slice(7), prev = a => a.slice(0, 7), sum = a => a.reduce((x, y) => x + y, 0);
  const audioBy = st.days.map(iso => data.notes.reduce((n, x) => n + (x.audio || []).filter(m => isoOf(new Date(m.at)) === iso).length, 0));
  const invBy = st.days.map(iso => (data.invoices || []).filter(i => isoOf(new Date(i.created || Date.parse(i.date))) === iso).length);
  const cats = [['Erledigt', 'c1', st.done], ['Neue To-dos', 'c2', st.made], ['Notizen', 'c3', st.notes], ['Sprachnotizen', 'c4', audioBy], ['Rechnungen', 'c5', invBy]];
  const now = sum(cur(st.done)), before = sum(prev(st.done));
  const pct = before >= 3 ? Math.round((now - before) / before * 1000) / 10 : null; // bei sehr wenig Vorwoche lieber die Differenz zeigen
  const df = now - before, delta = pct == null ? `${df > 0 ? '+' : df < 0 ? '−' : '±'}${Math.abs(df)}` : `${pct > 0 ? '+' : ''}${String(pct).replace('.', ',')} %`, up = pct == null ? df > 0 : pct > 0, down = pct == null ? df < 0 : pct < 0;
  // KPI-Karten
  const mon = todayIso().slice(0, 7), lastMon = (() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return isoOf(d).slice(0, 7); })();
  const invs = data.invoices || [], cur0 = invs[0]?.currency || 'EUR';
  const monSum = m => invs.filter(i => (i.date || '').startsWith(m) && i.currency === cur0).reduce((x, i) => x + (+i.gross || 0), 0);
  const mNow = monSum(mon), mPrev = monSum(lastMon), mPct = mPrev ? Math.round((mNow - mPrev) / mPrev * 100) : null;
  const over = invs.filter(invOverdue).length + data.todos.filter(t => !t.done && t.due && dayDiff(t.due) < 0).length;
  const soon = invs.filter(i => i.status !== 'paid' && i.due && !invOverdue(i) && dayDiff(i.due) <= 7).length + data.todos.filter(t => !t.done && t.due && dayDiff(t.due) >= 0 && dayDiff(t.due) <= 2).length;
  const openT = data.todos.filter(t => !t.done).length, todayT = data.todos.filter(t => !t.done && t.due && dayDiff(t.due) === 0).length;
  const bank = data.cards.find(c => c.type === 'bank' && c.number), last4 = bank ? bank.number.replace(/\D/g, '').slice(-4) : '0000';
  const monName = new Intl.DateTimeFormat('de-DE', { month: 'long' }).format(new Date());
  // Glocken: pro Kategorie eine Kurve, Mitte = wann du aktiv warst, Höhe = wie viel
  const W = 600, B = 150, M = 76, maxT = Math.max(3, ...cats.flatMap(c => cur(c[2]))); // Skala = höchster Tageswert
  const bell = v => ({ d: smoothPath(v.map((y, k) => [Math.round(k / 6 * W), +(B - Math.min(y, maxT) / maxT * (B - 18)).toFixed(1)]), B) }); // weiche Linie durch die echten Tageswerte
  const curves = cats.map(([n, c, v]) => ({ n, c, t: sum(cur(v)), ...bell(cur(v)) })).sort((a, b) => b.t - a.t);
  const tick = k => Math.round(maxT * k / 3);
  const wd = new Intl.DateTimeFormat('de-DE', { weekday: 'short' }), lbl = st.days.slice(7).map(iso => wd.format(new Date(iso + 'T12:00:00')).replace('.', ''));
  const count = n => n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'k' : String(n);
  return [`<div class="em em-top">
    <button type="button" class="em-search" data-act="search">${ic('search')}<span>Suchen</span><span class="kbds" aria-hidden="true"><kbd>⌘</kbd><kbd>K</kbd></span></button>
    <div class="em-crumb">${ic('grid')}<span>Übersicht</span></div></div>`, `<div class="em">
    <div class="em-kpis" role="list">
      <button type="button" class="em-kpi wide" role="listitem" data-act="invlist"><p class="em-l">Rechnungen im ${esc(monName)}</p><p class="em-v">${esc(money(mNow, cur0))}</p>
        <p class="em-d">${mPct == null ? (n => `<span>${n}</span> ${n === 1 ? 'Beleg' : 'Belege'}`)(invs.filter(i => (i.date || '').startsWith(mon)).length) : `<span class="${mPct > 0 ? 'up' : mPct < 0 ? 'down' : ''}">${mPct > 0 ? '+' : ''}${mPct} %</span> ggü. Vormonat`}</p>
        <span class="cc-wrap" aria-hidden="true"><span class="cc back"></span><span class="cc"><i class="cc-chip"></i>${ic('wifi')}<em>•••• ${esc(last4)}</em></span></span></button>
      <button type="button" class="em-kpi" role="listitem" data-go="todos"><p class="em-l">Überfällig</p><p class="em-v">${String(over).padStart(2, '0')}</p><p class="em-d"><span class="${soon ? 'up' : ''}">${soon}</span> bald fällig</p></button>
      <button type="button" class="em-kpi" role="listitem" data-go="todos"><p class="em-l">Offene To-dos</p><p class="em-v">${String(openT).padStart(2, '0')}</p><p class="em-d"><span class="${todayT ? 'up' : ''}">${todayT}</span> heute</p></button>
    </div>
    <section class="em-chart" aria-label="Aktivität der letzten 7 Tage">
      <p class="em-l2">Aktivität</p><p class="em-big">${now} <small>erledigt</small></p>
      <p class="em-d"><span class="${up ? 'up' : down ? 'down' : ''}">${delta} ${up ? '↑' : down ? '↓' : ''}</span> ggü. Vorwoche</p>
      <div class="em-plot">
        <div class="em-y" aria-hidden="true">${[3, 2, 1, 0].map(k => `<span style="top:${(B - tick(k) / maxT * (B - 18)) / (B + M) * 100}%">${count(tick(k))}</span>`).join('')}${[1, 2, 3].map(k => `<span style="top:${(B + k / 3 * (M - 8)) / (B + M) * 100}%">${count(tick(k))}</span>`).join('')}</div>
        <svg viewBox="0 0 ${W} ${B + M}" preserveAspectRatio="none" aria-hidden="true">
          <defs><filter id="emglow" x="-10%" y="-60%" width="120%" height="220%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
          ${[3, 2, 1].map(k => `<line x1="0" x2="${W}" y1="${(B - tick(k) / maxT * (B - 18)).toFixed(1)}" y2="${(B - tick(k) / maxT * (B - 18)).toFixed(1)}" class="wk-grid"/>`).join('')}
          ${[1, 2, 3].map(k => `<line x1="0" x2="${W}" y1="${(B + k / 3 * (M - 8)).toFixed(1)}" y2="${(B + k / 3 * (M - 8)).toFixed(1)}" class="wk-grid"/>`).join('')}
          <g class="em-mirror" transform="translate(0 ${B}) scale(1 ${-(M - 8) / (B - 18)}) translate(0 ${-B})">${curves.map(c => `<path d="${c.d}"/>`).join('')}</g>
          ${curves.map((c, i) => `<path d="${c.d}" class="wk-line" pathLength="1" style="--c:var(--${c.c});--d:${i * 110}ms" stroke-width="2.4" filter="url(#emglow)"/>`).join('')}
        </svg>
        <div class="em-x" aria-hidden="true" style="top:${B / (B + M) * 100}%">${lbl.map((l, i) => `<span${i === 6 ? ' class="now"' : ''}>${esc(l)}</span>`).join('')}</div>
      </div>
    </section>
    <p class="em-sec">Kategorien · 7 Tage</p>
    <ul class="em-list em-cats">${cats.map(([n, c, v]) => `<li style="--c:var(--${c})"><span class="dot"></span><span>${n}</span><b>${count(sum(cur(v)))}</b></li>`).join('')}</ul>
  </div>`];
}
function viewHome() {
  const p = homeParts(), cls = enter ? ' enter' : '';
  enter = false;
  const open = data.todos.filter(t => !t.done).sort(todoSort);
  const shown = open.slice(0, 6);
  const todos = open.length ? `<section class="htodos" id="htodos" aria-label="Offene To-dos">
      <div class="hsec"><span>To-dos</span><b id="hcount">${open.length}</b></div>
      <ul class="todos">${shown.map(t => todoItem(t, true)).join('')}</ul>
      ${open.length > shown.length ? `<button class="more" data-go="todos">${open.length - shown.length} weitere anzeigen</button>` : ''}
    </section>` : '';
  freshIds.clear();
  const cfg = homeCfg(), em = getTheme() === 'ember' ? emberDash() : ['', ''];
  return `<div class="home${cls} al-${cfg.align} cs-${cfg.clockSize}">
    <div class="hometop"><span class="em-brand" aria-hidden="true"><i></i>Lumen</span><div class="hbtns">
      <button class="iconbtn" data-act="search" aria-label="Suchen">${ic('search')}</button>
      <button class="iconbtn" data-act="customize" aria-label="Startseite anpassen">${ic('sliders')}</button>
      <button class="iconbtn" data-act="settings" aria-label="Einstellungen">${ic('gear')}</button>
      ${Vault.hasCode ? `<button class="iconbtn" data-act="lock" aria-label="Jetzt sperren">${ic('lock')}</button>` : ''}</div></div>
    ${em[0]}
    ${homeBlock(cfg, p, true)}
    ${em[1]}
    ${todos}
    ${pinsHome(cfg)}
    ${getTheme() === 'ember' ? '' : invHome()}
  </div>`;
}

/* ---------- Startseite anpassen ---------- */
const HOME_DEF = { clock: 'thin', clockColor: 'white', clockSize: 'm', greet: 'heavy', greetColor: 'white', align: 'left', show: { greet: true, date: true, week: true, time: true, pins: true } };
const homeCfg = () => { const h = data.settings.home || {}; return { ...HOME_DEF, ...h, show: { ...HOME_DEF.show, ...(h.show || {}) } }; };
const CLOCK_STYLES = [['thin', 'Fein'], ['bold', 'Kräftig'], ['rounded', 'Rund'], ['mono', 'Digital'], ['serif', 'Klassisch'], ['outline', 'Kontur'], ['stack', 'Gestapelt']];
const GREET_STYLES = [['heavy', 'Kräftig'], ['thin', 'Fein'], ['rounded', 'Rund'], ['serif', 'Klassisch'], ['caps', 'Kapitälchen'], ['mono', 'Digital']];
const HOME_COLORS = { white: ['#ffffff', '#c9c9d1'], sunset: THEMES.sunset, ocean: THEMES.ocean, lime: THEMES.lime, violet: THEMES.violet, gold: THEMES.gold };
const HOME_COLOR_NAMES = { white: 'Weiß', sunset: 'Sonnenuntergang', ocean: 'Ozean', lime: 'Lime', violet: 'Violett', gold: 'Gold' };

function timeHtml(style, t) {
  if (style !== 'stack') return esc(t);
  const [h, m] = String(t).split(':');
  return `<span>${esc(h)}</span><span>${esc(m)}</span>`;
}
// Begrüßung, Datum, Uhrzeit und Kalenderwoche – so wie die Startseite sie zeigt (live = mit ids für die Uhr-Aktualisierung)
function homeBlock(cfg, p, live) {
  const id = n => live ? ` id="${n}"` : '';
  return `${cfg.show.greet ? `<h1 class="hello hg-${cfg.greet} tc-${cfg.greetColor}"${id('hHello')}>${p.hello}</h1>` : ''}
    ${cfg.show.date ? `<p class="hdate"${id('hDate')}>${p.date}</p>` : ''}
    ${cfg.show.time ? `<time class="htime hc-${cfg.clock} tc-${cfg.clockColor}"${id('hTime')} data-t="${p.time}">${timeHtml(cfg.clock, p.time)}</time>` : ''}
    ${cfg.show.week ? `<p class="hweek"${id('hWeek')}>${p.week}</p>` : ''}`;
}

function openCustomize(origin) {
  const colorBtns = (key, label) => `<div class="swatches big" role="radiogroup" aria-label="${label}">${Object.entries(HOME_COLORS).map(([k, [a, b]]) =>
    `<button type="button" role="radio" data-${key}="${k}" aria-label="${HOME_COLOR_NAMES[k]}" style="background:linear-gradient(135deg,${a},${b})"></button>`).join('')}</div>`;
  const row = (title, sub, k) => `<div class="row"><div><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</div>
    <button type="button" class="switch" role="switch" data-show="${k}" aria-label="${title}"></button></div>`;
  const el = openSheet(`
    <div class="sheet-top">
      <button class="iconbtn" data-close aria-label="Schließen">${ic('x')}</button><h2 class="grow center">Startseite anpassen</h2>
      <button class="btn primary sm" data-close>Fertig</button>
    </div>
    <div class="hcprev" id="hcprev" aria-hidden="true"></div>
    <h3 class="sec">Uhrzeit</h3>
    <div class="hcrow" role="radiogroup" aria-label="Design der Uhrzeit">${CLOCK_STYLES.map(([k, n]) =>
      `<button type="button" class="hctile" role="radio" data-clock="${k}"><span class="htime hc-${k} tc-white">10:42</span><small>${n}</small></button>`).join('')}</div>
    ${colorBtns('clockcolor', 'Farbe der Uhrzeit')}
    <div class="seg" role="radiogroup" aria-label="Größe der Uhrzeit">
      <button type="button" role="radio" data-size="s">Klein</button><button type="button" role="radio" data-size="m">Mittel</button><button type="button" role="radio" data-size="l">Groß</button>
    </div>
    <h3 class="sec">Begrüßung</h3>
    <div class="hcrow" role="radiogroup" aria-label="Design der Begrüßung">${GREET_STYLES.map(([k, n]) =>
      `<button type="button" class="hctile" role="radio" data-greet="${k}"><span class="hello hg-${k} tc-white">Guten Tag</span><small>${n}</small></button>`).join('')}</div>
    ${colorBtns('greetcolor', 'Farbe der Begrüßung')}
    <h3 class="sec">Anzeigen</h3>
    <div class="group">${row('Begrüßung', 'z. B. „Guten Abend“', 'greet')}${row('Datum', 'Wochentag und Tag', 'date')}${row('Uhrzeit', '', 'time')}${row('Kalenderwoche', '', 'week')}${row('Angeheftete Notizen', 'Schnell zur Hand auf der Startseite', 'pins')}</div>
    <h3 class="sec">Ausrichtung</h3>
    <div class="seg" role="radiogroup" aria-label="Ausrichtung">
      <button type="button" role="radio" data-align="left">Links</button><button type="button" role="radio" data-align="center">Mitte</button>
    </div>`, { label: 'Startseite anpassen', cls: 'customize', origin, originIcon: 'sliders' });

  const paint = () => {
    const cfg = homeCfg();
    $('#hcprev', el).innerHTML = `<div class="home al-${cfg.align} cs-${cfg.clockSize}">${homeBlock(cfg, homeParts(), false)}</div>`; fadeIn($('#hcprev', el).firstElementChild);
    const mark = (attr, val) => el.querySelectorAll(`[data-${attr}]`).forEach(b => b.setAttribute('aria-checked', b.dataset[attr] === val));
    mark('clock', cfg.clock); mark('greet', cfg.greet); mark('clockcolor', cfg.clockColor); mark('greetcolor', cfg.greetColor); mark('size', cfg.clockSize); mark('align', cfg.align);
    el.querySelectorAll('[data-show]').forEach(b => b.setAttribute('aria-checked', cfg.show[b.dataset.show]));
  };
  const set = (patch) => {
    const cfg = homeCfg();
    data.settings.home = { ...cfg, ...patch, show: { ...cfg.show, ...(patch.show || {}) } };
    save(); buzz(6); paint();
  };
  el.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const d = b.dataset;
    if (d.clock) set({ clock: d.clock });
    else if (d.greet) set({ greet: d.greet });
    else if (d.clockcolor) set({ clockColor: d.clockcolor });
    else if (d.greetcolor) set({ greetColor: d.greetcolor });
    else if (d.size) set({ clockSize: d.size });
    else if (d.align) set({ align: d.align });
    else if (d.show) set({ show: { [d.show]: !homeCfg().show[d.show] } });
  });
  paint();
}

/* ---------- Notizen ---------- */
const noteTitle = n => n.title || firstLine(n.body) || (n.audio?.length ? 'Sprachnotiz' : 'Ohne Titel');
const firstLine = s => (s || '').split('\n').find(l => l.trim()) || '';
let noteQ = '';

// Angeheftete Notizen als kleine Kärtchen auf der Startseite
function pinsHome(cfg) {
  if (!cfg.show.pins) return '';
  const list = data.notes.filter(n => n.pinned).sort(noteSort).slice(0, 8);
  if (!list.length) return '';
  return `<section class="hpins" aria-label="Angeheftete Notizen">
    <div class="hsec"><span>Angeheftet</span></div>
    <div class="pinrow">${list.map((n, i) => `<button class="pinnote" data-note="${n.id}" style="--a:var(--${n.color});--i:${i}">
      <span class="dot"></span><b>${esc(noteTitle(n))}</b>
      <p>${esc((n.title ? n.body : n.body.split('\n').slice(1).join('\n')).slice(0, 90))}</p></button>`).join('')}</div>
  </section>`;
}
function viewNotes() {
  return `${header('Notizen')}
    <label class="search">${ic('search')}<input id="q" type="search" placeholder="Durchsuchen" aria-label="Notizen durchsuchen" value="${esc(noteQ)}"><span class="count" aria-hidden="true">${data.notes.length}</span></label>
    <div id="notegrid">${noteGrid()}</div>`;
}
function noteGrid() {
  const q = noteQ.trim().toLowerCase();
  const list = displayedNotes();
  if (!data.notes.length) return emptyState('note', 'Noch keine Notizen', 'Tippe auf + für deine erste Notiz.');
  if (!list.length) return emptyState('search', 'Nichts gefunden', `Keine Notiz enthält „${esc(noteQ)}“.`);
  return `<div class="notes">${list.map(n => `
    <button class="note" data-note="${n.id}" style="--a:var(--${n.color})">
      <span class="ntop"><span class="dot"></span><span class="nright">${n.audio?.length ? `<span class="nmic" aria-label="${n.audio.length} Sprachnotiz${n.audio.length > 1 ? 'en' : ''}">${ic('mic')}${n.audio.length > 1 ? n.audio.length : ''}</span>` : ''}${n.pinned ? `<span class="pinned">${ic('pin')}</span>` : ''}</span></span>
      <b>${esc(noteTitle(n))}</b>
      <p>${esc((n.title ? n.body : n.body.split('\n').slice(1).join('\n')).slice(0, 220))}</p>
      <small>${fmtDay(n.updated)}</small>
    </button>`).join('')}</div>`;
}
function bindNoteSearch() {
  $('#q').addEventListener('input', e => { noteQ = e.target.value; paintNotes(true); });
}
const emptyState = (icon, title, text) => `<div class="empty">${ic(icon)}<b>${title}</b><p>${text}</p></div>`;

/* ---------- Notizen bearbeiten: gedrückt halten, wackeln, verschieben, anheften, löschen ---------- */
const noteSort = (a, b) => (b.pinned - a.pinned) || ((a.pos ?? -a.updated) - (b.pos ?? -b.updated));
function displayedNotes() {
  const q = noteQ.trim().toLowerCase();
  return data.notes.filter(n => !q || (n.title + ' ' + n.body).toLowerCase().includes(q)).sort(noteSort);
}
let noteMode = null; // { sel: id | null } solange der Bearbeiten-Modus aktiv ist
const noteEls = () => [...document.querySelectorAll('#notegrid .note')];
const noteById = id => data.notes.find(n => n.id === id);

function paintNotes(fade) { const g = $('#notegrid'); g.innerHTML = noteGrid(); decorateNotes(); if (fade) fadeIn(g); }
function decorateNotes() {
  const wrap = $('#notegrid .notes');
  if (wrap) {
    wrap.classList.toggle('editing', !!noteMode);
    noteEls().forEach(el => {
      el.style.setProperty('--wd', (-Math.random() * .3).toFixed(2) + 's');
      el.classList.toggle('sel', !!noteMode && el.dataset.note === noteMode.sel);
    });
  }
  const bar = $('#nbar');
  if (bar && noteMode) {
    const n = noteMode.sel && noteById(noteMode.sel);
    bar.querySelectorAll('[data-nact="pin"], [data-nact="del"]').forEach(b => { b.disabled = !n; });
    bar.querySelector('[data-nact="pin"] span').textContent = n?.pinned ? 'Lösen' : 'Anheften';
  }
}
function selectNote(id) { if (!noteMode) return; if (noteMode.sel !== id) buzz(6); noteMode.sel = id; decorateNotes(); }

function enterNoteEdit(id) {
  if (!noteMode) {
    noteMode = { sel: null };
    document.body.classList.add('noteedit');
    document.body.insertAdjacentHTML('beforeend', `<div class="nbar" id="nbar" role="toolbar" aria-label="Notiz bearbeiten">
      <button class="nb-btn" data-nact="pin">${ic('pin')}<span>Anheften</span></button>
      <button class="nb-btn danger" data-nact="del">${ic('trash')}<span>Löschen</span></button>
      <button class="nb-done" data-nact="done">Fertig</button></div>`);
    const bar = $('#nbar'); void bar.offsetWidth; bar.classList.add('in');
    bar.addEventListener('click', e => { const b = e.target.closest('[data-nact]'); if (b && !b.disabled) noteAction(b.dataset.nact); });
    buzz(14);
  }
  selectNote(id); decorateNotes();
}
function exitNoteEdit() {
  if (!noteMode) return;
  noteMode = null; document.body.classList.remove('noteedit');
  const bar = $('#nbar'); if (bar) { bar.removeAttribute('id'); bar.classList.remove('in'); setTimeout(() => bar.remove(), 450); }
  decorateNotes();
}
function resetNoteMode() { // z. B. beim Tab-Wechsel
  if (!noteMode) return;
  noteMode = null; document.body.classList.remove('noteedit'); $('#nbar')?.remove();
}

// Verschiebt die Karten sanft an ihren neuen Platz (FLIP), nachdem sich Daten oder Reihenfolge geändert haben
function flipNotes(mutate) {
  const first = new Map(noteEls().map(el => [el.dataset.note, el.getBoundingClientRect()]));
  mutate(); paintNotes();
  const els = noteEls();
  els.forEach(el => {
    const f = first.get(el.dataset.note); if (!f) return;
    const l = el.getBoundingClientRect(), dx = f.left - l.left, dy = f.top - l.top;
    if (dx || dy) { el.style.transition = 'none'; el.style.translate = `${dx}px ${dy}px`; el.dataset.fl = '1'; }
  });
  void document.body.offsetWidth;
  els.forEach(el => { if (el.dataset.fl) { el.style.transition = ''; el.classList.add('shift'); el.style.translate = '0px 0px'; } });
  setTimeout(() => els.forEach(el => { el.classList.remove('shift'); el.style.translate = ''; delete el.dataset.fl; }), 450);
}

function restoreNote(n) {
  if (!data || data.notes.some(x => x.id === n.id)) return;
  const put = () => { data.notes.push(n); save(); };
  if (tab === 'notes' && !sheets.length && $('#notegrid .notes')) flipNotes(put); else { put(); if (!sheets.length) renderTab(); }
  toast('Notiz wiederhergestellt');
}
async function noteAction(act) {
  if (act === 'done') return exitNoteEdit();
  const n = noteMode?.sel && noteById(noteMode.sel); if (!n) return;
  if (act === 'pin') {
    buzz(10);
    flipNotes(() => { n.pinned = !n.pinned; save(); });
    toast(n.pinned ? 'Notiz angeheftet' : 'Notiz gelöst');
  } else if (act === 'del') {
    if (!(await dialog({ title: 'Notiz löschen?', body: 'Das kann nicht rückgängig gemacht werden.', ok: 'Löschen', danger: true }))) return;
    const el = noteEls().find(x => x.dataset.note === n.id); el?.classList.add('vanish');
    buzz(12);
    setTimeout(() => flipNotes(() => { data.notes = data.notes.filter(x => x.id !== n.id); if (noteMode) noteMode.sel = null; save(); }), 240);
    toast('Notiz gelöscht', { undo: () => restoreNote(n) });
  }
}

function bindNoteEdit() {
  const grid = $('#notegrid'); if (!grid) return;
  let g = null;
  const cleanup = () => { removeEventListener('pointermove', onMove); removeEventListener('pointerup', onUp); removeEventListener('pointercancel', onUp); };
  const page = el => { const r = el.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; };

  function startDrag(e) {
    const els = noteEls(), ids = els.map(x => x.dataset.note), from = els.indexOf(g.el);
    const grp = !!noteById(ids[from]).pinned;
    g.d = { els, ids, from, cur: from, slots: els.map(page), fx0: e.clientX + scrollX, fy0: e.clientY + scrollY,
      allowed: ids.map((id, i) => i).filter(i => !!noteById(ids[i]).pinned === grp), order: ids };
    g.el.classList.add('drag'); els.forEach(x => x.classList.add('shift'));
    g.el.classList.remove('shift'); g.el.style.transition = 'none';
    g.loop = setInterval(() => {
      if (g.fy < 120) scrollBy(0, -10); else if (g.fy > innerHeight - 170) scrollBy(0, 10); else return;
      placeDrag();
    }, 16);
    buzz(8);
  }
  function placeDrag() {
    const d = g.d, dx = g.fx + scrollX - d.fx0, dy = g.fy + scrollY - d.fy0, home = d.slots[d.from];
    g.el.style.translate = `${dx}px ${dy}px`;
    const cx = home.x + home.w / 2 + dx, cy = home.y + home.h / 2 + dy;
    let best = d.cur, bd = Infinity;
    d.allowed.forEach(i => { const s = d.slots[i], dist = Math.hypot(cx - (s.x + s.w / 2), cy - (s.y + s.h / 2)); if (dist < bd) { bd = dist; best = i; } });
    if (best === d.cur) return;
    d.cur = best; buzz(4);
    const order = d.ids.filter((_, i) => i !== d.from); order.splice(best, 0, d.ids[d.from]); d.order = order;
    order.forEach((id, k) => {
      const i = d.ids.indexOf(id); if (i === d.from) return;
      d.els[i].style.translate = `${d.slots[k].x - d.slots[i].x}px ${d.slots[k].y - d.slots[i].y}px`;
    });
  }
  function drop() {
    const d = g.d, el = g.el, home = d.slots[d.from], slot = d.slots[d.cur], order = d.order;
    clearInterval(g.loop);
    el.classList.remove('drag'); el.classList.add('settle'); el.style.transition = '';
    el.style.translate = `${slot.x - home.x}px ${slot.y - home.y}px`;
    buzz(8);
    setTimeout(() => { order.forEach((id, i) => { const n = noteById(id); if (n) n.pos = i; }); save(); paintNotes(); }, 320);
  }

  function onMove(e) {
    if (!g || e.pointerId !== g.pid) return;
    g.fx = e.clientX; g.fy = e.clientY;
    const moved = Math.hypot(e.clientX - g.x0, e.clientY - g.y0);
    if (!g.d) {
      if (!g.armed) { if (moved > 9) { clearTimeout(g.timer); cleanup(); g = null; } return; } // vor dem Halten bewegt = ganz normales Scrollen
      if (moved > 7 && !noteQ.trim()) startDrag(e); else return;
    }
    placeDrag();
  }
  function onUp(e) {
    if (!g || e.pointerId !== g.pid) return;
    clearTimeout(g.timer); cleanup();
    if (g.d) drop();
    g = null;
  }
  grid.addEventListener('pointerdown', e => {
    const el = e.target.closest('.note');
    if (!el || g || (e.pointerType === 'mouse' && e.button !== 0)) return;
    g = { pid: e.pointerId, el, x0: e.clientX, y0: e.clientY, fx: e.clientX, fy: e.clientY, armed: false, d: null, timer: 0 };
    addEventListener('pointermove', onMove); addEventListener('pointerup', onUp); addEventListener('pointercancel', onUp);
    if (noteMode) { g.armed = true; selectNote(el.dataset.note); }
    else { const mine = g; g.timer = setTimeout(() => { if (g === mine) { mine.armed = true; enterNoteEdit(el.dataset.note); } }, 420); }
  });
  // Solange gedrückt-gehalten wird, soll die Seite nicht scrollen
  grid.addEventListener('touchmove', e => { if (g && (g.armed || g.d)) e.preventDefault(); }, { passive: false });
  grid.addEventListener('contextmenu', e => { const el = e.target.closest('.note'); if (el) { e.preventDefault(); enterNoteEdit(el.dataset.note); } });
  // Im Bearbeiten-Modus öffnet Antippen keine Notiz, sondern wählt sie aus
  grid.addEventListener('click', e => { if (noteMode && e.target.closest('.note')) { e.preventDefault(); e.stopPropagation(); } }, true);
  $('#screen').addEventListener('click', e => { if (noteMode && !e.target.closest('.note, .nbar')) exitNoteEdit(); });
}
addEventListener('keydown', e => { if (e.key === 'Escape' && noteMode) exitNoteEdit(); });

function openNote(id) {
  let n = data.notes.find(x => x.id === id);
  const isNew = !n;
  if (!n) n = { id: uid(), title: '', body: '', color: COLORS[data.notes.length % COLORS.length], pinned: false, updated: Date.now() };
  const el = openSheet(`
    <div class="sheet-top">
      <button class="iconbtn" data-close aria-label="Zurück">${ic('back')}</button><span class="grow"></span>
      ${canRec ? `<button class="iconbtn" id="nrec" aria-label="Sprachnotiz aufnehmen">${ic('mic')}</button>` : ''}
      <button class="iconbtn" id="pin" aria-pressed="${n.pinned}" aria-label="Anheften">${ic('pin')}</button>
      <button class="iconbtn" id="del" aria-label="Notiz löschen">${ic('trash')}</button>
      <button class="btn primary sm" id="nsave">Sichern</button>
    </div>
    <input class="ntitle" id="nt" placeholder="Titel" aria-label="Titel" value="${esc(n.title)}">
    <div class="swatches" role="radiogroup" aria-label="Farbe">
      ${COLORS.map(c => `<button role="radio" aria-checked="${c === n.color}" aria-label="${c}" data-color="${c}" style="--a:var(--${c})"></button>`).join('')}
    </div>
    <div class="memos" id="memos"></div>
    <textarea class="nbody" id="nb" placeholder="Schreib los …" aria-label="Notiztext">${esc(n.body)}</textarea>
    <p class="saved">${ic('lock')}Automatisch gespeichert · verschlüsselt</p>`,
  { label: 'Notiz', cls: 'editor', onClose: () => {
      if (rec?.n === n) stopRec(); // Aufnahme läuft noch: wird gesichert, auch wenn die Notiz sonst leer ist
      else if (!n.title.trim() && !n.body.trim() && !n.audio?.length) data.notes = data.notes.filter(x => x.id !== n.id);
      save();
    } });
  el.style.setProperty('--a', `var(--${n.color})`);
  const touch = () => {
    n.updated = Date.now();
    if (!data.notes.includes(n)) data.notes.push(n);
    save();
  };
  $('#nt', el).addEventListener('input', e => { n.title = e.target.value; touch(); });
  $('#nb', el).addEventListener('input', e => { n.body = e.target.value; touch(); });
  el.querySelectorAll('[data-color]').forEach(b => b.addEventListener('click', () => {
    n.color = b.dataset.color; el.style.setProperty('--a', `var(--${n.color})`);
    el.querySelectorAll('[data-color]').forEach(x => x.setAttribute('aria-checked', x === b)); if (n.title || n.body) touch();
  }));
  $('#pin', el).addEventListener('click', e => { n.pinned = !n.pinned; e.currentTarget.setAttribute('aria-pressed', n.pinned); if (n.title || n.body) touch(); });
  $('#del', el).addEventListener('click', async () => {
    if (!isNew || data.notes.includes(n)) {
      if (!(await dialog({ title: 'Notiz löschen?', body: 'Das kann nicht rückgängig gemacht werden.', ok: 'Löschen', danger: true }))) return;
    }
    const copy = { ...n }, had = data.notes.includes(n);
    data.notes = data.notes.filter(x => x.id !== n.id); n.title = n.body = '';
    history.back(); toast('Notiz gelöscht', had ? { undo: () => restoreNote(copy) } : {});
  });
  $('#nsave', el).addEventListener('click', () => {
    const filled = n.title.trim() || n.body.trim() || n.audio?.length || rec?.n === n;
    if (filled) touch();
    buzz(12); history.back();
    toast(filled ? 'Notiz gespeichert' : 'Leere Notiz verworfen');
  });
  bindMemos(el, n);
  if (isNew) setTimeout(() => $('#nb', el).focus(), 280);
}

/* ---------- To-dos ---------- */
// Datum für To-dos
const todoSort = (a, b) => (a.due || '9999').localeCompare(b.due || '9999') || (a.time || '99:99').localeCompare(b.time || '99:99') || b.created - a.created;
const dayDiff = iso => Math.round((new Date(iso + 'T00:00:00') - new Date(todayIso() + 'T00:00:00')) / 864e5);
const dueCls = t => t.done ? '' : dayDiff(t.due) < 0 ? 'late' : dayDiff(t.due) === 0 ? 'today' : '';
function fmtDue(iso, time) {
  const d = dayDiff(iso);
  const base = d === 0 ? 'Heute' : d === 1 ? 'Morgen' : d === -1 ? 'Gestern' : new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(iso + 'T00:00:00'));
  return time ? base + ' · ' + time : base;
}
const dateIsoOffset = n => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };
// Auswahl-Chips: Heute / Morgen / Datum, dann Uhrzeit (optional)
function dateChips(box, draft, redraw) {
  const open = i => { try { i.showPicker(); } catch { i.focus(); i.click(); } };
  const hid = `<input type="date" class="vhid" id="pd" tabindex="-1" aria-hidden="true" value="${draft.due}"><input type="time" class="vhid" id="pt" tabindex="-1" aria-hidden="true" value="${draft.time}">`;
  box.innerHTML = (draft.due
    ? `<button type="button" class="dchip on" data-d="pick">${ic('cal')}${esc(fmtDue(draft.due))}</button><button type="button" class="dchip${draft.time ? ' on' : ''}" data-d="time">${ic('clock')}${draft.time || 'Uhrzeit'}</button><button type="button" class="dchip x" data-d="clear" aria-label="Datum entfernen">${ic('x')}</button>`
    : `<button type="button" class="dchip" data-d="today">${ic('cal')}Heute</button><button type="button" class="dchip" data-d="tmr">Morgen</button><button type="button" class="dchip" data-d="pick">Datum …</button>`) + hid;
  const di = box.querySelector('#pd'), ti = box.querySelector('#pt');
  box.querySelectorAll('[data-d]').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.d;
    if (k === 'pick') return open(di);
    if (k === 'time') return open(ti);
    if (k === 'today') draft.due = todayIso(); else if (k === 'tmr') draft.due = dateIsoOffset(1); else { draft.due = ''; draft.time = ''; }
    buzz(6); redraw();
  }));
  di.addEventListener('change', () => { draft.due = di.value; if (!di.value) draft.time = ''; redraw(); });
  ti.addEventListener('change', () => { draft.time = ti.value; redraw(); });
  fadeIn(box);
}
// Datum eines bestehenden To-dos ändern (Antippen der Datumszeile)
function pickTodoDate(id) {
  const t = data.todos.find(x => x.id === id); if (!t) return;
  document.querySelectorAll('body > input.vhid').forEach(x => x.remove());
  const i = document.createElement('input'); i.type = 'date'; i.className = 'vhid'; i.value = t.due || ''; document.body.append(i);
  i.addEventListener('change', () => { t.due = i.value; if (!t.due) t.time = ''; save(); i.remove(); renderTab(); });
  try { i.showPicker(); } catch { i.focus(); i.click(); }
}

function todoItem(t, bare) {
  return `<li class="todo ${t.done ? 'done' : ''} ${freshIds.has(t.id) ? 'pop' : ''}">
    <button class="chk" role="checkbox" aria-checked="${t.done}" data-toggle="${t.id}" aria-label="${esc(t.text)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4L18 8"/></svg></button>
    <span class="tx"><span class="tt">${esc(t.text)}</span>${t.due ? `<button class="tdue ${dueCls(t)}" data-tdue="${t.id}" aria-label="Datum ändern">${ic('cal')}${esc(fmtDue(t.due, t.time))}</button>` : ''}</span>
    ${bare ? '' : `<button class="iconbtn sm" data-deltodo="${t.id}" aria-label="Aufgabe löschen">${ic('x')}</button>`}</li>`;
}
// Serie: an wie vielen Tagen in Folge mindestens ein To-do erledigt wurde (heute zählt mit, sobald eines abgehakt ist)
const isoOf = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
function streak() {
  const days = new Set(data?.settings.days || []); let n = 0;
  const d = new Date(); if (!days.has(isoOf(d))) d.setDate(d.getDate() - 1);
  while (days.has(isoOf(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
// Wie viele To-dos an welchem Tag erledigt wurden (bleibt auch, wenn erledigte gelöscht werden)
function countDone(t, done) {
  const dc = data.settings.dc ||= {}, today = todayIso();
  if (done && !t.done) dc[today] = (dc[today] || 0) + 1;
  else if (!done && t.done && t.doneAt && isoOf(new Date(t.doneAt)) === today) dc[today] = Math.max(0, (dc[today] || 0) - 1);
  const keys = Object.keys(dc); if (keys.length > 60) keys.sort().slice(0, keys.length - 60).forEach(k => delete dc[k]);
}
function markDay() {
  const st = data.settings, today = todayIso(); st.days ||= [];
  if (st.days.includes(today)) return;
  st.days = [...st.days, today].slice(-120);
  const n = streak();
  if (n > 1) setTimeout(() => island({ icon: 'flame', color: 'orange', title: `Serie · ${n} Tage`, text: `${n} Tage in Folge etwas erledigt`, ms: 3400 }), 700);
}
// Tagesfortschritt: heute Erledigtes im Verhältnis zu allem, was noch offen ist
let lastProg = 0;
function progHtml(open) {
  const day = new Date().toDateString();
  const doneToday = data.todos.filter(t => t.done && t.doneAt && new Date(t.doneAt).toDateString() === day).length;
  const total = doneToday + open;
  if (!total) { lastProg = 0; return ''; }
  const pct = Math.round(doneToday / total * 100), all = pct === 100;
  return `<div class="prog${all ? ' all' : ''}" id="prog" data-p="${pct}" style="--p:${lastProg}" role="img" aria-label="Heute ${doneToday} von ${total} To-dos erledigt">
    <svg class="pring" viewBox="0 0 44 44" aria-hidden="true"><circle class="bg" cx="22" cy="22" r="18"/><circle class="fg" cx="22" cy="22" r="18" pathLength="100"/></svg>
    <div class="ptx"><b>${all ? 'Alles geschafft' : `${doneToday} von ${total} erledigt`}${streak() > 1 ? `<span class="streak" title="Tage in Folge mit erledigten To-dos">${ic('flame')}${streak()}</span>` : ''}</b><small>${all ? 'Für heute bist du fertig.' : doneToday ? 'Weiter so, heute läuft es.' : 'Dein Fortschritt für heute'}</small></div>
    <span class="ppct" id="ppct">${reduced() ? pct : Math.round(lastProg)} %</span>
  </div>`;
}
function animateProg() {
  const el = $('#prog'); if (!el) return;
  const from = lastProg, to = +el.dataset.p, num = $('#ppct'); lastProg = to;
  if (reduced() || from === to) { el.style.setProperty('--p', to); num.textContent = to + ' %'; return; }
  requestAnimationFrame(() => requestAnimationFrame(() => el.style.setProperty('--p', to)));
  const t0 = performance.now(), step = now => {
    if (!num.isConnected) return;
    const k = Math.min(1, (now - t0) / 800), e = 1 - Math.pow(1 - k, 3);
    num.textContent = Math.round(from + (to - from) * e) + ' %';
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function viewTodos() {
  const open = data.todos.filter(t => !t.done).sort(todoSort);
  const done = data.todos.filter(t => t.done).sort((a, b) => b.doneAt - a.doneAt);
  return `${header('To-dos')}
    <form class="addrow" id="addTodo">
      <input id="tt" placeholder="Neue Aufgabe …" aria-label="Neue Aufgabe" autocomplete="off" enterkeyhint="done" maxlength="300">
      <button class="addbtn" aria-label="Hinzufügen">${ic('plus')}</button>
    </form>
    <div class="dchips" id="dchips"></div>
    ${progHtml(open.length)}
    ${open.length ? `<div class="hsec"><span>Offen</span><b>${open.length}</b></div>
    <ul class="todos">${open.map(t => todoItem(t)).join('')}</ul>` : ''}
    ${done.length ? `<div class="hsec"><span>Erledigt</span><b class="g">${done.length}</b><button class="textbtn" data-act="cleardone">Löschen</button></div>
    <ul class="todos">${done.map(t => todoItem(t)).join('')}</ul>` : ''}
    ${data.todos.length ? '' : emptyState('check', 'Alles erledigt', 'Schreib oben deine erste Aufgabe rein.')}`;
}
function bindTodoForm() {
  const draft = { due: '', time: '' }, box = $('#dchips');
  const draw = () => dateChips(box, draft, draw);
  draw(); animateProg();
  $('#addTodo').addEventListener('submit', e => {
    e.preventDefault();
    const v = $('#tt').value.trim(); if (!v) return;
    data.todos.push({ id: uid(), text: v, done: false, created: Date.now(), due: draft.due, time: draft.time });
    save(); renderTab(); $('#tt').focus();
  });
}
function toggleTodo(id, btn) {
  const t = data.todos.find(x => x.id === id); if (!t) return;
  countDone(t, !t.done); t.done = !t.done; t.doneAt = Date.now(); if (t.done) markDay(); save();
  buzz(t.done ? 12 : 6);
  if (t.done && !data.todos.some(x => !x.done)) { // letztes To-do abgehakt: kurz feiern
    const r = btn.getBoundingClientRect();
    setTimeout(() => { confetti(r.left + r.width / 2, r.top + r.height / 2); buzz([10, 40, 10, 40, 18]); toast('Alles erledigt'); }, 220);
  }
  const li = btn.closest('.todo');
  btn.setAttribute('aria-checked', t.done); li.classList.toggle('done', t.done);
  if (tab === 'home') { setTimeout(() => { if (t.done) collapseTodo(li); }, 520); return; }
  setTimeout(renderTab, 420);
}
// Löscht ein To-do (Zeile klappt weich zu) und bietet kurz „Rückgängig“ an
function removeTodo(id, li) {
  const i = data.todos.findIndex(t => t.id === id); if (i < 0) return;
  const t = data.todos[i];
  const go = () => {
    data.todos = data.todos.filter(x => x.id !== id); save(); if (!sheets.length) renderTab();
    toast('To-do gelöscht', { undo: () => {
      if (!data || data.todos.some(x => x.id === id)) return;
      data.todos.splice(Math.min(i, data.todos.length), 0, t); freshIds.add(id); save(); if (!sheets.length) renderTab(); freshIds.delete(id);
    } });
  };
  if (!li?.isConnected || reduced()) return go();
  li.style.height = li.offsetHeight + 'px'; void li.offsetHeight; li.classList.add('out'); buzz(8);
  setTimeout(go, 300);
}

// Wischen: nach rechts = abhaken, nach links = löschen
let swipe = null, swipeAt = 0;
app.addEventListener('pointerdown', e => {
  const li = e.target.closest('.todos .todo');
  if (!li || e.button > 0 || li.classList.contains('out')) return;
  swipe = { li, x: e.clientX, y: e.clientY, on: false, armed: 0, id: li.querySelector('[data-toggle]')?.dataset.toggle };
  const s = swipe;
  if (!e.target.closest('button')) s.hold = setTimeout(() => { if (swipe === s && !s.on) { swipe = null; swipeAt = Date.now(); todoMenu(s.id, li); } }, 480); // gedrückt halten = Kontextmenü
});
app.addEventListener('pointermove', e => {
  const s = swipe; if (!s) return;
  const dx = e.clientX - s.x, dy = e.clientY - s.y, ax = Math.abs(dx);
  if (Math.hypot(dx, dy) > 8) clearTimeout(s.hold);
  if (!s.on) {
    if (Math.abs(dy) > 10 && Math.abs(dy) > ax) { swipe = null; return; }
    if (ax < 10) return;
    s.on = true; s.li.classList.add('swiping'); try { s.li.setPointerCapture(e.pointerId); } catch {}
  }
  const d = Math.sign(dx) * (ax <= 150 ? ax : 150 + (ax - 150) * .3); // danach wird es zäh wie ein Gummiband
  s.li.style.setProperty('--dx', d.toFixed(1) + 'px'); s.li.dataset.dir = d > 0 ? 'r' : 'l';
  const armed = Math.abs(d) > 88 ? Math.sign(d) : 0;
  if (armed !== s.armed) { s.armed = armed; s.li.classList.toggle('armed', !!armed); buzz(armed ? 10 : 4); }
});
const endSwipe = e => {
  const s = swipe; swipe = null; clearTimeout(s?.hold); if (!s?.on) return;
  swipeAt = Date.now();
  const li = s.li; li.classList.remove('swiping');
  if (e.type === 'pointercancel' || !s.armed) { li.style.setProperty('--dx', '0px'); li.classList.remove('armed'); return; }
  if (s.armed > 0) {
    li.style.setProperty('--dx', '0px');
    setTimeout(() => { li.classList.remove('armed'); const b = li.querySelector('.chk'); if (b?.isConnected) toggleTodo(s.id, b); }, 220);
  } else {
    li.style.setProperty('--dx', -(li.offsetWidth + 60) + 'px');
    setTimeout(() => removeTodo(s.id, li), 200);
  }
};
app.addEventListener('pointerup', endSwipe); app.addEventListener('pointercancel', endSwipe);
app.addEventListener('click', e => { if (Date.now() - swipeAt < 350) { e.stopPropagation(); e.preventDefault(); } }, true); // Wischen ist kein Tippen

function collapseTodo(li) {
  if (!li.isConnected) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  li.style.height = li.offsetHeight + 'px'; li.offsetHeight; // Reflow, damit die Höhe animiert
  li.classList.add('out');
  const open = data.todos.filter(x => !x.done).length;
  const cnt = $('#hcount'); if (cnt) cnt.textContent = open;
  setTimeout(() => {
    li.remove();
    const sec = $('#htodos'); if (!sec) return;
    if (!sec.querySelector('.todo')) {
      if (open > 0) return renderTab(); // weitere offene To-dos nachladen
      sec.classList.add('gone'); setTimeout(() => sec.remove(), 450);
    }
  }, reduce ? 0 : 420);
}

/* ---------- Insel: Erinnerung, die von oben herunterfährt ---------- */
let islandQ = [], islandBusy = false, islandLast = 0;
const islandNotified = new Set();
function island(o) { islandQ.push(o); if (!islandBusy) nextIsland(); }
function nextIsland() {
  const o = islandQ.shift(); if (!o) { islandBusy = false; return; }
  islandBusy = true;
  const el = document.createElement('div');
  el.className = 'island'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
  if (o.color) el.style.setProperty('--a', `var(--${o.color})`);
  if (o.card) { // wie „Pass hinzugefügt“: die neue Karte springt heraus, darunter zeichnet sich ein Haken
    el.classList.add('cardisl');
    el.innerHTML = `<span class="isl-card">${cardMarkup(o.card)}</span><span class="isl-ok"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span><b class="isl-ct">${esc(o.title)}</b>`;
  } else el.innerHTML = `<span class="isl-ic">${ic(o.icon || 'check')}</span><span class="isl-tx"><small>${esc(o.title)}</small><b>${esc(o.text)}</b></span>${
    o.actions ? `<span class="isl-act">${o.actions.map((a, i) => `<button type="button" data-i="${i}" aria-label="${esc(a.label)}" style="--a:var(--${a.color})">${ic(a.icon)}</button>`).join('')}</span>` : ''}`;
  document.body.append(el); void el.offsetWidth; el.classList.add('in'); buzz([14, 40, 10]); yieldLive();
  let closed = false, y0 = null;
  const timer = setTimeout(() => close(), o.ms || 4300);
  const close = go => {
    if (closed) return; closed = true; clearTimeout(timer);
    el.classList.remove('in'); el.classList.add('out');
    setTimeout(() => { el.remove(); yieldLive(); nextIsland(); }, 520);
    if (go) o.onTap?.();
  };
  el.addEventListener('click', e => { // Knopf in der Insel (wie Annehmen/Ablehnen) oder Tippen auf die Insel
    const b = e.target.closest('[data-i]');
    if (b) { e.stopPropagation(); buzz(10); o.actions[b.dataset.i].run(); return close(); }
    close(true);
  });
  el.addEventListener('pointerdown', e => { y0 = e.clientY; });
  el.addEventListener('pointermove', e => { if (y0 != null && y0 - e.clientY > 14) { y0 = null; close(); } }); // nach oben wischen = wegschieben
}
// summary = beim Öffnen: Überblick über alles, was heute fällig oder überfällig ist. Sonst: nur To-dos, deren Uhrzeit gerade erreicht ist.
function checkTodoIsland(summary) {
  if (!data) return;
  const goTodos = () => { if (data) switchTab('todos'); };
  if (summary) {
    islandLast = Date.now();
    const due = data.todos.filter(t => !t.done && t.due && dayDiff(t.due) <= 0).sort(todoSort);
    if (due.length) {
      const n = due.length, late = due.filter(t => dayDiff(t.due) < 0).length, first = due[0];
      island({ title: n === 1 ? (late ? 'Überfällig' : first.time ? 'Heute · ' + first.time : 'Heute') : `${n} To-dos ${late === n ? 'überfällig' : 'für heute'}`,
        text: n === 1 ? first.text : `${first.text} und ${n - 1} weitere`, onTap: goTodos });
      due.forEach(t => islandNotified.add(t.id));
    }
    const inv = (data.invoices || []).filter(i => i.status === 'open' && i.mode !== 'simple' && i.due && dayDiff(i.due) <= 0).sort(invSort);
    if (inv.length) {
      const n = inv.length, late = inv.filter(i => dayDiff(i.due) < 0).length, first = inv[0];
      island({ icon: 'receipt', color: 'red', title: n === 1 ? (late ? 'Rechnung überfällig' : 'Rechnung heute fällig') : `${n} Rechnungen ${late === n ? 'überfällig' : 'fällig'}`,
        text: n === 1 ? `${first.vendor} · ${money(first.gross, first.currency)}` : `${first.vendor} und ${n - 1} weitere`, onTap: () => { if (data) openInvoiceList(); } });
    }
    return;
  }
  const now = new Date(), hhmm = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
  data.todos.filter(t => !t.done && t.due === todayIso() && t.time && t.time <= hhmm && !islandNotified.has(t.id)).forEach(t => {
    islandNotified.add(t.id);
    island({ icon: 'bell', title: 'Jetzt · ' + t.time, text: t.text, onTap: goTodos, ms: 9000, actions: [
      { icon: 'clock', color: 'orange', label: 'In 15 Minuten erinnern', run: () => {
        const d = new Date(Date.now() + 15 * 60e3);
        t.due = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; t.time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
        islandNotified.delete(t.id); save(); if (!sheets.length) renderTab(); toast('Erinnerung in 15 Min.');
      } },
      { icon: 'check', color: 'green', label: 'Erledigt', run: () => { countDone(t, true); t.done = true; t.doneAt = Date.now(); markDay(); save(); if (!sheets.length) renderTab(); toast('Erledigt'); } },
    ] });
  });
}
setInterval(() => checkTodoIsland(false), 30000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && data && Date.now() - islandLast > 15 * 60e3) setTimeout(() => checkTodoIsland(true), 600); });

/* ---------- Visualisierung ---------- */
function viewCards() {
  return `${header('Visualisierung')}
    ${data.cards.length ? `<p class="sub left">Tippe auf eine Karte, um sie in 3D anzusehen.</p>
    <div class="cgrid">${data.cards.map(c => `<button class="cardmini" data-card="${c.id}" aria-label="${esc(c.name || 'Karte')} öffnen">${cardMarkup(c)}</button>`).join('')}</div>`
      : emptyState('card', 'Noch keine Karten', 'Füge Bankkarten, Kundenkarten oder E-Mail-Konten hinzu – sie schweben dann in 3D.')}`;
}

function openViewer(id) {
  const c = data.cards.find(x => x.id === id); if (!c) return;
  const info = c.type === 'member'
    ? [['Geschäft', c.name], ['Mitgliedsnr.', c.member, true], ['Inhaber', c.holder]]
    : c.type === 'mail'
    ? [['Anbieter', c.name], ['E-Mail', c.email, true], ['Passwort', c.pass, 'secret']]
    : [['Bank', c.name], ['Kartennummer', c.number ? c.number.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim() : c.last4 && '•••• ' + c.last4, !!c.number, c.number?.replace(/\s/g, '')],
       ['IBAN', c.iban && c.iban.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim(), true, c.iban?.replace(/\s/g, '')], ['Inhaber', c.holder], ['Gültig bis', c.exp], ['Netzwerk', c.network]];
  let stop;
  const el = openSheet(`
    <div class="sheet-top">
      <button class="iconbtn" data-close aria-label="Zurück">${ic('back')}</button><span class="grow"></span>
      <button class="iconbtn" id="edit" aria-label="Bearbeiten">${ic('edit')}</button>
      <button class="iconbtn" id="del" aria-label="Karte löschen">${ic('trash')}</button>
    </div>
    <div class="stage" id="stage" tabindex="0" aria-label="3D-Karte. Ziehen zum Drehen, Tippen oder Enter zum Umdrehen.">
      ${cardMarkup(c, '3d')}<div class="floor" style="--a:${THEMES[c.theme]?.[1] || '#ff2d78'}"></div>
    </div>
    <p class="hint">Ziehen zum Drehen · Tippen zum Umdrehen</p>
    <div class="pills info">
       ${info.filter(i => i[1]).map(([k, v, copy, raw]) => `<div class="pill${copy ? ' wide' : ''}"><span class="clip"><small>${k}</small>${copy === 'secret' ? `<span class="pwsec" data-secret="${esc(v)}">••••••••</span>` : esc(v)}</span>${copy === 'secret' ? `<button class="iconbtn sm" data-reveal aria-label="Passwort anzeigen">${ic('eye')}</button>` : ''}${copy ? `<button class="iconbtn sm" data-copy="${esc(raw || v)}" aria-label="${k} kopieren">${ic('copy')}</button>` : ''}</div>`).join('')}
      ${c.note ? `<div class="pill wide"><span class="clip multi"><small>Notiz</small>${esc(c.note)}</span></div>` : ''}
    </div>`, { label: 'Karte ansehen', cls: 'viewer', onClose: () => stop?.() });
  stop = mountViewer($('#stage', el));
  $('#edit', el).addEventListener('click', () => { history.back(); setTimeout(() => openCardForm(c.id), 300); });
  $('#del', el).addEventListener('click', async () => {
    if (!(await dialog({ title: 'Karte löschen?', body: 'Das kann nicht rückgängig gemacht werden.', ok: 'Löschen', danger: true }))) return;
    data.cards = data.cards.filter(x => x.id !== c.id); save(); history.back(); toast('Karte gelöscht');
  });
  el.querySelectorAll('[data-reveal]').forEach(b => b.addEventListener('click', () => {
    const s = b.closest('.pill').querySelector(".pwsec"), on = s.dataset.on === '1';
    s.textContent = on ? '••••••••' : s.dataset.secret; s.dataset.on = on ? '0' : '1';
    b.setAttribute('aria-label', on ? 'Passwort anzeigen' : 'Passwort verbergen');
  }));
  el.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); toast('Kopiert'); } catch { toast('Kopieren nicht möglich'); }
  }));
}

const WARN_CARD = 'Alles bleibt verschlüsselt auf deinem Handy. PIN und Prüfnummer (CVV) gibt es hier bewusst nicht – die merkst du dir besser selbst.';
function openCardForm(id, type) {
  const orig = data.cards.find(x => x.id === id);
  const c = orig ? { ...orig } : { id: uid(), type: type || 'bank', theme: type === 'mail' ? 'ocean' : type === 'member' ? 'lime' : 'sunset', name: '', holder: '', number: '', iban: '', exp: '', network: 'Visa', member: '', email: '', pass: '', note: '' };
  const el = openSheet(`
    <div class="sheet-top">
      <button class="iconbtn" data-close aria-label="Abbrechen">${ic('x')}</button>
      <h2 class="grow center">${orig ? 'Karte bearbeiten' : 'Neue Karte'}</h2>
      <button class="btn primary sm" id="save">Sichern</button>
    </div>
    <div class="preview" id="pv"></div>
    <div class="seg" role="radiogroup" aria-label="Art der Karte">
      <button role="radio" data-type="bank">Bankkarte</button><button role="radio" data-type="member">Kundenkarte</button><button role="radio" data-type="mail">E-Mail</button>
    </div>
    <form id="cf" class="form"></form>
    <div class="swatches big" role="radiogroup" aria-label="Design">
      ${Object.entries(THEMES).map(([k, [a, b]]) => `<button type="button" role="radio" data-theme="${k}" aria-label="${k}" style="background:linear-gradient(135deg,${a},${b})"></button>`).join('')}
    </div>
    <p class="warn">${ic('shield')}<span>Alles bleibt verschlüsselt auf deinem Handy. PIN und Prüfnummer (CVV) gibt es hier bewusst nicht – die merkst du dir besser selbst.</span></p>
    <p class="err" id="ferr" role="alert"></p>`, { label: c.name || 'Karte' , cls: 'form-sheet' });

  const F = {
    bank: [['name', 'Bank / Name der Karte', 'text', 'z. B. Sparkasse'], ['holder', 'Inhaber', 'text', 'Name auf der Karte'],
           ['number', 'Kartennummer', 'numeric', '1234 5678 9012 3456', 23], ['iban', 'IBAN', 'text', 'DE00 0000 0000 0000 0000 00', 42],
           ['exp', 'Gültig bis', 'numeric', 'MM/JJ', 5], ['network', 'Netzwerk', 'select'], ['note', 'Notiz (Rückseite)', 'area', 'z. B. Sperr-Notruf 116 116']],
    mail: [['name', 'Anbieter', 'text', 'z. B. Gmail'], ['email', 'E-Mail-Adresse', 'email', 'name@beispiel.de'],
           ['pass', 'Passwort', 'secret', ''], ['note', 'Notiz (Rückseite)', 'area', '']],
    member: [['name', 'Geschäft', 'text', 'z. B. Fitnessstudio'], ['holder', 'Inhaber', 'text', 'Dein Name'],
             ['member', 'Mitgliedsnummer', 'text', ''], ['note', 'Notiz (Rückseite)', 'area', '']],
  };
  const renderForm = () => {
    $('#cf', el).innerHTML = F[c.type].map(([k, label, kind, ph, max]) => {
      if (kind === 'select') return `<label class="field"><span>${label}</span><select name="${k}">${['Visa', 'Mastercard', 'Girocard', 'Amex', 'Andere'].map(o => `<option ${c[k] === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label>`;
      if (kind === 'email') return `<label class="field"><span>${label}</span><input name="${k}" type="email" inputmode="email" value="${esc(c[k])}" placeholder="${ph}" autocomplete="off" autocapitalize="off" spellcheck="false"></label>`;
      if (kind === 'secret') return `<label class="field"><span>${label}</span><input name="${k}" type="password" value="${esc(c[k])}" placeholder="${ph}" autocomplete="new-password" autocapitalize="off" spellcheck="false"></label>`;
      if (kind === 'area') return `<label class="field"><span>${label}</span><textarea name="${k}" rows="2" placeholder="${ph}">${esc(c[k])}</textarea></label>`;
      return `<label class="field"><span>${label}</span><input name="${k}" value="${esc(c[k])}" placeholder="${ph}" ${kind === 'numeric' ? 'inputmode="numeric"' : ''} ${max ? `maxlength="${max}"` : ''} autocomplete="off"></label>`;
    }).join('');
    el.querySelectorAll('[data-type]').forEach(b => b.setAttribute('aria-checked', b.dataset.type === c.type));
    const w = el.querySelector('.warn span');
    if (w) w.textContent = c.type === 'mail' ? 'Alles bleibt verschlüsselt auf deinem Handy. Das Passwort wird nirgends hingeschickt und nur angezeigt, wenn du es in der Karte einblendest.' : WARN_CARD;
  };
  const renderPrev = () => {
    $('#pv', el).innerHTML = cardMarkup(c);
    el.querySelectorAll('[data-theme]').forEach(b => b.setAttribute('aria-checked', b.dataset.theme === c.theme));
  };
  renderForm(); renderPrev();
  $('#cf', el).addEventListener('input', e => {
    const t = e.target;
    if (t.name === 'number') t.value = t.value.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
    if (t.name === 'iban') t.value = t.value.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 34).replace(/(.{4})/g, '$1 ').trim();
    if (t.name === 'exp') { let v = t.value.replace(/\D/g, '').slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2); t.value = v; }
    c[t.name] = t.value; renderPrev();
  });
  el.querySelectorAll('[data-type]').forEach(b => b.addEventListener('click', () => { c.type = b.dataset.type; renderForm(); renderPrev(); fadeIn($('#cf', el)); popEl($('#pv', el)); }));
  el.querySelectorAll('[data-theme]').forEach(b => b.addEventListener('click', () => { c.theme = b.dataset.theme; renderPrev(); popEl($('#pv', el)); }));
  $('#save', el).addEventListener('click', () => {
    const err = $('#ferr', el);
    if (!c.name.trim()) return (err.textContent = 'Gib der Karte einen Namen.');
    if (c.type === 'mail' && !String(c.email).trim()) return (err.textContent = 'Gib die E-Mail-Adresse ein.');
    if (orig) Object.assign(orig, c); else data.cards.push(c);
    save(); history.back(); if (orig) toast('Karte aktualisiert'); else island({ card: c, title: 'Karte hinzugefügt', ms: 2600 });
    if (!orig) setTimeout(() => openViewer(c.id), 320);
  });
}

/* ---------- Einstellungen ---------- */
function openSettings(origin) {
  const el = openSheet(`
    <div class="sheet-top"><button class="iconbtn" data-close aria-label="Zurück">${ic('back')}</button><h2 class="grow center">Einstellungen</h2><span class="iconbtn ghost"></span></div>
    <h3 class="sec">Design</h3>
    <div class="themes" role="radiogroup" aria-label="Design">
      <button type="button" class="themetile" role="radio" data-pick="classic"><span class="tprev" aria-hidden="true"><i></i><i></i><i></i><b></b></span>Klassisch</button>
      <button type="button" class="themetile" role="radio" data-pick="glass"><span class="tprev glass" aria-hidden="true"><i></i><i></i><i></i><b></b></span>Glas</button>
      <button type="button" class="themetile" role="radio" data-pick="ember"><span class="tprev ember" aria-hidden="true"><i></i><i></i><i></i><svg viewBox="0 0 100 40" preserveAspectRatio="none"><path d="M0 34 C 20 34, 26 8, 42 8 S 66 30, 100 26"/></svg><b></b></span>Ember</button>
    </div>
    <div class="group collapsible${getTheme() === 'glass' ? '' : ' collapsed'}" id="wallGroup"${getTheme() === 'glass' ? '' : ' inert'}>
      <div class="wallrow"><b>Hintergrund</b>
        <div class="swatches big" role="radiogroup" aria-label="Hintergrund">${WALLS.map(([k, n]) => `<button type="button" role="radio" data-wall="${k}" aria-label="${n}"></button>`).join('')}</div></div>
      <div class="row"><div><b>Lichtbrechung</b><small>${lg.ok ? 'Der Hintergrund biegt sich am Rand wie durch echtes Glas. Ausschalten, falls es ruckelt.' : 'In diesem Browser nicht verfügbar – geht in Chrome.'}</small></div>
        <button class="switch" id="lensSw" role="switch" aria-checked="${lg.ok && lsGet('lumen-lens') !== '0'}" aria-label="Lichtbrechung" ${lg.ok ? '' : 'disabled'}></button></div>
    </div>
    <h3 class="sec">Töne</h3>
    <div class="group"><div class="row"><div><b>Töne & Vibration</b><small>Timer-Ton und Vibration beim Antippen</small></div>
      <button class="switch" id="sndSw" role="switch" aria-checked="${soundOn()}" aria-label="Töne und Vibration"></button></div></div>
    <h3 class="sec">Sicherheit</h3>
    <div class="group">
      <div class="row"><div><b>Code-Sperre</b><small id="codeTxt">${Vault.hasCode ? 'App ist mit Code geschützt' : 'Aus – die App öffnet sich von selbst'}</small></div>
        <button class="switch" id="codeSw" role="switch" aria-checked="${Vault.hasCode}" aria-label="Code-Sperre"></button></div>
    </div>
    <div class="group collapsible${Vault.hasCode ? '' : ' collapsed'}" id="codeGroup"${Vault.hasCode ? '' : ' inert'}>
      <div class="row"><div><b>Fingerabdruck</b><small id="bioTxt">${!bioOk ? 'Auf diesem Gerät nicht verfügbar' : Vault.hasBio ? 'Entsperren per Fingerabdruck ist an' : 'Schneller entsperren'}</small></div>
        <button class="switch" id="bioSw" role="switch" aria-checked="${Vault.hasBio}" aria-label="Fingerabdruck" ${bioOk ? '' : 'disabled'}></button></div>
      <label class="row"><div><b>Automatisch sperren</b><small>Wenn die App im Hintergrund ist</small></div>
        <select id="al">${[[0, 'Sofort'], [60, 'Nach 1 Min.'], [300, 'Nach 5 Min.'], [900, 'Nach 15 Min.']].map(([v, l]) => `<option value="${v}" ${data.settings.autolock === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <button class="row nav" id="chg"><div><b>Code ändern</b></div></button>
    </div>
    <h3 class="sec">Daten</h3>
    <div class="group">
      <button class="row nav" id="exp"><div><b>Backup exportieren</b><small>Mit Code-Sperre öffnet sich die Datei nur mit deinem Code</small></div></button>
      <label class="row nav"><div><b>Backup importieren</b><small>Ersetzt alle Daten auf diesem Handy</small></div><input type="file" id="imp" accept=".json,application/json" hidden></label>
    </div>
    <div class="group"><button class="row danger" id="wipe"><div><b>Alle Daten löschen</b></div></button></div>
    <p class="foot">Lumen 1.0 · Alles bleibt auf diesem Gerät, verschlüsselt mit AES-256.</p>`, { label: 'Einstellungen', origin });

  const markTheme = () => {
    const th = getTheme(), g = $('#wallGroup', el);
    el.querySelectorAll('[data-pick]').forEach(b => b.setAttribute('aria-checked', b.dataset.pick === th));
    el.querySelectorAll('.wallrow [data-wall]').forEach(b => b.setAttribute('aria-checked', b.dataset.wall === getWall()));
    g.classList.toggle('collapsed', th !== 'glass'); g.toggleAttribute('inert', th !== 'glass');
  };
  markTheme();
  $('#sndSw', el).addEventListener('click', e => { const on = !soundOn(); lsSet('lumen-sound', on ? '1' : '0'); e.currentTarget.setAttribute('aria-checked', on); if (on) buzz(14); toast(on ? 'Ton an' : 'Lautlos'); });
  $('#lensSw', el).addEventListener('click', e => { const on = lsGet('lumen-lens') === '0'; lsSet('lumen-lens', on ? '1' : '0'); e.currentTarget.setAttribute('aria-checked', on); buzz(6); lgSync(); });
  el.querySelectorAll('[data-pick]').forEach(b => b.addEventListener('click', () => { if (b.dataset.pick === getTheme()) return; buzz(10); setTheme(b.dataset.pick, getWall(), b, markTheme); }));
  el.querySelectorAll('.wallrow [data-wall]').forEach(b => b.addEventListener('click', () => { if (b.dataset.wall === getWall()) return; buzz(6); setTheme('glass', b.dataset.wall, b, markTheme); }));

  $('#codeSw', el).addEventListener('click', async e => {
    const sw = e.currentTarget;
    if (Vault.hasCode) {
      const v = await dialog({ title: 'Code-Sperre ausschalten?', body: 'Wenn du den Code deaktivierst, sind deine Daten und Notizen nicht mehr geschützt: Jeder, der dein entsperrtes Handy in die Hand nimmt, kann Lumen öffnen und alles lesen.', fields: [{ name: 'c', label: 'Aktueller Code' }], ok: 'Ausschalten', danger: true });
      if (!v) return;
      try { await Vault.disableCode(v.c); } catch { return toast('Code ist falsch'); }
      toast('Code-Sperre aus');
    } else {
      const v = await dialog({ title: 'Code-Sperre einschalten', body: 'Lege einen Code fest. Danach sind deine Daten wieder verschlüsselt.', fields: [{ name: 'a', label: 'Neuer Code (mind. 6)', min: 6 }, { name: 'b', label: 'Code wiederholen', min: 6 }], ok: 'Einschalten' });
      if (!v) return;
      if (v.a !== v.b) return toast('Die Codes stimmen nicht überein');
      await Vault.enableCode(v.a); toast('Code-Sperre an');
    }
    sw.setAttribute('aria-checked', Vault.hasCode);
    $('#codeTxt', el).textContent = Vault.hasCode ? 'App ist mit Code geschützt' : 'Aus – die App öffnet sich von selbst';
    { const g = $('#codeGroup', el); g.classList.toggle('collapsed', !Vault.hasCode); g.toggleAttribute('inert', !Vault.hasCode); }
    renderTab();
  });
  $('#bioSw', el).addEventListener('click', async e => {
    const sw = e.currentTarget;
    if (Vault.hasBio) { await Vault.disableBio(); toast('Fingerabdruck aus'); }
    else await enrollBio();
    sw.setAttribute('aria-checked', Vault.hasBio);
    $('#bioTxt', el).textContent = Vault.hasBio ? 'Entsperren per Fingerabdruck ist an' : 'Schneller entsperren';
  });
  $('#al', el).addEventListener('change', e => { data.settings.autolock = +e.target.value; save(); });
  $('#chg', el).addEventListener('click', async () => {
    const v = await dialog({ title: 'Code ändern', fields: [{ name: 'old', label: 'Aktueller Code' }, { name: 'a', label: 'Neuer Code (mind. 6)', min: 6 }, { name: 'b', label: 'Neuen Code wiederholen', min: 6 }], ok: 'Ändern' });
    if (!v) return;
    if (v.a !== v.b) return toast('Die neuen Codes stimmen nicht überein');
    if (!(await Vault.checkCode(v.old))) return toast('Aktueller Code ist falsch');
    await Vault.changeCode(v.a); toast('Code geändert');
  });
  $('#exp', el).addEventListener('click', async () => {
    if (!Vault.hasCode && !(await dialog({ title: 'Backup ohne Schutz', body: 'Die Code-Sperre ist aus. Die Backup-Datei lässt sich deshalb von jedem öffnen, der sie in die Hände bekommt.', ok: 'Trotzdem exportieren' }))) return;
    await flush();
    const blob = new Blob([Vault.exportText()], { type: 'application/json' });
    const name = `lumen-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File([blob], name, { type: 'application/json' });
    if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], title: 'Lumen-Backup' }); return; } catch (e) { if (e.name === 'AbortError') return; } }
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: name });
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); toast('Backup gespeichert');
  });
  $('#imp', el).addEventListener('change', importFile);
  $('#wipe', el).addEventListener('click', async () => {
    const ok = await dialog({ title: 'Alles löschen?', body: 'Alle Notizen, To-dos und Karten auf diesem Handy werden endgültig gelöscht.', ok: 'Endgültig löschen', danger: true });
    if (!ok) return;
    closeAllSheets(); await Vault.wipe(); data = null; renderSetup();
  });
}

async function enrollBio() {
  try { await Vault.enrollBio(); toast('Fingerabdruck eingerichtet'); }
  catch (e) {
    if (e.name === 'NotAllowedError') return toast('Abgebrochen');
    if (e.message === 'noprf') return dialog({ title: 'Geht hier leider nicht', body: 'Dein Handy oder Browser unterstützt das sichere Entsperren per Fingerabdruck (WebAuthn PRF) nicht. Deine Code-Sperre bleibt aktiv. Tipp: Chrome aktualisieren und es nochmal versuchen.', cancel: '', ok: 'Okay' });
    toast('Einrichten hat nicht geklappt');
  }
}

async function importFile(e) {
  const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
  if (Vault.rec && !(await dialog({ title: 'Backup importieren?', body: 'Alle aktuellen Daten auf diesem Handy werden ersetzt. Danach entsperrst du mit dem Code, der beim Backup galt.', ok: 'Importieren', danger: true }))) return;
  try { await Vault.importText(await f.text()); data = null; renderLock('Backup geladen – entsperre mit dem Code des Backups'); }
  catch { toast('Das ist keine gültige Lumen-Backup-Datei'); }
}

/* ---------- Plus-Menü ---------- */
function setMenu(open, focusFirst) {
  const m = $('#fabmenu'), sc = $('#scrim'), f = $('#fab');
  if (!m) return;
  if (open === menuOpen && m.classList.contains('open') === open) return;
  menuOpen = open;
  m.classList.toggle('open', open); sc.classList.toggle('open', open);
  m.toggleAttribute('inert', !open);
  if (f.hasAttribute('aria-haspopup')) f.setAttribute('aria-expanded', open);
  if (open) { buzz(8); if (focusFirst) [...m.querySelectorAll('.fm-item')].pop()?.focus(); }
}
document.addEventListener('keydown', e => { if (e.key === 'Escape' && menuOpen) { setMenu(false); $('#fab')?.focus(); } });
app.addEventListener('click', e => { if (e.target.id === 'scrim') setMenu(false); });

function openQuickTodo() {
  const kb = () => {
    const v = window.visualViewport; if (!v) return;
    el.style.setProperty('--kb', Math.max(0, innerHeight - v.height - v.offsetTop) + 'px');
  };
  const el = openSheet(`
    <div class="q-bd" data-close></div>
    <form class="q-card" id="qf" autocomplete="off">
      <div class="q-top"><h2>Neues To-do</h2><button type="button" class="iconbtn sm" data-close aria-label="Schließen">${ic('x')}</button></div>
      <div class="addrow"><input id="qt" placeholder="Was steht an?" aria-label="Neues To-do" enterkeyhint="done" maxlength="300"><button class="addbtn" aria-label="Hinzufügen">${ic('plus')}</button></div>
      <div class="dchips" id="qchips"></div>
      <ul class="added" id="added" aria-live="polite"></ul>
    </form>`, { label: 'Neues To-do', cls: 'quick', onClose: () => window.visualViewport?.removeEventListener('resize', kb) });
  window.visualViewport?.addEventListener('resize', kb);
  const input = $('#qt', el), list = $('#added', el);
  const draft = { due: '', time: '' }, chips = $('#qchips', el);
  const drawChips = () => dateChips(chips, draft, drawChips);
  drawChips();
  $('#qf', el).addEventListener('submit', e => {
    e.preventDefault();
    const v = input.value.trim(); if (!v) return;
    const nt = { id: uid(), text: v, done: false, created: Date.now(), due: draft.due, time: draft.time };
    data.todos.push(nt); freshIds.add(nt.id);
    save(); buzz(10); input.value = ''; input.focus();
    const li = document.createElement('li');
    li.innerHTML = `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4L18 8"/></svg><span>${esc(v)}${nt.due ? ' · ' + esc(fmtDue(nt.due, nt.time)) : ''}</span>`;
    draft.due = draft.time = ''; drawChips();
    list.prepend(li); while (list.children.length > 3) list.lastChild.remove();
  });
  setTimeout(() => input.focus(), 380);
}

/* ---------- Rechnungen ---------- */
const TAXES = [
  { g: 'Deutschland', items: [['de19', 'MwSt. Deutschland', 19], ['de7', 'MwSt. Deutschland (ermäßigt)', 7]] },
  { g: 'Europa', items: [['at20', 'USt. Österreich', 20], ['at10', 'USt. Österreich (ermäßigt)', 10], ['ch81', 'MWST Schweiz', 8.1], ['ch26', 'MWST Schweiz (reduziert)', 2.6],
    ['fr20', 'TVA Frankreich', 20], ['it22', 'IVA Italien', 22], ['es21', 'IVA Spanien', 21], ['nl21', 'BTW Niederlande', 21], ['uk20', 'VAT Großbritannien', 20]] },
  { g: 'Übersee', items: [['us', 'Sales Tax USA (je nach Bundesstaat)', 7], ['ca5', 'GST Kanada', 5], ['au10', 'GST Australien', 10]] },
  { g: 'Sonstiges', items: [['zero', 'Keine Steuer', 0]] },
];
const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'CAD', 'AUD', 'JPY'];
const pad2 = n => String(n).padStart(2, '0');
const todayIso = () => { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };
const fmtIso = iso => iso ? new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso + 'T00:00:00')) : '';
const money = (v, cur) => { try { return new Intl.NumberFormat('de-DE', { style: 'currency', currency: cur || 'EUR' }).format(v || 0); } catch { return (v || 0).toFixed(2) + ' ' + cur; } };
const pct = r => String(r ?? '').replace('.', ',');
const num = s => { const n = parseFloat(String(s ?? '').replace(/\s/g, '').replace(',', '.')); return Number.isFinite(n) ? n : 0; };
const r2 = n => Math.round((n + Number.EPSILON) * 100) / 100;
function calcInv(amount, mode, rate) {
  const a = num(amount), k = 1 + num(rate) / 100;
  if (mode === 'net') { const tax = r2(a * (k - 1)); return { net: r2(a), tax, gross: r2(a + tax) }; }
  const net = r2(a / k); return { net, tax: r2(a - net), gross: r2(a) };
}
const allTaxes = () => [...TAXES.flatMap(g => g.items.map(([key, name, rate]) => ({ key, name, rate }))),
  ...(data.settings.taxes || []).map((t, i) => ({ key: 'c:' + i, name: t.name, rate: t.rate }))];
const invOverdue = i => i.status !== 'paid' && i.due && i.due < todayIso();
const invChip = i => i.status === 'paid' ? '<span class="chip paid">Bezahlt</span>' : invOverdue(i) ? '<span class="chip late">Überfällig</span>' : '<span class="chip open">Offen</span>';
function invRow(i) {
  const sub = i.mode === 'simple' ? fmtIso(i.date) : i.status === 'paid' ? 'Bezahlt' : i.due ? 'Fällig ' + fmtIso(i.due) : 'Offen';
  return `<button class="invrow" data-inv="${i.id}"><span class="inv-ic">${ic('receipt')}</span>
    <span class="inv-tx"><b>${esc(i.vendor)}</b><small class="${invOverdue(i) ? 'late' : ''}">${esc(sub)}${i.number ? ' · ' + esc(i.number) : ''}</small></span>
    <span class="inv-amt">${money(i.gross, i.currency)}</span></button>`;
}
const invSort = (a, b) => (a.due || '9999').localeCompare(b.due || '9999') || b.created - a.created;
function invTotals(list) {
  const by = {}; list.forEach(i => { by[i.currency] = (by[i.currency] || 0) + i.gross; });
  return Object.entries(by).map(([c, v]) => money(v, c)).join(' · ');
}
function invHome() {
  if (!data.invoices.length) return '';
  const open = data.invoices.filter(i => i.status !== 'paid').sort(invSort), shown = open.slice(0, 3);
  return `<section class="hinv" aria-label="Rechnungen">
    <div class="hsec"><span>Rechnungen</span><b>${open.length}</b></div>
    ${open.length ? `<div class="invlist">${shown.map(invRow).join('')}</div>` : '<p class="sub left">Keine offenen Rechnungen.</p>'}
    ${open.length ? `<p class="invsum">Offen gesamt: ${invTotals(open)}</p>` : ''}
    <button class="more" data-act="invlist">Alle Rechnungen</button></section>`;
}

function loadImage(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); res(img); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('img')); };
    img.src = url;
  });
}
async function compressImage(file, max = 1600, q = .74) {
  const img = await loadImage(file), s = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', q);
}

function openInvoiceForm(id) {
  const orig = data.invoices.find(x => x.id === id);
  const inv = orig ? { ...orig } : { id: uid(), vendor: '', number: '', date: todayIso(), due: '', amount: '', mode: 'gross', currency: 'EUR',
    taxKey: 'de19', taxName: 'MwSt. Deutschland', rate: 19, status: 'open', note: '', image: '', created: Date.now() };
  const customs = data.settings.taxes || [];
  const opts = TAXES.map(g => `<optgroup label="${g.g}">${g.items.map(([k, n, r]) => `<option value="${k}">${esc(n)} · ${pct(r)} %</option>`).join('')}</optgroup>`).join('')
    + (customs.length ? `<optgroup label="Meine Steuern">${customs.map((t, i) => `<option value="c:${i}">${esc(t.name)} · ${pct(t.rate)} %</option>`).join('')}</optgroup>` : '')
    + '<option value="custom">Eigene Steuer anlegen …</option>';
  const el = openSheet(`
    <div class="sheet-top">
      <button class="iconbtn" data-close aria-label="Abbrechen">${ic('x')}</button>
      <h2 class="grow center">${orig ? 'Rechnung bearbeiten' : 'Neue Rechnung'}</h2>
      <button class="btn primary sm" id="save">Sichern</button>
    </div>
    <form class="form" id="if" autocomplete="off" onsubmit="return false">
      <label class="field"><span>Aussteller / Firma</span><input name="vendor" value="${esc(inv.vendor)}" placeholder="z. B. Telekom" autocomplete="off"></label>
      <div class="seg" id="modeSeg" role="radiogroup" aria-label="Art der Rechnung">
        <button type="button" role="radio" data-mode="simple" aria-label="Einfache Rechnung">Einfach</button><button type="button" role="radio" data-mode="gross">Betrag brutto</button><button type="button" role="radio" data-mode="net">Betrag netto</button>
      </div>
      <div class="two">
        <label class="field"><span>Betrag</span><input name="amount" value="${esc(inv.amount)}" inputmode="decimal" placeholder="0,00" autocomplete="off"></label>
        <label class="field"><span>Währung</span><select name="currency">${CURRENCIES.map(c => `<option ${c === inv.currency ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
      </div>
      <label class="field"><span id="dateLbl">Rechnungsdatum</span><input name="date" type="date" value="${esc(inv.date)}"></label>
      <div class="fold${inv.mode === 'simple' ? ' collapsed' : ''}" id="fullFold"${inv.mode === 'simple' ? ' hidden inert' : ''}><div class="foldin">
        <div class="two">
          <label class="field"><span>Rechnungsnummer</span><input name="number" value="${esc(inv.number)}" placeholder="optional" autocomplete="off"></label>
          <label class="field"><span>Fällig am</span><input name="due" type="date" value="${esc(inv.due)}"></label>
        </div>
        <label class="field"><span>Steuer</span><select id="taxSel">${opts}</select></label>
        <div class="two">
          <label class="field"><span>Bezeichnung</span><input name="taxName" value="${esc(inv.taxName)}" placeholder="z. B. Sales Tax Texas" autocomplete="off"></label>
          <label class="field"><span>Satz in %</span><input name="rate" value="${esc(pct(inv.rate))}" inputmode="decimal" placeholder="19" autocomplete="off"></label>
        </div>
        <div class="sumbox" id="sum" aria-live="polite"></div>
        <div class="seg" id="stSeg" role="radiogroup" aria-label="Status">
          <button type="button" role="radio" data-st="open">Offen</button><button type="button" role="radio" data-st="paid">Bezahlt</button>
        </div>
        <label class="field"><span>Notiz</span><textarea name="note" rows="2" placeholder="optional">${esc(inv.note)}</textarea></label>
        <div class="field"><span>Bild der Rechnung</span><div id="imgbox"></div></div>
      </div></div>
      <input type="file" accept="image/*" id="imgIn" hidden>
    </form>
    <p class="err" id="ferr" role="alert"></p>`, { label: 'Rechnung', cls: 'form-sheet' });

  const $f = n => el.querySelector(`[name="${n}"]`), taxSel = el.querySelector('#taxSel');
  taxSel.value = allTaxes().some(t => t.key === inv.taxKey) ? inv.taxKey : 'custom';
  const fold = el.querySelector('#fullFold');
  const setFold = show => { // Rest des Formulars weich ein- und ausklappen
    clearTimeout(fold._t);
    if (show) { fold.hidden = false; void fold.offsetHeight; fold.classList.remove('collapsed'); fold.removeAttribute('inert'); }
    else { fold.classList.add('collapsed'); fold.setAttribute('inert', ''); fold._t = setTimeout(() => { fold.hidden = true; }, reduced() ? 0 : 520); }
  };
  const sum = () => {
    const c = calcInv(inv.amount, inv.mode, inv.rate);
    el.querySelector('#sum').innerHTML = `<div class="sumrow"><span>Netto</span><span>${money(c.net, inv.currency)}</span></div>
      <div class="sumrow"><span>${esc(inv.taxName || 'Steuer')} · ${pct(num(inv.rate))} %</span><span>${money(c.tax, inv.currency)}</span></div>
      <div class="sumrow tot"><span>Brutto</span><span>${money(c.gross, inv.currency)}</span></div>`;
  };
  const marks = () => {
    el.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-checked', b.dataset.mode === inv.mode));
    el.querySelector('#dateLbl').textContent = inv.mode === 'simple' ? 'Datum' : 'Rechnungsdatum';
    el.querySelectorAll('[data-st]').forEach(b => b.setAttribute('aria-checked', b.dataset.st === inv.status));
  };
  el.querySelector('#if').addEventListener('input', e => { const t = e.target; if (t.name) { inv[t.name] = t.value; sum(); } });
  taxSel.addEventListener('change', () => {
    inv.taxKey = taxSel.value;
    if (taxSel.value === 'custom') { inv.taxName = ''; $f('taxName').value = ''; $f('taxName').focus(); }
    else { const t = allTaxes().find(x => x.key === taxSel.value); inv.taxName = t.name; inv.rate = t.rate; $f('taxName').value = t.name; $f('rate').value = pct(t.rate); }
    sum();
  });
  el.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { inv.mode = b.dataset.mode; marks(); sum(); setFold(inv.mode !== 'simple'); buzz(6); }));
  el.querySelectorAll('[data-st]').forEach(b => b.addEventListener('click', () => { inv.status = b.dataset.st; marks(); }));
  const renderImg = () => {
    el.querySelector('#imgbox').innerHTML = inv.image
      ? `<div class="imgprev"><img src="${inv.image}" alt="Bild der Rechnung"><button type="button" class="iconbtn sm rm" id="imgRm" aria-label="Bild entfernen">${ic('x')}</button></div>`
      : `<button type="button" class="btn imgadd" id="imgBtn">${ic('plus')}<span>Foto oder Bild hinzufügen</span></button>`;
    el.querySelector('#imgRm')?.addEventListener('click', () => { inv.image = ''; renderImg(); });
    el.querySelector('#imgBtn')?.addEventListener('click', () => el.querySelector('#imgIn').click()); fadeIn(el.querySelector('#imgbox'));
  };
  el.querySelector('#imgIn').addEventListener('change', async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try { inv.image = await compressImage(f); renderImg(); } catch { toast('Das Bild konnte nicht geladen werden'); }
  });
  marks(); sum(); renderImg();

  $('#save', el).addEventListener('click', () => {
    const err = $('#ferr', el);
    if (!String(inv.vendor).trim()) return (err.textContent = 'Gib Aussteller oder Firma ein.');
    if (!(num(inv.amount) > 0)) return (err.textContent = 'Gib einen Betrag ein.');
    if (inv.mode === 'simple') { // einfache Rechnung: bezahlt, nur Anbieter, Betrag und Datum
      const a = r2(num(inv.amount));
      Object.assign(inv, { vendor: String(inv.vendor).trim(), number: '', due: '', note: '', image: '', taxName: '', rate: 0, net: a, tax: 0, gross: a, status: 'paid' });
    } else {
      const c = calcInv(inv.amount, inv.mode, inv.rate), name = String(inv.taxName).trim(), rate = num(inv.rate);
      Object.assign(inv, { vendor: String(inv.vendor).trim(), taxName: name, rate, net: c.net, tax: c.tax, gross: c.gross });
      if (name && !allTaxes().some(t => t.name === name && t.rate === rate)) (data.settings.taxes ||= []).push({ name, rate }); // eigene Steuer merken
    }
    if (orig) Object.assign(orig, inv); else data.invoices.push(inv);
    save(); history.back(); toast(orig ? 'Rechnung aktualisiert' : 'Rechnung hinzugefügt');
  });
}

function openInvoice(id) {
  const i = data.invoices.find(x => x.id === id); if (!i) return;
  const pill = (k, v) => v ? `<div class="pill"><span class="clip"><small>${k}</small>${esc(v)}</span></div>` : '';
  const el = openSheet(`
    <div class="sheet-top">
      <button class="iconbtn" data-close aria-label="Zurück">${ic('back')}</button><span class="grow"></span>
      <button class="iconbtn" id="edit" aria-label="Bearbeiten">${ic('edit')}</button>
      <button class="iconbtn" id="del" aria-label="Rechnung löschen">${ic('trash')}</button>
    </div>
    <div class="invhero"><span id="chipwrap">${invChip(i)}</span><h1>${esc(i.vendor)}</h1>
      <div class="amt">${money(i.gross, i.currency)}</div>${i.number ? `<p class="sub left">Nr. ${esc(i.number)}</p>` : ''}</div>
    <div class="pills info">
      ${i.mode === 'simple' ? '' : pill('Netto', money(i.net, i.currency)) + pill(`${i.taxName || 'Steuer'} · ${pct(i.rate)} %`, money(i.tax, i.currency))}
      ${pill(i.mode === 'simple' ? 'Datum' : 'Rechnungsdatum', fmtIso(i.date))}${pill('Fällig am', fmtIso(i.due))}
      ${i.note ? `<div class="pill wide"><span class="clip multi"><small>Notiz</small>${esc(i.note)}</span></div>` : ''}
    </div>
    ${i.image ? `<img class="invimg" id="invimg" src="${i.image}" alt="Bild der Rechnung">` : ''}
    <button class="btn wide invpay" id="paid"${i.mode === 'simple' ? ' hidden' : ''}></button>`, { label: i.vendor || 'Rechnung' });
  const paidBtn = $('#paid', el);
  const sync = () => { $('#chipwrap', el).innerHTML = invChip(i); paidBtn.textContent = i.status === 'paid' ? 'Wieder auf offen setzen' : 'Als bezahlt markieren'; popEl($('#chipwrap', el)); };
  sync();
  paidBtn.addEventListener('click', () => { i.status = i.status === 'paid' ? 'open' : 'paid'; save(); sync(); buzz(8); });
  $('#edit', el).addEventListener('click', () => { history.back(); setTimeout(() => openInvoiceForm(i.id), 300); });
  $('#del', el).addEventListener('click', async () => {
    if (!(await dialog({ title: 'Rechnung löschen?', body: 'Das kann nicht rückgängig gemacht werden.', ok: 'Löschen', danger: true }))) return;
    data.invoices = data.invoices.filter(x => x.id !== i.id); save(); history.back(); toast('Rechnung gelöscht');
  });
  $('#invimg', el)?.addEventListener('click', () => openSheet(`<div class="sheet-top"><button class="iconbtn" data-close aria-label="Schließen">${ic('x')}</button></div><img src="${i.image}" alt="Bild der Rechnung">`, { label: 'Bild der Rechnung', cls: 'imgview' }));
}

function openInvoiceList(filter = 'open') {
  let f = filter;
  const el = openSheet(`
    <div class="sheet-top"><button class="iconbtn" data-close aria-label="Zurück">${ic('back')}</button><h2 class="grow center">Rechnungen</h2>
      <button class="iconbtn" id="addinv" aria-label="Neue Rechnung">${ic('plus')}</button></div>
    <div class="seg" id="fseg" role="radiogroup" aria-label="Filter">
      <button type="button" role="radio" data-f="open">Offen</button><button type="button" role="radio" data-f="paid">Bezahlt</button><button type="button" role="radio" data-f="all">Alle</button>
    </div>
    <div class="invlist" id="ilist"></div><p class="invsum" id="itotal"></p>`, { label: 'Rechnungen' });
  const render = () => {
    el.querySelectorAll('[data-f]').forEach(b => b.setAttribute('aria-checked', b.dataset.f === f));
    const list = data.invoices.filter(i => f === 'all' || (f === 'paid') === (i.status === 'paid')).sort(f === 'paid' ? (a, b) => b.date.localeCompare(a.date) : invSort);
    $('#ilist', el).innerHTML = list.length ? list.map(invRow).join('') : `<p class="sub">${f === 'paid' ? 'Noch nichts bezahlt.' : f === 'open' ? 'Keine offenen Rechnungen.' : 'Noch keine Rechnungen.'}</p>`;
    $('#itotal', el).textContent = list.length ? (f === 'paid' ? 'Bezahlt gesamt: ' : f === 'open' ? 'Offen gesamt: ' : 'Gesamt: ') + invTotals(list) : '';
  };
  el.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.f) { f = b.dataset.f; render(); fadeIn($('#ilist', el)); }
    else if (b.dataset.inv) openInvoice(b.dataset.inv);
    else if (b.id === 'addinv') openInvoiceForm();
  });
  el.addEventListener('revive', render);
  render();
}

/* ---------- Fokus-Timer: läuft als kleine Live-Insel oben mit ---------- */
const getTimer = () => data?.settings?.timer || null;
const timerLeft = t => t.end ? Math.max(0, Math.ceil((t.end - Date.now()) / 1000)) : t.left;
const fmtClock = s => `${Math.floor(s / 60)}:${pad2(s % 60)}`;
let liveEl = null, liveT = null;
function chime() {
  if (!soundOn()) return;
  try {
    const A = window.AudioContext || window.webkitAudioContext; if (!A) return;
    const ctx = new A(), t0 = ctx.currentTime;
    [[660, 0], [880, .16], [1320, .32]].forEach(([f, at]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(.0001, t0 + at); g.gain.exponentialRampToValueAtTime(.16, t0 + at + .03); g.gain.exponentialRampToValueAtTime(.0001, t0 + at + .5);
      o.start(t0 + at); o.stop(t0 + at + .55);
    });
    setTimeout(() => ctx.close(), 1400);
  } catch {}
}
function openLive(open) {
  if (!liveEl) return;
  liveEl.classList.toggle('open', open); liveEl.setAttribute('aria-expanded', open);
  liveEl.querySelectorAll('.lv-x button').forEach(b => { b.tabIndex = open ? 0 : -1; });
  clearTimeout(liveT);
  if (open && !getTimer()?.done) liveT = setTimeout(() => openLive(false), 6000);
}
function paintLive() {
  const t = getTimer(), el = liveEl; if (!t || !el) return;
  const left = timerLeft(t), txt = t.done ? 'Fertig' : fmtClock(left);
  el.style.setProperty('--p', t.total ? ((1 - left / t.total) * 100).toFixed(2) : 100);
  el.querySelectorAll('.lv-time').forEach(n => { if (n.textContent !== txt) n.textContent = txt; });
  el.classList.toggle('paused', !t.end && !t.done); el.classList.toggle('done', !!t.done);
  const pb = $('#lvPause', el);
  pb.innerHTML = ic(t.done ? 'check' : t.end ? 'pause' : 'play'); pb.setAttribute('aria-label', t.done ? 'Fertig' : t.end ? 'Pause' : 'Weiter');
  $('.lv-label', el).textContent = t.done ? 'Zeit ist um' : t.end ? (t.label || 'Fokus') : 'Pausiert';
  el.setAttribute('aria-label', `Fokus-Timer, ${t.done ? 'fertig' : 'noch ' + fmtClock(left)}`);
}
function syncLive() {
  const t = getTimer();
  if (!t) {
    if (liveEl) { const el = liveEl; liveEl = null; clearTimeout(liveT); document.body.classList.remove('has-live'); el.classList.add('bye'); setTimeout(() => el.remove(), reduced() ? 0 : 380); }
    return;
  }
  if (!liveEl) {
    const el = liveEl = document.createElement('div');
    el.className = 'live'; el.setAttribute('role', 'button'); el.tabIndex = 0; el.setAttribute('aria-expanded', 'false');
    el.innerHTML = `<div class="lv-c" aria-hidden="true"><svg class="lv-ring" viewBox="0 0 20 20"><circle class="bg" cx="10" cy="10" r="7.5"/><circle class="fg" cx="10" cy="10" r="7.5" pathLength="100"/></svg><span class="lv-time"></span></div>
      <div class="lv-x"><button type="button" id="lvPause" tabindex="-1"></button><button type="button" id="lvStop" tabindex="-1" aria-label="Timer beenden">${ic('x')}</button>
        <span class="lv-info"><small class="lv-label"></small><b class="lv-time"></b></span></div>`;
    document.body.append(el); document.body.classList.add('has-live');
    requestAnimationFrame(() => el.classList.add('in'));
    el.addEventListener('click', e => {
      const b = e.target.closest('button'), t = getTimer(); if (!t) return;
      if (!b) return openLive(!el.classList.contains('open'));
      buzz(8);
      if (b.id === 'lvStop' || t.done) { const was = t.done; delete data.settings.timer; save(); syncLive(); if (!was) toast('Timer beendet'); return; }
      if (t.end) { t.left = timerLeft(t); t.end = null; } else t.end = Date.now() + t.left * 1000;
      save(); paintLive(); openLive(true);
    });
    el.addEventListener('keydown', e => { if (e.target === el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openLive(!el.classList.contains('open')); } });
  }
  if (t.end && timerLeft(t) === 0) { // abgelaufen
    t.end = null; t.left = 0; t.done = true; save(); paintLive(); openLive(true);
    buzz([60, 80, 60, 80, 120]); chime();
    const r = liveEl.getBoundingClientRect(); setTimeout(() => confetti(r.left + r.width / 2, r.top + r.height / 2), 250);
    return;
  }
  paintLive();
}
setInterval(syncLive, 500);
document.addEventListener('visibilitychange', () => { if (!document.hidden) syncLive(); });
document.addEventListener('pointerdown', e => { if (liveEl?.classList.contains('open') && !liveEl.contains(e.target) && !getTimer()?.done) openLive(false); });
function startTimer(min, label) {
  data.settings.timer = { total: min * 60, end: Date.now() + min * 60000, left: min * 60, label: label.trim().slice(0, 40) };
  save(); syncLive();
}
function openTimerSheet() {
  if (getTimer()) { syncLive(); return openLive(true); }
  let min = data.settings.timerMin || 25;
  const el = openSheet(`
    <div class="q-bd" data-close></div>
    <form class="q-card" id="tf" autocomplete="off">
      <div class="q-top"><h2>Fokus-Timer</h2><button type="button" class="iconbtn sm" data-close aria-label="Schließen">${ic('x')}</button></div>
      <div class="tbig" id="tbig" aria-live="polite"></div>
      <div class="dchips tmins" role="radiogroup" aria-label="Dauer">${[5, 15, 25, 45, 60].map(m => `<button type="button" class="dchip" role="radio" data-min="${m}">${m} Min.</button>`).join('')}</div>
      <label class="field"><span>Woran arbeitest du? (optional)</span><input id="tl" maxlength="40" placeholder="z. B. Steuererklärung" enterkeyhint="go"></label>
      <button class="btn primary big" type="submit">Starten</button>
    </form>`, { label: 'Fokus-Timer', cls: 'quick timer' });
  const paint = pop => {
    el.querySelectorAll('[data-min]').forEach(b => { const on = +b.dataset.min === min; b.setAttribute('aria-checked', on); b.classList.toggle('on', on); });
    $('#tbig', el).textContent = fmtClock(min * 60); if (pop) popEl($('#tbig', el));
  };
  paint();
  el.addEventListener('click', e => { const b = e.target.closest('[data-min]'); if (b) { min = +b.dataset.min; buzz(6); paint(true); } });
  $('#tf', el).addEventListener('submit', e => {
    e.preventDefault();
    data.settings.timerMin = min; const label = $('#tl', el).value;
    buzz(12); history.back(); setTimeout(() => startTimer(min, label), 300);
  });
}

addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && data) { e.preventDefault(); if (!$('.sheet.spot')) openSpot(); } });

/* ---------- Kontextmenü: To-do gedrückt halten (wie bei iOS) ---------- */
// Die Zeile hebt sich aus dem weichgezeichneten Hintergrund, darunter klappt ein Menü auf.
function todoMenu(id, li) {
  const t = data.todos.find(x => x.id === id); if (!t || !li.isConnected) return;
  buzz(16);
  const r = li.getBoundingClientRect(), below = r.bottom + 290 < innerHeight;
  const items = [
    [t.done ? 'reopen' : 'done', t.done ? 'Wieder öffnen' : 'Erledigt', t.done ? 'back' : 'check'],
    ['today', 'Heute', 'cal'], ['tmr', 'Morgen', 'clock'], ['pick', 'Datum wählen …', 'cal'],
    ['rename', 'Umbenennen', 'edit'], ['del', 'Löschen', 'trash'],
  ];
  const el = document.createElement('div');
  el.className = 'ctx'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Aktionen für ' + t.text);
  el.innerHTML = `<div class="ctx-bg"></div>
    <div class="ctx-lift" style="left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px"></div>
    <div class="ctx-menu ${below ? 'down' : 'up'}" role="menu" style="left:${Math.max(14, Math.min(r.left, innerWidth - 254))}px;${below ? `top:${r.bottom + 10}px` : `bottom:${innerHeight - r.top + 10}px`}">
      ${items.map(([k, label, icon], i) => `<button type="button" role="menuitem" data-k="${k}" class="${k === 'del' ? 'red' : ''}" style="--i:${i}"><span>${label}</span>${ic(icon)}</button>`).join('')}
    </div>`;
  const clone = li.cloneNode(true); clone.classList.remove('pop', 'swiping', 'armed'); clone.removeAttribute('style'); clone.querySelectorAll('[id]').forEach(x => x.removeAttribute('id'));
  clone.setAttribute('aria-hidden', 'true'); clone.inert = true;
  el.querySelector('.ctx-lift').append(clone);
  document.body.append(el); li.classList.add('lifted');
  requestAnimationFrame(() => el.classList.add('in'));
  const prev = document.activeElement;
  el.querySelector('[data-k]').focus({ preventScroll: true });
  const close = then => {
    if (!el.isConnected || el.classList.contains('out')) return;
    el.classList.remove('in'); el.classList.add('out'); li.classList.remove('lifted');
    removeEventListener('keydown', key, true);
    setTimeout(() => { el.remove(); then?.(); if (!then) prev?.focus?.({ preventScroll: true }); }, reduced() ? 0 : 260);
  };
  const key = e => { if (e.key === 'Escape') { e.preventDefault(); close(); } };
  addEventListener('keydown', key, true);
  el.querySelector('.ctx-bg').addEventListener('click', () => close());
  el.querySelector('.ctx-lift').addEventListener('click', () => close());
  el.querySelector('.ctx-menu').addEventListener('click', e => {
    const b = e.target.closest('[data-k]'); if (!b) return; buzz(8);
    const k = b.dataset.k;
    close(async () => {
      if (!data.todos.includes(t)) return;
      if (k === 'done' || k === 'reopen') { countDone(t, k === 'done'); t.done = k === 'done'; t.doneAt = Date.now(); if (t.done) markDay(); save(); renderTab(); return toast(t.done ? 'Erledigt' : 'Wieder offen'); }
      if (k === 'today' || k === 'tmr') { t.due = k === 'today' ? todayIso() : dateIsoOffset(1); save(); renderTab(); return; }
      if (k === 'pick') return pickTodoDate(t.id);
      if (k === 'del') return removeTodo(t.id, document.querySelector(`.todo [data-toggle="${t.id}"]`)?.closest('.todo'));
      if (k === 'rename') {
        const v = await dialog({ title: 'Umbenennen', fields: [{ name: 't', label: 'Aufgabe', type: 'text', inputmode: 'text', value: t.text }], ok: 'Sichern' });
        if (v?.t?.trim()) { t.text = v.t.trim().slice(0, 300); save(); renderTab(); }
      }
    });
  });
}

/* ---------- Suche über alles (wie Spotlight) ---------- */
const fold = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
function hl(text, q) { // Treffer hervorheben
  const t = String(text || ''); if (!q) return esc(t);
  const i = fold(t).indexOf(q); if (i < 0) return esc(t);
  return esc(t.slice(0, i)) + '<mark>' + esc(t.slice(i, i + q.length)) + '</mark>' + esc(t.slice(i + q.length));
}
function snip(text, q) { // Ausschnitt rund um den Treffer
  const t = String(text || '').replace(/\s+/g, ' ').trim(), i = q ? fold(t).indexOf(q) : -1;
  if (i < 0) return t.slice(0, 70);
  const a = Math.max(0, i - 24);
  return (a ? '…' : '') + t.slice(a, a + 70);
}
function openSpot() {
  if ($('.sheet.spot')) return;
  const el = openSheet(`
    <div class="spot-bg" data-close></div>
    <div class="spot-in">
      <label class="spot-field">${ic('search')}<input id="sq" type="search" placeholder="Suchen in Lumen" aria-label="Suchen in Lumen" autocomplete="off" enterkeyhint="search"><span class="kbds" aria-hidden="true"><kbd>⌘</kbd><kbd>K</kbd></span></label>
      <button type="button" class="textbtn spot-x" data-close>Abbrechen</button>
    </div>
    <div class="spot-res" id="sres" aria-live="polite"></div>`, { label: 'Suchen', cls: 'spot' });
  const input = $('#sq', el), box = $('#sres', el);
  const row = (go, icon, color, title, sub, i) => `<button type="button" class="spot-row" data-go="${go}" style="--a:var(--${color});--i:${i}"><span class="spot-ic">${ic(icon)}</span><span class="spot-tx"><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</span></button>`;
  const group = (name, rows) => rows.length ? `<h3 class="spot-h">${name}</h3><div class="spot-grp">${rows.join('')}</div>` : '';
  let k = 0;
  const paint = () => {
    const q = fold(input.value.trim()); k = 0;
    if (!q) { // Vorschläge
      box.innerHTML = group('Vorschläge', [
        row('new:note', 'note', 'yellow', 'Neue Notiz', '', k++), row('new:todo', 'check', 'orange', 'Neues To-do', '', k++),
        row('new:timer', 'clock', 'pink', 'Fokus-Timer starten', '', k++), row('new:card', 'card', 'violet', 'Karte hinzufügen', '', k++),
      ]) + group('Zuletzt bearbeitet', [...data.notes].sort((a, b) => b.updated - a.updated).slice(0, 3).map(n => row('note:' + n.id, n.audio?.length ? 'mic' : 'note', n.color, esc(noteTitle(n)), esc(fmtDay(n.updated)), k++)));
      return;
    }
    const has = (...xs) => xs.some(x => fold(x).includes(q));
    const notes = data.notes.filter(n => has(n.title, n.body)).slice(0, 6).map(n => row('note:' + n.id, n.audio?.length ? 'mic' : 'note', n.color, hl(noteTitle(n), q), hl(snip(n.title && fold(n.title).includes(q) ? n.body : n.body || '', q), q), k++));
    const todos = data.todos.filter(t => has(t.text)).slice(0, 6).map(t => row('todo:' + t.id, t.done ? 'check' : 'check', t.done ? 'green' : 'orange', hl(t.text, q), t.done ? 'Erledigt' : t.due ? esc(fmtDue(t.due, t.time)) : 'Offen', k++));
    const cards = data.cards.filter(c => has(c.name, c.holder, c.email, c.member)).slice(0, 6).map(c => row('card:' + c.id, c.type === 'mail' ? 'mail' : c.type === 'member' ? 'bag' : 'card', 'violet', hl(c.name, q), hl(c.type === 'mail' ? c.email : c.holder, q), k++));
    const invs = (data.invoices || []).filter(i => has(i.vendor, i.number, i.note)).slice(0, 6).map(i => row('inv:' + i.id, 'receipt', 'green', hl(i.vendor, q), esc(money(i.gross, i.currency)) + (i.status === 'paid' ? ' · Bezahlt' : ''), k++));
    const html = group('Notizen', notes) + group('To-dos', todos) + group('Karten', cards) + group('Rechnungen', invs);
    box.innerHTML = html || `<div class="spot-none">${ic('search')}<b>Keine Treffer</b><p>Nichts enthält „${esc(input.value.trim())}“.</p></div>`;
  };
  paint();
  input.addEventListener('input', paint);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); box.querySelector('.spot-row')?.click(); } });
  box.addEventListener('click', e => {
    const b = e.target.closest('[data-go]'); if (!b) return;
    const [kind, id] = b.dataset.go.split(':'); buzz(8);
    history.back(); // Suche schließen, dann öffnen
    setTimeout(() => {
      if (!data) return;
      if (kind === 'new') return id === 'note' ? openNote() : id === 'todo' ? openQuickTodo() : id === 'timer' ? openTimerSheet() : openCardForm();
      if (kind === 'note') return openNote(id);
      if (kind === 'card') return openViewer(id);
      if (kind === 'inv') return openInvoice(id);
      if (kind === 'todo') {
        if (tab !== 'todos') switchTab('todos');
        setTimeout(() => { const li = document.querySelector(`#screen .todo [data-toggle="${id}"]`)?.closest('.todo'); if (!li) return; li.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' }); li.classList.add('flash'); setTimeout(() => li.classList.remove('flash'), 1600); }, 450);
      }
    }, 300);
  });
  setTimeout(() => input.focus(), 120);
}
// Auf der Startseite oben nach unten ziehen öffnet die Suche
{
  let y0 = null, pulled = 0;
  app.addEventListener('touchstart', e => { y0 = tab === 'home' && !sheets.length && scrollY <= 0 && e.touches.length === 1 ? e.touches[0].clientY : null; pulled = 0; }, { passive: true });
  app.addEventListener('touchmove', e => {
    if (y0 == null) return;
    const d = e.touches[0].clientY - y0, home = $('#screen .home');
    pulled = d;
    if (home && d > 0) home.style.transform = `translateY(${Math.min(70, d * .35).toFixed(1)}px)`;
  }, { passive: true });
  app.addEventListener('touchend', () => {
    if (y0 == null) return; y0 = null;
    const home = $('#screen .home');
    if (home) { home.style.transition = 'transform .4s var(--ease)'; home.style.transform = ''; setTimeout(() => { home.style.transition = ''; }, 400); }
    if (pulled > 90) { buzz(10); openSpot(); }
  });
}

/* ---------- Sprachnotizen: Aufnahme- und Player-Insel ---------- */
const canRec = !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
const fmtT = s => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${pad2(s % 60)}`; };
let rec = null, play = null, actT = null, recDone = Promise.resolve(); // recDone: Sichern der letzten Aufnahme (läuft nach dem Stoppen noch kurz)
const BARS = (n, cls = '') => `<span class="bars ${cls}" aria-hidden="true">${Array.from({ length: n }, (_, k) => `<i style="--k:${k};--hh:${(.35 + .65 * Math.abs(Math.sin(k * 1.9))).toFixed(2)}"></i>`).join('')}</span>`;
function actShow(kind) {
  let el = $('.live.act');
  if (!el) {
    el = document.createElement('div'); el.className = 'live act'; el.setAttribute('role', 'button'); el.tabIndex = 0;
    document.body.append(el); requestAnimationFrame(() => el.classList.add('in'));
    el.addEventListener('click', actClick);
    el.addEventListener('keydown', e => { if (e.target === el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); actOpen(!el.classList.contains('open')); } });
  }
  el.dataset.kind = kind; el.classList.remove('open', 'paused'); document.body.classList.remove('act-open');
  if (kind === 'rec') el.innerHTML = `<div class="ac-c"><span class="rdot"></span>${BARS(9, 'rlv')}<span class="ac-time">0:00</span></div>
    <div class="ac-x rec"><button type="button" class="ac-btn stop" data-a="stop" aria-label="Aufnahme beenden" tabindex="-1">${ic('stop')}</button>
      <button type="button" class="ac-btn" data-a="pause" aria-label="Aufnahme pausieren" tabindex="-1">${ic('pause')}</button>
      <span class="ac-info"><small>Aufnahme</small><b class="ac-time">0:00</b></span></div>`;
  else {
    const n = play.n, m = play.memo;
    el.style.setProperty('--ma', `var(--${n.color})`);
    el.innerHTML = `<div class="ac-c"><span class="cover"></span>${BARS(7, 'anim')}<span class="ac-time">0:00</span></div>
      <div class="ac-x play">
        <div class="ac-top"><span class="cover big">${ic('mic')}</span><span class="ac-meta"><b>${esc(noteTitle(n))}</b><small>Sprachnotiz · ${fmtDay(m.at)}</small></span>${BARS(5, 'anim')}</div>
        <div class="ac-bar"><span class="ac-el">0:00</span><span class="ac-track" data-a="seek"><i></i></span><span class="ac-rest">-${fmtT(m.dur)}</span></div>
        <div class="ac-ctl"><button type="button" data-a="back" aria-label="10 Sekunden zurück" tabindex="-1">${ic('back10')}</button>
          <button type="button" class="big fill" data-a="toggle" aria-label="Pause" tabindex="-1">${ic('pause')}</button>
          <button type="button" data-a="fwd" aria-label="10 Sekunden vor" tabindex="-1">${ic('fwd10')}</button>
          <button type="button" data-a="close" aria-label="Wiedergabe beenden" tabindex="-1">${ic('x')}</button></div></div>`;
  }
  el.setAttribute('aria-label', kind === 'rec' ? 'Aufnahme läuft' : 'Sprachnotiz wird abgespielt');
  document.body.classList.add('has-act');
  return el;
}
function actOpen(open) {
  const el = $('.live.act'); if (!el) return;
  el.classList.toggle('open', open); document.body.classList.toggle('act-open', open);
  el.querySelectorAll('.ac-x button').forEach(b => { b.tabIndex = open ? 0 : -1; });
  clearTimeout(actT); if (open && el.dataset.kind === 'rec') actT = setTimeout(() => actOpen(false), 6000);
}
function actHide() {
  const el = $('.live.act'); if (!el) return;
  clearTimeout(actT); el.classList.remove('in', 'open'); el.classList.add('bye');
  document.body.classList.remove('has-act', 'act-open');
  setTimeout(() => el.remove(), reduced() ? 0 : 400);
}
function actClick(e) {
  const b = e.target.closest('[data-a]'), el = e.currentTarget;
  if (!b) return actOpen(!el.classList.contains('open'));
  e.stopPropagation(); buzz(8);
  const a = b.dataset.a;
  if (a === 'stop') return stopRec();
  if (a === 'pause') { recPause(); return actOpen(true); }
  if (a === 'toggle') return togglePlay();
  if (a === 'back') return seekPlay(-10);
  if (a === 'fwd') return seekPlay(10);
  if (a === 'close') return stopPlay();
  if (a === 'seek' && play) { const r = b.getBoundingClientRect(); play.audio.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * play.memo.dur; paintPlay(); }
}
document.addEventListener('pointerdown', e => { const el = $('.live.act.open'); if (el && !el.contains(e.target)) actOpen(false); });
// Aufnahme
const recTime = () => rec ? (rec.acc + (rec.paused ? 0 : performance.now() - rec.t0)) / 1000 : 0;
async function startRec(n, btn, onSaved) {
  if (rec) return;
  stopPlay();
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
  catch { return toast('Mikrofon nicht erlaubt'); }
  const mime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find(m => MediaRecorder.isTypeSupported?.(m)) || '';
  let mr; try { mr = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 32000 } : undefined); }
  catch { stream.getTracks().forEach(t => t.stop()); return toast('Aufnahme nicht möglich'); }
  const ctx = new (window.AudioContext || window.webkitAudioContext)(), an = ctx.createAnalyser(); an.fftSize = 512;
  ctx.createMediaStreamSource(stream).connect(an);
  rec = { mr, stream, ctx, an, buf: new Float32Array(an.fftSize), chunks: [], levels: [], acc: 0, t0: performance.now(), paused: false, n, btn, onSaved, level: 0, last: 0 };
  mr.ondataavailable = e => { if (e.data.size) rec?.chunks.push(e.data); };
  mr.start(1000);
  btn?.classList.add('on'); btn?.setAttribute('aria-label', 'Aufnahme beenden');
  buzz(18); actShow('rec'); recTick();
}
function recTick() {
  if (!rec) return;
  rec.an.getFloatTimeDomainData(rec.buf);
  let sum = 0; for (const v of rec.buf) sum += v * v;
  rec.level = rec.paused ? rec.level * .8 : rec.level * .55 + Math.min(1, Math.sqrt(sum / rec.buf.length) * 5) * .45;
  const now = performance.now();
  if (!rec.paused && now - rec.last > 70) { rec.levels.push(rec.level); rec.last = now; }
  const el = $('.live.act'), t = recTime();
  if (el) {
    el.querySelectorAll('.ac-time').forEach(x => { const v = fmtT(t); if (x.textContent !== v) x.textContent = v; });
    el.querySelectorAll('.bars.rlv i').forEach((b, k) => { b.style.height = (4 + rec.level * 18 * (.45 + .55 * Math.abs(Math.sin(now / 160 + k * 1.3)))).toFixed(1) + 'px'; });
  }
  if (t >= 300) return stopRec(); // höchstens 5 Minuten pro Aufnahme
  rec.raf = requestAnimationFrame(recTick);
}
function recPause() {
  if (!rec) return; const el = $('.live.act');
  if (rec.paused) { try { rec.mr.resume(); } catch {} rec.t0 = performance.now(); rec.paused = false; }
  else { try { rec.mr.pause(); } catch {} rec.acc += performance.now() - rec.t0; rec.paused = true; }
  el?.classList.toggle('paused', rec.paused);
  const b = el?.querySelector('[data-a="pause"]'); if (b) { b.innerHTML = ic(rec.paused ? 'mic' : 'pause'); b.setAttribute('aria-label', rec.paused ? 'Aufnahme fortsetzen' : 'Aufnahme pausieren'); }
}
function wavePeaks(lv, n) {
  if (!lv.length) return Array(n).fill(.12);
  const out = [];
  for (let i = 0; i < n; i++) { const a = Math.floor(i * lv.length / n), b = Math.max(a + 1, Math.floor((i + 1) * lv.length / n)); out.push(Math.max(...lv.slice(a, b))); }
  const m = Math.max(...out) || 1;
  return out.map(v => Math.max(.08, +(v / m).toFixed(2)));
}
function stopRec(discard) {
  if (!rec) return Promise.resolve();
  const r = rec; rec = null; cancelAnimationFrame(r.raf);
  const dur = (r.acc + (r.paused ? 0 : performance.now() - r.t0)) / 1000;
  r.btn?.classList.remove('on'); r.btn?.setAttribute('aria-label', 'Sprachnotiz aufnehmen');
  return recDone = new Promise(res => {
    let done = false;
    r.mr.onstop = async () => {
      if (done) return; done = true;
      r.stream.getTracks().forEach(t => t.stop()); r.ctx.close().catch(() => {});
      actHide();
      if (discard || !data) return res();
      if (dur < .7) { toast('Aufnahme zu kurz'); return res(); }
      const blob = new Blob(r.chunks, { type: r.mr.mimeType || 'audio/webm' });
      const src = await new Promise(ok => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.onerror = () => ok(''); fr.readAsDataURL(blob); });
      if (!src || !data) return res();
      const memo = { id: uid(), src, dur: Math.round(dur * 10) / 10, peaks: wavePeaks(r.levels, 40), at: Date.now() }, n = r.n;
      (n.audio ||= []).push(memo); n.updated = Date.now(); if (!data.notes.includes(n)) data.notes.push(n); save();
      buzz([12, 50, 12]);
      island({ icon: 'mic', color: 'red', title: `${fmtT(dur)} · Aufnahme gespeichert`, text: noteTitle(n), ms: 3200 });
      r.onSaved?.(memo); if (!sheets.length) renderTab(); res();
    };
    try { if (r.mr.state !== 'inactive') r.mr.stop(); else r.mr.onstop(); } catch { r.mr.onstop(); }
  });
}
// Wiedergabe
const playPos = () => play ? Math.min(play.memo.dur, play.audio.currentTime || 0) : 0;
function startPlay(n, m) {
  if (rec) return toast('Erst die Aufnahme beenden');
  if (play?.memo.id === m.id) return togglePlay();
  stopPlay(true);
  const audio = new Audio(m.src);
  play = { audio, memo: m, n };
  audio.onended = () => { if (play?.audio !== audio) return; paintPlay(); setTimeout(() => { if (play?.audio === audio && audio.paused) stopPlay(); }, 1400); };
  audio.play().catch(() => { toast('Abspielen nicht möglich'); stopPlay(); });
  actShow('play'); buzz(8); playTick();
}
function togglePlay() {
  if (!play) return; const a = play.audio;
  if (a.paused) { if (a.ended || playPos() >= play.memo.dur - .05) a.currentTime = 0; a.play().catch(() => {}); } else a.pause();
  paintPlay();
}
function seekPlay(d) { if (!play) return; play.audio.currentTime = Math.max(0, Math.min(play.memo.dur, playPos() + d)); paintPlay(); }
function stopPlay(keep) {
  if (!play) return;
  const p = play; play = null; p.audio.pause(); cancelAnimationFrame(p.raf);
  if (!keep) actHide();
  document.querySelectorAll('.memo').forEach(r => paintMemo(r, null));
}
function playTick() { if (!play) return; paintPlay(); play.raf = requestAnimationFrame(playTick); }
function paintMemo(row, p) {
  const on = p && row.dataset.memo === p.memo.id, k = on ? playPos() / (p.memo.dur || 1) : 0, playing = on && !p.audio.paused;
  row.classList.toggle('playing', playing);
  const bars = row.querySelectorAll('.mwave i'), lim = Math.round(k * bars.length);
  bars.forEach((b, i) => b.classList.toggle('on', on && i < lim));
  const pb = row.querySelector('.mplay'), want = playing ? 'pause' : 'play';
  if (pb.dataset.ic !== want) { pb.dataset.ic = want; pb.innerHTML = ic(want); pb.setAttribute('aria-label', playing ? 'Pause' : 'Abspielen'); }
  const tt = row.querySelector('.mtime'), v = on && (playing || k > 0) ? fmtT(playPos()) : fmtT(+row.dataset.dur); if (tt.textContent !== v) tt.textContent = v;
}
function paintPlay() {
  const p = play; if (!p) return;
  const el = $('.live.act[data-kind="play"]'), pos = playPos(), playing = !p.audio.paused;
  if (el) {
    el.classList.toggle('paused', !playing);
    el.querySelectorAll('.bars.anim').forEach(b => b.classList.toggle('on', playing));
    el.querySelector('.ac-c .ac-time').textContent = fmtT(pos);
    el.querySelector('.ac-el').textContent = fmtT(pos); el.querySelector('.ac-rest').textContent = '-' + fmtT(p.memo.dur - pos);
    el.querySelector('.ac-track').style.setProperty('--p', (pos / (p.memo.dur || 1)).toFixed(4));
    const t = el.querySelector('[data-a="toggle"]'), want = playing ? 'pause' : 'play';
    if (t.dataset.ic !== want) { t.dataset.ic = want; t.innerHTML = ic(want); t.setAttribute('aria-label', playing ? 'Pause' : 'Abspielen'); }
  }
  document.querySelectorAll('.memo').forEach(r => paintMemo(r, p));
}
// Sprachnotizen im Notiz-Editor
function bindMemos(el, n) {
  const box = $('#memos', el), btn = $('#nrec', el);
  const render = () => {
    if (!box.isConnected) return;
    box.innerHTML = (n.audio || []).map(m => `<div class="memo" data-memo="${m.id}" data-dur="${m.dur}">
      <button type="button" class="mplay" data-mplay="${m.id}" aria-label="Abspielen">${ic('play')}</button>
      <span class="mwave" aria-hidden="true">${m.peaks.map(h => `<i style="--h:${h}"></i>`).join('')}</span>
      <span class="mtime">${fmtT(m.dur)}</span>
      <button type="button" class="iconbtn sm" data-mdel="${m.id}" aria-label="Sprachnotiz löschen">${ic('x')}</button></div>`).join('');
    box.querySelectorAll('.memo').forEach(r => paintMemo(r, play));
  };
  render();
  if (btn && rec?.n === n) { btn.classList.add('on'); rec.btn = btn; rec.onSaved = render; }
  btn?.addEventListener('click', () => (rec?.n === n ? stopRec() : rec ? toast('Es läuft schon eine Aufnahme') : startRec(n, btn, render)));
  box.addEventListener('click', e => {
    const p = e.target.closest('[data-mplay]'), d = e.target.closest('[data-mdel]');
    if (p) { const m = n.audio.find(x => x.id === p.dataset.mplay); if (m) startPlay(n, m); }
    if (d) {
      const i = n.audio.findIndex(x => x.id === d.dataset.mdel); if (i < 0) return;
      const [m] = n.audio.splice(i, 1);
      if (play?.memo.id === m.id) stopPlay();
      const row = d.closest('.memo'); buzz(8);
      const go = () => { render(); save(); };
      if (reduced()) go(); else { row.classList.add('out'); setTimeout(go, 260); }
      toast('Sprachnotiz gelöscht', { undo: () => { if (!n.audio.some(x => x.id === m.id)) { n.audio.splice(Math.min(i, n.audio.length), 0, m); save(); render(); if (!sheets.length) renderTab(); } } });
    }
  });
}

/* ---------- Klicks ---------- */
app.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || !data) return;
  if (b.dataset.tab) return switchTab(b.dataset.tab);
  if (b.dataset.go) return switchTab(b.dataset.go);
  if (b.dataset.note) return openNote(b.dataset.note);
  if (b.dataset.card) return openViewer(b.dataset.card);
  if (b.dataset.inv) return openInvoice(b.dataset.inv);
  if (b.dataset.tdue) return pickTodoDate(b.dataset.tdue);
  if (b.dataset.toggle) return toggleTodo(b.dataset.toggle, b);
  if (b.dataset.deltodo) return removeTodo(b.dataset.deltodo, b.closest('.todo'));
  if (b.dataset.new === 'note') return openNote();
  if (b.dataset.new === 'card') return openCardForm();
  if (b.dataset.new === 'todo') { tab = 'todos'; renderTab(); return $('#tt').focus(); }
  if (b.dataset.add) {
    const k = b.dataset.add;
    setMenu(false); $('#fab').focus({ preventScroll: true });
    setTimeout(() => (k === 'timer' ? openTimerSheet() : k === 'note' ? openNote() : k === 'todo' ? openQuickTodo() : k === 'invoice' ? openInvoiceForm() : openCardForm(undefined, k.startsWith('card:') ? k.slice(5) : undefined)), 150);
    return;
  }
  if (b.id === 'fab') { if (tab === 'home' || tab === 'cards') return setMenu(!menuOpen, e.detail === 0); if (tab === 'notes') openNote(); else if (tab === 'cards') openCardForm(); else if (tab === 'todos') $('#tt').focus(); return; }
  const act = b.dataset.act;
  if (act === 'lock') return lockNow();
  if (act === 'settings') return openSettings(b);
  if (act === 'customize') return openCustomize(b);
  if (act === 'search') return openSpot();
  if (act === 'invlist') return openInvoiceList();
  if (act === 'bio') return enrollBio().then(renderTab);
  if (act === 'cleardone') {
    const gone = data.todos.filter(t => t.done);
    const go = () => {
      data.todos = data.todos.filter(t => !t.done); save(); renderTab();
      toast(gone.length === 1 ? '1 To-do gelöscht' : `${gone.length} To-dos gelöscht`, { undo: () => {
        if (!data) return; const have = new Set(data.todos.map(t => t.id));
        data.todos.push(...gone.filter(t => !have.has(t.id))); save(); if (!sheets.length) renderTab();
      } });
    };
    const rows = [...document.querySelectorAll('.todos .todo.done')];
    if (!rows.length || reduced()) return go();
    rows.forEach((li, k) => { li.style.height = li.offsetHeight + 'px'; void li.offsetHeight; li.style.transitionDelay = (k * 40) + 'ms'; li.classList.add('out'); });
    buzz(8); return setTimeout(go, 320 + rows.length * 40);
  }
});

boot();
