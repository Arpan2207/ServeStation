/**
 * Supabase-backed adapter for {@link OrdersRepository} (Phase 3, Step 6).
 *
 * For this step only order *creation* is persisted to Supabase; the Orders
 * list/detail *reads* still come from the mock adapter (wrapped below) until
 * Step 7 connects them. This keeps the Orders screens working while
 * `placeOrder` writes real rows.
 *
 * `createOrder` builds the canonical order client-side (ids, money, and
 * item/modifier snapshots via `createSubmittedOrder`) and persists it through
 * the atomic `create_order` RPC, so an order is never stored with missing
 * items. The store id is resolved once from the seeded store.
 */

import { createSubmittedOrder, type Order as CanonicalOrder } from "@/domain/orders";
import { getSupabaseClient } from "@/lib/supabase/client";
import { createMockOrdersRepository } from "@/repositories/adapters/mock/ordersMockRepository";
import type { OrdersRepository } from "@/repositories/types";

/** Build the Supabase-backed orders repository. */
export function createSupabaseOrdersRepository(): OrdersRepository {
  // Reads and non-creation writes are delegated here until later steps replace
  // them with real Supabase queries.
  const fallback = createMockOrdersRepository();

  let storeIdCache: string | null | undefined;

  /** Resolve (and memoize) the default store id from the seeded store. */
  async function resolveDefaultStoreId(): Promise<string | null> {
    if (storeIdCache !== undefined) return storeIdCache;
    const supabase = getSupabaseClient();
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

  return {
    ...fallback,

    async createOrder(input): Promise<CanonicalOrder> {
      const supabase = getSupabaseClient();
      const storeId = input.storeId ?? (await resolveDefaultStoreId()) ?? undefined;

      // Build the canonical order (single source of the shape + money integrity),
      // then persist it verbatim.
      const order = createSubmittedOrder({ ...input, storeId });

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
        p_customer_name: order.customerName ?? null,
        p_destination_label: order.destinationLabel ?? null,
        p_note: order.note ?? null,
        p_subtotal: order.money.subtotal,
        p_tax: order.money.tax,
        p_discount: order.money.discount,
        p_total: order.money.total,
        p_created_at: order.timestamps.createdAt,
        p_submitted_at: order.timestamps.submittedAt,
        p_items: itemsPayload,
      });

      if (error) {
        throw new Error(`Failed to place order: ${error.message}`);
      }

      return order;
    },
  };
}
