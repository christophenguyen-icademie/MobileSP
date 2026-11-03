import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function Logigrammes() {
  return (
    <View style={styles.ecran}>
      <Stack.Screen options={{ title: 'Logigrammes' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: '#fff' },
});
