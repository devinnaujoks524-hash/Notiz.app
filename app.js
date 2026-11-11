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
  shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/>',
};
const ic = n => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${P[n]}</svg>`;

/* ---------- Zustand ---------- */
const empty = () => ({ v: 1, notes: [], todos: [], cards: [], settings: { autolock: 60 } });
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
function openSheet(html, { label, cls = '', onClose } = {}) {
  const el = document.createElement('div');
  el.className = 'sheet ' + cls;
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', label || '');
  el.innerHTML = html;
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
  setTimeout(() => s.el.remove(), 260);
  if (Vault.unlocked) renderTab();
  s.prevFocus?.focus?.({ preventScroll: true });
}
addEventListener('popstate', () => { if (sheets.length) popSheet(); });
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

function renderTab() {
  const screen = $('#screen'); if (!screen || !data) return;
  setMenu(false);
  $('#glowwrap')?.classList.toggle('on', tab === 'home');
  screen.innerHTML = { home: viewHome, notes: viewNotes, todos: viewTodos, cards: viewCards }[tab]();
  document.querySelectorAll('[data-tab]').forEach(b => b.dataset.tab === tab ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
  const fab = $('#fab');
  const fabCfg = { home: ['white', 'Hinzufügen'], notes: ['yellow', 'Neue Notiz'], todos: ['orange', 'Neue Aufgabe'], cards: ['violet', 'Neue Karte'] }[tab];
  fab.hidden = !fabCfg;
  if (fabCfg) { fab.style.setProperty('--a', `var(--${fabCfg[0]})`); fab.setAttribute('aria-label', fabCfg[1]); }
  if (tab === 'home') { fab.setAttribute('aria-haspopup', 'menu'); fab.setAttribute('aria-expanded', 'false'); }
  else { fab.removeAttribute('aria-haspopup'); fab.removeAttribute('aria-expanded'); }
  if (tab === 'notes') bindNoteSearch();
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
    enter = true; renderTab(); scrollTo(0, 0);
    if (tab !== 'home' && screen.animate) screen.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 340, easing: 'cubic-bezier(.2,.8,.2,1)' });
  };
  if (!screen?.animate || matchMedia('(prefers-reduced-motion: reduce)').matches) return show();
  screen.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-6px)' }], { duration: 120, easing: 'ease-in', fill: 'forwards' }).finished.then(() => { show(); }).catch(show);
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
  const list = data.notes.filter(n => !q || (n.title + ' ' + n.body).toLowerCase().includes(q))
    .sort((a, b) => (b.pinned - a.pinned) || (b.updated - a.updated));
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
  $('#q').addEventListener('input', e => { noteQ = e.target.value; $('#notegrid').innerHTML = noteGrid(); });
}
const emptyState = (icon, title, text) => `<div class="empty">${ic(icon)}<b>${title}</b><p>${text}</p></div>`;

function openNote(id) {
  let n = data.notes.find(x => x.id === id);
  const isNew = !n;
  if (!n) n = { id: uid(), title: '', body: '', color: COLORS[data.notes.length % COLORS.length], pinned: false, updated: Date.now() };
  const el = openSheet(`
    <div class="sheet-top">
      <button class="iconbtn" data-close aria-label="Zurück">${ic('back')}</button><span class="grow"></span>
      <button class="iconbtn" id="pin" aria-pressed="${n.pinned}" aria-label="Anheften">${ic('pin')}</button>
      <button class="iconbtn" id="del" aria-label="Notiz löschen">${ic('trash')}</button>
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
    <div class="stack">${data.cards.map(c => `<button class="cardthumb" data-card="${c.id}" aria-label="${esc(c.name || 'Karte')} öffnen">${cardMarkup(c)}</button>`).join('')}</div>`
      : emptyState('card', 'Noch keine Karten', 'Füge deine Bankkarte mit Nummer und IBAN hinzu – sie schwebt dann in 3D.')}`;
}

function openViewer(id) {
  const c = data.cards.find(x => x.id === id); if (!c) return;
  const info = c.type === 'member'
    ? [['Geschäft', c.name], ['Mitgliedsnr.', c.member, true], ['Inhaber', c.holder]]
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
       ${info.filter(i => i[1]).map(([k, v, copy, raw]) => `<div class="pill${copy ? ' wide' : ''}"><span class="clip"><small>${k}</small>${esc(v)}</span>${copy ? `<button class="iconbtn sm" data-copy="${esc(raw || v)}" aria-label="${k} kopieren">${ic('copy')}</button>` : ''}</div>`).join('')}
      ${c.note ? `<div class="pill wide"><span class="clip multi"><small>Notiz</small>${esc(c.note)}</span></div>` : ''}
    </div>`, { label: 'Karte ansehen', cls: 'viewer', onClose: () => stop?.() });
  stop = mountViewer($('#stage', el));
  $('#edit', el).addEventListener('click', () => { history.back(); setTimeout(() => openCardForm(c.id), 300); });
  $('#del', el).addEventListener('click', async () => {
    if (!(await dialog({ title: 'Karte löschen?', body: 'Das kann nicht rückgängig gemacht werden.', ok: 'Löschen', danger: true }))) return;
    data.cards = data.cards.filter(x => x.id !== c.id); save(); history.back(); toast('Karte gelöscht');
  });
  el.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); toast('Kopiert'); } catch { toast('Kopieren nicht möglich'); }
  }));
}

function openCardForm(id) {
  const orig = data.cards.find(x => x.id === id);
  const c = orig ? { ...orig } : { id: uid(), type: 'bank', theme: 'sunset', name: '', holder: '', number: '', iban: '', exp: '', network: 'Visa', member: '', note: '' };
  const el = openSheet(`
    <div class="sheet-top">
      <button class="iconbtn" data-close aria-label="Abbrechen">${ic('x')}</button>
      <h2 class="grow center">${orig ? 'Karte bearbeiten' : 'Neue Karte'}</h2>
      <button class="btn primary sm" id="save">Sichern</button>
    </div>
    <div class="preview" id="pv"></div>
    <div class="seg" role="radiogroup" aria-label="Art der Karte">
      <button role="radio" data-type="bank">Bankkarte</button><button role="radio" data-type="member">Kundenkarte</button>
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
    member: [['name', 'Geschäft', 'text', 'z. B. Fitnessstudio'], ['holder', 'Inhaber', 'text', 'Dein Name'],
             ['member', 'Mitgliedsnummer', 'text', ''], ['note', 'Notiz (Rückseite)', 'area', '']],
  };
  const renderForm = () => {
    $('#cf', el).innerHTML = F[c.type].map(([k, label, kind, ph, max]) => {
      if (kind === 'select') return `<label class="field"><span>${label}</span><select name="${k}">${['Visa', 'Mastercard', 'Girocard', 'Amex', 'Andere'].map(o => `<option ${c[k] === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label>`;
      if (kind === 'area') return `<label class="field"><span>${label}</span><textarea name="${k}" rows="2" placeholder="${ph}">${esc(c[k])}</textarea></label>`;
      return `<label class="field"><span>${label}</span><input name="${k}" value="${esc(c[k])}" placeholder="${ph}" ${kind === 'numeric' ? 'inputmode="numeric"' : ''} ${max ? `maxlength="${max}"` : ''} autocomplete="off"></label>`;
    }).join('');
    el.querySelectorAll('[data-type]').forEach(b => b.setAttribute('aria-checked', b.dataset.type === c.type));
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
    if (orig) Object.assign(orig, c); else data.cards.push(c);
    save(); history.back(); toast(orig ? 'Karte aktualisiert' : 'Karte hinzugefügt');
    if (!orig) setTimeout(() => openViewer(c.id), 320);
  });
}

/* ---------- Einstellungen ---------- */
function openSettings() {
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
    <p class="foot">Lumen 1.0 · Alles bleibt auf diesem Gerät, verschlüsselt mit AES-256.</p>`, { label: 'Einstellungen' });

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
  if (open) { buzz(8); if (focusFirst) m.querySelector('[data-add="note"]').focus(); }
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

/* ---------- Klicks ---------- */
app.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || !data) return;
  if (b.dataset.tab) return switchTab(b.dataset.tab);
  if (b.dataset.go) return switchTab(b.dataset.go);
  if (b.dataset.note) return openNote(b.dataset.note);
  if (b.dataset.card) return openViewer(b.dataset.card);
  if (b.dataset.toggle) return toggleTodo(b.dataset.toggle, b);
  if (b.dataset.deltodo) { data.todos = data.todos.filter(t => t.id !== b.dataset.deltodo); save(); return renderTab(); }
  if (b.dataset.new === 'note') return openNote();
  if (b.dataset.new === 'card') return openCardForm();
  if (b.dataset.new === 'todo') { tab = 'todos'; renderTab(); return $('#tt').focus(); }
  if (b.dataset.add) {
    const k = b.dataset.add;
    setMenu(false); $('#fab').focus({ preventScroll: true });
    setTimeout(() => (k === 'note' ? openNote() : k === 'todo' ? openQuickTodo() : openCardForm()), 150);
    return;
  }
  if (b.id === 'fab') { if (tab === 'home') return setMenu(!menuOpen, e.detail === 0); if (tab === 'notes') openNote(); else if (tab === 'cards') openCardForm(); else if (tab === 'todos') $('#tt').focus(); return; }
  const act = b.dataset.act;
  if (act === 'lock') return lockNow();
  if (act === 'settings') return openSettings();
  if (act === 'bio') return enrollBio().then(renderTab);
  if (act === 'cleardone') { data.todos = data.todos.filter(t => !t.done); save(); renderTab(); }
});

boot();
