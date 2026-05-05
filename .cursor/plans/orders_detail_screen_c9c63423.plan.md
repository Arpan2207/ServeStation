---
name: Orders detail screen
overview: Add a Figma MCP-aligned Orders Detail screen and connect it from the Orders List screen, keeping the implementation UI-only and consistent with the existing Unistyles setup.
todos:
  - id: order-detail-route
    content: Add the `/orders/detail` route as a thin route file
    status: completed
  - id: order-detail-ui
    content: Build `OrderDetailScreen` from the Figma MCP node `186:53`
    status: completed
  - id: order-detail-navigation
    content: Make Orders List rows navigate to the detail route
    status: completed
  - id: order-detail-verify
    content: Run type/lint validation and confirm the detail screen remains UI-only
    status: completed
isProject: false
---

# Orders Detail Screen Plan

## Goal
Build the Orders Detail screen from the Figma MCP node `186:53` and make it reachable from the Orders List screen.

## Figma Source
Use the Figma MCP design context for file `B8JWC3QJoHvmFYK8Qj27uS`, node `186:53` (`Order Detail Screen`) as the source of truth.

The MCP layout contains:
- Outer cream frame: `#fffdf8`, black border, `30px` radius, `23px` horizontal/top padding, `18px` gap.
- Header: `Order detail`, subtitle `A separate detail view with wider cards and a support column.`
- Content row:
  - Main column: `Order Summary` card and `Actions` card.
  - Side column: `Payment` card and `Notes & support` card.

## Implementation Steps
1. Add a new route at [`src/app/orders/detail.tsx`](src/app/orders/detail.tsx) that imports Unistyles and renders the detail screen.
2. Add [`src/components/orders/OrderDetailScreen.tsx`](src/components/orders/OrderDetailScreen.tsx) matching the MCP layout:
   - Header with title/subtitle.
   - Main summary card for `Order #1042`.
   - Item/tax/total rows matching MCP values.
   - Actions card with `Print ticket`, `Print receipt`, `Issue refund`.
   - Right column with `Payment` and `Notes & support` cards.
3. Optionally add small local helper components inside `OrderDetailScreen.tsx` for repeated row/card/button/chip patterns, rather than creating many new files.
4. Update [`src/components/orders/OrderRow.tsx`](src/components/orders/OrderRow.tsx) to accept an optional `onPress` prop and wrap the row in a `Pressable` only when provided.
5. Update [`src/components/orders/OrdersListScreen.tsx`](src/components/orders/OrdersListScreen.tsx) so tapping an order row calls `router.push('/orders/detail')`.
6. Keep all data static/mock and UI-only.
7. Validate changed files with TypeScript and lints.

## Files To Change
- [`src/app/orders/detail.tsx`](src/app/orders/detail.tsx) (new)
- [`src/components/orders/OrderDetailScreen.tsx`](src/components/orders/OrderDetailScreen.tsx) (new)
- [`src/components/orders/OrderRow.tsx`](src/components/orders/OrderRow.tsx)
- [`src/components/orders/OrdersListScreen.tsx`](src/components/orders/OrdersListScreen.tsx)

## Styling Notes
- Use `react-native-unistyles` and current theme tokens where they match Figma.
- Use explicit MCP dimensions for the detail screen where fidelity matters: `30` radius frame, `24` radius summary card, `22` radius support/action cards, `14px` content gap, `312px` side column on wide layouts.
- Keep the side column on larger tablet widths; stack it below the main column on tighter widths if needed.

## Validation
- Run `npx tsc --noEmit`.
- Check lints for `src/components/orders` and `src/app/orders`.
- Confirm navigation flow: Home POS → Orders List → tap row → Orders Detail.