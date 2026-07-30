/**
 * Frontend-only POS domain types shared across the Home POS screen and its
 * local state hook. These intentionally model just enough structure for the
 * interactive prototype (selection, modifiers, cart, totals) and can later be
 * replaced by backend-driven shapes without changing the UI components.
 */

/** Fulfilment type chosen for the current cart. */
export type OrderType = "Dine-in" | "Pickup" | "Delivery";

/**
 * A single optional add-on / customization that can be toggled on a menu item.
 * `priceDelta` is expressed in whole dollars and may be zero for free options.
 */
export interface Modifier {
  id: string;
  label: string;
  priceDelta: number;
}

/** A selectable menu category shown in the top category bar. */
export interface MenuCategory {
  id: string;
  label: string;
}

/**
 * A menu item in the catalog. `price` is the base price in dollars; the final
 * line price is the base price plus any selected modifier deltas.
 */
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  /** Whether the item appears under the curated "Popular" category. */
  popular: boolean;
  modifiers: Modifier[];
}

/**
 * A single line in the cart. Items with the same id + same modifier selection
 * stack by quantity rather than creating duplicate lines.
 */
export interface CartLine {
  /** Deterministic id derived from the item + selected modifier ids. */
  id: string;
  itemId: string;
  name: string;
  /** Human-readable summary of the selected modifiers (or base description). */
  note: string;
  /** Raw custom instruction typed by staff (excludes the modifier summary). */
  instruction?: string;
  /** Base item price, excluding modifier deltas — snapshotted for the order. */
  basePrice: number;
  /** Selected modifiers, retained structurally so orders can snapshot them. */
  modifiers: Modifier[];
  /** Base price + selected modifier deltas, in dollars. */
  unitPrice: number;
  qty: number;
}

/** Derived monetary summary for the current cart. */
export interface OrderTotals {
  subtotal: number;
  tax: number;
  total: number;
}
