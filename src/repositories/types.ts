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
} from "@/domain/orders";
import type {
  AdminCategory,
  AdminFilterChip,
  AdminMenuItem,
  AdminModifierGroup,
} from "@/types/admin";
import type { AuthSession, StaffProfile } from "@/types/auth";
import type { MenuCategory, MenuItem } from "@/types/pos";

/** Authentication and current-staff operations used by the app shell. */
export interface AuthRepository {
  /** Whether this adapter requires a real staff sign-in. */
  requiresSignIn: boolean;
  /** Read the locally persisted session, if one exists. */
  getSession(): Promise<AuthSession | null>;
  /** Subscribe to sign-in, token refresh, and sign-out session changes. */
  onAuthStateChange(listener: (session: AuthSession | null) => void): () => void;
  /** Authenticate a staff member with email and password. */
  signIn(email: string, password: string): Promise<AuthSession>;
  /** Clear the current persisted session. */
  signOut(): Promise<void>;
  /** Load the active store-scoped profile for a signed-in user. */
  getStaffProfile(userId: string): Promise<StaffProfile | null>;
}

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
 * (create-from-cart, queue reads, mark-paid, cancellation) rather than exposing
 * a generic `updateOrder(anyFields)` — so invalid lifecycle changes are hard to
 * express and the Supabase adapter can mirror the guarded
 * `apply_order_status_transition` RPC one-to-one.
 *
 * Reads return the canonical domain model (numeric money, status, timestamps);
 * the UI maps them to its view shape via `canonicalOrderToView`. All reads are
 * async because the Supabase adapter fetches over the network (the mock adapter
 * resolves immediately).
 */
export interface OrdersRepository {
  /* ── Canonical reads (async; UI maps to its view shape) ── */

  /** Open queue only (`open` = saved/unpaid), optionally store-scoped. */
  getActiveOrders(storeId?: string): Promise<CanonicalOrder[]>;
  /** Closed queue only (`paid`/`cancelled`), optionally store-scoped. */
  getOrderHistory(storeId?: string): Promise<CanonicalOrder[]>;
  /** Canonical order with items/modifiers; undefined when missing. */
  getCanonicalOrderById(
    id: string | undefined
  ): Promise<CanonicalOrder | undefined>;

  /* ── Guarded writes (the only ways to mutate an order) ── */

  /**
   * Create and persist an order from a local cart snapshot. When
   * `input.paid` is true the order is created `paid` (Closed); otherwise `open`.
   */
  createOrder(input: OrderCreateInput): Promise<CanonicalOrder>;
  /** Mark an eligible `open` order as `paid` (moves it to the Closed queue). */
  markOrderPaid(id: string): Promise<CanonicalOrder>;
  /** Cancel an eligible `open` order with a required reason. */
  cancelOrder(id: string, reason: string): Promise<CanonicalOrder>;
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
