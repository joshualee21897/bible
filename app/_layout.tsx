import {
  PixelifySans_400Regular,
  PixelifySans_500Medium,
  PixelifySans_600SemiBold,
  PixelifySans_700Bold,
} from '@expo-google-fonts/pixelify-sans';
import {
  Literata_400Regular,
  Literata_400Regular_Italic,
  Literata_500Medium,
  Literata_600SemiBold,
} from '@expo-google-fonts/literata';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View } from 'react-native';

import { AuthProvider } from '../lib/auth-context';
import { COLORS } from '../components/theme';
import { LambGuideProvider } from '../components/guide/guide-context';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PixelifySans_400Regular,
    PixelifySans_500Medium,
    PixelifySans_600SemiBold,
    PixelifySans_700Bold,
    Literata_400Regular,
    Literata_500Medium,
    Literata_600SemiBold,
    Literata_400Regular_Italic,
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
        </Stack>
        <StatusBar style="auto" />
      </LambGuideProvider>
    </AuthProvider>
  );
}
