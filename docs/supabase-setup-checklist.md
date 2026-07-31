# Supabase Setup Checklist

This is the simple, practical sequence for moving ServeStation from mock data to
Supabase. Complete each step in order. The existing
[Phase 3 rollout guide](./phase-3-supabase-rollout.md) explains the
architecture behind these steps in more detail.

## Current position

Steps 1–6 are done and verified (catalog + order creation persist to Supabase).
Step 7 code (Orders list/detail reads + the simplified `open`/`paid`/`cancelled`
model) is in place and needs its migration run.

**Next step: run `0003_order_open_paid.sql` (see Step 7).**

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

## 5. Connect catalog reads — code complete, seed pending

Implemented in code:

- Supabase-backed menu adapter at
  `src/repositories/adapters/supabase/menuSupabaseRepository.ts`.
- `MenuRepository` catalog reads are now async; `usePosState` loads the catalog
  via the new `src/hooks/useCatalog.ts`, and the POS screen shows
  loading / error (with retry) / empty states.

**You still need to seed the database (once):**

1. Open the Supabase **SQL Editor**.
2. Run the entire contents of
   [`supabase/seeds/0001_catalog_seed.sql`](../supabase/seeds/0001_catalog_seed.sql).
   It is safe to re-run.
3. Restart Expo with a cleared cache so `.env.local` is picked up:
   `npm run dev:clear`.
4. Confirm categories, products, prices, and modifiers load from Supabase.

The cart remains device-local at this stage.

## 6. Connect order creation — code complete, migration pending

Implemented in code:

- Cart lines now retain base price + structured modifiers, so orders snapshot
  them faithfully (`src/types/pos.ts`, `usePosState`).
- `OrdersRepository.createOrder` is async; a Supabase orders adapter
  (`src/repositories/adapters/supabase/ordersSupabaseRepository.ts`) persists
  the order via an atomic `create_order` RPC (order + items + modifiers in one
  transaction). Reads still use mock data until Step 7.
- POS **Place order** builds `OrderCreateInput` from the cart, persists it, then
  clears the cart. The cart shows placing / success / error states.

**You still need to run the new migration (once):**

1. Open the Supabase **SQL Editor**.
2. Run the entire contents of
   [`supabase/migrations/0002_create_order.sql`](../supabase/migrations/0002_create_order.sql).
3. Restart Expo (`npm run dev:clear`), add items, and press **Place order**.
4. Verify a new row appears in the `orders` table (with `order_items` and
   `order_item_modifiers`) and that its `status` is `submitted`.

Note: the placed order persists to Supabase, but the **Orders list still shows
mock data** until Step 7 connects those reads.

## 7. Connect Orders list and detail — code complete, migration pending

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

**You still need to run the new migration (once):**

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

## 8. Add authentication and RLS — we implement together

1. Decide the staff sign-in experience and roles.
2. Add Supabase Auth and a staff/profile model.
3. Enable Row Level Security.
4. Add store-scoped policies for catalog reads and order operations.
5. Test using a normal staff account, not a service key.

This must be in place before live Admin editing.

## 9. Connect Admin mutations — we implement this

1. Build a Supabase-backed `AdminRepository`.
2. Persist category/item/modifier edits and availability changes.
3. Apply the authenticated staff/RLS policies.
4. Verify menu edits are reflected in the POS catalog without changing
   submitted-order snapshots.

---

## What to do now

Steps 5 and 6 are verified. The Step 7 code is in place. To finish Step 7:

1. Run [`supabase/migrations/0003_order_open_paid.sql`](../supabase/migrations/0003_order_open_paid.sql)
   in the Supabase SQL Editor (after `0001` and `0002`).
2. Restart Expo with `npm run dev:clear`.
3. In the POS cart, try **Save** (creates an Open order) and **Charge** (creates
   a Closed/paid order).
4. Open the **Orders** screen and confirm the orders show under the **Open** and
   **Closed** tabs; open an Open order and try **Mark as paid** / **Cancel order**.

If anything fails, the UI shows the error message; share it and we can debug.

Do **not** share the database password or `service_role` key.
