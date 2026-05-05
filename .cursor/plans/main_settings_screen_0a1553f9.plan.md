---
name: Main settings screen
overview: Add a Figma MCP-aligned Main Settings screen and connect it from the Home POS dropdown, keeping the implementation static/UI-only and consistent with the existing Unistyles screens.
todos:
  - id: settings-route
    content: Add the `/settings` route as a thin route file
    status: completed
  - id: settings-ui
    content: Build `MainSettingsScreen` from the Figma MCP node `142:2`
    status: completed
  - id: settings-navigation
    content: Make the Home POS dropdown Settings item navigate to `/settings`
    status: completed
  - id: settings-verify
    content: Run type/lint validation and confirm the screen remains UI-only
    status: completed
isProject: false
---

# Main Settings Screen Plan

## Goal
Build the Main Settings screen from the Figma MCP node `142:2` and make it reachable from the Home POS three-dot menu.

## Figma Source
Use the Figma MCP design context for file `B8JWC3QJoHvmFYK8Qj27uS`, node `142:2` (`Main Settings Screen`) as the source of truth.

The MCP layout contains:
- Outer cream frame: `#fffdf8`, black border, `30px` radius, `23px` padding, `18px` gap.
- Header: `Settings` title and a primary `Quick access` button.
- Card grid:
  - `UI settings` card with Display badge and chips: `Theme`, `Touch density`, `Layout preview`.
  - `Profile settings` card with Account badge and chips: `Account`, `Store profile`, `Notifications`.
  - `Admin options` wide card with Access badge and chips: `Roles`, `Permissions`, `Advanced controls`.

## Implementation Steps
1. Add a new route at [`src/app/settings/index.tsx`](src/app/settings/index.tsx) that imports Unistyles and renders the settings screen.
2. Add [`src/components/settings/MainSettingsScreen.tsx`](src/components/settings/MainSettingsScreen.tsx) matching MCP node `142:2`:
   - Header with `Settings` and `Quick access`.
   - Two half-width cards on the first row.
   - One full-width `Admin options` card below.
   - Static/mock UI only; no settings state or logic.
3. Use small local helper components inside `MainSettingsScreen.tsx` for repeated card/chip/button patterns.
4. Update [`src/components/pos/CategoryBar.tsx`](src/components/pos/CategoryBar.tsx) so the existing `Settings` dropdown item navigates to `/settings`.
5. Keep styles aligned with Orders/Admin: Unistyles, theme tokens where they match, explicit MCP dimensions where visual fidelity matters.
6. Validate with `npx tsc --noEmit` and lints for the new/changed files.

## Files To Change
- [`src/app/settings/index.tsx`](src/app/settings/index.tsx) (new)
- [`src/components/settings/MainSettingsScreen.tsx`](src/components/settings/MainSettingsScreen.tsx) (new)
- [`src/components/pos/CategoryBar.tsx`](src/components/pos/CategoryBar.tsx)

## Responsive Notes
- Use the Figma card layout as the primary tablet landscape view.
- Use flex wrapping so the two top cards can stack on narrower widths if needed.
- Keep the `Admin options` card full width beneath the first row.

## Validation
- Run `npx tsc --noEmit`.
- Check lints for `src/components/settings`, `src/app/settings`, and `src/components/pos/CategoryBar.tsx`.
- Confirm navigation flow: Home POS → three-dot menu → Settings.