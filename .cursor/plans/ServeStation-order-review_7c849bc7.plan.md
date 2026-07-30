---
name: tablecraft-order-review
overview: "Review and finalize Tablecraft’s order contract before Supabase integration: local-only carts, a simple staff workflow, and deferred payment/refund features."
todos:
  - id: order-workflow-contract
    content: Lock the simple submitted → preparing → ready → completed/cancelled state contract and timestamps
    status: completed
  - id: order-domain-schema-align
    content: Align canonical order domain types and initial SQL schema to the approved first-release workflow
    status: completed
  - id: order-integrity-rules
    content: Add order money, queue, and transition integrity rules to the persistence design
    status: completed
  - id: order-repository-contract
    content: Define intentional repository operations for creation, queue reads, transitions, and cancellation
    status: completed
  - id: order-mapper-test-plan
    content: Reconcile order view mappers and document lifecycle acceptance tests before Supabase integration
    status: completed
isProject: false
---

# ServeStation Order Model Review Plan

## Confirmed First-Release Rules

- Carts remain device-local. No `draft` order is persisted to Supabase.
- Supabase receives an order only when staff presses `Place order`.
- Staff use a simple operational flow: `submitted → preparing → ready → completed`.
- Payments and refunds are deferred to a later backend phase. No payment processor or refund workflow is implemented now.

## Goal

Turn the existing order-first model into a reviewed, enforceable contract before adding Supabase client code. The order schema should represent operational truth and history, while the UI derives labels and relative timestamps.

## 1. Simplify and Lock the First-Release State Model

Review [src/domain/orders.ts](c:\Users\arpan\IdeaProjects\nativeDevlopment\ServeStation\src\domain\orders.ts) and [supabase/migrations/0001_init.sql](c:\Users\arpan\IdeaProjects\nativeDevlopment\ServeStation\supabase\migrations\0001_init.sql) together.

Align the first-release status contract to:

```text
submitted → preparing → ready → completed
                     ↘ cancelled
```

Planned changes:

- replace or map the current detailed lifecycle (`draft`, `accepted`, `in_progress`) to the approved simple workflow
- remove `draft` from persisted order lifecycle values because carts remain local
- use one clear kitchen-facing status representation for this release, avoiding two overlapping UI state machines
- retain `cancelled` as a terminal operational state, with `cancellation_reason`
- define valid transitions in code/documentation so invalid moves such as `completed → preparing` cannot be written accidentally

## 2. Define the Canonical Order Contract

Finalize the app-owned `Order` aggregate before any database adapter is built.

Keep:

- UUID order id and store-scoped human-readable order number
- fulfilment type (`dine_in`, `pickup`, `delivery`)
- customer name and destination label as optional ticket fields
- raw numeric subtotal, tax, discount, and total
- order-level note plus per-line note
- order item name and unit-price snapshots
- modifier snapshots and price deltas
- stable catalog references as optional soft links

For first release, define timestamps around actual workflow milestones:

- `created_at` / `submitted_at`
- `preparing_at`
- `ready_at`
- `completed_at`
- `cancelled_at`

Do not persist view strings such as formatted currency, “Open”, or “2 min ago”; derive them in mappers/UI.

## 3. Explicitly Defer Payment and Refund Design

Keep the schema migration forward-compatible, but do not expose payment/refund behavior in the first live flow.

- keep payment fields nullable/defaulted as infrastructure placeholders only, or move them to a later migration if they create confusion
- do not build payment mutations, payment references, refund actions, or refund history yet
- document the future extension path:
  - `payments` table for processor/cash records
  - `refunds` or `order_adjustments` table for append-only partial refund history
  - payment/refund events joined to the final order ID

This avoids pretending that a `refund_total` column is a complete refund implementation.

## 4. Harden Order Integrity in SQL

Update [supabase/migrations/0001_init.sql](c:\Users\arpan\IdeaProjects\nativeDevlopment\ServeStation\supabase\migrations\0001_init.sql) after the review decisions are accepted.

Add or refine:

- non-negative checks for money fields
- consistency check for `total = subtotal + tax - discount` in the payment-deferred release
- order item `unit_price >= 0` and modifier `price_delta` rules appropriate for your catalog
- a store/order-number uniqueness strategy that works before multi-store/auth arrives
- indexes for the actual operational queries:
  - store + status + created date
  - ready/preparing order queues
  - order item lookup by order id
- SQL-safe transition enforcement, either through a database function/RPC or a guarded repository mutation strategy; do not allow arbitrary status edits from the UI

## 5. Define Repository Operations Before Supabase Queries

Extend [src/repositories/types.ts](c:\Users\arpan\IdeaProjects\nativeDevlopment\ServeStation\src\repositories\types.ts) with order operations that reflect the reviewed contract rather than raw database methods.

First-release repository operations:

- create a submitted order from the local cart snapshot
- list active orders for a store
- get one order with items/modifiers
- transition an order only along approved paths
- cancel an eligible order with a reason
- list completed/cancelled historical orders

Do not expose generic `updateOrder(anyFields)` APIs; the repository should make invalid lifecycle changes hard to express.

## 6. Reconcile View Models and Mappers

Update the order mappers and existing POS/Orders view types only after the canonical contract is locked.

Relevant files:

- [src/mappers/orderMappers.ts](c:\Users\arpan\IdeaProjects\nativeDevlopment\ServeStation\src\mappers\orderMappers.ts)
- [src/types/orders.ts](c:\Users\arpan\IdeaProjects\nativeDevlopment\ServeStation\src\types\orders.ts)
- [src/hooks/usePosState.ts](c:\Users\arpan\IdeaProjects\nativeDevlopment\ServeStation\src\hooks\usePosState.ts)
- [src/hooks/useOrdersState.ts](c:\Users\arpan\IdeaProjects\nativeDevlopment\ServeStation\src\hooks\useOrdersState.ts)

Ensure the UI derives:

- Open/Closed queues from lifecycle status
- `Preparing` / `Ready` labels from the canonical workflow
- timing text from timestamps
- totals from numeric money values

## 7. Produce a Review Artifact and Test Cases

Create a short order-lifecycle document alongside the code that includes:

- the approved state-transition diagram
- allowed and rejected transitions
- what each timestamp means
- what gets snapshotted at submission time
- what is deliberately deferred (payments, refunds, customer notifications)

Add focused tests for:

- a cart becoming a submitted order with item/modifier snapshots
- each valid workflow transition
- rejected transitions
- cancelled order behavior
- historical prices staying unchanged after a catalog price edit
- numeric total integrity

## Acceptance Criteria

- A developer can explain the exact lifecycle of every persisted order without relying on UI text.
- An order cannot be persisted as a draft.
- A staff member can move an order through Submitted, Preparing, Ready, Completed, or Cancelled only through valid transitions.
- Catalog edits cannot alter an already submitted order’s line names, prices, or modifiers.
- Payment/refund code is absent from the first live flow but has a documented, non-breaking future path.
- The domain model, repository contract, and SQL migration describe the same order behavior.

