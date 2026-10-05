import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';

import { AVATAR_COLORS } from '../components/pixel/palette';
import { InfoSheet } from '../components/garden/InfoSheet';
import { buttonBase, COLORS, FONTS } from '../components/theme';
import { showAlert } from '../lib/alert';
import { useAuth } from '../lib/auth-context';
import { getMyDashboard, type MyDashboard } from '../lib/dashboard';
import { getDropsSummary, type DropsSummary } from '../lib/drops';
import { getErrorMessage } from '../lib/error-message';
import { leaveGroup, type MyGroup } from '../lib/groups';
import { getMyProfile, updateMyProfile } from '../lib/profile';
import { supabase } from '../lib/supabase';

function memberSince(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function ProfileScreen() {
  const { session } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [avatarColor, setAvatarColor] = useState<string>(AVATAR_COLORS[0]);
  const [memberSinceDate, setMemberSinceDate] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<MyDashboard | null>(null);
  const [drops, setDrops] = useState<DropsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [leaveTarget, setLeaveTarget] = useState<MyGroup | null>(null);
  const [leaveText, setLeaveText] = useState('');
  const [leaving, setLeaving] = useState(false);

  const load = useCallback(async () => {
    const [profile, myDashboard, dropsSummary] = await Promise.all([getMyProfile(), getMyDashboard(), getDropsSummary()]);
    if (profile) {
      setDisplayName(profile.display_name);
      setAvatarColor(profile.avatar_color);
      setMemberSinceDate(profile.created_at);
    }
    setDashboard(myDashboard);
    setDrops(dropsSummary);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    const trimmed = displayName.trim();
    if (!trimmed) {
      showAlert('Add your name', 'Your group will see this name on your check-ins.');
      return;
    }

    setSaving(true);
    try {
      await updateMyProfile(trimmed, avatarColor);
      router.back();
    } catch (error) {
      showAlert('Something went wrong', getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/sign-in');
  }

  async function handleInviteFriend() {
    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://sprout.app';
    try {
      await Share.share({
        message: `Come read the Bible together with me on Sprout! ${appUrl}`,
      });
    } catch {
      // The user cancelled the share sheet — nothing to do.
    }
  }

  async function handleLeaveGroup() {
    if (!leaveTarget) return;
    if (leaveText.trim().toLowerCase() !== leaveTarget.name.trim().toLowerCase()) return;

    setLeaving(true);
    try {
      await leaveGroup(leaveTarget.id);
      setLeaveTarget(null);
      setLeaveText('');
      await load();
    } catch (error) {
      showAlert('Something went wrong', getErrorMessage(error));
    } finally {
      setLeaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.email}>{session?.user.email}</Text>

      <Text style={styles.label}>Your name</Text>
      <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} />

      <Text style={styles.label}>Your color</Text>
      <View style={styles.swatchRow}>
        {AVATAR_COLORS.map((color) => (
          <Pressable
            key={color}
            onPress={() => setAvatarColor(color)}
            style={[styles.swatch, { backgroundColor: color }, avatarColor === color && styles.swatchSelected]}
          />
        ))}
      </View>

      <Pressable style={styles.button} onPress={handleSave} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Saving…' : 'Save'}</Text>
      </Pressable>

      <Pressable style={styles.inviteButton} onPress={handleInviteFriend}>
        <Text style={styles.inviteButtonText}>💌 Invite a friend</Text>
      </Pressable>

      {dashboard && drops && (
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Your stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statTile}>
              <Text style={styles.statValue}>{dashboard.totalCheckins}</Text>
              <Text style={styles.statLabel}>Chapters read</Text>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.statValue}>💧 {drops.earned}</Text>
              <Text style={styles.statLabel}>Drops earned</Text>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.statValue}>{dashboard.groups.length}</Text>
              <Text style={styles.statLabel}>Groups joined</Text>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.statValue}>{memberSinceDate ? memberSince(memberSinceDate) : '—'}</Text>
              <Text style={styles.statLabel}>Member since</Text>
            </View>
          </View>
        </View>
      )}

      {dashboard && (
        <View style={styles.groupsCard}>
          <Text style={styles.sectionTitle}>My groups</Text>
          {dashboard.groups.length === 0 ? (
            <Text style={styles.noGroups}>You're not in any groups yet.</Text>
          ) : (
            dashboard.groups.map(({ group }) => (
              <View key={group.id} style={styles.groupRow}>
                <Pressable style={styles.groupRowInfo} onPress={() => router.push(`/groups/${group.id}/bible`)}>
                  <Text style={styles.groupName} numberOfLines={1}>
                    {group.name}
                  </Text>
                  <Text style={styles.groupBook} numberOfLines={1}>
                    {group.book}
                  </Text>
                </Pressable>
                <Pressable onPress={() => setLeaveTarget(group)} hitSlop={8}>
                  <Text style={styles.leaveLink}>Leave</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>
      )}

      <Pressable onPress={handleSignOut}>
        <Text style={styles.signOut}>Sign out</Text>
      </Pressable>

      <InfoSheet
        visible={leaveTarget !== null}
        title="Leave this group"
        onClose={() => {
          setLeaveTarget(null);
          setLeaveText('');
        }}
      >
        {leaveTarget && (
          <>
            <Text style={styles.leaveBody}>
              You'll need a new invite code to rejoin. To confirm, type the group's name:{' '}
              <Text style={styles.leaveGroupName}>{leaveTarget.name}</Text>
            </Text>
            <TextInput
              style={styles.leaveInput}
              value={leaveText}
              onChangeText={setLeaveText}
              placeholder={leaveTarget.name}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              style={[
                styles.leaveButton,
                (leaveText.trim().toLowerCase() !== leaveTarget.name.trim().toLowerCase() || leaving) &&
                  styles.leaveButtonDisabled,
              ]}
              onPress={handleLeaveGroup}
              disabled={leaveText.trim().toLowerCase() !== leaveTarget.name.trim().toLowerCase() || leaving}
            >
              <Text style={styles.leaveButtonText}>{leaving ? 'Leaving…' : `Leave ${leaveTarget.name}`}</Text>
            </Pressable>
          </>
        )}
      </InfoSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 24,
    paddingTop: 60,
    paddingBottom: 60,
    gap: 6,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  email: {
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  label: {
    fontWeight: '600',
    marginTop: 12,
    color: COLORS.textPrimary,
  },
  input: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: COLORS.surface,
    color: COLORS.textPrimary,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchSelected: {
    borderColor: COLORS.border,
  },
  button: {
    ...buttonBase,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: COLORS.primaryText,
    fontWeight: 'bold',
  },
  inviteButton: {
    ...buttonBase,
    backgroundColor: COLORS.water,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  inviteButtonText: {
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.textPrimary,
  },
  sectionTitle: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 13,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  statsCard: {
    ...buttonBase,
    backgroundColor: COLORS.white,
    padding: 14,
    marginTop: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statTile: {
    width: '47%',
  },
  statValue: {
    fontFamily: FONTS.heading,
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  groupsCard: {
    ...buttonBase,
    backgroundColor: COLORS.white,
    padding: 14,
    marginTop: 16,
  },
  noGroups: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE6DA',
  },
  groupRowInfo: {
    flex: 1,
  },
  groupName: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  groupBook: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  leaveLink: {
    fontSize: 12,
    color: COLORS.error,
    fontFamily: FONTS.headingMedium,
  },
  signOut: {
    marginTop: 20,
    color: COLORS.textMuted,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  leaveBody: {
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  leaveGroupName: {
    fontFamily: FONTS.headingSemiBold,
  },
  leaveInput: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: COLORS.white,
    color: COLORS.textPrimary,
  },
  leaveButton: {
    ...buttonBase,
    backgroundColor: COLORS.error,
    paddingVertical: 12,
    alignItems: 'center',
  },
  leaveButtonDisabled: {
    opacity: 0.5,
  },
  leaveButtonText: {
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.white,
  },
});
