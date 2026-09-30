import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { GardenItemSprite } from '../../../components/pixel/GardenItemSprite';
import { buttonBase, COLORS } from '../../../components/theme';
import { showAlert } from '../../../lib/alert';
import { useAuth } from '../../../lib/auth-context';
import { buyGardenItem, getDropsSummary, getOwnedItemKeys, type DropsSummary } from '../../../lib/drops';
import { getErrorMessage } from '../../../lib/error-message';
import { GARDEN_ITEMS, type GardenItemKind } from '../../../lib/garden-items';
import { useGroup } from '../../../lib/group-context';

type CategoryFilter = 'all' | GardenItemKind;
type OwnedFilter = 'all' | 'owned' | 'unowned';

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
      const [summary, ownedKeys] = await Promise.all([getDropsSummary(group.id), getOwnedItemKeys(group.id)]);
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
      showAlert('Not enough drops', "Your group needs more drops to buy this. Keep reading to earn more!");
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
        <Text style={styles.title}>Shop</Text>
        <View style={styles.balanceBadge}>
          <Text style={styles.balanceText}>💧 {drops.balance}</Text>
        </View>
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
            <View style={styles.card}>
              <GardenItemSprite itemKey={item.key} pixelSize={3} />
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
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  balanceBadge: {
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  balanceText: {
    fontWeight: 'bold',
    color: COLORS.textPrimary,
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
    backgroundColor: COLORS.surface,
  },
  filterChipSelected: {
    backgroundColor: COLORS.accent,
  },
  filterChipText: {
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  filterChipTextSelected: {
    color: COLORS.accentText,
    fontWeight: 'bold',
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
    backgroundColor: COLORS.surface,
  },
  itemName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  verse: {
    color: COLORS.success,
    fontSize: 12,
    textAlign: 'center',
  },
  price: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  ownedLabel: {
    color: COLORS.success,
    fontWeight: '600',
    fontSize: 12,
    marginTop: 4,
  },
  buyButton: {
    ...buttonBase,
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginTop: 4,
  },
  buyButtonDisabled: {
    backgroundColor: COLORS.surfaceAccent,
    opacity: 0.6,
  },
  buyButtonText: {
    color: COLORS.primaryText,
    fontWeight: 'bold',
    fontSize: 13,
  },
});
