import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, BackHandler, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LIBELLES_PAIEMENTS, LIBELLES_PASSAGES, TOURNEES_DEMONSTRATION } from '@/constants/calendriers';
import type { AdresseCalendrier, PassageCalendrier, SaisiePassage } from '@/types/calendriers';
import { afficherEuros, bilanPassages, creerPassage, passagesTournee, remplacerPassage } from '@/utils/calendriers';
import { chargerPassages, enregistrerPassages } from '@/utils/calendriersStorage';

const nouvelleSaisie = (): SaisiePassage => ({
  statut: 'VENTE', quantite: '1', montant: '', moyenPaiement: 'ESPECES', commentaire: '',
});

export default function CalendriersScreen() {
  const [tourneeId, setTourneeId] = useState<string | null>(null);
  const [adresseId, setAdresseId] = useState<string | null>(null);
  const [passages, setPassages] = useState<PassageCalendrier[]>([]);
  const [saisie, setSaisie] = useState(nouvelleSaisie);
  const [chargement, setChargement] = useState(true);
  const [erreurChargement, setErreurChargement] = useState(false);
  const [tentative, setTentative] = useState(0);
  const [sauvegarde, setSauvegarde] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const sauvegardeEnCours = useRef(false);
  const defilement = useRef<ScrollView>(null);
  const estActif = useIsFocused();
  const tournee = TOURNEES_DEMONSTRATION.find(item => item.id === tourneeId);
  const adresse = tournee?.adresses.find(item => item.id === adresseId);
  const passagesAffiches = tournee ? passagesTournee(passages, tournee) : passages;
  const bilan = bilanPassages(passagesAffiches);

  useEffect(() => {
    let actif = true;
    setChargement(true);
    setErreurChargement(false);
    chargerPassages().then(donnees => {
      if (actif) setPassages(donnees);
    }).catch(() => {
      if (actif) setErreurChargement(true);
    }).finally(() => {
      if (actif) setChargement(false);
    });
    return () => { actif = false; };
  }, [tentative]);

  useEffect(() => {
    defilement.current?.scrollTo({ y: 0, animated: false });
  }, [tourneeId, adresseId]);

  const retour = useCallback(() => {
    if (sauvegardeEnCours.current) return true;
    if (adresseId) setAdresseId(null);
    else if (tourneeId) setTourneeId(null);
    else return false;
    setErreur(null);
    setConfirmation(null);
    return true;
  }, [adresseId, tourneeId]);

  useFocusEffect(useCallback(() => {
    if (Platform.OS !== 'android') return;
    const abonnement = BackHandler.addEventListener('hardwareBackPress', retour);
    return () => abonnement.remove();
  }, [retour]));

  function ouvrirAdresse(item: AdresseCalendrier) {
    if (!tournee) return;
    const precedent = passagesAffiches.find(passage => passage.adresseId === item.id);
    setSaisie(precedent ? {
      statut: precedent.statut,
      quantite: String(precedent.nbCalendriers || 1),
      montant: precedent.statut === 'VENTE' ? precedent.montant.replace('.', ',') : '',
      moyenPaiement: precedent.moyenPaiement ?? 'ESPECES',
      commentaire: precedent.commentaire,
    } : nouvelleSaisie());
    setAdresseId(item.id);
    setErreur(null);
    setConfirmation(null);
  }

  async function enregistrer() {
    if (!tournee || !adresse || chargement || erreurChargement || sauvegardeEnCours.current) return;
    setErreur(null);
    let suivants: PassageCalendrier[];
    try {
      suivants = remplacerPassage(passages, creerPassage(tournee, adresse, saisie));
    } catch (cause) {
      setErreur(cause instanceof Error ? cause.message : 'Vérifiez les informations saisies.');
      return;
    }
    sauvegardeEnCours.current = true;
    setSauvegarde(true);
    try {
      await enregistrerPassages(suivants);
      setPassages(suivants);
      setAdresseId(null);
      setConfirmation('Passage enregistré sur cet appareil.');
    } catch {
      setErreur('Enregistrement impossible. Votre saisie est conservée à l’écran ; vérifiez l’espace disponible puis réessayez.');
    } finally {
      sauvegardeEnCours.current = false;
      setSauvegarde(false);
    }
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={s.safe}>
      {estActif && <StatusBar style="dark" />}
      <View style={s.header}>
        <View>
          <Text style={s.kicker}>MOBILESP · TOURNÉES DE CALENDRIERS</Text>
          <Text accessibilityRole="header" style={s.titre}>Calendriers</Text>
        </View>
        <View style={s.badge}><Text style={s.badgeTexte}>Démo locale</Text></View>
      </View>
      <KeyboardAvoidingView style={s.flexible} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={defilement} contentContainerStyle={s.contenu} keyboardShouldPersistTaps="handled">
          <View style={s.largeur}>
            <View style={s.information}>
              <Ionicons name="information-circle-outline" size={22} color="#79551d" />
              <Text style={s.informationTexte}>Tournées et adresses d’exemple. Les saisies restent sur cet appareil, sans synchronisation avec un serveur.</Text>
            </View>

            {chargement ? <View style={s.attente}>
              <ActivityIndicator size="large" color="#1f176a" />
              <Text style={s.secondaire}>Chargement des passages enregistrés…</Text>
            </View> : erreurChargement ? <View style={s.carte}>
              <Text accessibilityRole="alert" style={s.erreur}>Impossible de lire les passages enregistrés. Aucune donnée n’a été remplacée.</Text>
              <Pressable accessibilityRole="button" onPress={() => setTentative(valeur => valeur + 1)} style={s.boutonPrincipal}>
                <Text style={s.textePrincipal}>Réessayer</Text>
              </Pressable>
            </View> : <>
              {tournee && <Pressable accessibilityRole="button" onPress={retour} disabled={sauvegarde} style={s.retour}>
                <Ionicons name="arrow-back" size={20} color="#1f176a" />
                <Text style={s.texteLien}>{adresse ? 'Adresses de la tournée' : 'Mes tournées'}</Text>
              </Pressable>}

              {!tournee ? <>
                <Text accessibilityRole="header" style={s.sousTitre}>Mes tournées</Text>
                <Text style={s.description}>Choisissez une tournée pour consulter ses adresses.</Text>
                {TOURNEES_DEMONSTRATION.map(item => {
                  const visites = passagesTournee(passages, item).length;
                  const progression = item.adresses.length ? visites / item.adresses.length : 0;
                  return <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.nom}, ${visites} adresses sur ${item.adresses.length} traitées`}
                    onPress={() => { setTourneeId(item.id); setConfirmation(null); }}
                    style={({ pressed }) => [s.carte, pressed && s.presse]}
                  >
                    <View style={s.ligne}>
                      <Text style={[s.nomTournee, s.flexible]}>{item.nom}</Text>
                      <Ionicons name="chevron-forward" size={23} color="#1f176a" />
                    </View>
                    <Text style={s.secondaire}>{item.secteur} · {item.date}</Text>
                    <View style={s.ligne}>
                      <Text style={s.secondaire}>{visites}/{item.adresses.length} adresses traitées</Text>
                      <Text style={s.statut}>{item.statut === 'EN_COURS' ? 'EN COURS' : 'PRÉPARÉE'}</Text>
                    </View>
                    <View style={s.progression}><View style={[s.avancement, { width: `${progression * 100}%` }]} /></View>
                  </Pressable>;
                })}
                <Resume passages={passages.length} calendriers={bilan.nbCalendriers} centimes={bilan.montantCentimes} />
              </> : adresse ? <>
                <Text accessibilityRole="header" style={s.sousTitre}>{adresse.ligne1}</Text>
                <Text style={s.description}>{adresse.ville} · {tournee.nom}</Text>
                <View style={s.carte}>
                  <Text style={s.libelle}>Résultat du passage</Text>
                  <Choix label="Résultat du passage" options={LIBELLES_PASSAGES} selection={saisie.statut} disabled={sauvegarde}
                    onSelect={statut => setSaisie(valeur => ({ ...valeur, statut }))} />
                  {saisie.statut === 'VENTE' && <>
                    <Text style={s.libelle}>Nombre de calendriers</Text>
                    <TextInput accessibilityLabel="Nombre de calendriers" value={saisie.quantite} editable={!sauvegarde}
                      onChangeText={quantite => setSaisie(valeur => ({ ...valeur, quantite }))}
                      keyboardType="number-pad" style={s.champ} />
                    <Text style={s.libelle}>Montant total encaissé (€)</Text>
                    <TextInput accessibilityLabel="Montant total encaissé en euros" value={saisie.montant} editable={!sauvegarde}
                      onChangeText={montant => setSaisie(valeur => ({ ...valeur, montant }))}
                      keyboardType="decimal-pad" placeholder="Ex. 10,00" placeholderTextColor="#7a8699" style={s.champ} />
                    <Text style={s.libelle}>Moyen de paiement</Text>
                    <Choix label="Moyen de paiement" options={LIBELLES_PAIEMENTS} selection={saisie.moyenPaiement} disabled={sauvegarde}
                      onSelect={moyenPaiement => setSaisie(valeur => ({ ...valeur, moyenPaiement }))} />
                  </>}
                  <Text style={s.libelle}>Commentaire (facultatif)</Text>
                  <TextInput accessibilityLabel="Commentaire du passage" value={saisie.commentaire} editable={!sauvegarde}
                    onChangeText={commentaire => setSaisie(valeur => ({ ...valeur, commentaire }))}
                    placeholder="Ex. repasser en soirée…" placeholderTextColor="#7a8699" multiline style={[s.champ, s.commentaire]} />
                  {erreur && <Text accessibilityRole="alert" style={s.erreur}>{erreur}</Text>}
                  <Pressable accessibilityRole="button" accessibilityState={{ disabled: sauvegarde, busy: sauvegarde }}
                    disabled={sauvegarde} onPress={enregistrer} style={[s.boutonPrincipal, sauvegarde && s.desactive]}>
                    {sauvegarde && <ActivityIndicator color="#fff" />}
                    <Text style={s.textePrincipal}>{sauvegarde ? 'Enregistrement…' : 'Enregistrer le passage'}</Text>
                  </Pressable>
                </View>
              </> : <>
                <Text accessibilityRole="header" style={s.sousTitre}>{tournee.nom}</Text>
                <Text style={s.description}>{tournee.secteur} · {tournee.date}</Text>
                {confirmation && <Text accessibilityLiveRegion="polite" style={s.confirmation}>{confirmation}</Text>}
                <Resume passages={passagesAffiches.length} calendriers={bilan.nbCalendriers} centimes={bilan.montantCentimes} />
                <Text accessibilityRole="header" style={s.libelle}>Adresses · {passagesAffiches.length}/{tournee.adresses.length} traitées</Text>
                {tournee.adresses.map((item, index) => {
                  const passage = passagesAffiches.find(p => p.adresseId === item.id);
                  return <Pressable key={item.id} accessibilityRole="button" onPress={() => ouvrirAdresse(item)}
                    style={({ pressed }) => [s.adresse, pressed && s.presse]}>
                    <View style={[s.numero, passage && s.numeroTraite]}>
                      {passage ? <Ionicons name="checkmark" size={21} color="#276346" /> : <Text style={s.texteLien}>{index + 1}</Text>}
                    </View>
                    <View style={s.flexible}>
                      <Text style={s.nomAdresse}>{item.ligne1}</Text>
                      <Text style={s.secondaire}>{passage ? LIBELLES_PASSAGES[passage.statut] : 'À visiter'}
                        {passage?.statut === 'VENTE' ? ` · ${passage.nbCalendriers} calendrier(s) · ${afficherEuros(bilanPassages([passage]).montantCentimes)}` : ''}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={21} color="#7a8699" />
                  </Pressable>;
                })}
              </>}
              <View style={s.stockage}>
                <Ionicons name="save-outline" size={17} color="#66748a" />
                <Text style={s.secondaire}>Les passages enregistrés sont conservés après fermeture de l’application.</Text>
              </View>
            </>}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Resume({ passages, calendriers, centimes }: { passages: number; calendriers: number; centimes: number }) {
  return <View style={s.resume}>
    <View style={s.statistique}><Text style={s.chiffre}>{passages}</Text><Text style={s.secondaire}>Passages</Text></View>
    <View style={s.statistique}><Text style={s.chiffre}>{calendriers}</Text><Text style={s.secondaire}>Calendriers</Text></View>
    <View style={s.statistique}><Text style={s.chiffre}>{afficherEuros(centimes)}</Text><Text style={s.secondaire}>Encaissé</Text></View>
  </View>;
}

function Choix<T extends string>({ label, options, selection, onSelect, disabled }: {
  label: string; options: Record<T, string>; selection: T; onSelect: (valeur: T) => void; disabled: boolean;
}) {
  return <View accessibilityRole="radiogroup" accessibilityLabel={label} style={s.choix}>
    {(Object.entries(options) as [T, string][]).map(([valeur, libelle]) => <Pressable
      key={valeur} accessibilityRole="radio" accessibilityState={{ checked: selection === valeur, disabled }}
      disabled={disabled} onPress={() => onSelect(valeur)} style={[s.option, selection === valeur && s.optionActive]}
    ><Text style={[s.texteOption, selection === valeur && s.textePrincipal]}>{libelle}</Text></Pressable>)}
  </View>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f6f9' },
  flexible: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 18, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e9f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  kicker: { fontSize: 10, letterSpacing: 0.8, fontWeight: '700', color: '#66748a' },
  titre: { fontSize: 26, fontWeight: '800', color: '#1f176a', marginTop: 4 },
  badge: { borderRadius: 16, paddingHorizontal: 11, paddingVertical: 7, backgroundColor: '#fff0d6' },
  badgeTexte: { fontSize: 11, fontWeight: '700', color: '#79551d' },
  contenu: { padding: 18, paddingBottom: 32 },
  largeur: { width: '100%', maxWidth: 760, alignSelf: 'center' },
  information: { flexDirection: 'row', gap: 10, backgroundColor: '#fff5e3', padding: 14, borderRadius: 12, marginBottom: 22 },
  informationTexte: { flex: 1, color: '#79551d', fontSize: 12, lineHeight: 18 },
  attente: { padding: 35, alignItems: 'center', gap: 14 },
  sousTitre: { fontSize: 23, fontWeight: '800', color: '#202b45', marginBottom: 6 },
  description: { fontSize: 13, lineHeight: 19, color: '#66748a', marginBottom: 20 },
  secondaire: { fontSize: 12, lineHeight: 18, color: '#66748a', flexShrink: 1 },
  carte: { backgroundColor: '#fff', borderRadius: 14, padding: 18, borderWidth: 1, borderColor: '#e5e9f0', marginBottom: 14, gap: 10 },
  ligne: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' },
  nomTournee: { fontSize: 17, fontWeight: '700', color: '#202b45' },
  statut: { fontSize: 10, fontWeight: '800', color: '#1f176a' },
  progression: { height: 6, backgroundColor: '#edf0f5', borderRadius: 5, overflow: 'hidden' },
  avancement: { height: 6, borderRadius: 5, backgroundColor: '#1f176a' },
  resume: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, backgroundColor: '#eaeaf6', borderRadius: 12, padding: 16, marginVertical: 10 },
  statistique: { flexGrow: 1, minWidth: 80, gap: 4 },
  chiffre: { fontSize: 21, fontWeight: '800', color: '#1f176a' },
  retour: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, marginBottom: 12, alignSelf: 'flex-start' },
  texteLien: { fontSize: 13, color: '#1f176a', fontWeight: '700' },
  libelle: { fontSize: 13, fontWeight: '700', color: '#33445b', marginTop: 12, marginBottom: 4 },
  choix: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { flexGrow: 1, minWidth: 100, paddingVertical: 13, paddingHorizontal: 12, backgroundColor: '#f4f5f9', borderWidth: 1, borderColor: '#dce0ea', borderRadius: 9, alignItems: 'center' },
  optionActive: { backgroundColor: '#1f176a', borderColor: '#1f176a' },
  texteOption: { color: '#4b5870', fontWeight: '700', fontSize: 13 },
  champ: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cdd4e0', borderRadius: 9, padding: 13, fontSize: 16, color: '#202b45' },
  commentaire: { minHeight: 90, textAlignVertical: 'top' },
  boutonPrincipal: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#1f176a', padding: 16, borderRadius: 10, marginTop: 14 },
  textePrincipal: { color: '#fff', fontSize: 13, fontWeight: '700' },
  desactive: { opacity: 0.6 },
  erreur: { color: '#a12532', fontSize: 13, lineHeight: 19, marginVertical: 10 },
  confirmation: { backgroundColor: '#e1f1e7', color: '#276346', padding: 12, borderRadius: 8, marginBottom: 8 },
  adresse: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e5e9f0', marginTop: 8 },
  numero: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#eeeeF8', alignItems: 'center', justifyContent: 'center' },
  numeroTraite: { backgroundColor: '#e1f1e7' },
  nomAdresse: { fontSize: 14, fontWeight: '700', color: '#202b45', marginBottom: 4 },
  presse: { opacity: 0.75 },
  stockage: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 18 },
});
