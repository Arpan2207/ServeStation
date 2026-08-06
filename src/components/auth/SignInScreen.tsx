/** Tablet-first staff sign-in screen for Supabase email/password authentication. */

import React, { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/hooks/useAuth";

/** Render the controlled staff sign-in form and local error feedback. */
export function SignInScreen() {
  const { signIn, error: accessError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  /** Submit email/password credentials through the auth repository boundary. */
  async function handleSignIn() {
    if (!email.trim() || !password) {
      setFormError("Enter both email and password.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await signIn(email, password);
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <View style={styles.root}>
        <View style={styles.brandPanel}>
          <Text style={styles.eyebrow}>SERVESTATION</Text>
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.supporting}>
            Sign in with the staff account assigned to this store.
          </Text>
          <View style={styles.roleRow}>
            <Text style={styles.rolePill}>Owner</Text>
            <Text style={styles.rolePill}>Manager</Text>
            <Text style={styles.rolePill}>Cashier</Text>
          </View>
        </View>

        <View style={styles.formPanel}>
          <Card style={styles.formCard}>
            <Text style={styles.formTitle}>Staff sign in</Text>
            <Text style={styles.formDescription}>
              Your account controls which store data you can access.
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                placeholder="staff@example.com"
                placeholderTextColor={styles.placeholder.color}
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="password"
                placeholder="Enter password"
                placeholderTextColor={styles.placeholder.color}
                style={styles.input}
                onSubmitEditing={() => void handleSignIn()}
              />
            </View>

            {(formError || accessError) && (
              <Text style={styles.errorText}>{formError ?? accessError}</Text>
            )}

            <Button
              label={submitting ? "Signing in…" : "Sign in"}
              onPress={() => void handleSignIn()}
              disabled={submitting}
            />
          </Card>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    flexDirection: { xs: "column", md: "row" },
    backgroundColor: theme.colors.surfaceWarm,
    padding: { xs: theme.spacing["3xl"], md: theme.spacing["5xl"] },
    gap: theme.spacing["3xl"],
  },
  brandPanel: {
    flex: 1,
    minWidth: 0,
    borderRadius: theme.radii["3xl"],
    backgroundColor: theme.colors.sidebar,
    padding: { xs: theme.spacing["3xl"], md: theme.spacing["5xl"] },
    justifyContent: "center",
    gap: theme.spacing.xl,
  },
  eyebrow: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: theme.typography.size.sm,
    color: theme.colors.primary,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  heading: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 36,
    lineHeight: 42,
    color: theme.colors.white,
    fontWeight: "800",
  },
  supporting: {
    maxWidth: 420,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.size.lg,
    lineHeight: 24,
    color: theme.colors.textTertiary,
  },
  roleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  rolePill: {
    borderRadius: 999,
    backgroundColor: theme.colors.sidebarControl,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    fontFamily: theme.typography.fontFamily.label,
    fontSize: theme.typography.size.sm,
    color: theme.colors.white,
    fontWeight: "700",
  },
  formPanel: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  formCard: {
    width: "100%",
    maxWidth: 460,
    padding: theme.spacing["5xl"],
    gap: theme.spacing.xl,
  },
  formTitle: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: theme.typography.size["2xl"],
    color: theme.colors.textPrimary,
    fontWeight: "800",
  },
  formDescription: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.size.md,
    lineHeight: 20,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  fieldGroup: {
    gap: theme.spacing.sm,
  },
  fieldLabel: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textPrimary,
    fontWeight: "700",
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: theme.spacing["3xl"],
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.size.md,
    color: theme.colors.textPrimary,
  },
  placeholder: {
    color: theme.colors.textTertiary,
  },
  errorText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.size.sm,
    lineHeight: 18,
    color: theme.colors.danger,
  },
}));
