/**
 * Reusable modal for collecting a short free-text value anywhere in the app.
 *
 * It owns only the dialog presentation. Callers own the text value and decide
 * what saving means, so the same component works for notes and profile edits.
 */

import React from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

/** Props used to render and control a reusable note-entry dialog. */
export interface NoteDialogProps {
  /** Whether the modal is currently visible. */
  visible: boolean;
  /** Short heading displayed at the top of the dialog. */
  title: string;
  /** Context explaining where the saved note will be used. */
  description: string;
  /** The caller-owned text value. */
  value: string;
  /** Optional input hint; defaults to an order-instruction example. */
  placeholder?: string;
  /** Optional confirmation label; defaults to "Save note". */
  saveLabel?: string;
  /** Updates the caller-owned note text as the user types. */
  onChangeText: (text: string) => void;
  /** Closes the dialog without applying a new action. */
  onDismiss: () => void;
  /** Confirms the caller-owned value. */
  onSave: () => void;
}

/**
 * Modal text-entry primitive for collecting a note or profile value.
 * @param props Dialog content and caller-owned state handlers.
 * @returns A themed React Native modal containing a multiline note field.
 */
export function NoteDialog({
  visible,
  title,
  description,
  value,
  placeholder = "e.g. Sauce on the side",
  saveLabel = "Save note",
  onChangeText,
  onDismiss,
  onSave,
}: NoteDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={styles.description.color}
            style={styles.input}
            multiline
            autoFocus
          />
          <View style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={onDismiss}>
              <Text style={styles.cancelLabel}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.saveButton} onPress={onSave}>
              <Text style={styles.saveLabel}>{saveLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(31, 36, 38, 0.44)",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xl,
  },
  dialog: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii["2xl"],
    padding: theme.spacing.xl,
    gap: 12,
  },
  title: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.size.xl,
    color: theme.colors.textPrimary,
    fontWeight: "700",
  },
  description: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.size.sm,
    lineHeight: 19,
    color: theme.colors.icon,
  },
  input: {
    minHeight: 92,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.white,
    padding: 12,
    textAlignVertical: "top",
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.size.md,
    color: theme.colors.textPrimary,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  cancelButton: {
    height: 40,
    borderRadius: theme.radii.lg,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  cancelLabel: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textPrimary,
  },
  saveButton: {
    height: 40,
    borderRadius: theme.radii.lg,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
  },
  saveLabel: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textOnPrimary,
  },
}));
