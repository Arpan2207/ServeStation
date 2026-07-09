/**
 * Local, frontend-only state hook powering the Admin workspace screen.
 *
 * Combines simple `useState` UI state (selected category, selected item,
 * search text, active filter, action feedback) with a `useReducer`-driven
 * item collection so the editor's multiple related mutations (field edits,
 * visibility, stock status, modifier-group toggles, add, publish) stay
 * predictable. All values the UI needs (category counts, filtered items,
 * selected item) are derived here, keeping the screen presentational.
 */

import { useCallback, useMemo, useReducer, useState } from "react";

import { adminRepository } from "@/repositories";
import type {
  AdminCategory,
  AdminEditableField,
  AdminFilterId,
  AdminMenuItem,
} from "@/types/admin";

/* Admin catalog data sourced through the repository boundary. */
const ADMIN_CATEGORIES: AdminCategory[] = adminRepository.getCategories();
const ADMIN_MENU_ITEMS: AdminMenuItem[] = adminRepository.getItems();
const DEFAULT_ADMIN_CATEGORY_ID: string = adminRepository.getDefaultCategoryId();
const DEFAULT_ADMIN_ITEM_ID: string = adminRepository.getDefaultItemId();

/* ── Items reducer ───────────────────────────────────── */

/** Actions that mutate the editable item collection. */
type ItemsAction =
  | { type: "UPDATE_FIELD"; id: string; field: AdminEditableField; value: string }
  | { type: "TOGGLE_MODIFIER_GROUP"; id: string; groupId: string }
  | { type: "ADD_ITEM"; item: AdminMenuItem }
  | { type: "PUBLISH"; id: string }
  | { type: "MARK_UNAVAILABLE"; id: string }
  | { type: "MARK_IN_STOCK"; id: string };

/** Pure reducer for all item mutations. */
function itemsReducer(state: AdminMenuItem[], action: ItemsAction): AdminMenuItem[] {
  switch (action.type) {
    case "UPDATE_FIELD":
      return state.map((item) =>
        item.id === action.id ? { ...item, [action.field]: action.value } : item
      );
    case "TOGGLE_MODIFIER_GROUP":
      return state.map((item) => {
        if (item.id !== action.id) return item;
        const has = item.modifierGroupIds.includes(action.groupId);
        return {
          ...item,
          modifierGroupIds: has
            ? item.modifierGroupIds.filter((g) => g !== action.groupId)
            : [...item.modifierGroupIds, action.groupId],
        };
      });
    case "ADD_ITEM":
      return [action.item, ...state];
    case "PUBLISH":
      return state.map((item) =>
        item.id === action.id ? { ...item, visibility: "visible", needsReview: false } : item
      );
    case "MARK_UNAVAILABLE":
      return state.map((item) =>
        item.id === action.id ? { ...item, inStock: false } : item
      );
    case "MARK_IN_STOCK":
      return state.map((item) =>
        item.id === action.id ? { ...item, inStock: true, needsReview: false } : item
      );
    default:
      return state;
  }
}

/* ── Hook return shape ───────────────────────────────── */

/** A category paired with its live item count for the left panel. */
export interface AdminCategoryWithCount extends AdminCategory {
  count: number;
}

export interface UseAdminState {
  /* selection + filters */
  categories: AdminCategoryWithCount[];
  selectedCategoryId: string;
  selectCategory: (categoryId: string) => void;
  searchText: string;
  setSearchText: (text: string) => void;
  activeFilterId: AdminFilterId;
  setFilter: (filterId: AdminFilterId) => void;
  filteredItems: AdminMenuItem[];

  /* selected item + editor */
  selectedItem: AdminMenuItem | null;
  selectItem: (itemId: string) => void;
  updateField: (field: AdminEditableField, value: string) => void;
  toggleModifierGroup: (groupId: string) => void;

  /* actions */
  addItem: () => void;
  bulkEdit: () => void;
  publishItem: () => void;
  markInStock: () => void;
  markUnavailable: () => void;

  /* local feedback */
  feedback: string | null;
}

/* ── Hook ────────────────────────────────────────────── */

/**
 * Provide all interactive Admin workspace state and handlers.
 * @returns Category/item selection, search + filter state, the editable
 * selected item, and the local action handlers the Admin components use.
 */
export function useAdminState(): UseAdminState {
  const [items, dispatch] = useReducer(itemsReducer, ADMIN_MENU_ITEMS);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    DEFAULT_ADMIN_CATEGORY_ID
  );
  const [searchText, setSearchText] = useState<string>("");
  const [activeFilterId, setActiveFilterId] = useState<AdminFilterId>("all");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(
    DEFAULT_ADMIN_ITEM_ID
  );
  const [feedback, setFeedback] = useState<string | null>(null);

  /* Categories paired with a live item count derived from the collection. */
  const categories = useMemo<AdminCategoryWithCount[]>(
    () =>
      ADMIN_CATEGORIES.map((cat) => ({
        ...cat,
        count: items.filter((item) => item.categoryId === cat.id).length,
      })),
    [items]
  );

  /* Filter the catalog by active category, filter chip, and search text. */
  const filteredItems = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory = item.categoryId === selectedCategoryId;
      const matchesFilter =
        activeFilterId === "all"
          ? true
          : activeFilterId === "in-stock"
            ? item.inStock
            : !item.inStock;
      const matchesQuery =
        query.length === 0 ||
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query);
      return matchesCategory && matchesFilter && matchesQuery;
    });
  }, [items, selectedCategoryId, activeFilterId, searchText]);

  /* Resolve the selected item from its id. */
  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) ?? null,
    [items, selectedItemId]
  );

  const selectItem = useCallback((itemId: string) => {
    setSelectedItemId(itemId);
    setFeedback(null);
  }, []);

  /* Switching category auto-selects the first item in that category so the
     editor always reflects something relevant (when the category is empty,
     selection is cleared and the editor shows its empty state). */
  const selectCategory = useCallback(
    (categoryId: string) => {
      setSelectedCategoryId(categoryId);
      setFeedback(null);
      const firstInCategory = items.find((item) => item.categoryId === categoryId);
      setSelectedItemId(firstInCategory ? firstInCategory.id : null);
    },
    [items]
  );

  const setFilter = useCallback((filterId: AdminFilterId) => {
    setActiveFilterId(filterId);
  }, []);

  /* Editor field edits update the selected item in place (live). */
  const updateField = useCallback(
    (field: AdminEditableField, value: string) => {
      if (!selectedItemId) return;
      dispatch({ type: "UPDATE_FIELD", id: selectedItemId, field, value });
    },
    [selectedItemId]
  );

  const toggleModifierGroup = useCallback(
    (groupId: string) => {
      if (!selectedItemId) return;
      dispatch({ type: "TOGGLE_MODIFIER_GROUP", id: selectedItemId, groupId });
    },
    [selectedItemId]
  );

  /* Mock "Add item": create a draft item in the active category and focus it. */
  const addItem = useCallback(() => {
    const newId = `item-${Date.now()}`;
    const newItem: AdminMenuItem = {
      id: newId,
      name: "New item",
      description: "Add a short description for this item.",
      price: "0.00",
      categoryId: selectedCategoryId,
      visibility: "draft",
      inStock: true,
      needsReview: true,
      modifierGroupIds: [],
    };
    dispatch({ type: "ADD_ITEM", item: newItem });
    setSelectedItemId(newId);
    setSearchText("");
    setActiveFilterId("all");
    setFeedback("Added new item");
  }, [selectedCategoryId]);

  const bulkEdit = useCallback(() => {
    setFeedback("Bulk edit is a mock action for now.");
  }, []);

  const publishItem = useCallback(() => {
    if (!selectedItem) return;
    dispatch({ type: "PUBLISH", id: selectedItem.id });
    setFeedback(`Published "${selectedItem.name}".`);
  }, [selectedItem]);

  const markInStock = useCallback(() => {
    if (!selectedItem) return;
    dispatch({ type: "MARK_IN_STOCK", id: selectedItem.id });
    setFeedback(`Marked "${selectedItem.name}" in stock.`);
  }, [selectedItem]);

  const markUnavailable = useCallback(() => {
    if (!selectedItem) return;
    dispatch({ type: "MARK_UNAVAILABLE", id: selectedItem.id });
    setFeedback(`Marked "${selectedItem.name}" unavailable.`);
  }, [selectedItem]);

  return {
    categories,
    selectedCategoryId,
    selectCategory,
    searchText,
    setSearchText,
    activeFilterId,
    setFilter,
    filteredItems,

    selectedItem,
    selectItem,
    updateField,
    toggleModifierGroup,

    addItem,
    bulkEdit,
    publishItem,
    markInStock,
    markUnavailable,

    feedback,
  };
}
