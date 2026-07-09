/**
 * Repository interfaces — the single data boundary between the UI (screens +
 * hooks) and whatever backs the data (mock adapter now, Supabase later).
 *
 * Screens and hooks depend only on these interfaces, never on `src/lib/mock*`
 * or on Supabase directly. Each method returns either the per-screen view types
 * (used by the current UI) or the canonical domain model (used by future
 * backend/reporting code); swapping the adapter changes neither signature.
 */

import type { Catalog } from "@/domain/menu";
import type { Order as CanonicalOrder } from "@/domain/orders";
import type {
  AdminCategory,
  AdminFilterChip,
  AdminMenuItem,
  AdminModifierGroup,
} from "@/types/admin";
import type { Order as OrderView } from "@/types/orders";
import type { MenuCategory, MenuItem } from "@/types/pos";

/** Reads for the POS catalog (categories, items, pricing config). */
export interface MenuRepository {
  /** Ordered category list for the POS category bar (view shape). */
  getCategories(): MenuCategory[];
  /** Id of the category selected on first mount. */
  getDefaultCategoryId(): string;
  /** All sellable menu items (view shape, inline modifiers). */
  getItems(): MenuItem[];
  /** Look up a single item by id. */
  getItemById(id: string): MenuItem | undefined;
  /** Flat tax rate applied to the cart subtotal. */
  getTaxRate(): number;
  /** Canonical, backend-facing catalog snapshot (normalized). */
  getCatalog(): Catalog;
}

/** Reads for orders (list + detail), plus canonical access for reporting. */
export interface OrdersRepository {
  /** All orders (view shape) across both open/closed queues. */
  getOrders(): OrderView[];
  /** Look up a single order by id; undefined when missing. */
  getOrderById(id: string | undefined): OrderView | undefined;
  /** Build the compact list meta line, e.g. "3 items · dine-in · 2 min ago". */
  getOrderMeta(order: OrderView): string;
  /** Canonical, backend-facing orders (numeric money, lifecycle, timestamps). */
  getCanonicalOrders(): CanonicalOrder[];
}

/** Reads for the Admin workspace (editable catalog + editor config). */
export interface AdminRepository {
  /** Editable categories shown in the left panel. */
  getCategories(): AdminCategory[];
  /** Category selected on first mount. */
  getDefaultCategoryId(): string;
  /** Item selected on first mount. */
  getDefaultItemId(): string;
  /** All editable menu items (view shape, string prices). */
  getItems(): AdminMenuItem[];
  /** Modifier groups available in the editor. */
  getModifierGroups(): AdminModifierGroup[];
  /** Top utility-row filter chips. */
  getFilterChips(): AdminFilterChip[];
  /** Format an editable numeric price string for display, e.g. "$13.50". */
  formatPrice(price: string): string;
  /** Canonical, backend-facing catalog derived from the admin data. */
  getCatalog(): Catalog;
}
