# Order Lifecycle — Contract

This is the reviewed, locked contract for how a ServeStation order behaves. It is
the single source of truth shared by artifacts that must always agree:

- **Domain model & logic:** [`src/domain/orders.ts`](../src/domain/orders.ts)
- **Persistence:** [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql)
  + [`0003_order_open_paid.sql`](../supabase/migrations/0003_order_open_paid.sql)
- **Data boundary:** [`src/repositories/types.ts`](../src/repositories/types.ts)

The presentation view types in `src/types/orders.ts` are **derived** from this
contract via [`src/mappers/orderMappers.ts`](../src/mappers/orderMappers.ts) and
never define order truth.

> **Simplified in Phase 3, Step 7.** The kitchen workflow
> (`submitted → preparing → ready → completed`) is intentionally **not** modelled
> yet. The status is a minimal, payment-driven `open`/`paid`/`cancelled`. The
> richer kitchen states can be reintroduced later without changing the money or
> snapshot rules below.

---

## Confirmed rules

- Carts are **device-local**. A `draft` order is **never** persisted.
- An order is created only when staff act on the cart:
  - **Save** → creates an `open` (unpaid) order in the **Open** queue.
  - **Charge** → creates a `paid` (closed) order directly in the **Closed** queue.
- There is exactly **one status** per order.
- An `open` order can later be **marked paid** or **cancelled**.
- `paid` here means "closed by payment". A richer payments/refunds model
  (dedicated tables) is still deferred (see below).

---

## State machine

```text
        ┌─────────▶ paid       (terminal)
open ───┤
        └─────────▶ cancelled  (terminal)
```

An order also enters directly as `paid` when created via **Charge**.

### Allowed transitions

| From        | Allowed to           |
| ----------- | -------------------- |
| `open`      | `paid`, `cancelled`  |
| `paid`      | — (terminal)         |
| `cancelled` | — (terminal)         |

### Rejected transitions (examples)

- `paid → cancelled` / `cancelled → paid` (no revival of terminal orders)
- `open → open` (a status cannot transition to itself)

Enforced in two places that must stay in sync:

- Code: `canTransitionOrder` / `transitionOrder` / `markOrderPaid` / `cancelOrder`
  (throws `OrderTransitionError`).
- Database: `apply_order_status_transition(order_id, new_status, reason)` — the
  UI must call this (or an RPC wrapping it) rather than issuing arbitrary
  `UPDATE`s.

### Queues

- **Open** queue = `open` (`OPEN_ORDER_STATUSES`).
- **Closed**/history queue = `paid`, `cancelled` (`CLOSED_ORDER_STATUSES`).

---

## Timestamps

Only reached milestones are set; the rest stay `undefined`/`NULL`. All relative
phrasing ("2 min ago") is computed in the UI, never stored.

| Field         | Meaning                                        |
| ------------- | ---------------------------------------------- |
| `createdAt`   | Row created (the moment the order was placed)  |
| `updatedAt`   | Last mutation of the order                     |
| `paidAt`      | Moved to `paid` (or created paid via Charge)   |
| `cancelledAt` | Moved to `cancelled`                           |

`TIMESTAMP_FIELD_FOR_STATUS` is a **partial** map (only the terminal statuses
carry a milestone timestamp; an `open` order is timed by `createdAt`). The SQL
function stamps the same columns.

---

## What is snapshotted at creation

Line items and modifiers are **snapshots** so later catalog edits never rewrite
history:

- `OrderItem.nameSnapshot`, `OrderItem.unitPrice` (excludes modifier deltas)
- `OrderItem.quantity`, optional `OrderItem.note`
- `OrderItemModifier.label`, `OrderItemModifier.priceDelta`
- optional soft links: `menuItemId`, `modifierOptionId`

Money is computed once at creation and stored as raw numbers with the invariant:

```text
total = subtotal + tax - discount
```

(`computeOrderMoney` guarantees this in code; a `CHECK` constraint enforces it in
SQL.)

---

## Deliberately deferred

- **Kitchen workflow** (`preparing`/`ready`) → can be reintroduced as extra
  statuses between `open` and `paid` without changing money/snapshot rules.
- **Payments** → future dedicated `payments` table linked to `orders.id`. The
  current `paid` status is a coarse "closed by payment" flag, not a payment
  record; do not re-add `payment_reference`-style columns to `orders`.
- **Refunds** → future append-only `refunds` / `order_adjustments` history.
- **Customer notifications** → future `order_events` / notification table.
- **Auth / RLS** → `profiles` + store-scoped policies.

---

## Repository operations

The `OrdersRepository` interface exposes only intentional operations — there is
no generic `updateOrder(anyFields)`. All reads are async (the Supabase adapter
fetches over the network):

- `createOrder(input)` — order from a local cart snapshot; `input.paid` decides
  `open` vs `paid`
- `getActiveOrders(storeId?)` — Open queue (`open`)
- `getOrderHistory(storeId?)` — Closed queue (`paid` / `cancelled`)
- `getCanonicalOrderById(id)` — one order with items/modifiers
- `markOrderPaid(id)` — `open → paid`
- `cancelOrder(id, reason)` — `open → cancelled` with a reason

---

## Acceptance tests

These behaviors are verified by runnable tests in
[`src/domain/orders.test.ts`](../src/domain/orders.test.ts), which exercise the
pure helpers in `src/domain/orders.ts` (no backend, no React Native). Run them
with:

```bash
npm test          # one-shot run
npm run test:watch # re-run on change
```

The setup is intentionally lightweight: Node's built-in `node:test` runner
executed through `tsx` (no Jest/Expo test config). The cases are:

1. **Cart → open order snapshot** — `createOrder` returns `status === "open"`
   (no `paidAt`), sets `createdAt`, and copies each line's name/unit price and
   every modifier label/`priceDelta` into snapshots.
2. **Charge → paid order** — `createOrder({ paid: true })` returns
   `status === "paid"`, stamps `paidAt`, and lands in the Closed queue.
3. **Money integrity** — for any input, `computeOrderMoney` yields
   `total === roundMoney(subtotal + tax - discount)` and all amounts `>= 0`.
4. **Valid transition** — `open → paid` succeeds and stamps `paidAt`, preserving
   `createdAt`.
5. **Rejected transitions** — `transitionOrder` throws for moves out of a
   terminal status and for `open → open`.
6. **Cancellation** — `cancelOrder(order, reason)` from `open` yields
   `status === "cancelled"`, sets `cancelledAt`, and records
   `cancellationReason`; cancelling a `paid`/`cancelled` order throws.
7. **Historical price immutability** — after editing a catalog item's price, a
   previously placed order's snapshots are unchanged.
8. **Queue derivation** — `orderStatusTab` returns `open` for `open` and
   `closed` for `paid`/`cancelled`.

---

## Acceptance criteria (met)

- The exact lifecycle of every persisted order is explainable without UI text.
- An order cannot be persisted as a draft (`open`/`paid` are the entry states).
- Staff can only move an order through valid transitions (code + SQL guard).
- Catalog edits cannot alter an already-placed order's lines/prices/modifiers.
- The domain model, repository contract, and SQL migrations describe the same
  order behavior.
