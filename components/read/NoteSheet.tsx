import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { buttonBase, COLORS, FONTS } from '../theme';

type Props = {
  visible: boolean;
  verseLabel: string;
  initialNote: string;
  saving: boolean;
  onClose: () => void;
  onSave: (note: string) => void;
};

export function NoteSheet({ visible, verseLabel, initialNote, saving, onClose, onSave }: Props) {
  const [text, setText] = useState(initialNote);

  useEffect(() => {
    if (visible) setText(initialNote);
  }, [visible, initialNote]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.title}>Note on {verseLabel}</Text>
        <TextInput
          style={styles.input}
          placeholder="What stood out to you here?"
          placeholderTextColor={COLORS.textMuted}
          multiline
          value={text}
          onChangeText={setText}
          autoFocus
        />
        <Pressable style={styles.saveButton} onPress={() => onSave(text)} disabled={saving}>
          <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save note'}</Text>
        </Pressable>
        <Pressable onPress={onClose} disabled={saving}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(74, 63, 53, 0.4)',
  },
  sheet: {
    borderTopWidth: 2,
    borderColor: COLORS.border,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: COLORS.cream,
    padding: 20,
    paddingBottom: 32,
    gap: 12,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  input: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    minHeight: 90,
    textAlignVertical: 'top',
    backgroundColor: COLORS.white,
    fontFamily: FONTS.serif,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  saveButton: {
    ...buttonBase,
    backgroundColor: COLORS.sage,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.textPrimary,
  },
  cancelText: {
    textAlign: 'center',
    fontFamily: FONTS.headingMedium,
    color: COLORS.textMuted,
  },
});
