/** Async Admin workspace state backed by the active catalog repository. */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";

import { adminRepository, menuRepository } from "@/repositories";
import type {
  AdminCategory,
  AdminEditableField,
  AdminFilterId,
  AdminMenuItem,
  AdminModifierGroup,
  AdminModifierOption,
} from "@/types/admin";

/** A category paired with its live item count for the left panel. */
export interface AdminCategoryWithCount extends AdminCategory {
  count: number;
}

/** State and catalog actions consumed by the Admin workspace screen. */
export interface UseAdminState {
  categories: AdminCategoryWithCount[];
  selectedCategoryId: string;
  selectCategory: (categoryId: string) => void;
  addCategory: (name: string) => Promise<boolean>;
  deleteCategory: () => Promise<void>;
  searchText: string;
  setSearchText: (text: string) => void;
  activeFilterId: AdminFilterId;
  setFilter: (filterId: AdminFilterId) => void;
  filteredItems: AdminMenuItem[];
  selectedItem: AdminMenuItem | null;
  selectItem: (itemId: string) => void;
  updateField: (field: AdminEditableField, value: string) => void;
  modifierOptions: AdminModifierOption[];
  updateModifierOption: (
    optionId: string,
    field: "label" | "price",
    value: string
  ) => void;
  saveModifierOptions: () => Promise<void>;
  addItem: () => Promise<void>;
  bulkEdit: () => void;
  publishItem: () => Promise<void>;
  markInStock: () => Promise<void>;
  markUnavailable: () => Promise<void>;
  loading: boolean;
  saving: boolean;
  error: string | null;
  reload: () => void;
  feedback: string | null;
}

/** Return six editable slots, retaining persisted ids for existing options. */
function modifierDrafts(
  modifierGroupIds: string[],
  groups: AdminModifierGroup[]
): AdminModifierOption[] {
  const linkedIds = new Set(modifierGroupIds);
  const persisted = groups
    .filter((group) => linkedIds.has(group.id))
    .flatMap((group) => group.options)
    .slice(0, 6)
    .map((option) => ({ ...option }));
  return [
    ...persisted,
    ...Array.from({ length: 6 - persisted.length }, (_, index) => ({
      id: `draft-${index}`,
      label: "",
      price: "0.00",
    })),
  ];
}

/** Provide loaded Admin data, selection/filter state, and persistent mutations. */
export function useAdminState(): UseAdminState {
  const [categoryList, setCategoryList] = useState<AdminCategory[]>([]);
  const [items, setItems] = useState<AdminMenuItem[]>([]);
  const [modifierGroups, setModifierGroups] = useState<AdminModifierGroup[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [modifierOptions, setModifierOptions] = useState<AdminModifierOption[]>([]);
  const [searchText, setSearchText] = useState("");
  const [activeFilterId, setActiveFilterId] = useState<AdminFilterId>("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const activeRequestId = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++activeRequestId.current;
    setLoading(true);
    setError(null);
    try {
      const catalog = await adminRepository.getAdminCatalog();
      if (requestId !== activeRequestId.current) return;
      setCategoryList(catalog.categories);
      setItems(catalog.items);
      setModifierGroups(catalog.modifierGroups);
      const firstCategoryId = catalog.categories[0]?.id ?? "";
      setSelectedCategoryId(firstCategoryId);
      setSelectedItemId(
        catalog.items.find((item) => item.categoryId === firstCategoryId)?.id ?? null
      );
    } catch (caught) {
      if (requestId !== activeRequestId.current) return;
      setError(caught instanceof Error ? caught.message : "Unable to load the Admin catalog.");
    } finally {
      if (requestId === activeRequestId.current) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        activeRequestId.current += 1;
      };
    }, [load])
  );

  const categories = useMemo<AdminCategoryWithCount[]>(
    () =>
      categoryList.map((category) => ({
        ...category,
        count: items.filter((item) => item.categoryId === category.id).length,
      })),
    [categoryList, items]
  );

  const filteredItems = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return items.filter((item) => {
      const matchesFilter =
        activeFilterId === "all"
          ? true
          : activeFilterId === "in-stock"
            ? item.inStock
            : !item.inStock;
      return (
        item.categoryId === selectedCategoryId &&
        matchesFilter &&
        (!query ||
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query))
      );
    });
  }, [activeFilterId, items, searchText, selectedCategoryId]);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) ?? null,
    [items, selectedItemId]
  );

  const selectedModifierGroupKey = selectedItem?.modifierGroupIds.join("|") ?? "";

  useEffect(() => {
    setModifierOptions(
      modifierDrafts(
        selectedModifierGroupKey ? selectedModifierGroupKey.split("|") : [],
        modifierGroups
      )
    );
  }, [modifierGroups, selectedItemId, selectedModifierGroupKey]);

  const fail = useCallback((caught: unknown, fallback: string) => {
    setFeedback(null);
    setError(caught instanceof Error ? caught.message : fallback);
  }, []);

  const selectCategory = useCallback(
    (categoryId: string) => {
      setSelectedCategoryId(categoryId);
      setSelectedItemId(items.find((item) => item.categoryId === categoryId)?.id ?? null);
      setFeedback(null);
      setError(null);
    },
    [items]
  );

  const selectItem = useCallback((itemId: string) => {
    setSelectedItemId(itemId);
    setFeedback(null);
    setError(null);
  }, []);

  const addCategory = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) {
        setFeedback("Enter a category name first.");
        return false;
      }
      if (categoryList.some((category) => category.name.toLowerCase() === trimmed.toLowerCase())) {
        setFeedback(`"${trimmed}" already exists.`);
        return false;
      }
      setSaving(true);
      setError(null);
      try {
        const category = await adminRepository.createCategory(trimmed);
        setCategoryList((current) => [...current, category]);
        setSelectedCategoryId(category.id);
        setSelectedItemId(null);
        setFeedback(`Added "${category.name}".`);
        menuRepository.invalidateCatalog();
        return true;
      } catch (caught) {
        fail(caught, "Unable to add the category.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [categoryList, fail]
  );

  const deleteCategory = useCallback(async () => {
    const category = categoryList.find((candidate) => candidate.id === selectedCategoryId);
    if (!category) return;
    if (categoryList.length === 1) {
      setFeedback("Add another category before deleting the last one.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await adminRepository.deleteCategory(category.id);
      const remainingCategories = categoryList.filter((candidate) => candidate.id !== category.id);
      const remainingItems = items.filter((item) => item.categoryId !== category.id);
      const nextCategory = remainingCategories[0];
      setCategoryList(remainingCategories);
      setItems(remainingItems);
      setSelectedCategoryId(nextCategory?.id ?? "");
      setSelectedItemId(
        remainingItems.find((item) => item.categoryId === nextCategory?.id)?.id ?? null
      );
      setFeedback(`Deleted "${category.name}" and its catalog items.`);
      menuRepository.invalidateCatalog();
    } catch (caught) {
      fail(caught, "Unable to delete the category.");
    } finally {
      setSaving(false);
    }
  }, [categoryList, fail, items, selectedCategoryId]);

  const updateField = useCallback(
    (field: AdminEditableField, value: string) => {
      if (!selectedItemId) return;
      setItems((current) =>
        current.map((item) => (item.id === selectedItemId ? { ...item, [field]: value } : item))
      );
      setFeedback("Unsaved item changes. Publish to save them.");
      setError(null);
    },
    [selectedItemId]
  );

  const updateModifierOption = useCallback(
    (optionId: string, field: "label" | "price", value: string) => {
      setModifierOptions((current) =>
        current.map((option) => (option.id === optionId ? { ...option, [field]: value } : option))
      );
      setFeedback("Unsaved modifier changes.");
      setError(null);
    },
    []
  );

  const addItem = useCallback(async () => {
    if (!selectedCategoryId) {
      setFeedback("Create or select a category first.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const item = await adminRepository.createItem({
        categoryId: selectedCategoryId,
        name: "New item",
        description: "Add a short description for this item.",
        price: "0.00",
      });
      setItems((current) => [item, ...current]);
      setSelectedItemId(item.id);
      setSearchText("");
      setActiveFilterId("all");
      setFeedback("Draft item created. Edit it, then publish to save changes.");
    } catch (caught) {
      fail(caught, "Unable to create the item.");
    } finally {
      setSaving(false);
    }
  }, [fail, selectedCategoryId]);

  const publishItem = useCallback(async () => {
    if (!selectedItem) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await adminRepository.updateItem(selectedItem.id, {
        name: selectedItem.name,
        description: selectedItem.description,
        price: selectedItem.price,
        visibility: "visible",
      });
      setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setFeedback(`Saved and published "${updated.name}".`);
      menuRepository.invalidateCatalog();
    } catch (caught) {
      fail(caught, "Unable to publish the item.");
    } finally {
      setSaving(false);
    }
  }, [fail, selectedItem]);

  const setAvailability = useCallback(
    async (inStock: boolean) => {
      if (!selectedItem) return;
      setSaving(true);
      setError(null);
      try {
        const updated = await adminRepository.updateItem(selectedItem.id, { inStock });
        // Availability saves independently; retain any item-field edits that
        // are still waiting for Save & publish.
        setItems((current) =>
          current.map((item) =>
            item.id === updated.id ? { ...item, inStock: updated.inStock } : item
          )
        );
        setFeedback(`Marked "${selectedItem.name}" ${inStock ? "in stock" : "unavailable"}.`);
        menuRepository.invalidateCatalog();
      } catch (caught) {
        fail(caught, "Unable to update availability.");
      } finally {
        setSaving(false);
      }
    },
    [fail, selectedItem]
  );

  const saveModifierOptions = useCallback(async () => {
    if (!selectedItem) return;
    const populated = modifierOptions.filter((option) => option.label.trim());
    setSaving(true);
    setError(null);
    try {
      const groups = await adminRepository.replaceModifierOptions(selectedItem.id, populated);
      const groupIds = groups.map((group) => group.id);
      setModifierGroups((current) => [
        ...current.filter((group) => !selectedItem.modifierGroupIds.includes(group.id)),
        ...groups,
      ]);
      setItems((current) =>
        current.map((item) =>
          item.id === selectedItem.id ? { ...item, modifierGroupIds: groupIds } : item
        )
      );
      setModifierOptions(modifierDrafts(groupIds, groups));
      setFeedback("Modifier options saved.");
      menuRepository.invalidateCatalog();
    } catch (caught) {
      fail(caught, "Unable to save modifier options.");
    } finally {
      setSaving(false);
    }
  }, [fail, modifierOptions, selectedItem]);

  const bulkEdit = useCallback(() => {
    setFeedback("Bulk edit is not connected yet.");
  }, []);

  return {
    categories,
    selectedCategoryId,
    selectCategory,
    addCategory,
    deleteCategory,
    searchText,
    setSearchText,
    activeFilterId,
    setFilter: setActiveFilterId,
    filteredItems,
    selectedItem,
    selectItem,
    updateField,
    modifierOptions,
    updateModifierOption,
    saveModifierOptions,
    addItem,
    bulkEdit,
    publishItem,
    markInStock: () => setAvailability(true),
    markUnavailable: () => setAvailability(false),
    loading,
    saving,
    error,
    reload: () => void load(),
    feedback,
  };
}
