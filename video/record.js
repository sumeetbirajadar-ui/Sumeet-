// Records each scene of the Science Monk promo as its own clip.
// Writes clips/<n>.webm plus clips/offsets.json (seconds to trim off the
// start of each clip, i.e. the page-load time before the scene begins).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://127.0.0.1:3000/';
const OUT = path.join(__dirname, 'clips');
fs.mkdirSync(OUT, { recursive: true });
const W = 1280, H = 720;
const LOGO = 'data:image/png;base64,' + fs.readFileSync(path.join(__dirname, '..', 'public', 'branding', 'science-monk-logo.png')).toString('base64');

const CARD_CSS = `
  *{margin:0;box-sizing:border-box}
  body{width:${W}px;height:${H}px;background:radial-gradient(circle at 75% 20%,#3d3a14 0,#0c1f1c 45%,#081614 100%);
    font-family:Inter,"Plus Jakarta Sans",system-ui,sans-serif;color:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden}
  .wrap{text-align:center}
  img{width:150px;height:150px;border-radius:50%;background:#fff;padding:6px;opacity:0;transform:scale(.8);animation:pop .8s .2s forwards cubic-bezier(.2,.9,.3,1.2)}
  h1{font-size:68px;letter-spacing:-1.5px;margin-top:26px;opacity:0;animation:up .8s .6s forwards}
  .tag{display:inline-block;margin-top:18px;padding:8px 18px;border-radius:999px;background:#ffffff14;color:#f5c542;font-weight:700;letter-spacing:3px;font-size:18px;opacity:0;animation:up .8s 1s forwards}
  p{font-size:24px;color:#c9d6d2;margin-top:22px;opacity:0;animation:up .8s 1.3s forwards}
  @keyframes pop{to{opacity:1;transform:scale(1)}}
  @keyframes up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`;

const CAPTION_JS = `
  window.__caption = (title, sub) => {
    let el = document.getElementById('__cap');
    if (!el) {
      const st = document.createElement('style');
      st.textContent = '#__cap{position:fixed;left:40px;top:28px;z-index:99999;background:rgba(8,22,20,.92);color:#fff;padding:14px 22px;border-radius:18px;font-family:Inter,system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.25);border-left:5px solid #f5c542;max-width:520px;transition:opacity .4s,transform .4s;opacity:0;transform:translateX(-20px)}#__cap b{display:block;font-size:22px;letter-spacing:-.3px}#__cap span{display:block;font-size:15px;color:#c9d6d2;margin-top:4px}#__cap.show{opacity:1;transform:none}';
      document.head.appendChild(st);
      el = document.createElement('div'); el.id = '__cap'; document.body.appendChild(el);
    }
    el.classList.remove('show');
    setTimeout(() => { el.innerHTML = '<b>' + title + '</b><span>' + sub + '</span>'; el.classList.add('show'); }, title ? 50 : 0);
  };`;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function scroll(p, px, ms) {
  await p.evaluate(([px, ms]) => new Promise(res => {
    const el = document.querySelector('.overflow-y-auto') || document.scrollingElement;
    const start = el.scrollTop, t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      el.scrollTop = start + px * e;
      k < 1 ? requestAnimationFrame(step) : res();
    };
    requestAnimationFrame(step);
  }), [px, ms]);
}
const cap = (p, t, s) => p.evaluate(([t, s]) => window.__caption(t, s), [t, s]);
const nav = async (p, label) => { await p.getByText(label, { exact: true }).first().click(); await sleep(900); };

const scenes = [
  ['intro', async (p) => {
    await p.setContent(`<style>${CARD_CSS}</style><div class="wrap"><img src="${LOGO}"><h1>Science Monk</h1><div class="tag">KCET · NEET · JEE</div><p>Your whole prep journey, in one app.</p></div>`);
    return async () => { await sleep(4200); };
  }],
  ['login', async (p) => {
    await p.goto(BASE); await sleep(1800);
    return async () => { await cap(p, 'Made for students', 'Sign in and your progress syncs across devices'); await sleep(3600); };
  }],
  ['home', async (p) => {
    await p.addInitScript(() => { localStorage.setItem('is_authenticated', 'true'); localStorage.setItem('app_role', 'student'); });
    await p.goto(BASE); await sleep(1800);
    return async () => {
      await cap(p, 'Everything in one place', 'Syllabus tracker, learning hub, habits, targets');
      await sleep(1600); await scroll(p, 520, 2600); await sleep(900);
      await cap(p, 'Track every chapter once', 'Progress counts toward KCET, NEET and JEE');
      await scroll(p, 520, 2600); await sleep(1200);
    };
  }],
  ['predictor', async (p) => {
    await p.addInitScript(() => { localStorage.setItem('is_authenticated', 'true'); localStorage.setItem('app_role', 'student'); });
    await p.goto(BASE); await sleep(1500); await nav(p, 'Predictor'); await sleep(800);
    return async () => {
      await cap(p, 'College Predictor', 'Real KEA cutoff ranks from 2022 to 2025');
      await sleep(1200);
      await p.locator('input[placeholder="e.g. 5000"]').click();
      await p.keyboard.type('5000', { delay: 160 }); await sleep(400);
      await p.locator('select').nth(0).selectOption('GM'); await sleep(500);
      await p.locator('select').nth(1).selectOption('CS'); await sleep(600);
      await p.getByRole('button', { name: 'Predict', exact: true }).click(); await sleep(900);
      await cap(p, 'Safe, moderate or long shot', 'See your chances at 200+ colleges instantly');
      await scroll(p, 430, 2400); await sleep(2200);
      await scroll(p, 400, 2200); await sleep(1000);
    };
  }],
  ['counselling', async (p) => {
    await p.addInitScript(() => { localStorage.setItem('is_authenticated', 'true'); localStorage.setItem('app_role', 'student'); });
    await p.goto(BASE); await sleep(1500); await nav(p, 'Counselling'); await sleep(800);
    return async () => {
      await cap(p, 'Counselling made simple', 'Dates, documents and steps, all in one checklist');
      await sleep(1500); await scroll(p, 450, 2400); await sleep(1300);
    };
  }],
  ['career', async (p) => {
    await p.addInitScript(() => { localStorage.setItem('is_authenticated', 'true'); localStorage.setItem('app_role', 'student'); });
    await p.goto(BASE); await sleep(1500); await nav(p, 'Career'); await sleep(800);
    return async () => {
      await cap(p, 'Career guidance', 'Explore paths after PUC before you choose');
      await sleep(1500); await scroll(p, 450, 2400); await sleep(1300);
    };
  }],
  ['learn', async (p) => {
    await p.addInitScript(() => { localStorage.setItem('is_authenticated', 'true'); localStorage.setItem('app_role', 'student'); });
    await p.goto(BASE); await sleep(1500); await nav(p, 'Learn'); await sleep(800);
    return async () => {
      await cap(p, 'Learning Hub', 'Live classes, notes, videos and PYQs');
      await sleep(1500); await scroll(p, 350, 2000); await sleep(1300);
    };
  }],
  ['outro', async (p) => {
    await p.setContent(`<style>${CARD_CSS}</style><div class="wrap"><img src="${LOGO}"><h1>Start preparing smarter</h1><div class="tag">SCIENCE MONK ACADEMY</div><p>Track. Practise. Predict. Succeed.</p></div>`);
    return async () => { await sleep(4500); };
  }],
];

(async () => {
  const browser = await chromium.launch();
  const offsets = {};
  for (const [i, [name, setup]] of scenes.entries()) {
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, recordVideo: { dir: OUT, size: { width: W, height: H } } });
    await ctx.addInitScript(CAPTION_JS);
    const t0 = Date.now();
    const p = await ctx.newPage();
    const run = await setup(p);
    offsets[i] = (Date.now() - t0) / 1000;
    await run();
    const vpath = await p.video().path();
    await ctx.close();
    fs.renameSync(vpath, path.join(OUT, `${i}.webm`));
    console.log(name, 'trim', offsets[i].toFixed(2));
  }
  fs.writeFileSync(path.join(OUT, 'offsets.json'), JSON.stringify(offsets));
  await browser.close();
})();
