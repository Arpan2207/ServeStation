/**
 * UI Settings screen — Figma MCP node 19:637.
 * Two-column layout: left controls (brand color, touch mode, layout density)
 * and a right live preview panel.
 *
 * Interactive (frontend-only): brand color selection, a large-touch-mode
 * toggle, and layout density selection. The live preview reflects the chosen
 * brand color and density, and "Apply theme" surfaces local feedback.
 * Nothing is persisted.
 */

import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { Screen } from "@/components/ui/Screen";

/* ── Mock data ───────────────────────────────────────── */

const BRAND_COLORS = ["#ff7a1a", "#1f9d55", "#0f766e"] as const;
const DENSITY_OPTIONS = ["Comfortable", "Balanced", "Compact"] as const;

type Density = (typeof DENSITY_OPTIONS)[number];

/** Preview inner gap per density, so the preview reacts to the selection. */
const DENSITY_GAP: Record<Density, number> = {
  Comfortable: 16,
  Balanced: 12,
  Compact: 8,
};

/* ── Component ───────────────────────────────────────── */

export function UiSettingsScreen() {
  // Local, frontend-only settings state.
  const [brandColor, setBrandColor] = useState<string>(BRAND_COLORS[0]);
  const [touchMode, setTouchMode] = useState<boolean>(true);
  const [density, setDensity] = useState<Density>("Balanced");
  const [applied, setApplied] = useState(false);

  /** Apply theme: surface local confirmation (no persistence). */
  function handleApply() {
    setApplied(true);
  }

  return (
    <Screen>
      <View style={styles.screen}>
        <View style={styles.frame}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>UI settings</Text>
            <Pressable
              style={[styles.applyBtn, { backgroundColor: brandColor }]}
              onPress={handleApply}
            >
              <Text style={styles.applyLabel}>
                {applied ? "Theme applied" : "Apply theme"}
              </Text>
            </Pressable>
          </View>

          {/* Content row */}
          <View style={styles.content}>
            {/* ── Left Column: Controls ── */}
            <View style={styles.leftColumn}>
              {/* Brand color card */}
              <View style={styles.controlCard}>
                <Text style={styles.cardTitle}>Brand color</Text>
                <Text style={styles.cardDesc}>
                  Use a single warm accent to keep action hierarchy consistent.
                </Text>
                <View style={styles.swatchRow}>
                  {BRAND_COLORS.map((color) => (
                    <Pressable
                      key={color}
                      onPress={() => {
                        setBrandColor(color);
                        setApplied(false);
                      }}
                      style={[
                        styles.swatch,
                        { backgroundColor: color },
                        brandColor === color && styles.swatchSelected,
                      ]}
                    />
                  ))}
                </View>
              </View>

              {/* Large touch mode card */}
              <View style={styles.controlCard}>
                <Text style={styles.cardTitle}>Large touch mode</Text>
                <Text style={styles.cardDesc}>
                  Increase button heights and card padding for smaller tablets.
                </Text>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>
                    {touchMode ? "Enabled" : "Disabled"}
                  </Text>
                  <Pressable
                    onPress={() => setTouchMode((v) => !v)}
                    style={[
                      styles.toggleTrack,
                      touchMode
                        ? { backgroundColor: brandColor, alignItems: "flex-end" }
                        : styles.toggleTrackOff,
                    ]}
                  >
                    <View style={styles.toggleKnob} />
                  </Pressable>
                </View>
              </View>

              {/* Layout density card */}
              <View style={styles.controlCard}>
                <Text style={styles.cardTitle}>Layout density</Text>
                <Text style={styles.cardDesc}>
                  Fine-tune how much catalog content fits per screen.
                </Text>
                <View style={styles.densityRow}>
                  {DENSITY_OPTIONS.map((option) => {
                    const active = option === density;
                    return (
                      <Pressable
                        key={option}
                        onPress={() => setDensity(option)}
                        style={[
                          styles.densityPill,
                          active && { backgroundColor: brandColor },
                        ]}
                      >
                        <Text
                          style={[
                            styles.densityText,
                            active && styles.densityTextActive,
                          ]}
                        >
                          {option}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* ── Right Column: Live Preview ── */}
            <View style={styles.rightColumn}>
              <Text style={styles.cardTitle}>Live preview</Text>
              <Text style={styles.cardDesc}>
                This preview mirrors the split POS layout at a smaller scale.
              </Text>
              <View style={styles.previewContainer}>
                <View style={[styles.previewRow, { gap: DENSITY_GAP[density] }]}>
                  <View style={styles.previewLeft}>
                    {/* Accent bar reflects the selected brand color */}
                    <View
                      style={[styles.previewAccent, { backgroundColor: brandColor }]}
                    />
                  </View>
                  <View style={styles.previewRight}>
                    <View
                      style={[
                        styles.previewCta,
                        { backgroundColor: brandColor },
                        touchMode && styles.previewCtaLarge,
                      ]}
                    />
                  </View>
                </View>
              </View>
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
    borderColor: theme.colors.border,
    borderRadius: 30,
    paddingHorizontal: 23,
    paddingTop: 23,
    paddingBottom: 1,
    gap: 18,
    overflow: "hidden",
  },

  /* Header */
  header: {
    width: "100%",
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  title: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 22,
    color: theme.colors.textPrimary,
    fontWeight: "700",
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 15,
    color: "#5e584f",
  },
  applyBtn: {
    minWidth: 116,
    height: 42,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  applyLabel: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 15,
    color: theme.colors.textOnPrimary,
    fontWeight: "700",
  },

  /* Content row */
  content: {
    flex: 1,
    width: "100%",
    flexDirection: "row",
    gap: 14,
    minHeight: 0,
    overflow: "hidden",
  },

  /* Left column */
  leftColumn: {
    flex: 5,
    flexBasis: 0,
    minWidth: 0,
    gap: 14,
  },
  controlCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 22,
    paddingHorizontal: 19,
    paddingTop: 33,
    paddingBottom: 19,
    gap: 6,
    overflow: "hidden",
  },
  cardTitle: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 19,
    color: theme.colors.textPrimary,
    fontWeight: "700",
  },
  cardDesc: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 15,
    lineHeight: 21,
    color: "#5e584f",
    maxWidth: 320,
  },

  /* Brand color swatches */
  swatchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  swatch: {
    width: 56,
    height: 56,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  swatchSelected: {
    borderWidth: 3,
    borderColor: theme.colors.textPrimary,
  },

  /* Toggle row */
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  toggleLabel: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 17,
    color: theme.colors.textPrimary,
  },
  toggleTrack: {
    width: 58,
    height: 34,
    borderRadius: 999,
    backgroundColor: "#ffd1ab",
    padding: 3,
    justifyContent: "center",
  },
  toggleTrackOff: {
    backgroundColor: "#d8d2c7",
    alignItems: "flex-start",
  },
  toggleKnob: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: theme.colors.white,
  },

  /* Density row */
  densityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  densityPill: {
    height: 37,
    borderRadius: 14,
    backgroundColor: "#f6f0e5",
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  densityText: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 15,
    color: theme.colors.textPrimary,
    fontWeight: "700",
  },
  densityTextActive: {
    color: theme.colors.textOnPrimary,
  },

  /* Right column: live preview */
  rightColumn: {
    flex: 3,
    flexBasis: 0,
    minWidth: 0,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 22,
    paddingHorizontal: 19,
    paddingTop: 33,
    paddingBottom: 19,
    gap: 6,
    overflow: "hidden",
  },
  previewContainer: {
    flex: 1,
    backgroundColor: "#171717",
    borderRadius: 24,
    paddingTop: 18,
    paddingHorizontal: 18,
    marginTop: 10,
    overflow: "hidden",
  },
  previewRow: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
  },
  previewLeft: {
    flex: 1.7,
    borderRadius: 20,
    backgroundColor: "#262626",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 12,
    justifyContent: "flex-end",
  },
  previewAccent: {
    height: 12,
    borderRadius: 6,
  },
  previewRight: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: "#1e1e1e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 12,
    justifyContent: "flex-end",
  },
  previewCta: {
    height: 18,
    borderRadius: 9,
  },
  previewCtaLarge: {
    height: 26,
  },
}));
