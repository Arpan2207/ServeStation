# UI Project Structure

Use this structure for the hybrid `Unistyles + custom presentational components + headless behavior primitives` approach.

## Recommended Structure

```text
src/
  app/
    _layout.tsx
    index.tsx
    pos/
    orders/
    admin/
    settings/

  theme/
    unistyles.ts
    colors.ts
    spacing.ts
    radii.ts
    typography.ts
    breakpoints.ts

  components/
    ui/
      Screen.tsx
      Card.tsx
      Button.tsx
      Input.tsx
      Chip.tsx
      Section.tsx
      Stack.tsx

    primitives/
      Dialog.tsx
      Menu.tsx
      Select.tsx
      Switch.tsx

    pos/
      CategoryCard.tsx
      MenuItemCard.tsx
      CartPanel.tsx
      ModifierGroup.tsx

    orders/
      OrderRow.tsx
      OrderSummaryCard.tsx
      OrderActionBar.tsx

    admin/
      CategoryPanel.tsx
      ItemBrowserRow.tsx
      EditorPanel.tsx

    settings/
      SettingsSectionCard.tsx
      ThemePreviewCard.tsx

  hooks/
  lib/
  types/
```

## Practical Guidelines

- Put reusable visual building blocks in `src/components/ui/`.
- Put behavior-heavy wrappers in `src/components/primitives/`.
- Put screen-specific presentational pieces in domain folders like `src/components/pos/` or `src/components/orders/`.
- Keep Unistyles theme setup in `src/theme/`.
- Keep route screens thin. Route files should compose domain components instead of holding all styling and business logic directly.

## What Goes Where

- `src/theme/`: tokens, theme objects, breakpoints, Unistyles setup
- `src/components/ui/`: low-level presentational components used across the app
- `src/components/primitives/`: headless or behavior wrappers for complex controls
- `src/components/pos/`, `orders/`, `admin/`, `settings/`: domain-specific UI
- `src/app/`: route entry files only

## Rule Of Thumb

- If it is reused across multiple screens and mostly visual, put it in `src/components/ui/`.
- If it solves interaction, accessibility, overlay, or focus behavior, put it in `src/components/primitives/`.
- If it belongs mainly to one product area, keep it in that domain folder.
- Always keep the final visual output aligned with Figma.
