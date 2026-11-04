---
name: reel
description: Edit an Instagram Reel for Science Monk with the reels/ toolkit - silence cuts, face-tracked 9:16, captions (English, Kannada, Hindi), country editing styles (French, Italian, German, British, Spanish, European, American creators), mood colour grades, film emulation, virtual lighting (key/fill/rim/gels), wide/medium/close shots, camera moves, background change, music and SFX, Instagram export and cover. Use when the user asks to edit, make or style a Reel/Short/Instagram video.
---

# /reel: edit a Reel with the Science Monk toolkit

1. **Set up** (the container resets every session): `bash reels/setup.sh`.
2. **Read `reels/MASTER.md`.** It is the full command reference, style chooser and checklists.
   `reels/GUIDE.md` holds the research (music licensing, grading, camera, Instagram).
3. **Get the inputs** if they're missing: the raw clip path, the topic, the language (en/hi/kn),
   the mood or style, and a hook line. If the user gives no style, choose one from MASTER.md §2
   and say which you chose and why. Styles are editing conventions, not colour palettes.
4. **Run** `python3 reels/reel.py auto RAW.mp4 OUT.mp4 --style STYLE --hook "..." --prompt "names,terms"`.
   Add `--music`, `--bg`, `--film`, `--light`, `--progress` as asked. Always edit the user's **raw video**,
   never a still image. If no clip has been given, ask for one.
5. If the footage is badly lit, say so and point to MASTER.md §6b (lighting checklist) for next time.
6. **Check before delivering:** pull 4–5 frames with ffmpeg and look at them (captions inside the
   safe zone, no overlaps, face framed, grade not clipping skin). Check loudness is about −14 LUFS
   (`ffmpeg -i OUT.mp4 -af ebur128 -f null -`). Read `OUT_work/words.json` for misheard words,
   fix them, and run again.
7. **Deliver** the MP4 and cover with SendUserFile. Say what style, look and moves were used, and
   anything the user should check (misheard words, music licence).

Never put copyrighted songs into a Reel. Point to Instagram's in-app audio or Meta Sound Collection instead.
