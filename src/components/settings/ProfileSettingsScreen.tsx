/**
 * Profile Settings screen.
 * UI-only profile and store preferences screen that follows the settings theme.
 */

import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { StyleSheet } from "react-native-unistyles";

import { Screen } from "@/components/ui/Screen";
import { NoteDialog } from "@/components/primitives/NoteDialog";
import { colors } from "@/theme/colors";

/** Editable text values displayed throughout the local profile screen. */
interface ProfileDraft {
  ownerName: string;
  email: string;
  phone: string;
  businessName: string;
  location: string;
  storeId: string;
  staffProfileVisibility: string;
  receiptSenderName: string;
  defaultDashboard: string;
}

/** A text field that can be edited through the shared dialog. */
type ProfileFieldKey = keyof ProfileDraft;

/** Metadata for one editable profile setting row. */
interface ProfileField {
  key: ProfileFieldKey;
  label: string;
}

const ACCOUNT_FIELDS: ProfileField[] = [
  { key: "ownerName", label: "Owner name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
];

const STORE_FIELDS: ProfileField[] = [
  { key: "businessName", label: "Business name" },
  { key: "location", label: "Location" },
  { key: "storeId", label: "Store ID" },
];

const ACCESS_ITEMS: ProfileField[] = [
  { key: "staffProfileVisibility", label: "Staff profile visibility" },
  { key: "receiptSenderName", label: "Receipt sender name" },
  { key: "defaultDashboard", label: "Default dashboard" },
];

const INITIAL_PROFILE: ProfileDraft = {
  ownerName: "Avery Stone",
  email: "avery@servestation.local",
  phone: "(415) 555-0184",
  businessName: "ServeStation Coffee",
  location: "Mission District, San Francisco",
  storeId: "KSK-1042",
  staffProfileVisibility: "Managers only",
  receiptSenderName: "Store display name",
  defaultDashboard: "POS workspace",
};

/**
 * Displays a pressable profile field row that opens the shared text editor.
 */
function FieldRow({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <Pressable style={styles.fieldRow} onPress={onPress}>
      <View style={styles.fieldCopy}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value}</Text>
      </View>
      <Text style={styles.editLabel}>Edit</Text>
    </Pressable>
  );
}

/**
 * Wraps React Native's switch primitive with ServeStation profile-setting copy.
 */
function PreferenceToggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: () => void;
}) {
  return (
    <View style={styles.preferenceRow}>
      <View style={styles.preferenceCopy}>
        <Text style={styles.preferenceLabel}>{label}</Text>
        <Text style={styles.preferenceDesc}>{description}</Text>
      </View>
      <Switch
        accessibilityRole="switch"
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.surfaceMuted, true: colors.primary }}
        thumbColor={colors.white}
        ios_backgroundColor={colors.surfaceMuted}
      />
    </View>
  );
}

/**
 * Shows one pressable access preference row in the profile settings panel.
 */
function AccessRow({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <Pressable style={styles.accessRow} onPress={onPress}>
      <Text style={styles.accessLabel}>{label}</Text>
      <View style={styles.accessValueWrap}>
        <Text style={styles.accessValue}>{value}</Text>
        <Text style={styles.editLabel}>Edit</Text>
      </View>
    </Pressable>
  );
}

/**
 * Renders the frontend-only profile settings screen with editable local
 * account, store, access, and notification preferences.
 */
export function ProfileSettingsScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileDraft>(INITIAL_PROFILE);
  const [editingField, setEditingField] = useState<ProfileField | null>(null);
  const [fieldValue, setFieldValue] = useState("");
  const [orderAlerts, setOrderAlerts] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(true);
  const [securityPrompts, setSecurityPrompts] = useState(false);
  const [saved, setSaved] = useState(false);

  /** Derived values keep the profile hero and stats current after local edits. */
  const quickStats = useMemo(
    () => [
      { label: "Role", value: "Owner" },
      { label: "Last sync", value: saved ? "Just now" : "2 min ago" },
      { label: "Plan", value: "Pro" },
    ],
    [saved]
  );
  const avatarInitials = useMemo(
    () =>
      profile.ownerName
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "?",
    [profile.ownerName]
  );

  /** Open the shared dialog with the current value of a selected field. */
  const openFieldEditor = (field: ProfileField) => {
    setEditingField(field);
    setFieldValue(profile[field.key]);
  };

  /** Apply one dialog edit to the local profile draft. */
  const saveField = () => {
    if (!editingField) return;
    setProfile((current) => ({ ...current, [editingField.key]: fieldValue.trim() }));
    setEditingField(null);
    setSaved(false);
  };

  return (
    <Screen>
      <View style={styles.screen}>
        <View style={styles.frame}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Pressable onPress={() => router.back()} style={styles.backButton}>
                <Text style={styles.backLabel}>Back</Text>
              </Pressable>
              <Text style={styles.title}>Profile settings</Text>
            </View>
            <Pressable style={styles.saveButton} onPress={() => setSaved(true)}>
              <Text style={styles.saveLabel}>{saved ? "Changes saved" : "Save changes"}</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentInner}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.profileHero}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{avatarInitials}</Text>
              </View>
              <View style={styles.profileCopy}>
                <Text style={styles.profileName}>{profile.ownerName}</Text>
                <Text style={styles.profileMeta}>Owner account - {profile.businessName}</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusText}>Verified</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              {quickStats.map((stat) => (
                <View key={stat.label} style={styles.statCard}>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  <Text style={styles.statValue}>{stat.value}</Text>
                </View>
              ))}
            </View>

            <View style={styles.mainGrid}>
              <View style={styles.leftColumn}>
                <View style={styles.panel}>
                  <View style={styles.panelHeader}>
                    <Text style={styles.panelTitle}>Account details</Text>
                    <Text style={styles.panelBadge}>Primary</Text>
                  </View>
                  {ACCOUNT_FIELDS.map((field) => (
                    <FieldRow
                      key={field.key}
                      label={field.label}
                      value={profile[field.key]}
                      onPress={() => openFieldEditor(field)}
                    />
                  ))}
                </View>

                <View style={styles.panel}>
                  <View style={styles.panelHeader}>
                    <Text style={styles.panelTitle}>Store profile</Text>
                    <Text style={styles.panelBadge}>Public</Text>
                  </View>
                  {STORE_FIELDS.map((field) => (
                    <FieldRow
                      key={field.key}
                      label={field.label}
                      value={profile[field.key]}
                      onPress={() => openFieldEditor(field)}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.rightColumn}>
                <View style={styles.panel}>
                  <Text style={styles.panelTitle}>Notifications</Text>
                  <PreferenceToggle
                    label="Order alerts"
                    description="Surface new and delayed orders on this device."
                    value={orderAlerts}
                    onChange={() => {
                      setOrderAlerts((current) => !current);
                      setSaved(false);
                    }}
                  />
                  <PreferenceToggle
                    label="Daily digest"
                    description="Send a closing summary to the account email."
                    value={dailyDigest}
                    onChange={() => {
                      setDailyDigest((current) => !current);
                      setSaved(false);
                    }}
                  />
                  <PreferenceToggle
                    label="Security prompts"
                    description="Ask for confirmation before sensitive admin actions."
                    value={securityPrompts}
                    onChange={() => {
                      setSecurityPrompts((current) => !current);
                      setSaved(false);
                    }}
                  />
                </View>

                <View style={styles.panel}>
                  <Text style={styles.panelTitle}>Access preferences</Text>
                  {ACCESS_ITEMS.map((item) => (
                    <AccessRow
                      key={item.key}
                      label={item.label}
                      value={profile[item.key]}
                      onPress={() => openFieldEditor(item)}
                    />
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>

          <NoteDialog
            visible={editingField !== null}
            title={`Edit ${editingField?.label ?? "profile field"}`}
            description="Changes stay on this device until you save your profile."
            value={fieldValue}
            placeholder={editingField?.label ?? "Enter a value"}
            saveLabel="Save field"
            onChangeText={setFieldValue}
            onDismiss={() => setEditingField(null)}
            onSave={saveField}
          />
        </View>
      </View>
    </Screen>
  );
}

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
  header: {
    width: "100%",
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  backButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: theme.colors.surfaceWarm,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  backLabel: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: "700",
  },
  title: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 22,
    lineHeight: 28,
    color: theme.colors.textPrimary,
    fontWeight: "700",
  },
  saveButton: {
    minWidth: 132,
    height: 42,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  saveLabel: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 15,
    color: theme.colors.textOnPrimary,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    minHeight: 0,
  },
  contentInner: {
    gap: 14,
    paddingBottom: 22,
  },
  profileHero: {
    minHeight: 128,
    borderRadius: 24,
    backgroundColor: theme.colors.surfaceWarm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 24,
    color: theme.colors.textOnPrimary,
    fontWeight: "800",
  },
  profileCopy: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  profileName: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 24,
    lineHeight: 30,
    color: theme.colors.textPrimary,
    fontWeight: "800",
  },
  profileMeta: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 15,
    lineHeight: 21,
    color: theme.colors.textSecondary,
  },
  statusPill: {
    borderRadius: 999,
    backgroundColor: theme.colors.primaryLighter,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusText: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  statCard: {
    flex: 1,
    minWidth: 170,
    minHeight: 76,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: "center",
    gap: 5,
  },
  statLabel: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 13,
    color: theme.colors.textTertiary,
    fontWeight: "700",
  },
  statValue: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 18,
    color: theme.colors.textPrimary,
    fontWeight: "800",
  },
  mainGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  leftColumn: {
    flex: 1.4,
    minWidth: 320,
    gap: 14,
  },
  rightColumn: {
    flex: 1,
    minWidth: 300,
    gap: 14,
  },
  panel: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 22,
    padding: 18,
    gap: 14,
    overflow: "hidden",
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  panelTitle: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 19,
    color: theme.colors.textPrimary,
    fontWeight: "700",
  },
  panelBadge: {
    borderRadius: 999,
    backgroundColor: theme.colors.surfaceWarm,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: "700",
  },
  fieldRow: {
    minHeight: 70,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fieldCopy: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  fieldLabel: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 13,
    color: theme.colors.textTertiary,
    fontWeight: "700",
  },
  fieldValue: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.textPrimary,
    fontWeight: "700",
  },
  editLabel: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: "800",
  },
  preferenceRow: {
    minHeight: 82,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  preferenceCopy: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  preferenceLabel: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: "700",
  },
  preferenceDesc: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.textSecondary,
  },
  accessRow: {
    minHeight: 58,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  accessLabel: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 15,
    lineHeight: 20,
    color: theme.colors.textSecondary,
    fontWeight: "700",
  },
  accessValue: {
    flex: 1,
    textAlign: "right",
    fontFamily: theme.typography.fontFamily.label,
    fontSize: 15,
    lineHeight: 20,
    color: theme.colors.textPrimary,
    fontWeight: "800",
  },
  accessValueWrap: {
    flex: 1,
    minWidth: 0,
    alignItems: "flex-end",
    gap: 4,
  },
}));
