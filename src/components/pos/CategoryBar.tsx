/**
 * Horizontal scrollable row of category chips at the top of the left pane.
 * The first chip ("Popular") is active by default; the rest are inactive.
 * A search bar placeholder fills the remaining space on the right.
 *
 * The three-dot icon on the left opens a small dropdown with navigation
 * options (e.g. Orders screen).
 */

import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { StyleSheet } from "react-native-unistyles";

import { Chip } from "@/components/ui/Chip";

const CATEGORIES = [
  "Popular",
  "Burgers",
  "Bowls",
  "Sides",
  "Drinks",
  "Desserts",
] as const;

const MENU_ITEMS = [
  { label: "Orders", route: "/orders" as const },
  { label: "Admin", route: undefined },
  { label: "Settings", route: undefined },
];

export function CategoryBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

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
            {MENU_ITEMS.map((item) => (
              <Pressable
                key={item.label}
                style={styles.dropdownItem}
                onPress={() => handleMenuItemPress(item.route)}
              >
                <Text
                  style={[
                    styles.dropdownLabel,
                    !item.route && styles.dropdownDisabled,
                  ]}
                >
                  {item.label}
                </Text>
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
        {CATEGORIES.map((cat) => (
          <Chip key={cat} label={cat} active={cat === "Popular"} />
        ))}
      </ScrollView>

      <View style={styles.searchBar}>
        <Text style={styles.searchPlaceholder}>
          Search menu items, combos, drinks...
        </Text>
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
  dropdownDisabled: {
    color: theme.colors.textTertiary,
  },

  searchBar: {
    flex: 1,
    height: 42,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radii.xl,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  searchPlaceholder: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.size.md,
    color: theme.colors.textTertiary,
  },
}));
