// yorunge: your reel covers orbit your head on a tilted ellipse, behind you on the far side and in front on the near
// side. images (|-separated), count, size (card width px), turns
EFEKT.register("yorunge", (c) => {
  const imgs = c.list("images", []);
  const n = Math.max(3, Math.min(10, Math.round(c.num("count", 7))));
  const size = c.num("size", 238), turns = c.num("turns", 1.5);
  const cw = size, ch = size * 16 / 9;
  const W = c.W, H = c.H;
  const SB = 0.74, SF = 1.12; // scale on the far and the near side
  const TILT = -9 * Math.PI / 180;
  // deep gradients, so the white number keeps its contrast
  const palette = [["#ff416c", "#8e0e3f"], ["#6a5af9", "#3a1c71"], ["#0f9b8e", "#0b4d5e"], ["#e65c00", "#9e2a0b"],
    ["#c31432", "#3a0b36"], ["#2b5876", "#4e4376"], ["#11998e", "#0b5345"], ["#8e2de2", "#4a00e0"]];

  // the face over the window, averaged: the ring is anchored to a steady centre and only drifts with the head
  const N = 12, avg = { x: 0, y: 0, w: 0, h: 0 };
  for (let k = 0; k < N; k++) {
    const f = c.face(c.start + (c.dur * k) / (N - 1));
    for (const key in avg) avg[key] += f[key] / N;
  }

  const cards = [];
  for (let i = 0; i < n; i++) {
    const pair = ["back", "front"].map((side) => {
      const card = c.el("div", `yr-card yr-${side}`, side === "back" ? c.back : c.front);
      card.style.width = `${cw}px`;
      card.style.height = `${ch}px`;
      if (imgs.length) {
        card.style.backgroundImage = `url("${imgs[i % imgs.length]}")`;
      } else {
        const [a, b] = palette[i % palette.length];
        card.style.backgroundImage = `linear-gradient(155deg, ${a}, ${b})`;
        c.el("span", "yr-num", card, String(i + 1));
      }
      c.el("i", "yr-shade", card);
      return card;
    });
    cards.push(pair);
  }

  const ease = gsap.parseEase("sine.inOut");
  const grow = gsap.parseEase("power3.out");
  const shrink = gsap.parseEase("power2.in");
  c.follow((f, p) => {
    // the centre drifts a third of the way toward the live head, so the ring feels attached but calm
    const fx = avg.x + (f.x - avg.x) * 0.35, fy = avg.y + (f.y - avg.y) * 0.35;
    const cx = fx, cy = fy - avg.h * 0.12;
    // horizontally: ~1.6 face widths, kept inside the frame with the near card's half width
    const rx = Math.min(avg.w * 1.6, W / 2 - (cw * SF) / 2 - 22, cx - (cw * SF) / 2 - 22 + 0, W - cx - (cw * SF) / 2 - 22);
    // vertically flat on the far side; on the near side the cards pass at shoulder height, and where a card comes
    // in front of the face column it dips just enough that its top edge stays under the chin
    const ryB = rx * 0.34;
    const ryF = Math.max(rx * 0.34, avg.y + avg.h * 0.95 - cy);
    const chin = avg.y + avg.h * 0.5 + 22, faceHalf = avg.w * 0.58;
    // in over the first 0.45 s (the ring opens), out over the last 0.3 s (it closes and fades)
    const tIn = Math.min(1, (p * c.dur) / 0.45), tOut = Math.max(0, 1 - ((1 - p) * c.dur) / 0.3);
    const open = 0.55 + 0.45 * grow(tIn) - 0.25 * shrink(tOut);
    const alpha = Math.min(1, tIn * 1.6) * (1 - shrink(tOut));
    const spin = turns * Math.PI * 2 * ease(p) + 0.35;
    const out = [];
    cards.forEach(([back, front], i) => {
      const th = spin + (Math.PI * 2 * i) / n;
      const s = Math.sin(th), co = Math.cos(th);
      const ex = rx * co * open, ey = (s > 0 ? ryF : ryB) * s * open;
      const x = cx + ex * Math.cos(TILT) - ey * Math.sin(TILT);
      let y = cy + ex * Math.sin(TILT) + ey * Math.cos(TILT);
      const d = (s + 1) / 2; // 0 far .. 1 near
      const sc = (SB + (SF - SB) * d) * (0.7 + 0.3 * open);
      const near = s > 0;
      if (near) {
        // fully under the chin while the card overlaps the face column, eased back up to the shoulder path beside it
        const reach = faceHalf + (cw * sc) / 2 + 18, gap = Math.abs(x - fx) - reach;
        const k = gap <= 0 ? 1 : gap >= 70 ? 0 : 1 - ease(gap / 70);
        const under = chin + (ch * sc) / 2;
        if (under > y) y += (under - y) * k;
      }
      const z = Math.round(d * 100);
      // a slight lean into the direction of travel, and a turn about the vertical as it rounds the side
      const rot = -co * 7 + TILT * 57.3 * 0.6;
      const props = { left: x, top: y, xPercent: -50, yPercent: -50, scale: sc, rotation: rot, zIndex: z };
      const shade = 0.42 * (1 - d);
      out.push([back, Object.assign({ opacity: near ? 0 : alpha }, props)]);
      out.push([front, Object.assign({ opacity: near ? alpha : 0 }, props)]);
      out.push([back.lastChild, { opacity: shade }]);
      out.push([front.lastChild, { opacity: shade }]);
    });
    return out;
  });
  c.camera({ scale: 1.04 }, c.start, c.end, "sine.inOut");
}, { person: true });
