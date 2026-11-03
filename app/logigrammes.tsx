import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import PourTouteIntervention from '@/components/Logigrammes/PourTouteIntervention';

export default function Logigrammes() {
  const [parcoursOuvert, setParcoursOuvert] = useState(false);

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.ecran}>
      <Stack.Screen options={{ title: 'Logigrammes' }} />
      {parcoursOuvert ? (
        <PourTouteIntervention onQuitter={() => setParcoursOuvert(false)} />
      ) : (
        <ScrollView contentContainerStyle={styles.defilement}>
          <View style={styles.contenu}>
            <Text accessibilityRole="header" style={styles.titre}>Logigrammes</Text>
            <Text style={styles.description}>Choisissez un parcours pour suivre ses étapes.</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setParcoursOuvert(true)}
              style={({ pressed }) => [styles.carte, pressed && styles.presse]}
            >
              <Ionicons name="git-branch-outline" size={32} color="#1f176a" />
              <View style={styles.libelle}>
                <Text style={styles.nom}>Pour toute intervention</Text>
                <Text style={styles.description}>PSE1 · PSE2 · Les quatre regards, la prise en charge et la surveillance</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#1f176a" />
            </Pressable>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: '#f5f5f8' },
  defilement: { flexGrow: 1, alignItems: 'center', padding: 20 },
  contenu: { width: '100%', maxWidth: 820, gap: 16 },
  titre: { color: '#1f176a', fontSize: 26, fontWeight: '800', marginTop: 8 },
  description: { color: '#5e5a70', fontSize: 16, lineHeight: 24 },
  carte: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#fff', borderColor: '#dcd9e8', borderWidth: 1, borderRadius: 16, padding: 20, marginTop: 8 },
  presse: { backgroundColor: '#eeecfa' },
  libelle: { flex: 1, gap: 8 },
  nom: { color: '#1f176a', fontSize: 20, fontWeight: '700' },
});
