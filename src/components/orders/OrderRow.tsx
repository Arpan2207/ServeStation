/**
 * A single Figma-aligned order row shown in the Orders List.
 * The row keeps the original mockup structure: status pill at the top,
 * order destination below, compact meta text, and total aligned right.
 */

import React from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export interface OrderRowData {
  id: string;
  orderNumber: string;
  destination: string;
  statusLabel: string;
  statusTone: "preparing" | "ready" | "closed";
  meta: string;
  items: number;
  total: string;
}

interface OrderRowProps {
  order: OrderRowData;
}

export function OrderRow({ order }: OrderRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.inner}>
        <View style={styles.content}>
          <View
            style={[
              styles.statusPill,
              order.statusTone === "ready" && styles.readyPill,
              order.statusTone === "closed" && styles.closedPill,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                order.statusTone === "ready" && styles.readyText,
                order.statusTone === "closed" && styles.closedText,
              ]}
            >
              {order.statusLabel}
            </Text>
          </View>

          <Text style={styles.orderTitle}>
            #{order.orderNumber} · {order.destination}
          </Text>
          <Text style={styles.meta}>{order.meta}</Text>
        </View>

        <Text style={styles.total}>{order.total}</Text>
      </View>
    </View>
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
  statusPill: {
    borderRadius: 999,
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  readyPill: {
    backgroundColor: "#deeaff",
  },
  closedPill: {
    backgroundColor: "#daf3e4",
  },
  statusText: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 12,
    lineHeight: 16,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  readyText: {
    color: "#346aff",
  },
  closedText: {
    color: "#057542",
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
