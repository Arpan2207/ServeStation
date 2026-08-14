/**
 * Reusable button primitive with multiple visual variants:
 *  - primary: solid orange CTA (gradient-like via solid colour)
 *  - secondary: translucent light-orange on cream backgrounds
 *  - ghost: subtle white-on-dark surface (used inside the cart sidebar)
 *  - outline: bordered button on light backgrounds
 */

import React from "react";
import { Pressable, Text, ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";

interface ButtonProps {
  label: string;
  variant?: ButtonVariant;
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
}

export function Button({
  label,
  variant = "primary",
  style,
  onPress,
  disabled = false,
}: ButtonProps) {
  return (
    <Pressable
      style={[
        styles.base,
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "ghost" && styles.ghost,
        variant === "outline" && styles.outline,
        style,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[
          styles.label,
          variant === "secondary" && styles.secondaryLabel,
          variant === "outline" && styles.outlineLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radii.lg,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  label: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textOnPrimary,
  },
  primary: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.xl,
    paddingVertical: 16,
  },
  secondary: {
    backgroundColor: theme.colors.primaryLight,
  },
  secondaryLabel: {
    color: theme.colors.textAccent,
  },
  ghost: {
    backgroundColor: theme.colors.sidebarControl,
    borderRadius: theme.radii.md,
  },
  outline: {
    backgroundColor: theme.colors.transparent,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  outlineLabel: {
    color: theme.colors.textSecondary,
  },
  disabled: {
    opacity: 0.55,
  },
}));
