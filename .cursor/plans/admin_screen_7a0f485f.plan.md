---
name: Admin screen
overview: Add a Figma MCP-aligned Admin screen and connect it from the existing three-dot menu, keeping the implementation UI-only and consistent with the current Unistyles screens.
todos:
  - id: admin-route
    content: Add the `/admin` route as a thin route file
    status: completed
  - id: admin-ui
    content: Build `AdminScreen` from the Figma MCP node `164:2`
    status: completed
  - id: admin-navigation
    content: Make the Home POS dropdown Admin item navigate to `/admin`
    status: completed
  - id: admin-verify
    content: Run type/lint validation and confirm the screen remains UI-only
    status: completed
isProject: false
---

# Admin Screen Plan

## Goal
Build the Admin screen from the Figma MCP node `164:2` and make it reachable from the Home POS three-dot menu.

## Figma Source
Use the Figma MCP design context for file `B8JWC3QJoHvmFYK8Qj27uS`, node `164:2` (`Admin Screen`) as the source of truth.

The MCP layout contains:
- Outer cream frame: `#fffdf8`, black border, `30px` radius, `23px` padding, `18px` gap.
- Header: `Admin workspace`, subtitle, plus `Bulk edit` and `Add item` actions.
- Utility row: search field plus filter chips (`All items`, `In stock`, `Needs review`).
- Content row:
  - Left categories panel with `Menu sections` and category cards.
  - Middle item browser with `Items in Burgers`, item cards, and status/price chips.
  - Right editor panel for `Editing: Smash Burger`, item fields, visibility, modifier groups, and actions.

## Implementation Steps
1. Add a new route at [`src/app/admin/index.tsx`](src/app/admin/index.tsx) that imports Unistyles and renders the admin screen.
2. Add [`src/components/admin/AdminScreen.tsx`](src/components/admin/AdminScreen.tsx) matching MCP node `164:2`:
   - Header, subtitle, `Bulk edit`, and `Add item` buttons.
   - Utility search/filter row.
   - Three-column layout: categories, item browser, editor panel.
   - Static/mock menu data only; no save/edit logic.
3. Use small local helper components in `AdminScreen.tsx` for repeated card/chip/button/input-like blocks so the file stays readable without creating many new files.
4. Update [`src/components/pos/CategoryBar.tsx`](src/components/pos/CategoryBar.tsx) so the existing `Admin` dropdown item navigates to `/admin`.
5. Keep styling aligned with the current Orders screens: Unistyles, existing theme tokens where possible, and explicit MCP dimensions where fidelity matters.
6. Validate with `npx tsc --noEmit` and lints for the new/changed files.

## Files To Change
- [`src/app/admin/index.tsx`](src/app/admin/index.tsx) (new)
- [`src/components/admin/AdminScreen.tsx`](src/components/admin/AdminScreen.tsx) (new)
- [`src/components/pos/CategoryBar.tsx`](src/components/pos/CategoryBar.tsx)

## Responsive Notes
- Use the MCP desktop/tablet layout as the primary landscape tablet view.
- Keep columns fixed/flexible similar to Figma: categories around `220px`, item browser around `290px`, editor panel fills remaining space.
- On tighter widths, allow horizontal/vertical scrolling inside content areas rather than adding business logic.

## Validation
- Run `npx tsc --noEmit`.
- Check lints for `src/components/admin`, `src/app/admin`, and `src/components/pos/CategoryBar.tsx`.
- Confirm navigation flow: Home POS → three-dot menu → Admin.