import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BIBLE_BOOKS } from '../../lib/bible-books';
import { COLORS, FONTS } from '../theme';

type Props = {
  visible: boolean;
  selectedBook: string;
  onClose: () => void;
  onSelect: (book: string) => void;
};

export function BookPickerSheet({ visible, selectedBook, onClose, onSelect }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>Books</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={styles.closeGlyph}>×</Text>
          </Pressable>
        </View>
        <ScrollView style={styles.list}>
          {BIBLE_BOOKS.map((b) => {
            const selected = b.name === selectedBook;
            return (
              <Pressable
                key={b.name}
                style={[styles.row, selected && styles.rowSelected]}
                onPress={() => onSelect(b.name)}
              >
                <Text style={[styles.rowText, selected && styles.rowTextSelected]}>{b.name}</Text>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  list: {
    marginBottom: 12,
  },
  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE6DA',
  },
  rowSelected: {
    backgroundColor: COLORS.lavender,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  rowText: {
    fontFamily: FONTS.serif,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  rowTextSelected: {
    fontFamily: FONTS.serifSemiBold,
  },
});
