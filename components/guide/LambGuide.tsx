import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Lamb } from '../pixel/Lamb';
import type { LambMood } from '../pixel/lamb-sprites';
import { COLORS, FONTS, HARD_SHADOW } from '../theme';
import { useLambGuideSeen } from './guide-context';
import { Sparkles } from './Sparkles';

type LambGuideAction = {
  label: string;
  onPress: () => void;
  primary?: boolean;
};

type Props = {
  /** Unique per place this guide appears, e.g. "today", "feed-prayers". */
  id: string;
  message: string;
  pose?: LambMood;
  /** Which side the lamb sits on relative to its speech bubble. */
  align?: 'left' | 'right';
  sparkles?: boolean;
  actions?: LambGuideAction[];
  style?: StyleProp<ViewStyle>;
};

export function LambGuide({ id, message, pose = 'happy', align = 'left', sparkles = false, actions, style }: Props) {
  const { markSeen, hasSeen } = useLambGuideSeen();
  const [isFirstVisit] = useState(() => !hasSeen(id));
  const [open, setOpen] = useState(true);

  useEffect(() => {
    markSeen(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={[styles.row, align === 'right' && styles.rowReverse, style]}>
      <Pressable onPress={() => setOpen((current) => !current)} style={styles.lambWrap} hitSlop={6}>
        <Lamb mood={pose} pixelSize={2} />
        {sparkles && open && <Sparkles />}
      </Pressable>

      {open && (
        <View style={styles.bubbleWrap}>
          <View style={[styles.tail, align === 'right' ? styles.tailRight : styles.tailLeft]} />
          <View style={styles.bubble}>
            <Pressable style={styles.closeButton} onPress={() => setOpen(false)} hitSlop={8}>
              <Text style={styles.closeGlyph}>×</Text>
            </Pressable>
            <Text style={styles.message} numberOfLines={2}>
              {message}
            </Text>
            {isFirstVisit && <Text style={styles.hint}>Tap me anytime</Text>}
            {actions && actions.length > 0 && (
              <View style={styles.actionsRow}>
                {actions.map((action) => (
                  <Pressable
                    key={action.label}
                    style={[styles.actionButton, action.primary && styles.actionButtonPrimary]}
                    onPress={action.onPress}
                  >
                    <Text style={[styles.actionText, action.primary && styles.actionTextPrimary]}>
                      {action.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  lambWrap: {
    paddingTop: 2,
  },
  bubbleWrap: {
    flex: 1,
    position: 'relative',
  },
  tail: {
    position: 'absolute',
    top: 12,
    width: 14,
    height: 14,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.border,
    transform: [{ rotate: '45deg' }],
  },
  tailLeft: {
    left: -6,
  },
  tailRight: {
    right: -6,
  },
  bubble: {
    ...HARD_SHADOW,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    paddingHorizontal: 12,
    paddingRight: 26,
  },
  closeButton: {
    position: 'absolute',
    top: 4,
    right: 6,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeGlyph: {
    fontSize: 15,
    lineHeight: 15,
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.textMuted,
  },
  message: {
    fontFamily: FONTS.headingMedium,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textPrimary,
  },
  hint: {
    marginTop: 4,
    fontFamily: FONTS.serifItalic,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionButton: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: COLORS.cream,
  },
  actionButtonPrimary: {
    backgroundColor: COLORS.sage,
  },
  actionText: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  actionTextPrimary: {
    color: COLORS.textPrimary,
  },
});
