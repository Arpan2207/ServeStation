/**
 * Canonical order domain model for ServeStation (Tablecraft).
 *
 * Orders are the highest-risk, longest-lived contract in the product, so this
 * model is defined deliberately and up front — before any Supabase query is
 * written — and it is what the `orders` / `order_items` schema mirrors.
 *
 * FIRST-RELEASE CONTRACT (reviewed & locked — simplified in Phase 3, Step 7):
 *  - Carts stay device-local. A `draft` order is NEVER persisted; an order only
 *    exists once staff act on the cart ("Save" or "Charge").
 *  - The operational status is deliberately minimal for now — the kitchen
 *    workflow (`submitted → preparing → ready`) is intentionally NOT modelled
 *    yet. An order is only ever:
 *        open      → saved but not paid  (lives in the "Open orders" queue)
 *        paid      → paid & closed       (lives in the "Closed orders" queue)
 *        cancelled → voided & closed     (lives in the "Closed orders" queue)
 *  - "Charge" creates an order directly as `paid`; "Save" creates it as `open`.
 *    An `open` order can later be marked `paid` or `cancelled`.
 *  - There is ONE status per order so the queue truth is unambiguous.
 *
 * Design rules:
 *  - all money is numeric ({@link Money}); never store formatted "$" strings
 *  - timestamps are explicit ISO strings so reporting can reconstruct the order
 *    journey without relying on UI phrases like "created 2 min ago"
 *  - line items snapshot name + price at order time so later catalog edits never
 *    rewrite historical orders
 *  - `paid` here means "closed by payment"; a richer payments/refunds model
 *    (dedicated tables) is still deferred (see docs/order-lifecycle.md).
 */

import type { FulfilmentType } from "./fulfilment";
import { roundMoney, type Money } from "./money";

/**
 * The single operational status of an order.
 *
 * `open` is the entry state for a saved (unpaid) order; `paid` and `cancelled`
 * are the two terminal states. There is intentionally no `draft` value because
 * carts are never persisted, and no kitchen states (`preparing`/`ready`) yet.
 */
export type OrderStatus = "open" | "paid" | "cancelled";

/** Statuses that belong to the live/"Open" queue. */
export const OPEN_ORDER_STATUSES: readonly OrderStatus[] = ["open"];

/** Terminal statuses that belong to the "Closed"/history queue. */
export const CLOSED_ORDER_STATUSES: readonly OrderStatus[] = ["paid", "cancelled"];

/**
 * Allowed forward transitions for each status. Any move not listed here is
 * rejected. Terminal states (`paid`, `cancelled`) allow no transitions.
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  open: ["paid", "cancelled"],
  paid: [],
  cancelled: [],
};

/**
 * Map a target status to the timestamp field that must be stamped when an order
 * reaches it. Only the terminal states carry a milestone timestamp (an `open`
 * order is timed by its `createdAt`). Used by both the domain transition helper
 * and the SQL function so code and database agree.
 */
export const TIMESTAMP_FIELD_FOR_STATUS: Partial<
  Record<OrderStatus, keyof OrderTimestamps>
> = {
  paid: "paidAt",
  cancelled: "cancelledAt",
};

/**
 * A modifier applied to an order line, snapshotted at order time.
 * `priceDelta` is captured so historical totals never change if the catalog
 * modifier price is later edited.
 */
export interface OrderItemModifier {
  /** Reference to the catalog modifier option when known. */
  modifierOptionId?: string;
  label: string;
  priceDelta: Money;
}

/**
 * A single line on an order. `menuItemId` references the catalog item when
 * available, but name/price are snapshots so the line is self-contained for
 * reporting and reprints.
 */
export interface OrderItem {
  id: string;
  /** Catalog item reference, if this line maps to a known menu item. */
  menuItemId?: string;
  /** Item name captured at order time. */
  nameSnapshot: string;
  /** Base unit price captured at order time (excludes modifier deltas). */
  unitPrice: Money;
  quantity: number;
  modifiers: OrderItemModifier[];
  /** Optional per-line note / special instruction. */
  note?: string;
}

/**
 * All monetary figures for an order, stored as raw numbers.
 *
 * Invariant:
 *   `total === subtotal + tax - discount`
 * Refund fields are intentionally absent until the payments phase.
 */
export interface OrderMoney {
  subtotal: Money;
  tax: Money;
  discount: Money;
  total: Money;
}

/**
 * Lifecycle timestamps as ISO-8601 strings. Only the milestones an order has
 * actually reached are set; the rest stay undefined. Reporting derives all
 * relative phrasing ("2 min ago") from these instead of storing UI text.
 */
export interface OrderTimestamps {
  createdAt: string;
  updatedAt: string;
  /** Set when the order was paid (entered the `paid` terminal state). */
  paidAt?: string;
  /** Set when the order was cancelled (entered the `cancelled` state). */
  cancelledAt?: string;
}

/**
 * The canonical order aggregate. This is the shape the backend `orders` table
 * (plus `order_items` / `order_item_modifiers`) is designed around.
 */
export interface Order {
  id: string;
  /** Human-friendly order number shown to staff/customers. */
  orderNumber: string;
  /** Owning store; optional until multi-store/auth lands. */
  storeId?: string;
  /** Staff member who created/owns the order; optional until auth lands. */
  staffId?: string;

  fulfilmentType: FulfilmentType;
  /** The single operational status (see {@link OrderStatus}). */
  status: OrderStatus;

  /** Free-text customer name for the ticket (not a full customer record). */
  customerName?: string;
  /** Where the order goes, e.g. "Table 14" / "Pickup" / "Delivery". */
  destinationLabel?: string;

  money: OrderMoney;
  timestamps: OrderTimestamps;
  items: OrderItem[];

  /** Order-level note / special instructions. */
  note?: string;
  /** Reason captured when an order is cancelled. */
  cancellationReason?: string;
}

/**
 * Input required to create an order from a local cart snapshot. This is the
 * ONLY way an order enters the system; there is no persisted draft.
 */
export interface OrderItemInput {
  menuItemId?: string;
  nameSnapshot: string;
  /** Base unit price (excludes modifier deltas), captured at order time. */
  unitPrice: Money;
  quantity: number;
  modifiers: OrderItemModifier[];
  note?: string;
}

/** The cart-derived payload used to create an order. */
export interface OrderCreateInput {
  orderNumber: string;
  storeId?: string;
  staffId?: string;
  fulfilmentType: FulfilmentType;
  customerName?: string;
  destinationLabel?: string;
  note?: string;
  items: OrderItemInput[];
  /** Flat tax rate applied to the subtotal (e.g. 0.08). Defaults to 0. */
  taxRate?: number;
  /** Optional order-level discount in dollars. Defaults to 0. */
  discount?: Money;
  /**
   * When true the order is created already `paid` (the "Charge" flow → Closed
   * queue). When false/omitted it is created `open` (the "Save" flow → Open
   * queue) and can be paid or cancelled later.
   */
  paid?: boolean;
}

/** Options controlling id/time generation, kept explicit for testability. */
export interface OrderCreateOptions {
  /** Order id; generated when omitted. */
  id?: string;
  /** ISO timestamp used for created (and paid, when created paid); defaults to now. */
  now?: string;
  /** Per-line id factory; defaults to `${orderId}-line-${index}`. */
  makeItemId?: (index: number) => string;
}

/** Error thrown when an invalid status transition is attempted. */
export class OrderTransitionError extends Error {
  constructor(
    public readonly from: OrderStatus,
    public readonly to: OrderStatus
  ) {
    super(`Invalid order transition: ${from} → ${to}`);
    this.name = "OrderTransitionError";
  }
}

/** @returns true when `status` is a terminal (Closed queue) status. */
export function isTerminalOrderStatus(status: OrderStatus): boolean {
  return status === "paid" || status === "cancelled";
}

/**
 * @param from Current status.
 * @param to Desired status.
 * @returns true when `from → to` is an approved transition.
 */
export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[from].includes(to);
}

/** @returns which queue tab a status belongs to. */
export function orderStatusTab(status: OrderStatus): "open" | "closed" {
  return isTerminalOrderStatus(status) ? "closed" : "open";
}

/**
 * Human-friendly label for a status, used by mappers to feed the UI pill.
 * @param status Canonical order status.
 * @returns A display label, e.g. "Preparing".
 */
export function orderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case "open":
      return "Open";
    case "paid":
      return "Paid";
    case "cancelled":
      return "Cancelled";
  }
}

/** Total price of a single order line including its modifier deltas. */
function lineTotal(item: OrderItemInput | OrderItem): Money {
  const modifierDelta = item.modifiers.reduce((sum, m) => sum + m.priceDelta, 0);
  return (item.unitPrice + modifierDelta) * item.quantity;
}

/**
 * Compute the money block for a set of lines, guaranteeing the first-release
 * invariant `total = subtotal + tax - discount`.
 * @param items Order lines (input or persisted).
 * @param opts Tax rate and optional discount.
 * @returns A rounded, self-consistent {@link OrderMoney}.
 */
export function computeOrderMoney(
  items: readonly (OrderItemInput | OrderItem)[],
  opts: { taxRate?: number; discount?: Money } = {}
): OrderMoney {
  const subtotal = roundMoney(items.reduce((sum, i) => sum + lineTotal(i), 0));
  const discount = roundMoney(opts.discount ?? 0);
  const tax = roundMoney(subtotal * (opts.taxRate ?? 0));
  const total = roundMoney(subtotal + tax - discount);
  return { subtotal, tax, discount, total };
}

/**
 * Best-effort UUID generator.
 *
 * Prefers the platform `crypto.randomUUID()` when available. Some runtimes
 * (e.g. React Native / Hermes without a crypto polyfill) do not expose it, so
 * we fall back to an RFC 4122 v4 string built from `Math.random`. The fallback
 * is not cryptographically strong, but it always yields a value the database
 * `uuid` columns accept — unlike the previous `ord_...` prefix format.
 */
function newId(): string {
  const cryptoObj = (globalThis as { crypto?: { randomUUID?: () => string } })
    .crypto;
  if (cryptoObj?.randomUUID) return cryptoObj.randomUUID();
  // RFC 4122 version 4 template; `x` = random nibble, `y` = 8..b variant nibble.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const rand = (Math.random() * 16) | 0;
    const value = char === "x" ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
}

/**
 * Create an order from a local cart snapshot. This is the single entry point
 * for an order into the system.
 *
 * The order enters as `paid` (closed) when `input.paid` is true — the "Charge"
 * flow — otherwise as `open` — the "Save" flow. When created paid, the `paidAt`
 * timestamp is stamped at creation time.
 *
 * @param input Cart-derived order payload (incl. the `paid` flag).
 * @param opts Id/time/line-id generation hooks (defaulted for convenience).
 * @returns A fully-formed {@link Order} with money + snapshots.
 */
export function createOrder(
  input: OrderCreateInput,
  opts: OrderCreateOptions = {}
): Order {
  const id = opts.id ?? newId();
  const now = opts.now ?? new Date().toISOString();
  const makeItemId = opts.makeItemId ?? ((index: number) => `${id}-line-${index}`);

  const items: OrderItem[] = input.items.map((line, index) => ({
    id: makeItemId(index),
    menuItemId: line.menuItemId,
    nameSnapshot: line.nameSnapshot,
    unitPrice: roundMoney(line.unitPrice),
    quantity: line.quantity,
    modifiers: line.modifiers.map((m) => ({
      modifierOptionId: m.modifierOptionId,
      label: m.label,
      priceDelta: roundMoney(m.priceDelta),
    })),
    note: line.note,
  }));

  const status: OrderStatus = input.paid ? "paid" : "open";

  return {
    id,
    orderNumber: input.orderNumber,
    storeId: input.storeId,
    staffId: input.staffId,
    fulfilmentType: input.fulfilmentType,
    status,
    customerName: input.customerName,
    destinationLabel: input.destinationLabel,
    money: computeOrderMoney(items, {
      taxRate: input.taxRate,
      discount: input.discount,
    }),
    // An `open` order is timed by createdAt; a paid-on-creation order also
    // stamps paidAt so the Closed queue can show when it was paid.
    timestamps: {
      createdAt: now,
      updatedAt: now,
      paidAt: status === "paid" ? now : undefined,
    },
    items,
    note: input.note,
  };
}

/**
 * Move an order to a new status along an approved path, stamping the milestone
 * timestamp. Throws {@link OrderTransitionError} for any invalid move so callers
 * (and the repository) cannot silently corrupt the queue.
 *
 * @param order The current order.
 * @param to The desired status.
 * @param now ISO timestamp for the transition (defaults to now).
 * @returns A new order object with updated status + timestamps.
 */
export function transitionOrder(
  order: Order,
  to: OrderStatus,
  now: string = new Date().toISOString()
): Order {
  if (!canTransitionOrder(order.status, to)) {
    throw new OrderTransitionError(order.status, to);
  }
  const timestamps: OrderTimestamps = { ...order.timestamps, updatedAt: now };
  // Only terminal statuses carry a milestone timestamp (see the partial map).
  const field = TIMESTAMP_FIELD_FOR_STATUS[to];
  if (field) timestamps[field] = now;
  return { ...order, status: to, timestamps };
}

/**
 * Mark an eligible (`open`) order as `paid`, moving it to the Closed queue and
 * stamping `paidAt`. Throws {@link OrderTransitionError} from any other status.
 *
 * @param order The current order.
 * @param now ISO timestamp for the payment (defaults to now).
 * @returns A new paid order object.
 */
export function markOrderPaid(
  order: Order,
  now: string = new Date().toISOString()
): Order {
  return transitionOrder(order, "paid", now);
}

/**
 * Cancel an eligible order, recording the reason. Cancellation is only valid
 * from a non-terminal status.
 *
 * @param order The current order.
 * @param reason Free-text cancellation reason.
 * @param now ISO timestamp for the cancellation (defaults to now).
 * @returns A new cancelled order object.
 */
export function cancelOrder(
  order: Order,
  reason: string,
  now: string = new Date().toISOString()
): Order {
  const cancelled = transitionOrder(order, "cancelled", now);
  return { ...cancelled, cancellationReason: reason };
}
