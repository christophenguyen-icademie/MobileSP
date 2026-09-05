import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { PSE_DATA } from "@/constants/pseData";
import type { BlocPse } from "@/types/pse";
import { ouvrirPdfPse } from "@/utils/psePdf";

function Bloc({ bloc, mobileWeb }: { bloc: BlocPse; mobileWeb: boolean }) {
  if (bloc.type === "paragraphe") {
    return <Text style={[styles.paragraphe, mobileWeb && styles.paragrapheMobile]}>{bloc.texte}</Text>;
  }
  return (
    <View style={styles.liste}>
      {bloc.elements.map((element, index) => (
        <View key={`${index}-${element.texte}`} style={[styles.puce, element.niveau === 2 && styles.sousPuce]}>
          <Text style={[styles.marqueur, mobileWeb && styles.marqueurMobile]}>{element.niveau === 2 ? "◦" : "•"}</Text>
          <Text style={[styles.textePuce, mobileWeb && styles.textePuceMobile]}>{element.texte}</Text>
        </View>
      ))}
    </View>
  );
}

export default function FichePse() {
  const { width } = useWindowDimensions();
  const mobileWeb = Platform.OS === "web" && width <= 600;
  const params = useLocalSearchParams<{ reference?: string | string[] }>();
  const router = useRouter();
  const reference = Array.isArray(params.reference) ? params.reference[0] : params.reference;
  const fiche = reference ? PSE_DATA[reference] : undefined;
  const [chargementPdf, setChargementPdf] = useState(false);

  if (!fiche) {
    return (
      <SafeAreaView style={styles.erreur}>
        <Stack.Screen options={{ title: "Fiche PSE" }} />
        <Ionicons name="alert-circle-outline" size={44} color="#8d2631" />
        <Text style={styles.erreurTitre}>Fiche introuvable</Text>
        <Pressable onPress={() => router.back()}><Text style={styles.retour}>Retour à l’annuaire</Text></Pressable>
      </SafeAreaView>
    );
  }

  const ouvrirPdf = async () => {
    setChargementPdf(true);
    try {
      await ouvrirPdfPse(fiche.nom);
    } catch {
      Alert.alert("Ouverture impossible", "Aucun lecteur PDF compatible n’a pu ouvrir la fiche originale.");
    } finally {
      setChargementPdf(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: fiche.nom }} />
      <ScrollView contentContainerStyle={styles.contenu}>
        <View style={styles.page}>
          <View style={styles.entete}>
          <Text style={[styles.chapitrePrincipal, mobileWeb && styles.chapitrePrincipalMobile]}>{fiche.chapitre_principal}</Text>
          <Text style={[styles.reference, mobileWeb && styles.referenceMobile]}>{fiche.nom}</Text>
          <Text style={[styles.titre, mobileWeb && styles.titreMobile]}>{fiche.titre}</Text>
          <View style={styles.badges}>
            {fiche.niveaux.map((niveau) => <View key={niveau} style={styles.badge}><Text style={styles.badgeTexte}>{niveau}</Text></View>)}
            {fiche.niveaux.length === 0 && <View style={styles.badgeOptionnel}><Text style={styles.badgeOptionnelTexte}>Complémentaire</Text></View>}
          </View>
          </View>

          {fiche.chapitres.map((chapitre, index) => (
            <View key={`${index}-${chapitre.titre}`} style={[styles.section, mobileWeb && styles.sectionMobile]}>
              <Text style={[styles.sectionTitre, mobileWeb && styles.sectionTitreMobile]}>{chapitre.titre}</Text>
              {chapitre.contenu.map((bloc, blocIndex) => <Bloc key={blocIndex} bloc={bloc} mobileWeb={mobileWeb} />)}
            </View>
          ))}

          {fiche.notes.length > 0 && (
            <View style={styles.notes}>
              <Text style={styles.notesTitre}>Notes</Text>
              {fiche.notes.map((note, index) => <Text key={`${index}-${note}`} style={[styles.note, mobileWeb && styles.noteMobile]}>{note}</Text>)}
            </View>
          )}

          {fiche.nom === "01AC01" && (
            <Pressable
              style={styles.animation}
              onPress={() => router.push({ pathname: "/animation-pse", params: { reference: fiche.nom } })}
            >
              <Ionicons name="cube-outline" size={20} color="#fff" />
              <Text style={styles.animationTexte}>Voir la démonstration 3D</Text>
            </Pressable>
          )}

          <Pressable style={styles.pdf} onPress={ouvrirPdf} disabled={chargementPdf}>
            {chargementPdf ? <ActivityIndicator color="#1f176a" /> : <Ionicons name="document-text-outline" size={21} color="#1f176a" />}
            <Text style={styles.pdfTexte}>Ouvrir le PDF original</Text>
            <Ionicons name="open-outline" size={18} color="#1f176a" />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#f5f5f8", flex: 1 },
  contenu: { paddingBottom: 38 },
  page: { alignSelf: "center", maxWidth: 900, width: "100%" },
  entete: { backgroundColor: "#1f176a", paddingHorizontal: 20, paddingVertical: 24 },
  chapitrePrincipal: { color: "#c9c5ee", fontSize: 13, fontWeight: "600", textTransform: "uppercase" },
  chapitrePrincipalMobile: { fontSize: 15, lineHeight: 21 },
  reference: { color: "#fff", fontSize: 14, fontWeight: "800", marginTop: 12 },
  referenceMobile: { fontSize: 17 },
  titre: { color: "#fff", flexShrink: 1, fontSize: 27, fontWeight: "800", lineHeight: 33, marginTop: 4 },
  titreMobile: { fontSize: 31, lineHeight: 38 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 15 },
  badge: { backgroundColor: "#d9f2e6", borderRadius: 6, paddingHorizontal: 9, paddingVertical: 4 },
  badgeTexte: { color: "#176b49", fontSize: 12, fontWeight: "800" },
  badgeOptionnel: { backgroundColor: "#e6e4ed", borderRadius: 6, paddingHorizontal: 9, paddingVertical: 4 },
  badgeOptionnelTexte: { color: "#5f5b6d", fontSize: 12, fontWeight: "700" },
  section: { backgroundColor: "#fff", borderColor: "#e4e2ea", borderRadius: 13, borderWidth: 1, marginHorizontal: 14, marginTop: 13, padding: 17 },
  sectionMobile: { marginHorizontal: 8, marginTop: 10, paddingHorizontal: 15, paddingVertical: 18 },
  sectionTitre: { color: "#1f176a", fontSize: 20, fontWeight: "800", marginBottom: 9 },
  sectionTitreMobile: { fontSize: 24, lineHeight: 30, marginBottom: 13 },
  paragraphe: { color: "#34313e", fontSize: 16, lineHeight: 24, marginBottom: 10 },
  paragrapheMobile: { fontSize: 19, lineHeight: 29, marginBottom: 15 },
  liste: { marginBottom: 8 },
  puce: { alignItems: "flex-start", flexDirection: "row", marginBottom: 8 },
  sousPuce: { marginLeft: 22 },
  marqueur: { color: "#1f176a", fontSize: 19, fontWeight: "800", lineHeight: 23, width: 20 },
  marqueurMobile: { fontSize: 22, lineHeight: 29, width: 23 },
  textePuce: { color: "#34313e", flex: 1, fontSize: 16, lineHeight: 23 },
  textePuceMobile: { fontSize: 19, lineHeight: 29, minWidth: 0 },
  notes: { borderTopColor: "#d8d5e1", borderTopWidth: 1, marginHorizontal: 18, marginTop: 22, paddingTop: 14 },
  notesTitre: { color: "#514d61", fontSize: 15, fontWeight: "800", marginBottom: 6 },
  note: { color: "#6e6a78", fontSize: 13, lineHeight: 19, marginBottom: 5 },
  noteMobile: { fontSize: 16, lineHeight: 24, marginBottom: 9 },
  animation: { alignItems: "center", backgroundColor: "#1f176a", borderRadius: 12, flexDirection: "row", gap: 9, justifyContent: "center", marginHorizontal: 18, marginTop: 20, paddingVertical: 14 },
  animationTexte: { color: "#fff", fontSize: 15, fontWeight: "700" },
  pdf: { alignItems: "center", backgroundColor: "#fff", borderColor: "#1f176a", borderRadius: 12, borderWidth: 1, flexDirection: "row", flexWrap: "wrap", gap: 9, justifyContent: "center", marginHorizontal: 18, marginTop: 12, paddingHorizontal: 12, paddingVertical: 14 },
  pdfTexte: { color: "#1f176a", flexShrink: 1, fontSize: 15, fontWeight: "700", textAlign: "center" },
  erreur: { alignItems: "center", flex: 1, justifyContent: "center", padding: 24 },
  erreurTitre: { color: "#352f3e", fontSize: 21, fontWeight: "800", marginTop: 10 },
  retour: { color: "#1f176a", fontSize: 16, fontWeight: "700", marginTop: 18 },
});
