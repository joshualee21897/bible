import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { InfoSheet } from '../../../components/garden/InfoSheet';
import { GardenItemSprite } from '../../../components/pixel/GardenItemSprite';
import { buttonBase, COLORS, FONTS, HARD_SHADOW } from '../../../components/theme';
import { showAlert } from '../../../lib/alert';
import { useAuth } from '../../../lib/auth-context';
import { buyGardenItem, getDropsSummary, getGroupItemCounts, type DropsSummary } from '../../../lib/drops';
import { getErrorMessage } from '../../../lib/error-message';
import { GARDEN_ITEMS, isItemAvailableThisMonth, type GardenItem, type GardenItemKind } from '../../../lib/garden-items';
import { useGroup } from '../../../lib/group-context';
import { useLambMessage } from '../../../lib/lamb-overlay-context';
import { getVerseText } from '../../../lib/verse-lookup';

type CategoryFilter = 'all' | GardenItemKind;

const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all: 'All',
  animal: 'Animals',
  plant: 'Plants',
  decoration: 'Decor',
};

const CARD_TINTS = ['#EFF8EC', '#FFF2F2', '#F7F1FF', '#FFFAE8', '#EFFAFF'];

function tintForItem(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return CARD_TINTS[hash % CARD_TINTS.length];
}

function buttonLabel(item: GardenItem, isOwned: boolean, balance: number): string {
  if (isOwned) return 'In our garden ✓';
  if (balance < item.price) return `Need ${item.price - balance} more 💧`;
  return 'Buy';
}

export default function ShopScreen() {
  const { group } = useGroup();
  const { session } = useAuth();
  const { width: windowWidth } = useWindowDimensions();

  const [drops, setDrops] = useState<DropsSummary | null>(null);
  const [owned, setOwned] = useState<Record<string, number>>({});
  const [buying, setBuying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [hideOwned, setHideOwned] = useState(false);
  const [detailItem, setDetailItem] = useState<GardenItem | null>(null);

  useLambMessage({ id: 'shop', message: 'Each gift has a verse — pick one for our garden!', pose: 'happy' });

  const contentWidth = Math.min(windowWidth, 600);
  const numColumns = contentWidth >= 420 ? 3 : 2;

  const load = useCallback(async () => {
    if (!group) return;
    try {
      const [summary, ownedCounts] = await Promise.all([getDropsSummary(), getGroupItemCounts(group.id)]);
      setDrops(summary);
      setOwned(ownedCounts);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [group]);

  useEffect(() => {
    load();
  }, [load]);

  const items = useMemo(() => {
    const filtered = GARDEN_ITEMS.filter((item) => {
      if (!isItemAvailableThisMonth(item)) return false;
      if (categoryFilter !== 'all' && item.kind !== categoryFilter) return false;
      const isOwned = (owned[item.key] ?? 0) > 0;
      if (hideOwned && isOwned) return false;
      return true;
    });
    // Owned items sort to the end, otherwise catalog order is kept.
    return [...filtered].sort((a, b) => {
      const aOwned = (owned[a.key] ?? 0) > 0 ? 1 : 0;
      const bOwned = (owned[b.key] ?? 0) > 0 ? 1 : 0;
      return aOwned - bOwned;
    });
  }, [categoryFilter, hideOwned, owned]);

  async function handleBuy(itemKey: string, price: number) {
    if (!group || !session || !drops) return;
    if (drops.balance < price) {
      showAlert('Not enough drops', 'You need more drops to buy this. Keep reading to earn more!');
      return;
    }

    setBuying(true);
    try {
      await buyGardenItem(group.id, session.user.id, itemKey);
      await load();
    } catch (error) {
      showAlert('Something went wrong', getErrorMessage(error));
    } finally {
      setBuying(false);
    }
  }

  if (!group || (loading && !errorMessage)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (errorMessage && !drops) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{errorMessage}</Text>
        <Pressable style={styles.buyButton} onPress={load}>
          <Text style={styles.buyButtonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (!drops) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const detailOwnedCount = detailItem ? (owned[detailItem.key] ?? 0) : 0;
  const detailVerseText = detailItem?.verse ? getVerseText(detailItem.verse) : null;
  const detailCanAfford = detailItem ? drops.balance >= detailItem.price : false;

  return (
    <View style={styles.outer}>
      <View style={[styles.container, { maxWidth: 600 }]}>
        <View style={styles.header}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.title}>Garden shop</Text>
          </View>
          <View style={styles.balanceBadge}>
            <Text style={styles.balanceText}>💧 {drops.balance}</Text>
          </View>
        </View>

        <View style={styles.filtersRow}>
          <View style={styles.segmented}>
            {(['all', 'animal', 'plant', 'decoration'] as CategoryFilter[]).map((filter) => (
              <Pressable
                key={filter}
                style={[styles.segment, categoryFilter === filter && styles.segmentSelected]}
                onPress={() => setCategoryFilter(filter)}
              >
                <Text style={[styles.segmentText, categoryFilter === filter && styles.segmentTextSelected]}>
                  {CATEGORY_LABELS[filter]}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.hideOwnedRow}>
            <Text style={styles.hideOwnedLabel}>Hide owned</Text>
            <Switch
              value={hideOwned}
              onValueChange={setHideOwned}
              trackColor={{ false: COLORS.cream, true: COLORS.sage }}
            />
          </View>
        </View>

        {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

        <FlatList
          key={numColumns}
          data={items}
          keyExtractor={(item) => item.key}
          numColumns={numColumns}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No items match these filters.</Text>}
          renderItem={({ item }) => {
            const ownedCount = owned[item.key] ?? 0;
            const isOwned = ownedCount > 0;
            const label = buttonLabel(item, isOwned, drops.balance);
            const canAfford = drops.balance >= item.price;
            return (
              <Pressable
                style={[styles.card, { backgroundColor: tintForItem(item.key) }]}
                onPress={() => setDetailItem(item)}
              >
                {isOwned && (
                  <View style={styles.ownedBadge}>
                    <Text style={styles.ownedBadgeGlyph}>{ownedCount > 1 ? `×${ownedCount}` : '✓'}</Text>
                  </View>
                )}
                <View style={styles.itemSpriteBox}>
                  <GardenItemSprite itemKey={item.key} pixelSize={3} />
                </View>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.name}
                </Text>
                {item.verse && (
                  <Text style={styles.itemVerse} numberOfLines={1}>
                    {item.verse}
                  </Text>
                )}
                <View style={styles.priceTag}>
                  <Text style={styles.priceTagText}>💧 {item.price}</Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    isOwned ? styles.statusPillOwned : canAfford ? styles.statusPillBuy : styles.statusPillNeed,
                  ]}
                >
                  <Text style={styles.statusPillText}>{label}</Text>
                </View>
              </Pressable>
            );
          }}
        />
      </View>

      <InfoSheet
        visible={detailItem !== null}
        title={detailItem?.name ?? ''}
        onClose={() => setDetailItem(null)}
      >
        {detailItem && (
          <>
            <View style={styles.detailSpriteBox}>
              <GardenItemSprite itemKey={detailItem.key} pixelSize={5} />
            </View>
            {detailVerseText && <Text style={styles.detailVerseText}>"{detailVerseText}"</Text>}
            {detailItem.verse && <Text style={styles.detailVerseRef}>{detailItem.verse}</Text>}
            {detailOwnedCount > 0 && (
              <Text style={styles.detailOwnedNote}>
                Already in our garden{detailOwnedCount > 1 ? ` ×${detailOwnedCount}` : ''} ✓
              </Text>
            )}
            <View style={styles.detailPriceRow}>
              <Text style={styles.detailPriceText}>💧 {detailItem.price}</Text>
              <Text style={styles.detailBalanceText}>your balance: 💧 {drops.balance}</Text>
            </View>
            <Pressable
              style={[styles.sheetBuyButton, (!detailCanAfford || buying) && styles.buyButtonDisabled]}
              onPress={() => handleBuy(detailItem.key, detailItem.price)}
              disabled={!detailCanAfford || buying}
            >
              <Text style={styles.buyButtonText}>
                {buying ? 'Buying…' : detailCanAfford ? (detailOwnedCount > 0 ? 'Buy another' : 'Buy') : `Need ${detailItem.price - drops.balance} more 💧`}
              </Text>
            </Pressable>
          </>
        )}
      </InfoSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    padding: 16,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  error: {
    color: COLORS.error,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  headerTextBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
  },
  balanceBadge: {
    ...HARD_SHADOW,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.water,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  balanceText: {
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.textPrimary,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  segmented: {
    flex: 1,
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 10,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  segmentSelected: {
    backgroundColor: COLORS.sage,
  },
  segmentText: {
    fontFamily: FONTS.headingMedium,
    color: COLORS.textPrimary,
    fontSize: 11,
  },
  segmentTextSelected: {
    fontFamily: FONTS.headingSemiBold,
  },
  hideOwnedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hideOwnedLabel: {
    fontFamily: FONTS.headingMedium,
    fontSize: 10,
    color: COLORS.textMuted,
  },
  list: {
    gap: 10,
    paddingTop: 4,
    paddingBottom: 16,
  },
  row: {
    gap: 10,
  },
  empty: {
    textAlign: 'center',
    fontFamily: FONTS.serif,
    color: COLORS.textMuted,
    marginTop: 40,
  },
  card: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 10,
    position: 'relative',
    ...HARD_SHADOW,
  },
  itemSpriteBox: {
    width: 72,
    height: 72,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  ownedBadge: {
    position: 'absolute',
    top: -8,
    right: -6,
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 4,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  ownedBadgeGlyph: {
    fontSize: 11,
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.textPrimary,
  },
  itemName: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 12,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  itemVerse: {
    fontFamily: FONTS.serifItalic,
    color: COLORS.textMuted,
    fontSize: 10,
    textAlign: 'center',
  },
  priceTag: {
    marginTop: 2,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
    backgroundColor: COLORS.water,
  },
  priceTagText: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 11,
    color: COLORS.textPrimary,
  },
  statusPill: {
    marginTop: 4,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    width: '100%',
    alignItems: 'center',
  },
  statusPillBuy: {
    backgroundColor: COLORS.sage,
  },
  statusPillNeed: {
    backgroundColor: COLORS.cream,
  },
  statusPillOwned: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  statusPillText: {
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.textPrimary,
    fontSize: 10,
    textAlign: 'center',
  },
  buyButton: {
    ...buttonBase,
    backgroundColor: COLORS.sage,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginTop: 4,
  },
  buyButtonDisabled: {
    backgroundColor: COLORS.cream,
    opacity: 0.6,
  },
  buyButtonText: {
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  detailSpriteBox: {
    alignSelf: 'center',
    width: 140,
    height: 140,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailVerseText: {
    marginTop: 12,
    fontFamily: FONTS.serifItalic,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  detailVerseRef: {
    marginTop: 4,
    fontFamily: FONTS.headingMedium,
    fontSize: 12,
    color: COLORS.sageDark,
    textAlign: 'center',
  },
  detailOwnedNote: {
    marginTop: 8,
    fontFamily: FONTS.serif,
    fontSize: 12,
    color: COLORS.success,
    textAlign: 'center',
  },
  detailPriceRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  detailPriceText: {
    fontFamily: FONTS.heading,
    fontSize: 20,
    color: COLORS.textPrimary,
  },
  detailBalanceText: {
    fontFamily: FONTS.serif,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  sheetBuyButton: {
    ...buttonBase,
    marginTop: 10,
    backgroundColor: COLORS.sage,
    paddingVertical: 14,
    alignItems: 'center',
  },
});
