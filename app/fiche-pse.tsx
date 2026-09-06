import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, SafeAreaView, ScrollView, Share, StyleSheet, Text, useWindowDimensions, View, type StyleProp, type TextStyle } from "react-native";

import fichesJson from "@/assets/pse/fiches/Références techniques nationales - PSE - Fiches/fiches.json";
import { PSE_DATA } from "@/constants/pseData";
import type { BlocPse, FichePse as FichePseIndex } from "@/types/pse";
import { ouvrirPdfPse } from "@/utils/psePdf";

const fiches = fichesJson as FichePseIndex[];

function TexteRiche({ texte, recherche, notes, onNote, onFiche, style }: {
  texte: string; recherche: string; notes: string[]; onNote: (note: string) => void;
  onFiche: (reference: string) => void; style: StyleProp<TextStyle>;
}) {
  const terme = recherche.trim();
  const motifRecherche = terme ? terme.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "(?!)";
  const morceaux = texte.split(new RegExp(`(${motifRecherche}|\\(\\d+\\)|\\b\\d{2}(?:AC|PR|FT)\\d{2}\\b)`, "gi"));
  return <Text style={style}>{morceaux.map((morceau, index) => {
    const note = /^\((\d+)\)$/.exec(morceau);
    const reference = /^\d{2}(?:AC|PR|FT)\d{2}$/i.test(morceau) ? morceau.toUpperCase() : undefined;
    if (note) {
      const contenu = notes.find((item) => item.startsWith(`(${note[1]})`));
      return <Text key={index} style={styles.appelNote} onPress={() => contenu && onNote(contenu)}>{morceau}</Text>;
    }
    if (reference && PSE_DATA[reference]) return <Text key={index} style={styles.lienFiche} onPress={() => onFiche(reference)}>{morceau}</Text>;
    if (terme && morceau.toLocaleLowerCase().includes(terme.toLocaleLowerCase())) return <Text key={index} style={styles.surlignage}>{morceau}</Text>;
    return morceau;
  })}</Text>;
}

function Bloc({ bloc, mobileWeb, echelle, recherche, notes, onNote, onFiche }: {
  bloc: BlocPse; mobileWeb: boolean; echelle: number; recherche: string; notes: string[];
  onNote: (note: string) => void; onFiche: (reference: string) => void;
}) {
  const paragrapheStyle = [styles.paragraphe, mobileWeb && styles.paragrapheMobile, { fontSize: (mobileWeb ? 19 : 16) * echelle, lineHeight: (mobileWeb ? 29 : 24) * echelle }];
  const puceStyle = [styles.textePuce, mobileWeb && styles.textePuceMobile, { fontSize: (mobileWeb ? 19 : 16) * echelle, lineHeight: (mobileWeb ? 29 : 23) * echelle }];
  if (bloc.type === "paragraphe") {
    return <TexteRiche texte={bloc.texte} recherche={recherche} notes={notes} onNote={onNote} onFiche={onFiche} style={paragrapheStyle} />;
  }
  return (
    <View style={styles.liste}>
      {bloc.elements.map((element, index) => (
        <View key={`${index}-${element.texte}`} style={[styles.puce, element.niveau === 2 && styles.sousPuce]}>
          <Text style={[styles.marqueur, mobileWeb && styles.marqueurMobile]}>{element.niveau === 2 ? "◦" : "•"}</Text>
          <TexteRiche texte={element.texte} recherche={recherche} notes={notes} onNote={onNote} onFiche={onFiche} style={puceStyle} />
        </View>
      ))}
    </View>
  );
}

export default function FichePse() {
  const { height, width } = useWindowDimensions();
  const mobileWeb = Platform.OS === "web" && Math.min(width, height) <= 600;
  const params = useLocalSearchParams<{ reference?: string | string[]; recherche?: string | string[] }>();
  const router = useRouter();
  const reference = Array.isArray(params.reference) ? params.reference[0] : params.reference;
  const recherche = (Array.isArray(params.recherche) ? params.recherche[0] : params.recherche) ?? "";
  const fiche = reference ? PSE_DATA[reference] : undefined;
  const [chargementPdf, setChargementPdf] = useState(false);
  const [sommaireOuvert, setSommaireOuvert] = useState(mobileWeb);
  const [noteActive, setNoteActive] = useState<string>();
  const [echelle, setEchelle] = useState(1);
  const [favori, setFavori] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const positions = useRef<Record<number, number>>({});
  const indexFiche = useMemo(() => fiches.findIndex((item) => item.nom === reference), [reference]);

  useEffect(() => {
    if (!reference || Platform.OS !== "web") return;
    try {
      const favoris: string[] = JSON.parse(localStorage.getItem("pse-favoris") ?? "[]");
      setFavori(favoris.includes(reference));
      const recents: string[] = JSON.parse(localStorage.getItem("pse-recents") ?? "[]");
      localStorage.setItem("pse-recents", JSON.stringify([reference, ...recents.filter((item) => item !== reference)].slice(0, 8)));
    } catch { /* stockage indisponible */ }
  }, [reference]);

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

  const ouvrirFiche = (nouvelleReference: string) => router.replace({ pathname: "/fiche-pse", params: { reference: nouvelleReference, recherche } });

  const basculerFavori = () => {
    if (!reference) return;
    const suivant = !favori;
    setFavori(suivant);
    if (Platform.OS === "web") {
      const favoris: string[] = JSON.parse(localStorage.getItem("pse-favoris") ?? "[]");
      localStorage.setItem("pse-favoris", JSON.stringify(suivant ? [...new Set([...favoris, reference])] : favoris.filter((item) => item !== reference)));
    }
  };

  const partager = () => Share.share({
    title: `${fiche.nom} · ${fiche.titre}`,
    message: Platform.OS === "web" ? window.location.href : `${fiche.nom} · ${fiche.titre}`,
    url: Platform.OS === "web" ? window.location.href : undefined,
  });

  const allerSection = (index: number) => {
    scroll.current?.scrollTo({ y: Math.max(0, (positions.current[index] ?? 0) - 8), animated: true });
    setSommaireOuvert(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: fiche.nom }} />
      <ScrollView ref={scroll} contentContainerStyle={styles.contenu}>
        <View style={styles.page}>
          <View style={styles.entete}>
          <Text style={[styles.chapitrePrincipal, mobileWeb && styles.chapitrePrincipalMobile]}>{fiche.chapitre_principal}</Text>
          <Text style={[styles.reference, mobileWeb && styles.referenceMobile]}>{fiche.nom}</Text>
          <Text style={[styles.titre, mobileWeb && styles.titreMobile]}>{fiche.titre}</Text>
          <View style={styles.badges}>
            {fiche.niveaux.map((niveau) => <View key={niveau} style={styles.badge}><Text style={styles.badgeTexte}>{niveau}</Text></View>)}
            {fiche.niveaux.length === 0 && <View style={styles.badgeOptionnel}><Text style={styles.badgeOptionnelTexte}>Complémentaire</Text></View>}
            <View style={styles.badgeVersion}><Text style={styles.badgeVersionTexte}>Version locale · PSE</Text></View>
          </View>
          <View style={styles.outils}>
            <Pressable style={styles.outil} onPress={basculerFavori}><Ionicons name={favori ? "star" : "star-outline"} size={20} color="#fff" /><Text style={styles.outilTexte}>{favori ? "Favori" : "Ajouter"}</Text></Pressable>
            <Pressable style={styles.outil} onPress={partager}><Ionicons name="share-outline" size={20} color="#fff" /><Text style={styles.outilTexte}>Partager</Text></Pressable>
            <View style={styles.tailleTexte}>
              <Pressable onPress={() => setEchelle((valeur) => Math.max(0.85, valeur - 0.15))} hitSlop={8}><Text style={styles.tailleBouton}>A−</Text></Pressable>
              <Pressable onPress={() => setEchelle((valeur) => Math.min(1.45, valeur + 0.15))} hitSlop={8}><Text style={styles.tailleBouton}>A+</Text></Pressable>
            </View>
          </View>
          </View>

          <View style={styles.sommaire}>
            <Pressable style={styles.sommaireEntete} onPress={() => setSommaireOuvert((valeur) => !valeur)}>
              <Ionicons name="list-outline" size={22} color="#1f176a" /><Text style={styles.sommaireTitre}>Sommaire de la fiche</Text><Ionicons name={sommaireOuvert ? "chevron-up" : "chevron-down"} size={20} color="#1f176a" />
            </Pressable>
            {sommaireOuvert && fiche.chapitres.map((chapitre, index) => <Pressable key={`${index}-${chapitre.titre}`} style={styles.sommaireLigne} onPress={() => allerSection(index)}><Text style={styles.sommaireNumero}>{index + 1}</Text><Text style={styles.sommaireTexte}>{chapitre.titre}</Text></Pressable>)}
          </View>

          {noteActive && <Pressable style={styles.noteActive} onPress={() => setNoteActive(undefined)}><Ionicons name="information-circle" size={22} color="#604900" /><Text style={styles.noteActiveTexte}>{noteActive}</Text><Ionicons name="close" size={19} color="#604900" /></Pressable>}

          {fiche.chapitres.map((chapitre, index) => (
            <View key={`${index}-${chapitre.titre}`} onLayout={(event) => { positions.current[index] = event.nativeEvent.layout.y; }} style={[styles.section, mobileWeb && styles.sectionMobile]}>
              <Text style={[styles.sectionTitre, mobileWeb && styles.sectionTitreMobile, { fontSize: (mobileWeb ? 24 : 20) * echelle, lineHeight: (mobileWeb ? 30 : 26) * echelle }]}>{chapitre.titre}</Text>
              {chapitre.contenu.map((bloc, blocIndex) => <Bloc key={blocIndex} bloc={bloc} mobileWeb={mobileWeb} echelle={echelle} recherche={recherche} notes={fiche.notes} onNote={setNoteActive} onFiche={ouvrirFiche} />)}
            </View>
          ))}

          {fiche.notes.length > 0 && (
            <View style={styles.notes}>
              <Text style={styles.notesTitre}>Notes</Text>
              {fiche.notes.map((note, index) => <Text key={`${index}-${note}`} style={[styles.note, mobileWeb && styles.noteMobile, { fontSize: (mobileWeb ? 16 : 13) * echelle, lineHeight: (mobileWeb ? 24 : 19) * echelle }]}>{note}</Text>)}
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

          <View style={styles.navigationFiches}>
            {indexFiche > 0 ? <Pressable style={styles.navigationBouton} onPress={() => ouvrirFiche(fiches[indexFiche - 1].nom)}><Ionicons name="arrow-back" size={19} color="#1f176a" /><Text style={styles.navigationTexte}>{fiches[indexFiche - 1].nom}</Text></Pressable> : <View />}
            {indexFiche >= 0 && indexFiche < fiches.length - 1 && <Pressable style={styles.navigationBouton} onPress={() => ouvrirFiche(fiches[indexFiche + 1].nom)}><Text style={styles.navigationTexte}>{fiches[indexFiche + 1].nom}</Text><Ionicons name="arrow-forward" size={19} color="#1f176a" /></Pressable>}
          </View>
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
  badgeVersion: { backgroundColor: "#44406f", borderRadius: 6, paddingHorizontal: 9, paddingVertical: 4 },
  badgeVersionTexte: { color: "#fff", fontSize: 12, fontWeight: "700" },
  outils: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 17 },
  outil: { alignItems: "center", borderColor: "#7671aa", borderRadius: 9, borderWidth: 1, flexDirection: "row", gap: 6, paddingHorizontal: 10, paddingVertical: 8 },
  outilTexte: { color: "#fff", fontSize: 13, fontWeight: "700" },
  tailleTexte: { alignItems: "center", borderColor: "#7671aa", borderRadius: 9, borderWidth: 1, flexDirection: "row", gap: 14, paddingHorizontal: 11, paddingVertical: 8 },
  tailleBouton: { color: "#fff", fontSize: 14, fontWeight: "900" },
  sommaire: { backgroundColor: "#fff", borderColor: "#dedbe6", borderRadius: 12, borderWidth: 1, marginHorizontal: 14, marginTop: 13, overflow: "hidden" },
  sommaireEntete: { alignItems: "center", flexDirection: "row", gap: 9, padding: 14 },
  sommaireTitre: { color: "#1f176a", flex: 1, fontSize: 16, fontWeight: "800" },
  sommaireLigne: { alignItems: "center", borderTopColor: "#eeecf1", borderTopWidth: 1, flexDirection: "row", gap: 10, paddingHorizontal: 15, paddingVertical: 11 },
  sommaireNumero: { color: "#817ca3", fontSize: 12, fontWeight: "800", width: 22 },
  sommaireTexte: { color: "#3d3949", flex: 1, fontSize: 14, fontWeight: "600" },
  noteActive: { alignItems: "flex-start", backgroundColor: "#fff3c9", borderColor: "#e4c65e", borderRadius: 11, borderWidth: 1, flexDirection: "row", gap: 9, marginHorizontal: 14, marginTop: 12, padding: 13 },
  noteActiveTexte: { color: "#604900", flex: 1, fontSize: 14, lineHeight: 20 },
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
  appelNote: { color: "#1f176a", fontSize: 12, fontWeight: "900", textDecorationLine: "underline" },
  lienFiche: { color: "#1f176a", fontWeight: "800", textDecorationLine: "underline" },
  surlignage: { backgroundColor: "#ffe58a", color: "#211e31" },
  animation: { alignItems: "center", backgroundColor: "#1f176a", borderRadius: 12, flexDirection: "row", gap: 9, justifyContent: "center", marginHorizontal: 18, marginTop: 20, paddingVertical: 14 },
  animationTexte: { color: "#fff", fontSize: 15, fontWeight: "700" },
  pdf: { alignItems: "center", backgroundColor: "#fff", borderColor: "#1f176a", borderRadius: 12, borderWidth: 1, flexDirection: "row", flexWrap: "wrap", gap: 9, justifyContent: "center", marginHorizontal: 18, marginTop: 12, paddingHorizontal: 12, paddingVertical: 14 },
  pdfTexte: { color: "#1f176a", flexShrink: 1, fontSize: 15, fontWeight: "700", textAlign: "center" },
  navigationFiches: { flexDirection: "row", justifyContent: "space-between", marginHorizontal: 18, marginTop: 18 },
  navigationBouton: { alignItems: "center", backgroundColor: "#eceaf7", borderRadius: 10, flexDirection: "row", gap: 7, paddingHorizontal: 13, paddingVertical: 11 },
  navigationTexte: { color: "#1f176a", fontSize: 14, fontWeight: "800" },
  erreur: { alignItems: "center", flex: 1, justifyContent: "center", padding: 24 },
  erreurTitre: { color: "#352f3e", fontSize: 21, fontWeight: "800", marginTop: 10 },
  retour: { color: "#1f176a", fontSize: 16, fontWeight: "700", marginTop: 18 },
});
