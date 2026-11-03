# MorningBoard Android

- **Application ID:** `com.magd.morningboard`
- **App label:** `MorningBoard`
- **Minimum Android:** Android 6.0 (API 23)
- **Target SDK:** API 35
- **Online website:** `https://majd7772233-a11y.github.io/MorningBoard/`

## Online and offline behavior

1. **Online:** the app opens the latest published website. Firebase, authentication, live rooms, cloud sync, and other network-backed services remain available while their providers are reachable.
2. **Offline:** when no network is connected, or the initial page load fails, Android automatically opens the full website snapshot bundled in the APK. The board interface and local tools can then be used without an internet connection.

The bundled files are served through `WebViewAssetLoader` at the same HTTPS host and `/MorningBoard/` path as GitHub Pages. This preserves the web origin for local browser storage and existing site-origin configuration, without enabling unsafe `file://` access.

**Offline limitations:** Firebase authentication and synchronization, shared classrooms/rooms, online presence, remote media, and external APIs still require internet. They are not simulated with local dummy responses. Optional third-party fonts or content may also be unavailable offline.

The APK's offline snapshot is refreshed by GitHub Actions on every push to `main`. The live website can update independently, but an installed APK uses its bundled version whenever it falls back to offline mode.

## Android capabilities

- JavaScript and DOM storage are enabled.
- Camera and microphone are requested only when a trusted MorningBoard page asks for them.
- File inputs use Android's system document picker.
- Downloads are saved to **Downloads**.
- External phone and email links are handed to Android apps.
- No location, contacts, SMS, call-log, or all-files permissions are requested.

## Build

Requires JDK 17+, Android SDK Platform 35, Build Tools 35.0.0, and Gradle 8.9. From the repository root:

```bash
bash android/prepare-offline-assets.sh
gradle --no-daemon assembleDebug -p android
```

The APK is generated at `android/app/build/outputs/apk/debug/app-debug.apk`. GitHub Actions prepares the offline website snapshot, builds the APK, and uploads the `MorningBoard-Android-debug` artifact.
