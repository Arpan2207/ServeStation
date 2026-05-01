---
name: Orders list screen
overview: Add a UI-only Orders List screen and route it from the Home POS three-dot menu via a small dropdown, keeping the design consistent with the current Kioskable theme and scoped to frontend UI only.
todos:
  - id: orders-route
    content: Add the `/orders` route and thin route file for Orders List
    status: completed
  - id: orders-components
    content: Build `OrdersListScreen` and `OrderRow` with static responsive UI
    status: completed
  - id: home-dropdown
    content: Turn the Home POS three-dot icon into a dropdown with an Orders navigation item
    status: completed
  - id: orders-verify
    content: Run type/lint validation and verify the new route stays UI-only
    status: completed
isProject: false
---

# Orders List Screen Plan

## Goal
Create an Orders List screen and make it reachable from the three-dot button at the top-left of the Home POS screen through a dropdown menu item labeled `Orders`.

## Scope
- Add UI-only static/mock Orders List content.
- Add navigation from Home POS to Orders List.
- Do not add backend, persistence, order logic, or real cart/order state.
- Keep the Home POS screen and Orders List responsive for tablet landscape.

## Current Entry Point
The three-dot button is currently static inside [`src/components/pos/CategoryBar.tsx`](src/components/pos/CategoryBar.tsx):

```tsx
<View style={styles.menuIcon}>
  <Text style={styles.menuDots}>⋮</Text>
</View>
```

This should become a pressable menu trigger.

## Implementation Steps
1. Add a new Expo Router route at [`src/app/orders/index.tsx`](src/app/orders/index.tsx) that imports Unistyles and renders the Orders List screen.
2. Create [`src/components/orders/OrdersListScreen.tsx`](src/components/orders/OrdersListScreen.tsx) with static order rows matching the existing Figma-inspired theme: cream background, light orange selected/open rows, thin long order rows, tabs for Open/Closed orders, and a compact right-side summary/support area if useful for tablet width.
3. Create a reusable order row component at [`src/components/orders/OrderRow.tsx`](src/components/orders/OrderRow.tsx) to keep the route/screen clean.
4. Update [`src/components/pos/CategoryBar.tsx`](src/components/pos/CategoryBar.tsx):
   - convert the three-dot icon into a `Pressable`
   - show a small themed dropdown when pressed
   - include `Orders` as a menu option
   - call `router.push('/orders')` when the Orders item is pressed
5. Keep all styling with `react-native-unistyles`, using existing theme tokens from [`src/theme`](src/theme).
6. Validate with TypeScript and lints, and confirm no unrelated screens are changed.

## Files To Change
- [`src/components/pos/CategoryBar.tsx`](src/components/pos/CategoryBar.tsx)
- [`src/app/orders/index.tsx`](src/app/orders/index.tsx)
- [`src/components/orders/OrdersListScreen.tsx`](src/components/orders/OrdersListScreen.tsx)
- [`src/components/orders/OrderRow.tsx`](src/components/orders/OrderRow.tsx)

## Responsive Behavior
- On wider tablets, use a two-column Orders screen: order list on the left, compact summary/support cards on the right.
- On tighter widths, keep the list dominant and stack or shrink secondary content.
- Rows should stay thin, long, and touch-friendly.

## Validation
- Run `npx tsc --noEmit`.
- Check lints for changed files.
- Launch in the dev client if needed and verify Home POS → three dots → Orders navigation works.