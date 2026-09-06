import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, useWindowDimensions, View, type StyleProp, type TextStyle } from "react-native";

import fichesJson from "@/assets/pse/fiches/Références techniques nationales - PSE - Fiches/fiches.json";
import { PSE_DATA } from "@/constants/pseData";
import type { FichePse, NiveauPse } from "@/types/pse";

type Filtre = "Tous" | NiveauPse;
type TypeFiche = "Tous" | "AC" | "PR" | "FT";
type Chapitre = { nom: string; numero: string; fiches: FichePse[] };

const fiches = fichesJson as FichePse[];
const filtres: Filtre[] = ["Tous", "PSE 1", "PSE 2"];
const types: TypeFiche[] = ["Tous", "AC", "PR", "FT"];
const normaliser = (texte: string) => texte.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const contenusRecherchables = Object.fromEntries(
  Object.entries(PSE_DATA).map(([reference, fiche]) => [
    reference,
    normaliser(JSON.stringify({ chapitres: fiche.chapitres, notes: fiche.notes })),
  ]),
);

function TexteSurligne({ texte, recherche, style }: { texte: string; recherche: string; style: StyleProp<TextStyle> }) {
  const terme = recherche.trim();
  if (!terme) return <Text style={style}>{texte}</Text>;
  const index = normaliser(texte).indexOf(normaliser(terme));
  if (index < 0) return <Text style={style}>{texte}</Text>;
  return <Text style={style}>{texte.slice(0, index)}<Text style={styles.surlignage}>{texte.slice(index, index + terme.length)}</Text>{texte.slice(index + terme.length)}</Text>;
}

export default function Secourisme() {
  const { height, width } = useWindowDimensions();
  const mobileWeb = Platform.OS === "web" && Math.min(width, height) <= 600;
  const desktopWeb = Platform.OS === "web" && width >= 1000;
  const router = useRouter();
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState<Filtre>("Tous");
  const [typeFiche, setTypeFiche] = useState<TypeFiche>("Tous");
  const [rechercheContenu, setRechercheContenu] = useState(false);
  const [ouverts, setOuverts] = useState<Set<string>>(new Set());
  const [favoris, setFavoris] = useState<Set<string>>(new Set());
  const [recents, setRecents] = useState<string[]>([]);
  const [selection, setSelection] = useState<string>();

  useEffect(() => {
    if (Platform.OS !== "web") return;
    try {
      setFavoris(new Set(JSON.parse(localStorage.getItem("pse-favoris") ?? "[]")));
      setRecents(JSON.parse(localStorage.getItem("pse-recents") ?? "[]"));
    } catch { /* stockage indisponible */ }
  }, []);

  const memoriser = (nouveauxFavoris: Set<string>, nouveauxRecents = recents) => {
    if (Platform.OS !== "web") return;
    localStorage.setItem("pse-favoris", JSON.stringify([...nouveauxFavoris]));
    localStorage.setItem("pse-recents", JSON.stringify(nouveauxRecents));
  };

  const ouvrirFiche = (reference: string) => {
    const suivants = [reference, ...recents.filter((item) => item !== reference)].slice(0, 8);
    setRecents(suivants);
    memoriser(favoris, suivants);
    if (desktopWeb) setSelection(reference);
    else router.push({ pathname: "/fiche-pse", params: { reference, recherche } });
  };

  const basculerFavori = (reference: string) => {
    const suivants = new Set(favoris);
    if (suivants.has(reference)) suivants.delete(reference); else suivants.add(reference);
    setFavoris(suivants);
    memoriser(suivants);
  };

  const chapitres = useMemo<Chapitre[]>(() => {
    const terme = normaliser(recherche.trim());
    const groupes = new Map<string, FichePse[]>();
    fiches.forEach((fiche) => {
      const niveauOk = filtre === "Tous" || fiche.niveaux.includes(filtre);
      const typeOk = typeFiche === "Tous" || fiche.nom.slice(2, 4) === typeFiche;
      const metadonnees = normaliser(`${fiche.nom} ${fiche.titre} ${fiche.chapitre}`);
      const texteOk = !terme || metadonnees.includes(terme) || (rechercheContenu && contenusRecherchables[fiche.nom]?.includes(terme));
      if (!niveauOk || !typeOk || !texteOk) return;
      const groupe = groupes.get(fiche.chapitre) ?? [];
      groupe.push(fiche);
      groupes.set(fiche.chapitre, groupe);
    });
    return [...groupes].map(([nom, fichesDuChapitre]) => ({
      nom,
      numero: fichesDuChapitre[0].nom.slice(0, 2),
      fiches: fichesDuChapitre,
    }));
  }, [filtre, recherche, rechercheContenu, typeFiche]);

  const basculerChapitre = (chapitre: string) => {
    setOuverts((actuels) => {
      const suivants = new Set(actuels);
      if (suivants.has(chapitre)) suivants.delete(chapitre);
      else suivants.add(chapitre);
      return suivants;
    });
  };

  const rechercheActive = recherche.trim().length > 0;
  const enteteAnnuaire = <>
    <View style={styles.entete}>
      <Text style={[styles.titre, mobileWeb && styles.titreMobile]}>Annuaire des fiches PSE</Text>
      <Text style={[styles.sousTitre, mobileWeb && styles.sousTitreMobile]}>198 fiches classées par chapitre</Text>
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
      <View style={styles.filtres}>
        {types.map((valeur) => (
          <Pressable key={valeur} onPress={() => setTypeFiche(valeur)} style={[styles.filtreType, typeFiche === valeur && styles.filtreActif]}>
            <Text style={[styles.texteFiltre, typeFiche === valeur && styles.texteFiltreActif]}>{valeur === "Tous" ? "Tous types" : valeur}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.optionRecherche}>
        <View style={styles.optionLibelle}>
          <Text style={styles.optionTitre}>Rechercher dans le contenu</Text>
          <Text style={styles.optionAide}>Paragraphes, puces et notes des fiches</Text>
        </View>
        <Switch
          value={rechercheContenu}
          onValueChange={setRechercheContenu}
          trackColor={{ false: "#cbc9d4", true: "#8882bb" }}
          thumbColor={rechercheContenu ? "#1f176a" : "#f4f3f4"}
        />
      </View>
    </View>

    {(favoris.size > 0 || recents.length > 0) && <View style={styles.raccourcis}>
      <Ionicons name="bookmark-outline" size={17} color="#1f176a" />
      <Text style={styles.raccourcisTitre}>Accès rapide :</Text>
      {[...favoris, ...recents].filter((item, index, tableau) => tableau.indexOf(item) === index).slice(0, 8).map((reference) => (
        <Pressable key={reference} onPress={() => ouvrirFiche(reference)}><Text style={styles.raccourci}>{reference}</Text></Pressable>
      ))}
    </View>}
  </>;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Recommandations PSE" }} />

      <View style={styles.corps}>
      <View style={styles.colonneGauche}>
      {desktopWeb && enteteAnnuaire}
      <ScrollView
        style={styles.resultats}
        contentContainerStyle={[styles.liste, !desktopWeb && styles.listeAvecEntete]}
        showsVerticalScrollIndicator
      >
        {!desktopWeb && enteteAnnuaire}
        {chapitres.length === 0 && <Text style={styles.vide}>Aucune fiche ne correspond à la recherche.</Text>}
        {chapitres.map((chapitre) => {
          const estOuvert = rechercheActive || ouverts.has(chapitre.nom);
          return (
            <View key={chapitre.nom} style={styles.chapitre}>
              <Pressable style={styles.ligneChapitre} onPress={() => basculerChapitre(chapitre.nom)}>
                <View style={styles.numeroChapitre}><Text style={styles.numeroTexte}>{chapitre.numero}</Text></View>
                <View style={styles.libelleChapitre}>
                  <Text style={[styles.nomChapitre, mobileWeb && styles.nomChapitreMobile]}>{chapitre.nom}</Text>
                  <Text style={[styles.compteur, mobileWeb && styles.compteurMobile]}>{chapitre.fiches.length} fiche(s)</Text>
                </View>
                <Ionicons name={estOuvert ? "chevron-up" : "chevron-down"} size={22} color="#1f176a" />
              </Pressable>
              {estOuvert && chapitre.fiches.map((fiche) => (
                <View key={fiche.nom} style={styles.ficheBloc}>
                  <Pressable onPress={() => ouvrirFiche(fiche.nom)} style={({ pressed }) => [styles.ligneFiche, selection === fiche.nom && styles.ficheSelectionnee, pressed && styles.fichePressee]}>
                    <View style={styles.branche} />
                    <View style={styles.contenuFiche}>
                      <View style={styles.metaFiche}>
                        <Text style={styles.code}>{fiche.nom}</Text>
                        {fiche.niveaux.map((niveau) => <View key={niveau} style={styles.badge}><Text style={styles.badgeTexte}>{niveau}</Text></View>)}
                        {fiche.niveaux.length === 0 && <Text style={styles.optionnelle}>Complémentaire</Text>}
                      </View>
                      <TexteSurligne texte={fiche.titre} recherche={recherche} style={[styles.titreFiche, mobileWeb && styles.titreFicheMobile]} />
                    </View>
                    <Pressable accessibilityLabel={favoris.has(fiche.nom) ? "Retirer des favoris" : "Ajouter aux favoris"} onPress={() => basculerFavori(fiche.nom)} hitSlop={8} style={styles.favori}>
                      <Ionicons name={favoris.has(fiche.nom) ? "star" : "star-outline"} size={21} color="#a16900" />
                    </Pressable>
                    <Ionicons name="chevron-forward" size={22} color="#1f176a" />
                  </Pressable>
                  {fiche.nom === "01AC01" && <Pressable
                      style={styles.animation}
                      onPress={() => router.push({ pathname: "/animation-pse", params: { reference: fiche.nom } })}
                    >
                      <Ionicons name="cube-outline" size={18} color="#fff" />
                      <Text style={styles.animationTexte}>Démo animation 3D</Text>
                    </Pressable>}
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>
      </View>
      {desktopWeb && <ScrollView style={styles.apercu} contentContainerStyle={styles.apercuContenu}>
        {selection && PSE_DATA[selection] ? <>
          <Text style={styles.apercuReference}>{PSE_DATA[selection].nom}</Text>
          <Text style={styles.apercuTitre}>{PSE_DATA[selection].titre}</Text>
          {PSE_DATA[selection].chapitres.map((chapitre) => <View key={chapitre.titre} style={styles.apercuSection}>
            <Text style={styles.apercuSectionTitre}>{chapitre.titre}</Text>
            {chapitre.contenu.map((bloc, index) => bloc.type === "paragraphe"
              ? <Text key={index} style={styles.apercuTexte}>{bloc.texte}</Text>
              : <View key={index}>{bloc.elements.map((element, item) => <Text key={item} style={styles.apercuTexte}>• {element.texte}</Text>)}</View>)}
          </View>)}
          <Pressable style={styles.ouvrirComplet} onPress={() => router.push({ pathname: "/fiche-pse", params: { reference: selection, recherche } })}><Text style={styles.ouvrirCompletTexte}>Ouvrir la fiche complète</Text></Pressable>
        </> : <View style={styles.apercuVide}><Ionicons name="reader-outline" size={42} color="#aaa6b8" /><Text style={styles.apercuVideTexte}>Sélectionnez une fiche pour la consulter ici.</Text></View>}
      </ScrollView>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f8" },
  entete: { backgroundColor: "#fff", paddingHorizontal: 18, paddingTop: 14, paddingBottom: 12 },
  titre: { color: "#1f176a", fontSize: 24, fontWeight: "800" },
  titreMobile: { fontSize: 28, lineHeight: 34 },
  sousTitre: { color: "#6e6b80", fontSize: 14, marginTop: 3, marginBottom: 14 },
  sousTitreMobile: { fontSize: 17, lineHeight: 23 },
  recherche: { alignItems: "center", backgroundColor: "#f1f0f5", borderRadius: 12, flexDirection: "row", paddingHorizontal: 12 },
  champ: { color: "#242132", flex: 1, fontSize: 16, paddingHorizontal: 9, paddingVertical: 11 },
  filtres: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  filtre: { borderColor: "#d4d1e2", borderRadius: 20, borderWidth: 1, flexGrow: 1, maxWidth: 150, minWidth: 72, paddingHorizontal: 12, paddingVertical: 7 },
  filtreType: { borderColor: "#d4d1e2", borderRadius: 20, borderWidth: 1, paddingHorizontal: 15, paddingVertical: 7 },
  filtreActif: { backgroundColor: "#1f176a", borderColor: "#1f176a" },
  texteFiltre: { color: "#504d64", fontSize: 14, fontWeight: "600" },
  texteFiltreActif: { color: "#fff" },
  optionRecherche: { alignItems: "center", borderTopColor: "#eceaf0", borderTopWidth: 1, flexDirection: "row", marginTop: 12, paddingTop: 11 },
  optionLibelle: { flex: 1 },
  optionTitre: { color: "#353243", fontSize: 14, fontWeight: "600" },
  optionAide: { color: "#7a7788", fontSize: 12, marginTop: 2 },
  liste: { padding: 14, paddingBottom: 30 },
  listeAvecEntete: { paddingTop: 0 },
  corps: { flex: 1, flexDirection: "row", minHeight: 0 },
  colonneGauche: { flex: 1, minHeight: 0, minWidth: 0 },
  resultats: { flex: 1, minHeight: 0, width: "100%" },
  chapitre: { backgroundColor: "#fff", borderColor: "#e2e0e9", borderRadius: 14, borderWidth: 1, marginBottom: 10, overflow: "hidden" },
  ligneChapitre: { alignItems: "center", flexDirection: "row", minHeight: 72, padding: 12 },
  numeroChapitre: { alignItems: "center", backgroundColor: "#eceaf7", borderRadius: 10, height: 42, justifyContent: "center", width: 42 },
  numeroTexte: { color: "#1f176a", fontSize: 15, fontWeight: "800" },
  libelleChapitre: { flex: 1, paddingHorizontal: 12 },
  nomChapitre: { color: "#262238", fontSize: 16, fontWeight: "700" },
  nomChapitreMobile: { fontSize: 19, lineHeight: 25 },
  compteur: { color: "#777487", fontSize: 13, marginTop: 3 },
  compteurMobile: { fontSize: 15 },
  ligneFiche: { alignItems: "center", borderTopColor: "#eceaf0", borderTopWidth: 1, flexDirection: "row", minHeight: 78, paddingHorizontal: 12, paddingVertical: 10 },
  ficheBloc: { borderTopColor: "#eceaf0", borderTopWidth: 1 },
  fichePressee: { backgroundColor: "#f3f2fa" },
  ficheSelectionnee: { backgroundColor: "#eeecfa" },
  branche: { backgroundColor: "#c7c3dc", height: 1, marginRight: 8, width: 10 },
  contenuFiche: { flex: 1, paddingRight: 8 },
  metaFiche: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 6 },
  code: { color: "#1f176a", fontSize: 13, fontWeight: "800" },
  badge: { backgroundColor: "#e8f3ee", borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  badgeTexte: { color: "#176b49", fontSize: 11, fontWeight: "700" },
  optionnelle: { color: "#817d8e", fontSize: 11, fontStyle: "italic" },
  favori: { padding: 7 },
  titreFiche: { color: "#302d3d", fontSize: 15, lineHeight: 20, marginTop: 4 },
  titreFicheMobile: { fontSize: 18, lineHeight: 25, marginTop: 6 },
  vide: { color: "#716e80", paddingTop: 50, textAlign: "center" },
  animation: { alignItems: "center", alignSelf: "flex-start", backgroundColor: "#1f176a", borderRadius: 9, flexDirection: "row", flexShrink: 1, gap: 7, marginBottom: 12, marginHorizontal: 30, paddingHorizontal: 13, paddingVertical: 9 },
  animationTexte: { color: "#fff", fontSize: 13, fontWeight: "700" },
  surlignage: { backgroundColor: "#ffe58a", color: "#211e31", fontWeight: "800" },
  raccourcis: { alignItems: "center", backgroundColor: "#eeecf8", flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 18, paddingVertical: 9 },
  raccourcisTitre: { color: "#514d61", fontSize: 13, fontWeight: "700" },
  raccourci: { color: "#1f176a", fontSize: 13, fontWeight: "800", textDecorationLine: "underline" },
  apercu: { backgroundColor: "#fff", borderLeftColor: "#dcd9e5", borderLeftWidth: 1, flex: 1.15 },
  apercuContenu: { padding: 26, paddingBottom: 50 },
  apercuReference: { color: "#1f176a", fontSize: 14, fontWeight: "900" },
  apercuTitre: { color: "#211e31", fontSize: 28, fontWeight: "800", lineHeight: 35, marginTop: 5 },
  apercuSection: { borderTopColor: "#e5e2ea", borderTopWidth: 1, marginTop: 20, paddingTop: 16 },
  apercuSectionTitre: { color: "#1f176a", fontSize: 20, fontWeight: "800", marginBottom: 9 },
  apercuTexte: { color: "#3b3745", fontSize: 16, lineHeight: 24, marginBottom: 8 },
  apercuVide: { alignItems: "center", justifyContent: "center", minHeight: 380 },
  apercuVideTexte: { color: "#777487", fontSize: 16, marginTop: 12, textAlign: "center" },
  ouvrirComplet: { alignItems: "center", backgroundColor: "#1f176a", borderRadius: 11, marginTop: 24, padding: 13 },
  ouvrirCompletTexte: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
