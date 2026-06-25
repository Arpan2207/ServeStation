/**
 * Static, frontend-only mock data for the Admin workspace screen.
 * Single source of truth for the categories, editable menu items, filter
 * chips, and modifier groups, replacing the inline arrays that previously
 * lived inside the AdminScreen component.
 */

import type {
  AdminCategory,
  AdminFilterChip,
  AdminMenuItem,
  AdminModifierGroup,
} from "@/types/admin";

/* ── Categories ──────────────────────────────────────── */

export const ADMIN_CATEGORIES: AdminCategory[] = [
  { id: "burgers", name: "Burgers" },
  { id: "bowls", name: "Bowls" },
  { id: "drinks", name: "Drinks" },
  { id: "desserts", name: "Desserts" },
  { id: "breakfast", name: "Breakfast" },
];

/** Category selected when the screen first mounts. */
export const DEFAULT_ADMIN_CATEGORY_ID = "burgers";

/* ── Modifier groups ─────────────────────────────────── */

export const ADMIN_MODIFIER_GROUPS: AdminModifierGroup[] = [
  { id: "sides-upgrade", label: "Sides upgrade" },
  { id: "sauces", label: "Sauces" },
  { id: "bun-style", label: "Bun style" },
  { id: "cheese-add-ons", label: "Cheese add-ons" },
];

/* ── Filter chips ────────────────────────────────────── */

export const ADMIN_FILTER_CHIPS: AdminFilterChip[] = [
  { id: "all", label: "All items" },
  { id: "in-stock", label: "In stock" },
  { id: "out-of-stock", label: "Out of stock" },
];

/* ── Menu items ──────────────────────────────────────── */

export const ADMIN_MENU_ITEMS: AdminMenuItem[] = [
  {
    id: "smash-burger",
    name: "Smash Burger",
    description: "Double patty, cheddar, pickles, onion, house sauce.",
    price: "13.50",
    categoryId: "burgers",
    visibility: "visible",
    inStock: true,
    needsReview: false,
    modifierGroupIds: ["sides-upgrade", "sauces", "cheese-add-ons"],
  },
  {
    id: "hot-honey-chicken",
    name: "Hot Honey Chicken",
    description: "Crispy chicken, slaw, chili honey glaze.",
    price: "14.25",
    categoryId: "burgers",
    visibility: "visible",
    inStock: true,
    needsReview: true,
    modifierGroupIds: ["sauces", "bun-style"],
  },
  {
    id: "classic-cheeseburger",
    name: "Classic Cheeseburger",
    description: "Single patty, cheddar, pickles.",
    price: "11.90",
    categoryId: "burgers",
    visibility: "visible",
    inStock: true,
    needsReview: false,
    modifierGroupIds: ["cheese-add-ons", "bun-style"],
  },
  {
    id: "veggie-stack",
    name: "Veggie Stack",
    description: "Plant-based patty, tomato, lettuce.",
    price: "12.40",
    categoryId: "burgers",
    visibility: "draft",
    inStock: false,
    needsReview: true,
    modifierGroupIds: ["sauces"],
  },
  {
    id: "kids-burger",
    name: "Kids Burger",
    description: "Smaller bun, mild sauce.",
    price: "8.80",
    categoryId: "burgers",
    visibility: "visible",
    inStock: true,
    needsReview: false,
    modifierGroupIds: [],
  },
  {
    id: "green-bowl",
    name: "Green Bowl",
    description: "Rice, avocado, greens, roasted vegetables.",
    price: "11.75",
    categoryId: "bowls",
    visibility: "visible",
    inStock: true,
    needsReview: false,
    modifierGroupIds: ["sauces"],
  },
  {
    id: "chicken-wrap",
    name: "Chicken Wrap",
    description: "Grilled chicken, greens, and aioli in a soft wrap.",
    price: "11.90",
    categoryId: "bowls",
    visibility: "visible",
    inStock: false,
    needsReview: true,
    modifierGroupIds: ["sauces"],
  },
  {
    id: "sparkling-lime",
    name: "Sparkling Lime",
    description: "Fresh citrus soda with mint and crushed ice.",
    price: "4.25",
    categoryId: "drinks",
    visibility: "visible",
    inStock: true,
    needsReview: false,
    modifierGroupIds: [],
  },
  {
    id: "iced-coffee",
    name: "Iced Coffee",
    description: "Cold brew over ice with a splash of cream.",
    price: "3.75",
    categoryId: "drinks",
    visibility: "visible",
    inStock: true,
    needsReview: false,
    modifierGroupIds: [],
  },
  {
    id: "choco-brownie",
    name: "Choco Brownie",
    description: "Warm fudge brownie with sea salt.",
    price: "5.50",
    categoryId: "desserts",
    visibility: "visible",
    inStock: true,
    needsReview: false,
    modifierGroupIds: [],
  },
  {
    id: "breakfast-burrito",
    name: "Breakfast Burrito",
    description: "Egg, cheese, potato, and salsa roja.",
    price: "9.40",
    categoryId: "breakfast",
    visibility: "draft",
    inStock: true,
    needsReview: true,
    modifierGroupIds: ["sauces"],
  },
];

/** Id of the item selected when the screen first mounts. */
export const DEFAULT_ADMIN_ITEM_ID = "smash-burger";

/* ── Helpers ─────────────────────────────────────────── */

/**
 * Format an editable numeric price string for display.
 * @param price The raw numeric string, e.g. "13.50".
 * @returns The price prefixed with a currency symbol, e.g. "$13.50".
 */
export function formatAdminPrice(price: string): string {
  return `$${price}`;
}
