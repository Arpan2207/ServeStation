---
name: UI settings screen
overview: Add a Figma MCP-aligned UI Settings screen and connect it from the existing Main Settings screen card, keeping everything static/UI-only.
todos:
  - id: ui-settings-route
    content: Add the `/settings/ui` route as a thin route file
    status: completed
  - id: ui-settings-ui
    content: Build `UiSettingsScreen` from the Figma MCP node `19:637`
    status: completed
  - id: ui-settings-navigation
    content: Make the Main Settings `UI settings` card navigate to `/settings/ui`
    status: completed
  - id: ui-settings-verify
    content: Run type/lint validation and confirm the screen remains UI-only
    status: completed
isProject: false
---

# UI Settings Screen Plan

## Goal
Build the UI Settings screen from Figma MCP node `19:637` and make it reachable from the `UI settings` card on the Main Settings screen.

## Figma Source
Use the Figma MCP design context for file `B8JWC3QJoHvmFYK8Qj27uS`, node `19:637` (`UI Settings Screen`) as the source of truth.

The MCP layout contains:
- Outer cream frame: `#fffdf8`, `30px` radius, `23px` horizontal/top padding, `18px` gap.
- Header: `UI settings`, subtitle `Adjust colors, contrast, and touch density.`, and `Apply theme` button.
- Main content row:
  - Left column with cards: `Brand color`, `Large touch mode`, `Layout density`.
  - Right column with `Live preview` card showing a miniature dark split POS layout.

## Implementation Steps
1. Add a new route at [`src/app/settings/ui.tsx`](src/app/settings/ui.tsx) that imports Unistyles and renders the UI settings screen.
2. Add [`src/components/settings/UiSettingsScreen.tsx`](src/components/settings/UiSettingsScreen.tsx) matching MCP node `19:637`:
   - Header with title/subtitle and `Apply theme` button.
   - Left settings column with static color swatches, touch mode, and density pills.
   - Right live preview panel with dark preview mockup.
   - Static/mock UI only; no settings state or persistence.
3. Update [`src/components/settings/MainSettingsScreen.tsx`](src/components/settings/MainSettingsScreen.tsx):
   - Import `useRouter` from `expo-router`.
   - Let `SettingsCard` accept an optional `onPress` prop.
   - Wrap the card in `Pressable` only when `onPress` exists.
   - Navigate the `UI settings` card to `/settings/ui`.
4. Keep styling aligned with the existing Orders/Admin/Settings screens: Unistyles, theme tokens where possible, and explicit MCP dimensions where fidelity matters.
5. Validate with `npx tsc --noEmit` and lints for the new/changed files.

## Files To Change
- [`src/app/settings/ui.tsx`](src/app/settings/ui.tsx) (new)
- [`src/components/settings/UiSettingsScreen.tsx`](src/components/settings/UiSettingsScreen.tsx) (new)
- [`src/components/settings/MainSettingsScreen.tsx`](src/components/settings/MainSettingsScreen.tsx)

## Responsive Notes
- Use the Figma two-column layout as the primary tablet landscape view.
- On tighter widths, allow the content to scroll and stack the preview below the controls if needed.
- Keep the preview card from overflowing horizontally by using flex weights instead of absolute screen-width assumptions.

## Validation
- Run `npx tsc --noEmit`.
- Check lints for `src/app/settings` and `src/components/settings`.
- Confirm navigation flow: Home POS → Settings → UI settings card → UI Settings screen.