/**
 * Mappers that translate between the prototype's presentation-oriented order
 * view type and the canonical order domain model — in BOTH directions.
 *
 * The legacy view stores UI strings ("$43.60", "created 2 min ago") that must
 * never become the backend source of truth. `orderViewToCanonical` extracts raw
 * numeric money + a single canonical status from the mock view; the reverse
 * `canonicalOrderToView` re-derives all UI strings (labels, timing, currency,
 * paid/unpaid) from the canonical order so screens keep working while reading
 * real data.
 *
 * Status model (Phase 3, Step 7): an order is `open` (saved, unpaid) → Open
 * queue, or `paid` / `cancelled` (closed) → Closed queue.
 */

import type { Order as OrderView } from "@/types/orders";
import { fromOrdersOrderType, toOrdersOrderType } from "@/domain/fulfilment";
import { formatMoney, parseMoney, roundMoney } from "@/domain/money";
import {
  orderStatusLabel,
  orderStatusTab,
  type Order,
  type OrderItem,
  type OrderStatus,
} from "@/domain/orders";

/** Derive a canonical status from the legacy tab + status label. */
function deriveStatus(view: OrderView): OrderStatus {
  if (view.tab === "open") return "open";
  // Closed rows are `paid` unless the label explicitly says cancelled/voided.
  const label = view.statusLabel.toLowerCase();
  if (label.includes("cancel") || label.includes("void")) return "cancelled";
  return "paid";
}

/**
 * Convert a legacy order view into a canonical {@link Order}.
 *
 * Money is recovered numerically (subtotal = total − tax), and timestamps are
 * synthesized as ISO strings since the mock only carries relative phrasing.
 * @param view The presentation-oriented order from mock data.
 * @param now Optional ISO timestamp used for created/updated (defaults to now).
 * @returns The canonical order aggregate.
 */
export function orderViewToCanonical(
  view: OrderView,
  now: string = new Date().toISOString()
): Order {
  const tax = parseMoney(view.tax);
  const total = parseMoney(view.total);
  const subtotal = roundMoney(Math.max(total - tax, 0));

  const items: OrderItem[] = view.lineItems.map((line, index) => ({
    id: `${view.id}-line-${index}`,
    nameSnapshot: line.label,
    unitPrice: parseMoney(line.price),
    quantity: 1,
    modifiers: [],
  }));

  const status = deriveStatus(view);

  return {
    id: view.id,
    orderNumber: view.orderNumber,
    fulfilmentType: fromOrdersOrderType(view.orderType),
    status,
    customerName: view.customer,
    destinationLabel: view.destination,
    money: {
      subtotal,
      tax,
      discount: 0,
      total,
    },
    timestamps: {
      createdAt: now,
      updatedAt: now,
      paidAt: status === "paid" ? now : undefined,
      cancelledAt: status === "cancelled" ? now : undefined,
    },
    items,
  };
}

/** Format a coarse "x min/hour ago" phrase from an ISO timestamp. */
function formatRelative(iso: string | undefined, now: number): string {
  if (!iso) return "";
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";
  const minutes = Math.max(0, Math.round((now - then) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return `${hours} hr ago`;
}

/** Build the relative timing phrase shown on list rows / detail. */
function deriveTiming(order: Order, now: number): string {
  if (order.status === "paid") {
    return `paid ${formatRelative(order.timestamps.paidAt ?? order.timestamps.createdAt, now)}`;
  }
  if (order.status === "cancelled") {
    return `cancelled ${formatRelative(order.timestamps.cancelledAt, now)}`;
  }
  return `created ${formatRelative(order.timestamps.createdAt, now)}`;
}

/**
 * Convert a canonical {@link Order} back into the legacy Orders view type used
 * by the current list/detail screens. All UI strings are derived here, never
 * stored on the canonical order.
 *
 * @param order The canonical order.
 * @param now Reference time (ms) for relative phrasing; defaults to `Date.now()`.
 * @returns A presentation-ready order view.
 */
export function canonicalOrderToView(
  order: Order,
  now: number = Date.now()
): OrderView {
  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customer: order.customerName ?? "Guest",
    destination: order.destinationLabel ?? "",
    orderType: toOrdersOrderType(order.fulfilmentType),
    tab: orderStatusTab(order.status),
    statusLabel: orderStatusLabel(order.status),
    items: itemCount,
    timing: deriveTiming(order, now),
    total: formatMoney(order.money.total),
    lineItems: order.items.map((line) => ({
      label: line.nameSnapshot,
      price: formatMoney(line.unitPrice),
    })),
    tax: formatMoney(order.money.tax),
    // Coarse payment string derived from status: paid orders show when they were
    // paid; open orders are still unpaid; cancelled orders show no payment.
    payment:
      order.status === "paid"
        ? `Paid · ${formatRelative(order.timestamps.paidAt ?? order.timestamps.createdAt, now)}`
        : order.status === "open"
          ? "Unpaid · awaiting payment"
          : "—",
    prepTime: `Created ${formatRelative(order.timestamps.createdAt, now)}`,
  };
}
