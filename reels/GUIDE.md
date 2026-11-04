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

## 9. Lighting: setups to shoot with, and virtual light in the edit

### 9a. Physical setups (shoot it right first)

Every lighting video in the top 50 says the same thing: **lighting is the single biggest
quality upgrade**, bigger than the camera.

| Setup | Where the lights go | Look / use |
|---|---|---|
| **One light + window** (₹0–2,000) | Face a window from the side (≈45°), with a sheer curtain to soften direct sun. White card or foam board on the other side as fill | Natural, European feel. Never put the window *behind* you (you become a silhouette) |
| **Three-point** | **Key** 45° to one side, a bit above eye level. **Fill** on the other side, dimmer. **Back/rim** light behind you aimed at head and shoulders at 10–20% of the key | The standard YouTube/TV look. A missing backlight is the most common mistake: you merge into the wall |
| **Loop** | Key 30–45° and slightly high, so the nose shadow makes a small loop toward the cheek | The most flattering everyday portrait light |
| **Rembrandt** | Key 45° and higher, little fill, so a small triangle of light shows on the shadow-side cheek | Moody, cinematic, serious topics |
| **Butterfly / paramount** | Key in front, high above the camera, with a reflector under the chin | Beauty, glamour, even and bright |
| **Split** | Key 90° to the side, no fill | Half the face dark: drama, mystery |
| **Motivated + practicals** | A visible lamp, fairy lights or a monitor in the background "explains" the light. Match your key's colour and direction to it | Cinematic depth. The "secret hack" from the Think Media lighting video |
| **Two-tone gels** | Neutral key; coloured lights (teal/orange, blue/magenta) on the background and as a rim | Tech, night, gaming, modern creator |

**Rules that keep coming up:**
- **Soft beats hard.** A bigger source closer to you gives softer shadows. Use a softbox, lantern, diffusion panel or curtain.
- **Brightness:** dim the light, or move it farther away. Don't move it to a worse angle.
- **Colour temperature:** daylight is about 5600K, tungsten about 3200K. Get **bi-colour** lights so
  they can match the window or the lamp. Mixing window light and LEDs: set around 4500–5000K, or gel to match.
- **Lock white balance and exposure** on the phone, so the colour doesn't drift mid-take.
- **Shutter = 2× frame rate** (1/60 at 30 fps, 1/50 at 25 fps) for natural motion blur.
- Use the **rear camera** (better sensor, frame rates), at eye level. Keep straight lines behind you, and headroom for vertical framing.
- Separate yourself from the background: a backlight, distance from the wall, or a darker background.

**Budget kit (India, approx.):** one bi-colour LED panel or COB light with a softbox as key
(₹3–8k), a small RGB tube for rim/background (₹2–4k), a white foam board for fill (₹200), and a
clip-on mic. The ₹100 "cinematic studio" video does it with one softbox, a backlight and a practical lamp.

### 9b. Virtual light in the edit: `light` / `auto --light`

`fx.relight` uses MediaPipe's multiclass segmentation, which separates background, hair, body
skin, face skin and clothes. It finds the face in every frame and then adds:

- **auto exposure** on the face only. A face that's already well exposed is left alone.
- a **key light** from the chosen side, with a lit:shadow ratio and a colour temperature in Kelvin.
- **fill**, which lifts the shadow side.
- **rim light** on the person's edge, opposite the key: the separation light.
- **background** dimming and **coloured gel** washes.
- temporal smoothing, so the light never flickers. The maths is done in linear light, with a soft roll-off in the highlights.

| `--light` | Imitates |
|---|---|
| `auto` | Exposure fix only |
| `creator` | Soft 45° key + warm rim + slightly darker room (default for `hollywood`) |
| `loop` | Loop lighting (`french_whimsy`) |
| `rembrandt` | 4:1 key, deep shadow side (`peaky`, `italian_baroque`) |
| `butterfly` | Frontal high key, bright and even |
| `split` | 90° side light (`ritchie`) |
| `window` | Soft side daylight (`french`, `nordic`, `nouvelle_vague`) |
| `golden` | Low warm sun + warm rim + amber background (`italian`) |
| `overcast` | Flat, cool, soft (`british`, `neorealismo`) |
| `neon` | Teal background + magenta rim |
| `noir` | Hard key from the other side, black room |

```bash
python3 reels/reel.py lights                                   # list presets
python3 reels/reel.py light in.mp4 out.mp4 --light rembrandt --light-side right --light-strength 0.8
python3 reels/reel.py auto raw.mp4 --style french --light golden    # override the style's light
python3 reels/reel.py auto raw.mp4 --style hollywood --light none   # keep the original light
```

**Honest limits.** Virtual light *reshapes* light that is already there. It can deepen a shadow
side, add a rim, warm a key, dim a room or fix exposure. It **cannot** make a flat, dark,
noisy phone clip look like a lit studio, and strong settings on hair edges can halo. Generative
relighting (IC-Light, DaVinci Resolve Studio's Relight, RelightVid) goes further but needs a GPU.
**Light it well when you shoot; use `light` to finish it.**

---

## 10. Top 50 YouTube videos on editing, Reels, camera, lighting and sound

I ran 24 YouTube searches (yt-dlp) and ranked the 360 results by views. These are the top 50.
I read 35 transcripts (YouTube's bot check blocked the other 15, marked *title only*).
Views were counted on 4 Nov 2026.

| # | Video (channel, views) | Key lessons | In the toolkit |
|---|---|---|---|
| 1 | How to edit SO good your viewers get addicted (Learn By Leo, 6.0M) | Edit for the experience viewers want. Visual change every few seconds but never cut for its own sake. Zoom for emphasis. Keep the eye-trace across cuts. Captions ≤3 words. Risers → hits, pause the music for key lines | `--style`, `--shots`, face-centred framing, `sfx` |
| 2 | How I Plan Shots & Transitions / B-roll 101 (Daniel Schiffer, 5.7M) | Plan B-roll as a chain: each shot's movement continues into the next (tilt-down → tilt-down, pull-away → pull-away). Hide cuts in motion (whip, hand passes) | §3 camera moves; plan shots before filming |
| 3 | DaVinci Resolve Beginners Tutorial (Ben Claremont, 5.5M) | *title only*: free pro editor | Use the `.cube` LUTs in Resolve |
| 4 | Total Beginner's Guide to Video Editing (YouTube Creators, 5.0M) | *title only* | n/a |
| 5 | Lighting for YouTube Videos (Ben Johnson, 4.8M) | Start with all lights off. Key at 45°. Dim it or move it back rather than over-brighten. Bi-colour lights to nail white balance | §9a, `--light creator` |
| 6 | 12 Camera Angles (Full Time Filmmaker, 4.2M) | Wide/medium/close/detail, low (power), high (vulnerable), Dutch (unease), OTS, POV, cutaway. Choose an angle for the emotion; empty frames feel lonely; too many angles distract | `--shots` (wide/medium/close/extreme) |
| 7 | Beginners Guide to Video Editing (Think Media, 4.0M) | *title only* | n/a |
| 8 | How to edit aesthetic videos on CapCut (Christine Tay, 3.8M) | Overlays + masks for cloning and split screens. Keyframe position for motion. Black-and-white background to focus the subject. Lower highlights for a softer ambience | `bg`, `grade --look parisian` |
| 9 | LIVE Reel Editing Tutorial in CapCut (NSB Pictures, 3.4M) | *title only* | n/a |
| 10 | Introduction to DaVinci Resolve: Full Course (Casey Faris, 3.4M) | Full workflow: media, timeline, colour wheels, power windows (masked corrections), audio, delivery | `grade`, LUTs |
| 11 | Master Mobile Filmmaking in 20 Minutes (Tomorrow's Filmmakers, 3.3M) | Shutter = 2× frame rate. **Lock white balance** (5400–5600K in sun). Turn off phone stabilisation on a gimbal | §9a shooting rules |
| 12 | CapCut Tutorial for Beginners (Metics Media, 3.3M) | Short transitions (~0.5 s), zoom by keyframing scale, basic exposure/colour adjustments | `camera --ease` |
| 13 | 12 Camera Movements for Cinematic Footage (Jacques Crafford, 3.3M) | Move the camera *opposite* to the subject's movement. 35–50 mm feel. Pull-out reveals, forward push with a foreground, orbit reveals | `--moves pull,dolly,orbit` |
| 14 | How to make shorts that go viral every time (Logan Smith, 3.0M) | Know the core audience. Hook (first 5 s) → tension → payoff. Fast pace, no pauses, captions, quick music. Consistency | `cut`, `--hook`, captions |
| 15 | CapCut App Tutorial for Beginners (Dee Nimmin, 2.9M) | Put the hook clip first. Hard cuts by default; add transitions only on purpose | default hard cuts |
| 16 | In-Depth CapCut Tutorial, Mac & PC (Content Creators, 2.5M) | B-roll keeps what's on screen changing. Reframe by zooming. Readable text with a background box. Keyframe slow zooms | `--hook` box, `--push` |
| 17 | How I Would Learn Video Editing (Gavin Herman, 2.3M) | Story first, tool second. Ask whether this should be energetic or laid-back. Hierarchy (the key element stands out), a consistent colour palette, balanced music | style chooser |
| 18 | Color Grading 101 (Film Riot, 2.2M) | *title only* | §2 |
| 19 | Learn Premiere Pro in 10 Minutes (Gavin Herman, 2.1M) | Keyframes with eased (slow-fast-slow) motion. Lumetri for basic correction | `_ease` in camera |
| 20 | Instagram Reels Kaise Edit Kare (Manish4u, 2.1M) | *title only* (Hindi, in-app Reels editor) | n/a |
| 21 | Watch BEFORE buying a light (Content Creators, 2.0M) | Modifiers: softbox, lantern, diffusion, silk. Daylight-only vs bi-colour. Bowens mount. A third light as a practical or background light | §9a budget kit |
| 22 | 6 Ways to Edit Any Scene (StudioBinder, 1.9M) | Walter Murch's rule of six (emotion first). Eyeline match, cutaways, cross-cutting, eye-trace, **J- and L-cuts** | face-centred cuts |
| 23 | CapCut Zoom + Shake Edit (Exal.Visuals, 1.8M) | Keep the face centred while keyframing zooms. Add motion blur. Shake on the beat | `--shots`, `--shake` |
| 24 | 10 CapCut Editing Hacks (Modern Millie, 1.7M) | 3D zoom on photos, auto-snap, fill frame | `--push` |
| 25 | Smooth Twixtor + 120 fps edits (Exal.Visuals, 1.7M) | Speed ramps on graph curves (fast→slow). Optical flow for smooth slow motion | Speed ramps: CapCut/RIFE (GPU) |
| 26 | Video Editing Full Course (Etubers, 1.7M) | *title only* | n/a |
| 27 | Cinematic lighting setup, just 3 lights (Lila, 1.6M) | *title only*: key, fill and a background accent | §9a |
| 28 | Instagram Reels Editing Full Course, Hindi (Raj Photo Editing, 1.5M) | *title only* | n/a |
| 29 | How to get the "Film look" (Sleepy Charlie, 1.4M) | Soft highlights, warmth, grain, halation, bloom. Make your own correction before film emulation | `--film` |
| 30 | How to Create & Edit Aesthetic Videos (Modern Millie, 1.4M) | Lock exposure, wipe the lens, use the rule of thirds, underexpose a little for a moody look. Film the same action from several angles. Music sets the aesthetic | §9a, `--shots` |
| 31 | How to Make Instagram Reels Like a PRO (Primal Video, 1.4M) | Licence your music. Use new in-app features (dual camera, Align for seamless transitions). Set the length before filming | music guidance §1 |
| 32 | 10 Editing Cuts Every Editor Should Know (Jonny Duncan, 1.3M) | *title only* | n/a |
| 33 | The Power of SIMPLE Editing (Andrew, 1.3M) | *title only* | `nordic`/`french` |
| 34 | How to Edit Viral Reels (Pablo Quesada, 1.3M) | *title only* | n/a |
| 35 | 21 Best CapCut Tricks (Matt Loui, 1.2M) | *title only* | n/a |
| 36 | $100 Cinematic YouTube Studio Setup (Content Creators, 1.2M) | Never face the camera into a window. Key at 45° + backlight on head and shoulders. Bigger source = softer. Rear camera. Composition, lighting, audio | §9a |
| 37 | Sound Design for Cinematic Filmmaking (Jacob Nordin, 1.2M) | Voice first. Music sets the pacing (pick it early). **Silence is as important as sound**. Reverb to match the room. EQ to separate voice and music | `music` (ducking + EQ pocket) |
| 38 | Make your hooks impossible to skip (Kallaway, 1.1M) | 4 hook mistakes. Topic clarity in sentence 1, contrast in sentences 2–3. Say "you/your", not "me/my". Frame around a known pain point | `--hook` writing |
| 39 | How to Film YouTube Videos on Your Phone (Content Creators, 1.1M) | Window light through a curtain. Key at 45°. Lock colour temperature. 60 fps for B-roll, 24/30 for talking | §9a |
| 40 | How to Make Viral Edits on CapCut (Exal.Visuals, 1.1M) | Mark the beats, cut to the beats, layered overlays, upscale before grading | beat-sync: CapCut |
| 41 | How to SOUND DESIGN a Video (Film Editing Pro, 1.1M) | Lay temp music first. Cut the music so hits and dips land on the picture. Foley + room reverb. Stay consistent in style | `sfx --cues` |
| 42 | you only need a phone (Ali Abdaal, 1.1M) | Eye-level lens, straight lines, headroom for vertical. Keep the phone close for audio. 1× lens ≈ 24 mm "YouTuber" look | §9a |
| 43 | 4 Editing Secrets Small Channels Learn Too Late (vidIQ, 1.1M) | Visual hook. Cut-in / cut-back. Animated push/pull/pan/handheld in the edit. Mix A-roll and B-roll | `--shots`, `--moves` |
| 44 | 3 Sound Design Secrets (Herman Huang, 1.1M) | Layer sounds across frequencies. **Carve a mid-range pocket in the music for dialogue**. Commit to one sound style. A reversed song intro makes a riser | `music` EQ pocket |
| 45 | Color Grading Crash Course (Waqas Qazi, 1.0M) | *title only* | §2 |
| 46 | 10 Video Editing Tips Every Editor Should Know (Learn Online Video, 1.0M) | Organised folders. Speed ramps. Digital zoom on static shots. Archive SFX and music. Music changes meaning (hero vs villain) | `--push`, `--shots` |
| 47 | 80% of Videography Basics in <10 Minutes (Pat Kay, 916K) | *title only* | n/a |
| 48 | Three Point Lighting Setup (Think Media, 908K) | Key = main light (either side). Fill dimmer. Backlight for separation. **Motivated lighting**: match a practical lamp's colour | `--light creator` |
| 49 | Keyframe Mastery Guide in CapCut (Zeven 7, 895K) | Keyframes far apart = slow, close together = dramatic. Ease in/out curves. Keyframed colour shifts | `--ease`, `--cut-gap` |
| 50 | How to Create Irresistible Hooks (Kallaway, 879K) | Curiosity loop. A visual hook with motion + text on screen. Compress speed to value | `--hook`, `cut` |

---

## 11. Top 50 GitHub repositories for video editing

From GitHub searches ("video editing", "video-editor", "auto editing", "shorts reels generator",
"color grading LUT", "video matting", "ffmpeg", "programmatic video", "upscaling", "relighting",
"face tracking reframe", ...) plus the ML models behind editing. Players, downloaders of
unclear purpose and unrelated tools were removed. Sorted by stars (as of 4 Nov 2026).
**Used** = part of this toolkit now.

| # | Repo | ★ Stars | Licence | What it is | How it relates to our toolkit |
|---|---|---|---|---|---|
| 1 | [yt-dlp/yt-dlp](https://github.com/yt-dlp/yt-dlp) | 205,029 | Unlicense | Download | **Used**: YouTube research (search + transcripts) |
| 2 | [harry0703/MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo) | 138,354 | MIT | AI short-video generator | Topic → stock-footage short; not for editing your own raw footage |
| 3 | [openai/whisper](https://github.com/openai/whisper) | 111,901 | MIT | Speech-to-text | Model family behind our captions |
| 4 | [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) | 78,412 | Apache-2.0 | Programmatic video (HTML) | Motion-graphic intros/explainers; also a connected MCP here |
| 5 | [calesthio/OpenMontage](https://github.com/calesthio/OpenMontage) | 76,008 | AGPL-3.0 | Agentic production system | Large AGPL pipeline; ideas for multi-step production |
| 6 | [remotion-dev/remotion](https://github.com/remotion-dev/remotion) | 70,471 | NOASSERTION | Programmatic video (React) | Designed titles/animated explainers; licence needed for companies |
| 7 | [FFmpeg/FFmpeg](https://github.com/FFmpeg/FFmpeg) | 66,427 | NOASSERTION | Core media engine | **Used**: every render, filter, LUT, loudness, export |
| 8 | [mifi/lossless-cut](https://github.com/mifi/lossless-cut) | 45,676 | GPL-2.0 | Lossless trimming GUI | Fast trims of huge phone files before editing |
| 9 | [google-ai-edge/mediapipe](https://github.com/google-ai-edge/mediapipe) | 37,541 | Apache-2.0 | Vision ML | **Used**: person/face segmentation → background + relighting |
| 10 | [xinntao/Real-ESRGAN](https://github.com/xinntao/Real-ESRGAN) | 37,351 | BSD-3-Clause | AI upscaling | Rescue low-res clips; needs GPU to be practical |
| 11 | [webadderallorg/Recordly](https://github.com/webadderallorg/Recordly) | 36,008 | NOASSERTION | Screen-demo recorder | App/screen demo Reels |
| 12 | [browser-use/video-use](https://github.com/browser-use/video-use) | 30,493 | MIT | Agent video editing | Agent-driven editing ideas |
| 13 | [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper) | 26,459 | MIT | Speech-to-text | **Used**: word-timed captions, Kannada/Hindi/English |
| 14 | [danielgatis/rembg](https://github.com/danielgatis/rembg) | 25,324 | MIT | Background removal | Alternative matting models (slower on CPU) |
| 15 | [m-bain/whisperX](https://github.com/m-bain/whisperX) | 25,075 | BSD-2-Clause | Word-aligned STT | Tighter word timing; best on GPU |
| 16 | [facebookresearch/sam2](https://github.com/facebookresearch/sam2) | 20,098 | Apache-2.0 | Segment anything (video) | Track any object for masks/effects; GPU |
| 17 | [alyssaxuu/screenity](https://github.com/alyssaxuu/screenity) | 18,937 | GPL-3.0 | Screen recorder | Record app walkthroughs for Reels |
| 18 | [ffmpegwasm/ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) | 17,949 | MIT | FFmpeg in browser | Browser-side editing tools |
| 19 | [storytold/filmcraft](https://github.com/storytold/filmcraft) | 17,445 | Apache-2.0 | NLE in Rust | Open editor to watch |
| 20 | [AaronFeng753/Waifu2x-Extension-GUI](https://github.com/AaronFeng753/Waifu2x-Extension-GUI) | 17,182 | NOASSERTION | Upscale + interpolation GUI | Windows GUI for upscaling/slow-mo |
| 21 | [Vincentwei1021/video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft) | 16,583 | Apache-2.0 | Claude Code video skill | Remotion shot recipes for promos |
| 22 | [mltframework/shotcut](https://github.com/mltframework/shotcut) | 15,589 | GPL-3.0 | Free NLE | Desktop editor alternative |
| 23 | [Zulko/moviepy](https://github.com/Zulko/moviepy) | 15,104 | MIT | Python editing | Python compositing; slower than ffmpeg |
| 24 | [palmier-io/palmier-pro](https://github.com/palmier-io/palmier-pro) | 14,678 | GPL-3.0 | macOS AI editor | GPL editor for Mac |
| 25 | [krillinai/OpenCreator](https://github.com/krillinai/OpenCreator) | 14,133 | Apache-2.0 | Translation & dubbing | Dub Reels into Hindi/Kannada/English |
| 26 | [jub0t/Concat](https://github.com/jub0t/Concat) | 14,018 | AGPL-3.0 | CapCut-style open editor | Scriptable JSON timelines |
| 27 | [lemomo-ai/lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) | 11,794 | MIT | Film styles for Claude Code | Style-preset ideas (like our --style) |
| 28 | [rhasspy/piper](https://github.com/rhasspy/piper) | 11,316 | MIT | Offline TTS | **Used**: test voiceovers |
| 29 | [kkroening/ffmpeg-python](https://github.com/kkroening/ffmpeg-python) | 11,013 | Apache-2.0 | FFmpeg bindings | Python filter graphs |
| 30 | [facebookresearch/demucs](https://github.com/facebookresearch/demucs) | 10,403 | MIT | Stem separation | **Installed** (`--full`): pull voice out of music/noise |
| 31 | [PeterL1n/RobustVideoMatting](https://github.com/PeterL1n/RobustVideoMatting) | 9,585 | GPL-3.0 | Video matting | Best-edge background removal; GPL, GPU |
| 32 | [olive-editor/olive](https://github.com/olive-editor/olive) | 9,148 | GPL-3.0 | Free NLE | Open editor |
| 33 | [lllyasviel/IC-Light](https://github.com/lllyasviel/IC-Light) | 8,573 | Apache-2.0 | AI relighting | Generative relight (image); GPU. Our `light` is the CPU version |
| 34 | [OpenTalker/video-retalking](https://github.com/OpenTalker/video-retalking) | 7,299 | Apache-2.0 | Lip-sync | Fix/translate lip-sync; GPU |
| 35 | [OpenShot/openshot-qt](https://github.com/OpenShot/openshot-qt) | 6,740 | NOASSERTION | Free NLE | Beginner desktop editor |
| 36 | [KDE/kdenlive](https://github.com/KDE/kdenlive) | 6,043 | GPL-3.0 | Free NLE | Full-featured open editor |
| 37 | [getopenscreen/openscreen](https://github.com/getopenscreen/openscreen) | 5,975 | MIT | Screen recorder | Demo recordings |
| 38 | [WyattBlue/auto-editor](https://github.com/WyattBlue/auto-editor) | 5,753 | Unlicense | Silence cutting | **Used**: `cut` step |
| 39 | [Anil-matcha/AI-Youtube-Shorts-Generator](https://github.com/Anil-matcha/AI-Youtube-Shorts-Generator) | 5,749 | MIT | Long → shorts | Find highlights in long videos, 9:16 |
| 40 | [mifi/editly](https://github.com/mifi/editly) | 5,579 | MIT | Declarative CLI editing | JSON-spec slideshows/edits |
| 41 | [Augani/openreel-video](https://github.com/Augani/openreel-video) | 5,572 | MIT | Browser CapCut alternative | Web editor |
| 42 | [Breakthrough/PySceneDetect](https://github.com/Breakthrough/PySceneDetect) | 5,345 | BSD-3-Clause | Scene detection | **Installed**: split multi-shot footage |
| 43 | [Rikorose/DeepFilterNet](https://github.com/Rikorose/DeepFilterNet) | 4,950 | NOASSERTION | AI noise removal | Better denoise than ffmpeg afftdn (Rust deps) |
| 44 | [nexu-io/html-video](https://github.com/nexu-io/html-video) | 4,803 | Apache-2.0 | HTML → video | Programmatic graphics |
| 45 | [kajisho5/ffmpeg-skill](https://github.com/kajisho5/ffmpeg-skill) | 4,462 | MIT | FFmpeg agent tools | 42 FFmpeg tools + MCP |
| 46 | [openfilm/openfilm](https://github.com/openfilm/openfilm) | 4,452 | MIT | AI video agent | Agent + editor |
| 47 | [ZhengPeng7/BiRefNet](https://github.com/ZhengPeng7/BiRefNet) | 4,360 | MIT | High-res segmentation | Sharper hair edges for bg swap; GPU |
| 48 | [abhiTronix/vidgear](https://github.com/abhiTronix/vidgear) | 3,731 | Apache-2.0 | Video I/O framework | Fast capture/stream pipelines |
| 49 | [PyAV-Org/PyAV](https://github.com/PyAV-Org/PyAV) | 3,324 | BSD-3-Clause | FFmpeg bindings | Frame-level access |
| 50 | [colour-science/colour](https://github.com/colour-science/colour) | 2,683 | BSD-3-Clause | Colour science | Accurate colour maths/LUT work |

Why most of these are not bundled: many need a **GPU** (Real-ESRGAN, RIFE, SAM 2, BiRefNet,
RVM, IC-Light, lip-sync). Some are **GPL/AGPL** (RVM, OpenMontage). Others are whole apps
rather than building blocks (Shotcut, Kdenlive, OpenShot). The CPU-friendly building blocks
(FFmpeg, faster-whisper, auto-editor, MediaPipe, OpenCV YuNet, PySceneDetect, Demucs, Piper,
yt-dlp) are what `reel.py` is built on.

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
- Lighting: [Neewer: talking-head lighting setups](https://neewer.com/blogs/blog/best-talking-head-lighting-setups) ·
  [Vidpros: three-point lighting](https://vidpros.com/three-point-lighting-setup/) · [Zhiyun: three-point guide](https://store.zhiyun-tech.com/blogs/news/three-point-lighting-setup-guide-for-portraits-videos-and-creator-studios) ·
  [Beverly Boy: mixing colour temperatures](https://beverlyboy.com/film-technology/color-temperature-tricks-mix-light-without-it-looking-wrong) ·
  [Melies: motivated lighting](https://melies.co/cinematic-techniques/lighting/motivated-lighting) · [Harlowe: social media lighting](https://www.harlowe.com/blogs/blogs/social-media-lighting-for-creators) ·
  [No Film School: Resolve Relight](https://nofilmschool.com/blackmagic-davinci-resolve-relight-fx-tool) · [RelightVid](https://aleafy.github.io/relightvid) · [IC-Light (ComfyUI wiki)](https://comfyui-wiki.com/en/models/ic-light)
- Instagram specs and algorithm: [Argil spec sheet](https://argil.ai/blog/instagram-reel-size-e350f) ·
  [Socialync specs](https://www.socialync.io/tools/video-specs/instagram-reels) ·
  [Later: Reels algorithm](https://later.com/blog/instagram-reels-algorithm/) ·
  [ContentStudio: algorithm](https://contentstudio.io/blog/instagram-algorithm) ·
  [Epidemic Sound: how the algorithm works](https://www.epidemicsound.com/blog/how-the-instagram-algorithm-works/)
