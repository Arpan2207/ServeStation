/**
 * Order Detail screen — Figma MCP node 186:53.
 * Two-column layout: main column (order summary) and
 * a right support column (payment + notes & support + actions).
 *
 * The displayed order is resolved from the `id` route param via the shared
 * mock data, falling back to the first order when no/unknown id is provided.
 */

import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet } from "react-native-unistyles";

import { Screen } from "@/components/ui/Screen";
import { ordersRepository } from "@/repositories";
import type { OrderType } from "@/types/orders";

const SUPPORT_CHIPS = ["Allergy note", "VIP guest", "Call before handoff"] as const;

/** Actions available on the order, each with the feedback it surfaces. */
const ACTIONS = [
  { label: "Print ticket", feedback: "Ticket sent to printer.", primary: true },
  { label: "Print receipt", feedback: "Receipt printed.", primary: false },
  { label: "Issue refund", feedback: "Refund issued (simulated).", primary: false },
] as const;

/** Map an order type to its capitalized display label. */
const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  "dine-in": "Dine-in",
  pickup: "Pickup",
  delivery: "Delivery",
};

/* ── Component ───────────────────────────────────────── */

export function OrderDetailScreen() {
  // Resolve the order from the route param, falling back to the first order.
  const { id } = useLocalSearchParams<{ id?: string }>();
  const order = ordersRepository.getOrderById(id) ?? ordersRepository.getOrders()[0];
  const router = useRouter();

  // Local, frontend-only interaction state.
  const [selectedChips, setSelectedChips] = useState<string[]>([
    SUPPORT_CHIPS[0],
  ]);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  /** Toggle a support chip on/off. */
  function toggleChip(chip: string) {
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  }

  return (
    <Screen>
      <View style={styles.screen}>
        <View style={styles.frame}>
          {/* Header — back button + title */}
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backLabel}>‹ Back</Text>
            </Pressable>
            <Text style={styles.title}>Order detail</Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* ── Main Column (wider) ── */}
            <View style={styles.mainColumn}>
              <View style={styles.summaryCard}>
                {/* Summary header */}
                <View style={styles.summaryHeader}>
                  <View style={styles.summaryInfo}>
                    <Text style={styles.orderHeading}>
                      Order #{order.orderNumber}
                    </Text>
                    <Text style={styles.orderMeta}>
                      {ORDER_TYPE_LABEL[order.orderType]} · {order.destination} ·{" "}
                      {order.customer}
                    </Text>
                  </View>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusText}>{order.statusLabel}</Text>
                  </View>
                </View>

                {/* Food line items */}
                {order.lineItems.map((item) => (
                  <View key={item.label} style={styles.lineRow}>
                    <Text style={styles.lineLabel}>{item.label}</Text>
                    <Text style={styles.linePrice}>{item.price}</Text>
                  </View>
                ))}

                {/* Spacer pushes tax/total to the bottom */}
                <View style={styles.spacer} />

                {/* Tax and Total pinned to the bottom */}
                <View style={styles.lineRow}>
                  <Text style={styles.lineLabel}>Tax</Text>
                  <Text style={styles.linePrice}>{order.tax}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalPrice}>{order.total}</Text>
                </View>
              </View>
            </View>

            {/* ── Side Column ── */}
            <ScrollView
              style={styles.sideColumn}
              contentContainerStyle={styles.sideContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Payment card */}
              <View style={styles.sideCard}>
                <Text style={styles.cardTitle}>Payment</Text>
                <Text style={styles.sideBody}>{order.payment}</Text>
                <Text style={styles.sideBody}>{order.prepTime}</Text>
              </View>

              {/* Notes & support card */}
              <View style={styles.sideCardLarge}>
                <Text style={styles.cardTitle}>Notes &amp; support</Text>
                <Text style={styles.sideBody}>
                  Use the right side for support details, allergy notes, or
                  pickup instructions.
                </Text>
                <View style={styles.chipsRow}>
                  {SUPPORT_CHIPS.map((chip) => {
                    const active = selectedChips.includes(chip);
                    return (
                      <Pressable
                        key={chip}
                        style={[styles.chip, active && styles.chipHighlight]}
                        onPress={() => toggleChip(chip)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            active && styles.chipTextHighlight,
                          ]}
                        >
                          {chip}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Actions card (moved here from main column) */}
              <View style={styles.actionsCard}>
                <Text style={styles.cardTitle}>Actions</Text>
                <View style={styles.actionRow}>
                  {ACTIONS.map((action) => (
                    <Pressable
                      key={action.label}
                      style={action.primary ? styles.actionPrimary : styles.actionSecondary}
                      onPress={() => setActionFeedback(action.feedback)}
                    >
                      <Text
                        style={
                          action.primary
                            ? styles.actionPrimaryLabel
                            : styles.actionSecondaryLabel
                        }
                      >
                        {action.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Local feedback for the last action performed */}
                {actionFeedback && (
                  <Text style={styles.actionFeedback}>{actionFeedback}</Text>
                )}
              </View>
            </ScrollView>
          </View>
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
    paddingTop: 20,
    paddingBottom: 1,
    gap: 12,
    overflow: "hidden",
  },

  /* Header — back button + title */
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    overflow: "hidden",
  },
  backButton: {
    height: 36,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  backLabel: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textPrimary,
    fontWeight: "600",
  },
  title: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 28,
    lineHeight: 34,
    color: theme.colors.textPrimary,
    fontWeight: "700",
  },

  /* Content row */
  content: {
    flex: 1,
    width: "100%",
    flexDirection: "row",
    gap: 14,
    minHeight: 0,
    overflow: "hidden",
  },

  /* Main column — flex: 1.6 to make it wider than side */
  mainColumn: {
    flex: 1.6,
    minWidth: 0,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: theme.colors.surfaceWarm,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    overflow: "hidden",
  },
  summaryHeader: {
    height: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryInfo: {
    gap: 6,
  },
  orderHeading: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 22,
    color: theme.colors.textPrimary,
    fontWeight: "700",
  },
  orderMeta: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 15,
    color: "#5e584f",
  },
  statusPill: {
    height: 34,
    borderRadius: 999,
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 13,
    color: theme.colors.textAccent,
    fontWeight: "800",
  },
  lineRow: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(29,27,25,0.06)",
  },
  totalRow: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lineLabel: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  linePrice: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: "700",
  },
  totalLabel: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 18,
    color: theme.colors.textPrimary,
    fontWeight: "700",
  },
  totalPrice: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 18,
    color: theme.colors.textPrimary,
    fontWeight: "800",
  },
  spacer: {
    flex: 1,
  },

  /* Actions card — now lives in the side column */
  actionsCard: {
    backgroundColor: theme.colors.surfaceWarm,
    borderWidth: 1,
    borderColor: theme.colors.textPrimary,
    borderRadius: 22,
    padding: 18,
    gap: 12,
    overflow: "hidden",
  },
  cardTitle: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.textPrimary,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    overflow: "hidden",
  },
  actionPrimary: {
    height: 42,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  actionPrimaryLabel: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textOnPrimary,
    fontWeight: "600",
  },
  actionSecondary: {
    height: 42,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceWarm,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  actionSecondaryLabel: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textPrimary,
    fontWeight: "600",
  },
  actionFeedback: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.textAccent,
    fontWeight: "600",
  },

  /* Side column */
  sideColumn: {
    width: 312,
    flexShrink: 0,
  },
  sideContent: {
    gap: 14,
    paddingBottom: 14,
  },
  sideCard: {
    backgroundColor: theme.colors.surfaceWarm,
    borderWidth: 1,
    borderColor: theme.colors.textPrimary,
    borderRadius: 22,
    padding: 18,
    gap: 10,
    overflow: "hidden",
  },
  sideCardLarge: {
    backgroundColor: theme.colors.surfaceWarm,
    borderWidth: 1,
    borderColor: theme.colors.textPrimary,
    borderRadius: 22,
    padding: 18,
    gap: 12,
    overflow: "hidden",
  },
  sideBody: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 14,
    lineHeight: 22,
    color: theme.colors.icon,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    backgroundColor: theme.colors.surfaceWarm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipHighlight: {
    backgroundColor: theme.colors.primaryLighter,
  },
  chipText: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 12,
    lineHeight: 16,
    color: theme.colors.textPrimary,
    fontWeight: "600",
  },
  chipTextHighlight: {
    color: theme.colors.primary,
  },
}));
