/**
 * Orders List screen — Figma-aligned compact queue view.
 * The screen intentionally uses static/mock rows only and mirrors the
 * MCP reference layout: cream rounded frame, header actions, tabs/search row,
 * and four large rounded order rows.
 */

import React from "react";
import { ScrollView, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { Chip } from "@/components/ui/Chip";
import { Screen } from "@/components/ui/Screen";
import { OrderRow, OrderRowData } from "./OrderRow";

/* ── Mock order data matched to the Figma screenshot ─── */

const ORDERS: OrderRowData[] = [
  {
    id: "1",
    orderNumber: "1042",
    destination: "Table 14",
    statusLabel: "Preparing",
    statusTone: "preparing",
    items: 3,
    meta: "3 items · dine-in · Jordan · created 2 min ago",
    total: "$43.60",
  },
  {
    id: "2",
    orderNumber: "1041",
    destination: "Pickup",
    statusLabel: "Ready soon",
    statusTone: "ready",
    items: 2,
    meta: "2 items · ready soon · Mina · created 7 min ago",
    total: "$19.20",
  },
  {
    id: "3",
    orderNumber: "1038",
    destination: "Delivery",
    statusLabel: "Closed",
    statusTone: "closed",
    items: 4,
    meta: "4 items · closed · Samir · completed 14 min ago",
    total: "$51.80",
  },
  {
    id: "4",
    orderNumber: "1035",
    destination: "Counter",
    statusLabel: "Preparing",
    statusTone: "preparing",
    items: 1,
    meta: "1 item · dine-in · Aria · created 18 min ago",
    total: "$8.40",
  },
];

/* ── Component ───────────────────────────────────────── */

export function OrdersListScreen() {
  return (
    <Screen>
      <View style={styles.screen}>
        <View style={styles.frame}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Orders</Text>
              <Text style={styles.subtitle}>
                A dedicated queue with longer order rows for faster scanning.
              </Text>
            </View>

            <View style={styles.headerActions}>
              <View style={styles.filterButton}>
                <Text style={styles.filterLabel}>Filter</Text>
              </View>
              <View style={styles.newOrderButton}>
                <Text style={styles.newOrderLabel}>New order</Text>
              </View>
            </View>
          </View>

          <View style={styles.controls}>
            <Chip label="Open orders" active={false} style={styles.tabChip} />
            <Chip label="Closed orders" active={false} style={styles.tabChip} />
            <View style={styles.searchBar}>
              <Text style={styles.searchText}>Search by order ID or customer...</Text>
            </View>
          </View>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {ORDERS.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
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
    height: 62,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 18,
    overflow: "hidden",
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 6,
    overflow: "hidden",
  },
  title: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 28,
    lineHeight: 32,
    color: theme.colors.textPrimary,
    fontWeight: "700",
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.icon,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    height: 50,
    overflow: "hidden",
  },
  filterButton: {
    width: 92,
    height: 42,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: theme.radii.lg,
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
    borderRadius: theme.radii.lg,
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
  controls: {
    width: "100%",
    height: 49,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    overflow: "hidden",
  },
  tabChip: {
    height: 42,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: theme.radii.lg,
  },
  searchBar: {
    flex: 1,
    minWidth: 0,
    height: 42,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surfaceMuted,
    justifyContent: "center",
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  searchText: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.icon,
  },
  list: {
    flex: 1,
    width: "100%",
    minHeight: 0,
  },
  listContent: {
    gap: 14,
  },
}));
