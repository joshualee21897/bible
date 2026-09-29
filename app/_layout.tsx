import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '../lib/auth-context';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="create-group" options={{ headerShown: true, title: 'Create group' }} />
        <Stack.Screen name="join-group" options={{ headerShown: true, title: 'Join group' }} />
        <Stack.Screen name="profile" options={{ headerShown: true, title: 'Profile' }} />
      </Stack>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
