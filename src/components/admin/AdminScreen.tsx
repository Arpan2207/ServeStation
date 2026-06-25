/**
 * Admin workspace screen — Figma MCP node 164:2.
 * Three-column layout: categories panel, item browser, and editor panel.
 *
 * Interactive (frontend-only): category selection filters the item browser,
 * the search bar and filter chips narrow the list, selecting an item loads it
 * into the editor, and the editor fields/chips/buttons mutate local state via
 * useAdminState(). Nothing is persisted or sent to a backend.
 */

import React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { Screen } from "@/components/ui/Screen";
import { useAdminState } from "@/hooks/useAdminState";
import type { AdminCategoryWithCount } from "@/hooks/useAdminState";
import {
    ADMIN_FILTER_CHIPS,
    formatAdminPrice,
} from "@/lib/mockAdminData";
import type {
  AdminEditableField,
  AdminMenuItem,
} from "@/types/admin";

interface ModifierOptionDraft {
  id: string;
  label: string;
  priceLabel: string;
}

const MODIFIER_OPTION_DRAFTS: ModifierOptionDraft[] = [
  { id: "no-onions", label: "No onions", priceLabel: "Free" },
  { id: "light-sauce", label: "Light sauce", priceLabel: "Free" },
  { id: "extra-pickles", label: "Extra pickles", priceLabel: "+$0.50" },
  { id: "gf-bun", label: "Gluten-free bun", priceLabel: "+$1.50" },
  { id: "add-avocado", label: "Add avocado", priceLabel: "+$1.25" },
  { id: "no-tomato", label: "No tomato", priceLabel: "Free" },
];

/* ── Small local helpers ─────────────────────────────── */

/**
 * Rounded pill chip with active/inactive styling.
 * Becomes pressable when an `onPress` handler is provided.
 */
function AdminChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      onPress={onPress}
      style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
    >
      <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
        {label}
      </Text>
    </Wrapper>
  );
}

/** Editable form field with a label and a single-line text input. */
function EditableField({
  label,
  value,
  field,
  onChange,
  numeric,
}: {
  label: string;
  value: string;
  field: AdminEditableField;
  onChange: (field: AdminEditableField, value: string) => void;
  numeric?: boolean;
}) {
  return (
    <View style={styles.fieldCard}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldInput}>
        <TextInput
          value={value}
          onChangeText={(text) => onChange(field, text)}
          keyboardType={numeric ? "decimal-pad" : "default"}
          style={styles.fieldInputText}
          placeholder={label}
          placeholderTextColor={styles.placeholderColor.color}
        />
      </View>
    </View>
  );
}

/**
 * Static edit-looking option row used to design future modifier editing.
 * @param props Label and price text that should appear inside the option box.
 */
function ModifierOptionBox({ option }: { option: ModifierOptionDraft }) {
  return (
    <View style={styles.modifierOptionBox}>
      <View style={styles.modifierNameField}>
        <Text style={styles.modifierOptionLabel} numberOfLines={1}>
          {option.label}
        </Text>
      </View>
      <View style={styles.modifierPriceField}>
        <Text style={styles.modifierOptionPrice}>{option.priceLabel}</Text>
      </View>
    </View>
  );
}

/**
 * A single selectable category card in the left panel.
 * Extracted into its own component so Unistyles instruments it independently
 * (inline list rows can lose sibling content when a conditional style toggles).
 */
function AdminCategoryCard({
  category,
  active,
  onPress,
}: {
  category: AdminCategoryWithCount;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.categoryCard, active && styles.categoryCardActive]}
    >
      <Text style={styles.categoryName}>{category.name}</Text>
      <Text style={styles.categoryCount}>{category.count} items</Text>
    </Pressable>
  );
}

/**
 * A single selectable item card in the middle browser column.
 * Extracted into its own component (see AdminCategoryCard) so selecting an
 * item does not blank out the other rows.
 */
function AdminItemCard({
  item,
  editing,
  onPress,
}: {
  item: AdminMenuItem;
  editing: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.itemCard, editing && styles.itemCardEditing]}
    >
      <View style={styles.itemTop}>
        <View style={styles.itemCopy}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemDesc}>{item.description}</Text>
        </View>
        <View style={[styles.pricePill, editing && styles.pricePillActive]}>
          <Text style={[styles.priceText, editing && styles.priceTextActive]}>
            {formatAdminPrice(item.price)}
          </Text>
        </View>
      </View>
      <View style={styles.chipsRow}>
        <AdminChip
          label="In stock"
          active={item.inStock}
        />
        <AdminChip
          label="Out of stock"
          active={!item.inStock}
        />
      </View>
    </Pressable>
  );
}

/**
 * The right-hand editor for the currently selected item.
 * Receives the resolved (non-null) item plus the edit handlers.
 */
function AdminItemEditor({
  item,
  feedback,
  onChangeField,
  onMarkUnavailable,
  onMarkInStock,
  onPublish,
}: {
  item: AdminMenuItem;
  feedback: string | null;
  onChangeField: (field: AdminEditableField, value: string) => void;
  onMarkUnavailable: () => void;
  onMarkInStock: () => void;
  onPublish: () => void;
}) {
  return (
    <>
      {/* Editable fields */}
      <EditableField
        label="Item name"
        value={item.name}
        field="name"
        onChange={onChangeField}
      />
      <EditableField
        label="Description"
        value={item.description}
        field="description"
        onChange={onChangeField}
      />

      {/* Price row */}
      <View style={styles.priceRow}>
        <View style={styles.priceField}>
          <Text style={styles.fieldLabel}>Base price</Text>
          <View style={styles.fieldInput}>
            <TextInput
              value={item.price}
              onChangeText={(text) => onChangeField("price", text)}
              keyboardType="decimal-pad"
              style={styles.fieldInputText}
              placeholder="0.00"
              placeholderTextColor={styles.placeholderColor.color}
            />
          </View>
        </View>
      </View>

      {/* Modifier groups */}
      <View style={styles.modifiersCard}>
        <View style={styles.modifierCardHeader}>
          <View style={styles.modifierHeaderCopy}>
            <Text style={styles.fieldLabel}>Modifier groups</Text>
          </View>
          <Pressable style={styles.modifierAddGroupBtn}>
            <Text style={styles.modifierAddGroupLabel}>Save</Text>
          </Pressable>
        </View>

        <View style={styles.modifierCapsuleGrid}>
          {MODIFIER_OPTION_DRAFTS.map((option) => (
            <ModifierOptionBox key={option.id} option={option} />
          ))}
        </View>
      </View>

      {/* Local action feedback */}
      {feedback && <Text style={styles.feedback}>{feedback}</Text>}

      {/* Action buttons */}
      <View style={styles.editorActions}>
        <Pressable style={styles.editorBtnSecondary} onPress={onMarkUnavailable}>
          <Text style={styles.editorBtnSecondaryLabel}>Mark unavailable</Text>
        </Pressable>
        <Pressable style={styles.editorBtnSecondary} onPress={onMarkInStock}>
          <Text style={styles.editorBtnSecondaryLabel}>Mark In stock</Text>
        </Pressable>
        <Pressable style={styles.editorBtnPrimary} onPress={onPublish}>
          <Text style={styles.editorBtnPrimaryLabel}>Publish item</Text>
        </Pressable>
      </View>
    </>
  );
}

/* ── Component ───────────────────────────────────────── */

export function AdminScreen() {
  const admin = useAdminState();
  const { selectedItem } = admin;

  return (
    <Screen>
      <View style={styles.screen}>
        <View style={styles.frame}>
          {/* Header — title + action buttons */}
          <View style={styles.header}>
            <Text style={styles.title}>Admin workspace</Text>
            <View style={styles.headerActions}>
              <Pressable style={styles.bulkEditBtn} onPress={admin.bulkEdit}>
                <Text style={styles.bulkEditLabel}>Bulk edit</Text>
              </Pressable>
              <Pressable style={styles.addItemBtn} onPress={admin.addItem}>
                <Text style={styles.addItemLabel}>Add item</Text>
              </Pressable>
            </View>
          </View>

          {/* Utility row: search + filter chips */}
          <View style={styles.utilityRow}>
            <View style={styles.searchBar}>
              <TextInput
                value={admin.searchText}
                onChangeText={admin.setSearchText}
                placeholder="Search items, categories, or modifiers…"
                placeholderTextColor={styles.placeholderColor.color}
                style={styles.searchInput}
              />
            </View>
            <View style={styles.utilityChips}>
              {ADMIN_FILTER_CHIPS.map((chip) => (
                <AdminChip
                  key={chip.id}
                  label={chip.label}
                  active={admin.activeFilterId === chip.id}
                  onPress={() => admin.setFilter(chip.id)}
                />
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
                {admin.categories.map((cat) => (
                  <AdminCategoryCard
                    key={`${cat.id}-${admin.selectedCategoryId === cat.id ? "active" : "idle"}`}
                    category={cat}
                    active={admin.selectedCategoryId === cat.id}
                    onPress={() => admin.selectCategory(cat.id)}
                  />
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
                {admin.filteredItems.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No items match your filters.</Text>
                  </View>
                ) : (
                  admin.filteredItems.map((item) => (
                    <AdminItemCard
                      key={`${item.id}-${selectedItem?.id === item.id ? "active" : "idle"}`}
                      item={item}
                      editing={selectedItem?.id === item.id}
                      onPress={() => admin.selectItem(item.id)}
                    />
                  ))
                )}
              </ScrollView>
            </View>

            {/* ── Right: Editor Panel ── */}
            <View style={styles.editorPanel}>
              <ScrollView
                style={styles.columnScroll}
                contentContainerStyle={styles.editorContent}
                showsVerticalScrollIndicator={false}
              >
                {selectedItem ? (
                  <AdminItemEditor
                    item={selectedItem}
                    feedback={admin.feedback}
                    onChangeField={admin.updateField}
                    onMarkUnavailable={admin.markUnavailable}
                    onMarkInStock={admin.markInStock}
                    onPublish={admin.publishItem}
                  />
                ) : (
                  /* Empty editor state keeps the right column layout stable */
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>No item selected</Text>
                    <Text style={styles.emptyText}>
                      Select an item from the list, or add a new one to start editing.
                    </Text>
                  </View>
                )}
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

  /* Shared placeholder color holder (read via styles.placeholderColor.color) */
  placeholderColor: {
    color: theme.colors.icon,
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
  searchInput: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textPrimary,
    padding: 0,
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
  fieldInputText: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textPrimary,
    padding: 0,
  },

  /* Price row */
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
  modifierCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  modifierHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  modifierAddGroupBtn: {
    width: 76,
    height: 36,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  modifierAddGroupLabel: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 12,
    color: theme.colors.textOnPrimary,
    fontWeight: "700",
  },
  modifierCapsuleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  modifierOptionBox: {
    width: "48%",
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.textPrimary,
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    gap: 10,
  },
  modifierNameField: {
    flex: 1,
    minWidth: 0,
    height: 34,
    borderRadius: 13,
    backgroundColor: "#fcf9f3",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  modifierPriceField: {
    minWidth: 84,
    height: 34,
    borderRadius: 13,
    backgroundColor: theme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  modifierOptionLabel: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 13,
    color: theme.colors.textPrimary,
    fontWeight: "600",
  },
  modifierOptionPrice: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: "700",
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

  /* Local action feedback */
  feedback: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.primary,
    fontWeight: "600",
  },

  /* Empty states */
  emptyCard: {
    backgroundColor: "#f6f0e5",
    borderRadius: 22,
    padding: 18,
    gap: 6,
    overflow: "hidden",
  },
  emptyTitle: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.textPrimary,
    fontWeight: "700",
  },
  emptyText: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 14,
    lineHeight: 20,
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
