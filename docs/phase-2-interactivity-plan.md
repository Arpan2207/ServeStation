# Phase 2 Interactivity Plan

Phase 2 moves ServeStation from static mock screens to interactive frontend screens. The app should still stay local-only for now: no backend, no payments, no auth, no real persistence, and no kiosk-lock behavior.

The goal is to make the screens feel like a working POS prototype while preserving the visual design already built from Figma.

## Core Principles

- Keep the final visual UI aligned with Figma.
- Add interaction without redesigning the screens.
- Keep route files thin and compose domain components from `src/components/`.
- Start with React state before adding a global state library.
- Keep mock data typed and centralized so it can later be replaced by backend data.
- Use `react-native-unistyles` for responsive styling and visual state changes.
- Put reusable behavior-heavy controls in `src/components/primitives/` when needed.

## Recommended Structure

```text
src/
  types/
    pos.ts
    orders.ts
    menu.ts
    settings.ts

  lib/
    mockData.ts
    orderTotals.ts
    ids.ts

  hooks/
    usePosState.ts
    useOrdersState.ts
    useSettingsState.ts

  components/
    primitives/
      Switch.tsx
      QuantityStepper.tsx
      SearchInput.tsx

    pos/
    orders/
    admin/
    settings/
```

This structure keeps data, behavior, and visual components separated without making the app too complex too early.

## State Strategy

Start with local React state and small custom hooks.

Use `useState` for simple screen-level state:

- selected category
- selected menu item
- selected order tab
- search text
- selected UI setting option

Use `useReducer` when multiple actions update related state:

- cart item add/remove/update quantity
- modifier toggles
- simulated order creation
- admin item editing

Avoid adding Zustand, Redux, or persistence until the app has enough shared state to justify it.

## Phase Order

### 1. Shared Mock Data And Types

Move hardcoded screen data into shared files.

Create typed models for:

- menu categories
- menu items
- modifiers
- cart items
- orders
- order statuses
- settings options

This makes the app easier to connect across screens. For example, the POS cart can create an order that the Orders screen can display.

### 2. Home POS Interactivity

Start here because the Home POS screen is the center of the product.

Add:

- category selection
- menu filtering by category
- menu item selection
- selected item panel updates
- modifier selection
- add item to cart
- cart quantity increase/decrease
- remove item when quantity reaches zero
- clear cart
- live subtotal, tax, and total
- simulated place order action

The selected item panel should be driven by the selected menu item instead of hardcoded text.

The cart should be driven by local cart state instead of static mock items.

### 3. Orders List And Detail Interactivity

After POS can simulate an order, connect the Orders screens to local order data.

Add:

- open/closed tab filtering
- search by order number, customer, table, or status
- order row press selects an order
- detail screen displays the selected order
- static action buttons can show local feedback states

The detail screen should no longer be hardcoded to one fixed order.

### 4. Admin Screen Interactivity

Make Admin feel like a mock menu editor.

Add:

- category selection
- item filtering by selected category
- item selection
- editable local fields for name, description, price, and visibility
- mock add item flow
- local search/filter behavior

Admin changes can update the local menu data used by the POS screen later, but this can be added after the first admin interaction pass.

### 5. Settings Interactivity

Make settings control local UI preferences.

Add:

- brand color selection
- touch mode toggle
- layout density selection
- live preview updates
- apply theme button updates local settings state

Settings should remain frontend-only. Do not persist preferences until the UI behavior feels right.

## Component Guidance

Build simple visual components ourselves:

- menu item cards
- order rows
- settings cards
- chips
- buttons
- section cards

Use or create primitives for repeated behavior:

- `QuantityStepper`
- `SearchInput`
- `Switch`
- `SegmentedControl`
- `SelectableCard`

The primitive should handle behavior and accessibility, while the screen/component keeps the Figma styling through Unistyles.

## First Implementation Plan

The first concrete implementation task should be:

```text
Home POS interactivity phase 2
```

Recommended scope:

1. Create shared menu/cart/order types.
2. Move POS mock data out of `HomePosScreen`.
3. Make category chips selectable.
4. Make menu item cards selectable.
5. Drive `SelectedItemPanel` from selected item data.
6. Add selected item to cart.
7. Make cart quantity buttons update cart state.
8. Calculate subtotal, tax, and total from cart state.
9. Keep `Simulate place order` local-only.

Keep this first pass focused. Do not start Admin or Settings interactivity until the POS flow works.

## Validation

For each interactivity pass:

- Run `npx tsc --noEmit`.
- Run lints for touched files.
- Confirm layouts still work on tablet landscape sizes.
- Confirm empty states do not break the layout.
- Confirm the app still works in the Expo development build with `npm run dev`.

Use `npm run android:dev` only if the dev build is missing or native configuration changes.

## What Not To Add Yet

Do not add these in phase 2 unless explicitly requested:

- backend API calls
- database persistence
- payment processing
- kiosk lock mode
- staff authentication
- printer integration
- real refunds
- global state library by default

Phase 2 is about making the frontend prototype interactive and believable before connecting real systems.
