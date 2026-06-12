/**
 * Frontend-only Orders domain types shared across the Orders List screen,
 * the Orders detail screen, and the local orders state hook. These model just
 * enough structure for the interactive prototype (tabs, search, selection,
 * detail) and can later be replaced by backend-driven shapes.
 */

/** Which queue a row belongs to — drives the Open/Closed tabs. */
export type OrderTab = "open" | "closed";

/**
 * Fulfilment type for an order. Also drives the row status-pill color:
 * dine-in = orange, pickup = blue, delivery = purple.
 */
export type OrderType = "dine-in" | "pickup" | "delivery";

/** A single line item shown on the order detail screen. */
export interface OrderLineItem {
  label: string;
  price: string;
}

/**
 * A single order. Used both for the compact list row and the detail screen,
 * so it carries list-facing fields (destination, total) and detail-facing
 * fields (line items, tax, payment, prep time).
 */
export interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  /** Display text for the row pill, e.g. "Table 14", "Pickup", "Delivery". */
  destination: string;
  orderType: OrderType;
  /** Open vs closed queue membership. */
  tab: OrderTab;
  /** Status label shown on the detail screen pill, e.g. "Preparing". */
  statusLabel: string;
  items: number;
  /** Relative timing phrase, e.g. "created 2 min ago" / "completed 14 min ago". */
  timing: string;
  total: string;

  /* ── Detail-only fields ── */
  lineItems: OrderLineItem[];
  tax: string;
  payment: string;
  prepTime: string;
}
