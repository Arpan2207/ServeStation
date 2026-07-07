# Development Workflow

ServeStation uses `react-native-unistyles` v3, which depends on native modules through Nitro Modules. Because of that, the app does not run in Expo Go. Use the installed Expo development build instead.

## Daily Workflow

Start Metro for the installed development build:

```powershell
npm run dev
```

Then open the installed ServeStation app on the Android emulator. Normal changes in `src/` should Fast Refresh without rebuilding the native app.

Use this flow for:

- UI component changes
- screen layout changes
- TypeScript changes
- styling/token changes
- mock data changes

## Reinstall Or Rebuild The App

Run this when the app is not installed on the emulator, after deleting it from the AVD, or after changing native dependencies/config:

```powershell
npm run android:dev
```

This runs `expo run:android`, builds the native Android app, installs it on the emulator, and starts Metro.

## Clean Rebuild

Use this only when the native project is stale or broken:

```powershell
npm run android:clean
```

This runs `expo prebuild --clean` before building Android again. It is slower than the normal reinstall command.

## Clear Metro Cache

If the emulator is not showing recent JavaScript or UI changes:

```powershell
npm run dev:clear
```

## Android SDK Setup On Windows

Gradle needs to know where the Android SDK is. If `npm run android:dev` fails with `SDK location not found`, set `ANDROID_HOME` once:

```powershell
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")
```

Add `adb` to the user `PATH` so terminal commands can find the emulator tools:

```powershell
[Environment]::SetEnvironmentVariable(
  "PATH",
  "$([Environment]::GetEnvironmentVariable('PATH','User'));$env:LOCALAPPDATA\Android\Sdk\platform-tools",
  "User"
)
```

After changing environment variables, close and reopen Cursor or the terminal.

## Command Cheat Sheet

```powershell
npm run dev          # Daily Metro server for the installed dev build
npm run dev:clear    # Metro server with cache cleared
npm run android:dev  # Build/install Android dev build
npm run android      # Same core Android build command kept for Expo familiarity
npm run android:clean # Clean native rebuild when needed
```

## When To Use Which Command

Use `npm run dev` for most work. Use `npm run android:dev` only when the native app needs to be installed or rebuilt.

A simple rule:

- `src/` UI or TypeScript change: `npm run dev`
- Deleted emulator app: `npm run android:dev`
- Native dependency/config change: `npm run android:dev`
- Stale native project: `npm run android:clean`
