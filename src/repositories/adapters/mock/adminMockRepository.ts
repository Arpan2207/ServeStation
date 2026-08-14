/** In-memory Admin repository used when Supabase environment values are absent. */

import type { Catalog } from "@/domain/menu";
import {
  ADMIN_CATEGORIES,
  ADMIN_FILTER_CHIPS,
  ADMIN_MENU_ITEMS,
  ADMIN_MODIFIER_GROUPS,
  formatAdminPrice,
} from "@/lib/mockAdminData";
import {
  adminCategoryToCanonical,
  adminMenuItemToCanonical,
  adminModifierGroupToCanonical,
} from "@/mappers/menuMappers";
import type { AdminRepository } from "@/repositories/types";
import type {
  AdminCatalog,
  AdminMenuItem,
  AdminModifierGroup,
} from "@/types/admin";

/** Generate an adapter-local id for mock mutations. */
function mockId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Clone nested catalog values so screen edits never mutate static fixtures. */
function cloneCatalog(catalog: AdminCatalog): AdminCatalog {
  return {
    categories: catalog.categories.map((category) => ({ ...category })),
    items: catalog.items.map((item) => ({
      ...item,
      modifierGroupIds: [...item.modifierGroupIds],
    })),
    modifierGroups: catalog.modifierGroups.map((group) => ({
      ...group,
      options: group.options.map((option) => ({ ...option })),
    })),
  };
}

/** Build a mutable mock repository with the same async contract as Supabase. */
export function createMockAdminRepository(): AdminRepository {
  let catalog = cloneCatalog({
    categories: ADMIN_CATEGORIES,
    items: ADMIN_MENU_ITEMS,
    modifierGroups: ADMIN_MODIFIER_GROUPS,
  });

  return {
    async getAdminCatalog() {
      return cloneCatalog(catalog);
    },
    getFilterChips() {
      return ADMIN_FILTER_CHIPS;
    },
    formatPrice(price) {
      return formatAdminPrice(price);
    },
    async getCatalog(): Promise<Catalog> {
      return {
        categories: catalog.categories.map(adminCategoryToCanonical),
        items: catalog.items.map(adminMenuItemToCanonical),
        modifierGroups: catalog.modifierGroups.map(adminModifierGroupToCanonical),
      };
    },
    async createCategory(name) {
      const category = { id: mockId("category"), name };
      catalog.categories.push(category);
      return { ...category };
    },
    async deleteCategory(categoryId) {
      const itemIds = new Set(
        catalog.items.filter((item) => item.categoryId === categoryId).map((item) => item.id)
      );
      catalog.categories = catalog.categories.filter((category) => category.id !== categoryId);
      catalog.items = catalog.items.filter((item) => !itemIds.has(item.id));
    },
    async createItem(input) {
      const item: AdminMenuItem = {
        id: mockId("item"),
        ...input,
        visibility: "draft",
        inStock: true,
        needsReview: true,
        modifierGroupIds: [],
      };
      catalog.items.unshift(item);
      return { ...item, modifierGroupIds: [] };
    },
    async updateItem(itemId, patch) {
      const index = catalog.items.findIndex((item) => item.id === itemId);
      if (index < 0) throw new Error("The menu item no longer exists.");
      const next: AdminMenuItem = {
        ...catalog.items[index],
        ...patch,
        needsReview: patch.visibility === "visible" ? false : catalog.items[index].needsReview,
      };
      catalog.items[index] = next;
      return { ...next, modifierGroupIds: [...next.modifierGroupIds] };
    },
    async replaceModifierOptions(itemId, options) {
      const item = catalog.items.find((candidate) => candidate.id === itemId);
      if (!item) throw new Error("The menu item no longer exists.");
      const previousGroupIds = new Set(item.modifierGroupIds);
      const group: AdminModifierGroup = {
        id: mockId("modifier-group"),
        label: `${item.name} modifiers`,
        options: options.map((option) => ({ ...option, id: mockId("modifier") })),
      };
      item.modifierGroupIds = options.length > 0 ? [group.id] : [];
      catalog.modifierGroups = [
        ...catalog.modifierGroups.filter(
          (candidate) =>
            !previousGroupIds.has(candidate.id) ||
            catalog.items.some(
              (otherItem) =>
                otherItem.id !== itemId && otherItem.modifierGroupIds.includes(candidate.id)
            )
        ),
        ...(options.length > 0 ? [group] : []),
      ];
      return options.length > 0 ? [{ ...group, options: group.options.map((option) => ({ ...option })) }] : [];
    },
  };
}
