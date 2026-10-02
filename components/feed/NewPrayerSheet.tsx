import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { buttonBase, COLORS, FONTS } from '../theme';

type Props = {
  visible: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (text: string, showName: boolean) => void;
};

export function NewPrayerSheet({ visible, submitting, onClose, onSubmit }: Props) {
  const [text, setText] = useState('');
  const [showName, setShowName] = useState(true);

  useEffect(() => {
    if (visible) {
      setText('');
      setShowName(true);
    }
  }, [visible]);

  function handleShare() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed, showName);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.title}>Share a prayer request</Text>
        <TextInput
          style={styles.input}
          placeholder="What's on your heart?"
          placeholderTextColor={COLORS.textMuted}
          multiline
          value={text}
          onChangeText={setText}
          autoFocus
        />
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Show my name</Text>
          <Switch
            value={showName}
            onValueChange={setShowName}
            trackColor={{ true: COLORS.sage, false: COLORS.cream }}
            thumbColor={COLORS.white}
          />
        </View>
        <Pressable
          style={[styles.shareButton, (!text.trim() || submitting) && styles.shareButtonDisabled]}
          onPress={handleShare}
          disabled={submitting || !text.trim()}
        >
          <Text style={styles.shareButtonText}>{submitting ? 'Sharing…' : 'Share with group'}</Text>
        </Pressable>
        <Pressable onPress={onClose} disabled={submitting}>
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
    fontSize: 18,
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
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    fontFamily: FONTS.headingMedium,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  shareButton: {
    ...buttonBase,
    backgroundColor: COLORS.sage,
    paddingVertical: 14,
    alignItems: 'center',
  },
  shareButtonDisabled: {
    opacity: 0.6,
  },
  shareButtonText: {
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.textPrimary,
  },
  cancelText: {
    textAlign: 'center',
    fontFamily: FONTS.headingMedium,
    color: COLORS.textMuted,
  },
});
