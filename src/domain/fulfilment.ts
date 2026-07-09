/**
 * Canonical fulfilment (order-type) enum for the ServeStation domain.
 *
 * The prototype currently has two divergent representations:
 *  - POS uses `"Dine-in" | "Pickup" | "Delivery"` (display-cased)
 *  - Orders uses `"dine-in" | "pickup" | "delivery"` (kebab-cased)
 *
 * Neither is safe to store in a backend. This module defines a single
 * snake_case enum (backend/report friendly) plus converters so the messy
 * legacy values can be normalized into one shape before Supabase.
 */

/** The one true fulfilment type stored in the domain / backend. */
export type FulfilmentType = "dine_in" | "pickup" | "delivery";

/** Legacy POS casing, kept only for mapping existing mock data. */
export type PosOrderTypeLegacy = "Dine-in" | "Pickup" | "Delivery";

/** Legacy Orders casing, kept only for mapping existing mock data. */
export type OrdersOrderTypeLegacy = "dine-in" | "pickup" | "delivery";

/**
 * Convert a legacy POS order-type value into the canonical fulfilment type.
 * @param value Display-cased POS value, e.g. "Dine-in".
 * @returns The canonical snake_case fulfilment type.
 */
export function fromPosOrderType(value: PosOrderTypeLegacy): FulfilmentType {
  switch (value) {
    case "Dine-in":
      return "dine_in";
    case "Pickup":
      return "pickup";
    case "Delivery":
      return "delivery";
  }
}

/**
 * Convert a legacy Orders order-type value into the canonical fulfilment type.
 * @param value Kebab-cased Orders value, e.g. "dine-in".
 * @returns The canonical snake_case fulfilment type.
 */
export function fromOrdersOrderType(value: OrdersOrderTypeLegacy): FulfilmentType {
  switch (value) {
    case "dine-in":
      return "dine_in";
    case "pickup":
      return "pickup";
    case "delivery":
      return "delivery";
  }
}

/**
 * Human-friendly label for a canonical fulfilment type.
 * @param type Canonical fulfilment type.
 * @returns A capitalized display label, e.g. "Dine-in".
 */
export function fulfilmentLabel(type: FulfilmentType): string {
  switch (type) {
    case "dine_in":
      return "Dine-in";
    case "pickup":
      return "Pickup";
    case "delivery":
      return "Delivery";
  }
}
