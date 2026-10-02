import { Redirect, useLocalSearchParams } from 'expo-router';

export default function GroupIndexRedirect() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  return <Redirect href={`/groups/${groupId}/bible`} />;
}
