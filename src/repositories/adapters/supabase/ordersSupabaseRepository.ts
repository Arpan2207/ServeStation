/**
 * Supabase-backed adapter for {@link OrdersRepository} (Phase 3, Step 7).
 *
 * This adapter now covers the full order surface against Supabase:
 *  - reads: the Open queue (`open`), the Closed queue (`paid`/`cancelled`), and
 *    a single order with its items + modifiers (via PostgREST embedding);
 *  - writes: `createOrder` (atomic insert through the `create_order` RPC, as
 *    either `open` or `paid`), plus `markOrderPaid` / `cancelOrder` which route
 *    through the guarded `apply_order_status_transition` RPC.
 *
 * `createOrder` builds the canonical order client-side (ids, money, and
 * item/modifier snapshots via `src/domain/orders.ts`) so an order is never
 * stored with missing items and the money invariant always holds. The store id
 * is resolved once from the seeded store.
 */

import {
  createOrder as buildOrder,
  type Order as CanonicalOrder,
  type OrderItem,
  type OrderStatus,
} from "@/domain/orders";
import type { FulfilmentType } from "@/domain/fulfilment";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { OrdersRepository } from "@/repositories/types";

/* ── Raw row shapes (subset of columns we select) ────────────────────────── */

interface OrderModifierRow {
  id: string;
  modifier_option_id: string | null;
  label: string;
  price_delta: number | string;
}

interface OrderItemRow {
  id: string;
  menu_item_id: string | null;
  name_snapshot: string;
  unit_price: number | string;
  quantity: number;
  note: string | null;
  order_item_modifiers: OrderModifierRow[] | null;
}

interface OrderRow {
  id: string;
  order_number: string;
  store_id: string | null;
  staff_id: string | null;
  fulfilment_type: FulfilmentType;
  status: OrderStatus;
  customer_name: string | null;
  destination_label: string | null;
  subtotal: number | string;
  tax: number | string;
  discount: number | string;
  total: number | string;
  note: string | null;
  cancellation_reason: string | null;
  paid_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  order_items: OrderItemRow[] | null;
}

/** Columns fetched for every order read, including nested items + modifiers. */
const ORDER_SELECT =
  "id, order_number, store_id, staff_id, fulfilment_type, status, " +
  "customer_name, destination_label, subtotal, tax, discount, total, note, " +
  "cancellation_reason, paid_at, cancelled_at, created_at, updated_at, " +
  "order_items ( id, menu_item_id, name_snapshot, unit_price, quantity, note, " +
  "order_item_modifiers ( id, modifier_option_id, label, price_delta ) )";

/** Map a DB order row (with embedded items/modifiers) into the canonical model. */
function mapOrderRow(row: OrderRow): CanonicalOrder {
  const items: OrderItem[] = (row.order_items ?? []).map((item) => ({
    id: item.id,
    menuItemId: item.menu_item_id ?? undefined,
    nameSnapshot: item.name_snapshot,
    unitPrice: Number(item.unit_price),
    quantity: item.quantity,
    modifiers: (item.order_item_modifiers ?? []).map((modifier) => ({
      modifierOptionId: modifier.modifier_option_id ?? undefined,
      label: modifier.label,
      priceDelta: Number(modifier.price_delta),
    })),
    note: item.note ?? undefined,
  }));

  return {
    id: row.id,
    orderNumber: row.order_number,
    storeId: row.store_id ?? undefined,
    staffId: row.staff_id ?? undefined,
    fulfilmentType: row.fulfilment_type,
    status: row.status,
    customerName: row.customer_name ?? undefined,
    destinationLabel: row.destination_label ?? undefined,
    money: {
      subtotal: Number(row.subtotal),
      tax: Number(row.tax),
      discount: Number(row.discount),
      total: Number(row.total),
    },
    timestamps: {
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      paidAt: row.paid_at ?? undefined,
      cancelledAt: row.cancelled_at ?? undefined,
    },
    items,
    note: row.note ?? undefined,
    cancellationReason: row.cancellation_reason ?? undefined,
  };
}

/** Build the Supabase-backed orders repository. */
export function createSupabaseOrdersRepository(): OrdersRepository {
  let storeIdCache: string | null | undefined;
  let storeIdCacheUserId: string | null = null;

  /** Resolve (and memoize) the default store id from the seeded store. */
  async function resolveDefaultStoreId(): Promise<string | null> {
    const supabase = getSupabaseClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw new Error(`Failed to resolve staff session: ${authError.message}`);
    const userId = authData.user?.id ?? null;
    if (storeIdCacheUserId !== userId) {
      storeIdCache = undefined;
      storeIdCacheUserId = userId;
    }
    if (storeIdCache !== undefined) return storeIdCache;

    const { data, error } = await supabase
      .from("stores")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to resolve store: ${error.message}`);
    }
    const resolved: string | null = data?.id ?? null;
    storeIdCache = resolved;
    return resolved;
  }

  /** Read orders filtered to the given status set, newest first. */
  async function readByStatuses(
    statuses: OrderStatus[],
    storeId?: string
  ): Promise<CanonicalOrder[]> {
    const supabase = getSupabaseClient();
    let query = supabase
      .from("orders")
      .select(ORDER_SELECT)
      .in("status", statuses)
      .order("created_at", { ascending: false });
    if (storeId !== undefined) query = query.eq("store_id", storeId);

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to load orders: ${error.message}`);
    }
    // The typed client cannot infer the nested-embed select shape, so cast
    // through `unknown` to our explicit row type.
    return ((data ?? []) as unknown as OrderRow[]).map(mapOrderRow);
  }

  /** Fetch a single order (with items + modifiers) by id. */
  async function fetchById(id: string): Promise<CanonicalOrder | undefined> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to load order: ${error.message}`);
    }
    return data ? mapOrderRow(data as unknown as OrderRow) : undefined;
  }

  /** Route an order to a new status through the guarded transition RPC. */
  async function transition(
    id: string,
    newStatus: OrderStatus,
    reason?: string
  ): Promise<CanonicalOrder> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.rpc("apply_order_status_transition", {
      p_order_id: id,
      p_new_status: newStatus,
      p_reason: reason ?? null,
    });
    if (error) {
      throw new Error(`Failed to update order: ${error.message}`);
    }
    // Re-read so the returned canonical order includes items + modifiers.
    const updated = await fetchById(id);
    if (!updated) throw new Error(`Order ${id} not found after update`);
    return updated;
  }

  return {
    async getActiveOrders(storeId): Promise<CanonicalOrder[]> {
      return readByStatuses(["open"], storeId);
    },

    async getOrderHistory(storeId): Promise<CanonicalOrder[]> {
      return readByStatuses(["paid", "cancelled"], storeId);
    },

    async getCanonicalOrderById(id): Promise<CanonicalOrder | undefined> {
      if (!id) return undefined;
      return fetchById(id);
    },

    async createOrder(input): Promise<CanonicalOrder> {
      const supabase = getSupabaseClient();
      const storeId = input.storeId ?? (await resolveDefaultStoreId()) ?? undefined;
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        throw new Error(authError?.message ?? "A staff session is required to place orders.");
      }

      // Build the canonical order (single source of the shape + money integrity),
      // then persist it verbatim. `paid` decides the entry status.
      const order = buildOrder({ ...input, storeId, staffId: authData.user.id });

      const itemsPayload = order.items.map((item) => ({
        menu_item_id: item.menuItemId ?? null,
        name_snapshot: item.nameSnapshot,
        unit_price: item.unitPrice,
        quantity: item.quantity,
        note: item.note ?? null,
        modifiers: item.modifiers.map((modifier) => ({
          modifier_option_id: modifier.modifierOptionId ?? null,
          label: modifier.label,
          price_delta: modifier.priceDelta,
        })),
      }));

      const { error } = await supabase.rpc("create_order", {
        p_order_id: order.id,
        p_store_id: storeId ?? null,
        p_order_number: order.orderNumber,
        p_fulfilment_type: order.fulfilmentType,
        p_status: order.status,
        p_customer_name: order.customerName ?? null,
        p_destination_label: order.destinationLabel ?? null,
        p_note: order.note ?? null,
        p_subtotal: order.money.subtotal,
        p_tax: order.money.tax,
        p_discount: order.money.discount,
        p_total: order.money.total,
        p_created_at: order.timestamps.createdAt,
        p_paid_at: order.timestamps.paidAt ?? null,
        p_items: itemsPayload,
      });

      if (error) {
        throw new Error(`Failed to place order: ${error.message}`);
      }

      return order;
    },

    async markOrderPaid(id): Promise<CanonicalOrder> {
      return transition(id, "paid");
    },

    async cancelOrder(id, reason): Promise<CanonicalOrder> {
      return transition(id, "cancelled", reason);
    },
  };
}
