/**
 * A single Figma-aligned order row shown in the Orders List (node 186:2).
 * Updated design: the top pill shows the order destination (e.g. "Table 14",
 * "Pickup", "Delivery") colored by order type, the title reads
 * "#<number> · <customer>", and a compact meta line sits below.
 */

import React from "react";
import { Pressable, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { ordersRepository } from "@/repositories";
import type { Order } from "@/types/orders";

interface OrderRowProps {
  order: Order;
  /** Whether this row is the currently selected one (subtle highlight). */
  selected?: boolean;
  onPress?: () => void;
}

/**
 * Presentational order row.
 * @param props The order to render, optional selected state, and press handler.
 */
export function OrderRow({ order, selected, onPress }: OrderRowProps) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      style={[styles.row, selected && styles.rowSelected]}
      onPress={onPress}
    >
      <View style={styles.inner}>
        <View style={styles.content}>
          <View
            style={[
              styles.pill,
              order.orderType === "pickup" && styles.pillPickup,
              order.orderType === "delivery" && styles.pillDelivery,
            ]}
          >
            <Text
              style={[
                styles.pillText,
                order.orderType === "pickup" && styles.pillTextPickup,
                order.orderType === "delivery" && styles.pillTextDelivery,
              ]}
            >
              {order.destination}
            </Text>
          </View>

          <Text style={styles.orderTitle}>
            #{order.orderNumber} · {order.customer}
          </Text>
          <Text style={styles.meta}>{ordersRepository.getOrderMeta(order)}</Text>
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

  /* Destination pill — default (dine-in) is orange */
  pill: {
    borderRadius: 999,
    backgroundColor: theme.colors.primaryLighter,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillPickup: {
    backgroundColor: "#deeaff",
  },
  pillDelivery: {
    backgroundColor: "#e9e2ff",
  },
  pillText: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 12,
    lineHeight: 16,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  pillTextPickup: {
    color: "#346aff",
  },
  pillTextDelivery: {
    color: "#6a3bff",
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
