/**
 * Frontend-only Admin domain types shared across the Admin workspace screen
 * and its local state hook. These model just enough structure for the
 * interactive mock menu editor (categories, editable items, filters, modifier
 * groups) and can later be replaced by backend-driven shapes without changing
 * the UI components.
 */

/** Whether an item is published/visible in the catalog or kept as a draft. */
export type AdminVisibility = "visible" | "draft";

/** A selectable menu category shown in the left categories panel. */
export interface AdminCategory {
  id: string;
  name: string;
}

/** A modifier group that can be associated with an item in the editor. */
export interface AdminModifierGroup {
  id: string;
  label: string;
}

/**
 * An editable menu item shown in the item browser and the editor panel.
 * `price` is stored as a plain numeric string without a currency symbol
 * (e.g. "13.50") so it can be edited directly in a text field.
 */
export interface AdminMenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  categoryId: string;
  visibility: AdminVisibility;
  /** Drives the "In stock" filter chip. */
  inStock: boolean;
  /** Marks items that still need operational review before publishing. */
  needsReview: boolean;
  /** Ids of the modifier groups currently associated with this item. */
  modifierGroupIds: string[];
}

/** Identifier for the top utility-row filter chips. */
export type AdminFilterId = "all" | "in-stock" | "out-of-stock";

/** A top utility-row filter chip definition. */
export interface AdminFilterChip {
  id: AdminFilterId;
  label: string;
}

/** Editor fields that can be edited as free text on the selected item. */
export type AdminEditableField = "name" | "description" | "price";
