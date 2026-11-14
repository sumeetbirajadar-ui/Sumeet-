// kurgu: split screen — a dark editing timeline drops in on top (video, captions, effects, sound), a glowing playhead
// sweeps it, a REC timecode and a % count; you move to the lower half under a warm film grade. title, lead, tc,
// caps (caption chips, |-separated), effects (effect chips, |-separated; not "fx", which is the effect's own name in
// the plan): a few large chips read on a phone, so at most 4 each
EFEKT.register("kurgu", (c) => {
  const title = c.str("title", "Claude"), lead = c.str("lead", "kurguluyor"), tc = c.str("tc", "00:00:03:12");
  const caps = c.list("caps", ["tek komut", "editör yok", "hazır"]).slice(0, 4);
  const fxs = c.list("effects", ["zoom", "grafik", "spot", "renk"]).slice(0, 4);
  const FPS = 30;
  const tcFrames = (() => { const p = tc.split(":").map(Number); while (p.length < 4) p.unshift(0); return ((p[0] * 60 + p[1]) * 60 + p[2]) * FPS + p[3]; })();
  const pad = (n) => String(n).padStart(2, "0");
  const tcFmt = (n) => { n = Math.round(n); const f = n % FPS, s = Math.floor(n / FPS); return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(f)}`; };

  // the split: the face lands at ~66 % of the height, the card fills the space above it. The card starts at y 250
  // (kg-card's top: Instagram's Reels header covers the band above) and stops 70 px above the face; the dark ground
  // behind it reaches 40 px below the card and always covers the band the camera shift opens at the top.
  const CARD_TOP = 250, f0 = c.face(c.start);
  const shift = Math.max(0, Math.round(c.H * 0.66 - f0.y));
  const cardH = Math.round(Math.min(c.H * 0.45, f0.top + shift - 70 - CARD_TOP));

  const ground = c.el("div", "kg-ground", c.top);
  ground.style.height = `${Math.max(CARD_TOP + cardH + 40, shift)}px`;
  const card = c.el("div", "kg-card", c.top);
  card.style.height = `${cardH}px`;

  // header: window dots, REC timecode, format
  const bar = c.el("div", "kg-bar", card);
  c.el("div", "kg-dots", bar, "<i></i><i></i><i></i>");
  const rec = c.el("div", "kg-rec mono", bar);
  const dot = c.el("span", "kg-recdot", rec, "●");
  c.el("span", "", rec, " REC ");
  const tcEl = c.el("span", "kg-tc", rec);
  c.el("div", "kg-fmt mono", bar, "1080×1920 · 30 FPS");
  const head = c.el("div", "kg-head", card, `<span class="big">${title}</span> <span class="lead">${lead}</span>`);

  // tracks
  const L = 196, R = 956, laneW = R - L;                    // card px
  const tracksTop = 262, tracksBottom = cardH - 118;
  const rowH = (tracksBottom - tracksTop) / 4, laneH = Math.min(78, rowH - 18);
  const names = ["video", "altyazı", "efekt", "ses"];
  const rows = names.map((n, i) => {
    const row = c.el("div", "kg-row", card);
    Object.assign(row.style, { top: `${tracksTop + i * rowH + (rowH - laneH) / 2}px`, height: `${laneH}px` });
    c.el("div", "kg-name mono", row, n);
    const lane = c.el("div", "kg-lane", row);
    Object.assign(lane.style, { left: `${L - 44}px`, width: `${laneW}px` });
    return { row, lane };
  });
  const lit = [];                                            // [node, x in lane px]: lit when the playhead passes
  // video: a strip of frame tiles
  const nT = 5, gap = 8, tw = (laneW - 12 - gap * (nT - 1)) / nT;
  for (let i = 0; i < nT; i++) {
    const t = c.el("div", "kg-thumb", rows[0].lane);
    Object.assign(t.style, { left: `${6 + i * (tw + gap)}px`, width: `${tw}px` });
    lit.push([t, 6 + i * (tw + gap)]);
  }
  // captions and effects: chips
  // the lane is split evenly between the chips, each word in a slot of its own
  const chips = (lane, cls, items) => {
    const g = 10, w = (laneW - 12 - g * (items.length - 1)) / items.length;
    items.forEach((txt, i) => {
      const x = 6 + i * (w + g);
      const ch = c.el("div", `kg-chip ${cls} mono`, lane, txt.trim());
      Object.assign(ch.style, { left: `${x}px`, width: `${w}px` });
      lit.push([ch, x]);
    });
  };
  chips(rows[1].lane, "kg-cap", caps);
  chips(rows[2].lane, "kg-fx", fxs);
  // sound: a waveform, dim underneath and lit up to the playhead
  const wave = (cls) => {
    const w = c.el("div", `kg-wave ${cls}`, rows[3].lane);
    w.setAttribute("data-layout-allow-overflow", "");
    const nB = 44, step = (laneW - 24) / nB;
    for (let i = 0; i < nB; i++) {
      const a = Math.abs(Math.sin(i * 0.61) * Math.sin(i * 0.173 + 1.1)) * 0.8 + Math.abs(Math.sin(i * 2.3)) * 0.2;
      const b = c.el("i", "", w);
      Object.assign(b.style, { left: `${12 + i * step}px`, height: `${Math.round(10 + a * (laneH - 26))}px` });
    }
    return w;
  };
  wave("kg-dim");
  const waveLit = wave("kg-lit");

  // playhead over the lanes
  const ph = c.el("div", "kg-ph", card);
  Object.assign(ph.style, { left: `${L}px`, top: `${tracksTop - 14}px`, height: `${tracksBottom - tracksTop + 20}px` });
  c.el("div", "kg-handle", ph);

  // progress and %
  const prog = c.el("div", "kg-prog", card);
  prog.style.top = `${cardH - 76}px`;
  const fill = c.el("div", "kg-fill", prog);
  const pct = c.el("div", "kg-pct", card);
  pct.style.top = `${cardH - 76}px`;

  // ---- motion ----
  c.grade("sepia(0.35) saturate(1.2) contrast(1.08)");
  c.tl.fromTo(ground, { yPercent: -100 }, { yPercent: 0, duration: 0.45, ease: "power3.out", immediateRender: false }, c.start);
  c.camera({ y: shift });
  c.tl.fromTo(card, { y: -CARD_TOP - cardH - 80 }, { y: 0, duration: 0.38, ease: "back.out(1.3)", immediateRender: false }, c.at(0.06));
  c.tl.fromTo([bar, head], { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: "power3.out", immediateRender: false }, c.at(0.22));
  rows.forEach(({ row }, i) => c.tl.fromTo(row, { opacity: 0, x: -30 },
    { opacity: 1, x: 0, duration: 0.35, ease: "power3.out", immediateRender: false }, c.at(0.3 + i * 0.05)));
  c.tl.fromTo([ph, prog, pct], { opacity: 0 }, { opacity: 1, duration: 0.25, immediateRender: false }, c.at(0.42));

  const s0 = c.at(0.45), s1 = c.end - 0.12, sd = s1 - s0;
  c.tl.fromTo(ph, { x: 0 }, { x: laneW, duration: sd, ease: "none", immediateRender: false }, s0);
  c.tl.fromTo(waveLit, { width: 0 }, { width: laneW, duration: sd, ease: "none", immediateRender: false }, s0);
  c.tl.fromTo(fill, { scaleX: 0 }, { scaleX: 1, duration: sd, ease: "none", immediateRender: false }, s0);
  c.count(pct, 0, 100, s0, sd, (n) => `${Math.round(n)}%`, "none");
  c.count(tcEl, tcFrames, tcFrames + (c.end - s0) * FPS, s0, c.end - s0, tcFmt, "none");
  // each tile / chip lights up as the playhead reaches it
  lit.forEach(([node, x]) => {
    const t = s0 + (x / laneW) * sd;
    c.tl.fromTo(node, { opacity: 0.35, scale: 1 }, { opacity: 1, scale: 1.06, duration: 0.1, ease: "power2.out", immediateRender: false }, t);
    c.tl.to(node, { scale: 1, duration: 0.18, ease: "power2.inOut" }, t + 0.1);
  });
  // the REC dot blinks
  for (let t = c.start, k = 0; t < c.end; t += 0.5, k++) c.tl.set(dot, { opacity: k % 2 ? 0.25 : 1 }, t);
});
