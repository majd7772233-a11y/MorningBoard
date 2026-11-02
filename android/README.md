# MorningBoard Android wrapper

- **Application ID:** `com.magd.morningboard`
- **App label:** `MorningBoard`
- **Minimum Android:** Android 6.0 (API 23)
- **Target SDK:** API 35
- **Web app:** `https://majd7772233-a11y.github.io/MorningBoard/`

## How it works

This is a native Android WebView shell around the existing hosted MorningBoard website. It deliberately loads the same published web app instead of duplicating the repository's large collection of website assets inside the APK. An internet connection is therefore required to load the app and use its online services.

## Android capabilities

- JavaScript, DOM storage, Firebase cookies, and multiple-window popups are enabled for the hosted app.
- Camera and microphone requests from the MorningBoard GitHub Pages origin and its configured room worker are mapped to Android runtime permissions.
- File inputs use Android's system document picker. This does not require broad access to the device's entire storage.
- HTTP(S) downloads are handed to Android DownloadManager and saved in the public **Downloads** folder. Android 9 and earlier ask for the legacy write permission at runtime; Android 10 and later use scoped storage.
- External phone and email links are handed to the relevant Android apps.

Only the permissions needed for these capabilities are declared. Location, contacts, SMS, call-log, and all-files access are not requested.

## Build

Open this `android` directory in Android Studio, or use JDK 17+, Android SDK Platform 35, Build Tools 35.0.0, and Gradle 8.9:

```bash
gradle --no-daemon assembleDebug
```

The installable debug APK is generated at:

`app/build/outputs/apk/debug/app-debug.apk`

The GitHub Actions workflow builds this APK on pushes to `main` that touch the Android project and uploads it as the `MorningBoard-Android-debug` artifact.
