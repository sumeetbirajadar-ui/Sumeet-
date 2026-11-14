---
name: product-shot-prompts
description: Ready image-generation prompt presets for viral product shots - /microscope, /explodedview, /floatingexplosion, /scrollstopper, /stickynotes, /tinyworkers, plus /levitate, /miniature-world, /splash, /x-ray, /cutaway, /unboxing-hero. Use when the user gives a product photo or name and wants a scroll-stopping ad image, a product B-roll still, or a still to animate with image-to-video. Works with any image model (Higgsfield, Nano Banana, GPT Image, Flux, ComfyUI, Adobe Firefly).
---

# Product-shot prompt presets

Replace `{PRODUCT}` with a precise description (brand, colour, material, shape). Always attach the real product photo as a reference image so the label/logo stays exact, and add: "keep the product's label, logo and proportions identical to the reference". Default aspect 4:5 for feed, 9:16 for Reels/Shorts.

| Preset | Prompt |
|---|---|
| /microscope | Extreme macro photograph of {PRODUCT} seen through a scientific microscope, surface texture magnified to reveal fibres, grains and micro-details, shallow depth of field, circular lens vignette, clinical lab lighting, ultra-sharp, 8K. |
| /explodedview | Technical exploded-view render of {PRODUCT}: every internal component separated and floating in precise alignment along one axis, thin leader lines with minimal labels, clean white studio background, soft shadows, product-design keynote style. |
| /floatingexplosion | {PRODUCT} frozen mid-air at the centre of a dynamic explosion of its own ingredients/parts, droplets and fragments radiating outward, high-speed flash photography, crisp splashes, solid colour background matching the brand colour. |
| /scrollstopper | Bold advertising hero shot of {PRODUCT}, oversized and tilted 15°, dramatic rim light, saturated brand-colour background with a subtle gradient, motion streaks and a few floating pieces of the product, hyper-real, punchy contrast, made to stop a thumb mid-scroll. |
| /stickynotes | {PRODUCT} standing on a white background, covered with colourful hand-written sticky notes listing its key features and benefits in short marker phrases, playful, top-down soft light, realistic paper texture. |
| /tinyworkers | Miniature construction workers, cranes and scaffolding building or repairing a giant {PRODUCT}, tilt-shift miniature photography, tiny ladders, hard hats and cables, warm daylight, whimsical, highly detailed. |
| /levitate | {PRODUCT} levitating above a matching pedestal, soft volumetric light from above, gentle reflection, minimal premium backdrop. |
| /miniature-world | A tiny diorama world built on top of {PRODUCT} - landscape, people and vehicles at 1:87 scale, tilt-shift focus. |
| /splash | {PRODUCT} plunging into liquid, crown splash frozen at 1/8000s, droplets catching backlight, dark seamless background. |
| /x-ray | Stylised x-ray / transparent glass version of {PRODUCT} showing internal structure glowing cyan on black. |
| /cutaway | Clean half-cutaway of {PRODUCT} revealing its inside layers, like a museum cross-section model, studio lighting. |
| /unboxing-hero | Box opening with light spilling out, {PRODUCT} rising from it, glowing particles, cinematic. |

## Turning a still into video (image-to-video)
Feed the still to an image-to-video model with a short motion prompt (one camera move + one subject action), e.g. "slow push-in, parts drift apart then snap back together, 5s". Tools available: Higgsfield connector (`generate_video`), ComfyUI (`generate-video` skill), Seedance (`seedance-2-5-skill`), LTX-2 (`ltx2` skill), `ultimate-ai-media-generator-skill`.

## Finding more prompts
`ai-image-prompts-skill` holds 10,000+ curated prompts (product, e-commerce, posters, storyboards).
