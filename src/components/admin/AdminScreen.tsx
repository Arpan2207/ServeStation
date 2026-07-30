/**
 * Admin workspace screen — Figma MCP node 164:2.
 * Three-column layout: categories panel, item browser, and editor panel.
 *
 * Interactive (frontend-only): category selection filters the item browser,
 * the search bar and filter chips narrow the list, selecting an item loads it
 * into the editor, and the editor fields/chips/buttons mutate local state via
 * useAdminState(). Nothing is persisted or sent to a backend.
 */

import React, { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { useAdminState } from "@/hooks/useAdminState";
import type { AdminCategoryWithCount } from "@/hooks/useAdminState";
import { adminRepository } from "@/repositories";
import type {
  AdminEditableField,
  AdminMenuItem,
} from "@/types/admin";

/** Filter chips sourced through the repository boundary. */
const ADMIN_FILTER_CHIPS = adminRepository.getFilterChips();

interface ModifierOptionDraft {
  id: string;
  label: string;
  /** Numeric dollar amount stored as editable text; 0.00 means Free. */
  price: string;
}

const MODIFIER_OPTION_DRAFTS: ModifierOptionDraft[] = [
  { id: "no-onions", label: "No onions", price: "0.00" },
  { id: "light-sauce", label: "Light sauce", price: "0.00" },
  { id: "extra-pickles", label: "Extra pickles", price: "0.50" },
  { id: "gf-bun", label: "Gluten-free bun", price: "1.50" },
  { id: "add-avocado", label: "Add avocado", price: "1.25" },
  { id: "no-tomato", label: "No tomato", price: "0.00" },
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
 * Editable local modifier-option capsule. A zero price means the option is
 * free, while any decimal amount becomes its custom upcharge.
 * @param props Option state and field-change handler.
 */
function ModifierOptionBox({
  option,
  onChange,
}: {
  option: ModifierOptionDraft;
  onChange: (field: "label" | "price", value: string) => void;
}) {
  return (
    <View style={styles.modifierOptionBox}>
      <View style={styles.modifierNameField}>
        <TextInput
          value={option.label}
          onChangeText={(value) => onChange("label", value)}
          placeholder="Option name"
          placeholderTextColor={styles.placeholderColor.color}
          style={styles.modifierOptionInput}
        />
      </View>
      <View style={styles.modifierPriceField}>
        <Text style={styles.modifierPricePrefix}>$</Text>
        <TextInput
          value={option.price}
          onChangeText={(value) => onChange("price", value)}
          placeholder="0.00"
          placeholderTextColor={styles.placeholderColor.color}
          keyboardType="decimal-pad"
          style={styles.modifierPriceInput}
        />
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
            {adminRepository.formatPrice(item.price)}
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
  modifierOptions,
  onChangeModifierOption,
  onSaveModifiers,
}: {
  item: AdminMenuItem;
  feedback: string | null;
  onChangeField: (field: AdminEditableField, value: string) => void;
  onMarkUnavailable: () => void;
  onMarkInStock: () => void;
  onPublish: () => void;
  modifierOptions: ModifierOptionDraft[];
  onChangeModifierOption: (
    optionId: string,
    field: "label" | "price",
    value: string
  ) => void;
  onSaveModifiers: () => void;
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
          <Pressable style={styles.modifierAddGroupBtn} onPress={onSaveModifiers}>
            <Text style={styles.modifierAddGroupLabel}>Save</Text>
          </Pressable>
        </View>

        <View style={styles.modifierCapsuleGrid}>
          {modifierOptions.map((option) => (
            <ModifierOptionBox
              key={option.id}
              option={option}
              onChange={(field, value) => onChangeModifierOption(option.id, field, value)}
            />
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
  const [modifierOptions, setModifierOptions] = useState(MODIFIER_OPTION_DRAFTS);
  const [modifierSaveMessage, setModifierSaveMessage] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isConfirmingCategoryDelete, setIsConfirmingCategoryDelete] = useState(false);
  const selectedCategory = admin.categories.find((category) => category.id === admin.selectedCategoryId);

  /** Update a single modifier option field in the local editor draft. */
  const updateModifierOption = (
    optionId: string,
    field: "label" | "price",
    value: string
  ) => {
    setModifierSaveMessage(null);
    setModifierOptions((options) =>
      options.map((option) => (option.id === optionId ? { ...option, [field]: value } : option))
    );
  };

  /** Keep modifier editing local-only while providing clear Save feedback. */
  const saveModifiers = () => {
    // This design pass deliberately does not persist modifier data yet.
    // Save acknowledges the current local selections without changing the catalog.
    setModifierSaveMessage("Modifier options saved locally.");
  };

  const addCategory = () => {
    if (admin.addCategory(newCategoryName)) {
      setNewCategoryName("");
      setIsAddingCategory(false);
    }
  };

  const deleteCategory = () => {
    admin.deleteCategory();
    setIsConfirmingCategoryDelete(false);
  };

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
              <View style={styles.categoriesHeader}>
                <Text style={styles.categoriesTitle}>Categories</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add category"
                  onPress={() => {
                    setIsAddingCategory((current) => !current);
                    setIsConfirmingCategoryDelete(false);
                  }}
                  style={styles.categoryAddButton}
                >
                  <Text style={styles.categoryAddLabel}>{isAddingCategory ? "Close" : "Add"}</Text>
                </Pressable>
              </View>
              {isAddingCategory && (
                <View style={styles.categoryForm}>
                  <TextInput
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    onSubmitEditing={addCategory}
                    placeholder="e.g. Sides"
                    placeholderTextColor={styles.placeholderColor.color}
                    style={styles.categoryInput}
                    autoFocus
                    returnKeyType="done"
                  />
                  <Button label="Create" onPress={addCategory} style={styles.categoryCreateButton} />
                </View>
              )}
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
              {selectedCategory && (
                <View style={styles.categoryDeleteArea}>
                  {isConfirmingCategoryDelete ? (
                    <>
                      <Text style={styles.categoryDeleteCopy}>
                        Remove {selectedCategory.name} and its {selectedCategory.count} local item(s)?
                      </Text>
                      <View style={styles.categoryDeleteActions}>
                        <Pressable onPress={() => setIsConfirmingCategoryDelete(false)} style={styles.categoryCancelButton}>
                          <Text style={styles.categoryCancelLabel}>Cancel</Text>
                        </Pressable>
                        <Pressable onPress={deleteCategory} style={styles.categoryDeleteButton}>
                          <Text style={styles.categoryDeleteLabel}>Delete</Text>
                        </Pressable>
                      </View>
                    </>
                  ) : (
                    <Pressable
                      onPress={() => {
                        setIsConfirmingCategoryDelete(true);
                        setIsAddingCategory(false);
                      }}
                      style={styles.categoryRemoveButton}
                    >
                      <Text style={styles.categoryRemoveLabel}>Delete {selectedCategory.name}</Text>
                    </Pressable>
                  )}
                </View>
              )}
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
                    feedback={modifierSaveMessage ?? admin.feedback}
                    onChangeField={admin.updateField}
                    onMarkUnavailable={admin.markUnavailable}
                    onMarkInStock={admin.markInStock}
                    onPublish={admin.publishItem}
                    modifierOptions={modifierOptions}
                    onChangeModifierOption={updateModifierOption}
                    onSaveModifiers={saveModifiers}
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
  categoriesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  categoriesTitle: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.textPrimary,
    fontWeight: "700",
  },
  categoryAddButton: {
    height: 34,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  categoryAddLabel: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 13,
    color: theme.colors.textAccent,
    fontWeight: "700",
  },
  categoryForm: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f6f0e5",
    borderRadius: 18,
    padding: 10,
    marginBottom: 12,
  },
  categoryInput: {
    flex: 1,
    minWidth: 0,
    height: 38,
    borderRadius: 12,
    backgroundColor: theme.colors.white,
    paddingHorizontal: 12,
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 13,
    color: theme.colors.textPrimary,
  },
  categoryCreateButton: {
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  categoriesContent: {
    gap: 12,
    paddingBottom: 14,
  },
  categoryDeleteArea: {
    backgroundColor: "#f6f0e5",
    borderRadius: 18,
    padding: 10,
    gap: 8,
  },
  categoryRemoveButton: {
    minHeight: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  categoryRemoveLabel: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: "700",
  },
  categoryDeleteCopy: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },
  categoryDeleteActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  categoryCancelButton: {
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  categoryCancelLabel: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: "700",
  },
  categoryDeleteButton: {
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    backgroundColor: theme.colors.textPrimary,
  },
  categoryDeleteLabel: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 12,
    color: theme.colors.white,
    fontWeight: "700",
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  modifierOptionInput: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 13,
    color: theme.colors.textPrimary,
    fontWeight: "600",
    padding: 0,
  },
  modifierPricePrefix: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  modifierPriceInput: {
    flex: 1,
    minWidth: 0,
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: "700",
    padding: 0,
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
