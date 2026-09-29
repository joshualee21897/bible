import { StyleSheet, Text, View } from 'react-native';

export default function MyGroupsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Flock</Text>
      <Text>Your groups will show up here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
