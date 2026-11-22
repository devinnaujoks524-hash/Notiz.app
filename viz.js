// Visualisierung: Karten als schwebende 3D-Objekte.

export const THEMES = {
  sunset: ['#ff8a1f', '#ff2d78', '#fff'],
  ocean:  ['#2f7bff', '#00d4ff', '#fff'],
  lime:   ['#2fe06b', '#d4ff3d', '#07130a'],
  violet: ['#8a4dff', '#ff3bd4', '#fff'],
  gold:   ['#ffd23f', '#ff8a1f', '#1a1000'],
  night:  ['#2c2c35', '#09090c', '#fff'],
};

const grp = s => String(s ?? '').replace(/\s+/g, '').replace(/(.{4})/g, '$1 ').trim();
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function front(c) {
  if (c.type === 'mail') return `
    <i class="cm-fold l"></i><i class="cm-fold r"></i><i class="cm-fold b"></i><i class="cm-flap"></i>
    <div class="cf-top cm-top"><span class="cf-brand">${esc(c.name || 'E-Mail')}</span><span class="cf-net">MAIL</span></div>
    <span class="cm-seal">${esc((c.name || '@').trim().charAt(0).toUpperCase() || '@')}</span>
    <div class="cm-addr"><small>An</small><span>${esc(c.email || 'name@beispiel.de')}</span></div>`;
  if (c.type === 'member') return `
    <div class="cf-top"><span class="cf-brand">${esc(c.name || 'Kundenkarte')}</span><span class="cf-net">MITGLIED</span></div>
    <div class="cf-member">${esc(c.member || '—')}</div>
    <div class="cf-bottom"><div><small>Inhaber</small><span>${esc(c.holder || 'Dein Name')}</span></div></div>`;
  return `
    <div class="cf-top"><span class="cf-brand">${esc(c.name || 'Meine Bank')}</span><span class="cf-net">${esc(c.network || '')}</span></div>
    <div class="cf-chip"></div>
    <div class="cf-num${(c.number || '').length > 16 ? ' long' : ''}">${c.number ? esc(grp(c.number)) : `•••• •••• •••• ${esc(c.last4 || '0000')}`}</div>
    <div class="cf-bottom">
      <div><small>Inhaber</small><span>${esc(c.holder || 'Dein Name')}</span></div>
      <div><small>Gültig bis</small><span>${esc(c.exp || 'MM/JJ')}</span></div>
    </div>`;
}

function mailBack(c) {
  return `<div class="cface back mailback"><i class="cm-open"></i>
    <div class="cm-letter"><small>Passwort</small><p class="pw">••••••••</p><small class="gap">E-Mail</small><p class="ad">${esc(c.email || '')}</p></div></div>`;
}

// Echter Code-128B Barcode als SVG für Kundenkarten-Rückseiten (scanbar)
const C128 = '212222,222122,222221,121223,121322,131222,122213,122312,132212,221213,221312,231212,112232,122132,122231,113222,123122,123221,223211,221132,221231,213212,223112,312131,311222,321122,321221,312212,322112,322211,212123,212321,232121,111323,131123,131321,112313,132113,132311,211313,231113,231311,112133,112331,132131,113123,113321,133121,313121,211331,231131,213113,213311,213131,311123,311321,331121,312113,312311,332111,314111,221411,431111,111224,111422,121124,121421,141122,141221,112214,112412,122114,122411,142112,142211,241211,221114,413111,241112,134111,111242,121142,121241,114212,124112,124211,411212,421112,421211,212141,214121,412121,111143,111341,131141,114113,114311,411113,411311,113141,114131,311141,411131,211412,211214,211232,2331112'.split(',');
function barcodeSvg(raw) {
  const txt = String(raw || '').trim().replace(/[^\x20-\x7e]/g, '');
  if (!txt) return '';
  const codes = [104]; // Start B
  let sum = 104;
  for (let i = 0; i < txt.length; i++) {
    const v = txt.charCodeAt(i) - 32;
    codes.push(v);
    sum += v * (i + 1);
  }
  codes.push(sum % 103, 106); // Checksum + Stop
  let x = 10, bars = '';
  for (const c of codes) {
    const p = C128[c]; if (!p) continue;
    for (let i = 0; i < p.length; i++) {
      const w = +p[i];
      if (i % 2 === 0) bars += `<rect x="${x}" y="0" width="${w}" height="44"/>`;
      x += w;
    }
  }
  return `<div class="cb-code" aria-label="Barcode ${esc(txt)}"><svg viewBox="0 0 ${x + 10} 44" preserveAspectRatio="none" aria-hidden="true">${bars}</svg><span>${esc(txt)}</span></div>`;
}

export function cardMarkup(c, mode = 'flat') {
  const [a, b, ink] = THEMES[c.theme] || THEMES.sunset;
  const style = `--a:${a};--b:${b};--ink:${ink}`;
  if (mode === '3d' && c.type === 'mail') return `
    <div class="card3d" style="${style}">
      <div class="cface front">${front(c)}<div class="sheen"></div></div>
      ${mailBack(c)}
    </div>`;
  if (mode === '3d' && c.type === 'member' && c.member) return `
    <div class="card3d" style="${style}">
      <div class="cface front">${front(c)}<div class="sheen"></div></div>
      <div class="cface back memberback">
        <div class="cb-mhead"><span>${esc(c.name || 'Kundenkarte')}</span><small>SCAN</small></div>
        ${barcodeSvg(c.member)}
        ${c.note ? `<p class="cb-mnote">${esc(c.note)}</p>` : ''}
      </div>
    </div>`;
  if (mode === '3d') return `
    <div class="card3d" style="${style}">
      <div class="cface front">${front(c)}<div class="sheen"></div></div>
      <div class="cface back">
        <div class="cb-stripe"></div>
        <div class="cb-body">
          ${c.iban ? `<small>IBAN</small><p class="iban">${esc(grp(c.iban))}</p>` : ''}
          ${c.note || !c.iban ? `<small class="gap">Notiz</small><p class="nt">${esc(c.note || 'Keine Notiz')}</p>` : ''}
        </div>
        <div class="cb-dot"></div>
      </div>
    </div>`;
  return `<div class="cardflat cface" style="${style}">${front(c)}</div>`;
}

export function mountViewer(stage) {
  const card = stage.querySelector('.card3d'), sheen = card.querySelector('.sheen'), floor = stage.querySelector('.floor');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let rx = 0, ry = 0, flip = 0, flipT = 0, drag = null, moved = 0, t = 0, last = performance.now(), raf;

  stage.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY }; moved = 0; stage.setPointerCapture(e.pointerId); });
  stage.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag = { x: e.clientX, y: e.clientY }; moved += Math.abs(dx) + Math.abs(dy);
    ry += dx * .55; rx = Math.max(-50, Math.min(50, rx - dy * .45));
  });
  const end = () => { if (drag && moved < 8) flipT += 180; drag = null; };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', () => drag = null);
  stage.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flipT += 180; }
    if (e.key === 'ArrowLeft') ry -= 20; if (e.key === 'ArrowRight') ry += 20;
    if (e.key === 'ArrowUp') rx += 15; if (e.key === 'ArrowDown') rx -= 15;
  });

  function loop(now) {
    const dt = Math.max(0, Math.min(.05, (now - last) / 1000)); last = now; t += dt;
    if (!drag) { const k = Math.min(1, dt * 2.5); rx += -rx * k; ry += -ry * k; }
    flip += (flipT - flip) * Math.min(1, dt * (still ? 30 : 7));
    const m = still ? 0 : 1;
    const fy = Math.sin(t * 1.1) * 9 * m, fx = Math.sin(t * .8) * 5 * m, ty = Math.sin(t * 1.4) * 9 * m;
    const ay = flip + ry + fy, ax = rx + fx + 6;
    card.style.transform = `translateY(${ty.toFixed(2)}px) rotateX(${ax.toFixed(2)}deg) rotateY(${ay.toFixed(2)}deg)`;
    sheen.style.backgroundPosition = `${50 + Math.sin(ay * Math.PI / 180) * 60}% ${50 - ax}%`;
    floor.style.transform = `scale(${(1 - ty / 70).toFixed(3)})`;
    floor.style.opacity = (.6 - ty / 50).toFixed(3);
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(raf);
}
