// liste: a dark glass task card under your chin; five steps spin, then tick green one after another.
// text ("step::meta|…"), title
EFEKT.register("liste", (c) => {
  const title = c.str("title", "Claude klibini düzenliyor");
  const rows = c.list("text", ["Yüzünü buldu::her kare", "Seni odadan ayırdı::yapay zekâ maskesi",
    "Yazıyı arkana koydu::derinlik", "Rengi ayarladı::sıcak", "Render aldı::1080p"]).map((r) => r.split("::"));
  const n = rows.length;
  const W = c.W, H = c.H, M = 40;
  const spark = `<svg class="ls-spark" viewBox="-12 -12 24 24">${[0, 1, 2, 3].map((i) =>
    `<line x1="0" y1="-10" x2="0" y2="10" transform="rotate(${i * 45})"/>`).join("")}</svg>`;
  const RA = 20, CA = 2 * Math.PI * RA;
  const icon = () =>
    `<div class="ls-ic"><svg class="ls-wait" viewBox="0 0 52 52"><circle cx="26" cy="26" r="${RA}"/></svg>` +
    `<svg class="ls-spin" viewBox="0 0 52 52"><circle class="ls-spin-bg" cx="26" cy="26" r="${RA}"/>` +
    `<circle class="ls-spin-arc" cx="26" cy="26" r="${RA}" style="stroke-dasharray:${CA * 0.3} ${CA}"/></svg>` +
    `<svg class="ls-tick" viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M15 27 L23 34.5 L37.5 19" style="stroke-dasharray:36;stroke-dashoffset:36"/></svg></div>`;

  const box = c.el("div", "ls-box", c.front);
  const card = c.el("div", "ls-card", box,
    `<div class="ls-headrow"><div class="ls-title">${spark}<span>${title}</span></div><div class="ls-count mono">1/${n}</div></div>` +
    `<div class="ls-rule"></div>` +
    rows.map(([s, m]) => `<div class="ls-row">${icon()}<div class="ls-step">${s}</div><div class="ls-meta mono">${m || ""}</div></div>`).join(""));
  const cardW = Math.round(W * 0.86);
  box.style.width = `${cardW}px`;

  // the card rises in under the chin
  const T = c.start;
  c.pop(card, T, 0.5, { scale: 0.92, y: 60 });
  // the steps: each spins, then ticks; the counter follows the step in progress
  const step = Math.min(0.45, Math.max(0.2, (c.dur - 0.75) / n));
  const t0 = T + 0.3;
  const count = card.querySelector(".ls-count");
  card.querySelectorAll(".ls-row").forEach((row, i) => {
    const on = t0 + i * step, done = on + step;
    const wait = row.querySelector(".ls-wait"), spin = row.querySelector(".ls-spin"), tick = row.querySelector(".ls-tick");
    c.tl.to(row, { opacity: 1, duration: 0.15, ease: "power1.out" }, on);
    c.tl.set(wait, { opacity: 0 }, on);
    c.tl.set(spin, { opacity: 1 }, on);
    c.tl.fromTo(spin, { rotation: 0 }, { rotation: 300, duration: step, ease: "none", immediateRender: false }, on);
    c.tl.set(spin, { opacity: 0 }, done);
    c.tl.fromTo(tick, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2.6)", immediateRender: false }, done);
    c.tl.to(tick.querySelector("path"), { strokeDashoffset: 0, duration: 0.22, ease: "power2.out" }, done + 0.05);
    c.tl.to(row.querySelector(".ls-meta"), { color: "#4ade80", duration: 0.2 }, done);
    if (i > 0) c.tl.set(count, { textContent: `${i + 1}/${n}` }, on);
  });

  // under the chin, centred on the face, smoothed so the card does not jitter with the track
  const smooth = (t) => {
    let x = 0, b = 0;
    const ds = [-0.25, -0.12, 0, 0.12, 0.25];
    for (const d of ds) { const g = c.face(Math.min(c.end, Math.max(c.start, t + d))); x += g.x / ds.length; b += (g.bottom + g.h * 0.06) / ds.length; }
    return { x, b };
  };
  c.follow((f, p, t) => {
    const s = smooth(t);
    const left = Math.min(W - M - cardW, Math.max(M, s.x - cardW / 2));
    const top = Math.min(H - card.offsetHeight - 120, s.b);
    return [[box, { x: left, y: top }]];
  });
});
