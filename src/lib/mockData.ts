/**
 * Static, frontend-only mock data for the POS prototype.
 * This is the single source of truth the Home POS screen derives its UI from,
 * replacing the inline arrays that previously lived inside the components.
 */

import type { MenuCategory, MenuItem, Modifier } from "@/types/pos";

/* ── Reusable modifier sets ──────────────────────────── */

/** Burger-style customizations (some carry a small upcharge). */
const burgerModifiers: Modifier[] = [
  { id: "no-onions", label: "No onions", priceDelta: 0 },
  { id: "extra-pickles", label: "Extra pickles", priceDelta: 0.5 },
  { id: "gf-bun", label: "Gluten-free bun", priceDelta: 1.5 },
];

/** Bowl / wrap customizations. */
const bowlModifiers: Modifier[] = [
  { id: "no-feta", label: "No feta", priceDelta: 0 },
  { id: "extra-avocado", label: "Extra avocado", priceDelta: 1.25 },
  { id: "add-chicken", label: "Add chicken", priceDelta: 2.5 },
];

/** Drink customizations. */
const drinkModifiers: Modifier[] = [
  { id: "large-size", label: "Large size", priceDelta: 1 },
  { id: "extra-ice", label: "Extra ice", priceDelta: 0 },
];

/** Simple/no customizations for basic sides and desserts. */
const noModifiers: Modifier[] = [];

/* ── Categories ──────────────────────────────────────── */

/**
 * The category list shown in the top bar. "Popular" is a curated view that
 * surfaces items flagged `popular` rather than a real category assignment.
 */
export const CATEGORIES: MenuCategory[] = [
  { id: "popular", label: "Popular" },
  { id: "burgers", label: "Burgers" },
  { id: "bowls", label: "Bowls" },
  { id: "sides", label: "Sides" },
  { id: "drinks", label: "Drinks" },
  { id: "desserts", label: "Desserts" },
];

/** The id of the category selected when the screen first mounts. */
export const DEFAULT_CATEGORY_ID = "popular";

/* ── Menu items ──────────────────────────────────────── */

export const MENU_ITEMS: MenuItem[] = [
  {
    id: "smash-burger",
    name: "Smash Burger",
    description: "Double patty, cheddar, pickles, house sauce.",
    price: 13.5,
    categoryId: "burgers",
    popular: true,
    modifiers: burgerModifiers,
  },
  {
    id: "hot-honey-chicken",
    name: "Hot Honey Chicken",
    description: "Crispy chicken, slaw, chili honey glaze.",
    price: 14.25,
    categoryId: "burgers",
    popular: true,
    modifiers: burgerModifiers,
  },
  {
    id: "green-bowl",
    name: "Green Bowl",
    description: "Rice, avocado, greens, roasted vegetables.",
    price: 11.75,
    categoryId: "bowls",
    popular: true,
    modifiers: bowlModifiers,
  },
  {
    id: "chicken-wrap",
    name: "Chicken Wrap",
    description: "Grilled chicken, greens, and aioli in a soft wrap.",
    price: 11.9,
    categoryId: "bowls",
    popular: false,
    modifiers: bowlModifiers,
  },
  {
    id: "classic-fries",
    name: "Classic Fries",
    description: "Crispy fries with sea salt and herb seasoning.",
    price: 6.5,
    categoryId: "sides",
    popular: false,
    modifiers: noModifiers,
  },
  {
    id: "onion-rings",
    name: "Onion Rings",
    description: "Beer-battered rings with smoky dip.",
    price: 5.25,
    categoryId: "sides",
    popular: false,
    modifiers: noModifiers,
  },
  {
    id: "sparkling-lime",
    name: "Sparkling Lime",
    description: "Fresh citrus soda with mint and crushed ice.",
    price: 4.25,
    categoryId: "drinks",
    popular: true,
    modifiers: drinkModifiers,
  },
  {
    id: "iced-coffee",
    name: "Iced Coffee",
    description: "Cold brew over ice with a splash of cream.",
    price: 3.75,
    categoryId: "drinks",
    popular: false,
    modifiers: drinkModifiers,
  },
  {
    id: "choco-brownie",
    name: "Choco Brownie",
    description: "Warm fudge brownie with sea salt.",
    price: 5.5,
    categoryId: "desserts",
    popular: false,
    modifiers: noModifiers,
  },
];

/* ── Pricing config ──────────────────────────────────── */

/** Flat mock tax rate applied to the cart subtotal (9%). */
export const TAX_RATE = 0.09;

// Currency formatting now lives in the canonical domain layer
// (`@/domain/money` → `formatMoney` / `formatCurrency`) so presentation logic
// is not coupled to this mock-data module.
