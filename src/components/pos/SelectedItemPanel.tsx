/**
 * Bottom-left panel showing the currently-selected menu item
 * (Figma "Article3", node 153:131). It displays the item name + description
 * and an action row with an "Add note" button beside the "Add to order"
 * button. Modifier toggles now live in the adjacent UpsellGrid (the Figma
 * "Upsell Column"). When nothing is selected it renders a stable empty state
 * so the bottom-editor layout holds.
 */

import React from "react";
import { Pressable, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Card } from "@/components/ui/Card";
import type { MenuItem } from "@/types/pos";

interface SelectedItemPanelProps {
  /** The currently selected item, or null when nothing is selected. */
  item: MenuItem | null;
  /** Add the selected item (with its modifiers) to the cart. */
  onAddToCart: () => void;
}

/**
 * Selected-item panel with an "Add note" / "Add to order" action row.
 * @param props The selected item and the add-to-cart handler.
 */
export function SelectedItemPanel({ item, onAddToCart }: SelectedItemPanelProps) {
  // Empty state — keeps the panel height stable when no item is selected.
  if (!item) {
    return (
      <Card variant="warm" style={styles.card}>
        <Text style={styles.title}>No item selected</Text>
        <Text style={styles.description}>
          Tap a menu item to view details and add it to the order.
        </Text>
      </Card>
    );
  }

  return (
    <Card variant="warm" style={styles.card}>
      <Text style={styles.title} numberOfLines={1}>
        Selected item: {item.name}
      </Text>
      <Text style={styles.description} numberOfLines={2}>
        {item.description}
      </Text>

      {/* Action row — "Add note" sits beside the kept "Add to order" button.
          Both share identical sizing (button base) with a consistent gap. */}
      <View style={styles.actions}>
        <Pressable style={[styles.button, styles.noteButton]}>
          <Text style={styles.noteLabel}>Add note</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.addButton]} onPress={onAddToCart}>
          <Text style={styles.addLabel}>Add to order</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    flex: 1,
    paddingHorizontal: 17,
    gap: 8,
  },
  title: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.size["2xl"],
    lineHeight: 20,
    color: theme.colors.textPrimary,
  },
  description: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.size.md,
    lineHeight: 19,
    color: theme.colors.textPrimary,
  },
  // Push the action row to the bottom of the card, matching the Figma layout.
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: "auto",
  },
  // Shared base so both action buttons are exactly the same size.
  // Equal flex width + fixed height + matching border keep them identical.
  button: {
    flex: 1,
    minWidth: 0,
    height: 40,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  noteButton: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.borderSubtle,
  },
  noteLabel: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textPrimary,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  addLabel: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textOnPrimary,
  },
}));
