import { GeistPixel_400Regular } from '@expo-google-fonts/geist-pixel';
import {
  Inter_400Regular,
  Inter_400Regular_Italic,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View } from 'react-native';

import { AuthProvider } from '../lib/auth-context';
import { COLORS } from '../components/theme';
import { LambGuideProvider } from '../components/guide/guide-context';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    GeistPixel_400Regular,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_400Regular_Italic,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <AuthProvider>
      <LambGuideProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="create-group" options={{ headerShown: true, title: 'Create group' }} />
          <Stack.Screen name="join-group" options={{ headerShown: true, title: 'Join group' }} />
          <Stack.Screen name="profile" options={{ headerShown: true, title: 'Profile' }} />
          <Stack.Screen name="highlights" options={{ headerShown: true, title: 'My highlights' }} />
        </Stack>
        <StatusBar style="auto" />
      </LambGuideProvider>
    </AuthProvider>
  );
}
