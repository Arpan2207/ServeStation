/**
 * Mapper that normalizes the prototype's presentation-oriented order view type
 * into the canonical order domain model.
 *
 * The legacy view stores UI strings ("$43.60", "created 2 min ago",
 * "Paid · card") that must not become the backend source of truth. This mapper
 * extracts raw numeric money, canonical fulfilment/lifecycle/payment states,
 * and self-contained line-item snapshots — the shape the Supabase `orders`
 * table is designed around.
 */

import type { Order as OrderView } from "@/types/orders";
import { fromOrdersOrderType } from "@/domain/fulfilment";
import { parseMoney, roundMoney } from "@/domain/money";
import type {
  KitchenStatus,
  Order,
  OrderItem,
  OrderLifecycleStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/domain/orders";

/** Derive a canonical lifecycle status from the legacy tab + status label. */
function deriveLifecycleStatus(view: OrderView): OrderLifecycleStatus {
  if (view.tab === "closed") return "completed";
  const label = view.statusLabel.toLowerCase();
  if (label.includes("ready")) return "ready";
  return "in_progress";
}

/** Derive a canonical kitchen status from the legacy tab + status label. */
function deriveKitchenStatus(view: OrderView): KitchenStatus {
  if (view.tab === "closed") return "served";
  const label = view.statusLabel.toLowerCase();
  if (label.includes("ready")) return "plated";
  return "cooking";
}

/** Derive payment status from the legacy free-text payment string. */
function derivePaymentStatus(payment: string): PaymentStatus {
  const value = payment.toLowerCase();
  if (value.includes("refund")) return "refunded";
  if (value.includes("paid")) return "paid";
  if (value.includes("pending")) return "pending";
  return "unpaid";
}

/** Derive a payment method from the legacy free-text payment string. */
function derivePaymentMethod(payment: string): PaymentMethod | undefined {
  const value = payment.toLowerCase();
  if (value.includes("card")) return "card";
  if (value.includes("cash")) return "cash";
  return undefined;
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
export function orderViewToCanonical(view: OrderView, now: string = new Date().toISOString()): Order {
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

  const closed = view.tab === "closed";

  return {
    id: view.id,
    orderNumber: view.orderNumber,
    fulfilmentType: fromOrdersOrderType(view.orderType),
    lifecycleStatus: deriveLifecycleStatus(view),
    kitchenStatus: deriveKitchenStatus(view),
    customerName: view.customer,
    destinationLabel: view.destination,
    paymentStatus: derivePaymentStatus(view.payment),
    paymentMethod: derivePaymentMethod(view.payment),
    money: {
      subtotal,
      tax,
      discount: 0,
      refundTotal: 0,
      total,
    },
    timestamps: {
      createdAt: now,
      updatedAt: now,
      completedAt: closed ? now : undefined,
    },
    items,
  };
}
