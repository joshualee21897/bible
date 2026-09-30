import { Alert, Platform } from 'react-native';

// React Native Web's Alert.alert() is a no-op — it silently does nothing.
// This falls back to a real browser alert on web so errors are never silent.
export function showAlert(title: string, message?: string) {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}
