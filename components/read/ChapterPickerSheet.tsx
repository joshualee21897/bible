import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { COLORS, FONTS } from '../theme';

type Props = {
  visible: boolean;
  book: string;
  maxChapter: number;
  selectedChapter: number;
  onClose: () => void;
  onSelect: (chapter: number) => void;
};

export function ChapterPickerSheet({ visible, book, maxChapter, selectedChapter, onClose, onSelect }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>{book}</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={styles.closeGlyph}>×</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.grid}>
          {Array.from({ length: maxChapter }, (_, index) => index + 1).map((c) => {
            const selected = c === selectedChapter;
            return (
              <Pressable
                key={c}
                style={[styles.cell, selected && styles.cellSelected]}
                onPress={() => onSelect(c)}
              >
                <Text style={[styles.cellText, selected && styles.cellTextSelected]}>{c}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
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
    maxHeight: '75%',
    borderTopWidth: 2,
    borderColor: COLORS.border,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: COLORS.cream,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  closeGlyph: {
    fontSize: 20,
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 16,
  },
  cell: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.white,
  },
  cellSelected: {
    backgroundColor: COLORS.lavender,
  },
  cellText: {
    fontFamily: FONTS.headingMedium,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  cellTextSelected: {
    fontFamily: FONTS.headingSemiBold,
  },
});
