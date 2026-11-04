# Reels playbook: sound, colour, camera, background, tools, Instagram

What I found researching these topics, and how each piece maps onto
`reel.py`. Most of what's published about Instagram comes from marketing
blogs, not Instagram itself. Where claims are unverified, this guide says so.

---

## 1. Music and sound libraries

**The rule that matters:** "royalty-free" does not mean "copyright-free". Crediting the artist in
your caption does **not** give you a licence. There is no "10-second rule" or "30-second rule"
that makes using a song safe.

| Source | Cost | Use it for | Watch out |
|---|---|---|---|
| **Instagram's in-app audio** (add in the app or in Edits) | Free | Trending sounds on personal/creator accounts. Using a trending sound can help reach | Business accounts get a much smaller library. Don't burn copyrighted songs into the file yourself |
| **Meta Sound Collection** (Creator Studio / Business Suite) | Free | Business accounts, boosted Reels, ads. Meta says 14,000+ tracks and sounds, cleared for commercial use | The licence covers Meta apps only, not YouTube |
| **Pixabay Music / Pixabay SFX** | Free | Background beds, intros | Check each track's licence page; some tracks are registered with Content ID |
| **Freesound.org** | Free | Sound effects | Licence varies per sound (CC0 / CC-BY / CC-BY-NC). Filter to CC0 |
| **Mixkit** | Free | Whooshes, pops, transitions, short music | Read Mixkit's licence before use in ads |
| **Uppbeat, YouTube Audio Library** | Free tiers | Background music | Often need a credit line, or are meant for YouTube. Check each track |
| **Epidemic Sound, Artlist, Soundstripe** | Paid subscription | Ads, client work, both Instagram and YouTube with one clearance | The best option once the channel earns money |
| **ElevenLabs** (connected in Claude) | Credits | AI-made music, sound effects, voiceovers made to order | Check the plan's commercial terms |
| **Built-in kit: `reels/sfx/`** | Free | whoosh, swoosh_short, pop, riser, impact, ding, click, glitch, shutter | Made with code in this repo, so no third-party copyright |

**How sound is used in short videos:**
- Mix music **under** the voice. `music` ducks it automatically while you talk. Background music
  should sit about 18–25 dB below the voice.
- Use a **pop** when a title or text lands, a **whoosh** into a cut or zoom, a **riser** building
  into a reveal, an **impact** on the key number or claim, and a **ding** for a correct answer or
  "save this".
- Keep SFX sparse: about one every 2–4 seconds at most. Too many feels like a cheap template.
- Final loudness is about −14 LUFS, with peaks below −1.5 dBTP. `audio` and `sfx` do this.
- Many people watch with the sound **off**, so captions are not optional.

```bash
python3 reels/reel.py sfx-kit                                   # (re)build the built-in kit
python3 reels/reel.py sfx in.mp4 out.mp4 --cues "pop@0.2,riser@6.5,impact@6.5,ding@14"
python3 reels/reel.py music in.mp4 out.mp4 --music track.mp3 --volume 0.18
```

---

## 2. Colour grading by mood

The order a colourist works in: **correct first** (exposure, white balance, matching shots),
**then grade** (the look). Decide the emotion first, then pick colours that support it. Protect
skin tones, because viewers notice wrong skin before anything else.

Basic colour psychology: warm (orange/gold) feels hopeful, friendly and nostalgic. Cool
(teal/blue) feels calm, serious, clinical or sad. Desaturation feels heavy or real. High
contrast feels dramatic. Lifted, faded blacks feel like film and memory. Green tints feel
uneasy. Magenta and cyan feel futuristic.

The built-in looks are in `reels/luts/*.cube`. These are standard LUT files, so they also work in
CapCut desktop, DaVinci Resolve, Premiere and Final Cut. Skin hues are partly protected from each
look's tint.

| Look | Mood / when to use | What it does |
|---|---|---|
| `blockbuster` | Motivation, big claims, "this changed everything" | Teal shadows, orange highlights, S-curve contrast. The Hollywood action look |
| `golden` | Hope, success stories, results day | Warm white balance, gentle lift, soft contrast |
| `moody` | Exam pressure, struggle, serious talk | Desaturated, cool shadows, deep blacks, highlights pulled down |
| `noir` | Mystery, "nobody tells you this" | High-contrast black and white |
| `vintage` | History of science, memories | Faded blacks, warm-green film tint, lower saturation |
| `clean` | Teaching, explainers, app demos | Bright, neutral-warm, slightly richer colour |
| `cyber` | Space, tech, AI, future | Teal-magenta split, high contrast |
| `thriller` | Myth-busting, "the scary truth" | Green-cyan cast, crushed blacks, low saturation |
| `dreamy` | Calm, wellbeing, night study | Lifted, low contrast, peach-pink highlights |

```bash
python3 reels/reel.py looks                                   # list looks
python3 reels/reel.py grade in.mp4 out.mp4 --look moody --strength 0.7 --grain 8 --vignette
python3 reels/reel.py grade in.mp4 out.mp4 --lut downloaded_pack/teal_orange.cube
```

Tips:
- Use 60–80% strength on phone footage. Full-strength looks clip quickly on 8-bit video.
- Use one look per Reel, or per section. Switching looks every shot reads as amateur.
- Add film grain (`--grain 6–10`) and a light vignette to get closer to a film image.
- Shoot well-lit and slightly underexposed rather than blown out. A grade can't bring back white sky or skin.
- Free LUT packs exist (FreeVisuals, Filtergrade and others). Check each pack's licence. Log-profile
  LUTs need log footage; on normal phone video they look wrong.

---

## 3. Camera movement

**When shooting** (phone on gimbal or tripod):

| Move | Feeling | Use |
|---|---|---|
| Static, locked-off | Calm, authority | Talking head, teaching |
| Push-in / dolly in | Building importance, intimacy | Before the key point |
| Pull-out | Reveal, ending | Show the setup / outro |
| Pan / tilt | Follow, survey | Whiteboard, lab bench |
| Whip pan | Energy, hides a cut | Transition between two shots |
| Orbit | Premium, cinematic | Product, desk setup |
| Handheld | Real, urgent | Behind the scenes, vlogs |
| Top-down | Process | Solving problems on paper |

Shooting rules: 1080p or 4K at 30 fps (60 fps if you want slow motion), lock exposure and focus,
light from a window or a softbox at 45°, lens at eye level, and phone vertical unless you shoot
4K landscape to crop later.

**In the edit**, these are digital moves done by `reel.py`:
- **Punch-in / jump zoom:** cut between wide and ~114% framing at each new phrase. This is the
  standard talking-head trick to hide jump cuts and reset attention every 2–4 s. `--punch`.
- **Slow push-in:** creeps 5–8% closer over the clip. Builds tension without a cut. `--push 0.06`.
- **Impact shake:** a 0.35 s shake on a big claim. Pair it with the `impact` SFX. `motion --shake 7.2`.
- **Face-tracked reframe:** keeps the speaker centred when turning landscape into 9:16. `vertical --mode face`.
- Opposite advice also exists: for calm or aesthetic content, subtle motion can beat rapid cutting.
  Match the pacing to the mood.

```bash
python3 reels/reel.py motion in.mp4 out.mp4 --punch work/words.json --push 0.04 --shake 7.2
python3 reels/reel.py motion in.mp4 out.mp4 --at 2.5,6,9.2          # punch at chosen times
```

---

## 4. Background changer

`bg` uses Google's MediaPipe multiclass selfie model, about 90 ms a frame on CPU. The mask is
hardened, smoothed over time to stop flicker, and feathered at the edge.

```bash
python3 reels/reel.py bg in.mp4 out.mp4 --bg blur          # portrait-mode blur
python3 reels/reel.py bg in.mp4 out.mp4 --bg "#0c1f1c"     # solid brand colour
python3 reels/reel.py bg in.mp4 out.mp4 --bg classroom.jpg # any image
python3 reels/reel.py bg in.mp4 out.mp4 --bg space.mp4     # moving background (loops)
```

For the cleanest result, shoot against a plain wall with good light and a gap between you and the
wall. Avoid clothes the same colour as the wall. Fast hand movements and loose hair are the hardest
parts. Other options found: rembg (more models, slower), BiRefNet + ViTMatte (best edges, needs a
GPU), Robust Video Matting (GPLv3 licence). A real green screen still beats all of them.

---

## 5. Editing tools

| Tool | Best for | Notes |
|---|---|---|
| **This toolkit (`reel.py`)** | Batch, repeatable edits: cuts, captions, grade, SFX, export | Runs here in the cloud, no app needed |
| **Edits** (Instagram's own app, 2025) | Final touches, in-app trending audio, Instagram templates | Free. Direct access to Instagram's music library |
| **CapCut** | Fast phone/desktop editing, templates, effects | Very popular for Reels. Desktop can import the `.cube` LUTs |
| **DaVinci Resolve** | Serious colour grading, long edits | Free version is very capable. Studio is a one-time ~$295. Steeper learning curve |
| **Premiere Pro / After Effects** | Pro workflows, motion graphics | Subscription. Overkill for most Reels |
| **Descript** (connected in Claude) | Editing video by editing the transcript, filler-word removal | Claude can drive it |
| **OpusClip** (connected) | Long video → many short clips | Needs Pro plan for API/MCP |
| **ElevenLabs** (connected) | Voiceover, dubbing to Hindi/Kannada, music, SFX | Credits-based |
| **vidIQ** (connected) | Titles, thumbnails, trend research | Mostly YouTube-focused |

---

## 6. Instagram: what to know

**File specs** (used by `export`):
- 1080×1920, 9:16 (3:4 at 1080×1440 is also accepted).
- MP4, H.264 + AAC 48 kHz, 30 fps.
- Upload over Wi-Fi, and turn on "Upload at highest quality" in Settings → Media quality.

**Safe zones.** Keep text out of the top ~250 px (username, audio) and the bottom ~350 px
(caption, buttons). Also stay clear of the right ~150 px, where the like/comment/share icons sit.
`reel.py` places captions and hooks inside these limits.

**Cover image.** Make it 1080×1920, but the profile grid crops it to the centre (square or 3:4),
so keep the title in the middle. `cover` does this.

**Length.** Sources disagree on current limits (90 s / 3 min / up to 20 min). Reels over 3 minutes
are reportedly not recommended to non-followers. Sweet spot for reach: 7–60 s. Teaching Reels:
30–90 s.

**What the algorithm reportedly rewards.** Adam Mosseri (head of Instagram) has named **watch
time, likes and sends (DM shares)** as the top signals. He has said sends matter most for reaching
new people. Third-party guides add completion rate, replays and saves. Original content is
favoured: reposts and visible TikTok watermarks are reportedly held back.

**What that means for each Reel:**
1. **Hook in the first 1–2 s.** Use a spoken hook plus on-screen text (`--hook`). Open on the
   most interesting frame: a question, a bold claim, or the result first.
2. **No dead air.** Cut silences (`cut`) and reset attention every 2–4 s (`--punch`, B-roll, text).
3. **Captions always**, big and inside the safe zone.
4. **Give a reason to send or save.** "Send this to your study partner", or a checklist people
   will want to come back to.
5. **End on a loop or a clear call to action.** An ending that flows back into the start increases replays.
6. Caption text: the first line works as a second hook. Use 3–5 relevant hashtags (Instagram has
   said hashtags matter little for reach). Add the topic keywords in the caption, because
   Instagram search reads it.
7. **Trial Reels** let you test a Reel on non-followers first (reportedly now widely available).
   Use it to compare two hooks.
8. **Collab posts** put one Reel on two accounts' feeds.
9. Post when your followers are active (Insights → Audience). Consistency beats volume: 3–5 Reels a week.
10. Check Insights after 48 hours: skip rate in the first 3 seconds, average watch time, sends, saves.

---

## Sources
- Music and licensing: [Foxi Music: Reels copyright guide](https://www.foximusic.com/blog/instagram-reels-music-copyright-legal-guide/) ·
  [Music Business Worldwide: Meta Sound Collection](https://musicbusinessworldwide.com/meta-offers-royalty-free-music-library-to-instagram-reels-advertisers) ·
  [Soundstripe: Instagram music library](https://www.soundstripe.com/blogs/instagram-music-library) ·
  [Screenapp: copyrighted music guide](https://screenapp.io/blog/how-to-use-copyrighted-music-on-instagram-legally) ·
  [Lindsey Gamble: replace licensed music for ads](https://www.lindseygamble.com/blog/instagram-adds-option-to-replace-licensed-music-to-boost-reels-as-ads) ·
  [Mixkit whooshes](https://mixkit.co/free-sound-effects/whoosh/) · [Epidemic Sound Instagram SFX](https://www.epidemicsound.com/de/instagram/instagram-sound-effects/)
- Colour: [Appalachian State thesis: colour and mood](https://appstate.figshare.com/articles/thesis/Color_Grading_In_Film_How_Complementary_Colors_Affect_An_Audience_s_Perception_Of_Mood/29863010) ·
  [Shotkit: teal and orange](https://shotkit.com/teal-orange-look/) · [Photography Icon: grading for mood](https://photographyicon.com/color-grading-photography/) ·
  [FreeVisuals LUT pack](https://www.freevisuals.net/luts/free-22-cinematic-luts-pack)
- Camera: [Seenit: camera movements](https://www.seenit.io/blog/6-basic-camera-movements-and-why-they-matter/) ·
  [Ulanzi: camera movement techniques](https://www.ulanzi.com/en-eu/blogs/news/camera-movement-techniques-dynamic-shots) ·
  [Vidpros: short-form transitions](https://vidpros.com/best-transitions-for-short-form-videos/)
- Background: [Background-removal library landscape](https://ice-ice-bear.github.io/posts/2026-04-13-matting-libraries) ·
  [video-background-remover (rembg)](https://pypi.org/project/video-background-remover/0.1.2/)
- Tools: [Metricool: Reels editing apps](https://metricool.com/video-editing-apps-for-instagram/) ·
  [DesignRush: best video editing apps](https://www.designrush.com/agency/video-production/trends/best-video-editing-apps)
- Instagram specs and algorithm: [Argil spec sheet](https://argil.ai/blog/instagram-reel-size-e350f) ·
  [Socialync specs](https://www.socialync.io/tools/video-specs/instagram-reels) ·
  [Later: Reels algorithm](https://later.com/blog/instagram-reels-algorithm/) ·
  [ContentStudio: algorithm](https://contentstudio.io/blog/instagram-algorithm) ·
  [Epidemic Sound: how the algorithm works](https://www.epidemicsound.com/blog/how-the-instagram-algorithm-works/)
