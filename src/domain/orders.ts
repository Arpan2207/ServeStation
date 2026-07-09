/**
 * Canonical order domain model for ServeStation.
 *
 * Orders are the highest-risk part of the backend (state, timestamps, payment
 * references, kitchen status, refunds, reporting, future notifications), so
 * this model is defined deliberately and up front — before any Supabase query
 * is written — and it is what the `orders` / `order_items` schema mirrors.
 *
 * Design rules:
 *  - all money is numeric ({@link Money}); never store formatted "$" strings
 *  - lifecycle status and kitchen status are separate concerns
 *  - timestamps are explicit ISO strings so reporting can reconstruct the
 *    order journey without relying on UI phrases like "created 2 min ago"
 *  - line items snapshot name + price at time of order so later catalog edits
 *    never rewrite historical orders
 */

import type { FulfilmentType } from "./fulfilment";
import type { Money } from "./money";

/**
 * Business lifecycle of an order, independent of the kitchen.
 * `draft` is a not-yet-submitted cart; the terminal states are
 * `completed` and `cancelled`.
 */
export type OrderLifecycleStatus =
  | "draft"
  | "submitted"
  | "accepted"
  | "in_progress"
  | "ready"
  | "completed"
  | "cancelled";

/** Kitchen/prep progress, tracked separately from the business lifecycle. */
export type KitchenStatus = "pending" | "queued" | "cooking" | "plated" | "served";

/** Payment settlement state for an order. */
export type PaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "refunded"
  | "partially_refunded";

/** How the order was (or will be) paid. */
export type PaymentMethod = "cash" | "card" | "wallet" | "other";

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
 * `total` should equal `subtotal + tax - discount - refundTotal` but is stored
 * explicitly so reporting does not have to recompute from lines.
 */
export interface OrderMoney {
  subtotal: Money;
  tax: Money;
  discount: Money;
  /** Sum of any refunds issued against the order. */
  refundTotal: Money;
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
  acceptedAt?: string;
  startedAt?: string;
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
  lifecycleStatus: OrderLifecycleStatus;
  kitchenStatus: KitchenStatus;

  /** Free-text customer name for the ticket (not a full customer record). */
  customerName?: string;
  /** Where the order goes, e.g. "Table 14" / "Pickup" / "Delivery". */
  destinationLabel?: string;

  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  /** External payment provider reference id, when a provider is used. */
  paymentReference?: string;

  money: OrderMoney;
  timestamps: OrderTimestamps;
  items: OrderItem[];

  /** Order-level note / special instructions. */
  note?: string;
  /** Reason captured when an order is cancelled. */
  cancellationReason?: string;
  /** Reason captured when a refund is issued. */
  refundReason?: string;
}
