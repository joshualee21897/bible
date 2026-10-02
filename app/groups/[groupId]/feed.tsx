import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PrayersTab } from '../../../components/feed/PrayersTab';
import { ReflectionsTab } from '../../../components/feed/ReflectionsTab';
import { COLORS, FONTS } from '../../../components/theme';
import { useGroup } from '../../../lib/group-context';

type FeedTab = 'reflections' | 'prayers';

export default function GroupFeedScreen() {
  const { group } = useGroup();
  const [tab, setTab] = useState<FeedTab>('reflections');

  if (!group) return null;

  return (
    <View style={styles.container}>
      <View style={styles.toggleRow}>
        <Pressable
          style={[styles.toggle, tab === 'reflections' && styles.toggleActive]}
          onPress={() => setTab('reflections')}
        >
          <Text style={[styles.toggleText, tab === 'reflections' && styles.toggleTextActive]}>Reflections</Text>
        </Pressable>
        <Pressable style={[styles.toggle, tab === 'prayers' && styles.toggleActive]} onPress={() => setTab('prayers')}>
          <Text style={[styles.toggleText, tab === 'prayers' && styles.toggleTextActive]}>Prayers</Text>
        </Pressable>
      </View>

      {tab === 'reflections' ? <ReflectionsTab groupId={group.id} /> : <PrayersTab groupId={group.id} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  toggle: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  toggleActive: {
    backgroundColor: COLORS.cream,
  },
  toggleText: {
    fontFamily: FONTS.headingMedium,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  toggleTextActive: {
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.textPrimary,
  },
});
