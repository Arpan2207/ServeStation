/**
 * Static, frontend-only mock data for the Orders screens.
 * Single source of truth shared by the Orders List and Order Detail screens,
 * replacing the inline arrays that previously lived inside the components.
 */

import type { Order } from "@/types/orders";

/* ── Orders ──────────────────────────────────────────── */

export const ORDERS: Order[] = [
  {
    id: "1042",
    orderNumber: "1042",
    customer: "Jordan",
    destination: "Table 14",
    orderType: "dine-in",
    tab: "open",
    statusLabel: "Preparing",
    items: 3,
    timing: "created 2 min ago",
    total: "$43.60",
    lineItems: [
      { label: "Smash Burger", price: "$13.50" },
      { label: "Green Bowl ×2", price: "$23.50" },
      { label: "Sparkling Citrus", price: "$3.00" },
    ],
    tax: "$3.60",
    payment: "Pending cash collection",
    prepTime: "Estimated prep: 8 min",
  },
  {
    id: "1041",
    orderNumber: "1041",
    customer: "Mina",
    destination: "Pickup",
    orderType: "pickup",
    tab: "open",
    statusLabel: "Ready soon",
    items: 2,
    timing: "created 7 min ago",
    total: "$19.20",
    lineItems: [
      { label: "Chicken Wrap", price: "$11.90" },
      { label: "Classic Fries", price: "$6.50" },
    ],
    tax: "$0.80",
    payment: "Paid · card",
    prepTime: "Estimated prep: 4 min",
  },
  {
    id: "1035",
    orderNumber: "1035",
    customer: "Aria",
    destination: "Table 7",
    orderType: "dine-in",
    tab: "open",
    statusLabel: "Preparing",
    items: 1,
    timing: "created 18 min ago",
    total: "$8.40",
    lineItems: [{ label: "Hot Honey Chicken", price: "$8.40" }],
    tax: "$0.70",
    payment: "Pending cash collection",
    prepTime: "Estimated prep: 11 min",
  },
  {
    id: "1038",
    orderNumber: "1038",
    customer: "Samir",
    destination: "Delivery",
    orderType: "delivery",
    tab: "closed",
    statusLabel: "Closed",
    items: 4,
    timing: "completed 14 min ago",
    total: "$51.80",
    lineItems: [
      { label: "Smash Burger ×2", price: "$27.00" },
      { label: "Onion Rings", price: "$5.25" },
      { label: "Iced Coffee ×2", price: "$7.50" },
    ],
    tax: "$4.30",
    payment: "Paid · card",
    prepTime: "Delivered",
  },
  {
    id: "1031",
    orderNumber: "1031",
    customer: "Lee",
    destination: "Pickup",
    orderType: "pickup",
    tab: "closed",
    statusLabel: "Closed",
    items: 2,
    timing: "completed 22 min ago",
    total: "$16.40",
    lineItems: [
      { label: "Green Bowl", price: "$11.75" },
      { label: "Sparkling Lime", price: "$4.25" },
    ],
    tax: "$1.35",
    payment: "Paid · card",
    prepTime: "Picked up",
  },
  {
    id: "1029",
    orderNumber: "1029",
    customer: "Noah",
    destination: "Table 3",
    orderType: "dine-in",
    tab: "closed",
    statusLabel: "Closed",
    items: 3,
    timing: "completed 31 min ago",
    total: "$28.90",
    lineItems: [
      { label: "Classic Cheeseburger", price: "$11.90" },
      { label: "Classic Fries", price: "$6.50" },
      { label: "Choco Brownie ×2", price: "$11.00" },
    ],
    tax: "$2.40",
    payment: "Paid · cash",
    prepTime: "Completed",
  },
];

/* ── Helpers ─────────────────────────────────────────── */

/**
 * Build the compact meta line for a list row.
 * @param order The order to summarize.
 * @returns A string like "3 items · dine-in · created 2 min ago".
 */
export function buildOrderMeta(order: Order): string {
  const itemWord = order.items === 1 ? "item" : "items";
  return `${order.items} ${itemWord} · ${order.orderType} · ${order.timing}`;
}

/**
 * Look up a single order by its id.
 * @param id The order id (also used as the route param).
 * @returns The matching order, or undefined if not found.
 */
export function getOrderById(id: string | undefined): Order | undefined {
  if (!id) return undefined;
  return ORDERS.find((order) => order.id === id);
}
