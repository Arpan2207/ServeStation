/**
 * Mock adapter for {@link OrdersRepository}.
 *
 * Backed by a small in-memory canonical store seeded from the static Orders
 * mock views, plus the pure domain lifecycle helpers. This lets the app run
 * (and the reads/writes behave realistically) without Supabase configured, and
 * it enforces exactly the same rules the Supabase adapter will (the DB enforces
 * them via `apply_order_status_transition`).
 *
 * All reads are async to match the interface (the Supabase adapter fetches over
 * the network); here they simply resolve immediately.
 */

import { ORDERS } from "@/lib/mockOrderData";
import { orderViewToCanonical } from "@/mappers/orderMappers";
import {
  cancelOrder as cancelOrderDomain,
  createOrder as buildOrder,
  isTerminalOrderStatus,
  markOrderPaid as markOrderPaidDomain,
  type Order as CanonicalOrder,
} from "@/domain/orders";
import type { OrdersRepository } from "@/repositories/types";

/** Build the mock-backed orders repository. */
export function createMockOrdersRepository(): OrdersRepository {
  /* Seed a mutable canonical store from the static mock views so the queue
     reads and write operations behave realistically without a backend. */
  const canonicalStore: CanonicalOrder[] = ORDERS.map((order) =>
    orderViewToCanonical(order)
  );

  /** Find a canonical order index by id, or throw a clear error. */
  function requireIndex(id: string): number {
    const index = canonicalStore.findIndex((order) => order.id === id);
    if (index === -1) throw new Error(`Order ${id} not found`);
    return index;
  }

  /** Filter the store by open/closed queue and optional store scope. */
  function queue(closed: boolean, storeId?: string): CanonicalOrder[] {
    return canonicalStore.filter(
      (order) =>
        isTerminalOrderStatus(order.status) === closed &&
        (storeId === undefined || order.storeId === storeId)
    );
  }

  return {
    async getActiveOrders(storeId): Promise<CanonicalOrder[]> {
      return queue(false, storeId);
    },
    async getOrderHistory(storeId): Promise<CanonicalOrder[]> {
      return queue(true, storeId);
    },
    async getCanonicalOrderById(id): Promise<CanonicalOrder | undefined> {
      if (!id) return undefined;
      return canonicalStore.find((order) => order.id === id);
    },

    async createOrder(input): Promise<CanonicalOrder> {
      const order = buildOrder(input);
      // Newest first, matching the Supabase adapter's created_at desc ordering.
      canonicalStore.unshift(order);
      return order;
    },
    async markOrderPaid(id): Promise<CanonicalOrder> {
      const index = requireIndex(id);
      const next = markOrderPaidDomain(canonicalStore[index]);
      canonicalStore[index] = next;
      return next;
    },
    async cancelOrder(id, reason): Promise<CanonicalOrder> {
      const index = requireIndex(id);
      const next = cancelOrderDomain(canonicalStore[index], reason);
      canonicalStore[index] = next;
      return next;
    },
  };
}
