// grafik: split screen — a warm paper card drops in on top with a bar chart that rises bar by bar; you move to the
// lower half. title, lead, bars ("değer::etiket|…", values like 11.2K / 1.5M)
EFEKT.register("grafik", (c) => {
  const title = c.str("title", "En çok izlenen"), lead = c.str("lead", "reel'lerim");
  const numbers = c.str("values", "1") !== "0"; // values=0: bars and labels only, no figures on screen
  const raw = c.list("bars", ["11.2K::CLAUDE", "6.5K::KURGU", "3.1K::YARDIM", "2.4K::DİL", "1.9K::BUL"]).slice(0, 7);

  // "11.2K" → {v: 11200, unit: "K", dec: 1}
  const parse = (s) => {
    const m = String(s).trim().replace(",", ".").match(/^([\d.]+)\s*([kKmM]?)$/);
    if (!m) return { v: Number(s) || 0, unit: "", dec: 0 };
    const unit = m[2].toUpperCase(), dec = (m[1].split(".")[1] || "").length;
    return { v: parseFloat(m[1]) * (unit === "K" ? 1e3 : unit === "M" ? 1e6 : 1), unit, dec };
  };
  const bars = raw.map((b) => { const [v, l] = b.split("::"); return Object.assign(parse(v), { label: (l || "").trim() }); });
  const unitOf = (n) => (n >= 1e6 ? ["M", 1e6] : n >= 1e3 ? ["K", 1e3] : ["", 1]);
  const fmtAs = (b) => (n) => {
    const d = b.unit === "M" ? 1e6 : b.unit === "K" ? 1e3 : 1;
    return (n / d).toFixed(b.dec).replace(/\.0+$/, "") + b.unit;
  };
  const fmtAuto = (n, dec = 1) => { const [u, d] = unitOf(n); return (+(n / d).toFixed(dec)).toString() + u; };

  // a nice axis: 3 steps of 1 / 2 / 2.5 / 5 × 10^k
  const max = Math.max(...bars.map((b) => b.v), 1);
  const rough = max / 3, mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const step = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((s) => s * 3 >= max);
  const top = step * 3;
  const avg = bars.reduce((s, b) => s + b.v, 0) / bars.length;
  const best = bars.findIndex((b) => b.v === max);

  // the split: the face lands at ~66 % of the height, the card fills the space above it. The card starts at y 250
  // (gr-card's top: Instagram's Reels header covers the band above) and stops 70 px above the face; the dark ground
  // behind it reaches 40 px below the card and always covers the band the camera shift opens at the top.
  const CARD_TOP = 250, f0 = c.face(c.start);
  const shift = Math.max(0, Math.round(c.H * 0.66 - f0.y));
  const faceTop = f0.top + shift;
  const cardH = Math.round(Math.min(c.H * 0.45, faceTop - 70 - CARD_TOP));

  const ground = c.el("div", "gr-ground", c.top);
  ground.style.height = `${Math.max(CARD_TOP + cardH + 40, shift)}px`;
  const card = c.el("div", "gr-card", c.top);
  card.style.height = `${cardH}px`;
  const head = c.el("div", "gr-head", card, `<span class="gr-title">${title}</span><span class="gr-lead">${lead}</span>`);

  // chart geometry inside the card (card is 1000 wide)
  const chart = c.el("div", "gr-chart", card);
  const chartTop = 250, chartBottom = cardH - 92;           // card px: the plot area
  chart.style.top = `${chartTop}px`;
  chart.style.height = `${chartBottom - chartTop}px`;
  // without figures there are no tick labels, so the plot takes the whole width and the label slots widen
  const plotH = chartBottom - chartTop, plotL = numbers ? 118 : 56, plotW = 1000 - plotL - 48;
  const yOf = (v) => plotH - (v / top) * plotH;

  for (let k = 0; k <= 3; k++) {
    const g = c.el("div", k ? "gr-grid" : "gr-grid gr-base", chart);
    g.style.top = `${yOf(step * k)}px`;
    g.style.left = `${plotL}px`;
    const t = c.el("div", "gr-tick mono", chart, !numbers ? "" : k ? fmtAuto(step * k) : "0");
    t.style.top = `${yOf(step * k)}px`;
    t.style.width = `${plotL - 30}px`;
  }

  const n = bars.length, slot = plotW / n, bw = Math.min(118, slot * 0.66);
  const valSize = Math.round(Math.min(46, slot * 0.34)), labSize = Math.round(Math.max(30, Math.min(36, slot * 0.22)));
  const t0 = c.at(0.42), barEls = [];
  bars.forEach((b, i) => {
    const cx = plotL + slot * (i + 0.5), h = Math.max(6, (b.v / top) * plotH);
    const bar = c.el("div", i === best ? "gr-bar gr-best" : "gr-bar", chart);
    Object.assign(bar.style, { left: `${cx - bw / 2}px`, width: `${bw}px`, height: `${h}px` });
    const val = c.el("div", "gr-val", chart);
    Object.assign(val.style, { left: `${cx}px`, top: `${plotH - h - 12}px`, fontSize: `${valSize}px` });
    const lab = c.el("div", "gr-lab mono", chart, b.label);
    Object.assign(lab.style, { left: `${cx}px`, top: `${plotH + 18}px`, fontSize: `${labSize}px` });
    const t = t0 + i * 0.06;
    c.tl.fromTo(bar, { scaleY: 0 }, { scaleY: 1, duration: 0.55, ease: "back.out(1.5)", immediateRender: false }, t);
    // the value rides on the bar's top with the same ease, and counts up
    c.tl.fromTo(val, { y: h, opacity: 0, xPercent: -50, yPercent: -100 },
      { y: 0, opacity: 1, xPercent: -50, yPercent: -100, duration: 0.55, ease: "back.out(1.5)", immediateRender: false }, t);
    if (numbers) c.count(val, 0, b.v, t, 0.6, fmtAs(b));
    c.tl.fromTo(lab, { opacity: 0, y: -10, xPercent: -50 }, { opacity: 1, y: 0, xPercent: -50, duration: 0.3, ease: "power2.out", immediateRender: false }, t + 0.1);
    barEls.push(bar);
  });

  // values=0: no figures to count, so the bars stay alive once they are up — the best bar pulses with a glow,
  // the others take one small breath each (a scale-Y overshoot), staggered left to right
  if (!numbers) {
    const tb = t0 + (n - 1) * 0.06 + 0.62;
    barEls.forEach((bar, i) => {
      if (i === best) {
        const glow = "0px 10px 30px 0px rgba(230,170,30,0.45)", hot = "0px 0px 64px 10px rgba(255,205,60,0.95)";
        for (const [k, at] of [[1.09, tb], [1.05, tb + 0.62]]) {
          c.tl.fromTo(bar, { scaleY: 1, boxShadow: glow }, { scaleY: k, boxShadow: hot, duration: 0.2, ease: "power2.out", immediateRender: false }, at);
          c.tl.to(bar, { scaleY: 1, boxShadow: glow, duration: 0.36, ease: "power2.inOut" }, at + 0.2);
        }
      } else {
        const at = tb + 0.14 + i * 0.08;
        c.tl.fromTo(bar, { scaleY: 1 }, { scaleY: 1.06, duration: 0.18, ease: "sine.out", immediateRender: false }, at);
        c.tl.to(bar, { scaleY: 1, duration: 0.42, ease: "back.out(2.2)" }, at + 0.18);
      }
    });
  }

  // the average: a dashed line drawn from the left, then its tag
  if (numbers) {
  const avgLine = c.el("div", "gr-avg", chart);
  Object.assign(avgLine.style, { top: `${yOf(avg)}px`, left: `${plotL}px` });
  const tag = c.el("div", "gr-avgtag mono", chart, `ort. ${fmtAuto(avg)}`);
  tag.style.top = `${yOf(avg)}px`;
  const ta = t0 + n * 0.06 + 0.35;
  c.tl.fromTo(avgLine, { scaleX: 0 }, { scaleX: 1, duration: 0.45, ease: "power2.inOut", immediateRender: false }, ta);
  c.tl.fromTo(tag, { opacity: 0, x: 16, yPercent: -100 }, { opacity: 1, x: 0, yPercent: -100, duration: 0.3, ease: "power2.out", immediateRender: false }, ta + 0.3);
  }

  // motion: the ground and the camera move together (no gap ever shows), the card drops in with an overshoot
  c.tl.fromTo(ground, { yPercent: -100 }, { yPercent: 0, duration: 0.45, ease: "power3.out", immediateRender: false }, c.start);
  c.camera({ y: shift });
  c.tl.fromTo(card, { y: -CARD_TOP - cardH - 80 }, { y: 0, duration: 0.38, ease: "back.out(1.3)", immediateRender: false }, c.at(0.06));
  c.tl.fromTo(head, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.35, ease: "power3.out", immediateRender: false }, c.at(0.24));
  c.tl.fromTo(chart, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power1.out", immediateRender: false }, c.at(0.3));
});
