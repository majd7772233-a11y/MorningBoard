# MorningBoard Android

- **Application ID:** `com.magd.morningboard`
- **App label:** `MorningBoard`
- **Version:** 1.4.0
- **Minimum Android:** Android 6.0 (API 23)
- **Target SDK:** API 35

## APK-first application architecture

The Android app does **not** open GitHub Pages to obtain its interface. Its launch URL points explicitly to `/MorningBoard/index.html` (not the directory URL), and AndroidX `WebViewAssetLoader` reads that file from the APK's `assets/index.html`. The existing GitHub Pages HTTPS origin is preserved for local web storage and Firebase configuration.

The complete website tree is copied into `app/src/main/assets` during the Android build: HTML, CSS, JavaScript, images, audio/video, games, PDF support files, and other static resources. Firebase compat SDK JavaScript and Google Fonts/WOFF2 files are downloaded during CI packaging and stored inside the APK. The APK's private copy of HTML/CSS is adjusted to reference these local vendor files; **the deployed website's source files are not edited by this packaging step**.

The app's own website origin is served strictly from the APK. If an app file is missing from the package, WebView receives a local 404 rather than silently downloading it from GitHub Pages.

## Internet is a feature dependency, not an app-start dependency

The `INTERNET` permission remains enabled. Internet is used only by features that explicitly contact external services, such as Firebase Realtime Database, live collaboration rooms/workers, remote links, and remote content the user opens. Bundling Firebase's JavaScript SDK locally does not make Firebase data local; cloud synchronization, online presence, and shared rooms still require an internet connection.

The local board interface and its static code/resources are installed with the APK, so launching the app and using local tools does not depend on GitHub Pages or a CDN being reachable.

## Build

Requires JDK 17+, Android SDK Platform 35, Build Tools 35.0.0, Gradle 8.9, Bash, curl, and Python 3.

From the repository root:

```bash
bash android/prepare-offline-assets.sh
gradle --no-daemon assembleDebug assembleRelease -p android
```

The Android workflow packages the local website snapshot, builds Debug and signed Release APKs, verifies the Release signature, and uploads:

- `MorningBoard-Android-debug`
- `MorningBoard-Android-release`

Release signing uses the protected GitHub Actions secrets `MY_KEYSTORE_JKS`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, and `KEY_PASSWORD`. The temporary JKS is removed at the end of the workflow.
