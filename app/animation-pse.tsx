import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import CompressionCanvas from "@/components/pse/CompressionCanvas";

const DUREE = 18_000;
const etapes = [
  { fin: 0.17, titre: "Installer la victime", texte: "Allonger la victime sur le dos, à l’horizontale et de préférence sur un plan dur." },
  { fin: 0.34, titre: "Se positionner", texte: "Se placer à genoux, au plus près de la victime, puis dénuder la poitrine si possible." },
  { fin: 0.48, titre: "Placer les mains", texte: "Poser le talon d’une main au centre de la poitrine, sur la moitié inférieure du sternum. Superposer l’autre main et entrecroiser les doigts." },
  { fin: 0.82, titre: "Comprimer verticalement", texte: "Garder les bras tendus et les coudes verrouillés. Comprimer d’environ 5 cm, sans dépasser 6 cm, à une fréquence de 100 à 120 par minute." },
  { fin: 1, titre: "Relâcher complètement", texte: "Laisser le thorax reprendre sa forme entre chaque compression, sans décoller le talon de la main." },
];

export default function AnimationPse() {
  const [lecture, setLecture] = useState(true);
  const [progression, setProgression] = useState(0);
  const [angle, setAngle] = useState(0);
  const depart = useRef(Date.now());
  const progressionDepart = useRef(0);
  const progressionCourante = useRef(0);

  useEffect(() => {
    progressionCourante.current = progression;
  }, [progression]);

  useEffect(() => {
    if (!lecture) return;
    depart.current = Date.now();
    progressionDepart.current = progressionCourante.current;
    const interval = setInterval(() => {
      const suivante = progressionDepart.current + (Date.now() - depart.current) / DUREE;
      if (suivante >= 1) {
        setProgression(1);
        setLecture(false);
      } else setProgression(suivante);
    }, 33);
    return () => clearInterval(interval);
  }, [lecture]);

  const etape = useMemo(() => etapes.findIndex((item) => progression <= item.fin), [progression]);
  const courante = etapes[Math.max(0, etape)];
  const recommencer = () => { setProgression(0); setLecture(true); };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "05FT10 · Animation 3D" }} />
      <View style={styles.scene}>
        <CompressionCanvas progression={progression} angle={angle} />
        <View style={styles.vues}>
          <Pressable style={styles.vue} onPress={() => setAngle((valeur) => valeur - Math.PI / 4)}><Ionicons name="arrow-undo" size={20} color="#1f176a" /></Pressable>
          <Pressable style={styles.vue} onPress={() => setAngle((valeur) => valeur + Math.PI / 4)}><Ionicons name="arrow-redo" size={20} color="#1f176a" /></Pressable>
        </View>
      </View>

      <ScrollView style={styles.informations} contentContainerStyle={styles.contenu}>
        <View style={styles.enteteEtape}>
          <Text style={styles.compteur}>ÉTAPE {Math.max(1, etape + 1)} / {etapes.length}</Text>
          <Text style={styles.temps}>{Math.round(progression * 18)} s</Text>
        </View>
        <Text style={styles.titre}>{courante.titre}</Text>
        <Text style={styles.texte}>{courante.texte}</Text>
        <View style={styles.barre}><View style={[styles.progression, { width: `${progression * 100}%` }]} /></View>

        <View style={styles.commandes}>
          <Pressable style={styles.boutonSecondaire} onPress={recommencer}><Ionicons name="refresh" size={22} color="#1f176a" /></Pressable>
          <Pressable style={styles.boutonLecture} onPress={() => progression >= 1 ? recommencer() : setLecture((valeur) => !valeur)}>
            <Ionicons name={lecture ? "pause" : "play"} size={23} color="#fff" />
            <Text style={styles.boutonTexte}>{lecture ? "Pause" : progression >= 1 ? "Revoir" : "Continuer"}</Text>
          </Pressable>
        </View>

        <View style={styles.rappel}>
          <Ionicons name="warning-outline" size={22} color="#8a5a00" />
          <Text style={styles.rappelTexte}>Support pédagogique uniquement. Cette animation ne remplace ni la fiche officielle 05FT10 ni une formation pratique encadrée.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#edf3f6", flex: 1 },
  scene: { height: "52%", minHeight: 330 },
  vues: { flexDirection: "row", gap: 8, position: "absolute", right: 14, top: 14 },
  vue: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.92)", borderRadius: 20, height: 40, justifyContent: "center", width: 40 },
  informations: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -18 },
  contenu: { padding: 22, paddingBottom: 38 },
  enteteEtape: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  compteur: { color: "#1f176a", fontSize: 12, fontWeight: "800", letterSpacing: 0.7 },
  temps: { color: "#777487", fontSize: 13 },
  titre: { color: "#211e31", fontSize: 22, fontWeight: "800", marginTop: 8 },
  texte: { color: "#555164", fontSize: 16, lineHeight: 23, marginTop: 8 },
  barre: { backgroundColor: "#e6e4eb", borderRadius: 4, height: 7, marginTop: 18, overflow: "hidden" },
  progression: { backgroundColor: "#1f176a", borderRadius: 4, height: "100%" },
  commandes: { flexDirection: "row", gap: 10, marginTop: 18 },
  boutonSecondaire: { alignItems: "center", borderColor: "#1f176a", borderRadius: 12, borderWidth: 1, justifyContent: "center", width: 52 },
  boutonLecture: { alignItems: "center", backgroundColor: "#1f176a", borderRadius: 12, flex: 1, flexDirection: "row", gap: 8, justifyContent: "center", paddingVertical: 13 },
  boutonTexte: { color: "#fff", fontSize: 16, fontWeight: "700" },
  rappel: { alignItems: "flex-start", backgroundColor: "#fff5dc", borderRadius: 12, flexDirection: "row", gap: 10, marginTop: 20, padding: 13 },
  rappelTexte: { color: "#694800", flex: 1, fontSize: 13, lineHeight: 18 },
});
