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
import type {
  Order as CanonicalOrder,
  OrderCreateInput,
  OrderStatus,
} from "@/domain/orders";
import type {
  AdminCategory,
  AdminFilterChip,
  AdminMenuItem,
  AdminModifierGroup,
} from "@/types/admin";
import type { Order as OrderView } from "@/types/orders";
import type { MenuCategory, MenuItem } from "@/types/pos";

/**
 * Reads for the POS catalog (categories, items, pricing config).
 *
 * Catalog reads are async because a real backend (Supabase) fetches them over
 * the network; the mock adapter simply resolves immediately. Pure config values
 * that are not backend-derived yet (`getDefaultCategoryId`, `getTaxRate`) stay
 * synchronous.
 */
export interface MenuRepository {
  /** Ordered category list for the POS category bar (view shape). */
  getCategories(): Promise<MenuCategory[]>;
  /** Id of the category selected on first mount (synthetic "popular" view). */
  getDefaultCategoryId(): string;
  /** All sellable menu items (view shape, inline modifiers). */
  getItems(): Promise<MenuItem[]>;
  /** Look up a single item by id. */
  getItemById(id: string): Promise<MenuItem | undefined>;
  /** Flat tax rate applied to the cart subtotal. */
  getTaxRate(): number;
  /** Canonical, backend-facing catalog snapshot (normalized). */
  getCatalog(): Promise<Catalog>;
}

/**
 * Orders data boundary.
 *
 * The operations are intentionally shaped around the reviewed order contract
 * (create-from-cart, queue reads, guarded transitions, cancellation) rather
 * than exposing a generic `updateOrder(anyFields)` — so invalid lifecycle
 * changes are hard to express and the Supabase adapter can mirror the guarded
 * `apply_order_status_transition` RPC one-to-one.
 */
export interface OrdersRepository {
  /* ── View reads (current UI: Orders list + detail) ── */

  /** All orders (view shape) across both open/closed queues. */
  getOrders(): OrderView[];
  /** Look up a single order by id; undefined when missing. */
  getOrderById(id: string | undefined): OrderView | undefined;
  /** Build the compact list meta line, e.g. "3 items · dine-in · 2 min ago". */
  getOrderMeta(order: OrderView): string;

  /* ── Canonical reads (backend/reporting facing) ── */

  /** Canonical, backend-facing orders (numeric money, status, timestamps). */
  getCanonicalOrders(): CanonicalOrder[];
  /** Active queue only (submitted/preparing/ready), optionally store-scoped. */
  getActiveOrders(storeId?: string): CanonicalOrder[];
  /** Historical queue only (completed/cancelled), optionally store-scoped. */
  getOrderHistory(storeId?: string): CanonicalOrder[];
  /** Canonical order with items/modifiers; undefined when missing. */
  getCanonicalOrderById(id: string | undefined): CanonicalOrder | undefined;

  /* ── Guarded writes (the only ways to mutate an order) ── */

  /** Create and persist a `submitted` order from a local cart snapshot. */
  createOrder(input: OrderCreateInput): Promise<CanonicalOrder>;
  /**
   * Move an order along an approved path only. Throws when the transition is
   * invalid (e.g. completed → preparing) or the order is missing.
   */
  transitionOrder(id: string, to: OrderStatus): CanonicalOrder;
  /** Cancel an eligible order with a required reason. */
  cancelOrder(id: string, reason: string): CanonicalOrder;
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
