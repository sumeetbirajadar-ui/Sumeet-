# Sumeet's Tracker 2.0

A personal, fully offline growth app: daily habits (with identity statements, habit
stacking, keystone habits, "never miss twice"), budget & 50/20/30 expense tracking with
a ₹ crore corpus/SIP calculator, a 5-exam-track physics syllabus tracker (NEET, KCET,
JEE Main, JEE Advanced, Cengage) with a per-chapter **Chapter Planning** teaching-prep
notebook (content plan, extras/analogies/demos, scientist stories, misc notes),
investments & insurance with due-date reminders, weekly/monthly targets with a
GTD-style review, gratitude & evening reflection, a bucket list, a YouTube channel
planner, and a grooming tracker — all wrapped as an Android app via Capacitor.

Design system: ivory/cream background, gold accents, navy primary, Lora serif
headings — see the full design blueprint this app implements for more context.

## Run locally (browser preview)

```bash
npm install
npm run dev
```

Data is stored in IndexedDB in this preview. On Android, the same code
automatically uses real on-disk SQLite instead — see `src/db/index.ts`.

## Build & type-check

```bash
npm run build      # production build to dist/
npm run lint       # tsc --noEmit
```

## Turn this into an Android app

See **[ANDROID_BUILD.md](./ANDROID_BUILD.md)** for the full step-by-step guide
(Capacitor setup, required manifest permissions for reminders, signing a release
build).
