/**
 * Canonical order domain model for ServeStation (Tablecraft).
 *
 * Orders are the highest-risk, longest-lived contract in the product, so this
 * model is defined deliberately and up front — before any Supabase query is
 * written — and it is what the `orders` / `order_items` schema mirrors.
 *
 * FIRST-RELEASE CONTRACT (reviewed & locked):
 *  - Carts stay device-local. A `draft` order is NEVER persisted; an order only
 *    exists once staff press "Place order", at which point it is `submitted`.
 *  - Staff drive a single, simple operational status machine:
 *        submitted → preparing → ready → completed
 *                              ↘ cancelled
 *  - There is ONE status per order (no parallel "lifecycle" + "kitchen" state
 *    machines) so the queue truth is unambiguous.
 *  - Payments and refunds are deferred to a later backend phase; there are no
 *    payment/refund fields on the first-release order (see docs/order-lifecycle).
 *
 * Design rules:
 *  - all money is numeric ({@link Money}); never store formatted "$" strings
 *  - timestamps are explicit ISO strings so reporting can reconstruct the order
 *    journey without relying on UI phrases like "created 2 min ago"
 *  - line items snapshot name + price at order time so later catalog edits never
 *    rewrite historical orders
 */

import type { FulfilmentType } from "./fulfilment";
import { roundMoney, type Money } from "./money";

/**
 * The single operational status of an order for the first release.
 *
 * `submitted` is the entry state (cart placed), `completed` and `cancelled` are
 * the two terminal states. There is intentionally no `draft` value because
 * carts are never persisted.
 */
export type OrderStatus =
  | "submitted"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

/** Statuses that belong to the live/"Open" queue. */
export const OPEN_ORDER_STATUSES: readonly OrderStatus[] = [
  "submitted",
  "preparing",
  "ready",
];

/** Terminal statuses that belong to the "Closed"/history queue. */
export const CLOSED_ORDER_STATUSES: readonly OrderStatus[] = [
  "completed",
  "cancelled",
];

/**
 * Allowed forward transitions for each status. Any move not listed here is
 * rejected. Terminal states (`completed`, `cancelled`) allow no transitions.
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  submitted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

/**
 * Map a target status to the timestamp field that must be stamped when an order
 * reaches it. Used by both the domain transition helper and the SQL function so
 * code and database agree.
 */
export const TIMESTAMP_FIELD_FOR_STATUS: Record<
  OrderStatus,
  keyof OrderTimestamps
> = {
  submitted: "submittedAt",
  preparing: "preparingAt",
  ready: "readyAt",
  completed: "completedAt",
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
 * Invariant for the payment-deferred first release:
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
  submittedAt?: string;
  preparingAt?: string;
  readyAt?: string;
  completedAt?: string;
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
 * Input required to create a submitted order from a local cart snapshot. This
 * is the ONLY way an order enters the system; there is no persisted draft.
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

/** The cart-derived payload used to create a submitted order. */
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
}

/** Options controlling id/time generation, kept explicit for testability. */
export interface OrderCreateOptions {
  /** Order id; generated when omitted. */
  id?: string;
  /** ISO timestamp used for created/submitted; defaults to now. */
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
  return status === "completed" || status === "cancelled";
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
    case "submitted":
      return "New";
    case "preparing":
      return "Preparing";
    case "ready":
      return "Ready";
    case "completed":
      return "Completed";
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

/** Best-effort id generator (uses crypto.randomUUID when available). */
function newId(): string {
  const cryptoObj = (globalThis as { crypto?: { randomUUID?: () => string } })
    .crypto;
  if (cryptoObj?.randomUUID) return cryptoObj.randomUUID();
  return `ord_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Create a `submitted` order from a local cart snapshot. This is the single
 * entry point for an order into the system.
 *
 * @param input Cart-derived order payload.
 * @param opts Id/time/line-id generation hooks (defaulted for convenience).
 * @returns A fully-formed submitted {@link Order} with money + snapshots.
 */
export function createSubmittedOrder(
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

  return {
    id,
    orderNumber: input.orderNumber,
    storeId: input.storeId,
    staffId: input.staffId,
    fulfilmentType: input.fulfilmentType,
    status: "submitted",
    customerName: input.customerName,
    destinationLabel: input.destinationLabel,
    money: computeOrderMoney(items, {
      taxRate: input.taxRate,
      discount: input.discount,
    }),
    timestamps: { createdAt: now, updatedAt: now, submittedAt: now },
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
  timestamps[TIMESTAMP_FIELD_FOR_STATUS[to]] = now;
  return { ...order, status: to, timestamps };
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
