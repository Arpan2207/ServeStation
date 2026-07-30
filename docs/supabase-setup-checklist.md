# Supabase Setup Checklist

This is the simple, practical sequence for moving Tablecraft from mock data to
Supabase. Complete each step in order. The existing
[Phase 3 rollout guide](./phase-3-supabase-rollout.md) explains the
architecture behind these steps in more detail.

## Current position

The order model, SQL migration file, repository interfaces, and order lifecycle
tests are ready. The app still runs entirely from mock repositories.

**Next step: create the Supabase project.**

---

## 1. Review the order model — complete

- The order lifecycle is locked as:
  `submitted → preparing → ready → completed`, with `cancelled` available from
  each active status.
- Carts remain local; a database order is created only after staff press
  **Place order**.
- Payments and refunds are intentionally deferred.
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

## 7. Connect Orders list and detail — we implement this

1. Build a Supabase-backed `OrdersRepository`.
2. Read active orders (`submitted`, `preparing`, `ready`) and closed history
   (`completed`, `cancelled`) from Supabase.
3. Derive UI labels, timing text, and currency formatting in mappers/UI.
4. Route status changes through `apply_order_status_transition`.

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

Step 5 is verified (catalog loads from Supabase). The Step 6 code is in place.
To finish Step 6:

1. Run [`supabase/migrations/0002_create_order.sql`](../supabase/migrations/0002_create_order.sql)
   in the Supabase SQL Editor.
2. Restart Expo with `npm run dev:clear`.
3. Add items to the cart and press **Place order**.
4. Confirm a new `orders` row (status `submitted`) with its `order_items` and
   `order_item_modifiers` appears in Supabase.

If placing fails, the cart shows the error message; share it and we can debug.

Do **not** share the database password or `service_role` key.
