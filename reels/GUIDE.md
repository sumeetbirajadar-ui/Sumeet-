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

## 7. European cinema styles: French, Italian, British, Nordic

European film language is generally **slower, more observational and more natural-light** than the
US creator style. It uses longer takes, fewer graphics, film texture, and type set like a book
cover instead of a meme. One `--style` flag sets everything in the table below. The looks are
*inspired by* the films named; they are not copies of any film's actual grade.

| Style | Colour | Shots and moves | Pace | Captions | Sound |
|---|---|---|---|---|---|
| `french` | `parisian`: muted pastel, creamy highlights, cool-grey shadows + 35mm film | wide ↔ medium, **handheld** drift | slow, 3.5 s+ between changes, 16-frame glides | lowercase **Cormorant Garamond italic**, cream | voice and music only |
| `french_whimsy` | `amelie`: saturated red/green/amber, gold light (Delbonnel-style) | wide/close/medium, **dolly-ins** | lively but smooth | **DM Serif italic**, red accent | light SFX |
| `nouvelle_vague` | silvery B&W + **16mm** grain/halation | wide ↔ close **jump cuts** (Godard-style), handheld | tight cuts, 0.12 s margins | small lowercase serif | no SFX |
| `italian` | `italian_summer`: golden natural sunlight, warm greens (Guadagnino-style) + 35mm | wide ↔ medium, **dolly + pan** glides | unhurried, 18-frame glides | **Playfair Display italic**, gold | music-led |
| `italian_baroque` | `dolce_vita`: deep rich colour, wine shadows, high contrast (Sorrentino-style) | dramatic wide→close→extreme, **orbits, pull-outs** | grand, deliberate | Playfair caps, gold | sparse hits |
| `neorealismo` | gritty high-contrast B&W + 16mm | handheld, mostly wide | plain | serif, white | none |
| `british` | `british_drama`: overcast, cool green-grey, desaturated | wide/close/medium, handheld + static | measured, 3 s | **Montserrat** sentence case | none |
| `peaky` | `peaky`: smoky, only strong colours survive, sepia lean, gold highlights + 35mm | dramatic changes, slow **push / pull** | brooding | **Bebas Neue** caps, gold | impacts on beats |
| `ritchie` | `ritchie`: half-bleached, brown-gold, crunchy contrast + grain | **snap zooms**, pans, fake orbits | fast, 1.8 s, 2-frame snaps | Bebas caps, 2 words, red | whooshes + impacts |
| `nordic` | `scandi`: cold, airy, low saturation | static + slow pans, lots of space | very slow, 4 s | lowercase Montserrat, ice blue | none |
| `hollywood` | `blockbuster` teal-orange | talk pattern, snap jump-zooms | fast, 2.2 s | Poppins ExtraBold caps, yellow | full SFX |

**How the colour works** (colourist order: correct, then look, then film print):
- *Amélie*'s palette is described as deep red, warm yellow-amber, muted green and cool shadow blue,
  under soft slightly-yellow light. The `amelie` look does this: green-lean shadows, gold highlights,
  and extra saturation on reds, greens and yellows.
- *Call Me By Your Name* relied on natural light and 35mm for a golden sunlit look. `italian_summer`
  warms the mids, lifts yellow-greens, calms the blues, and adds 35mm texture.
- *Peaky Blinders* was described by its cinematographer as desaturated except strong primaries,
  with a slight sepia tint, period-photo-inspired, plus a signature "Peaky gold". The `peaky` look
  uses *selective saturation*: weak colours are drained and strong ones are kept.
- Warm looks fade their tint out in the brightest areas, so white walls stay cream, not lemon.
  Skin hues are protected in every look.

**Film emulation** (`--film 35mm|16mm|super8`), built from the YouTube film-look tutorials.
It adds softness, **halation** (red-orange glow round bright edges), **bloom** (highlight glow),
grain, and **gate weave** (the tiny frame wobble of a projector). 16mm and Super 8 push all of these harder.

### Shot sizes and angles

`camera` / `auto --shots` turns one camera into a multi-camera edit, centring every closer shot on
the speaker's face:

| Shot | Zoom | Use |
|---|---|---|
| `wide` | 1.0× | Context, the person + space. Opening and resetting |
| `medium` | 1.2× | Normal talking |
| `close` | 1.45× | Emphasis, emotion, "listen to this" |
| `extreme` | 1.8× | Rare: a single punchline or reaction (drama pattern only) |

Patterns: `talk` (wide→close→medium→close), `punch` (wide↔medium), `drama`
(medium→close→wide→extreme…), `minimal` (wide↔medium). You can also give your own:
`--shots wide,close,wide,medium`.

**Digital zoom loses sharpness.** If you'll use close and extreme shots, film in 4K, or at
least 1080p landscape, so there is resolution to crop into.

### Moving angles

`--moves` is cycled across the shots:

| Move | Feel |
|---|---|
| `handheld` | Organic drift and slight roll, like someone holding the phone. French and British realism |
| `pan` | Slow lateral slide. Italian and Nordic calm |
| `dolly` | Slow push-in across the shot. Tension, intimacy |
| `pull` | Pull-out. Reveal, ending, grandeur |
| `orbit` | Rotate, slide and zoom together, faking a camera circling the subject. Baroque / premium |
| `static` | Locked off. Authority, comedy timing (Ritchie) |

`--ease` sets how framing changes: 1–3 frames is a cut (Hollywood, Ritchie, New Wave jump cuts),
10–20 frames is a glide (French, Italian, Nordic).

For **shooting** real camera angles: wide = phone 2–3 m away at chest height; close = 0.8–1 m, eye
level; low angle = authority; high angle = vulnerability; over-the-shoulder for writing or solving;
top-down for paper and desk work.

```bash
python3 reels/reel.py styles                                     # list all style presets
python3 reels/reel.py auto raw.mp4 --style french --hook "la physique, simplement"
python3 reels/reel.py auto raw.mp4 --style italian --music piano.mp3 --prompt "Newton"
python3 reels/reel.py auto raw.mp4 --style ritchie --hook "3 mistakes" --moves static,pan,orbit
python3 reels/reel.py camera in.mp4 out.mp4 --words-json work/words.json --shots drama --moves dolly,pull --ease 14
python3 reels/reel.py grade in.mp4 out.mp4 --look peaky --film 35mm --vignette
```

---

## 8. What the most-watched YouTube editing tutorials teach

I searched YouTube (via yt-dlp) for Reels/Shorts editing, retention, CapCut, Edits, film look and
software comparisons, and read the transcripts of the most-viewed relevant videos. The lessons are
condensed below, with where each one lives in this toolkit.

| Video (views) | Key lessons | In the toolkit |
|---|---|---|
| Learn By Leo, *How to edit SO good your viewers get addicted* (6.0M) | Match editing to the *experience* viewers want (hanging out vs entertainment). Change what's on screen every few seconds, but don't cut for its own sake. Zoom in for important lines. Keep the eye-trace in the same place across a cut. Captions ≤3 words. Whoosh on movement, **risers before hits**, drones for mystery. Change the music mood per section; pause music abruptly or let it fade to signal a section change | `--style` (pacing per experience), `--shots`, `--words 3`, `sfx --cues riser@x,impact@x`, face-centred framing |
| vidIQ, *4 Editing Secrets Small Channels Learn Too Late* (1.1M) | **Visual hook** in the first frames (not just spoken). Cut-in / cut-back. Push-in, pull-out, pan and zoom added in the edit. Mix A-roll and B-roll | `--hook`, `--shots talk`, `--moves dolly,pull,pan` |
| Logan Smith, *How to get retention SO HIGH* (369K) | Structure is **hook → tension → payoff**. The hook states the idea and promises a payoff in <5 s. Build tension with "but / however". Always deliver the payoff. Change music between sections | Script structure (see the Instagram section) |
| heyDominik, *I Studied 1,000 Hooks* (842K) | People scroll on autopilot, so the first frame needs **context + a curiosity gap**. Challenge a common belief. Keep text small enough for the **safe zone**. Open loops and close them late | `--hook`, safe-zone caption positions |
| Zeven 7, *Viral Minimal Reel Edits in CapCut* (835K) | Minimal style: clean background, one central object/character/word, soft shadows, eased (cubic) motion, subtle glitch and blur-in | `nordic`/`french` styles, `--ease` glides |
| Collin Michael, *Advanced CapCut Tutorial* (1.7M) | Keyframes, masks, speed ramps, overlays, sound design | Speed ramps and masks: do in CapCut; the rest is here |
| Sleepy Charlie, *How to get the film look* (1.4M) | The film look = soft highlights, warmth, grain, halation, bloom. **Correct the colour first**, then add film emulation (e.g. Dehancer) | `--film 35mm` + any look |
| serr, *Emulating 16mm or 35mm film* (867K) | Node order: exposure/WB → softness → grain → halation → bloom → saturation density → print LUT. Gate weave and film breath for projector feel | `fx.film_filters` follows this order |
| Justin Brown (Primal Video), *Instagram Edits app tutorials* (100K–2.8M) | Edits: free, made by Instagram, trending audio library, templates, captions, green screen | Finish in Edits after `reel.py` if you want in-app trending audio |
| Think Media / Nathan, *Best editing software* (200K–880K) | Beginner: CapCut / Edits. Free pro: DaVinci Resolve. Paid pro: Premiere Pro / Final Cut. AI helpers: Descript, OpusClip | See section 5 |

Couldn't read (YouTube rate-limited the session): Ben Claremont's CapCut Reels video,
Dante Pascarella's *5 Color Grading Secrets*, and the Edits app transcript. Their titles are in
the search list, and the lessons above overlap heavily with them.

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
