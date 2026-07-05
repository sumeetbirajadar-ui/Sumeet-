# Building the Android App in Android Studio

This project is a normal web app (React + Vite) wrapped with **Capacitor** so it can run
as a native offline Android app. Nothing is sent to a server — all data lives on the
device (SQLite on Android, IndexedDB in a browser preview).

## Prerequisites

- Node.js 18+ (`node -v`)
- [Android Studio](https://developer.android.com/studio) (includes the Android SDK)
- A JDK (Android Studio bundles one — no separate install needed)

## One-time setup

The `android/` folder is already generated and committed in this repo — it's a real
Android Studio/Gradle project, ready to open. You only need `cap add android` again if
that folder is ever deleted.

```bash
npm install
```

## Fastest path: just open it

```bash
npx cap open android
```

This opens `android/` directly in Android Studio. Let Gradle sync (first time can take
a few minutes while Android Studio downloads the SDK platform/build-tools if needed),
then hit **Run ▶** on a connected phone or emulator.

## Every time you change the web code (src/, public/, package.json plugins, etc.)

```bash
npm run build      # builds dist/
npx cap sync android   # copies dist/ into android/ and updates native plugins
```

Then either:

```bash
npx cap open android   # opens the project in Android Studio
```
…and hit **Run ▶** to install on a connected phone/emulator, or use
**Build → Generate Signed Bundle / APK** to produce a release APK/AAB to install
manually or upload to the Play Store.

## Required AndroidManifest.xml additions (for reminders)

After `npx cap add android`, open `android/app/src/main/AndroidManifest.xml` and make
sure these permissions are present (add any missing ones just above `<application`):

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
```

- `POST_NOTIFICATIONS` — required on Android 13+ for any local notification (the app
  requests this at runtime automatically; the manifest entry is still required).
- `SCHEDULE_EXACT_ALARM` — the app deliberately schedules reminders as *inexact*
  (`allowWhileIdle`) so this permission is a nice-to-have, not required; you can omit
  it if you want the strictest possible Play Store review profile.
- `RECEIVE_BOOT_COMPLETED` — lets `@capacitor/local-notifications` reschedule
  reminders after a phone reboot.

**Battery optimisation:** on Xiaomi/Realme/Samsung phones especially, go to
Settings → Apps → Sumeet's Tracker → Battery and disable optimisation / allow
background activity, or scheduled reminders can silently stop firing. The app also
re-schedules all reminders every time it's opened, as a safety net.

## App icon / splash screen (optional polish)

Drop a 1024×1024 `icon.png` and 2732×2732 `splash.png` into a `resources/` folder at
the project root, then run:

```bash
npm install -D @capacitor/assets
npx capacitor-assets generate --android
npx cap sync android
```

## Data & storage model

- **In the browser (this dev preview / `npm run dev`):** data is stored in IndexedDB
  in that browser profile.
- **On Android (after `cap add android` + build):** the same code automatically
  switches to **real on-disk SQLite** via `@capacitor-community/sqlite` — see
  `src/db/index.ts` (`getStore()` picks the adapter based on
  `Capacitor.isNativePlatform()`). No code changes needed.
- Either way, use **Settings → Export Backup** regularly — that JSON file is the real
  safety net for years of daily data, independent of which storage engine is active.

## Signing a release build

Android Studio's **Build → Generate Signed Bundle / APK** wizard will prompt you to
create (or reuse) a keystore the first time — keep that `.jks` file and its passwords
somewhere safe; you'll need the *same* keystore for every future update of this app.
