# UI Component Strategy

Use a hybrid UI approach for ServeStation:

- Use `react-native-unistyles` for themes, tokens, breakpoints, and responsive styling.
- Keep the visual UI aligned with the Figma designs. Behavior helpers are allowed, but the final look should still match Figma.
- Build simple presentational components ourselves.
- Avoid custom-building behavior-heavy components unless we truly need custom behavior that existing primitives cannot provide.

## Build Ourselves

- `Screen`
- `Card`
- `Button`
- `Chip`
- `Section`
- `Stack` / layout helpers
- `MenuItemCard`
- `CategoryCard`
- `OrderRow`
- `SummaryCard`
- POS/admin/orders screen-specific presentational pieces

## Prefer Existing Or Headless Primitives

- `Dialog` / modal behavior
- `Popover`
- `Menu`
- `Select` / combobox
- `Checkbox`
- `Switch`
- date/time pickers
- bottom sheets
- tooltips
- anything accessibility-heavy or keyboard/focus heavy

## Practical Rule

- If a component is mostly visual, we can build it.
- If a component has complicated interaction, accessibility, focus, overlay, or form behavior, prefer existing React Native or headless/unstyled primitives and skin them with Unistyles.
