/**
 * Canonical catalog (menu) domain model for ServeStation.
 *
 * This is the single, backend-facing shape for categories, modifiers, and menu
 * items. It intentionally differs from the per-screen view types in
 * `src/types/*`:
 *  - money is numeric ({@link Money}), never a formatted/edited string
 *  - categories always use `name` (POS previously used `label`)
 *  - modifiers are modeled as reusable groups + options (matching how a
 *    backend join table would store them) rather than inline arrays
 *
 * Screens keep using their lightweight view types; mappers in `src/mappers`
 * translate between these canonical entities and those view types.
 */

import type { Money } from "./money";

/** Publish state for a catalog entity. */
export type CatalogVisibility = "visible" | "draft";

/** A single selectable customization within a modifier group. */
export interface ModifierOption {
  id: string;
  label: string;
  /** Price change applied when this option is selected (0 = free). */
  priceDelta: Money;
}

/**
 * A named set of modifier options that can be attached to many items
 * (e.g. "Sauces", "Bun style"). Mirrors a backend `modifier_groups` table
 * with its `modifier_options` children.
 */
export interface ModifierGroup {
  id: string;
  label: string;
  options: ModifierOption[];
}

/** A menu category (e.g. Burgers, Bowls). */
export interface MenuCategory {
  id: string;
  name: string;
}

/**
 * A canonical menu item. Modifier associations are stored as group ids (like a
 * `menu_item_modifier_groups` join table) rather than inline objects.
 */
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  /** Base price in dollars. */
  price: Money;
  categoryId: string;
  /** Merchandising flag; drives the curated "Popular" view, not a real row. */
  isPopular: boolean;
  /** Whether the item is currently sellable / in stock. */
  isAvailable: boolean;
  visibility: CatalogVisibility;
  /** Ids of the modifier groups associated with this item. */
  modifierGroupIds: string[];
}

/**
 * A fully-resolved catalog snapshot. This is what a `menuRepository` read
 * returns in canonical form, ready to be handed to mappers or reporting.
 */
export interface Catalog {
  categories: MenuCategory[];
  items: MenuItem[];
  modifierGroups: ModifierGroup[];
}
