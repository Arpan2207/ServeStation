/**
 * Local, frontend-only state hook powering the Home POS screen.
 *
 * Combines simple `useState` UI state (selected category, selected item,
 * search text, order type, selected modifiers) with a `useReducer`-driven
 * cart so quantity/clear transitions stay predictable. All computed values
 * the UI needs (filtered items, selected item, totals, summary) are derived
 * here and returned, keeping the screen components purely presentational.
 */

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";

import { useCatalog } from "@/hooks/useCatalog";
import type {
  CartLine,
  MenuCategory,
  MenuItem,
  Modifier,
  OrderTotals,
  OrderType,
} from "@/types/pos";

/* ── Cart reducer ────────────────────────────────────── */

/** Actions that mutate the cart line collection. */
type CartAction =
  | { type: "ADD"; item: MenuItem; modifiers: Modifier[]; note?: string }
  | { type: "INCREMENT"; lineId: string }
  | { type: "DECREMENT"; lineId: string }
  | { type: "REMOVE"; lineId: string }
  | { type: "CLEAR" };

/**
 * Build a deterministic cart-line id from an item and its selected modifiers,
 * so adding the same configuration twice stacks quantity instead of creating
 * a duplicate line.
 */
function buildLineId(itemId: string, modifiers: Modifier[], note?: string): string {
  const modPart = modifiers
    .map((m) => m.id)
    .sort()
    .join("+");
  const notePart = note?.trim().toLowerCase();
  const configuration = [modPart, notePart].filter(Boolean).join("__");
  return configuration ? `${itemId}__${configuration}` : itemId;
}

/** Compose the displayed cart-line note from modifiers and an optional instruction. */
function buildLineNote(modifiers: Modifier[], customNote?: string): string {
  const customization =
    modifiers.length === 0 ? "No customizations" : modifiers.map((m) => m.label).join(", ");
  const trimmedNote = customNote?.trim();
  return trimmedNote ? `${customization} · ${trimmedNote}` : customization;
}

/** Pure reducer for all cart mutations. */
function cartReducer(state: CartLine[], action: CartAction): CartLine[] {
  switch (action.type) {
    case "ADD": {
      const lineId = buildLineId(action.item.id, action.modifiers, action.note);
      const existing = state.find((line) => line.id === lineId);
      if (existing) {
        return state.map((line) =>
          line.id === lineId ? { ...line, qty: line.qty + 1 } : line
        );
      }
      const unitPrice =
        action.item.price +
        action.modifiers.reduce((sum, m) => sum + m.priceDelta, 0);
      const newLine: CartLine = {
        id: lineId,
        itemId: action.item.id,
        name: action.item.name,
        note: buildLineNote(action.modifiers, action.note),
        unitPrice,
        qty: 1,
      };
      return [...state, newLine];
    }
    case "INCREMENT":
      return state.map((line) =>
        line.id === action.lineId ? { ...line, qty: line.qty + 1 } : line
      );
    case "DECREMENT":
      // Drop the line entirely once quantity would hit zero.
      return state
        .map((line) =>
          line.id === action.lineId ? { ...line, qty: line.qty - 1 } : line
        )
        .filter((line) => line.qty > 0);
    case "REMOVE":
      return state.filter((line) => line.id !== action.lineId);
    case "CLEAR":
      return [];
    default:
      return state;
  }
}

/* ── Hook return shape ───────────────────────────────── */

export interface UsePosState {
  /* catalog loading */
  categories: MenuCategory[];
  catalogLoading: boolean;
  catalogError: string | null;
  reloadCatalog: () => void;

  /* selection + filters */
  selectedCategoryId: string;
  selectCategory: (categoryId: string) => void;
  searchText: string;
  setSearchText: (text: string) => void;
  filteredItems: MenuItem[];

  /* selected item + modifiers */
  selectedItem: MenuItem | null;
  selectItem: (itemId: string) => void;
  selectedModifierIds: string[];
  toggleModifier: (modifierId: string) => void;

  /* cart */
  cart: CartLine[];
  cartCount: number;
  addSelectedToCart: (note?: string) => void;
  addItemToCart: (item: MenuItem) => void;
  incrementLine: (lineId: string) => void;
  decrementLine: (lineId: string) => void;
  clearCart: () => void;

  /* order type + totals */
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  totals: OrderTotals;
  cartSummary: string;

  /* simulated order */
  placeOrder: () => void;
  lastPlacedSummary: string | null;
}

/* ── Hook ────────────────────────────────────────────── */

/**
 * Provide all interactive Home POS state and handlers.
 * @returns Selection, modifier, cart, order-type, and totals state plus the
 * handlers the POS components use to drive updates.
 */
export function usePosState(): UsePosState {
  /* Catalog is loaded asynchronously through the repository boundary. */
  const {
    categories,
    items,
    defaultCategoryId,
    taxRate,
    loading: catalogLoading,
    error: catalogError,
    reload: reloadCatalog,
  } = useCatalog();

  const [selectedCategoryId, setSelectedCategoryId] =
    useState<string>(defaultCategoryId);
  const [searchText, setSearchText] = useState<string>("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedModifierIds, setSelectedModifierIds] = useState<string[]>([]);

  /* Once the catalog loads, default the selection to the first item. */
  useEffect(() => {
    if (selectedItemId === null && items.length > 0) {
      setSelectedItemId(items[0].id);
    }
  }, [items, selectedItemId]);
  const [orderType, setOrderType] = useState<OrderType>("Dine-in");
  const [lastPlacedSummary, setLastPlacedSummary] = useState<string | null>(
    null
  );

  const [cart, dispatch] = useReducer(cartReducer, []);

  /* Filter the catalog by the active category and search text. */
  const filteredItems = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory =
        selectedCategoryId === "popular"
          ? item.popular
          : item.categoryId === selectedCategoryId;
      const matchesQuery =
        query.length === 0 ||
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [items, selectedCategoryId, searchText]);

  /* Resolve the selected item from its id. */
  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) ?? null,
    [items, selectedItemId]
  );

  /* Selecting a new item resets the modifier selection to that item. */
  const selectItem = useCallback((itemId: string) => {
    setSelectedItemId(itemId);
    setSelectedModifierIds([]);
  }, []);

  const selectCategory = useCallback((categoryId: string) => {
    setSelectedCategoryId(categoryId);
  }, []);

  /* Toggle a modifier id on/off for the currently selected item. */
  const toggleModifier = useCallback((modifierId: string) => {
    setSelectedModifierIds((prev) =>
      prev.includes(modifierId)
        ? prev.filter((id) => id !== modifierId)
        : [...prev, modifierId]
    );
  }, []);

  /* Resolve the selected modifier objects for the current item. */
  const resolveSelectedModifiers = useCallback(
    (item: MenuItem): Modifier[] =>
      item.modifiers.filter((m) => selectedModifierIds.includes(m.id)),
    [selectedModifierIds]
  );

  /* Add the currently selected item (with its modifiers) to the cart. */
  const addSelectedToCart = useCallback((note?: string) => {
    if (!selectedItem) return;
    dispatch({
      type: "ADD",
      item: selectedItem,
      modifiers: resolveSelectedModifiers(selectedItem),
      note,
    });
  }, [selectedItem, resolveSelectedModifiers]);

  /* Add an arbitrary item directly (e.g. from a menu card), no modifiers. */
  const addItemToCart = useCallback((item: MenuItem) => {
    dispatch({ type: "ADD", item, modifiers: [] });
  }, []);

  const incrementLine = useCallback((lineId: string) => {
    dispatch({ type: "INCREMENT", lineId });
  }, []);

  const decrementLine = useCallback((lineId: string) => {
    dispatch({ type: "DECREMENT", lineId });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  /* Derived cart figures. */
  const cartCount = useMemo(
    () => cart.reduce((sum, line) => sum + line.qty, 0),
    [cart]
  );

  const totals = useMemo<OrderTotals>(() => {
    const subtotal = cart.reduce(
      (sum, line) => sum + line.unitPrice * line.qty,
      0
    );
    const tax = subtotal * taxRate;
    return { subtotal, tax, total: subtotal + tax };
  }, [cart, taxRate]);

  /* Header summary string, e.g. "3 items · dine-in". */
  const cartSummary = useMemo(() => {
    const itemWord = cartCount === 1 ? "item" : "items";
    return `${cartCount} ${itemWord} · ${orderType.toLowerCase()}`;
  }, [cartCount, orderType]);

  /* Simulated, local-only place order: capture a summary and reset the cart. */
  const placeOrder = useCallback(() => {
    if (cart.length === 0) return;
    setLastPlacedSummary(
      `${cartCount} ${cartCount === 1 ? "item" : "items"} · ${totals.total.toFixed(
        2
      )}`
    );
    dispatch({ type: "CLEAR" });
  }, [cart.length, cartCount, totals.total]);

  return {
    categories,
    catalogLoading,
    catalogError,
    reloadCatalog,

    selectedCategoryId,
    selectCategory,
    searchText,
    setSearchText,
    filteredItems,

    selectedItem,
    selectItem,
    selectedModifierIds,
    toggleModifier,

    cart,
    cartCount,
    addSelectedToCart,
    addItemToCart,
    incrementLine,
    decrementLine,
    clearCart,

    orderType,
    setOrderType,
    totals,
    cartSummary,

    placeOrder,
    lastPlacedSummary,
  };
}
