/**
 * Dark sidebar on the right side of the POS screen.
 * Driven by local POS state: it renders live cart lines, order-type selection,
 * quantity controls, computed totals, and a simulated place-order action.
 *
 * Width, padding, and internal spacing adapt to breakpoints so the panel
 * stays usable from ~600dp tablets up to large landscape screens.
 */

import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/domain/money";
import type { CartLine, OrderTotals, OrderType } from "@/types/pos";

/** Static, cosmetic secondary actions (no behavior in this phase). */
const ACTIONS = ["Send to kitchen", "Hold order", "Add note"] as const;
const ORDER_TYPES: OrderType[] = ["Dine-in", "Pickup", "Delivery"];

interface CartPanelProps {
  cart: CartLine[];
  /** Header summary, e.g. "3 items · dine-in". */
  summary: string;
  orderType: OrderType;
  onSelectOrderType: (type: OrderType) => void;
  onClear: () => void;
  onIncrement: (lineId: string) => void;
  onDecrement: (lineId: string) => void;
  totals: OrderTotals;
  onPlaceOrder: () => void;
}

/**
 * Cart sidebar component.
 * @param props Live cart lines, order type, totals, and the mutation handlers.
 */
export function CartPanel({
  cart,
  summary,
  orderType,
  onSelectOrderType,
  onClear,
  onIncrement,
  onDecrement,
  totals,
  onPlaceOrder,
}: CartPanelProps) {
  const isEmpty = cart.length === 0;

  return (
    <View style={styles.sidebar}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Current cart</Text>
          <Text style={styles.headerMeta}>{summary}</Text>
        </View>
        <Pressable style={styles.clearBtn} onPress={onClear}>
          <Text style={styles.clearLabel}>Clear</Text>
        </Pressable>
      </View>

      {/* Order type chips — wraps when the sidebar is narrow */}
      <View style={styles.orderTypes}>
        {ORDER_TYPES.map((t) => (
          <Pressable key={t} onPress={() => onSelectOrderType(t)}>
            <Chip label={t} active={t === orderType} dark={t !== orderType} />
          </Pressable>
        ))}
      </View>

      {/* Cart items (scrollable) */}
      <ScrollView
        style={styles.itemsList}
        contentContainerStyle={styles.itemsContent}
        showsVerticalScrollIndicator={false}
      >
        {isEmpty ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Cart is empty. Add items from the menu to get started.
            </Text>
          </View>
        ) : (
          cart.map((line) => (
            <View key={line.id} style={styles.cartItem}>
              <View style={styles.cartItemInfo}>
                <Text style={styles.cartItemName} numberOfLines={1}>
                  {line.name}
                </Text>
                <Text style={styles.cartItemNote} numberOfLines={1}>
                  {line.note} · {formatCurrency(line.unitPrice)}
                </Text>
              </View>
              <View style={styles.qtyControls}>
                <Pressable
                  style={styles.qtyBtn}
                  onPress={() => onDecrement(line.id)}
                >
                  <Text style={styles.qtySymbol}>-</Text>
                </Pressable>
                <Text style={styles.qtyValue}>{line.qty}</Text>
                <Pressable
                  style={styles.qtyBtn}
                  onPress={() => onIncrement(line.id)}
                >
                  <Text style={styles.qtySymbol}>+</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Action buttons (cosmetic) */}
      <View style={styles.actions}>
        {ACTIONS.map((a) => (
          <Button key={a} label={a} variant="ghost" style={styles.actionBtn} />
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totals}>
        <TotalRow label="Subtotal" value={formatCurrency(totals.subtotal)} />
        <TotalRow label="Tax" value={formatCurrency(totals.tax)} />
        <TotalRow label="Total" value={formatCurrency(totals.total)} />

        <Button
          label="Simulate place order"
          variant="primary"
          style={styles.placeBtn}
          onPress={onPlaceOrder}
        />
      </View>
    </View>
  );
}

/* ── Small helper for summary rows ───────────────────── */

/**
 * A single label/value row in the totals section.
 * @param props The label text and its formatted value.
 */
function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.totalRow}>
      <Text style={styles.totalLabel}>{label}</Text>
      <Text style={styles.totalValue}>{value}</Text>
    </View>
  );
}

/* ── Styles ──────────────────────────────────────────── */

const styles = StyleSheet.create((theme) => ({
  sidebar: {
    width: {
      xs: 260,
      sm: 300,
      md: 340,
      lg: 372,
    },
    backgroundColor: theme.colors.sidebar,
    paddingHorizontal: {
      xs: 12,
      sm: 14,
      md: 18,
    },
    paddingTop: {
      xs: 14,
      md: 18,
    },
    paddingBottom: {
      xs: 18,
      md: 28,
    },
    gap: {
      xs: 12,
      md: 18,
    },
    borderTopRightRadius: theme.radii["3xl"],
    borderBottomRightRadius: theme.radii["3xl"],
  },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flex: 1,
    gap: 3,
  },
  headerTitle: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: {
      xs: theme.typography.size["2xl"],
      md: theme.typography.size["3xl"],
    },
    color: theme.colors.textOnPrimary,
    letterSpacing: -0.84,
  },
  headerMeta: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textOnPrimary,
    opacity: 0.65,
  },
  clearBtn: {
    backgroundColor: theme.colors.sidebarControl,
    borderRadius: theme.radii.md,
    padding: {
      xs: 8,
      md: 11,
    },
  },
  clearLabel: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textOnPrimary,
  },

  /* Order type pills — flex-wrap prevents overflow on tight widths */
  orderTypes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  /* Cart item list */
  itemsList: {
    flex: 1,
  },
  itemsContent: {
    gap: {
      xs: 8,
      md: 10,
    },
  },
  emptyState: {
    paddingVertical: 24,
    paddingHorizontal: 8,
  },
  emptyText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textOnPrimary,
    opacity: 0.55,
    textAlign: "center",
    lineHeight: 18,
  },
  cartItem: {
    backgroundColor: theme.colors.sidebarCard,
    borderWidth: 1.17,
    borderColor: theme.colors.sidebarBorder,
    borderRadius: theme.radii.lg,
    paddingHorizontal: {
      xs: 10,
      md: 15,
    },
    paddingVertical: {
      xs: 10,
      md: 12,
    },
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cartItemInfo: {
    flex: 1,
    gap: 2,
    marginRight: 8,
  },
  cartItemName: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.size.base,
    color: theme.colors.textOnPrimary,
  },
  cartItemNote: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textOnPrimary,
    opacity: 0.65,
  },
  qtyControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: {
      xs: 6,
      md: 8,
    },
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.sidebarControl,
    alignItems: "center",
    justifyContent: "center",
  },
  qtySymbol: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.size.base,
    color: theme.colors.textOnPrimary,
  },
  qtyValue: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.size.base,
    color: theme.colors.textOnPrimary,
    minWidth: 8,
    textAlign: "center",
  },

  /* Actions row — wraps on tight widths */
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: {
      xs: 6,
      md: 8,
    },
  },
  actionBtn: {
    flex: 1,
    minWidth: 70,
  },

  /* Totals section */
  totals: {
    borderTopWidth: 1.17,
    borderTopColor: theme.colors.sidebarBorder,
    paddingTop: {
      xs: 12,
      md: 17,
    },
    gap: {
      xs: 8,
      md: 10,
    },
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textOnPrimary,
    opacity: 0.65,
  },
  totalValue: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.size.base,
    color: theme.colors.textOnPrimary,
  },
  placeBtn: {
    marginTop: 4,
  },
}));
