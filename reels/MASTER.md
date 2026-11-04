# MASTER: Reels editing, the complete command file

The one-page operating manual for the Science Monk Reels toolkit: every command and option,
how to choose a style, and the checklists. The research behind it is in [GUIDE.md](GUIDE.md).
In Claude Code, type **`/reel`** and Claude follows this file.

---

## 0. Start of every session (the cloud container resets)

```bash
bash reels/setup.sh            # tools, fonts (Latin + Kannada + Devanagari + serif), models, LUTs, SFX
bash reels/setup.sh --full     # + Demucs voice/music separation (~1 GB)
```

## 1. The one command

```bash
python3 reels/reel.py auto RAW.mp4 [OUT.mp4] --style STYLE --hook "TITLE" [options]
```

Pipeline: **cut silences → 9:16 face-tracked reframe → transcribe → [background] → [virtual light] → [camera:
shots + moves] → [grade: look + film] → voice clean + −14 LUFS → [music ducking] → [SFX] →
captions + hook + progress bar → Instagram export (+ grain) → cover image**.

The results: `OUT.mp4`, `OUT.cover.jpg`, and `OUT_work/` with every step plus `words.json`.
To fix a caption word, edit `words.json` and run the same command again; only the render repeats.

## 2. Choose the style (how creators in that country edit)

Styles are **editing conventions** (captions, cut rhythm, keyword pops, branding, legal labels),
researched from each country's top creators and native-language tutorials (GUIDE.md §7).
They don't change colour. Colour is optional and separate (`--look`, `--light`).

| `--style` | Looks like | Use for |
|---|---|---|
| `french` | Sentence-case 2-line subtitles, soft shadow, key terms pop in yellow caps, mini zooms (Dr Nozman / Léna Situations) | Explainers, science facts, calm teaching (**good default for Science Monk**) |
| `italian` | Subtitles in a translucent box, keyword in a yellow highlight box, logo top-left (Geopop) | Talking-head education with branding |
| `german` | One word at a time, calm studio framing, few effects (Doktor Whatson) | Serious explainers, counselling facts |
| `british` | 2–3 word bold caps, yellow active word, handheld cut-ins, no dead space (Max Fosh / Hals) | Energetic vlogs, experiments, challenges |
| `spanish` | One huge yellow word, thick outline, keyword slams (CdeCiencia) | Fast fun facts |
| `european` | Calm boxed sentence subtitles, keyword highlights | Long-ish teaching Reels |
| `american` | 2–3 word ALL CAPS, snap zooms, SFX everywhere | Motivation, hype, "3 mistakes" lists |

Add `--sponsored` on paid posts to show that country's legal label (Collaboration commerciale, ADV,
Werbung, #ad, Publicidad). Any explicit option overrides the style, e.g. `--style french --cap-box --keywords "Newton,force"`.

## 3. Every option of `auto`

| Group | Option | Values / default | What it does |
|---|---|---|---|
| Style | `--style` | see `styles` | Sets look, film, shots, moves, ease, pacing, fonts, captions, SFX |
| Cut | `--threshold` | 0.04 | Loudness counted as silence |
| | `--margin` | 0.25s (style) | Padding kept round speech. 0.12s = tight jump cuts |
| | `--no-cut` | | Keep every pause |
| Reframe | `--mode` | face / blur / crop | face = follow speaker; blur = whole frame over blurred fill (screens/slides) |
| | `--zoom` | 1.0 | Tighter face crop |
| Transcribe | `--lang` | en / hi / kn / auto | Language (sets the Indic font automatically) |
| | `--model` | small | tiny, base, small, medium, large-v3 (slower = better) |
| | `--prompt` | | Spellings to expect: "KCET, NEET, Newton, Science Monk" |
| Background | `--bg` | blur / #RRGGBB / img / video | Portrait blur or background replace |
| Light | `--light` | auto, creator, loop, rembrandt, butterfly, split, window, golden, overcast, neon, noir, none (style) | Virtual key/fill/rim/background/gel lighting + face exposure fix |
| | `--light-side` / `--light-strength` | left/right/front / 1.0 | Where the key comes from / how strong |
| Camera | `--shots` | talk / punch / drama / minimal / list | Shot-size pattern at each phrase |
| | `--moves` | handheld,pan,dolly,pull,orbit,static | Moving angle per shot (cycled) |
| | `--ease` | 3 (style) | Frames between framings: 1–3 cut, 10–20 glide |
| | `--cut-gap` | 2.2 (style) | Min seconds between shot changes |
| | `--punch` / `--punch-zoom` | 1.14 | Simple wide↔close jump zoom |
| | `--push` | 0.0 | Slow push-in over the whole Reel (0.05 = 5%) |
| Colour | `--look` | 20 looks (see `looks`) | Mood grade (LUT) |
| | `--lut` | file.cube | Any downloaded LUT instead |
| | `--strength` | 1.0 | 0.6–0.8 for phone footage |
| | `--film` | 35mm / 16mm / super8 | Halation, bloom, softness, grain, gate weave |
| | `--grain` / `--vignette` | | Extra grain amount / darken edges |
| Audio | `--music` / `--music-volume` | file / 0.18 | Ducked background music |
| | `--sfx` / `--sfx-volume` | / 0.45 | Pop on hook and on keyword pops, whoosh on snaps, ding at end |
| Text | `--hook` / `--hook-secs` | / 2.5 | Title in the first seconds (also the cover title) |
| | `--case` | upper / sentence / lower (style) | Caption casing |
| | `--lines` / `--cap-box` | 1–2 / | Two-line European subtitles / translucent box behind captions |
| | `--keywords` / `--key-style` | auto / none / list; pop / box | Key terms popping big (yellow caps or yellow box) |
| | `--logo` | file.png | Channel logo top-left |
| | `--sponsored` / `--label` | / text | Country's legal ad label, or your own label text |
| | `--font` | style | Caption font family |
| | `--highlight` | yellow, green, red, cyan, gold, cream, ice, white | Active-word colour |
| | `--words` | 3 | Max words on screen |
| | `--pos` | 0.68 | Caption height (0 = top, 1 = bottom) |
| | `--progress` | | Thin progress bar at the top |
| | `--no-captions` | | Skip captions |
| Cover | `--cover-time` | 1.0 | Frame used for the cover |

## 4. Single-step commands

```bash
R="python3 reels/reel.py"
$R styles | looks | luts | sfx-kit                               # list styles / looks; rebuild LUTs / SFX kit
$R cut       in.mp4 out.mp4 --margin 0.3s
$R vertical  in.mp4 out.mp4 --mode face|blur|crop
$R transcribe in.mp4 words.json --lang kn --prompt "ಭೌತಶಾಸ್ತ್ರ"
$R bg        in.mp4 out.mp4 --bg blur | "#0c1f1c" | studio.jpg | space.mp4
$R lights                                                         # list lighting presets
$R light     in.mp4 out.mp4 --light rembrandt --light-side right --light-strength 0.8
$R camera    in.mp4 out.mp4 --words-json words.json --shots drama --moves dolly,pull,orbit --ease 14
$R camera    in.mp4 out.mp4 --at 2.5,6,9 --shots wide,close --shake 6
$R motion    in.mp4 out.mp4 --punch words.json --push 0.04 --shake 7.2
$R grade     in.mp4 out.mp4 --look peaky --film 35mm --vignette --strength 0.8
$R grade     in.mp4 out.mp4 --lut pack/teal_orange.cube
$R audio     in.mp4 out.mp4                                      # rumble cut, denoise, compress, -14 LUFS
$R music     in.mp4 out.mp4 --music bed.mp3 --volume 0.18        # auto-ducking under voice
$R sfx       in.mp4 out.mp4 --cues "pop@0.2,riser@6.5,impact@6.5,whoosh@9,ding@14"
$R captions  in.mp4 words.json out.mp4 --hook "Title" --highlight gold --font "Playfair Display" --progress
$R export    in.mp4 out.mp4                                      # 1080x1920 H.264 High, 30 fps, AAC 48k
$R cover     in.mp4 cover.jpg --time 1.2 --title "3 habits of toppers"
```

Built-in SFX: `whoosh swoosh_short pop riser impact ding click glitch shutter` (we made them,
so no copyright). The LUTs in `reels/luts/*.cube` also work in CapCut desktop, DaVinci Resolve,
Premiere and Final Cut.

## 5. Colour looks (20, optional; separate from country styles)

- **Hollywood:** blockbuster, golden, moody, noir, clean, cyber, thriller, dreamy
- **French-cinema-inspired:** amelie, nouvelle_vague, parisian
- **Italian-cinema-inspired:** italian_summer, dolce_vita, neorealismo
- **British-drama-inspired:** british_drama, peaky, ritchie
- **European:** scandi, bleach_bypass, vintage

## 6. Shots and moving angles

| Shot | Zoom | | Move | Feel |
|---|---|---|---|---|
| wide | 1.0× | | handheld | organic, real |
| medium | 1.2× | | pan | calm slide |
| close | 1.45× | | dolly | push-in tension |
| extreme | 1.8× | | pull | reveal, ending |
| | | | orbit | premium circle |
| | | | static | authority, comic timing |

Closer shots centre on the face automatically. Zoom is **resolution-aware**: a 720p source gets
gentle steps (close ≈ 1.2×), 1080p gets close ≈ 1.27×, and 4K gets the full ladder (close 1.45×, extreme 1.8×),
so close-ups never turn soft. Film in 4K if you want strong close-ups.

## 6b. Lighting: shoot it right, then finish it in the edit

**Before you press record:**
- [ ] Key light (or window) at **45°** to one side, slightly above eyes. Soft: softbox, or curtain over the window
- [ ] Fill on the other side (dimmer light or white board). **Backlight** on hair and shoulders for separation
- [ ] Never face the camera into a window. Keep distance from the wall
- [ ] All lights the **same colour temperature** (daylight 5600K / tungsten 3200K, or bi-colour to match)
- [ ] Phone: rear camera, eye level, **lock exposure and white balance**, shutter = 2× frame rate
- [ ] A practical (lamp, fairy lights) in the background for depth

**In the edit** (`--light`; every style uses `auto` = exposure fix only, unless you choose):

| Preset | Look |
|---|---|
| auto | fixes an under/over-exposed face, leaves good light alone |
| creator | soft 45° key + warm rim + darker room |
| window / loop / butterfly | soft side daylight / flattering portrait / bright beauty |
| golden / overcast | low warm sun / flat cool soft |
| rembrandt / split / noir | moody 4:1 / half in shadow / film noir |
| neon | teal background + magenta rim |

Virtual light reshapes the light you already have. It can't rescue a dark, noisy clip; light it when you shoot.

## 7. Editing rules that make Reels work (from the research)

1. **Hook in the first 1–2 s**, spoken plus on screen. Give context plus a curiosity gap, or challenge a belief.
2. **Hook → tension → payoff.** Promise the payoff early, build with "but / however", always deliver it.
3. **No dead air.** Change something every 2–4 s (a shot size, a move, B-roll, text). Never cut just to cut.
4. **Captions ≤ 3–4 words**, inside the safe zone (not the top 250 px, bottom 350 px or right 150 px).
5. **Sound design:** whoosh on movement, pop when text lands, **riser → impact** for reveals, a music change per section, a pause in the music for the key line.
6. **Grade with purpose:** correct first, then one look per Reel, then film texture. Protect skin.
7. **Match the pace to the promise:** calm topics → European glide styles; energetic lists → Hollywood or Ritchie snaps.
8. **End on a loop or a call to action** ("send this to your study partner") because sends drive reach.

## 8. Before posting (Instagram checklist)

- [ ] 1080×1920, under 90 s (sweet spot 15–60 s), −14 LUFS, captions inside the safe zone
- [ ] First frame works with the sound off. Cover title sits in the centre square
- [ ] Music: original or Meta Sound Collection (business account) or licensed. Never ripped songs
- [ ] Caption first line = second hook. Topic keywords in the caption. 3–5 hashtags
- [ ] Settings → Media quality → "Upload at highest quality"
- [ ] Optional: post as a **Trial Reel** to compare two hooks. Collab with a partner account
- [ ] After 48 h check skip rate (first 3 s), average watch time, sends and saves

## 9. Other tools (and when to use them instead)

| Need | Use |
|---|---|
| Trending in-app audio, quick final touches | **Edits** (Instagram) or CapCut |
| Speed ramps, keyframed masks, motion graphics | CapCut / After Effects |
| Deep colour work on long footage | DaVinci Resolve (free) + `reels/luts/*.cube` |
| Edit by editing the transcript | Descript (connected in Claude) |
| Long video → many clips | OpusClip (connected; Pro plan) |
| AI voiceover, Hindi/Kannada dub, music, SFX | ElevenLabs (connected) |
| Titles, thumbnails, trends | vidIQ (connected; credits) |

## 9b. Research index (in GUIDE.md)

- §7 European styles · §8 deep-dive on 8 tutorials · §9 lighting · **§10 top 50 YouTube editing/lighting/sound videos**
  (24 searches, ranked by views, 35 transcripts read) · **§11 top 50 GitHub editing repos** (stars, licence, how each relates)

## 10. Troubleshooting

| Problem | Fix |
|---|---|
| Wrong caption word | Edit `OUT_work/words.json`, run the same command again |
| Names misspelt (KCET, NEET) | `--prompt "KCET, NEET, Science Monk"` |
| Kannada/Hindi letters broken | Use `--lang kn` / `--lang hi`; the Noto font is chosen automatically |
| Words clipped by cuts | `--margin 0.35s` or `--no-cut` |
| Close-ups blurry | Shoot 4K; use `--shots minimal` |
| Background edges flicker | Plain wall, more light, distance from the wall; or `--bg blur` |
| Grade too strong on phone footage | `--strength 0.7` |
| Background changer fails: libEGL | `apt-get install -y libegl1 libgles2` (setup.sh does this) |
| YouTube research blocked (429 / bot check) | Wait, or pass cookies to yt-dlp |
| Halo round hair after `--light` | `--light-strength 0.6`, or a softer preset (window/loop) |
| Face looks too bright/dark after relight | `--light auto` only fixes exposure; check the raw clip wasn't clipped |
