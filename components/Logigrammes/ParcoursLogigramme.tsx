import { Ionicons } from '@expo/vector-icons';
import { useEffect, useReducer, useRef, useState } from 'react';
import {
  ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import PdfViewer from '@/components/PdfViewer';
import {
  PROCESSUS, type ProcessusId,
} from '@/constants/logigrammes/pourTouteIntervention';
import { LOGIGRAMMES } from '@/constants/logigrammes/parcoursPse';
import { COMPLEMENTS } from '@/constants/logigrammes/complements';
import { creerParcours, naviguerLogigrammes } from '@/utils/navigationLogigrammes';
import { ouvrirPdfAsset } from '@/utils/psePdf';

export default function ParcoursLogigramme({ processusInitial, onQuitter }: { processusInitial: ProcessusId; onQuitter: () => void }) {
  const [parcours, dispatch] = useReducer(naviguerLogigrammes, processusInitial, creerParcours);
  const [source, setSource] = useState<ProcessusId | null>(null);
  const [ouverture, setOuverture] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [historiqueVisible, setHistoriqueVisible] = useState(false);
  const [complementOuvert, setComplementOuvert] = useState<string | null>(null);
  const defilement = useRef<ScrollView>(null);
  const passage = parcours[parcours.length - 1];
  const definition = LOGIGRAMMES[passage.processus];
  const etape = definition.etapes[passage.etape];
  const phases = [...new Set(Object.values(definition.etapes).map(item => item.phase))];
  const appelant = passage.retours.at(-1);
  const origineCirconstancielle = [...passage.retours].reverse().find(retour => retour.processus === '13' && retour.etape !== 'situation');
  const contexte = origineCirconstancielle ? LOGIGRAMMES['13'].etapes[origineCirconstancielle.etape] : undefined;

  useEffect(() => {
    defilement.current?.scrollTo({ y: 0, animated: false });
    setErreur(null);
  }, [parcours.length, passage.etape, passage.processus]);

  async function consulter(reference: ProcessusId) {
    setErreur(null);
    if (Platform.OS === 'web') {
      setSource(reference);
      return;
    }
    setOuverture(true);
    try {
      await ouvrirPdfAsset(PROCESSUS[reference].pdf, `LOGI ${reference}`);
    } catch {
      setErreur('Impossible d’ouvrir le PDF. Vérifiez qu’un lecteur PDF est disponible, puis réessayez.');
    } finally {
      setOuverture(false);
    }
  }

  return (
    <>
      <ScrollView ref={defilement} contentContainerStyle={styles.defilement} keyboardShouldPersistTaps="handled">
        <View style={styles.contenu}>
          <Pressable accessibilityRole="button" onPress={onQuitter} style={styles.lien}>
            <Ionicons name="arrow-back" size={18} color="#1f176a" />
            <Text style={styles.texteLien}>Tous les logigrammes</Text>
          </Pressable>
          {appelant && (
            <Pressable accessibilityRole="button" onPress={() => dispatch({ type: 'fermer' })} style={styles.lien}>
              <Ionicons name="return-up-back-outline" size={18} color="#1f176a" />
              <Text style={styles.texteLien}>Revenir à {appelant.processus} · {PROCESSUS[appelant.processus].titre}</Text>
            </Pressable>
          )}
          <Text accessibilityRole="header" style={styles.titre}>{PROCESSUS[passage.processus].titre}</Text>
          <Text style={styles.sousTitre}>PSE1 · PSE2 · LOGI / {passage.processus} / 07-2026</Text>
          <View style={styles.phases}>
            {phases.map((phase) => (
              <View key={phase} style={[styles.phase, phase === etape.phase && styles.phaseActive]}>
                <Text style={[styles.textePhase, phase === etape.phase && styles.textePhaseActive]}>{phase}</Text>
              </View>
            ))}
          </View>

          {contexte && <View style={styles.contexte}>
            <Text style={styles.texteLien}>Contexte : {contexte.titre}</Text>
            {contexte.points?.map(point => <Text key={point} style={styles.description}>• {point}</Text>)}
          </View>}

          <View style={styles.formulaire}>
            <Text style={styles.indicateur}>Étape {parcours.length} · {etape.phase}</Text>
            <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={styles.question}>
              {etape.titre}
            </Text>
            {etape.description && <Text style={styles.description}>{etape.description}</Text>}
            {etape.points?.map((point) => (
              <Text key={point} style={styles.description}>• {point}</Text>
            ))}
            {etape.liens?.map((lien, index) => (
              <Pressable
                key={`${passage.processus}-${passage.etape}-lien-${index}`}
                accessibilityRole="button"
                accessibilityLabel={lien.libelle}
                onPress={() => dispatch({ type: 'ouvrir', action: lien.action })}
                style={({ pressed }) => [styles.sourceAction, pressed && styles.presse]}
              >
                <Ionicons name="git-branch-outline" size={24} color="#1f176a" />
                <View style={styles.flexible}>
                  <Text style={styles.texteLien}>{lien.libelle}</Text>
                  <Text style={styles.description}>{PROCESSUS[lien.action.processus].titre} · Parcours interactif</Text>
                </View>
                <Ionicons name="open-outline" size={20} color="#1f176a" />
              </Pressable>
            ))}

            <View accessibilityRole="radiogroup" accessibilityLabel={etape.titre} style={styles.choix}>
              {etape.choix.map((choix, index) => {
                const selectionne = passage.reponse === index;
                return (
                  <Pressable
                    key={`${passage.processus}-${passage.etape}-${index}`}
                    accessibilityRole="radio"
                    accessibilityLabel={choix.libelle}
                    aria-checked={selectionne}
                    onPress={() => dispatch({ type: 'repondre', reponse: index })}
                    style={({ pressed }) => [styles.option, selectionne && styles.optionSelectionnee, pressed && styles.presse]}
                  >
                    <Ionicons name={selectionne ? 'radio-button-on' : 'radio-button-off'} size={24} color="#1f176a" />
                    <Text style={styles.texteOption}>{choix.libelle}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.navigation}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: parcours.length === 1 }}
                disabled={parcours.length === 1}
                onPress={() => dispatch({ type: 'precedent' })}
                style={[styles.secondaire, parcours.length === 1 && styles.desactive]}
              >
                <Text style={styles.texteLien}>Précédent</Text>
              </Pressable>
              {etape.choix.length > 0 && <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: passage.reponse === null }}
                disabled={passage.reponse === null}
                onPress={() => dispatch({ type: 'avancer' })}
                style={[styles.principal, passage.reponse === null && styles.desactive]}
              >
                <Text style={styles.textePrincipal}>Continuer</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </Pressable>}
            </View>
          </View>

          {COMPLEMENTS[passage.processus]?.map(complement => {
            const cle = `${passage.processus}-${complement.titre}`;
            return <View key={cle} style={styles.complement}>
              <Pressable accessibilityRole="button" aria-expanded={complementOuvert === cle} onPress={() => setComplementOuvert(complementOuvert === cle ? null : cle)} style={styles.lien}>
                <Ionicons name={complementOuvert === cle ? 'chevron-up' : 'chevron-down'} size={18} color="#1f176a" />
                <Text style={styles.texteLien}>{complement.titre}</Text>
              </Pressable>
              {complementOuvert === cle && complement.points.map(point => <Text key={point} style={styles.description}>• {point}</Text>)}
            </View>;
          })}

          {ouverture && <ActivityIndicator accessibilityLabel="Ouverture du PDF" color="#1f176a" />}
          {erreur && <Text accessibilityRole="alert" style={styles.erreur}>{erreur}</Text>}
          <View style={styles.outils}>
            <Pressable accessibilityRole="button" disabled={ouverture} onPress={() => consulter(passage.processus)} style={styles.lien}>
              <Ionicons name="document-text-outline" size={18} color="#1f176a" />
              <Text style={styles.texteLien}>Diagramme original (PDF)</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => dispatch({ type: 'recommencer', processus: processusInitial })} style={styles.lien}>
              <Ionicons name="refresh" size={18} color="#1f176a" />
              <Text style={styles.texteLien}>Recommencer</Text>
            </Pressable>
          </View>
          {parcours.length > 1 && (
            <View>
              <Pressable
                accessibilityRole="button"
                aria-expanded={historiqueVisible}
                onPress={() => setHistoriqueVisible(!historiqueVisible)}
                style={styles.lien}
              >
                <Ionicons name={historiqueVisible ? 'chevron-up' : 'chevron-down'} size={18} color="#1f176a" />
                <Text style={styles.texteLien}>Parcours effectué ({parcours.length - 1} étapes)</Text>
              </Pressable>
              {historiqueVisible && parcours.slice(0, -1).map((entree, index) => (
                <View key={index} style={styles.historique}>
                  <Text style={styles.texteLien}>{index + 1}. [{entree.processus}] {LOGIGRAMMES[entree.processus].etapes[entree.etape].titre}</Text>
                  <Text style={styles.description}>
                    {entree.reponse !== null && LOGIGRAMMES[entree.processus].etapes[entree.etape].choix[entree.reponse].libelle}
                  </Text>
                </View>
              ))}
            </View>
          )}
          <Text style={styles.note}>
            Source : Logigrammes PSE, juillet 2026, page {Number(passage.processus) + 3}. Les renvois ouvrent les parcours associés.
            {'\n'}Les textes des références techniques nationales priment sur les logigrammes.
          </Text>
        </View>
      </ScrollView>

      <Modal visible={source !== null} animationType="slide" onRequestClose={() => setSource(null)}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.entetePdf}>
            <Text accessibilityRole="header" style={[styles.texteLien, styles.flexible]}>
              {source && `${source} · ${PROCESSUS[source].titre}`}
            </Text>
            <Pressable accessibilityRole="button" onPress={() => setSource(null)} style={styles.secondaire}>
              <Text style={styles.texteLien}>Fermer le PDF</Text>
            </Pressable>
          </View>
          {source && <PdfViewer initialUri={PROCESSUS[source].pdf} />}
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  defilement: { flexGrow: 1, alignItems: 'center', padding: 20 },
  contenu: { width: '100%', maxWidth: 820, gap: 16 },
  titre: { color: '#1f176a', fontSize: 26, fontWeight: '800' },
  sousTitre: { color: '#5e5a70', fontSize: 15 },
  phases: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  phase: { backgroundColor: '#e8e7ed', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  phaseActive: { backgroundColor: '#1f176a' },
  textePhase: { color: '#545063', fontSize: 13 },
  textePhaseActive: { color: '#fff', fontWeight: '700' },
  formulaire: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#dcd9e8', padding: 20, gap: 16 },
  indicateur: { color: '#5e5a70', fontSize: 14, fontWeight: '600' },
  question: { color: '#1f176a', fontSize: 23, fontWeight: '700' },
  description: { color: '#514d60', fontSize: 16, lineHeight: 24 },
  choix: { gap: 10 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#dcd9e8', borderRadius: 12, padding: 16, minHeight: 56 },
  optionSelectionnee: { borderColor: '#1f176a', backgroundColor: '#eeedf9' },
  presse: { backgroundColor: '#e4e1f4' },
  texteOption: { color: '#26223b', fontSize: 16, lineHeight: 23, flex: 1 },
  navigation: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', marginTop: 8 },
  principal: { backgroundColor: '#1f176a', borderRadius: 12, minHeight: 48, paddingVertical: 12, paddingHorizontal: 20, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' },
  textePrincipal: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaire: { borderColor: '#dcd9e8', borderWidth: 1, borderRadius: 12, minHeight: 48, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  desactive: { opacity: 0.4 },
  lien: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, paddingVertical: 8, alignSelf: 'flex-start' },
  texteLien: { color: '#1f176a', fontSize: 15, fontWeight: '600', flexShrink: 1 },
  sourceAction: { borderRadius: 12, padding: 14, backgroundColor: '#eaf3fa', flexDirection: 'row', gap: 12, alignItems: 'center' },
  flexible: { flex: 1 },
  complement: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 8 },
  contexte: { backgroundColor: '#eaf3fa', borderRadius: 12, padding: 16, gap: 8 },
  outils: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between' },
  historique: { borderLeftWidth: 2, borderLeftColor: '#dcd9e8', paddingLeft: 16, paddingVertical: 10, gap: 4 },
  note: { color: '#625e70', fontSize: 13, lineHeight: 20, marginBottom: 8 },
  erreur: { color: '#a32020', fontSize: 15 },
  modal: { flex: 1, backgroundColor: '#fff' },
  entetePdf: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: '#dcd9e8' },
});
