// Lumen Zentrale (Graph): Drehendes Lumen-Gehirn in der Mitte, Themen-Knoten und Abschnitte wie in Obsidian.

const RAD = Math.PI / 180;
const GOLDEN = 137.508 * RAD;

export function ensureBrain(data) {
  if (!data.brain || !Array.isArray(data.brain.topics)) data.brain = { topics: [] };
  return data.brain;
}

function nextTopicPos(topics) {
  const n = topics.length;
  const ring = n < 6 ? 110 : 168;
  const angle = -Math.PI / 2 + n * GOLDEN;
  return {
    x: Math.round(Math.cos(angle) * ring),
    y: Math.round(Math.sin(angle) * ring),
  };
}

function nextSectionPos(topic) {
  const idx = (topic.sections || []).length;
  const baseAngle = Math.atan2(topic.y || -1, topic.x || 0.001);
  const spread = idx === 0 ? 0 : (idx % 2 === 1 ? 1 : -1) * Math.ceil(idx / 2) * 0.56;
  const angle = baseAngle + spread;
  const dist = 76 + Math.floor(idx / 5) * 30;
  return {
    x: Math.round((topic.x || 0) + Math.cos(angle) * dist),
    y: Math.round((topic.y || 0) + Math.sin(angle) * dist),
  };
}

export function mountBrain(root, api) {
  const { data, save, ic, esc, toast, buzz, dialog, reduced, COLORS, openBrainNote, uid, initialSelect } = api;
  const brain = ensureBrain(data);

  let panX = 0, panY = 0, zoom = 1;
  let selectedTopicId = initialSelect?.topicId || null;
  let freshNodeId = null;
  let mode = 'root'; // 'root' | 'section' (when adding a section to selected topic via bar)

  const stage = root.querySelector('#brStage');
  const world = root.querySelector('#brWorld');
  const svg = root.querySelector('#brSvg');
  const nodesBox = root.querySelector('#brNodes');
  const dock = root.querySelector('#brDock');
  const input = root.querySelector('#brInput');
  const suggest = root.querySelector('#brSuggest');
  const form = root.querySelector('#brForm');
  const modeChip = root.querySelector('#brModeChip');
  const emptyHint = root.querySelector('#brHint');

  const topicById = id => brain.topics.find(t => t.id === id);
  const findTopicByTitle = title => {
    const q = title.trim().toLowerCase();
    return brain.topics.find(t => t.title.trim().toLowerCase() === q);
  };

  function applyTransform(animate = false) {
    if (animate && !reduced()) {
      world.style.transition = 'transform 420ms cubic-bezier(.22, 1, .36, 1)';
      setTimeout(() => { if (world.isConnected) world.style.transition = ''; }, 440);
    } else {
      world.style.transition = '';
    }
    world.style.transform = `translate3d(${panX.toFixed(1)}px, ${panY.toFixed(1)}px, 0) scale(${zoom.toFixed(3)})`;
    stage.style.setProperty('--gx', `${panX.toFixed(1)}px`);
    stage.style.setProperty('--gy', `${panY.toFixed(1)}px`);
  }

  function centerOn(x = 0, y = 0, targetZoom = 1) {
    panX = -x * targetZoom;
    panY = -y * targetZoom - (selectedTopicId ? 42 : 0);
    zoom = targetZoom;
    applyTransform(true);
  }

  function edgePath(x1, y1, x2, y2) {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const dx = x2 - x1, dy = y2 - y1;
    const bend = 0.08;
    const cx = mx - dy * bend, cy = my + dx * bend;
    return `M${x1.toFixed(1)} ${y1.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }

  function paintEdges() {
    let lines = '';
    for (const t of brain.topics) {
      const sel = t.id === selectedTopicId;
      const d = edgePath(0, 0, t.x, t.y);
      lines += `<path class="br-edge main${sel ? ' act' : ''}${freshNodeId === t.id ? ' fresh' : ''}" d="${d}" style="--a:var(--${t.color || 'blue'})" pathLength="100"/>`;
      if (!reduced()) {
        lines += `<path class="br-pulse-line${sel ? ' act' : ''}" d="${d}" style="--a:var(--${t.color || 'blue'})" pathLength="100"/>`;
      }
      for (const s of (t.sections || [])) {
        const sd = edgePath(t.x, t.y, s.x, s.y);
        lines += `<path class="br-edge sub${sel ? ' act' : ''}${freshNodeId === s.id ? ' fresh' : ''}" d="${sd}" style="--a:var(--${t.color || 'blue'})" pathLength="100"/>`;
      }
    }
    svg.innerHTML = lines;
  }

  function paintNodes() {
    emptyHint.hidden = brain.topics.length > 0;
    let html = '';
    for (const t of brain.topics) {
      const sel = t.id === selectedTopicId;
      const cnt = (t.sections || []).length;
      html += `<button type="button" class="br-node topic${sel ? ' sel' : ''}${freshNodeId === t.id ? ' pop' : ''}" data-tid="${t.id}" style="--a:var(--${t.color || 'blue'});left:${t.x}px;top:${t.y}px" aria-label="Thema ${esc(t.title)}">
        <span class="br-dot"><i></i></span>
        <span class="br-lbl"><b>${esc(t.title)}</b>${cnt ? `<em>${cnt}</em>` : ''}</span>
      </button>`;
      for (const s of (t.sections || [])) {
        html += `<button type="button" class="br-node section${sel ? ' lit' : ''}${freshNodeId === s.id ? ' pop' : ''}" data-tid="${t.id}" data-sid="${s.id}" style="--a:var(--${t.color || 'blue'});left:${s.x}px;top:${s.y}px" aria-label="Abschnitt ${esc(s.title)} in ${esc(t.title)}">
          <span class="br-sdot"></span>
          <span class="br-slbl">${esc(s.title)}</span>
        </button>`;
      }
    }
    nodesBox.innerHTML = html;
  }

  function paintDock() {
    const t = selectedTopicId ? topicById(selectedTopicId) : null;
    if (!t) {
      dock.classList.remove('in');
      dock.setAttribute('inert', '');
      return;
    }
    const secs = t.sections || [];
    dock.style.setProperty('--a', `var(--${t.color || 'blue'})`);
    dock.innerHTML = `
      <div class="br-dock-top">
        <span class="br-dock-dot"></span>
        <div class="br-dock-title">
          <b>${esc(t.title)}</b>
          <small>${secs.length} ${secs.length === 1 ? 'Abschnitt' : 'Abschnitte'}</small>
        </div>
        <div class="br-dock-colors" role="radiogroup" aria-label="Farbe">
          ${COLORS.map(c => `<button type="button" class="br-col${c === t.color ? ' on' : ''}" data-bcol="${c}" style="--c:var(--${c})" aria-label="${c}" aria-checked="${c === t.color}"></button>`).join('')}
        </div>
        <button type="button" class="iconbtn sm" data-bact="del" aria-label="Thema löschen">${ic('trash')}</button>
        <button type="button" class="iconbtn sm" data-bact="close" aria-label="Schließen">${ic('x')}</button>
      </div>
      ${secs.length ? `<div class="br-dock-secs" role="list">${secs.map(s => `<button type="button" class="br-sec-pill" role="listitem" data-bsec="${s.id}">${ic('note')}<span>${esc(s.title)}</span></button>`).join('')}</div>` : ''}
      <div class="br-dock-acts">
        <button type="button" class="btn primary sm br-btn-add" data-bact="addsec">${ic('plus')}<span>Neuer Abschnitt</span></button>
        <button type="button" class="btn sm" data-bact="edittopic">${ic('edit')}<span>Notiz öffnen</span></button>
      </div>`;
    dock.removeAttribute('inert');
    requestAnimationFrame(() => dock.classList.add('in'));
  }

  function paintModeBar() {
    const t = mode === 'section' && selectedTopicId ? topicById(selectedTopicId) : null;
    if (t) {
      modeChip.hidden = false;
      modeChip.style.setProperty('--a', `var(--${t.color || 'blue'})`);
      modeChip.innerHTML = `<span class="br-m-dot"></span><span>${esc(t.title)}</span><button type="button" id="brExitMode" aria-label="Modus beenden">${ic('x')}</button>`;
      input.placeholder = `Neuer Abschnitt in „${t.title}“ …`;
    } else {
      mode = 'root';
      modeChip.hidden = true;
      modeChip.innerHTML = '';
      input.placeholder = 'Übertitel oder „Thema / Abschnitt“ …';
    }
  }

  function paintSuggest() {
    const raw = input.value.trim();
    if (!raw || mode === 'section') { suggest.hidden = true; suggest.innerHTML = ''; return; }
    const q = raw.toLowerCase();
    const matches = brain.topics.filter(t => t.title.toLowerCase().includes(q)).slice(0, 3);
    if (!matches.length) { suggest.hidden = true; suggest.innerHTML = ''; return; }
    suggest.hidden = false;
    suggest.innerHTML = matches.map(t => `
      <button type="button" class="br-sug-item" data-sug-sec="${t.id}" style="--a:var(--${t.color || 'blue'})">
        <span class="br-sug-dot"></span>
        <span>Neuer Abschnitt in <b>${esc(t.title)}</b></span>
        <span class="br-sug-plus">${ic('plus')}</span>
      </button>`).join('');
  }

  function paintAll() {
    paintEdges();
    paintNodes();
    paintDock();
    paintModeBar();
    paintSuggest();
    freshNodeId = null;
  }

  function createTopic(title) {
    const pos = nextTopicPos(brain.topics);
    const t = {
      id: uid(),
      title: title.trim().slice(0, 48),
      color: COLORS[brain.topics.length % COLORS.length],
      body: '',
      x: pos.x,
      y: pos.y,
      updated: Date.now(),
      sections: [],
    };
    brain.topics.push(t);
    selectedTopicId = t.id;
    freshNodeId = t.id;
    save();
    buzz(12);
    paintAll();
    centerOn(t.x * 0.45, t.y * 0.45, zoom);
    toast(`„${t.title}“ verbunden`);
    return t;
  }

  function createSection(topic, rawTitle, openRightAway = true) {
    topic.sections ||= [];
    const title = (rawTitle || '').trim().slice(0, 56) || `Abschnitt ${topic.sections.length + 1}`;
    const pos = nextSectionPos(topic);
    const s = {
      id: uid(),
      title,
      body: '',
      x: pos.x,
      y: pos.y,
      updated: Date.now(),
    };
    topic.sections.push(s);
    topic.updated = Date.now();
    selectedTopicId = topic.id;
    freshNodeId = s.id;
    mode = 'root';
    save();
    buzz(12);
    paintAll();
    centerOn(s.x * 0.5, s.y * 0.5, zoom);
    if (openRightAway) {
      setTimeout(() => openBrainNote(topic.id, s.id, () => paintAll()), 260);
    }
    return s;
  }

  function enterSectionMode(topicId) {
    selectedTopicId = topicId;
    mode = 'section';
    input.value = '';
    paintAll();
    const t = topicById(topicId);
    if (t) centerOn(t.x * 0.45, t.y * 0.45, zoom);
    input.focus();
  }

  // Smart Input Submit:
  // 1) "Steuern / Quittungen" oder "Steuern: Quittungen" -> erstellt/findet "Steuern" + neuen Abschnitt "Quittungen" & öffnet Editor!
  // 2) Im Abschnitt-Modus -> erstellt direkt neuen Abschnitt im gewählten Thema & öffnet Editor!
  // 3) "Steuern" (existiert noch nicht) -> erstellt neuen Übertitel "Steuern" verbunden mit der Zentrale!
  // 4) "Steuern" (existiert schon!) -> springt direkt in den Abschnitt-Modus für "Steuern" (oder öffnet es)!
  form.addEventListener('submit', e => {
    e.preventDefault();
    const raw = input.value.trim();
    if (!raw) return;

    if (mode === 'section' && selectedTopicId) {
      const t = topicById(selectedTopicId);
      if (t) {
        input.value = '';
        createSection(t, raw, true);
        return;
      }
    }

    const split = raw.match(/^(.+?)\s*[/:\->›]\s*(.+)$/);
    if (split) {
      const tName = split[1].trim(), sName = split[2].trim();
      const topic = findTopicByTitle(tName) || createTopic(tName);
      input.value = '';
      createSection(topic, sName, true);
      return;
    }

    const existing = findTopicByTitle(raw);
    if (existing) {
      enterSectionMode(existing.id);
      toast(`Abschnitt für „${existing.title}“ eingeben`);
      return;
    }

    input.value = '';
    createTopic(raw);
  });

  input.addEventListener('input', paintSuggest);
  input.addEventListener('keydown', e => {
    if (e.key === 'Backspace' && !input.value && mode === 'section') {
      mode = 'root';
      paintModeBar();
    } else if (e.key === 'Escape') {
      mode = 'root';
      input.value = '';
      paintModeBar();
      paintSuggest();
      input.blur();
    }
  });

  modeChip.addEventListener('click', e => {
    if (e.target.closest('#brExitMode')) {
      mode = 'root';
      paintModeBar();
      input.focus();
    }
  });

  suggest.addEventListener('click', e => {
    const b = e.target.closest('[data-sug-sec]');
    if (!b) return;
    buzz(8);
    enterSectionMode(b.dataset.sugSec);
  });

  // Dock-Aktionen
  dock.addEventListener('click', async e => {
    const t = selectedTopicId ? topicById(selectedTopicId) : null;
    if (!t) return;

    const col = e.target.closest('[data-bcol]');
    if (col) {
      t.color = col.dataset.bcol;
      t.updated = Date.now();
      save(); buzz(6); paintAll();
      return;
    }

    const secBtn = e.target.closest('[data-bsec]');
    if (secBtn) {
      buzz(8);
      openBrainNote(t.id, secBtn.dataset.bsec, () => paintAll());
      return;
    }

    const actBtn = e.target.closest('[data-bact]');
    if (!actBtn) return;
    const act = actBtn.dataset.bact;
    buzz(8);
    if (act === 'close') { selectedTopicId = null; mode = 'root'; paintAll(); }
    else if (act === 'addsec') { enterSectionMode(t.id); }
    else if (act === 'edittopic') { openBrainNote(t.id, null, () => paintAll()); }
    else if (act === 'del') {
      if (!(await dialog({ title: `„${t.title}“ löschen?`, body: 'Das Thema und alle dazugehörigen Abschnitte werden aus dem Graphen entfernt.', ok: 'Löschen', danger: true }))) return;
      const copy = structuredClone ? structuredClone(t) : JSON.parse(JSON.stringify(t));
      brain.topics = brain.topics.filter(x => x.id !== t.id);
      selectedTopicId = null; mode = 'root';
      save(); paintAll();
      toast(`„${copy.title}“ gelöscht`, {
        undo: () => {
          if (!brain.topics.some(x => x.id === copy.id)) {
            brain.topics.push(copy);
            selectedTopicId = copy.id;
            save(); paintAll();
          }
        },
      });
    }
  });

  function fitView() {
    const pts = [[0, 0]];
    brain.topics.forEach(t => {
      pts.push([t.x, t.y]);
      (t.sections || []).forEach(s => pts.push([s.x, s.y]));
    });
    const maxX = Math.max(120, ...pts.map(p => Math.abs(p[0]) + 72));
    const maxY = Math.max(120, ...pts.map(p => Math.abs(p[1]) + 60));
    const sw = Math.max(260, stage.clientWidth || 380);
    const sh = Math.max(300, (stage.clientHeight || 520) - 120);
    const fitZ = Math.min(1, Math.max(0.55, Math.min(sw / (maxX * 2), sh / (maxY * 2))));
    centerOn(0, 0, fitZ);
  }

  // Zoom & Reset-Buttons
  root.querySelector('#brZoomIn').addEventListener('click', () => { zoom = Math.min(2, zoom * 1.2); applyTransform(true); buzz(5); });
  root.querySelector('#brZoomOut').addEventListener('click', () => { zoom = Math.max(0.45, zoom / 1.2); applyTransform(true); buzz(5); });
  root.querySelector('#brReset').addEventListener('click', () => { fitView(); buzz(6); });
  root.querySelector('#brCore').addEventListener('click', () => { selectedTopicId = null; mode = 'root'; fitView(); paintAll(); buzz(8); });

  // Interaktives Pan, Zoom & Knoten-Drag (Maus + Touch)
  const ptrs = new Map();
  let drag = null, pinch0 = null;

  const onPointerDown = e => {
    if (e.target.closest('.br-tools, .br-dock')) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (ptrs.size === 2) {
      drag = null;
      const [a, b] = [...ptrs.values()];
      pinch0 = { dist: Math.hypot(b.x - a.x, b.y - a.y) || 1, zoom };
      return;
    }

    const nodeEl = e.target.closest('.br-node');
    if (nodeEl) {
      const tid = nodeEl.dataset.tid, sid = nodeEl.dataset.sid || null;
      const t = topicById(tid);
      if (!t) return;
      const target = sid ? (t.sections || []).find(s => s.id === sid) : t;
      if (!target) return;
      drag = {
        kind: 'node',
        pid: e.pointerId,
        el: nodeEl,
        t,
        s: sid ? target : null,
        x0: e.clientX,
        y0: e.clientY,
        nx0: target.x,
        ny0: target.y,
        sec0: sid ? null : (t.sections || []).map(s => ({ s, x: s.x, y: s.y })),
        moved: 0,
      };
      stage.setPointerCapture?.(e.pointerId);
      return;
    }

    if (e.target.closest('#brCore')) return;

    drag = { kind: 'pan', pid: e.pointerId, x0: e.clientX, y0: e.clientY, px0: panX, py0: panY, moved: 0 };
    stage.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = e => {
    if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (ptrs.size === 2 && pinch0) {
      const [a, b] = [...ptrs.values()];
      const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      zoom = Math.max(0.45, Math.min(2, pinch0.zoom * (d / pinch0.dist)));
      applyTransform(false);
      return;
    }

    if (!drag || drag.pid !== e.pointerId) return;
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    drag.moved = Math.max(drag.moved, Math.hypot(dx, dy));

    if (drag.kind === 'pan') {
      panX = drag.px0 + dx;
      panY = drag.py0 + dy;
      applyTransform(false);
    } else if (drag.kind === 'node' && drag.moved > 5) {
      const wx = dx / zoom, wy = dy / zoom;
      if (drag.s) {
        drag.s.x = Math.round(drag.nx0 + wx);
        drag.s.y = Math.round(drag.ny0 + wy);
        drag.el.style.left = `${drag.s.x}px`;
        drag.el.style.top = `${drag.s.y}px`;
      } else {
        drag.t.x = Math.round(drag.nx0 + wx);
        drag.t.y = Math.round(drag.ny0 + wy);
        drag.el.style.left = `${drag.t.x}px`;
        drag.el.style.top = `${drag.t.y}px`;
        // Kind-Abschnitte folgen ihrem Thema organisch mit
        drag.sec0?.forEach(({ s, x, y }) => {
          s.x = Math.round(x + wx);
          s.y = Math.round(y + wy);
          const sel = nodesBox.querySelector(`.br-node[data-sid="${s.id}"]`);
          if (sel) { sel.style.left = `${s.x}px`; sel.style.top = `${s.y}px`; }
        });
      }
      paintEdges();
    }
  };

  const onPointerUp = e => {
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch0 = null;
    if (!drag || drag.pid !== e.pointerId) return;
    const d = drag; drag = null;

    if (d.kind === 'node') {
      if (d.moved > 6) {
        save();
      } else if (d.s) {
        // Tipp auf Abschnitt -> sofort öffnen & reinschreiben
        buzz(8);
        selectedTopicId = d.t.id;
        paintAll();
        openBrainNote(d.t.id, d.s.id, () => paintAll());
      } else {
        // Tipp auf Thema -> auswählen & Dock einblenden
        buzz(8);
        selectedTopicId = d.t.id;
        mode = 'root';
        paintAll();
        centerOn(d.t.x * 0.45, d.t.y * 0.45, zoom);
      }
    } else if (d.kind === 'pan' && d.moved < 6) {
      if (selectedTopicId) {
        selectedTopicId = null;
        mode = 'root';
        paintAll();
      }
    }
  };

  const onWheel = e => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.91;
    zoom = Math.max(0.45, Math.min(2, zoom * factor));
    applyTransform(false);
  };

  stage.addEventListener('pointerdown', onPointerDown);
  stage.addEventListener('pointermove', onPointerMove);
  stage.addEventListener('pointerup', onPointerUp);
  stage.addEventListener('pointercancel', onPointerUp);
  stage.addEventListener('wheel', onWheel, { passive: false });

  paintAll();
  if (initialSelect?.topicId) {
    const t = topicById(initialSelect.topicId);
    if (t) centerOn(t.x * 0.45, t.y * 0.45, 1);
    if (initialSelect.sectionId) {
      setTimeout(() => openBrainNote(initialSelect.topicId, initialSelect.sectionId, () => paintAll()), 240);
    }
  } else {
    applyTransform(false);
  }

  return () => {
    stage.removeEventListener('pointerdown', onPointerDown);
    stage.removeEventListener('pointermove', onPointerMove);
    stage.removeEventListener('pointerup', onPointerUp);
    stage.removeEventListener('pointercancel', onPointerUp);
    stage.removeEventListener('wheel', onWheel);
  };
}
