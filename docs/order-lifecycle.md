# Order Lifecycle — First-Release Contract

This is the reviewed, locked contract for how a Tablecraft (ServeStation) order
behaves. It is the single source of truth shared by three artifacts that must
always agree:

- **Domain model & logic:** [`src/domain/orders.ts`](../src/domain/orders.ts)
- **Persistence:** [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql)
- **Data boundary:** [`src/repositories/types.ts`](../src/repositories/types.ts)

The presentation view types in `src/types/orders.ts` are **derived** from this
contract via [`src/mappers/orderMappers.ts`](../src/mappers/orderMappers.ts) and
never define order truth.

---

## Confirmed rules

- Carts are **device-local**. A `draft` order is **never** persisted.
- An order is created only when staff press **Place order**, entering as
  `submitted`.
- There is exactly **one status** per order (no parallel lifecycle + kitchen
  state machines).
- **Payments and refunds are deferred** to a later phase. No payment/refund
  fields exist on the first-release order.

---

## State machine

```text
submitted ──▶ preparing ──▶ ready ──▶ completed   (terminal)
    │             │            │
    └─────────────┴────────────┴────▶ cancelled   (terminal)
```

### Allowed transitions

| From        | Allowed to               |
| ----------- | ------------------------ |
| `submitted` | `preparing`, `cancelled` |
| `preparing` | `ready`, `cancelled`     |
| `ready`     | `completed`, `cancelled` |
| `completed` | — (terminal)             |
| `cancelled` | — (terminal)             |

### Rejected transitions (examples)

- `completed → preparing` (no revival of terminal orders)
- `cancelled → ready` (no revival of terminal orders)
- `submitted → ready` / `submitted → completed` (no skipping steps)
- `ready → submitted` / any backward move

Enforced in two places that must stay in sync:

- Code: `canTransitionOrder` / `transitionOrder` (throws `OrderTransitionError`).
- Database: `apply_order_status_transition(order_id, new_status, reason)` — the
  UI must call this (or an RPC wrapping it) rather than issuing arbitrary
  `UPDATE`s.

### Queues

- **Open** queue = `submitted`, `preparing`, `ready` (`OPEN_ORDER_STATUSES`).
- **Closed**/history queue = `completed`, `cancelled` (`CLOSED_ORDER_STATUSES`).

---

## Timestamps

Only reached milestones are set; the rest stay `undefined`/`NULL`. All relative
phrasing ("2 min ago") is computed in the UI, never stored.

| Field          | Meaning                                     |
| -------------- | ------------------------------------------- |
| `createdAt`    | Row created (equals submission for now)     |
| `updatedAt`    | Last mutation of the order                  |
| `submittedAt`  | Cart placed → order entered as `submitted`  |
| `preparingAt`  | Moved to `preparing`                        |
| `readyAt`      | Moved to `ready`                            |
| `completedAt`  | Moved to `completed`                        |
| `cancelledAt`  | Moved to `cancelled`                        |

`TIMESTAMP_FIELD_FOR_STATUS` maps a target status to the field stamped on entry;
the SQL function stamps the same columns.

---

## What is snapshotted at submission

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

- **Payments** → future dedicated `payments` table linked to `orders.id` (do not
  re-add `payment_status`/`payment_reference` columns to `orders`).
- **Refunds** → future append-only `refunds` / `order_adjustments` history (a
  single `refund_total` column is intentionally avoided).
- **Customer notifications** → future `order_events` / notification table.
- **Auth / RLS** → `profiles` + store-scoped policies.

---

## Repository operations

The `OrdersRepository` interface exposes only intentional operations — there is
no generic `updateOrder(anyFields)`:

- `createOrder(input)` — submitted order from a local cart snapshot
- `getActiveOrders(storeId?)` / `getOrderHistory(storeId?)` — queue reads
- `getCanonicalOrderById(id)` — one order with items/modifiers
- `transitionOrder(id, to)` — approved paths only (throws otherwise)
- `cancelOrder(id, reason)` — cancel an eligible order with a reason

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

1. **Cart → submitted order snapshot**
   - `createSubmittedOrder` returns `status === "submitted"`, sets
     `submittedAt`/`createdAt`, and copies each line's name/unit price and every
     modifier label/`priceDelta` into snapshots.

2. **Money integrity**
   - For any input, `computeOrderMoney` yields
     `total === roundMoney(subtotal + tax - discount)` and all amounts `>= 0`.

3. **Valid transitions**
   - `submitted → preparing → ready → completed` each succeed and stamp the
     matching timestamp (`preparingAt`, `readyAt`, `completedAt`).

4. **Rejected transitions**
   - `transitionOrder` throws `OrderTransitionError` for `completed → preparing`,
     `cancelled → ready`, `submitted → completed`, and `ready → submitted`.

5. **Cancellation**
   - `cancelOrder(order, reason)` from any non-terminal status yields
     `status === "cancelled"`, sets `cancelledAt`, and records
     `cancellationReason`; cancelling a terminal order throws.

6. **Historical price immutability**
   - After editing a catalog item's price, a previously submitted order's
     `nameSnapshot`/`unitPrice`/modifier `priceDelta` are unchanged.

7. **Queue derivation**
   - `orderStatusTab` returns `open` for `submitted`/`preparing`/`ready` and
     `closed` for `completed`/`cancelled`.

---

## Acceptance criteria (met)

- The exact lifecycle of every persisted order is explainable without UI text.
- An order cannot be persisted as a draft (`submitted` is the entry state).
- Staff can only move an order through valid transitions (code + SQL guard).
- Catalog edits cannot alter an already-submitted order's lines/prices/modifiers.
- Payment/refund code is absent but has a documented, non-breaking future path.
- The domain model, repository contract, and SQL migration describe the same
  order behavior.
