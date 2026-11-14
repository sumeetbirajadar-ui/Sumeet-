# Beat map

Two lookups for the storyboard: which visual fits a moment, and how each Brand Nat style code gets built with the tools you have.

Abbreviations: **fx** = effects engine (`fx.json`), **awa** = awa-video-reel `edit.json` (cards, camera, captions, broll), **VE** = Video Editor plugin `plan.json`, **HF** = HyperFrames composition, **RM** = Remotion. ≈ means a close build rather than an exact match.

## 1. Match the moment to the visual

| When the words... | First choice | Also good |
|---|---|---|
| open with the hook | awa `title` card on the hook line, or fx `backdrop-word` on the key word | HF two-weight title (Nat H10), fx `led-sign`, `glitter-spotlight` |
| name a tool or brand | HF logo tile popping on the word (Nat V1, V12) | fx `backdrop-word`, `pastel-word`, `match-cut` |
| compare two tools | HF crossed-out logo vs logo (Nat H9) | HF comparison stack (V5), fx `tier-list` |
| give a number | awa `stat` card | fx `liquid-glass-graph`, `over-the-shoulder-zoom`, HF count-up (P3), HF ring timer (V13) |
| list steps or items | awa `list` card timed to each item | fx `checklist`, `todo`, `apple-toggles`, HF progress header (V11) |
| say no, wrong, myth, stop | fx `reject-stamp` | HF one chunky word (V3) |
| count down or say "3 things" | fx `countdown-flip` | HF numbered counter (V20) |
| land the key line | awa camera punch-in 1.08 to 1.12 | fx `lean-in`, `slow-push`, `headline-box` |
| hit the payoff | HF big payoff word (V6) | fx `spotlight`, `red-collage` |
| mention DMs, comments, people asking | fx `messages`, `comment-box` | HF iPhone notification (V15), quote card (V8) |
| quote what people say | HF quote card (V8) | fx `headline-wall` |
| go back in time | HF calendar widget (V14) | fx `timeline` |
| show a website or app (with their yes and link) | awa recorded b-roll | their own screen recording; HF recreated UI labelled as a recreation (B1 to B6) |
| say "paste this into Claude Code" | awa Claude Code b-roll, then the result | HF chat question and reply (B1) |
| talk shortcuts, typing, copy and paste | fx `shortcut-rain` | HF search bar typing |
| show proof (article, post, result) | HF article card with highlighter (P1), social post card (P4) | awa b-roll of the real page (P7) |
| introduce someone | awa `lower` card | HF character intro (B9) |
| say follow or subscribe | fx `tap` | RM follow card (awa `cards.json` end) |
| say comment X or DM me X | awa `cta` card with X highlighted | fx `comment-box`, HF gradient comment CTA (V17), live profile CTA (V19) |
| show many examples | HF results grid (V23) | fx `phone-fan`, `place-in-grid`, `profile-wall` |
| talk about themselves or their work | fx `orbit`, `carousel-spin` | fx `cover-star`, `glass-widgets` |

## 2. Brand Nat codes → how to build them

### H · Hook
| Code | Build |
|---|---|
| H1 Chunky title behind head | HF title layer behind a `remove-background` cutout. Quick ≈: fx `backdrop-word` with `font=bold` |
| H2 Sticker hook with logos | HF stacked sticker pills with real logos |
| H3 Warm typewriter caps | HF typewriter title, cream caps, espresso outline |
| H4 Scrapbook stack | HF italic serif line over a bold rounded word |
| H5 Title box, 3 seconds | awa `title` card (0.2 to 3.0 s), or VE `titles` with `box` |
| H6 Hook filmed in the result | Filming advice, not an edit. Mention it for next time |
| H7 Logo-pop question | HF question text top, logos pop on the first brand word |
| H8 Handwritten label + bold lowercase | HF on a flat yellow canvas (engine C) |
| H9 Crossed-out logo vs logo | HF two icons, red X draws over the old one |
| H10 Two-weight title | HF heavy caps over thin serif caps, lifts away at about 3 s |

### C · Captions
| Code | Build |
|---|---|
| C1 Phrases + yellow keyword | awa captions with `highlight` words, yellow accent |
| C2 One bold word | VE captions `words_per_caption: 1`, `uppercase: true` |
| C3 No captions | awa `captions.on: false` / VE `enabled: false` |
| C4 Small + BIG keyword | HF captions (`captions-overlay`) |
| C5 Phrases + white pill | awa captions with `theme.accent: "#FFFFFF"` ≈, or HF |
| C6 White line + yellow punch line | HF captions with blur in and out |
| C7 Tracked caps + big serif | HF captions with mask rise |
| C8 Small caps under the chin | VE captions small, `position` just under the chin, or HF |
| C9 Staircase captions | HF captions placed in the empty side of the frame |

### L · Layout
| Code | Build |
|---|---|
| L1 Depth cutout | HF with `remove-background`, blurred room behind floating cards |
| L2 Split screen | awa b-roll split, fx `broll-split`, or VE `broll` |
| L3 Scrapbook canvas | engine C (HF) |
| L4 Full frame + floating | default for all engines: graphics in the clear space above |
| L5 Top-band story | cards `pos: top`, speaker in the lower two thirds |
| L6 Headroom whiteboard | cards `pos: top`, nothing on the body |
| L7 Three-layout rotation | engine C, or awa b-roll + `title` + full-screen VE `broll` rotating per idea |
| L8 Polaroid narrator | engine C |
| L9 Before / After side by side | engine C |

### P · Proof
| Code | Build |
|---|---|
| P1 Article card + highlighter | HF with a real screenshot, zoom to the quote, highlighter sweep, source pill |
| P2 Official demo footage | VE or awa b-roll from their file, labelled |
| P3 Giant count-up number | HF count-up behind a cutout ≈ awa `stat` card, fx `liquid-glass-graph` |
| P4 Social post card | HF card with a real post screenshot |
| P6 Personal archive | VE `broll` / awa b-roll `file` with their old clips |
| P7 Cursor proof | awa recorded b-roll (visible cursor), or HF `oversized-cursor` on a real recording |
| P8 Finger on the screen | Filming advice: their own clip as b-roll |

### V · Visual beats
| Code | Build |
|---|---|
| V1 Logo tiles with roles, V2 Logos linked by arrows, V4 Logo shuffle, V12 Logo bloom pop | HF with real logos (Simple Icons paths, brand colours) |
| V3 One chunky word | awa `title` card ≈, fx `backdrop-word`, or HF |
| V5 Comparison stack | HF chips stacking in |
| V6 Big payoff word | HF, or fx `backdrop-word` ≈ |
| V7 Kinetic text card | HF full-screen sentence building word by word |
| V8 Quote card | HF typed quote in the top band |
| V9 Real-life montage | VE `broll` with their clips |
| V10 Flat sponsor UI | HF flat cards |
| V11 Progress header, V20 Numbered effect counter | HF header that stays up |
| V13 iOS ring timer, V14 Calendar widget | HF |
| V15 iPhone notification | fx `messages` ≈, or HF banner |
| V16 Control Center tiles | fx `apple-toggles` ≈, or HF |
| V17 Gradient comment CTA | HF ≈ awa `cta` card |
| V18 Trip polaroids | HF with their photos, shutter sound |
| V19 Live profile CTA | fx `comment-box`, then fx `tap` ≈, or HF |
| V21 Handwritten arrow notes | HF, or fx `pause-point` ≈ |
| V22 Pinned comment banner | HF or VE `titles` for the whole video |
| V23 Results grid | HF |

### B · Animated b-roll (recreated UI, always labelled as a recreation)
B1 to B11: HF recreations of chats, calendars, docks, notifications, lockups, diagrams. When a real version exists, prefer it: awa Claude Code b-roll for B1, awa recorded b-roll for real websites, official footage for B11.

### X · Signature effects (one per idea, never stacked)
| Code | Build |
|---|---|
| X1 Orbit | fx `orbit` (with `images` from their reels) |
| X2 Couch wall | fx `profile-wall` or `noise` ≈ |
| X3 UI world | HF background swap behind a cutout |
| X4 Frame break | fx `reel-frame` ≈, or HF with a cutout over the frame edge |
| X5 Digital zoom | fx `lean-in`, or awa camera punch-in with a hard snap |
| X6 Phone mockup slide-in | HF |
| X7 Checklist ticks | fx `todo` or `checklist` |
| X8 Headline wall | fx `headline-wall` |
| X9 Zoom-through cut | HF `seam-craft` zoom-through |
| X10 Chart grow | fx `liquid-glass-graph` (`look=bento`) or `over-the-shoulder-zoom` ≈, or HF |
| X11 Pull-back reveal | engine C |
| X12 Green screen double | HF with the same take as a second layer |
| X13 Paper cut | HF ≈ |
| X14 Doodle boil | fx `scribble` ≈ |
| X15 Vertigo | HF dolly zoom (cutout stays, background scales) ≈ fx `slow-push` |
| X16 Cover story | fx `cover-star` with `look=editorial` |
| X17 Glass type | HF frosted word behind a cutout ≈ fx `backdrop-word` |
| X18 Icon flashcards, X19 Monitor in a dark room | engine C |

### M · Motion and pace
| Code | Build |
|---|---|
| M1 Punch-in cuts | awa `camera` punch-ins at sentence starts, or VE `zooms` |
| M2 Zoom-blur transitions | awa `style: cinematic` (b-roll lands out of a zoom-blur), or HF |
| M3 Fast visuals | pacing: a new visual every 2 to 3 s, never the same device twice in a row |
| M4 Calm and still | pacing: few cuts, `"move": "push"` camera moves, fewer stronger graphics |
| M5 Two-framing jump cuts | VE `zooms` alternating 1.0 and about 1.25 on every sentence, hard (`ease: 0`) |
| M6 Face-centred zoom | awa `camera` (scales round the face): 1.15 to 1.2 on short lines, push on long lines |
| M7 Colour circle wipe | HF |

### S · Sound
| Code | Build |
|---|---|
| S1 SFX on every visual | awa `sound.auto: true, level: 1.0`, or a cue per beat in `sound_mix.py` |
| S2 Light SFX | awa `level` about 0.6 plus manual cues on big moments only |
| S3 Music bed | awa `music.mood`, or `sound_mix.py --music` |

### G · Colour and finish
| Code | Build |
|---|---|
| G1 Warm cinematic | awa `style: cinematic`, or fx `moody` with `grade=warm` |
| G2 Clean light | awa `style: clean`, white panels, one accent |
| G3 Soft blue pastel, G7 Flat yellow canvas | engine C |
| G4 Apple clean | HF white iOS cards and frosted glass; no glow, stamps or neon |
| G5 Cool girl warm | fx `moody` `grade=warm` + `glitter-spotlight` ≈, pairs with X1 |
| G6 Cool dude editorial | fx `spotlight` / `moody` `grade=cool` ≈, alternate wide and tight (M5) |
