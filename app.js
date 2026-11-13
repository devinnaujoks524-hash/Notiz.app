import { Vault } from './vault.js';
import { cardMarkup, mountViewer, THEMES } from './viz.js';

const $ = (s, r = document) => r.querySelector(s);
const app = $('#app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
const buzz = ms => { try { navigator.vibrate?.(ms); } catch {} };
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
  t.classList.toggle('act', !!undo); t.classList.add('show'); yieldLive();
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
const getTheme = () => document.documentElement.dataset.theme === 'glass' ? 'glass' : 'classic';
const getWall = () => document.documentElement.dataset.wall || 'aurora';
function applyTheme(theme, wall) {
  const r = document.documentElement;
  if (theme === 'glass') r.dataset.theme = 'glass'; else delete r.dataset.theme;
  r.dataset.wall = WALLS.some(w => w[0] === wall) ? wall : 'aurora';
  $('meta[name="theme-color"]')?.setAttribute('content', theme === 'glass' ? '#05050a' : '#000000');
  // offene Blätter an das Design anpassen (Glas: eigenes Hintergrundbild, kein Kreis-Ausschnitt – der würde die Lichtbrechung abschalten)
  sheets.forEach(({ el }) => {
    if (theme === 'glass' && !el.classList.contains('quick')) { el.classList.remove('morph'); el.querySelector('.mgear')?.remove(); if (!el.querySelector(':scope > .wall')) el.insertAdjacentHTML('afterbegin', '<div class="wall" aria-hidden="true"></div>'); }
  });
  lgSync();
}

/* ---------- Flüssiges Glas: echte Lichtbrechung am Rand ---------- */
// Jede Glasfläche bekommt einen eigenen SVG-Filter als backdrop-filter: Eine Verschiebungskarte biegt den Hintergrund am Rand
// wie eine Linse, eine zweite Karte legt den Lichtrand darüber. Das können nur Chromium-Browser (Chrome, Edge, Samsung Internet);
// überall sonst bleibt es bei mattem Glas mit Rand per CSS.
const LG_KINDS = [
  ['dark', '#toast, .island, .live, .dlg, .nbar, .ulock', { blur: 8, scale: 54, bezel: 20, rim: 1 }],
  ['bar', 'nav.tabs, .fab', { blur: 9, scale: 60, bezel: 22, rim: 1 }], // liegt über scrollendem Inhalt: stärker weichzeichnen, damit die Beschriftung lesbar bleibt
  ['clear', '.iconbtn:not(.sm), .fm-item, .search, .addrow, .seg, .dchip, .more, .btn:not(.primary):not(.danger)', { blur: 2.2, scale: 62, bezel: 22, rim: 1 }],
  ['frost', '.note, .todo, .group, .invrow, .prog, .pinnote, .sumbox, .pill, .hctile, .themetile, .hcprev, .nbody, .field input, .field select, .field textarea', { blur: 7, scale: 48, bezel: 18, rim: .9 }],
];
const LG_SEL = LG_KINDS.map(k => k[1]).join(', ');
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
  const want = lg.ok && getTheme() === 'glass' && lsGet('lumen-lens') !== '0' && !matchMedia('(prefers-reduced-transparency: reduce), (prefers-contrast: more)').matches;
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
        <input name="${f.name}" type="${f.type || 'password'}" inputmode="${f.inputmode || 'numeric'}" autocomplete="off" ${f.min ? `minlength="${f.min}"` : ''} required></label>`).join('')}
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
  if (glass && !/\bquick\b/.test(cls)) el.insertAdjacentHTML('afterbegin', '<div class="wall" aria-hidden="true"></div>'); // Glas: das Blatt bringt sein eigenes Hintergrundbild mit und schiebt sich von unten hoch
  if (!glass && origin?.isConnected && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const r = origin.getBoundingClientRect(), ox = r.left + r.width / 2, oy = r.top + r.height / 2;
    const rad = Math.hypot(Math.max(ox, innerWidth - ox), Math.max(oy, innerHeight - oy)) + 12;
    el.classList.add('morph');
    el.style.cssText = `--ox:${ox.toFixed(1)}px;--oy:${oy.toFixed(1)}px;--r:${rad.toFixed(1)}px;--r0:${(Math.min(r.width, r.height) / 2).toFixed(1)}px`;
    el.insertAdjacentHTML('beforeend', `<span class="mgear" aria-hidden="true" style="left:${ox.toFixed(1)}px;top:${oy.toFixed(1)}px">${ic(originIcon || 'gear')}</span>`);
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
  for (let i = sheets.length - 1; i >= 0; i--) { sheets[i].el.classList.toggle('under', cover); if (!sheets[i].el.classList.contains('quick')) cover = true; }
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
  await flush();
  Vault.lock(); data = null;
  if (updateReady) return location.reload();
  renderLock();
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
  setTimeout(() => checkTodoIsland(true), 1500);
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
  s.querySelectorAll('.note, .cardmini, .todo, .invrow, .search, .empty').forEach((el, i) => el.style.setProperty('--i', Math.min(i, 12)));
  s.classList.add('stag'); setTimeout(() => s.classList.remove('stag'), 1100);
}

// Weicher Tab-Wechsel: alter Inhalt blendet kurz aus, neuer gleitet ein, die Leiste reagiert sofort.
let swapId = 0;
function switchTab(next) {
  const screen = $('#screen');
  if (next === tab) { scrollTo({ top: 0, behavior: 'smooth' }); return; }
  tab = next; buzz(6);
  document.querySelectorAll('[data-tab]').forEach(b => b.dataset.tab === tab ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
  setMenu(false);
  const id = ++swapId;
  const show = () => {
    if (id !== swapId) return;
    screen.getAnimations?.().forEach(a => a.cancel()); // Ausblend-Animation (fill: forwards) lösen, sonst bleibt der Bildschirm bei Opazität 0 hängen
    enter = true; renderTab(); scrollTo(0, 0); if (tab !== 'home') staggerScreen();
    if (tab !== 'home' && screen.animate) screen.animate([getTheme() === 'glass' ? { transform: 'translateY(18px)' } : { opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: getTheme() === 'glass' ? 460 : 340, easing: 'cubic-bezier(.2,.8,.2,1)' });
  };
  if (!screen?.animate || matchMedia('(prefers-reduced-motion: reduce)').matches) return show();
  const exit = screen.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-6px)' }], { duration: 120, easing: 'ease-in', fill: 'forwards' });
  exit.finished.then(show).catch(show);
}

const header = title => `<header class="top"><h1>${title}</h1><div class="hbtns">
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
  const cfg = homeCfg();
  return `<div class="home${cls} al-${cfg.align} cs-${cfg.clockSize}">
    <div class="hometop"><div class="hbtns">
      <button class="iconbtn" data-act="customize" aria-label="Startseite anpassen">${ic('sliders')}</button>
      <button class="iconbtn" data-act="settings" aria-label="Einstellungen">${ic('gear')}</button>
      ${Vault.hasCode ? `<button class="iconbtn" data-act="lock" aria-label="Jetzt sperren">${ic('lock')}</button>` : ''}</div></div>
    ${homeBlock(cfg, p, true)}
    ${todos}
    ${pinsHome(cfg)}
    ${invHome()}
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
      <span class="dot"></span><b>${esc(n.title || firstLine(n.body) || 'Ohne Titel')}</b>
      <p>${esc((n.title ? n.body : n.body.split('\n').slice(1).join('\n')).slice(0, 90))}</p></button>`).join('')}</div>
  </section>`;
}
function viewNotes() {
  return `${header('Notizen')}
    <label class="search">${ic('search')}<input id="q" type="search" placeholder="Durchsuchen" aria-label="Notizen durchsuchen" value="${esc(noteQ)}"></label>
    <div id="notegrid">${noteGrid()}</div>`;
}
function noteGrid() {
  const q = noteQ.trim().toLowerCase();
  const list = displayedNotes();
  if (!data.notes.length) return emptyState('note', 'Noch keine Notizen', 'Tippe auf + für deine erste Notiz.');
  if (!list.length) return emptyState('search', 'Nichts gefunden', `Keine Notiz enthält „${esc(noteQ)}“.`);
  return `<div class="notes">${list.map(n => `
    <button class="note" data-note="${n.id}" style="--a:var(--${n.color})">
      <span class="ntop"><span class="dot"></span>${n.pinned ? `<span class="pinned">${ic('pin')}</span>` : ''}</span>
      <b>${esc(n.title || firstLine(n.body) || 'Ohne Titel')}</b>
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
      <button class="iconbtn" id="pin" aria-pressed="${n.pinned}" aria-label="Anheften">${ic('pin')}</button>
      <button class="iconbtn" id="del" aria-label="Notiz löschen">${ic('trash')}</button>
      <button class="btn primary sm" id="nsave">Sichern</button>
    </div>
    <input class="ntitle" id="nt" placeholder="Titel" aria-label="Titel" value="${esc(n.title)}">
    <div class="swatches" role="radiogroup" aria-label="Farbe">
      ${COLORS.map(c => `<button role="radio" aria-checked="${c === n.color}" aria-label="${c}" data-color="${c}" style="--a:var(--${c})"></button>`).join('')}
    </div>
    <textarea class="nbody" id="nb" placeholder="Schreib los …" aria-label="Notiztext">${esc(n.body)}</textarea>
    <p class="saved">${ic('lock')}Automatisch gespeichert · verschlüsselt</p>`,
  { label: 'Notiz', cls: 'editor', onClose: () => {
      if (!n.title.trim() && !n.body.trim()) data.notes = data.notes.filter(x => x.id !== n.id);
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
    const filled = n.title.trim() || n.body.trim();
    if (filled) touch();
    buzz(12); history.back();
    toast(filled ? 'Notiz gespeichert' : 'Leere Notiz verworfen');
  });
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
    <div class="ptx"><b>${all ? 'Alles geschafft' : `${doneToday} von ${total} erledigt`}</b><small>${all ? 'Für heute bist du fertig.' : doneToday ? 'Weiter so, heute läuft es.' : 'Dein Fortschritt für heute'}</small></div>
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
  t.done = !t.done; t.doneAt = Date.now(); save();
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
});
app.addEventListener('pointermove', e => {
  const s = swipe; if (!s) return;
  const dx = e.clientX - s.x, dy = e.clientY - s.y, ax = Math.abs(dx);
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
  const s = swipe; swipe = null; if (!s?.on) return;
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
  el.innerHTML = `<span class="isl-ic">${ic(o.icon || 'check')}</span><span class="isl-tx"><small>${esc(o.title)}</small><b>${esc(o.text)}</b></span>`;
  document.body.append(el); void el.offsetWidth; el.classList.add('in'); buzz([14, 40, 10]); yieldLive();
  let closed = false, y0 = null;
  const timer = setTimeout(() => close(), o.ms || 4300);
  const close = go => {
    if (closed) return; closed = true; clearTimeout(timer);
    el.classList.remove('in'); el.classList.add('out');
    setTimeout(() => { el.remove(); yieldLive(); nextIsland(); }, 520);
    if (go) o.onTap?.();
  };
  el.addEventListener('click', () => close(true));
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
    islandNotified.add(t.id); island({ title: 'Jetzt · ' + t.time, text: t.text, onTap: goTodos });
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
    save(); history.back(); toast(orig ? 'Karte aktualisiert' : 'Karte hinzugefügt');
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
    </div>
    <div class="group collapsible${getTheme() === 'glass' ? '' : ' collapsed'}" id="wallGroup"${getTheme() === 'glass' ? '' : ' inert'}>
      <div class="wallrow"><b>Hintergrund</b>
        <div class="swatches big" role="radiogroup" aria-label="Hintergrund">${WALLS.map(([k, n]) => `<button type="button" role="radio" data-wall="${k}" aria-label="${n}"></button>`).join('')}</div></div>
      <div class="row"><div><b>Lichtbrechung</b><small>${lg.ok ? 'Der Hintergrund biegt sich am Rand wie durch echtes Glas. Ausschalten, falls es ruckelt.' : 'In diesem Browser nicht verfügbar – geht in Chrome.'}</small></div>
        <button class="switch" id="lensSw" role="switch" aria-checked="${lg.ok && lsGet('lumen-lens') !== '0'}" aria-label="Lichtbrechung" ${lg.ok ? '' : 'disabled'}></button></div>
    </div>
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
