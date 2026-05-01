/**
 * A single menu-item tile shown in the responsive grid on the left pane.
 * Displays the item name, a short description, price, and an "Add item" button.
 *
 * Card height adapts via breakpoints instead of using a single fixed value,
 * so the grid stays readable from small tablets to large landscape screens.
 */

import React from "react";
import { View, Text } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Card } from "@/components/ui/Card";

interface MenuItemCardProps {
  name: string;
  description: string;
  price: string;
}

export function MenuItemCard({ name, description, price }: MenuItemCardProps) {
  return (
    <Card style={styles.card}>
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.description} numberOfLines={2}>
        {description}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.price}>{price}</Text>
        <View style={styles.addButton}>
          <Text style={styles.addLabel}>Add item</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    flex: 1,
    minWidth: 0,
    minHeight: {
      xs: 120,
      sm: 130,
      md: 140,
      lg: 148,
    },
    justifyContent: "space-between",
  },
  name: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: {
      xs: theme.typography.size.xl,
      lg: theme.typography.size["2xl"],
    },
    lineHeight: 20,
    color: theme.colors.textPrimary,
  },
  description: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.size.sm,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 6,
  },
  price: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.size.xl,
    color: theme.colors.textPrimary,
  },
  addButton: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radii.lg,
    paddingHorizontal: {
      xs: 10,
      md: 14,
    },
    paddingVertical: {
      xs: 8,
      md: 11,
    },
  },
  addLabel: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textAccent,
  },
}));
