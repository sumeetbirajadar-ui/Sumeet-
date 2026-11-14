---
name: mood-lighting-grade
description: Pick a mood (warm, moody, cinematic, horror, romantic, energetic, nostalgic, cyberpunk, clean-corporate, golden-hour, noir, dreamy) and get both the on-set light arrangement for filming (key/fill/back placement, ratio, colour temperature, practicals) and a ready FFmpeg colour grade for footage already shot. Use when the user asks for lighting setup, "make it look moody/cinematic/warm", colour grading, a LUT, a look, or visual improvement based on mood or music.
---

# Mood → lighting + grade

Two halves. Use the first before filming, the second on existing footage. Always ask (or infer) the mood in one word, then use the row below.

## 1. On-set lighting arrangement (talking head, one person)

Key = main light. Fill = softens shadows on the other side. Back/rim = separates hair/shoulders from the background. Ratio = key:fill brightness.

| Mood | Key | Fill | Back / rim | Ratio | Colour temp | Background / practicals |
|---|---|---|---|---|---|---|
| clean-corporate | 30–45° off camera, high, big softbox | opposite side, 1 stop under | soft, white | 2:1 | 5600K all | evenly lit, bright, no clutter |
| warm / cosy | 45°, softbox or bounce | bounce card only | warm rim | 3:1 | key 3200–4000K | warm lamps in frame, fairy lights |
| cinematic | 45–60°, side, slightly behind face line ("short side") | none or negative fill (black flag) | strong rim | 4:1–8:1 | key 4300K, rim 3200K | dark bg, 1–2 practicals, haze if possible |
| moody / dramatic | 90° side, narrow | none, add black flag | thin cool rim | 8:1+ | key 4000K, rim 6500K blue | background 2–3 stops under, single lamp |
| noir | hard light, 60°, high, through blinds/gobo | none | hard rim | 16:1 | 5600K, desaturate in post | slatted shadows on wall |
| horror / tense | from below or directly overhead | none | green/cyan edge | 8:1+ | mixed, cool | darkness, flicker practical |
| romantic / dreamy | big soft key close, frontal-ish | white bounce from below | warm backlight with flare | 1.5:1 | 3200–3800K | bokeh lights, diffusion filter |
| energetic / youth | frontal ring or large soft | even | coloured RGB on bg | 1.5:1 | 5600K face, RGB bg (magenta/cyan) | colourful wall wash |
| golden-hour | window / sun low, 45° behind | reflector gold | sun as rim | 3:1 | 3000K | outdoors last hour of sun |
| cyberpunk / neon | magenta from one side | cyan from other | neon practicals | 2:1 | RGB magenta + cyan | neon signs, haze |
| nostalgic | soft 45° | soft | warm | 2:1 | 3500K | vintage props, tungsten lamps |
| documentary / natural | window light 45° | room bounce | none | 2:1 | match window | real location |

Rules: keep the key on the side the person faces (short-side lighting) for drama; eyes must have a catchlight; the background should be at least 1 stop darker than the face except clean-corporate/energetic; never mix daylight and tungsten on the face unless the mood asks for it.

## 2. FFmpeg grade for existing footage

Check FFmpeg: `ffmpeg -version`. Apply: `ffmpeg -i in.mp4 -vf "<FILTER>" -c:a copy out.mp4`. Preview a still first: `ffmpeg -ss 3 -i in.mp4 -vf "<FILTER>" -frames:v 1 preview.png`.

| Mood | FILTER |
|---|---|
| clean-corporate | `eq=contrast=1.05:brightness=0.02:saturation=1.05,colorbalance=rm=-0.02:bm=0.02` |
| warm / cosy | `colortemperature=temperature=4200,eq=contrast=1.05:saturation=1.1` |
| cinematic (teal-orange) | `colorbalance=rs=-0.1:bs=0.12:rh=0.1:bh=-0.08,eq=contrast=1.12:saturation=0.95,curves=preset=medium_contrast` |
| moody | `eq=contrast=1.2:brightness=-0.05:saturation=0.75,colorbalance=bs=0.08:bm=0.04,vignette=PI/4` |
| noir | `hue=s=0,eq=contrast=1.35:brightness=-0.03,curves=preset=strong_contrast,vignette=PI/3.5` |
| horror | `eq=contrast=1.25:saturation=0.55:brightness=-0.06,colorbalance=gs=0.06:bs=0.08,vignette=PI/3.5,noise=alls=8:allf=t` |
| romantic / dreamy | `gblur=sigma=1.2,eq=brightness=0.04:saturation=1.05,colortemperature=temperature=4800,curves=preset=lighter` (blend with original for glow: see below) |
| energetic | `eq=contrast=1.15:saturation=1.35,unsharp=5:5:0.8` |
| golden-hour | `colortemperature=temperature=3600,colorbalance=rh=0.08:gh=0.03,eq=saturation=1.15:contrast=1.06` |
| cyberpunk | `colorbalance=rs=0.15:bs=0.2:gm=-0.12,eq=contrast=1.2:saturation=1.3` |
| nostalgic / film | `curves=preset=vintage,eq=saturation=0.85,noise=alls=10:allf=t,vignette=PI/4` |
| documentary | `eq=contrast=1.04:saturation=0.95` |

Dreamy glow (soft bloom over sharp image):
`ffmpeg -i in.mp4 -filter_complex "[0:v]split[a][b];[b]gblur=sigma=12[g];[a][g]blend=all_mode=screen:all_opacity=0.35" -c:a copy out.mp4`

Fix-first visual improvement before any look (apply in this order, then the mood filter):
1. Exposure: `eq=brightness=0.03` (dark) or `-0.03` (bright).
2. White balance: `colortemperature=temperature=5600` (neutral) — lower number = warmer.
3. Denoise low light: `hqdn3d=3:2:4:3`.
4. Sharpen: `unsharp=5:5:0.6`.
5. Stabilise (two passes): `vidstabdetect` then `vidstabtransform=smoothing=20` if the build has libvidstab.

Exporting a reusable LUT: a `.cube` can be made with the `gradekit` or `premiere-grade-bot` skill, or by grading a HALD image: `ffmpeg -f lavfi -i haldclutsrc=8 -frames:v 1 hald.png`, run the same FILTER on `hald.png`, then apply with `haldclut`.

Mood from music: fast tempo/major key → energetic or golden-hour; slow/minor → moody or cinematic; ambient/pads → dreamy; synth-heavy → cyberpunk.
