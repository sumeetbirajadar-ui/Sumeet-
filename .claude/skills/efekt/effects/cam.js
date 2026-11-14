// cam: frosted glass widgets float around your head (never over the face) and pop in one after another:
// a big number, a render in progress, a mini chart, a profile pill, an HD ring (the render is 1080p), an "edited with Claude" pill.
// text (the big number), handle, label (the render card's label)
EFEKT.register("cam", (c) => {
  const big = c.str("text", "7"), handle = c.str("handle", "@isamercanai"), label = c.str("label", "Render alınıyor");
  const spark = `<svg class="cam-spark" viewBox="-12 -12 24 24">${[0, 1, 2, 3].map((i) =>
    `<line x1="0" y1="-10" x2="0" y2="10" transform="rotate(${i * 45})"/>`).join("")}</svg>`;
  const W = c.W, H = c.H, M = 44;
  const f0 = c.face(c.start);
  // the face's reach over the whole window, so a lean or a push-in never brings it under a widget
  const reach = { left: f0.left, right: f0.right, top: f0.top, h: f0.h };
  for (let t = c.start; t <= c.end; t += 0.1) {
    const g = c.face(t);
    reach.left = Math.min(reach.left, g.left); reach.right = Math.max(reach.right, g.right);
    reach.top = Math.min(reach.top, g.top); reach.h = Math.max(reach.h, g.h);
  }
  const headTop = reach.top - reach.h * 0.32;
  // the side columns sit between the canvas edge and the face, with a gap
  const leftW = Math.max(250, Math.min(340, reach.left - reach.h * 0.12 - M));
  const rightX = Math.max(reach.right + reach.h * 0.1, W - M - 340), rightW = W - M - rightX;
  // Instagram's safe area on 1080 × 1920: y 250–1580 (the Reels header above, the caption and buttons below)
  const SAFE_TOP = 250 * H / 1920, SAFE_BOTTOM = 1580 * H / 1920;
  const topY = Math.max(SAFE_TOP, Math.min(SAFE_TOP + 40, headTop - 330));

  // each widget: an outer box placed and floated by follow, an inner card that pops
  const widgets = [];
  // h: the widget's rendered height (measured at 1080 wide), so its y can be clamped into the safe area
  function widget(cls, x, y, w, origin, html, h) {
    y = Math.max(SAFE_TOP, Math.min(SAFE_BOTTOM - h, y));
    const o = c.el("div", "cam-w", c.front);
    Object.assign(o.style, { left: `${x}px`, top: `${y}px`, width: w ? `${w}px` : "" });
    const card = c.el("div", `cam-card ${cls}`, o, html);
    card.style.transformOrigin = origin;
    widgets.push({ o, card, y, h });
    return card;
  }

  // (a) top left: the big number
  const a = widget("cam-num", M, topY, leftW, "100% 0%",
    `<div class="cam-head"><i class="cam-dot"></i>Claude</div><div class="cam-big">${big}</div><div class="cam-cap">efekt · tek klip</div>`, 300);
  // (b) top right: the render
  const bW = Math.min(440, W - M - Math.max(f0.x + 40, W * 0.5));
  const b = widget("cam-render", W - M - bW, topY, bW, "0% 0%",
    `<div class="cam-head"><i class="cam-dot cam-red"></i>${label}</div><div class="cam-bar"><i></i></div>` +
    `<div class="cam-meta"><span>1080p render</span><span class="cam-pct mono">%0</span></div>`, 185);
  // (c) left mid: the mini chart
  const bars = [1, 0.74, 0.62, 0.45, 0.33];
  const chartY = topY + 360;
  const ch = widget("cam-chart", M, chartY, leftW, "100% 50%",
    `<div class="cam-title">Son reel'ler</div><div class="cam-bars">${bars.map((h, i) =>
      `<i class="${i ? "" : "cam-hi"}" style="height:${Math.round(h * 100)}%"></i>`).join("")}</div>`, 265);
  // (d) right mid: the profile pill
  // just under the render card (≈ 185 tall), beside the crown, so it stays above the face's top edge
  const pY = topY + 200;
  const pr = widget("cam-prof", 0, pY, 0, "0% 50%",
    `<div class="cam-av">İM</div><div class="cam-who"><b>${handle}</b><span>düzenleniyor…</span></div>`, 120);
  // the pill sizes to its text and hangs from the right margin (it sits beside the crown, where the head is narrow)
  Object.assign(pr.parentNode.style, { left: "auto", right: `${M}px` });
  // (e) the HD ring
  const R = 78, C = 2 * Math.PI * R;
  const ringD = 210;
  const k = widget("cam-k", rightX + (rightW - ringD) / 2, pY + 170, ringD, "50% 50%",
    `<svg viewBox="0 0 200 200"><circle class="cam-track" cx="100" cy="100" r="${R}"/>` +
    `<circle class="cam-ring" cx="100" cy="100" r="${R}" style="stroke-dasharray:${C};stroke-dashoffset:${C}"/></svg><div class="cam-hd">HD</div>`, ringD);
  // (f) bottom centre: the pill, its bottom edge at least 360 px above the canvas bottom (≤ y 1560), clear of the caption
  const pillH = 100;
  const pill = widget("cam-pill", 0, H - 360 * H / 1920 - pillH, 0, "50% 50%", `${spark}<span><b>Claude</b> ile düzenlendi</span>`, pillH);
  pill.parentNode.style.left = "0"; pill.parentNode.style.width = `${W}px`;

  // pop in, staggered, each from the side it faces (the top row rises from below, never from above the safe line)
  const T = c.start;
  [[a, 0, { x: -30, y: 20 }], [b, 0.08, { x: 30, y: 20 }], [pr, 0.16, { x: 40 }], [ch, 0.24, { x: -40 }],
    [k, 0.32, { scale: 0.3 }], [pill, 0.44, { y: 40 }]].forEach(([n, dt, from]) => c.pop(n, T + dt, 0.5, from));

  // the big number counts up to its value when it is a number
  const bigEl = a.querySelector(".cam-big");
  if (/^\d+$/.test(big)) c.count(bigEl, 0, Number(big), T + 0.1, 0.6);
  // the render bar and its percentage
  const fill = b.querySelector(".cam-bar i"), pct = b.querySelector(".cam-pct");
  const rd = Math.max(0.8, c.dur - 0.6);
  c.tl.fromTo(fill, { scaleX: 0 }, { scaleX: 1, duration: rd, ease: "power1.out", immediateRender: false }, T + 0.35);
  c.count(pct, 0, 100, T + 0.35, rd, (n) => `%${Math.round(n)}`, "power1.out");
  // the bars rise
  ch.querySelectorAll(".cam-bars i").forEach((n, i) =>
    c.tl.fromTo(n, { scaleY: 0 }, { scaleY: 1, duration: 0.55, ease: "back.out(1.6)", immediateRender: false }, T + 0.4 + i * 0.07));
  // the ring draws
  c.tl.fromTo(k.querySelector(".cam-ring"), { strokeDashoffset: C }, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut", immediateRender: false }, T + 0.45);
  // the red dot breathes
  const dot = b.querySelector(".cam-red");
  for (let t = 0; t < c.dur; t += 0.8) c.tl.fromTo(dot, { opacity: 1 }, { opacity: 0.35, duration: 0.4, yoyo: true, repeat: 1, ease: "sine.inOut", immediateRender: false }, T + t);

  // float: each widget bobs on its own phase and follows the head a little (parallax)
  const smooth = (t) => { let x = 0, y = 0; for (const d of [-0.2, -0.1, 0, 0.1, 0.2]) { const g = c.face(Math.max(c.start, t + d)); x += g.x / 5; y += g.y / 5; } return { x, y }; };
  c.follow((f, p, t) => {
    const s = smooth(t), dx = (s.x - f0.x) * 0.5, dy = (s.y - f0.y) * 0.4, lt = t - c.start;
    // the float is clamped too, so a lean never pushes a widget out of the safe area
    return widgets.map(({ o, y, h }, i) => [o, {
      x: dx + Math.sin(lt * 1.7 + i * 1.3) * 4,
      y: Math.max(SAFE_TOP - y, Math.min(SAFE_BOTTOM - h - y, dy + Math.sin(lt * 2.1 + i * 2.1) * 7)),
    }]);
  });
});
