import { StyleSheet, Text, View } from 'react-native';

import { COLORS, FONTS } from '../theme';
import type { CheckinKind } from '../../lib/checkins';

export const KIND_OPTIONS: { key: CheckinKind; label: string; placeholder: string }[] = [
  { key: 'reflection', label: 'Reflection', placeholder: 'What stood out to you today?' },
  { key: 'revelation', label: 'Revelation', placeholder: 'What did God show you?' },
  { key: 'action', label: 'Action', placeholder: 'What will you do because of this?' },
];

const KIND_TAG_STYLES: Record<CheckinKind, { bg: string; text: string }> = {
  reflection: { bg: '#E8F2E3', text: COLORS.sageDark },
  revelation: { bg: '#F1ECFB', text: '#7A5FBF' },
  action: { bg: '#FFF6DD', text: '#A6790C' },
};

export function kindLabel(kind: CheckinKind): string {
  return KIND_OPTIONS.find((o) => o.key === kind)?.label ?? 'Reflection';
}

export function KindTag({ kind }: { kind: CheckinKind }) {
  const style = KIND_TAG_STYLES[kind];
  return (
    <View style={[styles.tag, { backgroundColor: style.bg }]}>
      <Text style={[styles.text, { color: style.text }]}>{kindLabel(kind)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  text: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 10,
  },
});
