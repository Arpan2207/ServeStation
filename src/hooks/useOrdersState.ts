/**
 * State hook powering the Orders List screen.
 *
 * Loads both order queues (Open + Closed) through the repository boundary —
 * Supabase when configured, otherwise the mock adapter — and maps the canonical
 * orders into the presentation view shape via `canonicalOrderToView`. Owns the
 * active tab (open/closed) and search query, and derives the filtered list.
 *
 * Reads are async (the Supabase adapter fetches over the network), so the hook
 * exposes loading/error state and a `reload`. It also re-fetches whenever the
 * screen regains focus, so orders placed on the POS screen appear on return.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";

import { canonicalOrderToView } from "@/mappers/orderMappers";
import { ordersRepository } from "@/repositories";
import type { Order, OrderTab } from "@/types/orders";

export interface UseOrdersState {
  tab: OrderTab;
  setTab: (tab: OrderTab) => void;
  searchText: string;
  setSearchText: (text: string) => void;
  /** Orders matching the active tab + search query (view shape). */
  filteredOrders: Order[];
  /** True while the initial (or a reload) fetch is in flight. */
  loading: boolean;
  /** Human-readable error message when the fetch failed, else null. */
  error: string | null;
  /** Re-run the orders fetch (e.g. from a retry button). */
  reload: () => void;
}

/**
 * Provide Orders List tab + search state and the derived filtered list.
 * @returns The active tab, search text, their setters, the filtered orders, and
 * loading/error/reload state.
 */
export function useOrdersState(): UseOrdersState {
  const [tab, setTab] = useState<OrderTab>("open");
  const [searchText, setSearchText] = useState<string>("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Guards against setting state after unmount / stale responses.
  const activeRequestId = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++activeRequestId.current;
    setLoading(true);
    setError(null);
    try {
      // Both queues are fetched in parallel and merged into one view list; the
      // tab filter below decides which are shown.
      const [active, history] = await Promise.all([
        ordersRepository.getActiveOrders(),
        ordersRepository.getOrderHistory(),
      ]);
      if (requestId !== activeRequestId.current) return;
      const views = [...active, ...history].map((order) =>
        canonicalOrderToView(order)
      );
      setOrders(views);
    } catch (err) {
      if (requestId !== activeRequestId.current) return;
      setError(err instanceof Error ? err.message : "Failed to load orders.");
    } finally {
      if (requestId === activeRequestId.current) setLoading(false);
    }
  }, []);

  // Load on first focus and refresh whenever the screen regains focus, so
  // newly placed orders show up on return from the POS screen. The cleanup
  // invalidates any in-flight request when the screen blurs/unmounts.
  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        activeRequestId.current += 1;
      };
    }, [load])
  );

  const filteredOrders = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesTab = order.tab === tab;
      const matchesQuery =
        query.length === 0 ||
        order.orderNumber.toLowerCase().includes(query) ||
        order.customer.toLowerCase().includes(query) ||
        order.destination.toLowerCase().includes(query) ||
        order.orderType.toLowerCase().includes(query) ||
        order.statusLabel.toLowerCase().includes(query);
      return matchesTab && matchesQuery;
    });
  }, [orders, tab, searchText]);

  return {
    tab,
    setTab,
    searchText,
    setSearchText,
    filteredOrders,
    loading,
    error,
    reload: load,
  };
}
