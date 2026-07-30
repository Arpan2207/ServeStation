# Repository Guidelines

## Project Structure & Module Organization

ServeStation is an Expo, React Native, TypeScript POS application optimized for tablet layouts. Keep `src/app/` route files thin: compose domain screens rather than putting feature logic there.

- `src/components/` contains shared UI (`ui/`), behavior primitives (`primitives/`), and feature components (`pos/`, `orders/`, `admin/`, `settings/`).
- `src/hooks/` owns screen state; `src/types/` holds view types.
- `src/domain/` defines canonical business models and pure logic. Put focused tests beside it, for example `src/domain/orders.test.ts`.
- `src/repositories/` is the data boundary. Screens and hooks import repository singletons, not `src/lib/mock*` directly.
- `src/theme/` centralizes Unistyles tokens and breakpoints. `assets/` holds app assets; `supabase/migrations/` holds database schema changes.

Read `README.md` and relevant `docs/` files before changing architecture or workflows.

## Build, Test, and Development Commands

- `npm run dev` starts Metro for the installed Expo development build.
- `npm run dev:clear` starts Metro with its cache cleared.
- `npm run android:dev` builds and installs the Android development build.
- `npm run lint` runs Expo ESLint checks.
- `npx tsc --noEmit` type-checks the project; run it after every change.
- `npm test` runs Node’s built-in tests through `tsx`; `npm run test:watch` reruns them while editing.

Use `npm run android:clean` only for a stale native project or native configuration change. Unistyles requires a development build, not Expo Go.

## Coding Style & Naming Conventions

Use TypeScript with strict typing, two-space indentation, and the `@/` import alias for `src/`. Use PascalCase for React components and files (for example, `CartPanel.tsx`), camelCase for functions and variables, and descriptive hook names such as `usePosState`.

Use `react-native-unistyles` `StyleSheet.create` and theme tokens instead of large inline styles or hard-coded design values. Keep tablet layouts responsive. Add file-purpose and exported-API doc comments.

## Testing Guidelines

Test pure domain behavior with `node:test`/`tsx`. Name files `*.test.ts` and cover valid behavior plus edge cases. Run `npm test`, `npm run lint`, and `npx tsc --noEmit` before a pull request.

## Commit & Pull Request Guidelines

History uses short, descriptive commits such as `phase 3 BE plans` and `profile settings page`. Prefer concise imperative summaries with a clear area, for example `admin: edit modifier prices`. Keep commits focused.

PRs should describe the user-visible change, list validation commands, link an issue when available, and include tablet screenshots for visual changes. Call out schema, configuration, or environment-variable changes.
