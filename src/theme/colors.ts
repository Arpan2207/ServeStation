/**
 * Design-token palette extracted from the ServeStation Figma file.
 * Every color used across the app should reference these tokens
 * rather than hardcoding hex values in component styles.
 */

export const colors = {
  /* ── Light surface hierarchy ─────────────────────────── */
  background: "#fffbf5",
  surface: "#fffdf8",
  surfaceWarm: "#f7f0e4",
  surfaceMuted: "#f3ece1",
  surfaceLight: "#fcf9f3",

  /* ── Primary (orange) scale ──────────────────────────── */
  primary: "#ff7a1a",
  primaryLight: "#ffe0c6",
  primaryLighter: "#ffe1c9",
  primaryGradientStart: "#ff8e45",
  primaryGradientEnd: "#ff7a1a",

  /* ── Text ────────────────────────────────────────────── */
  textPrimary: "#1f1b16",
  textSecondary: "#675f55",
  textTertiary: "#918678",
  textAccent: "#9a4e10",
  textOnPrimary: "#ffffff",

  /* ── Icons ───────────────────────────────────────────── */
  icon: "#716a60",

  /* ── Borders ─────────────────────────────────────────── */
  border: "rgba(31,27,22,0.05)",
  borderSubtle: "rgba(31,27,22,0.06)",

  /* ── Dark sidebar (cart panel) ───────────────────────── */
  sidebar: "#171717",
  sidebarCard: "#38383b",
  sidebarBorder: "rgba(255,255,255,0.08)",
  sidebarControl: "rgba(255,255,255,0.08)",

  /* ── Semantic / misc ─────────────────────────────────── */
  white: "#ffffff",
  transparent: "transparent",
} as const;
