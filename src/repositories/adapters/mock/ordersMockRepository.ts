/**
 * Mock adapter for {@link OrdersRepository}.
 *
 * Owns access to the static Orders mock data so hooks/screens no longer import
 * `src/lib/mockOrderData` directly. Exposes view shapes to the UI and canonical
 * orders (via the order mapper) for backend/reporting code.
 */

import { buildOrderMeta, getOrderById, ORDERS } from "@/lib/mockOrderData";
import { orderViewToCanonical } from "@/mappers/orderMappers";
import type { Order as CanonicalOrder } from "@/domain/orders";
import type { OrdersRepository } from "@/repositories/types";

/** Build the mock-backed orders repository. */
export function createMockOrdersRepository(): OrdersRepository {
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
      return ORDERS.map((order) => orderViewToCanonical(order));
    },
  };
}
