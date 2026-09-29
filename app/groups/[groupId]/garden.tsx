import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Lamb } from '../../../components/pixel/Lamb';
import { Tree } from '../../../components/pixel/Tree';
import { getGroupMembersWithCheckinCounts, type MemberWithStats } from '../../../lib/checkins';
import { useGroup } from '../../../lib/group-context';
import { getTreeStage, getTreeStageLabel } from '../../../lib/tree';

export default function GroupGardenScreen() {
  const { group } = useGroup();
  const [members, setMembers] = useState<MemberWithStats[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!group) return;
    try {
      const stats = await getGroupMembersWithCheckinCounts(group.id);
      setMembers(stats);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setRefreshing(false);
    }
  }, [group]);

  useEffect(() => {
    load();
  }, [load]);

  if (!group || members === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
        />
      }
    >
      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

      <View style={styles.lambRow}>
        <Lamb pixelSize={5} />
      </View>

      <View style={styles.grove}>
        {members.map((member) => {
          const stage = getTreeStage(member.checkin_count);
          return (
            <View key={member.user_id} style={styles.treeSlot}>
              <Tree stage={stage} pixelSize={4} />
              <Text style={styles.memberName}>{member.display_name}</Text>
              <Text style={styles.stageLabel}>{getTreeStageLabel(stage)}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#DFF0FF',
    flexGrow: 1,
  },
  center: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    color: '#C8403A',
    marginBottom: 8,
  },
  lambRow: {
    marginBottom: 12,
  },
  grove: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  treeSlot: {
    alignItems: 'center',
    width: 140,
  },
  memberName: {
    marginTop: 6,
    fontWeight: 'bold',
  },
  stageLabel: {
    color: '#555',
    fontSize: 12,
  },
});
