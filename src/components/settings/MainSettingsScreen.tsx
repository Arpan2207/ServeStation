/**
 * Main Settings screen — Figma MCP node 142:2.
 * A settings hub with cards for UI settings, Profile settings,
 * and Admin options. All data is static/mock for the UI-only phase.
 */

import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useRouter } from "expo-router";

import { Screen } from "@/components/ui/Screen";

/* ── Card data ───────────────────────────────────────── */

interface SettingsCardData {
  title: string;
  description: string;
  badge: string;
  chips: string[];
  footerLabel?: string;
  highlighted?: boolean;
}

const CARDS: SettingsCardData[] = [
  {
    title: "UI settings",
    description: "Adjust theme, contrast, touch density, and layout preview.",
    badge: "Display",
    chips: ["Theme", "Touch density", "Layout preview"],
    footerLabel: "Visual preferences",
    highlighted: true,
  },
  {
    title: "Profile settings",
    description: "Manage owner profile, business details, and account preferences.",
    badge: "Account",
    chips: ["Account", "Store profile", "Notifications"],
    footerLabel: "Profile controls",
  },
];

const ADMIN_CARD: SettingsCardData = {
  title: "Admin options",
  description: "Open staff, menu, and permission tools for deeper operational control.",
  badge: "Access",
  chips: ["Roles", "Permissions", "Advanced controls"],
  footerLabel: "Admin tools",
};

/* ── Local helpers ───────────────────────────────────── */

function SettingsChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <View style={[styles.chip, active ? styles.chipActive : styles.chipMuted]}>
      <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextMuted]}>
        {label}
      </Text>
    </View>
  );
}

function SettingsCard({ card, wide, onPress }: { card: SettingsCardData; wide?: boolean; onPress?: () => void }) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper onPress={onPress} style={[styles.card, card.highlighted && styles.cardHighlighted, wide && styles.cardWide]}>
      {/* Top section: text + badge */}
      <View style={styles.cardTop}>
        <View style={styles.cardCopy}>
          <Text style={styles.cardTitle}>{card.title}</Text>
          <Text style={styles.cardDesc}>{card.description}</Text>
        </View>
        <SettingsChip label={card.badge} active={true} />
      </View>

      {/* Tags */}
      <View style={styles.tagsRow}>
        {card.chips.map((chip) => (
          <SettingsChip key={chip} label={chip} active={chip === card.chips[0] && card.highlighted} />
        ))}
      </View>

      {/* Spacer + Footer */}
      <View style={styles.spacer} />
      <View style={styles.cardFooter}>
        <Text style={[styles.footerLabel, card.highlighted && styles.footerLabelActive]}>
          {card.footerLabel}
        </Text>
        <Text style={styles.footerOpen}>Open</Text>
      </View>
    </Wrapper>
  );
}

/* ── Component ───────────────────────────────────────── */

export function MainSettingsScreen() {
  const router = useRouter();

  return (
    <Screen>
      <View style={styles.screen}>
        <View style={styles.frame}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Settings</Text>
            <View style={styles.quickAccessBtn}>
              <Text style={styles.quickAccessLabel}>Quick access</Text>
            </View>
          </View>

          {/* Cards grid */}
          <ScrollView
            style={styles.grid}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Top row: two half-width cards */}
            <View style={styles.topRow}>
              {CARDS.map((card) => (
                <SettingsCard
                  key={card.title}
                  card={card}
                  onPress={
                    card.title === "UI settings"
                      ? () => router.push("/settings/ui" as any)
                      : card.title === "Profile settings"
                        ? () => router.push("/settings/profile" as any)
                      : undefined
                  }
                />
              ))}
            </View>

            {/* Bottom: full-width admin card */}
            <SettingsCard
              card={ADMIN_CARD}
              wide={true}
              onPress={() => router.push("/admin" as any)}
            />
          </ScrollView>
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
    paddingTop: 23,
    paddingBottom: 23,
    gap: 18,
    overflow: "hidden",
  },

  /* Header */
  header: {
    width: "100%",
    height: 40,
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
  quickAccessBtn: {
    width: 138,
    height: 42,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  quickAccessLabel: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 14,
    color: theme.colors.textOnPrimary,
    fontWeight: "600",
  },

  /* Grid */
  grid: {
    flex: 1,
  },
  gridContent: {
    gap: 14,
    paddingBottom: 14,
  },
  topRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },

  /* Card */
  card: {
    flex: 1,
    minWidth: 280,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.textPrimary,
    borderRadius: 22,
    padding: 18,
    gap: 14,
    overflow: "hidden",
  },
  cardHighlighted: {
    backgroundColor: "#fff3e7",
  },
  cardWide: {
    flexBasis: "100%",
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  cardTitle: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 19,
    lineHeight: 26,
    color: theme.colors.textPrimary,
    fontWeight: "700",
  },
  cardDesc: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.icon,
    maxWidth: 280,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  spacer: {
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerLabel: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: "600",
  },
  footerLabelActive: {
    color: theme.colors.primary,
  },
  footerOpen: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 16,
    color: theme.colors.icon,
    fontWeight: "600",
  },

  /* Chips */
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: theme.colors.primaryLighter,
  },
  chipMuted: {
    backgroundColor: "#fcf9f3",
    borderWidth: 1,
    borderColor: theme.colors.textPrimary,
    opacity: 0.32,
  },
  chipText: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 14,
    fontWeight: "600",
  },
  chipTextActive: {
    color: theme.colors.primary,
  },
  chipTextMuted: {
    color: theme.colors.icon,
  },
}));
