/** Supabase-backed, store-scoped catalog mutations for the Admin workspace. */

import type { Catalog } from "@/domain/menu";
import { parseMoney, roundMoney } from "@/domain/money";
import { ADMIN_FILTER_CHIPS, formatAdminPrice } from "@/lib/mockAdminData";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  adminCategoryToCanonical,
  adminMenuItemToCanonical,
  adminModifierGroupToCanonical,
} from "@/mappers/menuMappers";
import type { AdminRepository } from "@/repositories/types";
import type {
  AdminCatalog,
} from "@/types/admin";

interface CategoryRow {
  id: string;
  name: string;
  sort_order: number;
}

interface ItemRow {
  id: string;
  category_id: string | null;
  name: string;
  description: string;
  price: number | string;
  is_available: boolean;
  visibility: "visible" | "draft";
}

interface GroupRow {
  id: string;
  label: string;
}

interface OptionRow {
  id: string;
  modifier_group_id: string;
  label: string;
  price_delta: number | string;
  sort_order: number;
}

interface LinkRow {
  menu_item_id: string;
  modifier_group_id: string;
}

interface RawAdminCatalog {
  categories: CategoryRow[];
  items: ItemRow[];
  groups: GroupRow[];
  options: OptionRow[];
  links: LinkRow[];
}

/** Read a PostgREST list or throw a catalog-specific error. */
function unwrap<T>(
  result: { data: T | null; error: { message: string } | null },
  operation: string
): T {
  if (result.error) throw new Error(`Admin ${operation} failed: ${result.error.message}`);
  return (result.data ?? []) as T;
}

/** Validate and normalize an editable price before it reaches a numeric column. */
function numericPrice(value: string, label: string): number {
  const trimmed = value.trim();
  const parsed = parseMoney(trimmed);
  if (!trimmed || !/^\d+(?:\.\d{0,2})?$/.test(trimmed) || parsed < 0) {
    throw new Error(`${label} must be a non-negative amount with up to two decimals.`);
  }
  return roundMoney(parsed);
}

/** Convert raw rows into the editable Admin view shape. */
function toAdminCatalog(raw: RawAdminCatalog): AdminCatalog {
  const optionsByGroup = new Map<string, OptionRow[]>();
  for (const option of raw.options) {
    const options = optionsByGroup.get(option.modifier_group_id) ?? [];
    options.push(option);
    optionsByGroup.set(option.modifier_group_id, options);
  }

  const groupIdsByItem = new Map<string, string[]>();
  for (const link of raw.links) {
    const ids = groupIdsByItem.get(link.menu_item_id) ?? [];
    ids.push(link.modifier_group_id);
    groupIdsByItem.set(link.menu_item_id, ids);
  }

  return {
    categories: raw.categories.map((row) => ({ id: row.id, name: row.name })),
    items: raw.items.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: Number(row.price).toFixed(2),
      categoryId: row.category_id ?? "",
      visibility: row.visibility,
      inStock: row.is_available,
      needsReview: row.visibility === "draft",
      modifierGroupIds: groupIdsByItem.get(row.id) ?? [],
    })),
    modifierGroups: raw.groups.map((row) => ({
      id: row.id,
      label: row.label,
      options: (optionsByGroup.get(row.id) ?? []).map((option) => ({
        id: option.id,
        label: option.label,
        price: Number(option.price_delta).toFixed(2),
      })),
    })),
  };
}

/** Build the live Admin repository. RLS supplies the authoritative store scope. */
export function createSupabaseAdminRepository(): AdminRepository {
  let cache: Promise<AdminCatalog> | null = null;
  let cacheUserId: string | null = null;

  async function loadCatalog(): Promise<AdminCatalog> {
    const supabase = getSupabaseClient();
    const authResult = await supabase.auth.getUser();
    if (authResult.error) {
      throw new Error(`Admin access failed: ${authResult.error.message}`);
    }
    const userId = authResult.data.user?.id ?? null;
    if (userId !== cacheUserId) {
      cache = null;
      cacheUserId = userId;
    }
    if (!cache) {
      cache = (async () => {
        const [categories, items, groups, options, links] = await Promise.all([
          supabase
            .from("menu_categories")
            .select("id, name, sort_order")
            .order("sort_order", { ascending: true })
            .then((result) => unwrap<CategoryRow[]>(result, "category read")),
          supabase
            .from("menu_items")
            .select("id, category_id, name, description, price, is_available, visibility")
            .order("name", { ascending: true })
            .then((result) => unwrap<ItemRow[]>(result, "item read")),
          supabase
            .from("modifier_groups")
            .select("id, label")
            .then((result) => unwrap<GroupRow[]>(result, "modifier-group read")),
          supabase
            .from("modifier_options")
            .select("id, modifier_group_id, label, price_delta, sort_order")
            .order("sort_order", { ascending: true })
            .then((result) => unwrap<OptionRow[]>(result, "modifier-option read")),
          supabase
            .from("menu_item_modifier_groups")
            .select("menu_item_id, modifier_group_id")
            .then((result) => unwrap<LinkRow[]>(result, "modifier-link read")),
        ]);
        return toAdminCatalog({ categories, items, groups, options, links });
      })().catch((error) => {
        cache = null;
        throw error;
      });
    }
    return cache;
  }

  function invalidate(): void {
    cache = null;
  }

  async function currentStoreId(): Promise<string> {
    const supabase = getSupabaseClient();
    const authResult = await supabase.auth.getUser();
    if (authResult.error || !authResult.data.user) {
      throw new Error(`Admin access failed: ${authResult.error?.message ?? "Sign-in required."}`);
    }
    const result = await supabase
      .from("staff_profiles")
      .select("store_id")
      .eq("user_id", authResult.data.user.id)
      .single();
    if (result.error || !result.data?.store_id) {
      throw new Error(
        `Admin access failed: ${result.error?.message ?? "No active store profile."}`
      );
    }
    return String(result.data.store_id);
  }

  return {
    async getAdminCatalog() {
      const catalog = await loadCatalog();
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
    },
    getFilterChips() {
      return ADMIN_FILTER_CHIPS;
    },
    formatPrice(price) {
      return formatAdminPrice(price);
    },
    async getCatalog(): Promise<Catalog> {
      const catalog = await loadCatalog();
      return {
        categories: catalog.categories.map(adminCategoryToCanonical),
        items: catalog.items.map(adminMenuItemToCanonical),
        modifierGroups: catalog.modifierGroups.map(adminModifierGroupToCanonical),
      };
    },
    async createCategory(name) {
      const supabase = getSupabaseClient();
      const catalog = await loadCatalog();
      const storeId = await currentStoreId();
      const result = await supabase
        .from("menu_categories")
        .insert({
          store_id: storeId,
          name,
          sort_order: catalog.categories.length + 1,
        })
        .select("id, name")
        .single();
      if (result.error || !result.data) {
        throw new Error(`Admin category create failed: ${result.error?.message ?? "No row returned."}`);
      }
      invalidate();
      return { id: String(result.data.id), name: String(result.data.name) };
    },
    async deleteCategory(categoryId) {
      const result = await getSupabaseClient().rpc("delete_catalog_category", {
        p_category_id: categoryId,
      });
      if (result.error) throw new Error(`Admin category delete failed: ${result.error.message}`);
      invalidate();
    },
    async createItem(input) {
      const supabase = getSupabaseClient();
      const storeId = await currentStoreId();
      const result = await supabase
        .from("menu_items")
        .insert({
          store_id: storeId,
          category_id: input.categoryId,
          name: input.name,
          description: input.description,
          price: numericPrice(input.price, "Base price"),
          is_available: true,
          is_popular: false,
          visibility: "draft",
        })
        .select("id, category_id, name, description, price, is_available, visibility")
        .single();
      if (result.error || !result.data) {
        throw new Error(`Admin item create failed: ${result.error?.message ?? "No row returned."}`);
      }
      invalidate();
      const row = result.data as ItemRow;
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        price: Number(row.price).toFixed(2),
        categoryId: row.category_id ?? "",
        visibility: row.visibility,
        inStock: row.is_available,
        needsReview: true,
        modifierGroupIds: [],
      };
    },
    async updateItem(itemId, patch) {
      const databasePatch: Record<string, string | number | boolean> = {};
      if (patch.name !== undefined) databasePatch.name = patch.name.trim();
      if (patch.description !== undefined) databasePatch.description = patch.description.trim();
      if (patch.price !== undefined) databasePatch.price = numericPrice(patch.price, "Base price");
      if (patch.categoryId !== undefined) databasePatch.category_id = patch.categoryId;
      if (patch.visibility !== undefined) databasePatch.visibility = patch.visibility;
      if (patch.inStock !== undefined) databasePatch.is_available = patch.inStock;
      if (databasePatch.name === "") throw new Error("Item name cannot be empty.");

      const result = await getSupabaseClient()
        .from("menu_items")
        .update(databasePatch)
        .eq("id", itemId)
        .select("id, category_id, name, description, price, is_available, visibility")
        .single();
      if (result.error || !result.data) {
        throw new Error(`Admin item update failed: ${result.error?.message ?? "No row returned."}`);
      }
      invalidate();
      const row = result.data as ItemRow;
      const previous = (await loadCatalog()).items.find((item) => item.id === itemId);
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        price: Number(row.price).toFixed(2),
        categoryId: row.category_id ?? "",
        visibility: row.visibility,
        inStock: row.is_available,
        needsReview: row.visibility === "draft",
        modifierGroupIds: previous?.modifierGroupIds ?? [],
      };
    },
    async replaceModifierOptions(itemId, options) {
      if (options.length > 6) throw new Error("A menu item can have at most six modifier options.");
      const normalized = options.map((option, index) => {
        const label = option.label.trim();
        if (!label) throw new Error(`Modifier option ${index + 1} needs a name.`);
        return {
          label,
          price_delta: numericPrice(option.price, `Price for ${label}`),
        };
      });
      const result = await getSupabaseClient().rpc("replace_item_modifier_options", {
        p_item_id: itemId,
        p_options: normalized,
      });
      if (result.error) throw new Error(`Admin modifier save failed: ${result.error.message}`);
      invalidate();
      const catalog = await loadCatalog();
      const item = catalog.items.find((candidate) => candidate.id === itemId);
      const linkedIds = new Set(item?.modifierGroupIds ?? []);
      return catalog.modifierGroups.filter((group) => linkedIds.has(group.id));
    },
  };
}
