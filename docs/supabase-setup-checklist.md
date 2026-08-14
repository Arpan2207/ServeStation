# Supabase Setup Checklist

This is the simple, practical sequence for moving ServeStation from mock data to
Supabase. Complete each step in order. The existing
[Phase 3 rollout guide](./phase-3-supabase-rollout.md) explains the
architecture behind these steps in more detail.

## Current position

Steps 1–8 are complete. Step 9 code is implemented; its Admin mutation migration
must now be applied and verified in Supabase.

**Next step: run `0005_admin_catalog_mutations.sql` and test an Admin edit.**

---

## 1. Review the order model — complete (simplified in Step 7)

- The order status is now the minimal, payment-driven model:
  `open` (saved/unpaid) → Open queue; `paid` and `cancelled` → Closed queue.
- Carts remain local; a database order is created only when staff **Save** or
  **Charge** the cart.
- The kitchen workflow (`preparing`/`ready`) and a richer payments/refunds model
  are intentionally deferred.
- Reference: [Order lifecycle contract](./order-lifecycle.md).

## 2. Create a Supabase project — you do this

1. Go to [Supabase Dashboard](https://supabase.com/dashboard).
2. Create a new project for ServeStation.
3. Choose a nearby region and save the database password securely.
4. Wait for the project to finish provisioning.

Do not share the database password with the app or commit it to the repository.

## 3. Run the initial migration — you do this

1. In the Supabase project, open **SQL Editor**.
2. Create a new query.
3. Copy the entire contents of
   [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql).
4. Run it once.
5. Confirm that the Tables section shows `stores`, `orders`, `order_items`,
   `order_item_modifiers`, and the menu/modifier tables.

The migration creates the `apply_order_status_transition` database function.
Future order-status changes must use that function instead of direct updates.

## 4. Add the Supabase client — complete

- Installed `@supabase/supabase-js`.
- Public values live in `.env.local` (`EXPO_PUBLIC_SUPABASE_URL`,
  `EXPO_PUBLIC_SUPABASE_ANON_KEY`); `.env.example` documents them without values.
- Added a lazily-created client at `src/lib/supabase/client.ts`
  (`getSupabaseClient()`), used only by repository adapters.
- Adapter selection is automatic: when the two env values are present the app
  uses Supabase; otherwise it falls back to mock data.

Never use or place the Supabase `service_role` key in the React Native app.

## 5. Connect catalog reads — complete

Implemented in code:

- Supabase-backed menu adapter at
  `src/repositories/adapters/supabase/menuSupabaseRepository.ts`.
- `MenuRepository` catalog reads are now async; `usePosState` loads the catalog
  via the new `src/hooks/useCatalog.ts`, and the POS screen shows
  loading / error (with retry) / empty states.

**Completed setup:**

1. Open the Supabase **SQL Editor**.
2. Run the entire contents of
   [`supabase/seeds/0001_catalog_seed.sql`](../supabase/seeds/0001_catalog_seed.sql).
   It is safe to re-run.
3. Restart Expo with a cleared cache so `.env.local` is picked up:
   `npm run dev:clear`.
4. Confirm categories, products, prices, and modifiers load from Supabase.

The cart remains device-local at this stage.

## 6. Connect order creation — complete

Implemented in code:

- Cart lines now retain base price + structured modifiers, so orders snapshot
  them faithfully (`src/types/pos.ts`, `usePosState`).
- `OrdersRepository.createOrder` is async; a Supabase orders adapter
  (`src/repositories/adapters/supabase/ordersSupabaseRepository.ts`) persists
  the order via an atomic `create_order` RPC (order + items + modifiers in one
  transaction). Reads still use mock data until Step 7.
- POS **Place order** builds `OrderCreateInput` from the cart, persists it, then
  clears the cart. The cart shows placing / success / error states.

**Completed setup:**

1. Open the Supabase **SQL Editor**.
2. Run the entire contents of
   [`supabase/migrations/0002_create_order.sql`](../supabase/migrations/0002_create_order.sql).
3. Restart Expo (`npm run dev:clear`), add items, and press **Place order**.
4. Verify a new row appears in the `orders` table (with `order_items` and
   `order_item_modifiers`) and that its `status` is `submitted`.

Note: the placed order persists to Supabase, but the **Orders list still shows
mock data** until Step 7 connects those reads.

## 7. Connect Orders list and detail — complete

The order status model was **simplified** in this step (see
[Order lifecycle contract](./order-lifecycle.md)). The kitchen workflow
(`submitted → preparing → ready`) is dropped for now in favour of:

- **Save** in the POS cart → an `open` (unpaid) order in the **Open** queue.
- **Charge** in the POS cart → a `paid` (closed) order in the **Closed** queue.
- On the Order detail screen, an open order can be **Marked as paid** or
  **Cancelled** (both move it to the Closed queue).

Implemented in code:

- The Supabase `OrdersRepository` now reads both queues (Open = `open`,
  Closed = `paid`/`cancelled`) and a single order with its items + modifiers,
  and routes `markOrderPaid` / `cancelOrder` through the guarded
  `apply_order_status_transition` RPC.
- Orders list/detail reads are now async (loading / error / empty states); the
  list re-fetches on focus so newly placed orders appear.
- UI labels, timing text, and currency formatting are derived in the mappers/UI.

**Completed setup:**

1. Open the Supabase **SQL Editor**.
2. Run the entire contents of
   [`supabase/migrations/0003_order_open_paid.sql`](../supabase/migrations/0003_order_open_paid.sql).
   It rewrites the `order_status` enum to `('open', 'paid', 'cancelled')`,
   remaps any existing rows (`completed → paid`), reworks the timestamp columns,
   and replaces the `create_order` / `apply_order_status_transition` functions.
3. Restart Expo (`npm run dev:clear`).
4. In the POS cart, use **Save** and **Charge** and confirm the orders appear in
   the **Open** and **Closed** tabs respectively; open an Open order and try
   **Mark as paid** / **Cancel order**.

Note: because the enum values change, `0003` must be run after `0001`/`0002`.
Any orders placed earlier as `submitted` become `open` after the migration.

## 8. Add authentication and RLS — complete

Implemented in code:

- Email/password staff sign-in with persistent native sessions.
- `owner`, `manager`, and `cashier` staff roles.
- An app-owned Auth repository/provider and protected Expo Router routes.
- A responsive sign-in screen and Profile settings sign-out action.
- `staff_profiles`, store-scoped RLS, read-only Data API privileges, and guarded
  authenticated order RPCs in `supabase/migrations/0004_auth_and_rls.sql`.
- Order creation records the authenticated user in `orders.staff_id`.

**Completed setup:**

1. Run all of
   [`supabase/migrations/0004_auth_and_rls.sql`](../supabase/migrations/0004_auth_and_rls.sql)
   in SQL Editor after migrations `0001`–`0003`.
2. Create an email/password user in **Authentication → Users**.
3. Link that Auth user to the seeded store with a `staff_profiles` row.
4. Restart with `npm run dev:clear`, sign in, and test catalog/order access.
5. Follow [Supabase Auth and RLS Setup](./supabase-auth-rls-testing.md), including
   the cross-store isolation test. Use a normal staff account, not a service key.

There is no public staff sign-up. Trusted operators create Auth users and assign
their store/role; Step 9 can later add an owner-only staff-management surface.

This must be in place before live Admin editing.

## 9. Connect Admin mutations — code complete, setup pending

Implemented in code:

- A Supabase-backed `AdminRepository` loads draft and visible catalog data and
  persists category creation/deletion, draft item creation, item publishing,
  availability, and up to six custom modifier options.
- Owner/manager mutation policies remain scoped to the authenticated staff
  store. Cashiers retain catalog reads but cannot mutate catalog rows.
- Category deletion and modifier replacement use guarded transactional RPCs.
  Catalog foreign keys keep existing order name/price/modifier snapshots intact.
- The POS catalog invalidates and reloads whenever the POS screen regains focus,
  so newly published Admin changes are shown without restarting the app.

**You still need to configure Supabase (once):**

1. Run all of
   [`supabase/migrations/0005_admin_catalog_mutations.sql`](../supabase/migrations/0005_admin_catalog_mutations.sql)
   in SQL Editor after migration `0004`.
2. Sign in as an `owner` or `manager`, open **Settings → Admin options**, and:
   create a category/item, edit its name/description/price, press
   **Save & publish**, change availability, and save modifier options.
3. Return to the POS screen and confirm the published item, price, availability,
   and modifiers reflect the Admin changes.
4. Open an order placed before the edit and confirm its snapshotted item name,
   price, and modifiers did not change.
5. Sign in as a `cashier` and confirm the Admin workspace is denied and direct
   catalog mutations are rejected by RLS.

---

## What to do now

1. Run
   [`supabase/migrations/0005_admin_catalog_mutations.sql`](../supabase/migrations/0005_admin_catalog_mutations.sql).
2. Restart Expo with `npm run dev:clear` and sign in as an owner or manager.
3. Complete the Step 9 Admin → POS → historical-order verification above.

If anything fails, share the exact UI or SQL error and we can debug it.

Do **not** share the database password or `service_role` key.
