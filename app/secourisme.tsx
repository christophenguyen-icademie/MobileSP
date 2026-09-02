import { Ionicons } from "@expo/vector-icons";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import { Stack } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Linking, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";

import fichesJson from "@/assets/pse/fiches/Références techniques nationales - PSE - Fiches/fiches.json";
import { PSE_ASSETS } from "@/constants/pseAssets";

type Niveau = "PSE 1" | "PSE 2";
type Filtre = "Tous" | Niveau;
type Fiche = { nom: string; titre: string; niveaux: Niveau[]; chapitre: string; fichier: string };
type Chapitre = { nom: string; numero: string; fiches: Fiche[] };

const fiches = fichesJson as Fiche[];
const filtres: Filtre[] = ["Tous", "PSE 1", "PSE 2"];
const normaliser = (texte: string) => texte.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export default function Secourisme() {
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState<Filtre>("Tous");
  const [ouverts, setOuverts] = useState<Set<string>>(new Set());
  const [chargement, setChargement] = useState<string | null>(null);

  const chapitres = useMemo<Chapitre[]>(() => {
    const terme = normaliser(recherche.trim());
    const groupes = new Map<string, Fiche[]>();
    fiches.forEach((fiche) => {
      const niveauOk = filtre === "Tous" || fiche.niveaux.includes(filtre);
      const texteOk = !terme || normaliser(`${fiche.nom} ${fiche.titre} ${fiche.chapitre}`).includes(terme);
      if (!niveauOk || !texteOk) return;
      const groupe = groupes.get(fiche.chapitre) ?? [];
      groupe.push(fiche);
      groupes.set(fiche.chapitre, groupe);
    });
    return [...groupes].map(([nom, fichesDuChapitre]) => ({
      nom,
      numero: fichesDuChapitre[0].nom.slice(0, 2),
      fiches: fichesDuChapitre,
    }));
  }, [filtre, recherche]);

  const basculerChapitre = (chapitre: string) => {
    setOuverts((actuels) => {
      const suivants = new Set(actuels);
      if (suivants.has(chapitre)) suivants.delete(chapitre);
      else suivants.add(chapitre);
      return suivants;
    });
  };

  const ouvrirPdf = async (fiche: Fiche) => {
    const modulePdf = PSE_ASSETS[fiche.nom];
    if (!modulePdf) return Alert.alert("Fichier introuvable", `Le PDF ${fiche.fichier} n’est pas indexé.`);
    setChargement(fiche.nom);
    try {
      const asset = Asset.fromModule(modulePdf);
      await asset.downloadAsync();
      let uri = asset.localUri ?? asset.uri;
      if (Platform.OS === "android" && uri.startsWith("file://")) uri = await FileSystem.getContentUriAsync(uri);
      await Linking.openURL(uri);
    } catch {
      Alert.alert("Ouverture impossible", "Aucun lecteur PDF compatible n’a pu ouvrir cette fiche.");
    } finally {
      setChargement(null);
    }
  };

  const rechercheActive = recherche.trim().length > 0;
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Recommandations PSE" }} />
      <View style={styles.entete}>
        <Text style={styles.titre}>Annuaire des fiches PSE</Text>
        <Text style={styles.sousTitre}>198 fiches classées par chapitre</Text>
        <View style={styles.recherche}>
          <Ionicons name="search" size={20} color="#615f76" />
          <TextInput value={recherche} onChangeText={setRecherche} placeholder="Rechercher une fiche, un code…" placeholderTextColor="#858398" style={styles.champ} returnKeyType="search" />
          {recherche.length > 0 && <Pressable onPress={() => setRecherche("")} hitSlop={10}><Ionicons name="close-circle" size={20} color="#858398" /></Pressable>}
        </View>
        <View style={styles.filtres}>
          {filtres.map((valeur) => (
            <Pressable key={valeur} onPress={() => setFiltre(valeur)} style={[styles.filtre, filtre === valeur && styles.filtreActif]}>
              <Text style={[styles.texteFiltre, filtre === valeur && styles.texteFiltreActif]}>{valeur}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={chapitres}
        keyExtractor={(chapitre) => chapitre.nom}
        contentContainerStyle={styles.liste}
        ListEmptyComponent={<Text style={styles.vide}>Aucune fiche ne correspond à la recherche.</Text>}
        renderItem={({ item: chapitre }) => {
          const estOuvert = rechercheActive || ouverts.has(chapitre.nom);
          return (
            <View style={styles.chapitre}>
              <Pressable style={styles.ligneChapitre} onPress={() => basculerChapitre(chapitre.nom)}>
                <View style={styles.numeroChapitre}><Text style={styles.numeroTexte}>{chapitre.numero}</Text></View>
                <View style={styles.libelleChapitre}>
                  <Text style={styles.nomChapitre}>{chapitre.nom}</Text>
                  <Text style={styles.compteur}>{chapitre.fiches.length} fiche(s)</Text>
                </View>
                <Ionicons name={estOuvert ? "chevron-up" : "chevron-down"} size={22} color="#1f176a" />
              </Pressable>
              {estOuvert && chapitre.fiches.map((fiche) => (
                <Pressable key={fiche.nom} onPress={() => ouvrirPdf(fiche)} style={({ pressed }) => [styles.ligneFiche, pressed && styles.fichePressee]}>
                  <View style={styles.branche} />
                  <View style={styles.contenuFiche}>
                    <View style={styles.metaFiche}>
                      <Text style={styles.code}>{fiche.nom}</Text>
                      {fiche.niveaux.map((niveau) => <View key={niveau} style={styles.badge}><Text style={styles.badgeTexte}>{niveau}</Text></View>)}
                      {fiche.niveaux.length === 0 && <Text style={styles.optionnelle}>Complémentaire</Text>}
                    </View>
                    <Text style={styles.titreFiche}>{fiche.titre}</Text>
                  </View>
                  {chargement === fiche.nom ? <ActivityIndicator color="#1f176a" /> : <Ionicons name="document-text-outline" size={23} color="#1f176a" />}
                </Pressable>
              ))}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f8" },
  entete: { backgroundColor: "#fff", paddingHorizontal: 18, paddingTop: 14, paddingBottom: 12 },
  titre: { color: "#1f176a", fontSize: 24, fontWeight: "800" },
  sousTitre: { color: "#6e6b80", fontSize: 14, marginTop: 3, marginBottom: 14 },
  recherche: { alignItems: "center", backgroundColor: "#f1f0f5", borderRadius: 12, flexDirection: "row", paddingHorizontal: 12 },
  champ: { color: "#242132", flex: 1, fontSize: 16, paddingHorizontal: 9, paddingVertical: 11 },
  filtres: { flexDirection: "row", gap: 8, marginTop: 12 },
  filtre: { borderColor: "#d4d1e2", borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 7 },
  filtreActif: { backgroundColor: "#1f176a", borderColor: "#1f176a" },
  texteFiltre: { color: "#504d64", fontSize: 14, fontWeight: "600" },
  texteFiltreActif: { color: "#fff" },
  liste: { padding: 14, paddingBottom: 30 },
  chapitre: { backgroundColor: "#fff", borderColor: "#e2e0e9", borderRadius: 14, borderWidth: 1, marginBottom: 10, overflow: "hidden" },
  ligneChapitre: { alignItems: "center", flexDirection: "row", minHeight: 72, padding: 12 },
  numeroChapitre: { alignItems: "center", backgroundColor: "#eceaf7", borderRadius: 10, height: 42, justifyContent: "center", width: 42 },
  numeroTexte: { color: "#1f176a", fontSize: 15, fontWeight: "800" },
  libelleChapitre: { flex: 1, paddingHorizontal: 12 },
  nomChapitre: { color: "#262238", fontSize: 16, fontWeight: "700" },
  compteur: { color: "#777487", fontSize: 13, marginTop: 3 },
  ligneFiche: { alignItems: "center", borderTopColor: "#eceaf0", borderTopWidth: 1, flexDirection: "row", marginLeft: 22, minHeight: 78, paddingHorizontal: 14, paddingVertical: 10 },
  fichePressee: { backgroundColor: "#f3f2fa" },
  branche: { backgroundColor: "#c7c3dc", height: 1, marginRight: 10, width: 13 },
  contenuFiche: { flex: 1, paddingRight: 8 },
  metaFiche: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 6 },
  code: { color: "#1f176a", fontSize: 13, fontWeight: "800" },
  badge: { backgroundColor: "#e8f3ee", borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  badgeTexte: { color: "#176b49", fontSize: 11, fontWeight: "700" },
  optionnelle: { color: "#817d8e", fontSize: 11, fontStyle: "italic" },
  titreFiche: { color: "#302d3d", fontSize: 15, lineHeight: 20, marginTop: 4 },
  vide: { color: "#716e80", paddingTop: 50, textAlign: "center" },
});
