#!/usr/bin/env python3
"""Kinetic promo template (the "I didn't edit this video" reel made with Vaibhav AI Video Editor).

usage: python3 build.py <voice-words.json> [duration]      then: npx --yes hyperframes@0.8.226 render . -o out.mp4 --fps 60

Reads word timings from scripts/voice_lines.py (put its voice file at assets/voice.wav), writes index.html (the
HyperFrames composition) and cues.json (sound effects for scripts/sound_mix.py). Every entrance is timed to a spoken word
with t("word"), so a new script means new scenes: keep the helpers (slam, pop, lab, zin, zout, punch-ins, grid) and the
look, and rewrite the scene markup and the key-time lines for your own words.
"""
import json, re, sys
from pathlib import Path

HERE = Path(__file__).parent
WORDS = json.load(open(sys.argv[1] if len(sys.argv) > 1 else HERE / "voice-words.json"))
DUR = float(sys.argv[2]) if len(sys.argv) > 2 else round(max(w["end"] for w in WORDS) + 2.6, 2)


def t(word, after=0.0):
    for w in WORDS:
        if w["start"] >= after - 1e-6 and re.sub(r"[^\w']", "", w["word"]).lower() == word.lower():
            return round(w["start"], 3)
    raise KeyError(word)


def end_of(line):
    return round(max(w["end"] for w in WORDS if w["line"] == line), 3)


# key times (all from the voice)
DIDNT, EDIT, THIS1, VIDEO1 = t("didn't"), t("edit"), t("this"), t("video")
MY, AI, EDITOR, DID = t("my"), t("ai"), t("editor"), t("did")
ITEMS = [t("text"), t("motion"), t("visuals"), t("sound"), t("cuts"), t("captions")]
EVERY = t("everything")
ONE1, SINGLE, SKILL = t("one", EVERY), t("single"), t("skill", EVERY)
ONE2, COMMAND = t("one", SKILL), t("command")
THIS2, ENTIRE, VIDEO2 = t("this", COMMAND), t("entire"), t("video", COMMAND)
WANT, THIS3, EDITOR3, TO, WORK, FOR = t("want"), t("this", ENTIRE + 0.6), t("editor", ENTIRE), t("to", ENTIRE), t("work"), t("for")
COMMENT, SKILL2, ILL = t("comment"), t("skill", t("comment")), t("i'll")

# scene boundaries: each scene starts a beat before its first word, ends where the next one starts
S1_END = MY - 0.1
S2_END = ITEMS[0] - 0.06
LIST_END = EVERY - 0.06
S4_END = ONE1 - 0.1
S5_END = ONE2 - 0.08
S6_END = THIS2 - 0.08
S7_END = WANT - 0.08
S8_END = COMMENT - 0.08
TRANS = [S1_END, S2_END, LIST_END, S4_END, S5_END, S6_END, S7_END, S8_END]
PUNCH = [VIDEO1, DID, EVERY + 0.16, SKILL, COMMAND, ENTIRE, FOR, SKILL2 + 0.35]

CUES = [(0.02, "impact-bass-2", .3), (DIDNT, "pop", .2), (EDIT, "pop", .24), (VIDEO1 - 0.05, "click", .32), (VIDEO1 + 0.18, "click-soft", .26),
        *[(x - 0.04, "whoosh-short", .26) for x in TRANS],
        (MY, "pop", .18), (AI, "pop", .18), (EDITOR + 0.15, "click-soft", .14), (EDITOR + 0.35, "click-soft", .14), (EDITOR + 0.55, "click-soft", .14),
        (DID, "impact-bass-1", .3), (DID + 0.05, "chime", .16),
        *[(x + 0.05, "pop", .18) for x in ITEMS[1:3]], (ITEMS[4] + 0.12, "click", .32), (ITEMS[4] + 0.38, "click", .32),
        (EVERY + 0.16, "impact-bass-2", .38), (SKILL, "pop", .22), (ONE2 + 0.02, "typing", .22), (ONE2 + 0.6, "click", .32),
        (THIS2 - 0.06, "whoosh-cinematic", .3), (ENTIRE, "pop", .18), (FOR, "pop", .22),
        (SKILL2, "typing", .22), (SKILL2 + 0.4, "pop", .26), (ILL, "pop", .14)]

CHIPS = ["Text animation", "Motion graphics", "Visuals", "Sound effects", "Cuts", "Captions"]


def letters(word, cls):
    return "".join(f'<span class="{cls}">{c}</span>' for c in word)


def build():
    bars = "".join(f'<i style="--h:{h}"></i>' for h in (28, 54, 40, 76, 50, 92, 36, 66, 46, 84, 32, 60, 44, 72, 56, 30, 64, 42, 80, 38))
    chips = "".join(f'<span class="chip" id="chip{i}">{c}</span>' for i, c in enumerate(CHIPS))
    # hook ticker: clip blocks on an edit timeline, scrolling under the words
    tick_cols = ["#111111", "#FFD84D", "#22C55E", "#3F3F3A", "#111111", "#FFD84D", "#C9C9C2", "#22C55E"] * 3
    ticker = "".join(f'<b style="width:{w}px;background:{c}"></b>' for w, c in zip([150, 90, 120, 70, 160, 100, 80, 130] * 3, tick_cols))
    tracks = [("Video", "#111111", [(0, 26), (28, 18), (48, 30), (80, 20)]),
              ("Text", "#FFD84D", [(2, 10), (16, 14), (34, 12), (52, 16), (74, 12), (90, 8)]),
              ("Motion", "#22C55E", [(8, 16), (30, 20), (58, 22), (84, 14)]),
              ("Sound", "#6B7280", [(1, 4), (12, 4), (22, 4), (31, 4), (44, 4), (55, 4), (66, 4), (77, 4), (88, 4)]),
              ("Captions", "#C9C9C2", [(0, 30), (34, 30), (68, 32)])]
    track_html = "".join(
        f'<div class="trk"><span class="tl">{n}</span><div class="lane">' +
        "".join(f'<b style="left:{x}%;width:{w}%;background:{c}"></b>' for x, w in blocks) + "</div></div>"
        for n, c, blocks in tracks)
    cmd = "/vaibhav-video-editor"
    J = lambda xs: "[" + ", ".join(f"{x:.3f}" for x in xs) + "]"
    html = f"""<!doctype html>
<html lang="en" data-resolution="portrait">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=1080, height=1920" />
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<style>
  :root {{ --ink:#111111; --y:#FFD84D; --g:#22C55E; --bg:#F4F4F1; --mute:#6B6B66; }}
  * {{ margin:0; padding:0; box-sizing:border-box; }}
  html, body {{ width:1080px; height:1920px; overflow:hidden; background:var(--bg); }}
  #root {{ position:relative; width:1080px; height:1920px; overflow:hidden; font-family:Inter, sans-serif; color:var(--ink); background:var(--bg); }}
  #grid {{ position:absolute; left:-60px; top:-60px; width:1200px; height:2400px; opacity:.5;
           background-image:radial-gradient(circle, #D6D6CF 2.5px, transparent 3px); background-size:60px 60px; }}
  #glow {{ position:absolute; inset:0; background:radial-gradient(ellipse 75% 50% at 50% 40%, rgba(255,255,255,.95) 0%, rgba(244,244,241,0) 70%); }}
  #cam {{ position:absolute; inset:0; transform-origin:50% 42%; }}
  .sc {{ position:absolute; inset:0; opacity:0; }}
  .ttl {{ position:absolute; left:0; width:1080px; text-align:center; font:800 112px/1.1 Inter, sans-serif; letter-spacing:-3px; }}
  .w {{ display:inline-block; }}
  .lab {{ display:inline-block; position:relative; padding:0 22px 6px; isolation:isolate; }}
  .lab::before {{ content:""; position:absolute; inset:8px 0 0 0; background:var(--y); border-radius:20px; z-index:-1;
                  transform:scaleX(var(--k, 0)); transform-origin:0 50%; }}
  .card {{ position:absolute; background:#fff; border-radius:30px; box-shadow:0 30px 80px rgba(17,17,17,.12), 0 4px 14px rgba(17,17,17,.06); }}
  .bar {{ height:62px; border-bottom:1px solid #ECECE7; display:flex; align-items:center; gap:10px; padding:0 24px; }}
  .dot {{ width:16px; height:16px; border-radius:50%; background:#DADAD4; }}
  .bar b {{ margin-left:14px; font:700 30px/1 Inter, sans-serif; color:#55554F; }}
  .tag {{ position:absolute; right:22px; bottom:18px; font:600 28px/1 Inter, sans-serif; color:#6B6B66; }}

  /* 1 hook */
  #s1 {{ opacity:1; }}
  #h1 {{ top:520px; }}
  #h1 .w {{ opacity:0; }} #h1 #w-i {{ opacity:1; }} #h1 #w-didnt {{ opacity:1; }}
  #strike {{ position:absolute; left:330px; top:680px; width:420px; height:90px; overflow:visible; }}
  #strike path {{ fill:none; stroke:#EF4444; stroke-width:18; stroke-linecap:round; stroke-dasharray:460; stroke-dashoffset:460; }}
  #tick {{ position:absolute; left:120px; top:1040px; width:840px; height:110px; border-radius:22px; background:#fff; overflow:hidden;
           box-shadow:0 18px 50px rgba(17,17,17,.1); }}
  #tickrow {{ position:absolute; left:0; top:25px; display:flex; gap:8px; white-space:nowrap; }}
  #tickrow b {{ display:inline-block; height:60px; border-radius:12px; flex:none; }}
  #tickhead {{ position:absolute; left:420px; top:8px; width:6px; height:94px; background:#EF4444; border-radius:3px; }}

  /* 2 AI editor */
  #t2 {{ top:300px; }}
  #c2 {{ left:160px; top:720px; width:760px; height:520px; }}
  .row {{ display:flex; align-items:center; justify-content:space-between; margin:0 40px; height:96px; border-bottom:1px solid #F0F0EB;
          font:700 42px/1 Inter, sans-serif; }}
  .row .ok {{ width:46px; height:46px; border-radius:50%; background:var(--g); color:#fff; font:800 30px/46px Inter; text-align:center; transform:scale(0); }}
  #prog {{ margin:44px 40px 0; height:22px; border-radius:11px; background:#EEEEE9; overflow:hidden; }}
  #prog i {{ display:block; height:100%; width:100%; background:var(--ink); border-radius:11px; transform:scaleX(0); transform-origin:0 50%; }}
  #pct {{ margin:22px 40px 0; font:800 44px/1 Inter, sans-serif; display:flex; justify-content:space-between; }}
  #pct span:last-child {{ color:var(--g); opacity:0; }}

  /* 3 list */
  #counter {{ position:absolute; left:0; top:300px; width:1080px; text-align:center; font:800 46px/1 Inter, sans-serif; opacity:0; }}
  #counter .n {{ display:inline-block; min-width:62px; }}
  #counter .n i {{ font-style:normal; display:none; }}
  #counter em {{ font-style:normal; color:#6B6B66; }}
  #dots {{ position:absolute; left:390px; top:370px; width:300px; display:flex; justify-content:space-between; opacity:0; }}
  #dots i {{ width:38px; height:8px; border-radius:4px; background:#DADAD4; }}
  .it {{ position:absolute; inset:0; opacity:0; }}
  .lbl {{ position:absolute; left:0; top:1170px; width:1080px; text-align:center; font:800 100px/1.1 Inter, sans-serif; letter-spacing:-2px; }}
  #big {{ position:absolute; left:0; top:560px; width:1080px; text-align:center; font:800 300px/1 Inter, sans-serif; letter-spacing:-8px; }}
  #big span {{ display:inline-block; }}
  .shape {{ position:absolute; width:170px; height:170px; left:455px; top:650px; }}
  #sh1 {{ border-radius:50%; background:var(--y); }}
  #sh2 {{ border-radius:28px; background:var(--ink); }}
  #sh3 {{ width:0; height:0; border-left:95px solid transparent; border-right:95px solid transparent; border-bottom:165px solid var(--g); left:445px; }}
  .pic {{ position:absolute; left:390px; top:560px; width:300px; height:440px; border-radius:26px; box-shadow:0 24px 60px rgba(17,17,17,.18); transform-origin:50% 120%; }}
  #p1 {{ background:linear-gradient(160deg,#FFD84D,#F59E0B); }} #p2 {{ background:linear-gradient(160deg,#1F2937,#4B5563); }}
  #p3 {{ background:linear-gradient(160deg,#86EFAC,#16A34A); }}
  #wave {{ position:absolute; left:160px; top:620px; width:760px; height:300px; display:flex; align-items:center; gap:12px; }}
  #wave i {{ flex:1; height:calc(var(--h) * 1%); background:var(--ink); border-radius:10px; }}
  #strip {{ position:absolute; left:160px; top:700px; width:760px; height:150px; }}
  .clp {{ position:absolute; top:0; height:150px; border-radius:18px; background:var(--ink); }}
  #k1 {{ left:0; width:250px; }} #k2 {{ left:255px; width:250px; background:#3F3F3A; }} #k3 {{ left:510px; width:250px; }}
  #head {{ position:absolute; left:160px; top:660px; width:6px; height:230px; background:#EF4444; border-radius:3px; }}
  #frameC {{ position:absolute; left:190px; top:560px; width:700px; height:470px; border-radius:30px; background:linear-gradient(170deg,#3B4252 0%,#1F2430 100%); }}
  #capdemo {{ position:absolute; left:0; top:880px; width:1080px; text-align:center; }}
  #capdemo span.pill {{ display:inline-block; font:700 54px/1.2 Inter, sans-serif; color:var(--ink); background:rgba(255,255,255,.6);
                       border-radius:26px; padding:18px 30px; box-shadow:0 10px 30px rgba(0,0,0,.18); }}
  #capdemo .cw {{ opacity:0; }}

  /* 4 everything */
  #chips {{ position:absolute; left:150px; top:560px; width:780px; display:flex; flex-wrap:wrap; justify-content:center; gap:22px; }}
  .chip {{ display:inline-block; font:700 46px/1 Inter, sans-serif; background:#fff; border-radius:999px; padding:24px 34px; box-shadow:0 10px 30px rgba(17,17,17,.1); }}
  #every {{ top:860px; font-size:130px; }}

  /* 5 skill */
  #t5 {{ top:300px; }}
  #one {{ position:absolute; left:0; top:440px; width:1080px; text-align:center; font:800 560px/1 Inter, sans-serif; color:#E4E4DD; }}
  #c5 {{ left:220px; top:930px; width:640px; height:380px; text-align:left; padding:52px 50px; }}
  #doc {{ width:96px; height:120px; border-radius:14px; background:var(--ink); position:relative; }}
  #doc::after {{ content:""; position:absolute; right:0; top:0; width:34px; height:34px; background:var(--y); border-bottom-left-radius:12px; }}
  #c5 h3 {{ margin-top:34px; font:800 72px/1 Inter, sans-serif; }}
  #c5 p {{ margin-top:16px; font:600 40px/1 Inter, sans-serif; color:var(--mute); }}

  /* 6 command */
  #t6 {{ top:300px; }}
  #term {{ position:absolute; left:160px; top:700px; width:760px; height:420px; border-radius:30px; background:#15161A; box-shadow:0 30px 80px rgba(17,17,17,.25); }}
  #term .bar {{ border-color:#26272D; }} #term .bar b {{ color:#9EA0A8; }} #term .dot {{ background:#3A3B42; }}
  #tty {{ padding:46px 44px; font:500 44px/1.5 Menlo, monospace; color:#F4F4F1; }}
  #tty .p {{ color:var(--y); }} #tty .ch {{ opacity:0; }}
  #run {{ margin-top:24px; font:600 38px/1 Inter, sans-serif; color:var(--g); opacity:0; }}

  /* 7 reveal */
  #t7 {{ top:300px; }}
  #ed {{ left:90px; top:560px; width:900px; height:900px; transform-origin:50% 33%; overflow:hidden; }}
  #prev {{ position:absolute; left:40px; top:90px; width:820px; height:400px; border-radius:22px; background:#15161A; overflow:hidden; }}
  #prev p {{ padding:110px 40px 0; font:500 40px/1.5 Menlo, monospace; color:#F4F4F1; }}
  #prev p span {{ color:var(--y); }} #prev #prun {{ padding-top:20px; font:600 36px/1 Inter, sans-serif; color:var(--g); }}
  #tracks {{ position:absolute; left:40px; top:530px; width:820px; }}
  .trk {{ display:flex; align-items:center; height:62px; }}
  .tl {{ width:170px; font:700 30px/1 Inter, sans-serif; color:#55554F; }}
  .lane {{ position:relative; flex:1; height:40px; background:#F3F3EF; border-radius:10px; }}
  .lane b {{ position:absolute; top:4px; height:32px; border-radius:8px; }}
  #ph {{ position:absolute; left:210px; top:515px; width:6px; height:340px; background:#EF4444; border-radius:3px; }}

  /* 8 question */
  #t8 {{ top:620px; }}
  #t8 .w {{ opacity:0; }}

  /* 9 CTA */
  #cta {{ left:150px; top:640px; width:780px; height:560px; background:rgba(255,255,255,.92); text-align:center; padding-top:90px; }}
  #cta h2 {{ font:800 110px/1 Inter, sans-serif; letter-spacing:-3px; }}
  #kw {{ margin-top:46px; font:800 150px/1 Inter, sans-serif; letter-spacing:-3px; }}
  #kw .ch {{ opacity:0; }} #kw .q {{ color:#6B6B66; }}
  #share {{ position:absolute; left:0; top:1260px; width:1080px; text-align:center; font:700 52px/1.25 Inter, sans-serif; color:#33332F; }}
  #share .w {{ opacity:0; }}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="{DUR}" data-width="1080" data-height="1920">
  <audio id="vo" class="clip" src="assets/voice.wav" data-start="0" data-duration="{DUR}" data-volume="1"></audio>
  <div id="grid" data-layout-allow-overflow></div><div id="glow"></div>
  <div id="cam">

  <div class="sc" id="s1">
    <div class="ttl" id="h1"><span class="w" id="w-i">I</span> <span class="w" id="w-didnt">didn't</span><br><span class="w lab" id="lab-edit">edit</span><br><span class="w" id="w-this1">this</span> <span class="w" id="w-video1">video.</span></div>
    <svg id="strike" viewBox="0 0 420 90"><path d="M10 58 C 130 34, 280 70, 410 38"/></svg>
    <div id="tick" data-layout-ignore><div id="tickrow">{ticker}</div><div id="tickhead"></div></div>
  </div>

  <div class="sc" id="s2">
    <div class="ttl" id="t2"><span class="w" id="w-my">My</span> <span class="w" id="w-ai">AI</span> <span class="w" id="w-ed">editor</span><br><span class="w lab" id="lab-did">did.</span></div>
    <div class="card" id="c2" data-layout-ignore>
      <div class="bar"><span class="dot"></span><span class="dot"></span><span class="dot"></span><b>AI Editor</b></div>
      <div class="row">Cutting<span class="ok" id="ok1">&#10003;</span></div>
      <div class="row">Animating<span class="ok" id="ok2">&#10003;</span></div>
      <div class="row">Sound design<span class="ok" id="ok3">&#10003;</span></div>
      <div id="prog"><i></i></div>
      <div id="pct"><span id="pctn">0%</span><span>Done</span></div>
      <div class="tag">illustration</div>
    </div>
  </div>

  <div id="counter"><span class="n">{"".join(f'<i id="n{i}">0{i + 1}</i>' for i in range(6))}</span> <em>/ 06</em></div>
  <div id="dots">{"".join(f'<i id="d{i}"></i>' for i in range(6))}</div>
  <div class="it" id="i0"><div id="big">{letters("Text", "bl")}</div><div class="lbl">Text animation</div></div>
  <div class="it" id="i1"><div class="shape" id="sh1"></div><div class="shape" id="sh2"></div><div class="shape" id="sh3"></div><div class="lbl">Motion graphics</div></div>
  <div class="it" id="i2"><div class="pic" id="p1"></div><div class="pic" id="p2"></div><div class="pic" id="p3"></div><div class="lbl">Visuals</div></div>
  <div class="it" id="i3"><div id="wave">{bars}</div><div class="lbl">Sound effects</div></div>
  <div class="it" id="i4"><div id="strip"><div class="clp" id="k1"></div><div class="clp" id="k2"></div><div class="clp" id="k3"></div></div><div id="head"></div><div class="lbl">Cuts</div></div>
  <div class="it" id="i5"><div id="frameC"></div><div id="capdemo" data-layout-ignore><span class="pill"><span class="cw">Captions</span> <span class="cw">like</span> <span class="cw">this</span></span></div><div class="lbl">Captions</div></div>

  <div class="sc" id="s4"><div id="chips" data-layout-ignore>{chips}</div><div class="ttl" id="every"><span class="w lab" style="--k:1">Everything.</span></div></div>

  <div class="sc" id="s5">
    <div id="one" data-layout-ignore>1</div>
    <div class="ttl" id="t5"><span class="w" id="w-one1">One</span> <span class="w" id="w-single">single</span> <span class="w lab" id="lab-skill">skill.</span></div>
    <div class="card" id="c5" data-layout-ignore><div id="doc"></div><h3>SKILL.md</h3><p>vaibhav-video-editor</p></div>
  </div>

  <div class="sc" id="s6">
    <div class="ttl" id="t6"><span class="w" id="w-one2">One</span> <span class="w lab" id="lab-cmd">command.</span></div>
    <div id="term" data-layout-ignore>
      <div class="bar"><span class="dot"></span><span class="dot"></span><span class="dot"></span><b>Claude Code</b></div>
      <div id="tty"><span class="p">&gt;</span> {"".join(f'<span class="ch">{c}</span>' for c in cmd)}<div id="run">&#9679; Editing your video&hellip;</div></div>
    </div>
  </div>

  <div class="sc" id="s7">
    <div class="ttl" id="t7"><span class="w" id="w-this2">This</span> <span class="w lab" id="lab-entire">entire</span> <span class="w" id="w-video2">video.</span></div>
    <div class="card" id="ed" data-layout-ignore>
      <div class="bar"><span class="dot"></span><span class="dot"></span><span class="dot"></span><b>Timeline</b></div>
      <div id="prev"><p><span>&gt;</span> {cmd}</p><p id="prun">&#9679; Editing your video&hellip;</p></div>
      <div id="tracks">{track_html}</div>
      <div id="ph"></div>
      <div class="tag">illustration</div>
    </div>
  </div>

  <div class="sc" id="s8">
    <div class="ttl" id="t8"><span class="w" id="q1">Want</span> <span class="w" id="q2">this</span> <span class="w" id="q3">editor</span><br><span class="w" id="q4">to work</span><br><span class="w lab" id="lab-you">for you?</span></div>
  </div>

  <div class="sc" id="s9">
    <div class="card" id="cta"><h2>Comment</h2><div id="kw"><span class="ch q">&ldquo;</span>{letters("SKILL", "ch")}<span class="ch q">&rdquo;</span></div></div>
    <div id="share">{" ".join(f'<span class="w">{w}</span>' for w in "I'll share you my video editor".split())}</div>
  </div>
  </div>
</div>
<script>
const IN = "power3.out", OUT = "power2.in";
const tl = gsap.timeline({{ paused: true }});
const lab = (id, at) => tl.fromTo(id, {{ "--k": 0 }}, {{ "--k": 1, duration: 0.18, ease: IN }}, at);
// a word slams in: big to normal, fast
const slam = (sel, at) => tl.fromTo(sel, {{ opacity: 0, scale: 1.45, y: 10, filter: "blur(8px)" }}, {{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)", duration: 0.26, ease: "power4.out" }}, at);
const pop = (sel, at, d = 0.24) => tl.fromTo(sel, {{ opacity: 0, y: 40, scale: 0.9 }}, {{ opacity: 1, y: 0, scale: 1, duration: d, ease: "back.out(1.8)" }}, at);
// zoom-through: the outgoing scene rushes past the camera, the next one arrives from depth
const zin = (id, at) => tl.fromTo(id, {{ opacity: 0, scale: 0.7, filter: "blur(16px)" }}, {{ opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.3, ease: "power3.out" }}, at);
const zout = (id, at) => tl.to(id, {{ opacity: 0, scale: 1.3, filter: "blur(14px)", duration: 0.2, ease: "power2.in" }}, at - 0.2);

// background keeps moving the whole time
tl.fromTo("#grid", {{ y: 0 }}, {{ y: -600, duration: {DUR}, ease: "none" }}, 0);
// camera punch-ins on key words
tl.set("#cam", {{ scale: 1 }}, 0);
{J(PUNCH)}.forEach(p => tl.fromTo("#cam", {{ scale: 1.06 }}, {{ scale: 1, duration: 0.4, ease: "power3.out", immediateRender: false }}, p));

// 1. hook: "I didn't" on screen at frame 0, the rest slams in on each word, then a red strike through "edit"
tl.fromTo("#h1", {{ scale: 1.05 }}, {{ scale: 1, duration: 0.3, ease: IN }}, 0);
slam("#lab-edit", {EDIT}); lab("#lab-edit", {EDIT + 0.05});
slam("#w-this1", {THIS1}); slam("#w-video1", {VIDEO1});
tl.to("#strike path", {{ strokeDashoffset: 0, duration: 0.16, ease: "power2.out" }}, {VIDEO1 - 0.05});
tl.fromTo("#tickrow", {{ x: 0 }}, {{ x: -900, duration: {S1_END}, ease: "none" }}, 0)
  .fromTo("#tick", {{ y: 80, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.25, ease: IN }}, 0.05);
zout("#s1", {S1_END});

// 2. my AI editor did: fast checklist and progress, "did." lands with a hit
zin("#s2", {S1_END});
slam("#w-my", {MY}); slam("#w-ai", {AI}); slam("#w-ed", {EDITOR});
tl.fromTo("#c2", {{ y: 400, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.3, ease: IN }}, {MY});
tl.to("#prog i", {{ scaleX: 1, duration: {DID - MY - 0.1:.2f}, ease: "power1.in" }}, {MY + 0.1});
const pc = document.querySelector("#pctn"), pv = {{ v: 0 }};
tl.to(pv, {{ v: 100, duration: {DID - MY - 0.1:.2f}, ease: "power1.in", onUpdate: () => {{ pc.textContent = Math.round(pv.v) + "%"; }} }}, {MY + 0.1});
["#ok1", "#ok2", "#ok3"].forEach((id, i) => tl.to(id, {{ scale: 1, duration: 0.2, ease: "back.out(2.5)" }}, {EDITOR + 0.15} + i * 0.2));
slam("#lab-did", {DID}); lab("#lab-did", {DID + 0.04});
tl.to("#prog i", {{ backgroundColor: "#22C55E", duration: 0.1 }}, {DID}).to("#pct span:last-child", {{ opacity: 1, duration: 0.1 }}, {DID});
zout("#s2", {S2_END});

// 3. the list: one item per word, hard cuts with a punch, counter and progress dots
const items = {J(ITEMS)}, listEnd = {LIST_END};
tl.set(["#counter", "#dots"], {{ opacity: 1 }}, items[0]).set(["#counter", "#dots"], {{ opacity: 0 }}, listEnd);
items.forEach((s, i) => {{
  const e = i < 5 ? items[i + 1] : listEnd;
  tl.set("#i" + i, {{ opacity: 1 }}, s).set("#i" + i, {{ opacity: 0 }}, e)
    .fromTo("#i" + i, {{ scale: 1.1, filter: "blur(6px)" }}, {{ scale: 1, filter: "blur(0px)", duration: 0.22, ease: IN }}, s)
    .set("#n" + i, {{ display: "inline" }}, s).set("#n" + i, {{ display: "none" }}, e)
    .to("#d" + i, {{ backgroundColor: "#111111", duration: 0.1 }}, s);
}});
tl.fromTo("#big .bl", {{ opacity: 0, y: 140, rotation: -18 }}, {{ opacity: 1, y: 0, rotation: 0, duration: 0.26, stagger: 0.07, ease: "back.out(1.8)" }}, items[0]);
tl.fromTo("#sh1", {{ x: 0, scale: 0 }}, {{ x: -240, y: -60, scale: 1, duration: 0.24, ease: IN }}, items[1])
  .fromTo("#sh2", {{ x: 0, scale: 0, rotation: -90 }}, {{ y: -160, scale: 1, rotation: 0, duration: 0.24, ease: IN }}, items[1] + 0.03)
  .fromTo("#sh3", {{ x: 0, scale: 0 }}, {{ x: 240, y: -60, scale: 1, duration: 0.24, ease: IN }}, items[1] + 0.06)
  .to(["#sh1", "#sh2", "#sh3"], {{ y: 0, duration: 0.22, ease: "back.out(2)", stagger: 0.03 }}, items[1] + 0.32);
tl.fromTo("#p1", {{ opacity: 0 }}, {{ rotation: -16, x: -150, opacity: 1, duration: 0.24, ease: IN }}, items[2])
  .fromTo("#p3", {{ opacity: 0 }}, {{ rotation: 16, x: 150, opacity: 1, duration: 0.24, ease: IN }}, items[2])
  .fromTo("#p2", {{ y: 60, opacity: 0 }}, {{ y: -20, opacity: 1, duration: 0.24, ease: IN }}, items[2] + 0.04);
gsap.utils.toArray("#wave i").forEach((b, i) => tl.fromTo(b, {{ scaleY: 0.15 }}, {{ scaleY: 1, duration: 0.14, ease: "sine.inOut", yoyo: true, repeat: 5 }}, items[3] + i * 0.015));
tl.fromTo("#head", {{ x: 0 }}, {{ x: 760, duration: 0.6, ease: "none" }}, items[4])
  .to("#k1", {{ x: -26, duration: 0.1, ease: IN }}, items[4] + 0.1)
  .to("#k3", {{ x: 26, duration: 0.12, ease: IN }}, items[4] + 0.38)
  .to("#k2", {{ y: -20, duration: 0.12, ease: IN }}, items[4] + 0.38);
tl.to("#capdemo .cw", {{ opacity: 1, duration: 0.01, stagger: 0.16 }}, items[5] + 0.04)
  .fromTo("#capdemo .pill", {{ scale: 0.85 }}, {{ scale: 1, duration: 0.18, ease: "back.out(2)" }}, items[5]);

// 4. everything: chips rush in from both sides and collapse into one word
tl.set("#s4", {{ opacity: 1 }}, {LIST_END});
gsap.utils.toArray("#chips .chip").forEach((c, i) => tl.fromTo(c, {{ opacity: 0, x: (i % 2 ? 1 : -1) * 520 }},
  {{ opacity: 1, x: 0, duration: 0.14, ease: IN }}, {EVERY - 0.06} + i * 0.015));
tl.to("#chips .chip", {{ scale: 0.2, opacity: 0, y: 300, duration: 0.1, ease: OUT, stagger: 0.004 }}, {EVERY + 0.12})
  .fromTo("#every", {{ opacity: 0, scale: 0.5 }}, {{ opacity: 1, scale: 1, duration: 0.26, ease: "back.out(2.2)" }}, {EVERY + 0.16});
zout("#s4", {S4_END});

// 5. one single skill
zin("#s5", {S4_END});
slam("#w-one1", {ONE1}); slam("#w-single", {SINGLE}); slam("#lab-skill", {SKILL}); lab("#lab-skill", {SKILL + 0.04});
tl.fromTo("#one", {{ opacity: 0, scale: 1.3 }}, {{ opacity: 1, scale: 1, duration: 0.3, ease: IN }}, {ONE1});
tl.fromTo("#c5", {{ opacity: 0, y: -200, rotation: -6 }}, {{ opacity: 1, y: 0, rotation: 0, duration: 0.3, ease: "back.out(1.6)" }}, {SINGLE});
zout("#s5", {S5_END});

// 6. one command: terminal types fast and starts
zin("#s6", {S5_END});
slam("#w-one2", {ONE2}); slam("#lab-cmd", {COMMAND}); lab("#lab-cmd", {COMMAND + 0.04});
tl.to("#tty .ch", {{ opacity: 1, duration: 0.01, stagger: 0.026 }}, {ONE2 + 0.02})
  .to("#run", {{ opacity: 1, duration: 0.15 }}, {ONE2 + 0.62});
tl.to("#s6", {{ opacity: 0, duration: 0.1 }}, {S6_END});

// 7. this entire video: zoom out of the terminal into the whole timeline
tl.set("#s7", {{ opacity: 1 }}, {S6_END});
tl.fromTo("#ed", {{ scale: 2.2 }}, {{ scale: 1, duration: 0.65, ease: "power3.inOut" }}, {S6_END});
slam("#w-this2", {THIS2}); slam("#lab-entire", {ENTIRE}); lab("#lab-entire", {ENTIRE + 0.04}); slam("#w-video2", {VIDEO2});
tl.fromTo("#ph", {{ x: 0 }}, {{ x: 610, duration: {S7_END - THIS2 - 0.3:.2f}, ease: "none" }}, {THIS2 + 0.3});
zout("#s7", {S7_END});

// 8. question, word by word
tl.set("#s8", {{ opacity: 1 }}, {S7_END});
slam("#q1", {WANT}); slam("#q2", {THIS3}); slam("#q3", {EDITOR3}); slam("#q4", {TO}); slam("#lab-you", {FOR}); lab("#lab-you", {FOR + 0.04});
zout("#s8", {S8_END});

// 9. CTA: card rises, SKILL typed, held to the end
zin("#s9", {S8_END});
tl.fromTo("#cta", {{ y: 120 }}, {{ y: 0, duration: 0.3, ease: IN }}, {S8_END})
  .to("#kw .ch", {{ opacity: 1, duration: 0.01, stagger: 0.05 }}, {SKILL2})
  .fromTo("#kw", {{ scale: 1.15 }}, {{ scale: 1, duration: 0.3, ease: "back.out(2)" }}, {SKILL2 + 0.35})
  .to("#share .w", {{ opacity: 1, duration: 0.12, stagger: 0.16 }}, {ILL})
  .to("#kw", {{ scale: 1.05, duration: 0.5, ease: "sine.inOut", yoyo: true, repeat: 3 }}, {ILL + 1.4});

window.__timelines = window.__timelines || {{}};
window.__timelines["main"] = tl;
</script>
</body>
</html>
"""
    (HERE / "index.html").write_text(html)
    json.dump({"cues": [{"t": round(a, 2), "name": n, "vol": v} for a, n, v in CUES]},
              open(HERE / "cues.json", "w"), indent=1)
    print("scenes end at", [round(x, 2) for x in TRANS], "punches", [round(x, 2) for x in PUNCH])


if __name__ == "__main__":
    build()
