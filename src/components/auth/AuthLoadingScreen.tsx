/** Full-screen loading state shown while a persisted staff session is restored. */

import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { Screen } from "@/components/ui/Screen";

/** Render the app-shell loading state while authentication initializes. */
export function AuthLoadingScreen() {
  return (
    <Screen>
      <View style={styles.root}>
        <ActivityIndicator size="large" color={styles.message.color} />
        <Text style={styles.message}>Restoring staff session…</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xl,
    backgroundColor: theme.colors.surfaceWarm,
  },
  message: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: theme.typography.size.md,
    color: theme.colors.primary,
    fontWeight: "700",
  },
}));
