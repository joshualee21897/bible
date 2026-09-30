import { Redirect, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { buttonBase, COLORS } from '../components/theme';
import { useAuth } from '../lib/auth-context';
import { listMyGroups, type MyGroup } from '../lib/groups';
import { getMyProfile } from '../lib/profile';

export default function MyGroupsScreen() {
  const { session, loading: authLoading } = useAuth();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [groups, setGroups] = useState<MyGroup[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const profile = await getMyProfile();
      if (!profile) {
        setNeedsProfile(true);
        return;
      }
      const myGroups = await listMyGroups();
      setGroups(myGroups);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setCheckingProfile(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (session) load();
  }, [session, load]);

  if (authLoading || (session && checkingProfile)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  if (needsProfile) {
    return <Redirect href="/setup-profile" />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Flock</Text>
        <Pressable onPress={() => router.push('/profile')}>
          <Text style={styles.link}>Profile</Text>
        </Pressable>
      </View>

      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

      <FlatList
        data={groups ?? []}
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
          <Text style={styles.empty}>You're not in any groups yet. Create one or join with an invite code.</Text>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.groupCard} onPress={() => router.push(`/groups/${item.id}`)}>
            <Text style={styles.groupName}>{item.name}</Text>
            <Text style={styles.groupBook}>Reading {item.book}</Text>
          </Pressable>
        )}
      />

      <View style={styles.actions}>
        <Pressable style={styles.button} onPress={() => router.push('/create-group')}>
          <Text style={styles.buttonText}>Create group</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.buttonSecondary]} onPress={() => router.push('/join-group')}>
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Join group</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  link: {
    color: COLORS.accentText,
    fontWeight: '600',
  },
  error: {
    color: COLORS.error,
    marginBottom: 8,
  },
  list: {
    flexGrow: 1,
    gap: 10,
    paddingBottom: 16,
  },
  empty: {
    textAlign: 'center',
    color: COLORS.textMuted,
    marginTop: 40,
  },
  groupCard: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 14,
    backgroundColor: COLORS.surface,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  groupBook: {
    color: COLORS.textMuted,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 16,
  },
  button: {
    ...buttonBase,
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: COLORS.surfaceAccent,
  },
  buttonText: {
    color: COLORS.primaryText,
    fontWeight: 'bold',
  },
  buttonTextSecondary: {
    color: COLORS.accentText,
  },
});
