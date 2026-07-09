/**
 * Mappers that normalize the prototype's per-screen catalog shapes into the
 * canonical menu domain model.
 *
 * These prove the normalization path the Supabase adapter will follow:
 *  - POS `label` categories → canonical `name`
 *  - Admin numeric-string prices → numeric {@link Money}
 *  - POS inline modifiers → canonical {@link ModifierOption}
 *  - Admin item visibility/stock flags → canonical fields
 */

import type {
  MenuCategory as PosMenuCategory,
  MenuItem as PosMenuItem,
  Modifier as PosModifier,
} from "@/types/pos";
import type {
  AdminCategory,
  AdminMenuItem,
  AdminModifierGroup,
} from "@/types/admin";
import { parseMoney } from "@/domain/money";
import type { MenuCategory, MenuItem, ModifierGroup, ModifierOption } from "@/domain/menu";

/**
 * Convert a POS inline modifier into a canonical modifier option.
 * @param modifier Legacy POS modifier ({ id, label, priceDelta }).
 * @returns The canonical option (already numeric-priced).
 */
export function posModifierToCanonical(modifier: PosModifier): ModifierOption {
  return {
    id: modifier.id,
    label: modifier.label,
    priceDelta: modifier.priceDelta,
  };
}

/**
 * Convert a POS category (which uses `label`) into a canonical category
 * (which uses `name`).
 * @param category Legacy POS category.
 * @returns The canonical category.
 */
export function posCategoryToCanonical(category: PosMenuCategory): MenuCategory {
  return { id: category.id, name: category.label };
}

/**
 * Convert a POS menu item into a canonical menu item.
 * POS items carry inline modifiers and a `popular` flag; canonical items store
 * modifier associations as group ids and treat popularity as merchandising.
 * @param item Legacy POS menu item.
 * @returns The canonical menu item.
 */
export function posMenuItemToCanonical(item: PosMenuItem): MenuItem {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    categoryId: item.categoryId,
    isPopular: item.popular,
    isAvailable: true,
    visibility: "visible",
    modifierGroupIds: [],
  };
}

/**
 * Convert an Admin category into a canonical category.
 * @param category Admin category ({ id, name }).
 * @returns The canonical category (already aligned on `name`).
 */
export function adminCategoryToCanonical(category: AdminCategory): MenuCategory {
  return { id: category.id, name: category.name };
}

/**
 * Convert an Admin modifier group into a canonical modifier group.
 * The mock admin data does not yet link concrete options, so `options` starts
 * empty and is populated once modifier editing is backed by real data.
 * @param group Admin modifier group ({ id, label }).
 * @returns The canonical modifier group.
 */
export function adminModifierGroupToCanonical(group: AdminModifierGroup): ModifierGroup {
  return { id: group.id, label: group.label, options: [] };
}

/**
 * Convert an Admin menu item (numeric-string price, stock/visibility flags)
 * into a canonical menu item.
 * @param item Admin menu item.
 * @returns The canonical menu item with numeric price and normalized flags.
 */
export function adminMenuItemToCanonical(item: AdminMenuItem): MenuItem {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: parseMoney(item.price),
    categoryId: item.categoryId,
    isPopular: false,
    isAvailable: item.inStock,
    visibility: item.visibility,
    modifierGroupIds: item.modifierGroupIds,
  };
}
