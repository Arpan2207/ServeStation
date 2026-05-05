/**
 * Admin workspace screen — Figma MCP node 164:2.
 * Three-column layout: categories panel, item browser, and editor panel.
 * All data is static/mock for the UI-only phase.
 */

import React from "react";
import { ScrollView, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { Screen } from "@/components/ui/Screen";

/* ── Mock data ───────────────────────────────────────── */

interface CategoryData {
  name: string;
  count: number;
  active?: boolean;
}

const CATEGORIES: CategoryData[] = [
  { name: "Burgers", count: 8, active: true },
  { name: "Bowls", count: 7 },
  { name: "Drinks", count: 10 },
  { name: "Desserts", count: 5 },
  { name: "Breakfast", count: 4 },
];

interface MenuItemData {
  name: string;
  description: string;
  price: string;
  editing?: boolean;
}

const MENU_ITEMS: MenuItemData[] = [
  { name: "Smash Burger", description: "Double patty, cheddar, house sauce", price: "$13.50", editing: true },
  { name: "Hot Honey Chicken", description: "Crispy chicken, slaw, honey glaze", price: "$14.25" },
  { name: "Classic Cheeseburger", description: "Single patty, cheddar, pickles", price: "$11.90" },
  { name: "Veggie Stack", description: "Plant-based patty, tomato, lettuce", price: "$12.40" },
  { name: "Kids Burger", description: "Smaller bun, mild sauce", price: "$8.80" },
];

const FILTER_CHIPS = ["All items", "In stock", "Needs review"] as const;
const MODIFIER_CHIPS = ["Sides upgrade", "Sauces", "Bun style", "Cheese add-ons"] as const;

/* ── Small local helpers ─────────────────────────────── */

/** Rounded pill chip with active/inactive styling */
function AdminChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <View style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}>
      <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
        {label}
      </Text>
    </View>
  );
}

/** Form-like input row (read-only mock) */
function FieldCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fieldCard}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldInput}>
        <Text style={styles.fieldValue}>{value}</Text>
      </View>
    </View>
  );
}

/* ── Component ───────────────────────────────────────── */

export function AdminScreen() {
  return (
    <Screen>
      <View style={styles.screen}>
        <View style={styles.frame}>
          {/* Header — title only, no subtitle */}
          <View style={styles.header}>
            <Text style={styles.title}>Admin workspace</Text>
            <View style={styles.headerActions}>
              <View style={styles.bulkEditBtn}>
                <Text style={styles.bulkEditLabel}>Bulk edit</Text>
              </View>
              <View style={styles.addItemBtn}>
                <Text style={styles.addItemLabel}>Add item</Text>
              </View>
            </View>
          </View>

          {/* Utility row: search + filter chips */}
          <View style={styles.utilityRow}>
            <View style={styles.searchBar}>
              <Text style={styles.searchPlaceholder}>
                Search items, categories, or modifiers…
              </Text>
            </View>
            <View style={styles.utilityChips}>
              {FILTER_CHIPS.map((chip, i) => (
                <AdminChip key={chip} label={chip} active={i === 0} />
              ))}
            </View>
          </View>

          {/* Content: three columns */}
          <View style={styles.content}>
            {/* ── Left: Categories Panel ── */}
            <View style={styles.categoriesPanel}>
              <ScrollView
                style={styles.columnScroll}
                contentContainerStyle={styles.categoriesContent}
                showsVerticalScrollIndicator={false}
              >
                {CATEGORIES.map((cat) => (
                  <View
                    key={cat.name}
                    style={[styles.categoryCard, cat.active && styles.categoryCardActive]}
                  >
                    <Text style={styles.categoryName}>{cat.name}</Text>
                    <Text style={styles.categoryCount}>{cat.count} items</Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* ── Middle: Item Browser ── */}
            <View style={styles.browserPanel}>
              <ScrollView
                style={styles.columnScroll}
                contentContainerStyle={styles.browserContent}
                showsVerticalScrollIndicator={false}
              >
                {MENU_ITEMS.map((item) => (
                  <View
                    key={item.name}
                    style={[styles.itemCard, item.editing && styles.itemCardEditing]}
                  >
                    <View style={styles.itemTop}>
                      <View style={styles.itemCopy}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemDesc}>{item.description}</Text>
                      </View>
                      <View style={[styles.pricePill, item.editing && styles.pricePillActive]}>
                        <Text style={[styles.priceText, item.editing && styles.priceTextActive]}>
                          {item.price}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.chipsRow}>
                      <AdminChip label={item.editing ? "Editing" : "Visible"} active={true} />
                      <AdminChip label="Category" active={false} />
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* ── Right: Editor Panel ── */}
            <View style={styles.editorPanel}>
              <ScrollView
                style={styles.columnScroll}
                contentContainerStyle={styles.editorContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Fields */}
                <FieldCard label="Item name" value="Smash Burger" />
                <FieldCard label="Description" value="Double patty, cheddar, pickles, onion, house sauce." />

                {/* Price + Visibility row */}
                <View style={styles.priceRow}>
                  <View style={styles.priceField}>
                    <Text style={styles.fieldLabel}>Base price</Text>
                    <View style={styles.fieldInput}>
                      <Text style={styles.fieldValue}>$13.50</Text>
                    </View>
                  </View>
                  <View style={styles.visibilityField}>
                    <Text style={styles.fieldLabel}>Visibility</Text>
                    <View style={styles.chipsRow}>
                      <AdminChip label="Visible" active={true} />
                      <AdminChip label="Draft" active={false} />
                    </View>
                  </View>
                </View>

                {/* Modifier groups */}
                <View style={styles.modifiersCard}>
                  <Text style={styles.fieldLabel}>Modifier groups</Text>
                  <View style={styles.chipsRowWrap}>
                    {MODIFIER_CHIPS.map((chip, i) => (
                      <AdminChip key={chip} label={chip} active={i === 0} />
                    ))}
                  </View>
                </View>

                {/* Action buttons */}
                <View style={styles.editorActions}>
                  <View style={styles.editorBtnSecondary}>
                    <Text style={styles.editorBtnSecondaryLabel}>Mark unavailable</Text>
                  </View>
                  <View style={styles.editorBtnSecondary}>
                    <Text style={styles.editorBtnSecondaryLabel}>Preview in POS</Text>
                  </View>
                  <View style={styles.editorBtnPrimary}>
                    <Text style={styles.editorBtnPrimaryLabel}>Publish item</Text>
                  </View>
                </View>
              </ScrollView>
            </View>
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
    paddingTop: 18,
    paddingBottom: 1,
    gap: 12,
    overflow: "hidden",
  },

  /* Header */
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  title: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 28,
    lineHeight: 32,
    color: theme.colors.textPrimary,
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bulkEditBtn: {
    width: 112,
    height: 42,
    borderRadius: 16,
    backgroundColor: "#f6f0e5",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  bulkEditLabel: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 14,
    color: theme.colors.icon,
    fontWeight: "600",
  },
  addItemBtn: {
    width: 110,
    height: 42,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  addItemLabel: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 14,
    color: theme.colors.textOnPrimary,
    fontWeight: "600",
  },

  /* Utility row */
  utilityRow: {
    height: 64,
    backgroundColor: "#f6f0e5",
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    overflow: "hidden",
  },
  searchBar: {
    flex: 1,
    height: 42,
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  searchPlaceholder: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.icon,
  },
  utilityChips: {
    flexDirection: "row",
    gap: 8,
  },

  /* Content three-column layout */
  content: {
    flex: 1,
    width: "100%",
    flexDirection: "row",
    gap: 12,
    minHeight: 0,
    overflow: "hidden",
  },
  columnScroll: {
    flex: 1,
  },

  /* Left: Categories */
  categoriesPanel: {
    flex: 2,
    flexBasis: 0,
    minWidth: 0,
  },
  categoriesContent: {
    gap: 12,
    paddingBottom: 14,
  },
  categoryCard: {
    backgroundColor: "#f6f0e5",
    borderRadius: 22,
    padding: 16,
    gap: 10,
    overflow: "hidden",
  },
  categoryCardActive: {
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 1,
    borderColor: theme.colors.textPrimary,
  },
  categoryName: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.textPrimary,
    fontWeight: "700",
  },
  categoryCount: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.icon,
  },

  /* Middle: Item Browser */
  browserPanel: {
    flex: 3,
    flexBasis: 0,
    minWidth: 0,
  },
  browserContent: {
    gap: 12,
    paddingBottom: 14,
  },
  itemCard: {
    backgroundColor: "#f6f0e5",
    borderRadius: 22,
    padding: 16,
    gap: 12,
    overflow: "hidden",
  },
  itemCardEditing: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.textPrimary,
  },
  itemTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  itemName: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.textPrimary,
    fontWeight: "700",
  },
  itemDesc: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 13,
    lineHeight: 20,
    color: theme.colors.icon,
  },
  pricePill: {
    backgroundColor: "#faf6ef",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pricePillActive: {
    backgroundColor: theme.colors.primaryLight,
  },
  priceText: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 12,
    color: theme.colors.icon,
    fontWeight: "600",
  },
  priceTextActive: {
    color: theme.colors.primary,
  },

  /* Right: Editor Panel */
  editorPanel: {
    flex: 5,
    flexBasis: 0,
    minWidth: 0,
  },
  editorContent: {
    gap: 12,
    paddingBottom: 14,
  },

  /* Field cards */
  fieldCard: {
    backgroundColor: "#f6f0e5",
    borderWidth: 1,
    borderColor: theme.colors.textPrimary,
    borderRadius: 22,
    padding: 18,
    gap: 10,
    overflow: "hidden",
  },
  fieldLabel: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textPrimary,
    fontWeight: "700",
  },
  fieldInput: {
    height: 44,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.textPrimary,
    borderRadius: 16,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  fieldValue: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.icon,
  },

  /* Price + Visibility row */
  priceRow: {
    flexDirection: "row",
    gap: 12,
  },
  priceField: {
    flex: 1,
    backgroundColor: "#f6f0e5",
    borderWidth: 1,
    borderColor: theme.colors.textPrimary,
    borderRadius: 22,
    padding: 18,
    gap: 10,
    overflow: "hidden",
  },
  visibilityField: {
    flex: 1,
    backgroundColor: "#f6f0e5",
    borderWidth: 1,
    borderColor: theme.colors.textPrimary,
    borderRadius: 22,
    padding: 18,
    gap: 12,
    overflow: "hidden",
  },

  /* Modifiers card */
  modifiersCard: {
    backgroundColor: "#f6f0e5",
    borderWidth: 1,
    borderColor: theme.colors.textPrimary,
    borderRadius: 22,
    padding: 18,
    gap: 12,
    overflow: "hidden",
  },

  /* Chips */
  chipsRow: {
    flexDirection: "row",
    gap: 8,
  },
  chipsRowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: theme.colors.primaryLight,
  },
  chipInactive: {
    backgroundColor: "#faf6ef",
  },
  chipText: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 12,
    fontWeight: "600",
  },
  chipTextActive: {
    color: theme.colors.primary,
  },
  chipTextInactive: {
    color: theme.colors.icon,
  },

  /* Editor action buttons */
  editorActions: {
    flexDirection: "row",
    gap: 10,
    overflow: "hidden",
  },
  editorBtnSecondary: {
    height: 42,
    borderRadius: 16,
    backgroundColor: "#f6f0e5",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  editorBtnSecondaryLabel: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontWeight: "600",
  },
  editorBtnPrimary: {
    height: 42,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  editorBtnPrimaryLabel: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 14,
    color: theme.colors.textOnPrimary,
    fontWeight: "600",
  },
}));
