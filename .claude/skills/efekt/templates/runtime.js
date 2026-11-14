// The efekt runtime: one paused GSAP timeline, the face track, and the layers an effect draws into.
// An effect is registered with EFEKT.register(name, fn, {person, css}); fn(ctx) builds its DOM and adds its tweens.
// Everything is a pure function of time, so a seek to any frame gives the same picture (HyperFrames renders by seeking).
(function () {
  const D = window.EFEKT_DATA;
  const W = D.width, H = D.height, FPS = 30;
  const effects = {};
  const tl = gsap.timeline({ paused: true });
  const $ = (id) => document.getElementById(id);

  // The face at time t, in canvas pixels: {x, y} its centre, {w, h} its size, top/bottom its edges.
  function face(t) {
    const f = D.face.frames;
    const i = Math.min(f.length - 1, Math.max(0, t * D.face.fps));
    const a = f[Math.floor(i)], b = f[Math.min(f.length - 1, Math.floor(i) + 1)], k = i - Math.floor(i);
    const v = a.map((n, j) => n + (b[j] - n) * k);
    // the plate is drawn with object-fit: cover into W×H; the source has the same aspect, so a plain scale
    const r = { x: v[0] * W, y: v[1] * H, w: v[2] * W, h: v[3] * H };
    r.top = r.y - r.h / 2; r.bottom = r.y + r.h / 2; r.left = r.x - r.w / 2; r.right = r.x + r.w / 2;
    return r;
  }

  function el(tag, cls, parent, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    if (parent) parent.appendChild(n);
    return n;
  }

  function makeCtx(fx, idx) {
    const start = fx.start, end = fx.end, dur = end - start;
    const opt = Object.assign({}, fx);
    const roots = {};
    for (const layer of ["back", "front", "top"]) {
      const r = el("div", `fx-root fx-${fx.fx}`, $(layer));
      r.id = `fx${idx}-${layer}`;
      roots[layer] = r;
      tl.set(r, { visibility: "inherit" }, start);
      tl.set(r, { visibility: "hidden" }, end);
    }
    const ctx = {
      W, H, tl, start, end, dur, opt, face, el,
      back: roots.back, front: roots.front, top: roots.top,
      cam: $("cam"), plate: $("plate-wrap"), person: $("person-wrap"),
      // t in effect-local seconds → global
      at: (t) => start + t,
      // fn(face, p, t) → [[el, props], …] for every frame of [from, to]: p is 0..1 through the effect, t global.
      // Baked as one tl.set per frame and element (HyperFrames seeks with callbacks suppressed, so no onUpdate).
      follow(fn, from = start, to = end) {
        const step = 1 / FPS;
        for (let t = from; t < to + step / 2; t += step) {
          const tt = Math.min(t, to);
          for (const [node, props] of fn(face(tt), (tt - start) / dur, tt)) tl.set(node, props, tt);
        }
      },
      // a value from opt or a default; lists use "|"
      str: (k, d) => (opt[k] != null && opt[k] !== "" ? String(opt[k]) : d),
      list: (k, d) => (opt[k] != null && opt[k] !== "" ? String(opt[k]).split("|") : d),
      num: (k, d) => (opt[k] != null && opt[k] !== "" ? Number(opt[k]) : d),
      // set a filter on the picture (plate and person together) for the effect's window
      grade(filter, inT = 0.2) {
        for (const w of [ctx.plate, ctx.person]) {
          tl.fromTo(w, { filter: "none" }, { filter, duration: inT, ease: "power2.out", immediateRender: false }, start);
          tl.set(w, { filter: "none" }, end);
        }
      },
      // camera move: from/to are {scale, y} (y in px); eased over [t0, t1] global
      camera(to, t0 = start, t1 = start + 0.45, ease = "power3.out") {
        tl.fromTo(ctx.cam, { scale: 1, y: 0, x: 0 }, Object.assign({ duration: t1 - t0, ease, immediateRender: false }, to), t0);
        tl.set(ctx.cam, { scale: 1, y: 0, x: 0 }, end);
      },
      // a pop: from small and transparent to its place, with an overshoot
      pop(node, t, d = 0.35, from = {}) {
        tl.fromTo(node, Object.assign({ scale: 0.6, opacity: 0 }, from),
          { scale: 1, opacity: 1, x: 0, y: 0, duration: d, ease: "back.out(1.8)", immediateRender: false }, t);
      },
      // count a number up in a node's text; fmt turns the number into text
      count(node, from, to, t, d, fmt = (n) => Math.round(n).toString(), ease = "power2.out") {
        const e = gsap.parseEase(ease);
        node.textContent = fmt(from);
        for (let k = 0; k <= Math.ceil(d * FPS); k++) {
          const q = Math.min(1, k / (d * FPS));
          tl.set(node, { textContent: fmt(from + (to - from) * e(q)) }, t + q * d);
        }
      },
    };
    return ctx;
  }

  window.EFEKT = {
    register(name, fn, meta = {}) { effects[name] = Object.assign({ fn }, meta); },
    build() {
      let needPerson = [];
      D.plan.forEach((fx, i) => {
        const e = effects[fx.fx];
        if (!e) throw new Error(`unknown effect ${fx.fx}`);
        e.fn(makeCtx(fx, i));
        if (e.person) needPerson.push(fx);
      });
      const person = $("person-wrap");
      for (const fx of needPerson) {
        tl.set(person, { visibility: "inherit" }, fx.start);
        tl.set(person, { visibility: "hidden" }, fx.end);
      }
      tl.set({}, {}, D.duration);
      return tl;
    },
  };
})();
