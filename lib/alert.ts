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

// Same problem as above, but for confirmations — window.confirm() on web,
// a real two-button Alert on native.
export function confirmAction(message: string, confirmLabel = 'OK'): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(message));
  }
  return new Promise((resolve) => {
    Alert.alert('Are you sure?', message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
