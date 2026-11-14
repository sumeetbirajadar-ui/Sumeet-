# Style preset: Nick Saraev

The editing look of Nick Saraev's AI-tool reels ([@nick_saraev](https://www.instagram.com/nick_saraev/)), worked out from six of his reels (Nov 2025 to Nov 2026, 26 to 49 s each, up to 1M views). Use it when the user says "Nick style", "Nick Saraev style", "edit like Nick Saraev", or picks this preset.

This recreates an editing style with the user's own footage. Never copy his footage, screenshots, logo or captions, and never present the video as his.

Pixel numbers are for 1080x1920. Build it with engine C (HyperFrames); the face-tracked effects engine isn't part of this look.

## The formula in one line

A fast talking-head list video: three layouts that swap every 2 to 5 seconds, real screenshots of every tool in glowing browser cards, one hard number per item, 1 to 3 word captions with a blue keyword, no pauses, a comment-keyword CTA.

## Script shape (offer it when the user is still writing)

1. **Hook (0 to 3 s):** "These are the top 5 [things] you need to [do] right now" or "[Tool] can now [surprising thing]". On screen from frame 1.
2. **Items:** "The first is [Name], which [what it does], so you can [result]." Each item gets its name, one concrete number (7.4B tokens, 635 models, 50% less usage, 252 sounds) and a screenshot.
3. **CTA:** "If you want to try all of these, just comment [KEYWORD] and I'll send them to you."
4. **Post caption** starts with `Comment "KEYWORD" to get [the thing].`

## Pace and cuts

- Talking speed about 220 words a minute: cut every pause and breath (`silences.py --min-silence 0.12 --pad-before 0.03 --pad-after 0.05`, keep no gap over 0.15 s). Retakes: last clean take only.
- Hard cuts only. A layout change or a new card every 2.3 to 5 s (median about 3.5 s). Never hold one picture longer than about 5 s.
- Rotate the three layouts below. A typical item: split card (the name and what it does), full-screen card or stat (the number), back to split or full face.

## Layout A: split card (the default, about 60% of the video)

- **Background (top 1300 px):** pale blue-white `#EEF3F8` with a soft, very blurred texture of leaf shadows at about 8% (make one image: dark leaf shapes, Gaussian blur 40 px, low opacity). When the card shows a dark screen, use a blurred, darkened copy of that screen as the background instead.
- **Header (two lines, top about y 300 to 500):** line 1 in Inter 800, about 64 px, `#111111`, title case ("5 Plugins Your" / "Plugin Number"). Line 2 is the payoff in a bold italic serif (Instrument Serif Italic or Playfair Display Italic, about 84 px), white on a solid blue box `#1F6FEB` (radius 6 px, slight shadow): "Claude Code Needs", "One", "Two". The header stays up for the whole item; only the number word changes.
- **Screen card (about y 520 to 980):** a real screenshot or recording in a macOS browser window (traffic-light dots, URL bar), about 900 px wide, radius 18 px, with a thin glowing blue border (`2px #3B82F6` plus a `0 0 24px rgba(59,130,246,.55)` glow). Swap the card on each new sentence. A slow push of 1.00 to 1.05 across the card's life.
- **Highlight:** the key phrase inside the screenshot gets a blue text-selection highlight (`#3B82F6` at 35%) that wipes in left to right on the spoken word.
- **Caption (about y 1050):** between the card and the face (see captions).
- **Face card (y 1300 to 1920, x 54 to 1026):** the speaker in a rounded card (top corners radius 44 px), flush with the bottom, head and mic filling it. A thin blue glow on the border is optional.

## Layout B: full face (about 25%)

- The speaker full frame, punched in to a tight close-up (about 1.2 to 1.3x on the face). No graphics except the caption.
- Use it for the hook, opinions ("insanely good"), reactions and the CTA.
- Caption in white Inter 800, about 72 px, soft shadow, on the chest at about y 1350.

## Layout C: full-screen card or stat (about 15%)

- The screen card alone, centred (about y 260 to 1280), on a blurred and darkened copy of itself. Caption in white below it at about y 1420.
- **Stat callout:** for each item's number, a huge white number (Inter 800, about 150 px) with a small label under it (Inter 700, about 44 px, "free tokens a month"), on a dark frosted backing over the dimmed card. It pops in on the spoken number.

## Captions

- 1 to 3 words at a time, timed word by word, no pill, no background.
- Inter 800, about 66 px: `#111111` over the light background, white with a soft shadow over dark or footage.
- One keyword per phrase in blue `#2D7FF9`, either in the same sans or in the blue italic serif ("*Claude Code*", "*antivirus*", "*Earshot*"). Numbers in blue too ("over **7**", "**50%**").
- No caption during a stat callout's first half second.

## CTA (last 3 to 4 s)

- Full face (layout B). "comment" in white italic serif, then the keyword in quotes in a larger white italic serif with a blue outer glow (`0 0 24px #3B82F6`).
- A small pulsing blue ring (record/tap dot, about 60 px) on the right at about y 1180.

## Sound

- Voice forward, mixed to -14 LUFS (he lands at -14.1 to -14.2), true peak under -1 dBTP.
- A quiet music bed under the voice all the way through (the audio never drops into silence). Use a calm tech or lo-fi bed about 20 dB under the voice, or none if the user's style says no music.
- Light sound design: a soft whoosh on card swaps, a pop on stat callouts, a click on highlights. Nat S2, not S1.

## Classic variant (his 2025 reels)

Use it when the user asks for "old Nick style" or a more graphic, logo-led look:
- 50/50 split: graphic on top (white, black or a brand colour), the speaker's face on the bottom half.
- Full-screen logo cards on solid brand-colour backgrounds (purple, yellow, black), logos blurring in and out.
- Titles in a large bold italic serif ("New AI Coder", "AI UI Designer") at the top, black on white or white on black.
- Captions 1 to 2 words, white Inter 700 on a small grey translucent pill (`rgba(110,110,110,.6)`, radius 8 px) at the seam of the split (about y 1000).
- A logo orbit (logos circling a centre icon on a dashed ring) for "10 tools" moments.

## How to build it here

| Piece | Tool |
|---|---|
| Pause-free cut | Video Editor `silences.py` with the settings above, then `scripts/apply_keep.py` |
| Three layouts, header, cards, captions, stats, CTA | HyperFrames (engine C). Fonts: Inter (bundled) plus `InstrumentSerif-Italic.ttf` or `PlayfairDisplay-Italic.ttf` from the effects engine's `fonts/` folder, copied into `assets/fonts/` with `@font-face` |
| Screenshots of each tool | the user's own screenshots or recordings, the built-in browser, or `npx hyperframes capture <url>`; real screens only |
| Live website use | awa-video-reel recorded b-roll, placed inside the browser card |
| Blurred backgrounds | pre-blur the screenshot image (ffmpeg `gblur=sigma=40`, darken for dark screens); footage blur goes through `npx hyperframes media-treatment` |
| Sound | `scripts/sound_mix.py` with a music bed and light cues |

Closest Brand Nat codes for the style card: L5 + L7 (top band and three-layout rotation), P7 + P1 (real screens with highlights), P3 (stat), V20 (numbered header), C4 (small words, blue keyword), M3 + M5 (fast, jump cuts), S2 + S3, G2.
