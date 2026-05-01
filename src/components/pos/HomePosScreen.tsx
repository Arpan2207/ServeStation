/**
 * Full Home POS screen assembled from domain-specific components.
 * Layout: two-pane split — left pane (categories, menu grid, editor area)
 * and right pane (persistent cart sidebar).
 *
 * The column count and bottom-editor orientation adapt to the available
 * width via Unistyles breakpoints + useWindowDimensions for structural
 * decisions that affect the JSX tree.
 *
 * All data is static for this initial UI-only pass.
 */

import React from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { Screen } from "@/components/ui/Screen";
import { HStack } from "@/components/ui/Stack";
import { CartPanel } from "./CartPanel";
import { CategoryBar } from "./CategoryBar";
import { MenuItemCard } from "./MenuItemCard";
import { QuickTools } from "./QuickTools";
import { SelectedItemPanel } from "./SelectedItemPanel";
import { UpsellGrid } from "./UpsellGrid";

/* ── Static menu data (matched to Figma) ─────────────── */

interface MenuItem {
  name: string;
  description: string;
  price: string;
}

const MENU_ITEMS: MenuItem[] = [
  { name: "Smash Burger", description: "Double patty, cheddar, pickles, house sauce.", price: "$13.50" },
  { name: "Hot Honey Chicken", description: "Crispy chicken, slaw, chili honey glaze.", price: "$14.25" },
  { name: "Green Bowl", description: "Rice, avocado, greens, roasted vegetables.", price: "$11.75" },
  { name: "Classic Fries", description: "Crispy fries with sea salt and herb seasoning.", price: "$6.50" },
  { name: "Sparkling Lime", description: "Fresh citrus soda with mint and crushed ice.", price: "$4.25" },
  { name: "Chicken Wrap", description: "Grilled chicken, greens, and aioli in a soft wrap.", price: "$11.90" },
];

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
  const menuRows = chunkArray(MENU_ITEMS, columns);

  return (
    <Screen>
      <View style={styles.root}>
        {/* ── Left pane ── */}
        <View style={styles.leftPane}>
          <CategoryBar />
          <QuickTools />

          {/* Menu grid — scrollable, grows to fill remaining space */}
          <ScrollView
            style={styles.menuScroll}
            contentContainerStyle={styles.menuContent}
            showsVerticalScrollIndicator={false}
          >
            {menuRows.map((row, ri) => (
              <HStack key={ri} gap={12}>
                {row.map((item) => (
                  <MenuItemCard
                    key={item.name}
                    name={item.name}
                    description={item.description}
                    price={item.price}
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
            <SelectedItemPanel />
            <UpsellGrid />
          </View>
        </View>

        {/* ── Right pane (cart) ── */}
        <CartPanel />
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
  bottomEditor: {
    flexDirection: "row",
    gap: 12,
    overflow: "hidden",
    minHeight: 140,
  },
  bottomEditorStacked: {
    flexDirection: "column",
  },
  spacer: {
    flex: 1,
    minWidth: 0,
  },
}));
