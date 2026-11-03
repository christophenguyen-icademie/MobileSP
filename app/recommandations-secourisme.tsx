import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const rubriques = [
  { titre: 'Références Techniques Nationales', icone: 'book-outline', route: '/secourisme' },
  { titre: 'Justifications des modifications', icone: 'play-circle-outline', route: '/justifications-modifications' },
  { titre: 'Logigrammes', icone: 'git-branch-outline', route: '/logigrammes' },
] as const;

export default function RecommandationsSecourisme() {
  const router = useRouter();

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.ecran}>
      <Stack.Screen options={{ title: 'Recommandations secourisme' }} />
      <ScrollView contentContainerStyle={styles.defilement}>
        <View style={styles.contenu}>
          <Text accessibilityRole="header" style={styles.titre}>Recommandations secourisme</Text>
          <Text style={styles.sousTitre}>Choisissez une rubrique.</Text>
          {rubriques.map((rubrique) => (
            <Pressable
              key={rubrique.route}
              accessibilityRole="button"
              accessibilityLabel={rubrique.titre}
              onPress={() => router.push(rubrique.route)}
              style={({ pressed }) => [styles.bouton, pressed && styles.boutonPresse]}
            >
              <View style={styles.icone}>
                <Ionicons name={rubrique.icone} size={30} color="#1f176a" />
              </View>
              <Text style={styles.libelle}>{rubrique.titre}</Text>
              <Ionicons name="chevron-forward" size={22} color="#1f176a" />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: '#f5f5f8' },
  defilement: { flexGrow: 1, alignItems: 'center', padding: 20 },
  contenu: { width: '100%', maxWidth: 820, gap: 16 },
  titre: { color: '#1f176a', fontSize: 26, fontWeight: '800', marginTop: 8 },
  sousTitre: { color: '#6e6b80', fontSize: 16, marginBottom: 8 },
  bouton: { alignItems: 'center', backgroundColor: '#fff', borderColor: '#dcd9e8', borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 16, minHeight: 100, padding: 18 },
  boutonPresse: { backgroundColor: '#eeecfa' },
  icone: { alignItems: 'center', backgroundColor: '#eeedf9', borderRadius: 14, height: 56, justifyContent: 'center', width: 56 },
  libelle: { color: '#1f176a', flex: 1, fontSize: 18, fontWeight: '700' },
});
