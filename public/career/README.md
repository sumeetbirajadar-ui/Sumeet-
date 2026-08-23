# SSBPUC Career Compass · Paris Edition

A visually rich, mobile-first career-guidance app for the 132 entrance exams of
2026–27, designed in a Paris-boutique aesthetic — cream parchment, champagne
gold, dusty pastels, custom illustrated icons, editorial serif typography.

## The design language

- **Palette**: warm cream and ivory backgrounds, café-noir text, champagne gold
  accents — no dark backgrounds, no red, no burgundy.
- **11 branch signature colours**, all muted Paris tones: Powder Blue, Sage Green,
  Slate Charcoal, Champagne Gold, Almond Beige, Dusty Navy, Soft Plum, Bronze
  Olive, Dusty Teal, Deep Indigo, Olive Sage.
- **Typography**: Lora serif (italic where it sings) for headlines, Poppins
  geometric sans for body — both shipped with the app.
- **Iconography**: custom hand-drawn SVG illustrations per branch — atom, leaf,
  compass, coin, palette, scales, theatre mask, chef's hat, mountain, globe,
  classical pillar. Refined line-art, gold-tinted on coloured panels.
- **Numbering**: Parisian "N° 01" rather than plain "01", with French group
  labels — *Discovery · Vocation · Builder · Mercantile · Atelier · Avocat ·
  Stage · Maison · Voyage · Étranger · République*.

## How the app flows

```
HOME
 ├─ Hero  ─  "Where will your journey begin?"
 ├─ Daily quote (Aujourd'hui · rotates from 12 quotes)
 ├─ Today's Updates card  ────────┐
 └─ 11 branch cards in a 2-col grid │
     │                             │
     ▼ (tap a branch)              │
                                   │
BRANCH VIEW                        │
 ├─ Large colored hero panel       │
 │   with branch illustration       │
 └─ List of 12 exams                │
     │                             │
     ▼ (tap an exam)               │
                                   │
EXAM DETAIL                        │
 ├─ Colored hero (signature colour)│
 ├─ Speciality italic quote        │
 ├─ Info rows (Institutes / Web /  │
 │   Registration / Pattern)       │
 ├─ Visit Official Website button  │
 ├─ YouTube 3-button grid          │
 │   (Campus Tour · Fest · Vlog)   │
 └─ Latest News button              │
                                   │
UPDATES VIEW  ◄────────────────────┘
 ├─ National hot exams (12 chips)
 ├─ By Career Path (11 chips)
 └─ General Education News (6 chips)
```

## YouTube links — how they work

Every YouTube button opens a **YouTube search sorted by view count**
(`&sp=CAMSAhAB`). So tapping "Campus Tour" on BITSAT opens YouTube showing the
current most-viewed `"BITS Pilani campus tour"` videos. **Always fresh, never
stale** — no manual maintenance required from the college side, ever.

I deliberately did not hardcode specific video URLs because: (1) view counts
change daily, (2) videos get deleted or made private, (3) for 132 exams × ~5
institutes × 3 video types, accuracy can't be verified one-by-one.

## Daily news — how it works

Static HTML cannot call Google News directly (no public API, CORS blocked).
The reliable pattern is **Google News search deeplinks** — each chip opens a
fresh live search in the browser. Tap any exam-name chip in the Updates view
and you see today's actual news for that exam.

When converting to Android, if you want news to render *inside* the app, the
recommended path is a small backend that reads Google News RSS
(`news.google.com/rss/search?q=...`) and serves JSON. That requires server
work — can't be done from static HTML alone.

## File structure

```
career-app-paris/
├── index.html          ← Single-file app (53 KB)
├── data.js             ← All 132 exams (96 KB)
├── college_logo.png    ← Official SSBPUC seal
├── chairperson.jpg     ← Administrator photo
├── principal.jpg       ← Administrator photo
├── Lora.ttf            ← Display serif
├── Lora-Italic.ttf
├── Poppins-Light.ttf   ← UI sans-serif
├── Poppins-Regular.ttf
├── Poppins-Medium.ttf
├── Poppins-Bold.ttf
└── README.md
```

Total size: ~2.2 MB (fonts dominate; everything else is < 200 KB).

## Test it now

1. Unzip anywhere
2. Open `index.html` in any modern browser (Chrome, Edge, Safari, Firefox)
3. For phone testing: copy the folder to your phone, open `index.html` in
   Chrome — it'll look exactly like the final Android app

Bookmarks and visited-state persist in `localStorage` between visits.

## Converting to Android — three paths

### A. Android Studio WebView (fastest, ~30 min)

1. Create a new "Empty Activity" project in Android Studio
2. Copy the entire `career-app-paris/` folder into `app/src/main/assets/`
3. In your main `MainActivity`:

   ```kotlin
   val webView: WebView = findViewById(R.id.webview)
   webView.settings.apply {
       javaScriptEnabled = true
       domStorageEnabled = true        // for bookmark persistence
       loadWithOverviewMode = true
       useWideViewPort = true
   }
   webView.webViewClient = object : WebViewClient() {
       override fun shouldOverrideUrlLoading(
           view: WebView, request: WebResourceRequest
       ): Boolean {
           val url = request.url.toString()
           // Internal hash routes stay in WebView
           if (url.contains("file://") || url.contains("#/")) return false
           // External links (YouTube, Google News, exam websites) open in browser
           startActivity(Intent(Intent.ACTION_VIEW, request.url))
           return true
       }
   }
   webView.loadUrl("file:///android_asset/career-app-paris/index.html")
   ```

4. Add `<uses-permission android:name="android.permission.INTERNET" />` to
   `AndroidManifest.xml`
5. Build → Generate Signed APK → publish on Play Store

### B. Capacitor (more polished, ~1 day)

```bash
npm install -g @capacitor/cli
npx cap init "Career Compass" "in.ssbpuc.compass"
# Place files in www/
npx cap add android
npx cap open android
```

Capacitor gives you push notifications, native splash screen, status-bar
styling, and clean app icons.

### C. Trusted Web Activity (premium, ongoing updates)

Host on a real domain (`careers.ssbpuc.in`), add a web manifest and service
worker, wrap with `@bubblewrap/cli`. Result: Play Store ships a thin shell that
loads from your domain — push updates to the app simply by updating the website.

## What you might want to add next

- **Search bar** across all 132 exams (one input box, instant filter)
- **Compare two exams side-by-side**
- **Push notification** subscriptions per exam (e.g., "JEE Main notification
  released" sent to subscribed users) — needs Firebase Cloud Messaging
- **Kannada language toggle** for parents
- **Offline RSS** caching of news for low-connectivity reading
- **Mock test linker** — direct links to free mock tests per exam

Each of these is a small focused addition once the Android shell is wired up.
Let me know which to prioritise.

---

*Curated by the Department of Physics & Examination Cell · Shri Sharanabasaveshwar PU Science College · Vijayapura · Karnataka*
