/**
 * Full Home POS screen assembled from domain-specific components.
 * Layout: two-pane split — left pane (categories, menu grid, editor area)
 * and right pane (persistent cart sidebar).
 *
 * This screen owns the interactive POS state via usePosState() and passes
 * state + handlers down to the presentational child components. The column
 * count and bottom-editor orientation adapt to the available width via
 * useWindowDimensions for structural decisions that affect the JSX tree.
 */

import React from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { Screen } from "@/components/ui/Screen";
import { HStack } from "@/components/ui/Stack";
import { usePosState } from "@/hooks/usePosState";
import { CATEGORIES, formatCurrency } from "@/lib/mockData";
import type { MenuItem } from "@/types/pos";
import { CartPanel } from "./CartPanel";
import { CategoryBar } from "./CategoryBar";
import { MenuItemCard } from "./MenuItemCard";
import { QuickTools } from "./QuickTools";
import { SelectedItemPanel } from "./SelectedItemPanel";
import { UpsellGrid } from "./UpsellGrid";

/** Split a flat array into rows of `cols` items each. */
function chunkArray<T>(arr: T[], cols: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < arr.length; i += cols) {
    rows.push(arr.slice(i, i + cols));
  }
  return rows;
}

/**
 * Derive the number of menu-grid columns from the viewport width.
 * Matches the registered breakpoints in src/theme/breakpoints.ts.
 */
function useMenuColumns(): number {
  const { width } = useWindowDimensions();
  if (width < 600) return 1;
  if (width < 768) return 2;
  return 3;
}

/**
 * On narrower viewports the bottom editor stacks vertically
 * instead of sitting side-by-side with the upsell grid.
 */
function useEditorStacked(): boolean {
  const { width } = useWindowDimensions();
  return width < 768;
}

/* ── Component ───────────────────────────────────────── */

export function HomePosScreen() {
  const columns = useMenuColumns();
  const editorStacked = useEditorStacked();
  const pos = usePosState();

  // Build responsive grid rows from the filtered (category + search) items.
  const menuRows = chunkArray(pos.filteredItems, columns);

  return (
    <Screen>
      <View style={styles.root}>
        {/* ── Left pane ── */}
        <View style={styles.leftPane}>
          <CategoryBar
            categories={CATEGORIES}
            selectedCategoryId={pos.selectedCategoryId}
            onSelectCategory={pos.selectCategory}
            searchText={pos.searchText}
            onSearchChange={pos.setSearchText}
          />
          <QuickTools />

          {/* Menu grid — scrollable, grows to fill remaining space */}
          <ScrollView
            style={styles.menuScroll}
            contentContainerStyle={styles.menuContent}
            showsVerticalScrollIndicator={false}
          >
            {menuRows.map((row, ri) => (
              <HStack key={ri} gap={12}>
                {row.map((item: MenuItem) => (
                  <MenuItemCard
                    key={item.id}
                    name={item.name}
                    price={formatCurrency(item.price)}
                    selected={pos.selectedItem?.id === item.id}
                    onSelect={() => pos.selectItem(item.id)}
                    onAdd={() => pos.addItemToCart(item)}
                  />
                ))}
                {/* Invisible spacers keep cards equally sized when a row is partial */}
                {row.length < columns &&
                  Array.from({ length: columns - row.length }).map((_, j) => (
                    <View key={`spacer-${j}`} style={styles.spacer} />
                  ))}
              </HStack>
            ))}
          </ScrollView>

          {/* Bottom editor — side-by-side on wide screens, stacked on narrow */}
          <View
            style={[
              styles.bottomEditor,
              editorStacked && styles.bottomEditorStacked,
            ]}
          >
            <SelectedItemPanel
              item={pos.selectedItem}
              onAddToCart={pos.addSelectedToCart}
            />
            <UpsellGrid
              modifiers={pos.selectedItem?.modifiers ?? []}
              selectedModifierIds={pos.selectedModifierIds}
              onToggleModifier={pos.toggleModifier}
            />
          </View>
        </View>

        {/* ── Right pane (cart) ── */}
        <CartPanel
          cart={pos.cart}
          summary={pos.cartSummary}
          orderType={pos.orderType}
          onSelectOrderType={pos.setOrderType}
          onClear={pos.clearCart}
          onIncrement={pos.incrementLine}
          onDecrement={pos.decrementLine}
          totals={pos.totals}
          onPlaceOrder={pos.placeOrder}
        />
      </View>
    </Screen>
  );
}

/* ── Styles ──────────────────────────────────────────── */

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    flexDirection: "row",
  },
  leftPane: {
    flex: 1,
    padding: {
      xs: theme.spacing.xl,
      md: theme.spacing["3xl"],
      lg: theme.spacing["4xl"],
    },
    gap: {
      xs: theme.spacing.xl,
      md: theme.spacing["3xl"],
    },
  },
  menuScroll: {
    flex: 1,
    minHeight: 120,
  },
  menuContent: {
    gap: {
      xs: 8,
      md: 12,
    },
  },
  // Warm container (Figma "Bottom Editor", #f7f0e4) that spans the full width
  // so its light background sits behind both the left panel and the pills.
  bottomEditor: {
    flexDirection: "row",
    gap: 12,
    overflow: "hidden",
    minHeight: 140,
    backgroundColor: theme.colors.surfaceWarm,
    borderRadius: theme.radii["2xl"],
    padding: 12,
  },
  bottomEditorStacked: {
    flexDirection: "column",
  },
  spacer: {
    flex: 1,
    minWidth: 0,
  },
}));
