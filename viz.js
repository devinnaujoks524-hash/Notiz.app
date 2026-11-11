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

export function cardMarkup(c, mode = 'flat') {
  const [a, b, ink] = THEMES[c.theme] || THEMES.sunset;
  const style = `--a:${a};--b:${b};--ink:${ink}`;
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
