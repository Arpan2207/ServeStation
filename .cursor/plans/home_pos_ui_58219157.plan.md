---
name: Home POS UI
overview: Build only the initial Home POS screen as a responsive, UI-only implementation using the hybrid Unistyles approach, with route code kept thin and the visual structure aligned to Figma.
todos:
  - id: home-theme-setup
    content: Set up Unistyles theme files and responsive breakpoints for the app shell
    status: completed
  - id: home-ui-primitives
    content: Create the shared presentational UI primitives needed for the Home POS screen
    status: completed
  - id: home-pos-components
    content: Build POS-specific presentational components like category cards, menu item cards, cart panel, and modifier groups
    status: completed
  - id: home-screen-assembly
    content: Assemble the full HomePosScreen with static mock data and responsive split-pane layout
    status: completed
  - id: home-route-wireup
    content: Replace the starter content in src/app/index.tsx with the Home POS screen composition
    status: completed
  - id: home-responsive-pass
    content: Verify and adjust tablet-first responsiveness and Figma alignment
    status: completed
isProject: false
---

# Home POS Screen Plan

## Goal
Implement the first real app screen as the Home POS UI only: responsive, tablet-first, visually matched to Figma, and intentionally free of business logic.

## Scope
- Build only the Home POS screen.
- Do not add order/cart logic, selection logic, networking, persistence, or real interactions.
- Use static/mock display data only.
- Keep the layout responsive for tablet-oriented split-pane usage.

## Route Strategy
- Use [`src/app/index.tsx`](src/app/index.tsx) as the initial route for now, since it is currently the placeholder entry screen.
- Keep [`src/app/_layout.tsx`](src/app/_layout.tsx) minimal and unchanged unless navigation shell changes become necessary later.
- Move real UI composition out of the route file quickly so the route stays thin.

## Files To Introduce
- Theme setup:
  - [`src/theme/unistyles.ts`](src/theme/unistyles.ts)
  - [`src/theme/colors.ts`](src/theme/colors.ts)
  - [`src/theme/spacing.ts`](src/theme/spacing.ts)
  - [`src/theme/radii.ts`](src/theme/radii.ts)
  - [`src/theme/typography.ts`](src/theme/typography.ts)
  - [`src/theme/breakpoints.ts`](src/theme/breakpoints.ts)
- Shared UI primitives:
  - [`src/components/ui/Screen.tsx`](src/components/ui/Screen.tsx)
  - [`src/components/ui/Card.tsx`](src/components/ui/Card.tsx)
  - [`src/components/ui/Button.tsx`](src/components/ui/Button.tsx)
  - [`src/components/ui/Chip.tsx`](src/components/ui/Chip.tsx)
  - [`src/components/ui/Stack.tsx`](src/components/ui/Stack.tsx)
- POS-specific UI:
  - [`src/components/pos/HomePosScreen.tsx`](src/components/pos/HomePosScreen.tsx)
  - [`src/components/pos/MenuItemCard.tsx`](src/components/pos/MenuItemCard.tsx)
  - [`src/components/pos/CategoryCard.tsx`](src/components/pos/CategoryCard.tsx)
  - [`src/components/pos/CartPanel.tsx`](src/components/pos/CartPanel.tsx)
  - [`src/components/pos/ModifierGroup.tsx`](src/components/pos/ModifierGroup.tsx)

## Layout Plan
- Create a two-pane shell for the Home POS screen:
  - Left pane: categories, quick filters/tools, menu item grid, selected item/editor area.
  - Right pane: persistent cart summary panel.
- Keep the left pane flexible and the cart panel more stable in width.
- Use breakpoints/orientation-aware styling so the screen keeps its structure across tablet sizes.
- Treat the current Figma layout as the visual source of truth for spacing, card hierarchy, and panel proportions.

## UI-Only Data Strategy
- Use local static arrays/constants for:
  - categories
  - menu items
  - modifier chips
  - cart items
  - totals and labels
- Represent an already-selected item visually instead of adding actual selection state.
- Allow light presentational states only if needed for layout fidelity, but avoid real interaction logic.

## Component Responsibilities
- [`src/components/ui/*`](src/components/ui/) should contain reusable presentational primitives only.
- [`src/components/pos/HomePosScreen.tsx`](src/components/pos/HomePosScreen.tsx) should assemble the full POS layout from smaller pieces.
- POS-specific pieces like item cards and cart rows should stay in [`src/components/pos/`](src/components/pos/).
- Avoid building any behavior-heavy primitives in this first pass.

## Styling Plan
- Use Unistyles as the styling system for:
  - colors
  - spacing
  - radii
  - typography
  - breakpoints
- Encode the app’s Figma theme into tokens first before styling components individually.
- Favor screen and component style sheets over inline styles.
- Use `FILL`-like responsive behavior through flexible layout rules rather than hardcoded one-device widths.

## Implementation Order
1. Add Unistyles setup and core tokens.
2. Create low-level reusable UI primitives used by multiple parts of the Home POS screen.
3. Build POS-specific presentational components.
4. Assemble the full `HomePosScreen` with static mock data.
5. Wire [`src/app/index.tsx`](src/app/index.tsx) to render the assembled screen.
6. Verify layout stability across tablet-oriented sizes and adjust spacing/breakpoints.

## Success Criteria
- The app launches into a responsive Home POS screen instead of the starter placeholder.
- The screen visually follows the Figma design direction already established.
- The implementation uses the hybrid approach correctly: Unistyles for styling, custom presentational components for visuals, no unnecessary custom behavior widgets.
- The route file stays thin and future screens can reuse the same theme/primitives.
- No business logic is introduced yet beyond static mock content.