// belgesel: an editorial/documentary frame. You in black and white on a deep magenta ground with a pink glow behind
// your head, a spaced-caps kicker, a three-line stamped headline beside your head, a Follow button a cursor clicks,
// and your name in a pink bar. text (lines with |), name, handle, kicker
EFEKT.register("belgesel", (c) => {
  const lines = c.list("text", ["TEK KLİP.", "7 EFEKT.", "EDİTÖR YOK."]);
  const name = c.str("name", "İSA MERCAN"), handle = c.str("handle", "@isamercanai");
  const kicker = c.str("kicker", "YAPAY ZEKÂ İLE ÜRETİM");
  const W = c.W, H = c.H, tl = c.tl, T = c.at;

  // the face over the window, averaged: the layout is stamped, it does not jitter with the head
  const N = 12, avg = { x: 0, y: 0, w: 0, h: 0 };
  // and its reach: the furthest the face goes left and right over the window (a lean must not bring the head into the text)
  const reach = { left: Infinity, right: -Infinity };
  for (let k = 0; k < N; k++) {
    const f = c.face(c.start + (c.dur * k) / (N - 1));
    for (const key in avg) avg[key] += f[key] / N;
  }
  for (let t = c.start; t <= c.end; t += 1 / 30) {
    const f = c.face(t);
    reach.left = Math.min(reach.left, f.left); reach.right = Math.max(reach.right, f.right);
  }

  // the camera slides you to one side so the headline gets a column of its own
  const S = 1.06, OX = W / 2, OY = H * 0.4;
  const textRight = avg.x <= W / 2;
  const target = textRight ? W * 0.29 : W * 0.71;
  const DX = Math.max(-250, Math.min(250, target - (OX + (avg.x - OX) * S)));
  const vis = (x, y) => [OX + (x - OX) * S + DX, OY + (y - OY) * S];
  const [fx, fy] = vis(avg.x, avg.y), fw = avg.w * S, fh = avg.h * S;
  const faceT = fy - fh / 2, faceB = fy + fh / 2;
  // the head (hair and ears) reaches past the face box by about a tenth of its width
  const headL = vis(reach.left, 0)[0] - fw * 0.12, headR = vis(reach.right, 0)[0] + fw * 0.12;
  c.camera({ scale: S, x: DX }, c.start, c.start + 0.5, "power3.inOut");
  c.grade("grayscale(1) contrast(1.18) brightness(1.04)", 0.25);

  // ---- behind you: the ground, the glow, the ring ----
  const ground = c.el("div", "bg-ground", c.back);
  const glow = c.el("div", "bg-glow", c.back);
  const ring = c.el("div", "bg-ring", c.back);
  tl.fromTo(ground, { opacity: 0 }, { opacity: 1, duration: 0.22, ease: "power2.out", immediateRender: false }, c.start);
  tl.fromTo(glow, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.6, ease: "power3.out", immediateRender: false }, T(0.1));
  tl.fromTo(ring, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.7, ease: "power3.out", immediateRender: false }, T(0.2));
  tl.fromTo(ring, { rotation: 0 }, { rotation: 40, duration: c.dur, ease: "none", immediateRender: false }, c.start);
  // the glow and the ring follow the head (they live inside the camera, in the source's coordinates)
  c.follow((f) => {
    const r = f.w * 1.05;
    return [
      [glow, { left: f.x, top: f.y - f.h * 0.08, width: r * 2, height: r * 2, xPercent: -50, yPercent: -50 }],
      [ring, { left: f.x, top: f.y - f.h * 0.08, width: r * 2.5, height: r * 2.5, xPercent: -50, yPercent: -50 }],
    ];
  });
  // ---- in front of you: a soft floor so the cut-out ends in black, not at an edge ----
  c.el("div", "bg-floor", c.front);

  // ---- on top: kicker, headline, follow, name ----
  const M = 60;
  // the headline column keeps at least CLEAR px from the head at its widest
  const CLEAR = 44;
  const colL = textRight ? Math.max(headR + CLEAR, W * 0.5) : M;
  const colR = textRight ? W - M : Math.min(headL - CLEAR, W * 0.5);
  const colW = colR - colL;

  const kick = c.el("div", "bg-kicker", c.top, kicker.split("·").map((s, i) => (i ? `<b>·</b>${s}` : s)).join(""));
  kick.style.left = `${M}px`;
  tl.fromTo(kick, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.5, ease: "power3.out", immediateRender: false }, T(0.12));

  // the headline: each line fitted to the column (a width estimate per glyph; the fonts are not loaded at build time)
  const em = (s, lead) => [...s].reduce((a, ch) => a + (lead
    ? (/[ .,]/.test(ch) ? 0.24 : /[IİÎ1]/.test(ch) ? 0.32 : /[MW]/.test(ch) ? 0.94 : 0.69)
    : (/[ .,]/.test(ch) ? 0.25 : /[IİÎ1]/.test(ch) ? 0.27 : /[MW]/.test(ch) ? 0.88 : 0.66)), 0);
  const maxSize = 128;
  const big = Math.min(maxSize, ...lines.slice(0, -1).map((s) => colW / em(s, false)));
  const head = c.el("div", "bg-head", c.top);
  head.style.left = `${colL}px`;
  head.style.width = `${colW}px`;
  if (!textRight) head.style.textAlign = "right";
  let y = 0;
  const nodes = lines.map((s, i) => {
    const lead = i === lines.length - 1 && lines.length > 1;
    const size = lead ? Math.min(big * 0.95, colW / em(s, true)) : big;
    const n = c.el("div", `bg-line ${lead ? "lead" : "big"} halo`, head, s);
    n.style.fontSize = `${size}px`;
    n.style.top = `${y}px`;
    y += size * (lead ? 1.12 : 1.0) + 2;
    return n;
  });
  const headH = y;
  // beside the head: start a little above the brow line, never lower than the kicker allows
  const headTop = Math.max(250, Math.min(faceT - fh * 0.1, faceB - headH));
  head.style.top = `${headTop}px`;
  nodes.forEach((n, i) => {
    const t = T(0.32 + i * 0.15);
    tl.fromTo(n, { opacity: 0, scale: 1.7, transformOrigin: textRight ? "0% 60%" : "100% 60%" },
      { opacity: 1, scale: 1, duration: 0.22, ease: "power4.in", immediateRender: false }, t);
    // the stamp lands: a 1-frame flash of the underline bar
  });
  const rule = c.el("div", "bg-rule", head);
  rule.style.top = `${headH + 18}px`;
  if (!textRight) { rule.style.left = "auto"; rule.style.right = "0"; }
  tl.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.4, ease: "power3.out", immediateRender: false }, T(0.32 + lines.length * 0.15 + 0.1));
  // a small kick of the whole frame on each stamp
  nodes.forEach((n, i) => {
    const t = T(0.32 + i * 0.15 + 0.22);
    tl.fromTo(head, { y: 7 }, { y: 0, duration: 0.12, ease: "power2.out", immediateRender: false }, t);
  });

  // the follow button and the cursor that clicks it
  const btnW = Math.min(colW, 420), btnH = 104;
  const btnX = textRight ? colL : colR - btnW;
  const btnY = Math.max(headTop + headH + 90, faceB + fh * 0.25);
  const btn = c.el("div", "bg-btn", c.top, `<span class="bg-btn-a">Takip et</span><span class="bg-btn-b">Takip ediliyor</span>`);
  Object.assign(btn.style, { left: `${btnX}px`, top: `${btnY}px`, width: `${btnW}px`, height: `${btnH}px` });
  const btnA = btn.querySelector(".bg-btn-a"), btnB = btn.querySelector(".bg-btn-b");
  c.pop(btn, T(0.75), 0.4, { y: 30 });
  const cur = c.el("div", "bg-cursor", c.top,
    `<svg viewBox="0 0 24 24" width="64" height="64"><path d="M4 2.5 L4 19.5 L8.6 15.4 L11.6 22 L14.6 20.7 L11.7 14.2 L18 14.2 Z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>`);
  const cx = btnX + btnW * 0.62, cy = btnY + btnH * 0.55;
  Object.assign(cur.style, { left: `${cx}px`, top: `${cy}px` });
  tl.fromTo(cur, { x: 260, y: 360, opacity: 0 },
    { x: 0, y: 0, opacity: 1, duration: 0.5, ease: "power3.out", immediateRender: false }, T(0.9));
  const click = T(1.4);
  tl.fromTo(cur, { scale: 1 }, { scale: 0.8, duration: 0.07, ease: "power2.in", immediateRender: false, transformOrigin: "15% 10%" }, click - 0.07);
  tl.to(cur, { scale: 1, duration: 0.14, ease: "back.out(3)" }, click);
  tl.fromTo(btn, { scale: 1 }, { scale: 0.93, duration: 0.07, ease: "power2.in", immediateRender: false }, click - 0.07);
  tl.to(btn, { scale: 1, duration: 0.2, ease: "back.out(3)" }, click);
  tl.set(btn, { backgroundColor: "#3a3a3c" }, click);
  tl.set(btnA, { opacity: 0 }, click);
  tl.set(btnB, { opacity: 1 }, click);
  const ripple = c.el("div", "bg-ripple", c.top);
  Object.assign(ripple.style, { left: `${cx}px`, top: `${cy}px` });
  tl.fromTo(ripple, { scale: 0.2, opacity: 0.9 }, { scale: 2.4, opacity: 0, duration: 0.45, ease: "power2.out", immediateRender: false }, click);
  tl.to(cur, { x: 120, y: 170, opacity: 0, duration: 0.45, ease: "power2.in" }, click + 0.55);

  // the name bar
  const bar = c.el("div", "bg-name", c.top, `<div class="bg-name-bar"><span>${name}</span></div><div class="bg-handle">${handle}</div>`);
  if (!textRight) bar.classList.add("right");
  const barIn = bar.querySelector(".bg-name-bar"), hand = bar.querySelector(".bg-handle");
  const barText = barIn.querySelector("span");
  tl.fromTo(barIn, { xPercent: textRight ? -102 : 102 }, { xPercent: 0, duration: 0.5, ease: "power4.out", immediateRender: false }, T(0.5));
  tl.fromTo(barText, { opacity: 0, x: textRight ? -20 : 20 }, { opacity: 1, x: 0, duration: 0.35, ease: "power2.out", immediateRender: false }, T(0.68));
  tl.fromTo(hand, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", immediateRender: false }, T(0.8));
}, { person: true });
