import { GeistPixel_400Regular } from '@expo-google-fonts/geist-pixel';
import {
  Literata_400Regular,
  Literata_400Regular_Italic,
  Literata_500Medium,
  Literata_600SemiBold,
} from '@expo-google-fonts/literata';
import {
  Inter_400Regular,
  Inter_400Regular_Italic,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { PatrickHand_400Regular } from '@expo-google-fonts/patrick-hand';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View } from 'react-native';

import { AuthProvider } from '../lib/auth-context';
import { COLORS } from '../components/theme';
import { LambGuideProvider } from '../components/guide/guide-context';
import { ArtStyleProvider } from '../lib/art-style-context';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    GeistPixel_400Regular,
    Literata_400Regular,
    Literata_500Medium,
    Literata_600SemiBold,
    Literata_400Regular_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_400Regular_Italic,
    PatrickHand_400Regular,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ArtStyleProvider>
      <AuthProvider>
        <LambGuideProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="create-group" options={{ headerShown: true, title: 'Create group' }} />
            <Stack.Screen name="join-group" options={{ headerShown: true, title: 'Join group' }} />
            <Stack.Screen name="profile" options={{ headerShown: true, title: 'Profile' }} />
            <Stack.Screen name="highlights" options={{ headerShown: true, title: 'My highlights' }} />
            <Stack.Screen name="compare-styles" options={{ headerShown: true, title: 'Compare styles' }} />
          </Stack>
          <StatusBar style="auto" />
        </LambGuideProvider>
      </AuthProvider>
    </ArtStyleProvider>
  );
}
