/**
 * Mock adapter for {@link OrdersRepository}.
 *
 * Owns access to the static Orders mock data so hooks/screens no longer import
 * `src/lib/mockOrderData` directly. It serves the legacy view shapes to the UI
 * and canonical orders (via the order mapper) for backend/reporting code.
 *
 * The guarded write operations (create / transition / cancel) are backed by a
 * small in-memory canonical store and the pure domain lifecycle helpers, so the
 * mock enforces exactly the same rules the future Supabase adapter will (the DB
 * enforces them via `apply_order_status_transition`). This keeps the contract
 * honest and testable before any network code exists.
 */

import { buildOrderMeta, getOrderById, ORDERS } from "@/lib/mockOrderData";
import { orderViewToCanonical } from "@/mappers/orderMappers";
import {
  cancelOrder as cancelOrderDomain,
  createSubmittedOrder,
  isTerminalOrderStatus,
  transitionOrder as transitionOrderDomain,
  type Order as CanonicalOrder,
} from "@/domain/orders";
import type { OrdersRepository } from "@/repositories/types";

/** Build the mock-backed orders repository. */
export function createMockOrdersRepository(): OrdersRepository {
  /* Seed a mutable canonical store from the static mock views. This lets the
     write operations behave realistically (create/transition/cancel) without a
     backend, while reads for the current UI still use the original view data. */
  const canonicalStore: CanonicalOrder[] = ORDERS.map((order) =>
    orderViewToCanonical(order)
  );

  /** Find a canonical order index by id, or throw a clear error. */
  function requireIndex(id: string): number {
    const index = canonicalStore.findIndex((order) => order.id === id);
    if (index === -1) throw new Error(`Order ${id} not found`);
    return index;
  }

  return {
    getOrders() {
      return ORDERS;
    },
    getOrderById(id) {
      return getOrderById(id);
    },
    getOrderMeta(order) {
      return buildOrderMeta(order);
    },

    getCanonicalOrders(): CanonicalOrder[] {
      return [...canonicalStore];
    },
    getActiveOrders(storeId): CanonicalOrder[] {
      return canonicalStore.filter(
        (order) =>
          !isTerminalOrderStatus(order.status) &&
          (storeId === undefined || order.storeId === storeId)
      );
    },
    getOrderHistory(storeId): CanonicalOrder[] {
      return canonicalStore.filter(
        (order) =>
          isTerminalOrderStatus(order.status) &&
          (storeId === undefined || order.storeId === storeId)
      );
    },
    getCanonicalOrderById(id): CanonicalOrder | undefined {
      if (!id) return undefined;
      return canonicalStore.find((order) => order.id === id);
    },

    createOrder(input): CanonicalOrder {
      const order = createSubmittedOrder(input);
      canonicalStore.push(order);
      return order;
    },
    transitionOrder(id, to): CanonicalOrder {
      const index = requireIndex(id);
      const next = transitionOrderDomain(canonicalStore[index], to);
      canonicalStore[index] = next;
      return next;
    },
    cancelOrder(id, reason): CanonicalOrder {
      const index = requireIndex(id);
      const next = cancelOrderDomain(canonicalStore[index], reason);
      canonicalStore[index] = next;
      return next;
    },
  };
}
