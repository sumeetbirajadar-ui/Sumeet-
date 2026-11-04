---
name: reel
description: Edit an Instagram Reel for Science Monk with the reels/ toolkit - silence cuts, face-tracked 9:16, captions (English, Kannada, Hindi), French/Italian/British/Nordic/Hollywood styles, mood colour grades, film emulation, wide/medium/close shots, camera moves, background change, music and SFX, Instagram export and cover. Use when the user asks to edit, make or style a Reel/Short/Instagram video.
---

# /reel: edit a Reel with the Science Monk toolkit

1. **Set up** (the container resets every session): `bash reels/setup.sh`.
2. **Read `reels/MASTER.md`.** It is the full command reference, style chooser and checklists.
   `reels/GUIDE.md` holds the research (music licensing, grading, camera, Instagram).
3. **Get the inputs** if they're missing: the raw clip path, the topic, the language (en/hi/kn),
   the mood or style, and a hook line. If the user gives no style, choose one from MASTER.md §2
   and say which you chose and why.
4. **Run** `python3 reels/reel.py auto RAW.mp4 OUT.mp4 --style STYLE --hook "..." --prompt "names,terms"`.
   Add `--music`, `--bg`, `--film`, `--progress` as asked.
5. **Check before delivering:** pull 4–5 frames with ffmpeg and look at them (captions inside the
   safe zone, no overlaps, face framed, grade not clipping skin). Check loudness is about −14 LUFS
   (`ffmpeg -i OUT.mp4 -af ebur128 -f null -`). Read `OUT_work/words.json` for misheard words,
   fix them, and run again.
6. **Deliver** the MP4 and cover with SendUserFile. Say what style, look and moves were used, and
   anything the user should check (misheard words, music licence).

Never put copyrighted songs into a Reel. Point to Instagram's in-app audio or Meta Sound Collection instead.
