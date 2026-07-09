/**
 * Local, frontend-only state hook powering the Home POS screen.
 *
 * Combines simple `useState` UI state (selected category, selected item,
 * search text, order type, selected modifiers) with a `useReducer`-driven
 * cart so quantity/clear transitions stay predictable. All computed values
 * the UI needs (filtered items, selected item, totals, summary) are derived
 * here and returned, keeping the screen components purely presentational.
 */

import { useCallback, useMemo, useReducer, useState } from "react";

import { menuRepository } from "@/repositories";
import type {
  CartLine,
  MenuItem,
  Modifier,
  OrderTotals,
  OrderType,
} from "@/types/pos";

/* Catalog data + config sourced through the repository boundary (never from
   mock-data modules directly), so a future Supabase adapter can replace it. */
const MENU_ITEMS: MenuItem[] = menuRepository.getItems();
const DEFAULT_CATEGORY_ID: string = menuRepository.getDefaultCategoryId();
const TAX_RATE: number = menuRepository.getTaxRate();

/* ── Cart reducer ────────────────────────────────────── */

/** Actions that mutate the cart line collection. */
type CartAction =
  | { type: "ADD"; item: MenuItem; modifiers: Modifier[] }
  | { type: "INCREMENT"; lineId: string }
  | { type: "DECREMENT"; lineId: string }
  | { type: "REMOVE"; lineId: string }
  | { type: "CLEAR" };

/**
 * Build a deterministic cart-line id from an item and its selected modifiers,
 * so adding the same configuration twice stacks quantity instead of creating
 * a duplicate line.
 */
function buildLineId(itemId: string, modifiers: Modifier[]): string {
  const modPart = modifiers
    .map((m) => m.id)
    .sort()
    .join("+");
  return modPart ? `${itemId}__${modPart}` : itemId;
}

/** Compose the line "note" from selected modifiers, falling back to a hint. */
function buildLineNote(modifiers: Modifier[]): string {
  if (modifiers.length === 0) return "No customizations";
  return modifiers.map((m) => m.label).join(", ");
}

/** Pure reducer for all cart mutations. */
function cartReducer(state: CartLine[], action: CartAction): CartLine[] {
  switch (action.type) {
    case "ADD": {
      const lineId = buildLineId(action.item.id, action.modifiers);
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
        note: buildLineNote(action.modifiers),
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
  addSelectedToCart: () => void;
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
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<string>(DEFAULT_CATEGORY_ID);
  const [searchText, setSearchText] = useState<string>("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(
    MENU_ITEMS[0]?.id ?? null
  );
  const [selectedModifierIds, setSelectedModifierIds] = useState<string[]>([]);
  const [orderType, setOrderType] = useState<OrderType>("Dine-in");
  const [lastPlacedSummary, setLastPlacedSummary] = useState<string | null>(
    null
  );

  const [cart, dispatch] = useReducer(cartReducer, []);

  /* Filter the catalog by the active category and search text. */
  const filteredItems = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return MENU_ITEMS.filter((item) => {
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
  }, [selectedCategoryId, searchText]);

  /* Resolve the selected item from its id. */
  const selectedItem = useMemo(
    () => MENU_ITEMS.find((item) => item.id === selectedItemId) ?? null,
    [selectedItemId]
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
  const addSelectedToCart = useCallback(() => {
    if (!selectedItem) return;
    dispatch({
      type: "ADD",
      item: selectedItem,
      modifiers: resolveSelectedModifiers(selectedItem),
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
    const tax = subtotal * TAX_RATE;
    return { subtotal, tax, total: subtotal + tax };
  }, [cart]);

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
