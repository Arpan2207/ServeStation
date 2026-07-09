/**
 * Mock adapter for {@link AdminRepository}.
 *
 * Owns access to the static Admin mock data so the Admin hook/screen no longer
 * import `src/lib/mockAdminData` directly. Exposes view shapes to the UI and a
 * canonical {@link Catalog} (via mappers) for backend-facing code.
 */

import {
  ADMIN_CATEGORIES,
  ADMIN_FILTER_CHIPS,
  ADMIN_MENU_ITEMS,
  ADMIN_MODIFIER_GROUPS,
  DEFAULT_ADMIN_CATEGORY_ID,
  DEFAULT_ADMIN_ITEM_ID,
  formatAdminPrice,
} from "@/lib/mockAdminData";
import {
  adminCategoryToCanonical,
  adminMenuItemToCanonical,
  adminModifierGroupToCanonical,
} from "@/mappers/menuMappers";
import type { Catalog } from "@/domain/menu";
import type { AdminRepository } from "@/repositories/types";

/** Build the mock-backed admin repository. */
export function createMockAdminRepository(): AdminRepository {
  return {
    getCategories() {
      return ADMIN_CATEGORIES;
    },
    getDefaultCategoryId() {
      return DEFAULT_ADMIN_CATEGORY_ID;
    },
    getDefaultItemId() {
      return DEFAULT_ADMIN_ITEM_ID;
    },
    getItems() {
      return ADMIN_MENU_ITEMS;
    },
    getModifierGroups() {
      return ADMIN_MODIFIER_GROUPS;
    },
    getFilterChips() {
      return ADMIN_FILTER_CHIPS;
    },
    formatPrice(price) {
      return formatAdminPrice(price);
    },
    getCatalog(): Catalog {
      return {
        categories: ADMIN_CATEGORIES.map(adminCategoryToCanonical),
        items: ADMIN_MENU_ITEMS.map(adminMenuItemToCanonical),
        modifierGroups: ADMIN_MODIFIER_GROUPS.map(adminModifierGroupToCanonical),
      };
    },
  };
}
