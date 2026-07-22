/**
 * Runnable acceptance tests for the locked order lifecycle contract.
 *
 * These exercise the pure domain helpers in `./orders` (no backend, no React
 * Native), one test per case listed in docs/order-lifecycle.md. Run with
 * `npm test` (Node's built-in test runner via tsx).
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { roundMoney } from "./money";
import {
  cancelOrder,
  canTransitionOrder,
  computeOrderMoney,
  createSubmittedOrder,
  OrderTransitionError,
  orderStatusTab,
  transitionOrder,
  type OrderCreateInput,
  type OrderStatus,
} from "./orders";

/** Build a representative two-line cart input for reuse across tests. */
function sampleInput(overrides: Partial<OrderCreateInput> = {}): OrderCreateInput {
  return {
    orderNumber: "A-1001",
    fulfilmentType: "dine_in",
    customerName: "Alex",
    destinationLabel: "Table 14",
    taxRate: 0.08,
    items: [
      {
        menuItemId: "item-smash",
        nameSnapshot: "Smash Burger",
        unitPrice: 12,
        quantity: 2,
        modifiers: [
          { modifierOptionId: "mod-cheese", label: "Extra cheese", priceDelta: 1.5 },
        ],
      },
      {
        menuItemId: "item-fries",
        nameSnapshot: "Fries",
        unitPrice: 4,
        quantity: 1,
        modifiers: [],
      },
    ],
    ...overrides,
  };
}

/** Deterministic creation options so ids/timestamps are stable in assertions. */
const CREATE_OPTS = {
  id: "order-1",
  now: "2026-01-01T10:00:00.000Z",
  makeItemId: (index: number) => `order-1-line-${index}`,
} as const;

describe("order lifecycle contract", () => {
  it("1. turns a cart into a submitted order with item/modifier snapshots", () => {
    const order = createSubmittedOrder(sampleInput(), CREATE_OPTS);

    assert.equal(order.status, "submitted");
    assert.equal(order.timestamps.submittedAt, CREATE_OPTS.now);
    assert.equal(order.timestamps.createdAt, CREATE_OPTS.now);

    // Line + modifier values are snapshotted onto the order.
    assert.equal(order.items.length, 2);
    assert.equal(order.items[0].nameSnapshot, "Smash Burger");
    assert.equal(order.items[0].unitPrice, 12);
    assert.equal(order.items[0].quantity, 2);
    assert.equal(order.items[0].modifiers[0].label, "Extra cheese");
    assert.equal(order.items[0].modifiers[0].priceDelta, 1.5);
    assert.equal(order.items[0].menuItemId, "item-smash");
  });

  it("2. keeps money self-consistent (total = subtotal + tax - discount, all >= 0)", () => {
    const cases: { taxRate?: number; discount?: number }[] = [
      { taxRate: 0.08 },
      { taxRate: 0.08, discount: 2 },
      { taxRate: 0, discount: 0 },
      { taxRate: 0.15, discount: 5.25 },
    ];

    for (const opts of cases) {
      const money = computeOrderMoney(sampleInput().items, opts);
      assert.equal(money.total, roundMoney(money.subtotal + money.tax - money.discount));
      assert.ok(money.subtotal >= 0);
      assert.ok(money.tax >= 0);
      assert.ok(money.discount >= 0);
      assert.ok(money.total >= 0);
    }

    // Concrete check: 2×(12+1.5) + 1×4 = 31 subtotal, 8% tax = 2.48, -2 discount.
    const money = computeOrderMoney(sampleInput().items, { taxRate: 0.08, discount: 2 });
    assert.equal(money.subtotal, 31);
    assert.equal(money.tax, 2.48);
    assert.equal(money.total, 31.48);
  });

  it("3. allows submitted → preparing → ready → completed and stamps timestamps", () => {
    const submitted = createSubmittedOrder(sampleInput(), CREATE_OPTS);

    const preparing = transitionOrder(submitted, "preparing", "2026-01-01T10:05:00.000Z");
    assert.equal(preparing.status, "preparing");
    assert.equal(preparing.timestamps.preparingAt, "2026-01-01T10:05:00.000Z");

    const ready = transitionOrder(preparing, "ready", "2026-01-01T10:10:00.000Z");
    assert.equal(ready.status, "ready");
    assert.equal(ready.timestamps.readyAt, "2026-01-01T10:10:00.000Z");

    const completed = transitionOrder(ready, "completed", "2026-01-01T10:15:00.000Z");
    assert.equal(completed.status, "completed");
    assert.equal(completed.timestamps.completedAt, "2026-01-01T10:15:00.000Z");

    // Earlier milestones remain intact through the chain.
    assert.equal(completed.timestamps.preparingAt, "2026-01-01T10:05:00.000Z");
    assert.equal(completed.timestamps.readyAt, "2026-01-01T10:10:00.000Z");
  });

  it("4. rejects invalid transitions", () => {
    const submitted = createSubmittedOrder(sampleInput(), CREATE_OPTS);
    const ready = transitionOrder(
      transitionOrder(submitted, "preparing"),
      "ready"
    );
    const completed = transitionOrder(ready, "completed");
    const cancelled = cancelOrder(submitted, "changed mind");

    assert.throws(() => transitionOrder(completed, "preparing"), OrderTransitionError);
    assert.throws(() => transitionOrder(cancelled, "ready"), OrderTransitionError);
    assert.throws(() => transitionOrder(submitted, "completed"), OrderTransitionError);
    assert.throws(() => transitionOrder(ready, "submitted"), OrderTransitionError);

    // And the guard predicate agrees with the throwing helper.
    assert.equal(canTransitionOrder("completed", "preparing"), false);
    assert.equal(canTransitionOrder("submitted", "preparing"), true);
  });

  it("5. cancels an eligible order and records the reason; terminal orders cannot be cancelled", () => {
    const submitted = createSubmittedOrder(sampleInput(), CREATE_OPTS);

    const cancelled = cancelOrder(submitted, "out of stock", "2026-01-01T10:03:00.000Z");
    assert.equal(cancelled.status, "cancelled");
    assert.equal(cancelled.timestamps.cancelledAt, "2026-01-01T10:03:00.000Z");
    assert.equal(cancelled.cancellationReason, "out of stock");

    assert.throws(() => cancelOrder(cancelled, "again"), OrderTransitionError);
  });

  it("6. keeps historical prices unchanged after a later catalog price edit", () => {
    // Simulate a mutable catalog item the cart is built from.
    const catalogItem = { id: "item-smash", name: "Smash Burger", price: 12 };
    const order = createSubmittedOrder(
      sampleInput({
        items: [
          {
            menuItemId: catalogItem.id,
            nameSnapshot: catalogItem.name,
            unitPrice: catalogItem.price,
            quantity: 1,
            modifiers: [],
          },
        ],
      }),
      CREATE_OPTS
    );

    // Later, the catalog price changes.
    catalogItem.price = 99;

    // The submitted order's snapshot is unaffected.
    assert.equal(order.items[0].unitPrice, 12);
    assert.equal(order.money.subtotal, 12);
  });

  it("7. derives Open/Closed queues from status", () => {
    const open: OrderStatus[] = ["submitted", "preparing", "ready"];
    const closed: OrderStatus[] = ["completed", "cancelled"];

    for (const status of open) assert.equal(orderStatusTab(status), "open");
    for (const status of closed) assert.equal(orderStatusTab(status), "closed");
  });
});
