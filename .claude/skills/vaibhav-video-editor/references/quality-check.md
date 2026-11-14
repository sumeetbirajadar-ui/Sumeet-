# Quality check

Run this on every render before you show it, and again on the final. Look at the images yourself; don't just generate them.

## 1. File facts
```bash
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate:format=duration,size -of compact final.mp4
```
Right size and shape, fps as planned, duration as expected, audio present.

## 2. Contact sheet
```bash
ffmpeg -y -i final.mp4 -vf "fps=0.5,scale=270:-1,tile=6x4" -frames:v 1 work/NAME-sheet.png
```
Check the whole flow: a beat every few seconds, no long dead stretches, no two big things at once.

## 3. A still at every beat
One frame from the middle of each planned beat, plus the first and last frame:
```bash
ffmpeg -y -ss <t> -i final.mp4 -frames:v 1 work/check/NAME-<t>.png
```
(The Video Editor plugin's `frames.py --every 2` does a batch; the effects engine's `fx.py --still` checks effects before the full render.)

For HyperFrames builds, take these from the composition before the full render: `npx hyperframes check --json` (fix errors, contrast and type-size warnings), then `npx hyperframes snapshot --at t1,t2,... --no-end --output work/stills`. Stills are seconds; a full render is minutes.

Check stills across the whole length of a graphic, not only where it starts: a person walking toward the camera can move their face up into a widget that was clear when it appeared.

For each still:
- [ ] Nothing over the face (eyes to chin)
- [ ] Every word inside the safe zone, nothing cut off at the edges
- [ ] Spelling: names, brands, numbers exactly right
- [ ] The right visual at the right moment, and it matches what is being said
- [ ] Captions off where a card or effect has its own text
- [ ] Text readable against the background
- [ ] No private names, emails, numbers or faces
- [ ] First frame works as a cover; last frame ends on the CTA or end card

## 4. Timing
- Spot-check 3 or 4 caption words against the transcript.
- Cards and sounds land on their word (within about 2 frames).
- No cut shorter than about 0.3 s unless intended, no cut mid-word, no click at a join.

## 5. Sound
```bash
ffmpeg -i final.mp4 -af ebur128=peak=true -f null - 2>&1 | tail -12
```
- [ ] Integrated about -14 LUFS (±1), true peak under -1 dBTP
- [ ] Voice always clear; no sound effect louder than speech
- [ ] Music (if any) ducks under speech and doesn't start on a slow intro

## 6. Fix and report
Fix what you found, re-render (reuse cached passes where the engine allows, for example awa's `SKIP_FX=1`), check again, then tell the user in one line what you fixed.
