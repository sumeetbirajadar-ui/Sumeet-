# Style preset: kinetic promo

A clean, fast faceless reel driven by an AI voice: every spoken word is big kinetic type, and a small motion graphic acts out what each line says. Made for voiceover mode. A worked example with its script and build is in `examples/kinetic-promo/`. Triggers: "kinetic promo", "kinetic style", "like the I didn't edit this video reel", or any voiceover video where the user wants it clean, quick and professional.

Pixel numbers are for 1080x1920. Engine C (HyperFrames), 60 fps.

## Pace (about 1.2x, always readable)

- Voice with `scripts/voice_lines.py --pace brisk` (speed 1.1, 0.28 s breaths between sentences, 0.20 s between list items). Ignore timestamps written in a script.
- Every on-screen line holds at least 0.5 s + 0.3 s a word (HyperFrames' reading rule), so `npx hyperframes check` reports no `line_unread`. Give card scenes a little more with `--min-hold`.
- `--pace fast` packs it tighter (about 20% shorter) but some lines become hard to read. `--pace normal` breathes more.

## Look

- Background: soft off-white `#F4F4F1` with a white glow in the middle and a faint dot grid (`#D6D6CF` dots every 60 px) drifting slowly upward for the whole video, so the frame is never still.
- Type: Inter 800, 104 to 130 px, letter-spacing -3 px, near-black `#111111`, centred. One key word per line on a yellow `#FFD84D` label that wipes in left to right.
- Cards: white, radius 30, soft shadow; app windows with three grey dots and a title. Dark terminal `#15161A` with a yellow prompt and a green status line. Recreated UI carries a small "illustration" tag.
- Colours: ink `#111111`, yellow `#FFD84D`, green `#22C55E` for done, red `#EF4444` for playheads and strike-throughs. No emoji, glitch, neon or flares.
- Text and graphics stay inside x 60 to 930 and y 220 to 1540.

## Motion

- **Hook:** the first words already on screen at frame 0 (it's the thumbnail); each next word "slams" in on its spoken word (scale 1.45 to 1, blur 8 px to 0, 0.26 s, power4.out). A related motion graphic moves under it from the start (for an editing claim: a scrolling edit timeline with a playhead).
- **Transitions:** a zoom-through on every section change: the old scene scales to 1.3 with a 14 px blur in 0.2 s, the new one arrives from 0.7 with blur in 0.3 s, plus a `whoosh-short`. Inside a list, hard cuts with a small blur punch (1.1 to 1, 0.22 s). One zoom-out reveal for the payoff (the last card scales from 2.2 to 1 to reveal the bigger picture).
- **Camera:** punch-ins of 1.06x easing back over 0.4 s on the key word of each section.
- **Lists:** each item is its own voice line and its own beat, with a small "01 / 06" counter and progress dashes at the top, and a motion graphic that does what the item says (letters fly in for "text animation", shapes for "motion graphics", a waveform for "sound effects", a playhead slicing clips for "cuts", a caption pill writing itself for "captions").
- **Collapse beat:** for "everything" or "all of it", the list items fly back in as chips and collapse into one big labelled word with a bass hit.
- **CTA:** a frosted white card, "Comment" then the keyword in quotes typed letter by letter, a gentle pulse, held 2.5 s after the voice ends.

## Captions

None as a separate layer: every spoken word is already on screen as the big type. (Add burned-in captions only if the user asks.)

## Sound

`scripts/sound_mix.py` with a cue per motion: `whoosh-short` on transitions, `pop` on word slams and labels, `click` on cuts and Enter, `typing` under typing, `chime` on done, `impact-bass-2` on the hook and the collapse beat, `whoosh-cinematic` on the zoom-out. No music unless asked; if asked, a quiet bed ducked under the voice. -14 LUFS.
