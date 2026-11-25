// Glassy Sidebar V10 + Real Damped Spring Engine (Framer-Motion-artige Physik ohne Abhängigkeiten)

export function createSpring({ stiffness = 340, damping = 28, mass = 1, value = 0, onUpdate, onRest }) {
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

export function mountGlassySidebar(api) {
  const {
    getData, getTab, switchTab, openSpot, openSettings, openNote, openQuickTodo,
    openTimerSheet, openInvoiceList, selectBrainTopic, ic, esc, buzz, reduced, getTheme, getPrism,
  } = api;

  let expanded = false;
  let mobileOpen = false;
  let activeKey = getTab() || 'home';
  let initializedNotch = false;

  // Backdrop für mobile Überlagerung
  let scrim = document.getElementById('gsScrim');
  if (!scrim) {
    scrim = document.createElement('div');
    scrim.id = 'gsScrim';
    scrim.className = 'gs-scrim';
    document.body.appendChild(scrim);
  }

  let rail = document.getElementById('gsRail');
  if (!rail) {
    rail = document.createElement('aside');
    rail.id = 'gsRail';
    rail.className = 'gs-rail';
    rail.setAttribute('aria-label', 'Schnellnavigation');
    document.body.appendChild(rail);
  }

  rail.innerHTML = `
    <div class="gs-shell">
      <div class="gs-body">
        <div class="gs-head">
          <button type="button" class="gs-logo-btn" data-gs="toggle" aria-label="Seitenleiste umschalten">
            <span class="gs-orb" aria-hidden="true"></span>
            <span class="gs-brand-tx"><b>Lumen</b><small id="gsThemeSub">Workspace</small></span>
          </button>
        </div>

        <button type="button" class="gs-search" data-gs="search" aria-label="Suchen">
          <span class="gs-ic">${ic('search')}</span>
          <span class="gs-lbl">Suchen …</span>
          <kbd class="gs-kbd">⌘K</kbd>
        </button>

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

  // Echte gedämpfte Feder für die gleitende weiße Aktiv-Kapsel (Y-Position + Höhe)
  const notchY = createSpring({
    stiffness: 360,
    damping: 30,
    onUpdate: (y, vel) => {
      const stretch = Math.min(0.055, Math.abs(vel) * 0.00004);
      notch.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0) scaleY(${(1 + stretch).toFixed(4)})`;
    },
  });
  const notchH = createSpring({
    stiffness: 380,
    damping: 32,
    onUpdate: h => { notch.style.height = `${Math.max(40, h).toFixed(1)}px`; },
  });

  function placeNotch(immediate = false) {
    const btn = navEl.querySelector(`.gs-item[data-gs-nav="${activeKey}"]`) || navEl.querySelector('.gs-item');
    if (!btn || !btn.offsetHeight) return;
    const y = btn.offsetTop;
    const h = btn.offsetHeight;
    const instant = immediate || !initializedNotch || reduced();
    initializedNotch = true;
    notch.classList.add('on');
    notchY.set(y, instant);
    notchH.set(h, instant);
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

    // Echte Graph-Themen als farbige Projekt-Zeilen (wie im Video!)
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

    const curTab = getTab() || 'home';
    activeKey = curTab;
    navEl.querySelectorAll('.gs-item').forEach(b => {
      const on = b.dataset.gsNav === activeKey;
      b.classList.toggle('is-active', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });

    requestAnimationFrame(() => placeNotch(false));
  }

  function applyState() {
    const isDesktop = window.innerWidth >= 860;
    rail.classList.toggle('expanded', expanded);
    rail.classList.toggle('mobile-open', !isDesktop && mobileOpen);
    scrim.classList.toggle('on', !isDesktop && mobileOpen);
    document.body.classList.toggle('gs-expanded', isDesktop && expanded);
    document.body.classList.toggle('gs-ready', true);
    // Notch-Position nach dem Layout-Übergang mehrfach weich nachführen
    requestAnimationFrame(() => placeNotch(false));
    setTimeout(() => placeNotch(false), 180);
    setTimeout(() => placeNotch(false), 380);
  }

  function setExpanded(next) {
    expanded = next;
    buzz(7);
    applyState();
  }

  function openMobileDrawer() {
    mobileOpen = true;
    expanded = true;
    buzz(8);
    syncData();
    applyState();
  }

  function closeMobileDrawer() {
    if (!mobileOpen) return;
    mobileOpen = false;
    applyState();
  }

  rail.addEventListener('click', e => {
    const navBtn = e.target.closest('[data-gs-nav]');
    if (navBtn) {
      const k = navBtn.dataset.gsNav;
      activeKey = k;
      navEl.querySelectorAll('.gs-item').forEach(b => {
        const on = b.dataset.gsNav === k;
        b.classList.toggle('is-active', on);
        if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
      });
      placeNotch(false);
      buzz(7);
      if (k === 'invoices') {
        if (window.innerWidth < 860) closeMobileDrawer();
        setTimeout(() => openInvoiceList(), 120);
      } else {
        switchTab(k);
        if (window.innerWidth < 860) setTimeout(closeMobileDrawer, 190);
      }
      return;
    }

    const topicBtn = e.target.closest('[data-gs-topic]');
    if (topicBtn) {
      buzz(8);
      if (window.innerWidth < 860) closeMobileDrawer();
      selectBrainTopic(topicBtn.dataset.gsTopic);
      return;
    }

    const actBtn = e.target.closest('[data-gs]');
    if (!actBtn) return;
    const act = actBtn.dataset.gs;
    if (act === 'toggle') {
      if (window.innerWidth < 860 && mobileOpen && !expanded) {
        setExpanded(true);
      } else {
        setExpanded(!expanded);
      }
      return;
    }
    if (window.innerWidth < 860) closeMobileDrawer();
    buzz(8);
    if (act === 'search') openSpot();
    else if (act === 'settings') openSettings(actBtn);
    else if (act === 'new-note') openNote();
    else if (act === 'new-todo') openQuickTodo();
    else if (act === 'timer') openTimerSheet();
    else if (act === 'brain') switchTab('brain');
  });

  scrim.addEventListener('click', () => { buzz(5); closeMobileDrawer(); });

  const onKey = e => { if (e.key === 'Escape' && mobileOpen) closeMobileDrawer(); };
  const onResize = () => {
    if (window.innerWidth >= 860) mobileOpen = false;
    applyState();
  };
  addEventListener('keydown', onKey);
  addEventListener('resize', onResize);

  const ro = new ResizeObserver(() => placeNotch(false));
  ro.observe(navEl);

  syncData();
  applyState();

  return {
    sync: syncData,
    openMobile: openMobileDrawer,
    closeMobile: closeMobileDrawer,
    toggle: () => setExpanded(!expanded),
    destroy() {
      notchY.stop(); notchH.stop();
      ro.disconnect();
      removeEventListener('keydown', onKey);
      removeEventListener('resize', onResize);
      rail.remove(); scrim.remove();
      document.body.classList.remove('gs-expanded', 'gs-ready');
    },
  };
}
