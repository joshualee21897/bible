import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { LambGuide } from '../../../components/guide/LambGuide';
import { GardenItemSprite } from '../../../components/pixel/GardenItemSprite';
import { buttonBase, COLORS, FONTS, HARD_SHADOW } from '../../../components/theme';
import { showAlert } from '../../../lib/alert';
import { useAuth } from '../../../lib/auth-context';
import { buyGardenItem, getDropsSummary, getOwnedItemKeys, type DropsSummary } from '../../../lib/drops';
import { getErrorMessage } from '../../../lib/error-message';
import { GARDEN_ITEMS, type GardenItemKind } from '../../../lib/garden-items';
import { useGroup } from '../../../lib/group-context';

type CategoryFilter = 'all' | GardenItemKind;
type OwnedFilter = 'all' | 'owned' | 'unowned';

const CARD_TINTS = ['#EFF8EC', '#FFF2F2', '#F7F1FF', '#FFFAE8', '#EFFAFF'];

function tintForItem(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return CARD_TINTS[hash % CARD_TINTS.length];
}

export default function ShopScreen() {
  const { group } = useGroup();
  const { session } = useAuth();

  const [drops, setDrops] = useState<DropsSummary | null>(null);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [buyingKey, setBuyingKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [ownedFilter, setOwnedFilter] = useState<OwnedFilter>('all');

  const load = useCallback(async () => {
    if (!group) return;
    try {
      const [summary, ownedKeys] = await Promise.all([getDropsSummary(), getOwnedItemKeys(group.id)]);
      setDrops(summary);
      setOwned(ownedKeys);
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
    return GARDEN_ITEMS.filter((item) => {
      if (categoryFilter !== 'all' && item.kind !== categoryFilter) return false;
      const isOwned = owned.has(item.key);
      if (ownedFilter === 'owned' && !isOwned) return false;
      if (ownedFilter === 'unowned' && isOwned) return false;
      return true;
    });
  }, [categoryFilter, ownedFilter, owned]);

  async function handleBuy(itemKey: string, price: number) {
    if (!group || !session || !drops) return;
    if (drops.balance < price) {
      showAlert('Not enough drops', 'You need more drops to buy this. Keep reading to earn more!');
      return;
    }

    setBuyingKey(itemKey);
    try {
      await buyGardenItem(group.id, session.user.id, itemKey);
      await load();
    } catch (error) {
      showAlert('Something went wrong', getErrorMessage(error));
    } finally {
      setBuyingKey(null);
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Garden shop</Text>
          <Text style={styles.subtitle}>Little gifts for our shared space.</Text>
        </View>
        <View style={styles.balanceBadge}>
          <Text style={styles.balanceText}>💧 {drops.balance}</Text>
        </View>
      </View>

      <LambGuide
        id="shop"
        message={[
          'Spend your drops on gifts for this garden. Each one has a verse.',
          'Your reading — in any group — fills your own drop balance.',
          'Each gift comes with a little piece of scripture.',
        ]}
        pose="happy"
        style={styles.lambGuide}
      />

      <View style={styles.shopNote}>
        <Text style={styles.shopNoteText}>▤ These are your drops — spend them on any group's garden.</Text>
      </View>

      <View style={styles.filterRow}>
        {(['all', 'animal', 'decoration'] as CategoryFilter[]).map((filter) => (
          <Pressable
            key={filter}
            style={[styles.filterChip, categoryFilter === filter && styles.filterChipSelected]}
            onPress={() => setCategoryFilter(filter)}
          >
            <Text style={[styles.filterChipText, categoryFilter === filter && styles.filterChipTextSelected]}>
              {filter === 'all' ? 'All' : filter === 'animal' ? 'Animals' : 'Decorations'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.filterRow}>
        {(['all', 'unowned', 'owned'] as OwnedFilter[]).map((filter) => (
          <Pressable
            key={filter}
            style={[styles.filterChip, ownedFilter === filter && styles.filterChipSelected]}
            onPress={() => setOwnedFilter(filter)}
          >
            <Text style={[styles.filterChipText, ownedFilter === filter && styles.filterChipTextSelected]}>
              {filter === 'all' ? 'All' : filter === 'owned' ? 'Owned' : 'Unowned'}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.key}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No items match these filters.</Text>}
        renderItem={({ item }) => {
          const isOwned = owned.has(item.key);
          const canAfford = drops.balance >= item.price;
          return (
            <View style={[styles.card, { backgroundColor: tintForItem(item.key) }]}>
              {isOwned && (
                <View style={styles.ownedCheck}>
                  <Text style={styles.ownedCheckGlyph}>✓</Text>
                </View>
              )}
              <View style={styles.itemSpriteBox}>
                <GardenItemSprite itemKey={item.key} pixelSize={2.4} />
              </View>
              <Text style={styles.itemName}>{item.name}</Text>
              {isOwned && item.verse && <Text style={styles.verse}>{item.verse}</Text>}
              {!isOwned && <Text style={styles.price}>{item.price} drops</Text>}
              {isOwned ? (
                <Text style={styles.ownedLabel}>In our garden</Text>
              ) : (
                <Pressable
                  style={[styles.buyButton, !canAfford && styles.buyButtonDisabled]}
                  onPress={() => handleBuy(item.key, item.price)}
                  disabled={!canAfford || buyingKey === item.key}
                >
                  <Text style={styles.buyButtonText}>{buyingKey === item.key ? 'Buying…' : 'Buy'}</Text>
                </Pressable>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  lambGuide: {
    marginBottom: 12,
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
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
  },
  subtitle: {
    marginTop: 2,
    fontFamily: FONTS.serif,
    fontSize: 12,
    color: COLORS.textMuted,
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
  shopNote: {
    marginBottom: 12,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderColor: COLORS.sageDark,
    borderStyle: 'dashed',
    borderRadius: 6,
    backgroundColor: '#EDF8FA',
  },
  shopNoteText: {
    fontFamily: FONTS.serif,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  filterChip: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
  },
  filterChipSelected: {
    backgroundColor: COLORS.sage,
  },
  filterChipText: {
    fontFamily: FONTS.headingMedium,
    color: COLORS.textPrimary,
    fontSize: 12,
  },
  filterChipTextSelected: {
    color: COLORS.textPrimary,
  },
  list: {
    gap: 10,
    paddingTop: 8,
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
    padding: 12,
    position: 'relative',
    ...HARD_SHADOW,
  },
  itemSpriteBox: {
    width: 56,
    height: 48,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 6,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  ownedCheck: {
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
  ownedCheckGlyph: {
    fontSize: 11,
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.textPrimary,
  },
  itemName: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 13,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  verse: {
    fontFamily: FONTS.serif,
    color: COLORS.success,
    fontSize: 11,
    textAlign: 'center',
  },
  price: {
    fontFamily: FONTS.serif,
    color: COLORS.textMuted,
    fontSize: 12,
  },
  ownedLabel: {
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.success,
    fontSize: 11,
    marginTop: 4,
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
    fontSize: 12,
  },
});
