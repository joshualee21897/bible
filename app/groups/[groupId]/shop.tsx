import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { GardenItemSprite } from '../../../components/pixel/GardenItemSprite';
import { useAuth } from '../../../lib/auth-context';
import { buyGardenItem, getDropsSummary, getOwnedItemKeys, type DropsSummary } from '../../../lib/drops';
import { GARDEN_ITEMS } from '../../../lib/garden-items';
import { useGroup } from '../../../lib/group-context';

export default function ShopScreen() {
  const { group } = useGroup();
  const { session } = useAuth();

  const [drops, setDrops] = useState<DropsSummary | null>(null);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [buyingKey, setBuyingKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!group) return;
    const [summary, ownedKeys] = await Promise.all([getDropsSummary(group.id), getOwnedItemKeys(group.id)]);
    setDrops(summary);
    setOwned(ownedKeys);
    setLoading(false);
  }, [group]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleBuy(itemKey: string, price: number) {
    if (!group || !session || !drops) return;
    if (drops.balance < price) {
      Alert.alert('Not enough drops', "Your group needs more drops to buy this. Keep reading to earn more!");
      return;
    }

    setBuyingKey(itemKey);
    try {
      await buyGardenItem(group.id, session.user.id, itemKey);
      await load();
    } catch (error) {
      Alert.alert('Something went wrong', error instanceof Error ? error.message : String(error));
    } finally {
      setBuyingKey(null);
    }
  }

  if (!group || loading || !drops) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.balance}>💧 {drops.balance} drops</Text>
      <FlatList
        data={GARDEN_ITEMS}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isOwned = owned.has(item.key);
          const canAfford = drops.balance >= item.price;
          return (
            <View style={styles.card}>
              <GardenItemSprite itemKey={item.key} pixelSize={3} />
              <View style={styles.cardInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                {isOwned && item.verse && <Text style={styles.verse}>{item.verse}</Text>}
                {!isOwned && <Text style={styles.price}>{item.price} drops</Text>}
              </View>
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
    backgroundColor: '#fff',
    padding: 16,
  },
  center: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balance: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  list: {
    gap: 10,
    paddingBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 10,
    padding: 10,
  },
  cardInfo: {
    flex: 1,
  },
  itemName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  verse: {
    color: '#4E8A32',
    marginTop: 2,
  },
  price: {
    color: '#666',
    marginTop: 2,
  },
  ownedLabel: {
    color: '#4E8A32',
    fontWeight: '600',
  },
  buyButton: {
    backgroundColor: '#111',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  buyButtonDisabled: {
    backgroundColor: '#ccc',
  },
  buyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
