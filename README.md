# Kioskable

Kioskable is a tablet-first POS app built with Expo React Native and TypeScript.

## Development Workflow

This project uses `react-native-unistyles` v3, so it runs in an Expo development build instead of Expo Go.

Use this for normal UI and TypeScript work:

```powershell
npm run dev
```

Use this when the app is not installed on the emulator, after deleting it, or after native dependency/config changes:

```powershell
npm run android:dev
```

If Metro cache acts stale:

```powershell
npm run dev:clear
```

For a clean native rebuild:

```powershell
npm run android:clean
```

See [`docs/development-workflow.md`](docs/development-workflow.md) for the full workflow and Android SDK setup notes.
