import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { COLORS } from '../components/theme';

export default function IndexGate() {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator />
      <Redirect href="/today" />
    </View>
  );
}
