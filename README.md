# ServeStation

ServeStation is a tablet-first POS interface built with Expo, React Native, TypeScript, and `react-native-unistyles`.

It is designed for landscape kiosk and counter workflows, with a UI that prioritizes fast product selection, order review, and operational control on larger touch devices.

## Overview

The app currently includes multiple UI surfaces for a modern restaurant or retail ordering flow:

- Home POS screen with category browsing, product grid, selected item editor, upsells, and cart panel
- Orders workspace with open/closed tabs, search, and order detail drill-in
- Admin workspace for categories, item browsing, and menu editing flows
- Settings surfaces for UI and app configuration work

## Tech Stack

- Expo + React Native
- TypeScript
- Expo Router
- React Navigation
- `react-native-unistyles` for theming, tokens, and responsive styling

## Screenshots

<table>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/home-pos.png" alt="Home POS screen" />
    </td>
    <td width="50%">
      <img src="docs/screenshots/orders-list.png" alt="Orders list screen" />
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/order-detail.png" alt="Order detail screen" />
    </td>
    <td width="50%">
      <img src="docs/screenshots/admin-workspace.png" alt="Admin workspace screen" />
    </td>
  </tr>
</table>

## Documentation

- [`docs/development-workflow.md`](docs/development-workflow.md)
- [`docs/ui-project-structure.md`](docs/ui-project-structure.md)
- [`docs/ui-component-strategy.md`](docs/ui-component-strategy.md)
- [`docs/phase-2-interactivity-plan.md`](docs/phase-2-interactivity-plan.md)
