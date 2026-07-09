/**
 * Mock adapter for {@link MenuRepository}.
 *
 * Owns access to the static POS mock data so hooks/screens no longer import
 * `src/lib/mockData` directly. It exposes the current view shapes to the UI and
 * a canonical {@link Catalog} (via mappers) for backend-facing code. Replacing
 * this file with a Supabase adapter should require no UI changes.
 */

import {
  CATEGORIES,
  DEFAULT_CATEGORY_ID,
  MENU_ITEMS,
  TAX_RATE,
} from "@/lib/mockData";
import {
  posCategoryToCanonical,
  posMenuItemToCanonical,
  posModifierToCanonical,
} from "@/mappers/menuMappers";
import type { Catalog, ModifierGroup, ModifierOption } from "@/domain/menu";
import type { MenuRepository } from "@/repositories/types";

/** Build the mock-backed menu repository. */
export function createMockMenuRepository(): MenuRepository {
  return {
    getCategories() {
      return CATEGORIES;
    },
    getDefaultCategoryId() {
      return DEFAULT_CATEGORY_ID;
    },
    getItems() {
      return MENU_ITEMS;
    },
    getItemById(id) {
      return MENU_ITEMS.find((item) => item.id === id);
    },
    getTaxRate() {
      return TAX_RATE;
    },
    getCatalog(): Catalog {
      // Collapse the per-item inline modifiers into a de-duplicated set of
      // canonical options, exposed here as a single implicit group.
      const optionsById = new Map<string, ModifierOption>();
      for (const item of MENU_ITEMS) {
        for (const modifier of item.modifiers) {
          if (!optionsById.has(modifier.id)) {
            optionsById.set(modifier.id, posModifierToCanonical(modifier));
          }
        }
      }
      const modifierGroups: ModifierGroup[] = [
        { id: "pos-modifiers", label: "Modifiers", options: [...optionsById.values()] },
      ];

      return {
        categories: CATEGORIES.map(posCategoryToCanonical),
        items: MENU_ITEMS.map(posMenuItemToCanonical),
        modifierGroups,
      };
    },
  };
}
