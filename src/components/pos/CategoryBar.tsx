/**
 * Horizontal scrollable row of category chips at the top of the left pane.
 * Now a controlled component: the parent owns the selected category and the
 * search text, and this component reports changes back through callbacks.
 *
 * The three-dot icon on the left opens a small dropdown with navigation
 * options (e.g. Orders screen).
 */

import React, { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { StyleSheet } from "react-native-unistyles";

import { Chip } from "@/components/ui/Chip";
import type { MenuCategory } from "@/types/pos";

/** Navigation targets available from the three-dot menu. */
const NAV_ITEMS = [
  { label: "Orders", route: "/orders" as const },
  { label: "Settings", route: "/settings" as const },
];

interface CategoryBarProps {
  /** Categories to render as selectable chips. */
  categories: MenuCategory[];
  /** Id of the currently active category. */
  selectedCategoryId: string;
  /** Called when a category chip is pressed. */
  onSelectCategory: (categoryId: string) => void;
  /** Current search query value. */
  searchText: string;
  /** Called as the search query changes. */
  onSearchChange: (text: string) => void;
}

/**
 * Controlled category bar with category chips and a live search field.
 * @param props Category list, selection, search text, and change handlers.
 */
export function CategoryBar({
  categories,
  selectedCategoryId,
  onSelectCategory,
  searchText,
  onSearchChange,
}: CategoryBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  /** Close the dropdown and navigate to the chosen route. */
  function handleMenuItemPress(route: string | undefined) {
    setMenuOpen(false);
    if (route) {
      router.push(route as any);
    }
  }

  return (
    <View style={styles.container}>
      {/* Three-dot menu trigger — outside ScrollView so touches aren't stolen */}
      <View style={styles.menuWrapper}>
        <Pressable
          style={styles.menuIcon}
          onPress={() => setMenuOpen((v) => !v)}
        >
          <Text style={styles.menuDots}>⋮</Text>
        </Pressable>

        {/* Dropdown */}
        {menuOpen && (
          <View style={styles.dropdown}>
            {NAV_ITEMS.map((item) => (
              <Pressable
                key={item.label}
                style={styles.dropdownItem}
                onPress={() => handleMenuItemPress(item.route)}
              >
                <Text style={styles.dropdownLabel}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pills}
      >
        {categories.map((cat) => (
          <Pressable key={cat.id} onPress={() => onSelectCategory(cat.id)}>
            <Chip label={cat.label} active={cat.id === selectedCategoryId} />
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={onSearchChange}
          placeholder="Search menu items, combos, drinks..."
          placeholderTextColor={styles.searchPlaceholder.color}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 42,
    zIndex: 10,
  },
  pills: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  menuWrapper: {
    zIndex: 100,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  menuDots: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },

  /* Dropdown menu positioned below the three-dot button */
  dropdown: {
    position: "absolute",
    top: 46,
    left: 0,
    minWidth: 150,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownLabel: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.size.base,
    color: theme.colors.textPrimary,
  },

  searchBar: {
    flex: 1,
    height: 42,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radii.xl,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  searchInput: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.size.md,
    color: theme.colors.textPrimary,
    padding: 0,
  },
  searchPlaceholder: {
    color: theme.colors.textTertiary,
  },
}));
