/**
 * Dark sidebar on the right side of the POS screen.
 * Driven by local POS state: it renders live cart lines, order-type selection,
 * quantity controls, computed totals, and a simulated place-order action.
 *
 * Width, padding, and internal spacing adapt to breakpoints so the panel
 * stays usable from ~600dp tablets up to large landscape screens.
 */

import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { NoteDialog } from "@/components/primitives/NoteDialog";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/domain/money";
import type { PlacingAction } from "@/hooks/usePosState";
import type { CartLine, OrderTotals, OrderType } from "@/types/pos";

const ORDER_TYPES: OrderType[] = ["Dine-in", "Pickup", "Delivery"];
type PendingOrderAction = "save" | "charge" | null;

interface CartPanelProps {
  cart: CartLine[];
  /** Header summary, e.g. "3 items · dine-in". */
  orderType: OrderType;
  onSelectOrderType: (type: OrderType) => void;
  guestName: string;
  onGuestNameChange: (name: string) => void;
  onClear: () => void;
  onIncrement: (lineId: string) => void;
  onDecrement: (lineId: string) => void;
  totals: OrderTotals;
  /** Save the cart as an unpaid, open order (Open queue). */
  onSaveOrder: () => void;
  /** Charge the cart now, creating a paid, closed order (Closed queue). */
  onChargeOrder: () => void;
  /** Which submit action is in flight, else null. */
  placingAction: PlacingAction;
  /** Error message from the last submit attempt, if any. */
  placeError: string | null;
  /** Confirmation summary from the last successful order, if any. */
  lastPlacedSummary: string | null;
}

/**
 * Cart sidebar component.
 * @param props Live cart lines, order type, totals, and the mutation handlers.
 */
export function CartPanel({
  cart,
  orderType,
  onSelectOrderType,
  guestName,
  onGuestNameChange,
  onClear,
  onIncrement,
  onDecrement,
  totals,
  onSaveOrder,
  onChargeOrder,
  placingAction,
  placeError,
  lastPlacedSummary,
}: CartPanelProps) {
  const isEmpty = cart.length === 0;
  const cartCount = cart.reduce((count, line) => count + line.qty, 0);
  const itemCountLabel = `${cartCount} ${cartCount === 1 ? "item" : "items"}`;
  // While any submit is running, both actions are disabled to avoid double taps.
  const busy = placingAction !== null;
  const [pendingOrderAction, setPendingOrderAction] =
    useState<PendingOrderAction>(null);
  const [guestNameError, setGuestNameError] = useState<string | null>(null);

  const openGuestNameDialog = (action: Exclude<PendingOrderAction, null>) => {
    if (isEmpty || busy) return;
    setGuestNameError(null);
    setPendingOrderAction(action);
  };

  const submitGuestName = () => {
    if (!guestName.trim()) {
      setGuestNameError("Enter a guest name to continue.");
      return;
    }

    const action = pendingOrderAction;
    setPendingOrderAction(null);
    setGuestNameError(null);
    if (action === "save") onSaveOrder();
    if (action === "charge") onChargeOrder();
  };

  return (
    <View style={styles.sidebar}>
      {/* Header */}
      {/* Order type chips — wraps when the sidebar is narrow */}
      <View style={styles.fulfilmentControls}>
        <View style={styles.orderTypes}>
          {ORDER_TYPES.map((t) => (
            <Pressable key={t} onPress={() => onSelectOrderType(t)}>
              <Chip label={t} active={t === orderType} dark={t !== orderType} />
            </Pressable>
          ))}
        </View>
        <Pressable style={styles.clearBtn} onPress={onClear}>
          <Text style={styles.clearLabel}>Clear</Text>
        </Pressable>
      </View>

      <View style={styles.itemCountRow}>
        <Text style={styles.itemCount}>{itemCountLabel}</Text>
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

      {/* Totals */}
      <View style={styles.totals}>
        <TotalRow label="Subtotal" value={formatCurrency(totals.subtotal)} />
        <TotalRow label="Tax" value={formatCurrency(totals.tax)} />
        <TotalRow label="Total" value={formatCurrency(totals.total)} />

        {/* Submit feedback: error takes precedence over the success line. */}
        {placeError ? (
          <Text style={styles.errorText}>{placeError}</Text>
        ) : lastPlacedSummary ? (
          <Text style={styles.successText}>{lastPlacedSummary}</Text>
        ) : null}

        {/* Two submit actions: Save (unpaid → Open queue) and Charge (paid →
            Closed queue). While one runs, both are guarded against re-entry. */}
        <View style={styles.submitRow}>
          <Button
            label={placingAction === "save" ? "Saving…" : "Save order"}
            variant="ghost"
            style={styles.saveBtn}
            onPress={() => openGuestNameDialog("save")}
          />
          <Button
            label={
              placingAction === "charge"
                ? "Charging…"
                : `Charge ${formatCurrency(totals.total)}`
            }
            variant="primary"
            style={styles.chargeBtn}
            onPress={() => openGuestNameDialog("charge")}
          />
        </View>
      </View>

      <NoteDialog
        visible={pendingOrderAction !== null}
        title="Guest name"
        description={`Enter the name to ${pendingOrderAction === "charge" ? "charge" : "save"} this order.`}
        value={guestName}
        placeholder="Enter guest name"
        saveLabel={pendingOrderAction === "charge" ? "Charge order" : "Save order"}
        multiline={false}
        errorMessage={guestNameError}
        onChangeText={(name) => {
          onGuestNameChange(name);
          setGuestNameError(null);
        }}
        onDismiss={() => {
          setPendingOrderAction(null);
          setGuestNameError(null);
        }}
        onSave={submitGuestName}
      />
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
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  fulfilmentControls: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  itemCountRow: {
    alignItems: "flex-start",
  },
  itemCount: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textOnPrimary,
    opacity: 0.65,
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
  submitRow: {
    marginTop: 4,
    flexDirection: "row",
    gap: 8,
  },
  saveBtn: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 16,
  },
  chargeBtn: {
    flex: 1.4,
  },
  errorText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.size.sm,
    color: theme.colors.danger,
  },
  successText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textOnPrimary,
    opacity: 0.8,
  },
}));
