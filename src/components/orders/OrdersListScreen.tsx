/**
 * Orders List screen — Figma node 186:2 (revised).
 * Design update: no subtitle; the row pill shows the destination colored by
 * order type, and the title reads "#<number> · <customer>".
 *
 * Interactive (frontend-only): Open/Closed tabs, live search, and row press
 * that navigates to the detail screen with the order id as a route param.
 */

import React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { StyleSheet } from "react-native-unistyles";

import { Screen } from "@/components/ui/Screen";
import { useOrdersState } from "@/hooks/useOrdersState";
import { OrderRow } from "./OrderRow";

/* ── Component ───────────────────────────────────────── */

export function OrdersListScreen() {
  const router = useRouter();
  const orders = useOrdersState();

  return (
    <Screen>
      <View style={styles.screen}>
        <View style={styles.frame}>
          {/* Header — title + actions, no subtitle */}
          <View style={styles.header}>
            <Text style={styles.title}>Orders</Text>

            <View style={styles.headerActions}>
              <View style={styles.filterButton}>
                <Text style={styles.filterLabel}>Filter</Text>
              </View>
              <View style={styles.newOrderButton}>
                <Text style={styles.newOrderLabel}>New order</Text>
              </View>
            </View>
          </View>

          {/* Top bar — tabs + search */}
          <View style={styles.controls}>
            <Pressable
              style={[
                styles.tab,
                orders.tab === "open" && styles.tabActive,
              ]}
              onPress={() => orders.setTab("open")}
            >
              <Text
                style={[
                  styles.tabLabel,
                  orders.tab === "open" && styles.tabLabelActive,
                ]}
              >
                Open orders
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.tab,
                orders.tab === "closed" && styles.tabActive,
              ]}
              onPress={() => orders.setTab("closed")}
            >
              <Text
                style={[
                  styles.tabLabel,
                  orders.tab === "closed" && styles.tabLabelActive,
                ]}
              >
                Closed orders
              </Text>
            </Pressable>

            <View style={styles.searchBar}>
              <TextInput
                style={styles.searchInput}
                value={orders.searchText}
                onChangeText={orders.setSearchText}
                placeholder="Search by order ID or customer…"
                placeholderTextColor={styles.searchPlaceholder.color}
              />
            </View>
          </View>

          {/* List body */}
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {orders.filteredOrders.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No {orders.tab} orders match your search.
                </Text>
              </View>
            ) : (
              orders.filteredOrders.map((order) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  onPress={() =>
                    router.push({
                      pathname: "/orders/detail",
                      params: { id: order.id },
                    } as any)
                  }
                />
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Screen>
  );
}

/* ── Styles ──────────────────────────────────────────── */

const styles = StyleSheet.create((theme) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.sidebar,
    padding: 0,
  },
  frame: {
    flex: 1,
    width: "100%",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.textPrimary,
    borderRadius: 30,
    paddingHorizontal: 23,
    paddingTop: 23,
    paddingBottom: 1,
    gap: 18,
    overflow: "hidden",
  },
  header: {
    width: "100%",
    height: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 18,
    overflow: "hidden",
  },
  title: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 28,
    lineHeight: 32,
    color: theme.colors.textPrimary,
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    height: 48,
    overflow: "hidden",
  },
  filterButton: {
    width: 92,
    height: 42,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  filterLabel: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textPrimary,
    fontWeight: "600",
  },
  newOrderButton: {
    width: 118,
    height: 42,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  newOrderLabel: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textOnPrimary,
    fontWeight: "600",
  },

  /* Top bar — tabs + search */
  controls: {
    width: "100%",
    height: 45,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    overflow: "hidden",
  },
  tab: {
    height: 42,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
  },
  tabLabel: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textPrimary,
    fontWeight: "600",
  },
  tabLabelActive: {
    color: theme.colors.textOnPrimary,
  },
  searchBar: {
    flex: 1,
    minWidth: 0,
    height: 42,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceMuted,
    justifyContent: "center",
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  searchInput: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textPrimary,
    padding: 0,
  },
  searchPlaceholder: {
    color: theme.colors.icon,
  },

  /* List */
  list: {
    flex: 1,
    width: "100%",
    minHeight: 0,
  },
  listContent: {
    gap: 14,
    paddingBottom: 14,
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyText: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.icon,
  },
}));
