/**
 * Supabase-backed adapter for {@link MenuRepository}.
 *
 * Reads the catalog (categories, items, modifier groups/options, and item↔group
 * links) from Supabase and maps DB rows into the per-screen POS view shapes the
 * UI already consumes — so swapping this in for the mock adapter requires no UI
 * changes beyond async loading states.
 *
 * Mapping notes:
 *  - The synthetic "Popular" category is not a DB row; it is prepended here and
 *    driven by `menu_items.is_popular` (matching the mock behavior).
 *  - Per-item inline `modifiers` (the POS view shape) are resolved by flattening
 *    the modifier options of every modifier group linked to the item.
 *  - Money columns are coerced with `Number(...)` since PostgREST may return
 *    numeric values as strings.
 *
 * The raw catalog fetch is memoized per adapter instance to avoid duplicate
 * round-trips when `getCategories()`/`getItems()` are called together. Catalog
 * mutations (Step 9 / Admin) must construct a fresh adapter or add invalidation.
 */

import { DEFAULT_CATEGORY_ID, TAX_RATE } from "@/lib/mockData";
import { getSupabaseClient } from "@/lib/supabase/client";
import type {
  Catalog,
  MenuItem as CanonicalMenuItem,
  ModifierGroup,
} from "@/domain/menu";
import type { MenuRepository } from "@/repositories/types";
import type {
  MenuCategory as PosMenuCategory,
  MenuItem as PosMenuItem,
  Modifier as PosModifier,
} from "@/types/pos";

/* ── Raw row shapes (subset of columns we select) ────────────────────────── */

interface CategoryRow {
  id: string;
  name: string;
  sort_order: number;
}

interface MenuItemRow {
  id: string;
  category_id: string | null;
  name: string;
  description: string;
  price: number | string;
  is_popular: boolean;
  is_available: boolean;
  visibility: "visible" | "draft";
}

interface ModifierOptionRow {
  id: string;
  modifier_group_id: string;
  label: string;
  price_delta: number | string;
  sort_order: number;
}

interface ModifierGroupRow {
  id: string;
  label: string;
}

interface ItemGroupLinkRow {
  menu_item_id: string;
  modifier_group_id: string;
}

/** Everything needed to assemble both view and canonical catalog shapes. */
interface RawCatalog {
  categories: CategoryRow[];
  items: MenuItemRow[];
  groups: ModifierGroupRow[];
  options: ModifierOptionRow[];
  links: ItemGroupLinkRow[];
}

/** Throw a descriptive error if a Supabase query failed. */
function unwrap<T>(result: { data: T | null; error: { message: string } | null }, label: string): T {
  if (result.error) {
    throw new Error(`Supabase catalog read failed (${label}): ${result.error.message}`);
  }
  return (result.data ?? []) as T;
}

/** Build the Supabase-backed menu repository. */
export function createSupabaseMenuRepository(): MenuRepository {
  let cache: Promise<RawCatalog> | null = null;

  /** Fetch (and memoize) all catalog tables needed to build view/canonical shapes. */
  function loadRaw(): Promise<RawCatalog> {
    if (!cache) {
      cache = (async () => {
        const supabase = getSupabaseClient();
        const [categories, items, groups, options, links] = await Promise.all([
          supabase
            .from("menu_categories")
            .select("id, name, sort_order")
            .order("sort_order", { ascending: true })
            .then((r) => unwrap<CategoryRow[]>(r, "categories")),
          supabase
            .from("menu_items")
            .select("id, category_id, name, description, price, is_popular, is_available, visibility")
            .eq("visibility", "visible")
            .order("name", { ascending: true })
            .then((r) => unwrap<MenuItemRow[]>(r, "items")),
          supabase
            .from("modifier_groups")
            .select("id, label")
            .then((r) => unwrap<ModifierGroupRow[]>(r, "groups")),
          supabase
            .from("modifier_options")
            .select("id, modifier_group_id, label, price_delta, sort_order")
            .order("sort_order", { ascending: true })
            .then((r) => unwrap<ModifierOptionRow[]>(r, "options")),
          supabase
            .from("menu_item_modifier_groups")
            .select("menu_item_id, modifier_group_id")
            .then((r) => unwrap<ItemGroupLinkRow[]>(r, "links")),
        ]);
        return { categories, items, groups, options, links };
      })();
    }
    return cache;
  }

  /** Group modifier options by their owning group id. */
  function optionsByGroup(raw: RawCatalog): Map<string, ModifierOptionRow[]> {
    const map = new Map<string, ModifierOptionRow[]>();
    for (const option of raw.options) {
      const list = map.get(option.modifier_group_id) ?? [];
      list.push(option);
      map.set(option.modifier_group_id, list);
    }
    return map;
  }

  /** Resolve the flat POS inline-modifier list for a single item id. */
  function inlineModifiersForItem(
    itemId: string,
    raw: RawCatalog,
    grouped: Map<string, ModifierOptionRow[]>
  ): PosModifier[] {
    const groupIds = raw.links
      .filter((link) => link.menu_item_id === itemId)
      .map((link) => link.modifier_group_id);
    const modifiers: PosModifier[] = [];
    for (const groupId of groupIds) {
      for (const option of grouped.get(groupId) ?? []) {
        modifiers.push({
          id: option.id,
          label: option.label,
          priceDelta: Number(option.price_delta),
        });
      }
    }
    return modifiers;
  }

  /** Map DB item rows into the POS view shape (inline modifiers, numeric price). */
  function toPosItems(raw: RawCatalog): PosMenuItem[] {
    const grouped = optionsByGroup(raw);
    return raw.items.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: Number(row.price),
      categoryId: row.category_id ?? "",
      popular: row.is_popular,
      modifiers: inlineModifiersForItem(row.id, raw, grouped),
    }));
  }

  return {
    async getCategories(): Promise<PosMenuCategory[]> {
      const raw = await loadRaw();
      // Prepend the curated "Popular" view (not a real category row).
      return [
        { id: "popular", label: "Popular" },
        ...raw.categories.map((row) => ({ id: row.id, label: row.name })),
      ];
    },

    getDefaultCategoryId() {
      return DEFAULT_CATEGORY_ID;
    },

    async getItems(): Promise<PosMenuItem[]> {
      return toPosItems(await loadRaw());
    },

    async getItemById(id): Promise<PosMenuItem | undefined> {
      const items = toPosItems(await loadRaw());
      return items.find((item) => item.id === id);
    },

    getTaxRate() {
      return TAX_RATE;
    },

    async getCatalog(): Promise<Catalog> {
      const raw = await loadRaw();
      const grouped = optionsByGroup(raw);

      const modifierGroups: ModifierGroup[] = raw.groups.map((group) => ({
        id: group.id,
        label: group.label,
        options: (grouped.get(group.id) ?? []).map((option) => ({
          id: option.id,
          label: option.label,
          priceDelta: Number(option.price_delta),
        })),
      }));

      const linksByItem = new Map<string, string[]>();
      for (const link of raw.links) {
        const list = linksByItem.get(link.menu_item_id) ?? [];
        list.push(link.modifier_group_id);
        linksByItem.set(link.menu_item_id, list);
      }

      const items: CanonicalMenuItem[] = raw.items.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        price: Number(row.price),
        categoryId: row.category_id ?? "",
        isPopular: row.is_popular,
        isAvailable: row.is_available,
        visibility: row.visibility,
        modifierGroupIds: linksByItem.get(row.id) ?? [],
      }));

      return {
        categories: raw.categories.map((row) => ({ id: row.id, name: row.name })),
        items,
        modifierGroups,
      };
    },
  };
}
