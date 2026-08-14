/**
 * Admin catalog view types shared by the workspace, its state hook, and the
 * repository adapters. Prices stay editable strings in this UI layer; the
 * Supabase adapter converts them to database numeric values at the boundary.
 */

/** Whether an item is published/visible in the catalog or kept as a draft. */
export type AdminVisibility = "visible" | "draft";

/** A selectable menu category shown in the left categories panel. */
export interface AdminCategory {
  id: string;
  name: string;
}

/** An editable modifier option; `price` is a raw dollar amount such as `1.50`. */
export interface AdminModifierOption {
  id: string;
  label: string;
  price: string;
}

/** A modifier group that can be associated with an item in the editor. */
export interface AdminModifierGroup {
  id: string;
  label: string;
  options: AdminModifierOption[];
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

/** Store-scoped editable catalog returned by the Admin repository. */
export interface AdminCatalog {
  categories: AdminCategory[];
  items: AdminMenuItem[];
  modifierGroups: AdminModifierGroup[];
}

/** Values required when an Admin user creates a draft item. */
export interface AdminCreateItemInput {
  categoryId: string;
  name: string;
  description: string;
  price: string;
}

/** Catalog fields that can be persisted for an existing item. */
export type AdminMenuItemPatch = Partial<
  Pick<
    AdminMenuItem,
    "name" | "description" | "price" | "categoryId" | "visibility" | "inStock"
  >
>;

/** Identifier for the top utility-row filter chips. */
export type AdminFilterId = "all" | "in-stock" | "out-of-stock";

/** A top utility-row filter chip definition. */
export interface AdminFilterChip {
  id: AdminFilterId;
  label: string;
}

/** Editor fields that can be edited as free text on the selected item. */
export type AdminEditableField = "name" | "description" | "price";
