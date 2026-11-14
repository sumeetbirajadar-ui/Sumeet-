// spot: the lights go out, you stay lit, a glowing word appears behind your head. text, color, push
EFEKT.register("spot", (c) => {
  const word = c.str("text", "CLAUDE"), color = c.str("color", "#ff9e7a"), push = c.num("push", 1.12);
  const shade = c.el("div", "spot-shade", c.back);
  const w = c.el("div", "spot-word", c.back, word);
  w.style.color = color;
  // behind the head on purpose: the cut-out person covers part of the word
  w.setAttribute("data-layout-allow-occlusion", "");
  w.style.textShadow = `0 0 18px ${color}, 0 0 60px ${color}, 0 0 120px ${color}aa`;
  c.tl.fromTo(shade, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out", immediateRender: false }, c.start);
  // the word flickers on like a neon tube: three quick blinks, then steady
  const on = c.start + 0.2;
  c.tl.set(w, { opacity: 0 }, c.start);
  [[0, 1], [0.06, 0.15], [0.12, 1], [0.2, 0.3], [0.26, 1]].forEach(([dt, o]) => c.tl.set(w, { opacity: o }, on + dt));
  c.camera({ scale: push }, c.start, c.end, "power1.inOut");
  // Instagram's safe area on a 9:16 canvas starts at y 250 (the Reels header sits above it). The word lives inside
  // the camera, which pushes in about its origin (50 % 40 %), so the floor is taken on screen at this frame's zoom.
  const ease = gsap.parseEase("power1.inOut"), oy = c.H * 0.4, SAFE_TOP = 250;
  c.follow((f, p) => {
    const size = Math.min(c.W * 0.84 / push / Math.max(4, word.length * 0.78), f.h * 1.4);
    const s = 1 + (push - 1) * ease(Math.min(1, Math.max(0, p)));
    const floor = oy + (SAFE_TOP + size * s * 0.5 - oy) / s; // the centre that keeps the word's top at y 250 on screen
    return [
      [w, { fontSize: size, left: f.x, top: Math.max(f.top - size * 0.35, floor), xPercent: -50, yPercent: -50 }],
      [shade, { background: `radial-gradient(ellipse ${f.w * 2.2}px ${f.h * 3.4}px at ${f.x}px ${f.y + f.h}px, rgba(0,0,0,0.25), rgba(0,0,0,0.88) 70%)` }],
    ];
  });
}, { person: true });
