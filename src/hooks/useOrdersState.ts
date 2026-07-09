/**
 * Local, frontend-only state hook powering the Orders List screen.
 *
 * Owns the active tab (open/closed) and the search query, and derives the
 * filtered order list from the shared mock data. Order selection itself is
 * handled via route params (the detail screen looks the order up by id), so
 * this hook intentionally stays focused on list filtering.
 */

import { useMemo, useState } from "react";

import { ordersRepository } from "@/repositories";
import type { Order, OrderTab } from "@/types/orders";

/* Orders sourced through the repository boundary (not from mock modules). */
const ORDERS: Order[] = ordersRepository.getOrders();

export interface UseOrdersState {
  tab: OrderTab;
  setTab: (tab: OrderTab) => void;
  searchText: string;
  setSearchText: (text: string) => void;
  filteredOrders: Order[];
}

/**
 * Provide Orders List tab + search state and the derived filtered list.
 * @returns The active tab, search text, their setters, and the filtered orders.
 */
export function useOrdersState(): UseOrdersState {
  const [tab, setTab] = useState<OrderTab>("open");
  const [searchText, setSearchText] = useState<string>("");

  const filteredOrders = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return ORDERS.filter((order) => {
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
  }, [tab, searchText]);

  return { tab, setTab, searchText, setSearchText, filteredOrders };
}
