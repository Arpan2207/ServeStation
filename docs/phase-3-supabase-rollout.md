# Phase 3 — Supabase Rollout

This is the execution guide for moving ServeStation from frontend-only mock data
to a Supabase backend, without letting the UI depend on Supabase-specific shapes.
It reflects the readiness work already landed in the codebase and sequences the
remaining backend milestones.

The guiding rule: **the order model is designed first and drives everything.**
Catalog migration is comparatively easy; orders carry lifecycle state,
timestamps, payments, refunds, and reporting, so they were modeled up front.

## What's already in place (readiness landed)

- **Canonical domain model** — `src/domain/`
  - `money.ts` — numeric `Money` + `formatMoney`/`parseMoney`/`roundMoney`
  - `fulfilment.ts` — one `FulfilmentType` (`dine_in`/`pickup`/`delivery`) plus
    converters from the two legacy casings
  - `menu.ts` — `MenuCategory`, `MenuItem`, `ModifierGroup`, `ModifierOption`,
    `Catalog`
  - `orders.ts` — the carefully designed `Order` aggregate (lifecycle status,
    kitchen status, payment status/method/reference, numeric `OrderMoney`,
    milestone `OrderTimestamps`, snapshotted `OrderItem`/`OrderItemModifier`)
- **Mapping layer** — `src/mappers/`
  - normalizes the per-screen view/mock shapes into the canonical model
    (POS `label`→`name`, admin string prices → numeric, order UI strings →
    numeric money + canonical states)
- **Repository boundary** — `src/repositories/`
  - `types.ts` — `MenuRepository`, `OrdersRepository`, `AdminRepository`
  - `adapters/mock/*` — mock adapters implementing those interfaces
  - `index.ts` — the `menuRepository` / `ordersRepository` / `adminRepository`
    singletons the app imports
- **Boundary enforced** — hooks (`usePosState`, `useOrdersState`,
  `useAdminState`) and screens read only through the repositories. The only
  files that still touch `src/lib/mock*` are the mock adapters.
- **Initial schema** — `supabase/migrations/0001_init.sql`
  - orders / order_items / order_item_modifiers defined first, then the catalog
    tables, with cross-table foreign keys attached last

```mermaid
flowchart LR
  Screens[Screens and Hooks] --> Repos[Repositories]
  Repos --> MockAdapter[Mock Adapter]
  Repos -. later .-> SupabaseAdapter[Supabase Adapter]
  Repos -. later .-> FutureApiAdapter[Future API Adapter]
```

## Rollout sequence

### Step 0 — Order model review (do this first)
- Review `src/domain/orders.ts` and the `orders` section of
  `supabase/migrations/0001_init.sql` together.
- Confirm lifecycle states, kitchen states, payment states, money fields, and
  timestamp milestones match how the business actually operates.
- Treat this as a contract: changing it later is expensive.

### Step 1 — Supabase foundation
- Create the Supabase project (dev + prod) and run `0001_init.sql`.
- Add `src/lib/supabase/client.ts` reading `EXPO_PUBLIC_SUPABASE_URL` and
  `EXPO_PUBLIC_SUPABASE_ANON_KEY` from env (do not commit secrets).
- Add `@supabase/supabase-js` as a dependency at this step (not before).

### Step 2 — Catalog reads
- Implement a Supabase menu adapter behind `MenuRepository`.
- Swap `menuRepository` in `src/repositories/index.ts` (or select by env).
- Map DB rows → canonical `Catalog` → view types using the existing mappers.
- Keep cart / order submission local until reads are stable.

### Step 3 — Order writes
- Add write methods to `OrdersRepository` (create order from the current cart).
- Persist submitted orders; read the Orders list/detail from Supabase.
- Update the POS `placeOrder` flow to call the repository instead of only
  resetting local state.

### Step 4 — Admin mutations
- Back `AdminRepository` edits (field updates, add item, publish, stock) with
  Supabase writes.
- Introduce auth + Row Level Security here (store-scoped policies, `staff_id`
  FK, session handling), since mutations are the point that needs permissions.

## Stays local in Phase 3 (even after the backend begins)

- in-progress cart state and selected-modifier UI state (`usePosState`)
- theme preview state (`UiSettingsScreen`)
- transient action-feedback strings (order detail, admin)

## Moves to Supabase (in order)

1. menu categories, items, modifiers (catalog reads)
2. submitted orders (order writes)
3. admin menu edits (mutations, with auth/RLS)

## Guardrails

- Screens/hooks must keep importing from `@/repositories`, never from
  `@/lib/mock*` or `@/lib/supabase/*` directly.
- Money stays numeric end-to-end; formatting happens only at render via
  `@/domain/money`.
- Never store UI-derived text (`"$13.50"`, `"2 min ago"`) as canonical data.
- Adding a `FutureApiAdapter` (custom Node backend) later only means writing new
  adapters against the same repository interfaces.
