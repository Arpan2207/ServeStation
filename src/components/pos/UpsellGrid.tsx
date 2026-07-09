/**
 * Modifier / upsell grid shown on the right of the bottom editor
 * (Figma "Upsell Column", node 153:150). Renders the currently-selected
 * item's modifiers as two-line toggle pills (label on top, price below)
 * laid out in rows of three. Tapping a pill toggles that modifier on the
 * active item; selected pills use the warm highlighted surface.
 *
 * The grid fills the available space via flex and adapts through spacers,
 * so partial rows keep their cells equally sized.
 */

import React from "react";
import { Pressable, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { formatCurrency } from "@/domain/money";
import type { Modifier } from "@/types/pos";

/** Number of modifier pills per row, matching the Figma 3-up layout. */
const COLUMNS = 3;

interface UpsellGridProps {
  /** Modifiers for the selected item; empty when nothing is selected. */
  modifiers: Modifier[];
  /** Ids of the modifiers currently toggled on. */
  selectedModifierIds: string[];
  /** Toggle a modifier on/off by id. */
  onToggleModifier: (modifierId: string) => void;
}

/** Split a flat array into rows of `size` items each. */
function chunk<T>(arr: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < arr.length; i += size) rows.push(arr.slice(i, i + size));
  return rows;
}

/**
 * Modifier grid for the bottom editor.
 * @param props Selected item's modifiers, the active selection, and the toggle handler.
 */
export function UpsellGrid({
  modifiers,
  selectedModifierIds,
  onToggleModifier,
}: UpsellGridProps) {
  // Stable empty state keeps the bottom-editor height steady when an item
  // has no modifiers (or nothing is selected yet).
  if (modifiers.length === 0) {
    return (
      <View style={styles.grid}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No modifiers for this item.</Text>
        </View>
      </View>
    );
  }

  const rows = chunk(modifiers, COLUMNS);

  return (
    <View style={styles.grid}>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((mod) => {
            const active = selectedModifierIds.includes(mod.id);
            return (
              <Pressable
                key={mod.id}
                style={[styles.cell, active ? styles.cellActive : styles.cellDefault]}
                onPress={() => onToggleModifier(mod.id)}
              >
                <Text style={styles.cellLabel} numberOfLines={1}>
                  {mod.label}
                </Text>
                {mod.priceDelta > 0 && (
                  <Text style={styles.cellPrice}>+{formatCurrency(mod.priceDelta)}</Text>
                )}
              </Pressable>
            );
          })}
          {/* Invisible spacers keep cells equally sized on a partial row */}
          {row.length < COLUMNS &&
            Array.from({ length: COLUMNS - row.length }).map((_, j) => (
              <View key={`spacer-${j}`} style={styles.spacer} />
            ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  grid: {
    flex: 1.3,
    gap: {
      xs: 8,
      md: 10,
    },
  },
  row: {
    flexDirection: "row",
    gap: {
      xs: 8,
      md: 10,
    },
  },
  cell: {
    flex: 1,
    minWidth: 0,
    // Fixed, compact pill height matching the Figma (~53px) so a single
    // row of modifiers does not stretch to fill the editor's full height.
    height: 53,
    borderRadius: theme.radii.xl,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    overflow: "hidden",
  },
  cellDefault: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  cellActive: {
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 1,
    borderColor: "rgba(255,122,26,0.16)",
  },
  cellLabel: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.size.md,
    lineHeight: 17,
    color: theme.colors.textPrimary,
    textAlign: "center",
  },
  cellPrice: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.size.md,
    lineHeight: 17,
    color: theme.colors.textPrimary,
    textAlign: "center",
  },
  spacer: {
    flex: 1,
    minWidth: 0,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textSecondary,
  },
}));
