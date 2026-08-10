/**
 * A single Figma-aligned order row shown in the Orders List (node 186:2).
 * Its darker fulfillment marker is layered behind the guest name:
 * dine-in = orange, pickup = blue, delivery = purple.
 */

import React from "react";
import { Pressable, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import type { Order } from "@/types/orders";

interface OrderRowProps {
  order: Order;
  /** Whether this row is the currently selected one (subtle highlight). */
  selected?: boolean;
  onPress?: () => void;
}

/** Compose the compact meta line, e.g. "3 items · dine-in · created 2 min ago". */
function orderMetaLine(order: Order): string {
  const itemWord = order.items === 1 ? "item" : "items";
  return `${order.items} ${itemWord} · ${order.orderType} · ${order.timing}`;
}

/**
 * Presentational order row.
 * @param props The order to render, optional selected state, and press handler.
 */
export function OrderRow({ order, selected, onPress }: OrderRowProps) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper style={[styles.row, selected && styles.rowSelected]} onPress={onPress}>
      <View style={styles.inner}>
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.orderTitle}>#{order.orderNumber} · </Text>
            <View
              style={[
                styles.guestNameWrap,
                order.orderType === "pickup" && styles.guestNamePickup,
                order.orderType === "delivery" && styles.guestNameDelivery,
              ]}
            >
              <Text style={styles.orderTitle}>{order.customer}</Text>
            </View>
          </View>
          <Text style={styles.meta}>{orderMetaLine(order)}</Text>
        </View>

        <Text style={styles.total}>{order.total}</Text>
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    width: "100%",
    height: 126,
    padding: 18,
    borderRadius: 22,
    backgroundColor: theme.colors.surfaceWarm,
    overflow: "hidden",
  },
  rowSelected: {
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  inner: {
    flex: 1,
    height: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
  },
  content: {
    flex: 1,
    minWidth: 0,
    alignItems: "flex-start",
    gap: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },
  guestNameWrap: {
    flexShrink: 1,
    minWidth: 0,
    backgroundColor: "#f8cba3",
    borderRadius: 8,
    paddingHorizontal: 5,
    marginHorizontal: -5,
  },
  guestNamePickup: {
    backgroundColor: "#c9dcfb",
  },
  guestNameDelivery: {
    backgroundColor: "#d8caf6",
  },
  orderTitle: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 18,
    lineHeight: 24,
    color: theme.colors.textPrimary,
    fontWeight: "700",
  },
  meta: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.icon,
  },
  total: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 18,
    lineHeight: 24,
    color: theme.colors.textPrimary,
    fontWeight: "700",
  },
}));
