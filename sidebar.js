// Glassy Sidebar V10 — Einheitliches Haupt-Quick-Menü (Mobil & Desktop)
// Echte gedämpfte Feder-Physik, Gedrückt-Halten & Durchfahren (Scrubbing), Edge-Handle, Live-Suche

export function createSpring({ stiffness = 360, damping = 29, mass = 1, value = 0, onUpdate, onRest }) {
  let x = value, v = 0, target = value, raf = 0, last = 0;

  function step(now) {
    const dt = Math.min(0.032, Math.max(0.004, (now - last) / 1000));
    last = now;
    const force = -stiffness * (x - target) - damping * v;
    v += (force / mass) * dt;
    x += v * dt;
    onUpdate?.(x, v);
    if (Math.abs(v) < 0.08 && Math.abs(x - target) < 0.08) {
      x = target; v = 0; raf = 0;
      onUpdate?.(x, 0);
      onRest?.();
      return;
    }
    raf = requestAnimationFrame(step);
  }

  return {
    set(next, immediate = false) {
      target = next;
      if (immediate) {
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        x = target; v = 0;
        onUpdate?.(x, 0);
        return;
      }
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(step);
      }
    },
    get() { return x; },
    stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } },
  };
}

const fold = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ß/g, 'ss');

export function mountGlassySidebar(api) {
  const {
    getData, getTab, switchTab, openSettings, openNote, openQuickTodo,
    openTimerSheet, openInvoiceList, openInvoice, focusTodo, selectBrainTopic, selectBrainSection,
    noteTitle, money, ic, esc, buzz, reduced, getTheme, getPrism,
  } = api;

  let expanded = false;
  let mobileOpen = false;
  let activeKey = getTab() || 'home';
  let previewKey = null;
  let previewTopicId = null;
  let initializedNotch = false;
  let query = '';
  let suppressClickUntil = 0;

  const isDesktop = () => window.innerWidth >= 860;

  // Backdrop für mobile Überlagerung
  let scrim = document.getElementById('gsScrim');
  if (!scrim) {
    scrim = document.createElement('div');
    scrim.id = 'gsScrim';
    scrim.className = 'gs-scrim';
    document.body.appendChild(scrim);
  }

  // Kompakter linker Daumen-Griff für Mobil (Tippen, Wischen oder Gedrückt-Halten & Durchfahren!)
  let edge = document.getElementById('gsEdge');
  if (!edge) {
    edge = document.createElement('button');
    edge.id = 'gsEdge';
    edge.type = 'button';
    edge.className = 'gs-edge';
    edge.setAttribute('aria-label', 'Quick-Menü öffnen oder gedrückt halten zum Durchfahren');
    edge.innerHTML = '<span class="gs-edge-pill" aria-hidden="true"><i class="gs-edge-dot"></i><i class="gs-edge-bar"></i></span>';
    document.body.appendChild(edge);
  }

  let rail = document.getElementById('gsRail');
  if (!rail) {
    rail = document.createElement('aside');
    rail.id = 'gsRail';
    rail.className = 'gs-rail';
    rail.setAttribute('aria-label', 'Hauptnavigation');
    document.body.appendChild(rail);
  }

  rail.innerHTML = `
    <div class="gs-shell">
      <div class="gs-body">
        <div class="gs-head">
          <button type="button" class="gs-logo-btn" data-gs="toggle" aria-label="Seitenleiste ein- oder ausklappen">
            <span class="gs-orb" aria-hidden="true"></span>
            <span class="gs-brand-tx"><b>Lumen</b><small id="gsThemeSub">Workspace</small></span>
          </button>
        </div>

        <div class="gs-search" id="gsSearchBox">
          <button type="button" class="gs-search-trigger" id="gsSearchBtn" aria-label="Im Quick-Menü suchen">
            <span class="gs-ic">${ic('search')}</span>
          </button>
          <input type="search" id="gsSearchInput" class="gs-search-in" placeholder="Alles suchen …" aria-label="Alles durchsuchen" autocomplete="off">
          <button type="button" class="gs-search-clr" id="gsSearchClr" aria-label="Suche leeren" hidden>${ic('x')}</button>
        </div>

        <div class="gs-results" id="gsResults" role="listbox" aria-label="Suchergebnisse" hidden></div>

        <div class="gs-main-view" id="gsMainView">
          <nav class="gs-nav" id="gsNav" aria-label="Hauptbereiche">
            <div class="gs-notch" id="gsNotch" aria-hidden="true"></div>
            <button type="button" class="gs-item" data-gs-nav="home">
              <span class="gs-ic">${ic('home')}</span>
              <span class="gs-tx"><b>Home</b><small id="gsSub-home">Übersicht</small></span>
            </button>
            <button type="button" class="gs-item" data-gs-nav="notes">
              <span class="gs-ic">${ic('note')}</span>
              <span class="gs-tx"><b>Notizen</b><small id="gsSub-notes">0 Einträge</small></span>
              <span class="gs-cnt" id="gsCnt-notes">0</span>
            </button>
            <button type="button" class="gs-item" data-gs-nav="todos">
              <span class="gs-ic">${ic('check')}</span>
              <span class="gs-tx"><b>To-dos</b><small id="gsSub-todos">0 offen</small></span>
              <span class="gs-cnt" id="gsCnt-todos">0</span>
            </button>
            <button type="button" class="gs-item" data-gs-nav="brain">
              <span class="gs-ic">${ic('graph')}</span>
              <span class="gs-tx"><b>Zentrale</b><small id="gsSub-brain">Graph</small></span>
              <span class="gs-cnt" id="gsCnt-brain">0</span>
            </button>
            <button type="button" class="gs-item" data-gs-nav="invoices">
              <span class="gs-ic">${ic('receipt')}</span>
              <span class="gs-tx"><b>Belege</b><small id="gsSub-invoices">Rechnungen</small></span>
              <span class="gs-cnt" id="gsCnt-invoices">0</span>
            </button>
          </nav>

          <div class="gs-div" aria-hidden="true"></div>

          <div class="gs-proj-sec">
            <div class="gs-sec-h"><span>THEMEN</span><button type="button" class="gs-sec-add" data-gs="brain" aria-label="Neues Thema im Graph">${ic('plus')}</button></div>
            <div class="gs-projs" id="gsProjs"></div>
          </div>
        </div>

        <div class="gs-foot">
          <button type="button" class="gs-foot-btn" data-gs="settings" aria-label="Einstellungen öffnen">
            <span class="gs-avatar" aria-hidden="true">${ic('gear')}</span>
            <span class="gs-foot-tx"><b>Einstellungen</b><small id="gsVaultTxt">AES-256 · Lokal</small></span>
          </button>
        </div>
      </div>

      <div class="gs-strip" aria-label="Schnellaktionen">
        <button type="button" class="gs-strip-btn gs-toggle-btn" data-gs="toggle" aria-label="Seitenleiste ein- oder ausklappen" title="Ein-/Ausklappen">
          ${ic('chev')}
        </button>
        <div class="gs-strip-mid">
          <button type="button" class="gs-strip-btn" data-gs="new-note" aria-label="Neue Notiz" title="Neue Notiz">${ic('plus')}</button>
          <button type="button" class="gs-strip-btn" data-gs="new-todo" aria-label="Neues To-do" title="Neues To-do">${ic('check')}</button>
          <button type="button" class="gs-strip-btn" data-gs="timer" aria-label="Fokus-Timer" title="Fokus-Timer">${ic('clock')}</button>
        </div>
        <button type="button" class="gs-strip-btn gs-strip-bot" data-gs="settings" aria-label="Einstellungen" title="Einstellungen">${ic('sliders')}</button>
      </div>
    </div>
  `;

  const navEl = rail.querySelector('#gsNav');
  const notch = rail.querySelector('#gsNotch');
  const projsEl = rail.querySelector('#gsProjs');
  const mainView = rail.querySelector('#gsMainView');
  const resEl = rail.querySelector('#gsResults');
  const searchIn = rail.querySelector('#gsSearchInput');
  const searchBtn = rail.querySelector('#gsSearchBtn');
  const searchClr = rail.querySelector('#gsSearchClr');

  // Echte gedämpfte Feder für die gleitende weiße Aktiv-Kapsel (Y-Position + Höhe)
  const notchY = createSpring({
    stiffness: 380,
    damping: 30,
    onUpdate: (y, vel) => {
      const stretch = Math.min(0.06, Math.abs(vel) * 0.000045);
      notch.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0) scaleY(${(1 + stretch).toFixed(4)})`;
    },
  });
  const notchH = createSpring({
    stiffness: 400,
    damping: 32,
    onUpdate: h => { notch.style.height = `${Math.max(40, h).toFixed(1)}px`; },
  });

  function applyActiveHighlight(key = previewKey || activeKey) {
    navEl.querySelectorAll('.gs-item').forEach(b => {
      const on = b.dataset.gsNav === key && !previewTopicId;
      b.classList.toggle('is-active', on);
      if (b.dataset.gsNav === activeKey) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
    projsEl.querySelectorAll('.gs-proj').forEach(b => {
      b.classList.toggle('is-scrub', !!previewTopicId && b.dataset.gsTopic === previewTopicId);
    });
  }

  function placeNotch(immediate = false) {
    if (mainView.hidden) return;
    const key = previewKey || activeKey;
    const btn = navEl.querySelector(`.gs-item[data-gs-nav="${key}"]`) || navEl.querySelector('.gs-item');
    if (!btn || !btn.offsetHeight) return;
    const y = btn.offsetTop;
    const h = btn.offsetHeight;
    const instant = immediate || !initializedNotch || reduced();
    initializedNotch = true;
    notch.classList.toggle('on', !previewTopicId);
    notchY.set(y, instant);
    notchH.set(h, instant);
  }

  function navigateTo(k) {
    activeKey = k;
    previewKey = null;
    previewTopicId = null;
    applyActiveHighlight(k);
    placeNotch(false);
    buzz(8);
    if (k === 'invoices') {
      if (!isDesktop()) closeMobileDrawer();
      setTimeout(() => openInvoiceList(), 120);
    } else {
      switchTab(k);
      if (!isDesktop()) setTimeout(closeMobileDrawer, 180);
    }
  }

  function highlight(text, q) {
    const s = String(text || '');
    const idx = fold(s).indexOf(q);
    if (idx < 0) return esc(s);
    return esc(s.slice(0, idx)) + '<mark>' + esc(s.slice(idx, idx + q.length)) + '</mark>' + esc(s.slice(idx + q.length));
  }

  function renderSearch() {
    const raw = query.trim();
    const q = fold(raw);
    searchClr.hidden = !raw;

    if (!q) {
      resEl.hidden = true;
      resEl.innerHTML = '';
      mainView.hidden = false;
      requestAnimationFrame(() => placeNotch(true));
      return;
    }

    const data = getData();
    if (!data) return;
    mainView.hidden = true;
    resEl.hidden = false;

    const has = (...xs) => xs.some(x => fold(x).includes(q));
    const items = [];

    (data.notes || []).filter(n => has(n.title, n.body)).slice(0, 5).forEach(n => {
      items.push({ go: `note:${n.id}`, icon: n.audio?.length ? 'mic' : 'note', color: n.color || 'yellow', title: highlight(noteTitle(n), q), sub: 'Notiz' });
    });

    (data.brain?.topics || []).forEach(t => {
      if (has(t.title, t.body)) {
        items.push({ go: `brain:${t.id}`, icon: 'graph', color: t.color || 'violet', title: highlight(t.title, q), sub: `Graph · ${(t.sections || []).length} Abschn.` });
      }
      (t.sections || []).forEach(s => {
        if (has(s.title, s.body, t.title)) {
          items.push({ go: `bsec:${t.id}|${s.id}`, icon: 'graph', color: t.color || 'violet', title: highlight(s.title, q), sub: `${esc(t.title)} · Abschnitt` });
        }
      });
    });

    (data.todos || []).filter(t => has(t.text)).slice(0, 5).forEach(t => {
      items.push({ go: `todo:${t.id}`, icon: 'check', color: t.done ? 'green' : 'orange', title: highlight(t.text, q), sub: t.done ? 'To-do · Erledigt' : 'To-do · Offen' });
    });

    (data.invoices || []).filter(i => has(i.vendor, i.number, i.note)).slice(0, 4).forEach(i => {
      items.push({ go: `inv:${i.id}`, icon: 'receipt', color: 'green', title: highlight(i.vendor, q), sub: `Beleg · ${esc(money(i.gross, i.currency))}` });
    });

    if (!items.length) {
      resEl.innerHTML = `<div class="gs-res-empty">Keine Treffer für „${esc(raw)}“</div>`;
      return;
    }

    resEl.innerHTML = `<div class="gs-sec-h gs-res-h"><span>TREFFER (${items.length})</span></div>` +
      items.slice(0, 12).map((it, idx) => `
        <button type="button" class="gs-res-row" role="option" data-gs-hit="${esc(it.go)}" style="--a:var(--${it.color});--i:${idx}">
          <span class="gs-res-ic">${ic(it.icon)}</span>
          <span class="gs-res-tx"><b>${it.title}</b><small>${it.sub}</small></span>
        </button>`).join('');
  }

  function clearSearch() {
    if (!query && !searchIn.value) return;
    query = '';
    searchIn.value = '';
    rail.classList.remove('searching');
    renderSearch();
  }

  function openSearchHit(hit) {
    const [kind, rest] = hit.split(':');
    buzz(8);
    clearSearch();
    if (!isDesktop()) closeMobileDrawer();
    if (kind === 'note') openNote(rest);
    else if (kind === 'brain') selectBrainTopic(rest);
    else if (kind === 'bsec') { const [tid, sid] = rest.split('|'); selectBrainSection(tid, sid); }
    else if (kind === 'todo') focusTodo(rest);
    else if (kind === 'inv') openInvoice(rest);
  }

  function syncData() {
    const data = getData();
    if (!data) return;

    const th = getTheme();
    const themeLabel = th === 'gemini' ? `Gemini · ${getPrism()}` : th === 'ember' ? 'Ember' : th === 'glass' ? 'Glas' : 'Klassisch';
    const subEl = rail.querySelector('#gsThemeSub');
    if (subEl) subEl.textContent = themeLabel;

    const notesN = data.notes?.length || 0;
    const openT = (data.todos || []).filter(t => !t.done).length;
    const topics = data.brain?.topics || [];
    const secsN = topics.reduce((s, t) => s + (t.sections?.length || 0), 0);
    const invs = data.invoices || [];
    const openInv = invs.filter(i => i.status !== 'paid').length;

    const setTxt = (id, v) => { const el = rail.querySelector(id); if (el) el.textContent = v; };
    setTxt('#gsCnt-notes', notesN);
    setTxt('#gsCnt-todos', openT);
    setTxt('#gsCnt-brain', topics.length);
    setTxt('#gsCnt-invoices', openInv || invs.length);

    setTxt('#gsSub-home', openT ? `${openT} offen · Übersicht` : 'Alles erledigt');
    setTxt('#gsSub-notes', `${notesN} ${notesN === 1 ? 'Notiz' : 'Notizen'}`);
    setTxt('#gsSub-todos', openT ? `${openT} offen` : 'Alles geschafft');
    setTxt('#gsSub-brain', `${topics.length} Themen · ${secsN} Abschn.`);
    setTxt('#gsSub-invoices', openInv ? `${openInv} offen` : `${invs.length} Belege`);

    // Edge-Handle Farbpunkt spiegelt aktiven Bereich wider
    const curTab = getTab() || 'home';
    const edgeColor = { home: 'white', notes: 'yellow', todos: 'orange', brain: 'violet' }[curTab] || 'white';
    edge.style.setProperty('--ec', `var(--${edgeColor})`);

    if (topics.length) {
      projsEl.innerHTML = topics.slice(0, 5).map((t, i) => `
        <button type="button" class="gs-proj" data-gs-topic="${t.id}" style="--a:var(--${t.color || 'blue'});--i:${i}">
          <span class="gs-pdot" aria-hidden="true"></span>
          <span class="gs-plbl">${esc(t.title)}</span>
          ${(t.sections?.length || 0) ? `<span class="gs-pcnt">${t.sections.length}</span>` : ''}
        </button>`).join('');
    } else {
      projsEl.innerHTML = `
        <button type="button" class="gs-proj empty" data-gs="brain" style="--a:var(--violet);--i:0">
          <span class="gs-pdot" aria-hidden="true"></span>
          <span class="gs-plbl">Erstes Thema anlegen …</span>
        </button>`;
    }

    activeKey = curTab;
    applyActiveHighlight(activeKey);

    if (query.trim()) renderSearch();
    else requestAnimationFrame(() => placeNotch(false));
  }

  function applyState() {
    const desk = isDesktop();
    if (!expanded) clearSearch();
    rail.classList.toggle('expanded', expanded);
    rail.classList.toggle('mobile-open', !desk && mobileOpen);
    scrim.classList.toggle('on', !desk && mobileOpen);
    edge.classList.toggle('hide', desk || mobileOpen);
    document.body.classList.toggle('gs-expanded', desk && expanded);
    document.body.classList.add('gs-ready');
    requestAnimationFrame(() => placeNotch(false));
    setTimeout(() => placeNotch(false), 160);
    setTimeout(() => placeNotch(false), 360);
  }

  function setExpanded(next) {
    expanded = next;
    buzz(7);
    applyState();
  }

  function openMobileDrawer(asExpanded = true) {
    mobileOpen = true;
    expanded = asExpanded;
    syncData();
    applyState();
  }

  function closeMobileDrawer() {
    if (!mobileOpen) return;
    mobileOpen = false;
    previewKey = null;
    previewTopicId = null;
    clearSearch();
    applyState();
  }

  /* ========================================================================
     GEDRÜCKT HALTEN & DURCHFAHREN (HOLD & SCRUB) + WISCH-GESTEN
     ======================================================================== */

  // Findet das Element unter der Finger-Y-Koordinate innerhalb von Nav & Themen
  function hitAtY(clientY) {
    if (mainView.hidden) return null;
    for (const btn of navEl.querySelectorAll('.gs-item')) {
      const r = btn.getBoundingClientRect();
      if (clientY >= r.top - 3 && clientY <= r.bottom + 3) {
        return { kind: 'nav', key: btn.dataset.gsNav };
      }
    }
    for (const btn of projsEl.querySelectorAll('.gs-proj[data-gs-topic]')) {
      const r = btn.getBoundingClientRect();
      if (clientY >= r.top - 3 && clientY <= r.bottom + 3) {
        return { kind: 'topic', id: btn.dataset.gsTopic };
      }
    }
    return null;
  }

  function updateScrubTarget(clientY) {
    const hit = hitAtY(clientY);
    if (!hit) return;
    if (hit.kind === 'nav') {
      if (previewKey !== hit.key || previewTopicId) {
        previewKey = hit.key;
        previewTopicId = null;
        buzz(6);
        applyActiveHighlight(previewKey);
        placeNotch(false);
      }
    } else if (hit.kind === 'topic') {
      if (previewTopicId !== hit.id) {
        previewTopicId = hit.id;
        previewKey = null;
        buzz(6);
        applyActiveHighlight(activeKey);
        placeNotch(false);
      }
    }
  }

  function commitScrub() {
    rail.classList.remove('scrubbing');
    if (previewTopicId) {
      const tid = previewTopicId;
      previewTopicId = null; previewKey = null;
      applyActiveHighlight(activeKey);
      if (!isDesktop()) closeMobileDrawer();
      buzz(10);
      selectBrainTopic(tid);
      return true;
    }
    if (previewKey) {
      const k = previewKey;
      previewKey = null; previewTopicId = null;
      navigateTo(k);
      return true;
    }
    return false;
  }

  // 1) Direkt auf dem Quick-Menü (Nav & Themen) gedrückt halten & vertikal durchfahren
  //    oder auf Mobil nach links wegwischen!
  //    Wichtig: setPointerCapture erst aktivieren, wenn Durchfahren wirklich startet,
  //    damit normale Klicks/Taps ihr genaues Button-Ziel behalten!
  let navScrub = null;
  const captureMain = pid => { try { mainView.setPointerCapture?.(pid); } catch {} };
  const releaseMain = pid => { try { if (mainView.hasPointerCapture?.(pid)) mainView.releasePointerCapture(pid); } catch {} };

  mainView.addEventListener('pointerdown', e => {
    if (e.button && e.button !== 0) return;
    if (mainView.hidden || e.target.closest('.gs-sec-add')) return;
    const startBtn = e.target.closest('.gs-item');
    navScrub = { pid: e.pointerId, x0: e.clientX, y0: e.clientY, active: false, closed: false, timer: 0, startKey: startBtn?.dataset.gsNav || activeKey };
    navScrub.timer = setTimeout(() => {
      if (!navScrub || navScrub.closed) return;
      navScrub.active = true;
      captureMain(navScrub.pid);
      rail.classList.add('scrubbing');
      buzz(10);
      updateScrubTarget(navScrub.y0);
    }, 150);
  });

  const onNavMove = e => {
    if (!navScrub || navScrub.pid !== e.pointerId || navScrub.closed) return;
    const dx = e.clientX - navScrub.x0, dy = e.clientY - navScrub.y0;
    if (!navScrub.active && !isDesktop() && mobileOpen && dx < -46 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      clearTimeout(navScrub.timer);
      navScrub.closed = true;
      suppressClickUntil = performance.now() + 260;
      buzz(5);
      closeMobileDrawer();
      return;
    }
    if (!navScrub.active && Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
      clearTimeout(navScrub.timer);
      navScrub.active = true;
      captureMain(navScrub.pid);
      rail.classList.add('scrubbing');
      buzz(8);
    }
    if (navScrub.active) {
      e.preventDefault();
      updateScrubTarget(e.clientY);
    }
  };

  const endNavScrub = e => {
    if (!navScrub || navScrub.pid !== e.pointerId) return;
    const st = navScrub; navScrub = null;
    clearTimeout(st.timer);
    releaseMain(st.pid);
    if (st.closed) return;
    if (st.active) {
      suppressClickUntil = performance.now() + 300;
      if (!commitScrub()) {
        previewKey = null; previewTopicId = null;
        applyActiveHighlight(activeKey); placeNotch(false);
      }
    }
  };
  addEventListener('pointermove', onNavMove);
  addEventListener('pointerup', endNavScrub);
  addEventListener('pointercancel', endNavScrub);

  // 2) Linker Daumen-Griff (#gsEdge):
  //    - Kurzes Tippen oder Rechts-Wischen -> öffnet das Quick-Menü ausgeklappt und lässt es offen
  //    - Gedrückt halten (155ms) -> öffnet sofort im Durchfahr-Modus: Daumen hoch/runter gleiten, Loslassen = Auswählen!
  //    - Auch nach Rechts-Wischen: sobald man vertikal zieht (> 12px), schaltet es nahtlos ins Durchfahren um!
  let edgeGest = null;
  edge.addEventListener('pointerdown', e => {
    if (isDesktop() || (e.button && e.button !== 0)) return;
    edge.classList.add('active');
    edgeGest = { pid: e.pointerId, x0: e.clientX, y0: e.clientY, opened: false, scrubbing: false, scrubY0: e.clientY, moved: 0, timer: 0 };
    try { edge.setPointerCapture?.(e.pointerId); } catch {}
    edgeGest.timer = setTimeout(() => {
      if (!edgeGest) return;
      edgeGest.opened = true;
      edgeGest.scrubbing = true;
      buzz(12);
      openMobileDrawer(true);
      rail.classList.add('scrubbing');
      requestAnimationFrame(() => updateScrubTarget(edgeGest ? edgeGest.y0 : e.clientY));
    }, 155);
  });

  edge.addEventListener('pointermove', e => {
    if (!edgeGest || edgeGest.pid !== e.pointerId) return;
    const dx = e.clientX - edgeGest.x0, dy = e.clientY - edgeGest.y0;
    edgeGest.moved = Math.max(edgeGest.moved, Math.hypot(dx, dy));
    if (!edgeGest.opened && dx > 20) {
      clearTimeout(edgeGest.timer);
      edgeGest.opened = true;
      edgeGest.scrubY0 = e.clientY;
      buzz(8);
      openMobileDrawer(true);
    }
    if (edgeGest.opened && !edgeGest.scrubbing && Math.abs(e.clientY - edgeGest.scrubY0) > 12) {
      edgeGest.scrubbing = true;
      rail.classList.add('scrubbing');
      buzz(6);
    }
    if (edgeGest.scrubbing) {
      e.preventDefault();
      updateScrubTarget(e.clientY);
    }
  });

  const endEdgeGest = e => {
    if (!edgeGest || edgeGest.pid !== e.pointerId) return;
    const g = edgeGest; edgeGest = null;
    clearTimeout(g.timer);
    edge.classList.remove('active');
    suppressClickUntil = performance.now() + 260;
    if (g.scrubbing) {
      if (!commitScrub()) {
        rail.classList.remove('scrubbing');
        previewKey = null; previewTopicId = null;
        applyActiveHighlight(activeKey); placeNotch(false);
      }
    } else if (!g.opened && g.moved < 14) {
      buzz(8);
      openMobileDrawer(true);
    }
  };
  edge.addEventListener('pointerup', endEdgeGest);
  edge.addEventListener('pointercancel', endEdgeGest);

  // 3) Auf Mobil: Wischen nach links auf dem offenen Quick-Menü (Kopf/Fuß/Leiste) schließt es sanft
  let railSwipe = null;
  rail.addEventListener('pointerdown', e => {
    if (isDesktop() || !mobileOpen || e.target.closest('#gsMainView, input')) return;
    railSwipe = { pid: e.pointerId, x0: e.clientX, y0: e.clientY };
  });
  rail.addEventListener('pointermove', e => {
    if (!railSwipe || railSwipe.pid !== e.pointerId) return;
    const dx = e.clientX - railSwipe.x0, dy = e.clientY - railSwipe.y0;
    if (dx < -46 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      railSwipe = null;
      buzz(5);
      closeMobileDrawer();
    }
  });
  rail.addEventListener('pointerup', () => { railSwipe = null; });
  rail.addEventListener('pointercancel', () => { railSwipe = null; });

  /* ========================================================================
     LIVE-SUCHE & KLICKS
     ======================================================================== */

  searchBtn.addEventListener('click', () => {
    buzz(7);
    if (!expanded) {
      expanded = true;
      applyState();
      setTimeout(() => searchIn.focus(), 140);
    } else {
      searchIn.focus();
    }
  });

  searchIn.addEventListener('focus', () => {
    if (!isDesktop()) rail.classList.add('searching');
  });
  searchIn.addEventListener('blur', () => {
    if (!query.trim()) rail.classList.remove('searching');
  });

  searchIn.addEventListener('input', () => {
    query = searchIn.value;
    if (!isDesktop()) rail.classList.toggle('searching', !!query.trim() || document.activeElement === searchIn);
    renderSearch();
  });

  searchIn.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const first = resEl.querySelector('[data-gs-hit]');
      if (first) { e.preventDefault(); openSearchHit(first.dataset.gsHit); }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (query) clearSearch();
      else { searchIn.blur(); if (mobileOpen) closeMobileDrawer(); }
    }
  });

  searchClr.addEventListener('click', () => {
    buzz(5);
    clearSearch();
    searchIn.focus();
  });

  rail.addEventListener('click', e => {
    if (performance.now() < suppressClickUntil) return;

    const hitBtn = e.target.closest('[data-gs-hit]');
    if (hitBtn) return openSearchHit(hitBtn.dataset.gsHit);

    const navBtn = e.target.closest('[data-gs-nav]');
    if (navBtn) return navigateTo(navBtn.dataset.gsNav);

    const topicBtn = e.target.closest('[data-gs-topic]');
    if (topicBtn) {
      buzz(8);
      if (!isDesktop()) closeMobileDrawer();
      selectBrainTopic(topicBtn.dataset.gsTopic);
      return;
    }

    const actBtn = e.target.closest('[data-gs]');
    if (!actBtn) return;
    const act = actBtn.dataset.gs;
    if (act === 'toggle') {
      setExpanded(!expanded);
      return;
    }
    if (!isDesktop()) closeMobileDrawer();
    buzz(8);
    if (act === 'settings') openSettings();
    else if (act === 'new-note') openNote();
    else if (act === 'new-todo') openQuickTodo();
    else if (act === 'timer') openTimerSheet();
    else if (act === 'brain') switchTab('brain');
  });

  scrim.addEventListener('click', () => { buzz(5); closeMobileDrawer(); });

  const onKey = e => { if (e.key === 'Escape' && mobileOpen && document.activeElement !== searchIn) closeMobileDrawer(); };
  const onResize = () => {
    if (isDesktop()) mobileOpen = false;
    applyState();
  };
  addEventListener('keydown', onKey);
  addEventListener('resize', onResize);

  // Jedes Nav-Element beobachten, damit der weiße Notch beim Aufklappen der Untertitel absolut synchron bleibt
  const ro = new ResizeObserver(() => placeNotch(false));
  ro.observe(navEl);
  navEl.querySelectorAll('.gs-item').forEach(el => ro.observe(el));

  syncData();
  applyState();

  return {
    sync: syncData,
    openMobile: () => openMobileDrawer(true),
    closeMobile: closeMobileDrawer,
    focusSearch() {
      if (!isDesktop()) mobileOpen = true;
      expanded = true;
      syncData();
      applyState();
      setTimeout(() => searchIn.focus(), 140);
    },
    toggle: () => setExpanded(!expanded),
    destroy() {
      notchY.stop(); notchH.stop();
      ro.disconnect();
      removeEventListener('keydown', onKey);
      removeEventListener('resize', onResize);
      removeEventListener('pointermove', onNavMove);
      removeEventListener('pointerup', endNavScrub);
      removeEventListener('pointercancel', endNavScrub);
      rail.remove(); scrim.remove(); edge.remove();
      document.body.classList.remove('gs-expanded', 'gs-ready');
    },
  };
}
