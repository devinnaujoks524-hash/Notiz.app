import { Vault } from './vault.js';
import { cardMarkup, mountViewer, THEMES } from './viz.js';

const $ = (s, r = document) => r.querySelector(s);
const app = $('#app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
const buzz = ms => { try { navigator.vibrate?.(ms); } catch {} };

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
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M4 7.5l8 6 8-6"/>',
  eye: '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
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
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600);
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
    d.addEventListener('close', () => {
      const v = d.returnValue === 'ok' ? Object.fromEntries(new FormData(d.querySelector('form'))) : null;
      d.remove(); res(v);
    });
    d.showModal();
  });
}

/* ---------- Sheets (mit Android-Zurück-Taste) ---------- */
function openSheet(html, { label, cls = '', onClose, origin } = {}) {
  const el = document.createElement('div');
  el.className = 'sheet ' + cls;
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', label || '');
  el.innerHTML = html;
  // Aus einem Knopf heraus aufgehen: Der Knopf wächst als Kreis zum ganzen Blatt, das Symbol dreht sich weg.
  if (origin?.isConnected && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const r = origin.getBoundingClientRect(), ox = r.left + r.width / 2, oy = r.top + r.height / 2;
    const rad = Math.hypot(Math.max(ox, innerWidth - ox), Math.max(oy, innerHeight - oy)) + 12;
    el.classList.add('morph');
    el.style.cssText = `--ox:${ox.toFixed(1)}px;--oy:${oy.toFixed(1)}px;--r:${rad.toFixed(1)}px;--r0:${(Math.min(r.width, r.height) / 2).toFixed(1)}px`;
    el.insertAdjacentHTML('beforeend', `<span class="mgear" aria-hidden="true" style="left:${ox.toFixed(1)}px;top:${oy.toFixed(1)}px">${ic('gear')}</span>`);
  }
  document.body.append(el);
  requestAnimationFrame(() => el.classList.add('in'));
  const prevFocus = document.activeElement;
  sheets.push({ el, onClose, prevFocus });
  history.pushState({ sheet: sheets.length }, '');
  el.addEventListener('click', e => { if (e.target.closest('[data-close]')) history.back(); });
  return el;
}
function popSheet() {
  const s = sheets.pop(); if (!s) return;
  s.onClose?.();
  s.el.classList.remove('in');
  setTimeout(() => s.el.remove(), s.el.classList.contains('morph') ? 600 : 260);
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
function closeAllSheets() { while (sheets.length) { const s = sheets.pop(); s.onClose?.(); s.el.remove(); } }

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
      unbusy(btn); err.textContent = 'Falscher Code.'; $('#c').select(); buzz([30, 40, 30]);
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
  { id: 'notes', label: 'Notes', icon: 'note', color: 'yellow' },
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
  enter = true;
  renderTab();
}

// Das Plus-Menü passt sich dem Bereich an: Home = Notiz/To-do/Visual, Visual = Art der Karte
function menuHtml(t) {
  const item = (add, label, icon, i, color) => `<button class="fm-item" role="menuitem" data-add="${add}" style="--i:${i};--a:var(--${color})"><span>${label}</span><span class="fm-ic">${ic(icon)}</span></button>`;
  return t === 'cards'
    ? item('card:mail', 'E-Mail', 'mail', 2, 'blue') + item('card:member', 'Kundenkarte', 'bag', 1, 'green') + item('card:bank', 'Bankkarte', 'card', 0, 'violet')
    : item('invoice', 'Rechnung', 'receipt', 3, 'green') + item('card', 'Visualisierung', 'card', 2, 'violet') + item('todo', 'To-do', 'check', 1, 'orange') + item('note', 'Notiz', 'note', 0, 'yellow');
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
  if (fabCfg) { fab.style.setProperty('--a', `var(--${fabCfg[0]})`); fab.setAttribute('aria-label', fabCfg[1]); }
  if (tab === 'home' || tab === 'cards') { fab.setAttribute('aria-haspopup', 'menu'); fab.setAttribute('aria-expanded', 'false'); }
  else { fab.removeAttribute('aria-haspopup'); fab.removeAttribute('aria-expanded'); }
  if (tab === 'notes') { bindNoteSearch(); bindNoteEdit(); }
  if (tab === 'todos') bindTodoForm();
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
    enter = true; renderTab(); scrollTo(0, 0);
    if (tab !== 'home' && screen.animate) screen.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 340, easing: 'cubic-bezier(.2,.8,.2,1)' });
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
  if (tab !== 'home' || !$('#hHello')) return;
  const p = homeParts();
  [['#hHello', p.hello], ['#hDate', p.date], ['#hWeek', p.week], ['#hTime', p.time]].forEach(([id, v]) => {
    const el = $(id); if (el.textContent !== v) el.textContent = v;
  });
}
setInterval(tickHome, 1000);

function viewHome() {
  const p = homeParts(), cls = enter ? ' enter' : '';
  enter = false;
  const open = data.todos.filter(t => !t.done).sort((a, b) => b.created - a.created);
  const shown = open.slice(0, 6);
  const todos = open.length ? `<section class="htodos" id="htodos" aria-label="Offene To-dos">
      <div class="hsec"><span>To-dos</span><b id="hcount">${open.length}</b></div>
      <ul class="todos">${shown.map(t => todoItem(t, true)).join('')}</ul>
      ${open.length > shown.length ? `<button class="more" data-go="todos">${open.length - shown.length} weitere anzeigen</button>` : ''}
    </section>` : '';
  freshIds.clear();
  return `<div class="home${cls}">
    <div class="hometop"><div class="hbtns">
      <button class="iconbtn" data-act="settings" aria-label="Einstellungen">${ic('gear')}</button>
      ${Vault.hasCode ? `<button class="iconbtn" data-act="lock" aria-label="Jetzt sperren">${ic('lock')}</button>` : ''}</div></div>
    <h1 class="hello" id="hHello">${p.hello}</h1>
    <p class="hdate" id="hDate">${p.date}</p>
    <time class="htime" id="hTime">${p.time}</time>
    <p class="hweek" id="hWeek">${p.week}</p>
    ${todos}
    ${invHome()}
  </div>`;
}

/* ---------- Notizen ---------- */
const firstLine = s => (s || '').split('\n').find(l => l.trim()) || '';
let noteQ = '';

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
  $('#q').addEventListener('input', e => { noteQ = e.target.value; paintNotes(); });
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

function paintNotes() { $('#notegrid').innerHTML = noteGrid(); decorateNotes(); }
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
    toast('Notiz gelöscht');
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
    data.notes = data.notes.filter(x => x.id !== n.id); n.title = n.body = '';
    history.back(); toast('Notiz gelöscht');
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
function todoItem(t, bare) {
  return `<li class="todo ${t.done ? 'done' : ''} ${freshIds.has(t.id) ? 'pop' : ''}">
    <button class="chk" role="checkbox" aria-checked="${t.done}" data-toggle="${t.id}" aria-label="${esc(t.text)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4L18 8"/></svg></button>
    <span class="tt">${esc(t.text)}</span>
    ${bare ? '' : `<button class="iconbtn sm" data-deltodo="${t.id}" aria-label="Aufgabe löschen">${ic('x')}</button>`}</li>`;
}
function viewTodos() {
  const open = data.todos.filter(t => !t.done).sort((a, b) => b.created - a.created);
  const done = data.todos.filter(t => t.done).sort((a, b) => b.doneAt - a.doneAt);
  return `${header('To-dos')}
    <form class="addrow" id="addTodo">
      <input id="tt" placeholder="Neue Aufgabe …" aria-label="Neue Aufgabe" autocomplete="off" enterkeyhint="done" maxlength="300">
      <button class="addbtn" aria-label="Hinzufügen">${ic('plus')}</button>
    </form>
    <div class="pills small">
      <span class="pill tiny"><b class="c-orange">${open.length}</b> offen</span>
      <span class="pill tiny"><b class="c-green">${done.length}</b> erledigt</span>
      ${done.length ? `<button class="pill tiny" data-act="cleardone">Erledigte löschen</button>` : ''}
    </div>
    ${data.todos.length ? `<ul class="todos">${[...open, ...done].map(todoItem).join('')}</ul>` : emptyState('check', 'Alles erledigt', 'Schreib oben deine erste Aufgabe rein.')}`;
}
function bindTodoForm() {
  $('#addTodo').addEventListener('submit', e => {
    e.preventDefault();
    const v = $('#tt').value.trim(); if (!v) return;
    data.todos.push({ id: uid(), text: v, done: false, created: Date.now() });
    save(); renderTab(); $('#tt').focus();
  });
}
function toggleTodo(id, btn) {
  const t = data.todos.find(x => x.id === id); if (!t) return;
  t.done = !t.done; t.doneAt = Date.now(); save();
  buzz(t.done ? 12 : 6);
  const li = btn.closest('.todo');
  btn.setAttribute('aria-checked', t.done); li.classList.toggle('done', t.done);
  if (tab === 'home') { setTimeout(() => { if (t.done) collapseTodo(li); }, 520); return; }
  setTimeout(renderTab, 420);
}
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
  el.querySelectorAll('[data-type]').forEach(b => b.addEventListener('click', () => { c.type = b.dataset.type; renderForm(); renderPrev(); }));
  el.querySelectorAll('[data-theme]').forEach(b => b.addEventListener('click', () => { c.theme = b.dataset.theme; renderPrev(); }));
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
    <div class="group">
      <div class="row"><div><b>Code-Sperre</b><small id="codeTxt">${Vault.hasCode ? 'App ist mit Code geschützt' : 'Aus – die App öffnet sich von selbst'}</small></div>
        <button class="switch" id="codeSw" role="switch" aria-checked="${Vault.hasCode}" aria-label="Code-Sperre"></button></div>
    </div>
    <div class="group" id="codeGroup" ${Vault.hasCode ? '' : 'hidden'}>
      <div class="row"><div><b>Fingerabdruck</b><small id="bioTxt">${!bioOk ? 'Auf diesem Gerät nicht verfügbar' : Vault.hasBio ? 'Entsperren per Fingerabdruck ist an' : 'Schneller entsperren'}</small></div>
        <button class="switch" id="bioSw" role="switch" aria-checked="${Vault.hasBio}" aria-label="Fingerabdruck" ${bioOk ? '' : 'disabled'}></button></div>
      <label class="row"><div><b>Automatisch sperren</b><small>Wenn die App im Hintergrund ist</small></div>
        <select id="al">${[[0, 'Sofort'], [60, 'Nach 1 Min.'], [300, 'Nach 5 Min.'], [900, 'Nach 15 Min.']].map(([v, l]) => `<option value="${v}" ${data.settings.autolock === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <button class="row" id="chg"><div><b>Code ändern</b></div></button>
    </div>
    <div class="group">
      <button class="row" id="exp"><div><b>Backup exportieren</b><small>Mit Code-Sperre öffnet sich die Datei nur mit deinem Code</small></div></button>
      <label class="row"><div><b>Backup importieren</b><small>Ersetzt alle Daten auf diesem Handy</small></div><input type="file" id="imp" accept=".json,application/json" hidden></label>
    </div>
    <div class="group"><button class="row danger" id="wipe"><div><b>Alle Daten löschen</b></div></button></div>
    <p class="foot">Lumen 1.0 · Alles bleibt auf diesem Gerät, verschlüsselt mit AES-256.</p>`, { label: 'Einstellungen', origin });

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
    $('#codeGroup', el).hidden = !Vault.hasCode;
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
      <ul class="added" id="added" aria-live="polite"></ul>
    </form>`, { label: 'Neues To-do', cls: 'quick', onClose: () => window.visualViewport?.removeEventListener('resize', kb) });
  window.visualViewport?.addEventListener('resize', kb);
  const input = $('#qt', el), list = $('#added', el);
  $('#qf', el).addEventListener('submit', e => {
    e.preventDefault();
    const v = input.value.trim(); if (!v) return;
    const nt = { id: uid(), text: v, done: false, created: Date.now() };
    data.todos.push(nt); freshIds.add(nt.id);
    save(); buzz(10); input.value = ''; input.focus();
    const li = document.createElement('li');
    li.innerHTML = `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4L18 8"/></svg><span>${esc(v)}</span>`;
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
  const sub = i.status === 'paid' ? 'Bezahlt' : i.due ? 'Fällig ' + fmtIso(i.due) : 'Offen';
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
      <div class="two">
        <label class="field"><span>Rechnungsnummer</span><input name="number" value="${esc(inv.number)}" placeholder="optional" autocomplete="off"></label>
        <label class="field"><span>Rechnungsdatum</span><input name="date" type="date" value="${esc(inv.date)}"></label>
      </div>
      <label class="field"><span>Fällig am</span><input name="due" type="date" value="${esc(inv.due)}"></label>
      <div class="seg" id="modeSeg" role="radiogroup" aria-label="Betrag ist">
        <button type="button" role="radio" data-mode="gross">Betrag brutto</button><button type="button" role="radio" data-mode="net">Betrag netto</button>
      </div>
      <div class="two">
        <label class="field"><span>Betrag</span><input name="amount" value="${esc(inv.amount)}" inputmode="decimal" placeholder="0,00" autocomplete="off"></label>
        <label class="field"><span>Währung</span><select name="currency">${CURRENCIES.map(c => `<option ${c === inv.currency ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
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
      <input type="file" accept="image/*" id="imgIn" hidden>
    </form>
    <p class="err" id="ferr" role="alert"></p>`, { label: 'Rechnung', cls: 'form-sheet' });

  const $f = n => el.querySelector(`[name="${n}"]`), taxSel = el.querySelector('#taxSel');
  taxSel.value = allTaxes().some(t => t.key === inv.taxKey) ? inv.taxKey : 'custom';
  const sum = () => {
    const c = calcInv(inv.amount, inv.mode, inv.rate);
    el.querySelector('#sum').innerHTML = `<div class="sumrow"><span>Netto</span><span>${money(c.net, inv.currency)}</span></div>
      <div class="sumrow"><span>${esc(inv.taxName || 'Steuer')} · ${pct(num(inv.rate))} %</span><span>${money(c.tax, inv.currency)}</span></div>
      <div class="sumrow tot"><span>Brutto</span><span>${money(c.gross, inv.currency)}</span></div>`;
  };
  const marks = () => {
    el.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-checked', b.dataset.mode === inv.mode));
    el.querySelectorAll('[data-st]').forEach(b => b.setAttribute('aria-checked', b.dataset.st === inv.status));
  };
  el.querySelector('#if').addEventListener('input', e => { const t = e.target; if (t.name) { inv[t.name] = t.value; sum(); } });
  taxSel.addEventListener('change', () => {
    inv.taxKey = taxSel.value;
    if (taxSel.value === 'custom') { inv.taxName = ''; $f('taxName').value = ''; $f('taxName').focus(); }
    else { const t = allTaxes().find(x => x.key === taxSel.value); inv.taxName = t.name; inv.rate = t.rate; $f('taxName').value = t.name; $f('rate').value = pct(t.rate); }
    sum();
  });
  el.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { inv.mode = b.dataset.mode; marks(); sum(); }));
  el.querySelectorAll('[data-st]').forEach(b => b.addEventListener('click', () => { inv.status = b.dataset.st; marks(); }));
  const renderImg = () => {
    el.querySelector('#imgbox').innerHTML = inv.image
      ? `<div class="imgprev"><img src="${inv.image}" alt="Bild der Rechnung"><button type="button" class="iconbtn sm rm" id="imgRm" aria-label="Bild entfernen">${ic('x')}</button></div>`
      : `<button type="button" class="btn imgadd" id="imgBtn">${ic('plus')}<span>Foto oder Bild hinzufügen</span></button>`;
    el.querySelector('#imgRm')?.addEventListener('click', () => { inv.image = ''; renderImg(); });
    el.querySelector('#imgBtn')?.addEventListener('click', () => el.querySelector('#imgIn').click());
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
    const c = calcInv(inv.amount, inv.mode, inv.rate), name = String(inv.taxName).trim(), rate = num(inv.rate);
    Object.assign(inv, { vendor: String(inv.vendor).trim(), taxName: name, rate, net: c.net, tax: c.tax, gross: c.gross });
    if (name && !allTaxes().some(t => t.name === name && t.rate === rate)) (data.settings.taxes ||= []).push({ name, rate }); // eigene Steuer merken
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
      ${pill('Netto', money(i.net, i.currency))}${pill(`${i.taxName || 'Steuer'} · ${pct(i.rate)} %`, money(i.tax, i.currency))}
      ${pill('Rechnungsdatum', fmtIso(i.date))}${pill('Fällig am', fmtIso(i.due))}
      ${i.note ? `<div class="pill wide"><span class="clip multi"><small>Notiz</small>${esc(i.note)}</span></div>` : ''}
    </div>
    ${i.image ? `<img class="invimg" id="invimg" src="${i.image}" alt="Bild der Rechnung">` : ''}
    <button class="btn wide invpay" id="paid"></button>`, { label: i.vendor || 'Rechnung' });
  const paidBtn = $('#paid', el);
  const sync = () => { $('#chipwrap', el).innerHTML = invChip(i); paidBtn.textContent = i.status === 'paid' ? 'Wieder auf offen setzen' : 'Als bezahlt markieren'; };
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
    if (b.dataset.f) { f = b.dataset.f; render(); }
    else if (b.dataset.inv) openInvoice(b.dataset.inv);
    else if (b.id === 'addinv') openInvoiceForm();
  });
  el.addEventListener('revive', render);
  render();
}

/* ---------- Klicks ---------- */
app.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || !data) return;
  if (b.dataset.tab) return switchTab(b.dataset.tab);
  if (b.dataset.go) return switchTab(b.dataset.go);
  if (b.dataset.note) return openNote(b.dataset.note);
  if (b.dataset.card) return openViewer(b.dataset.card);
  if (b.dataset.inv) return openInvoice(b.dataset.inv);
  if (b.dataset.toggle) return toggleTodo(b.dataset.toggle, b);
  if (b.dataset.deltodo) { data.todos = data.todos.filter(t => t.id !== b.dataset.deltodo); save(); return renderTab(); }
  if (b.dataset.new === 'note') return openNote();
  if (b.dataset.new === 'card') return openCardForm();
  if (b.dataset.new === 'todo') { tab = 'todos'; renderTab(); return $('#tt').focus(); }
  if (b.dataset.add) {
    const k = b.dataset.add;
    setMenu(false); $('#fab').focus({ preventScroll: true });
    setTimeout(() => (k === 'note' ? openNote() : k === 'todo' ? openQuickTodo() : k === 'invoice' ? openInvoiceForm() : openCardForm(undefined, k.startsWith('card:') ? k.slice(5) : undefined)), 150);
    return;
  }
  if (b.id === 'fab') { if (tab === 'home' || tab === 'cards') return setMenu(!menuOpen, e.detail === 0); if (tab === 'notes') openNote(); else if (tab === 'cards') openCardForm(); else if (tab === 'todos') $('#tt').focus(); return; }
  const act = b.dataset.act;
  if (act === 'lock') return lockNow();
  if (act === 'settings') return openSettings(b);
  if (act === 'invlist') return openInvoiceList();
  if (act === 'bio') return enrollBio().then(renderTab);
  if (act === 'cleardone') { data.todos = data.todos.filter(t => !t.done); save(); renderTab(); }
});

boot();
