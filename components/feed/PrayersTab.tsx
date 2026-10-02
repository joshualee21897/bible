import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { LambGuide } from '../guide/LambGuide';
import { buttonBase, COLORS, FONTS } from '../theme';
import { showAlert } from '../../lib/alert';
import { useAuth } from '../../lib/auth-context';
import { getErrorMessage } from '../../lib/error-message';
import { createPrayer, getGroupPrayers, markPrayerAnswered, type PrayerWithProfile } from '../../lib/prayers';
import { addReaction, getReactionsFor, removeReaction } from '../../lib/reactions';
import { timeAgo } from '../../lib/time-ago';
import { NewPrayerSheet } from './NewPrayerSheet';

export function PrayersTab({ groupId }: { groupId: string }) {
  const { session } = useAuth();
  const [prayers, setPrayers] = useState<PrayerWithProfile[] | null>(null);
  const [prayingCounts, setPrayingCounts] = useState<Record<string, number>>({});
  const [myPrayingFor, setMyPrayingFor] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const items = await getGroupPrayers(groupId);
      setPrayers(items);
      const reactions = await getReactionsFor(
        'prayer',
        items.map((item) => item.id)
      );
      setPrayingCounts(reactions.counts);
      setMyPrayingFor(reactions.mine);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setRefreshing(false);
    }
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleShare(text: string, showName: boolean) {
    setSubmitting(true);
    try {
      await createPrayer({ groupId, text, showName });
      setSheetVisible(false);
      await load();
    } catch (error) {
      showAlert('Something went wrong', getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function togglePraying(prayerId: string) {
    const already = myPrayingFor.has(prayerId);

    setMyPrayingFor((prev) => {
      const next = new Set(prev);
      if (already) next.delete(prayerId);
      else next.add(prayerId);
      return next;
    });
    setPrayingCounts((prev) => ({ ...prev, [prayerId]: (prev[prayerId] ?? 0) + (already ? -1 : 1) }));

    try {
      if (already) {
        await removeReaction('prayer', prayerId);
      } else {
        await addReaction('prayer', prayerId);
      }
    } catch {
      setMyPrayingFor((prev) => {
        const next = new Set(prev);
        if (already) next.add(prayerId);
        else next.delete(prayerId);
        return next;
      });
      setPrayingCounts((prev) => ({ ...prev, [prayerId]: (prev[prayerId] ?? 0) + (already ? 1 : -1) }));
    }
  }

  async function handleMarkAnswered(prayerId: string) {
    try {
      await markPrayerAnswered(prayerId);
      setPrayers((prev) => prev?.map((p) => (p.id === prayerId ? { ...p, answered: true } : p)) ?? prev);
    } catch (error) {
      showAlert('Something went wrong', getErrorMessage(error));
    }
  }

  if (prayers === null && !errorMessage) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LambGuide
        id="feed-prayers"
        message="Share what's on your heart. We'll pray together."
        pose="praying"
        style={styles.lambGuide}
      />

      <View style={styles.note}>
        <Text style={styles.noteText}>Prayers stay within this group.</Text>
      </View>

      <Pressable style={styles.shareButton} onPress={() => setSheetVisible(true)}>
        <Text style={styles.shareButtonText}>+ Share a prayer request</Text>
      </Pressable>

      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

      <FlatList
        data={prayers ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No prayer requests yet. Share what's on your heart.</Text>
        }
        renderItem={({ item }) => {
          const isMine = item.user_id === session?.user.id;
          const praying = myPrayingFor.has(item.id);
          const prayingCount = prayingCounts[item.id] ?? 0;
          const name = item.show_name ? (item.profiles?.display_name ?? 'Someone') : 'Someone';
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
              </View>
              <Text style={styles.prayerText}>{item.text}</Text>
              <View style={styles.cardFooter}>
                <Pressable
                  style={[styles.prayingButton, praying && styles.prayingButtonActive]}
                  onPress={() => togglePraying(item.id)}
                >
                  <Text style={[styles.prayingText, praying && styles.prayingTextActive]}>
                    Praying for you{prayingCount > 0 ? ` · ${prayingCount}` : ''}
                  </Text>
                </Pressable>
                {item.answered && (
                  <View style={styles.answeredTag}>
                    <Text style={styles.answeredTagText}>Answered 🙌</Text>
                  </View>
                )}
                {isMine && !item.answered && (
                  <Pressable onPress={() => handleMarkAnswered(item.id)}>
                    <Text style={styles.markAnsweredLink}>Mark as answered</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        }}
      />

      <NewPrayerSheet visible={sheetVisible} submitting={submitting} onClose={() => setSheetVisible(false)} onSubmit={handleShare} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  lambGuide: {
    marginBottom: 12,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  note: {
    marginBottom: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderColor: COLORS.sageDark,
    borderStyle: 'dashed',
    borderRadius: 6,
    backgroundColor: '#EDF8E9',
  },
  noteText: {
    fontFamily: FONTS.serif,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  shareButton: {
    ...buttonBase,
    backgroundColor: COLORS.lavender,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  shareButtonText: {
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.textPrimary,
  },
  error: {
    color: COLORS.error,
    marginBottom: 8,
  },
  list: {
    gap: 12,
    paddingBottom: 16,
  },
  empty: {
    textAlign: 'center',
    fontFamily: FONTS.serif,
    color: COLORS.textMuted,
    marginTop: 40,
  },
  card: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    gap: 8,
    backgroundColor: COLORS.white,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  name: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  time: {
    fontFamily: FONTS.serif,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  prayerText: {
    fontFamily: FONTS.serif,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textPrimary,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  prayingButton: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
  },
  prayingButtonActive: {
    backgroundColor: COLORS.lavender,
  },
  prayingText: {
    fontFamily: FONTS.headingMedium,
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  prayingTextActive: {
    fontFamily: FONTS.headingSemiBold,
  },
  answeredTag: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: COLORS.yellow,
  },
  answeredTagText: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 11,
    color: COLORS.textPrimary,
  },
  markAnsweredLink: {
    fontFamily: FONTS.headingMedium,
    fontSize: 12,
    color: COLORS.textMuted,
    textDecorationLine: 'underline',
  },
});
