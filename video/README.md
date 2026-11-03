# Science Monk promo video

`science-monk-promo.mp4` is a 43-second, 1280x720 silent promo of the student app:
intro card, login, home, College Predictor (rank 5000, GM, CS), counselling,
career guidance, learning hub, outro card.

To make it again after the app changes:

1. `npm run dev` (from the repo root; the app must be on http://127.0.0.1:3000)
2. `node video/record.js` records each scene into `video/clips/`
3. `python3 video/build.py video/science-monk-promo.mp4` trims the clips and joins them with crossfades

Needs Playwright (Chromium) and ffmpeg. Captions and scene timing are in `record.js`.
