# Science Monk — two separate Android apps

This folder has two independent Android Studio projects, generated with
[Capacitor](https://capacitorjs.com/):

- `student/android` → package `com.sciencemonk.prep.student`, app name
  "Science Monk - Student"
- `admin/android` → package `com.sciencemonk.prep.admin`, app name
  "Science Monk - Admin" (badged icon so it's easy to tell apart from the
  student app on a home screen)

Both are thin native shells: each one just opens the *same* deployed web
app in a WebView, locked to a mode via a URL query param
(`?mode=student` / `?mode=admin` — see `capacitor.config.json` in each
folder, key `server.url`). That's what keeps them in sync automatically —
neither app carries its own copy of the app's data or code. Whatever you
publish in the Admin app (announcements, live classes, notes, PYQs, cutoff
overrides) is written to the same Firestore project the Student app reads
from, so it shows up there immediately, same as it already does between two
browser tabs today.

## Before you build either app

The `server.url` in both configs points at `https://sumeet-phi.vercel.app`
— your existing live Vercel deployment (I checked: it's up, and already
serving the latest build with today's Engineering 2025 data and the
watermark). If you ever move to a different URL (say, the Firebase Hosting
domain from `firebase deploy`, or a custom domain), update `server.url` in
`student/capacitor.config.json` and `admin/capacitor.config.json`, then
re-run (from the repo root):

```bash
cd mobile/student && npx --prefix ../.. cap sync android
cd ../admin && npx --prefix ../.. cap sync android
```

## Building a release for the Play Store

You'll need [Android Studio](https://developer.android.com/studio)
installed (it bundles the Android SDK, so nothing else to install). Do
this once per app:

1. Open `mobile/student/android` (or `mobile/admin/android`) in Android
   Studio as its own project — **do not** open the repo root, open that
   `android` subfolder directly.
2. Let it finish Gradle sync (first time takes a few minutes).
3. `Build → Generate Signed Bundle / APK`. Choose **Android App Bundle**
   (`.aab`) — that's what Play Store wants now, not a raw `.apk`.
4. Create a new keystore the first time (or reuse one if you already have
   one) — **save that keystore file and its passwords somewhere safe.**
   If you lose it, you can never update that app again; you'd have to
   publish it as a brand-new listing.
5. **Use a different keystore for each app**, or at least make sure the two
   `applicationId`s stay different — Play Store treats them as two
   completely separate listings either way.
6. Upload the resulting `.aab` to Play Console → your app → Production
   (or Internal testing first, which is worth doing before a public
   release).

## Changing the app icon, name, or package ID later

- Icon/splash: replace `assets/icon.png` (and `splash.png`,
  `splash-dark.png`) in `student/` or `admin/`, then re-run
  `npx --prefix ../.. capacitor-assets generate --android` from inside
  that folder.
- App name: edit `<string name="app_name">` in
  `android/app/src/main/res/values/strings.xml`.
- Package ID: this one's trickier post-creation — easiest done by editing
  `applicationId` in `android/app/build.gradle` **and** renaming the Java
  package folders under `android/app/src/main/java/...` to match, before
  you've ever uploaded to Play Console. Once an app is live under a
  package ID, it can't be changed.
