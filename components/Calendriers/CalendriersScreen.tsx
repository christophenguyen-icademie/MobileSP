import { useIsFocused } from '@react-navigation/native';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, KeyboardAvoidingView, Platform, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Carnet, FormulairePassage, Profil, Tournee } from '@/types/calendriersApi';
import { CalendriersApi, ErreurCalendriers } from '@/utils/calendriersApi';
import { serveurCalendriers } from '@/utils/calendriersConfig';
import { chargerConnexion, enregistrerConnexion, oublierConnexion } from '@/utils/calendriersConnexion';
import type { ConnexionMemorisee } from '@/utils/calendriersConnexionCommun';
import { couleurResultat, dateAffichee, euros, FILTRES_INITIAUX, filtrerAdresses, formulaire, logement, PAIEMENTS, payloadPassage, RESULTATS, rues } from '@/utils/calendriersServeur';
import AdresseForm from './AdresseForm';
import BilanCalendriers from './BilanCalendriers';
import RecuForm from './RecuForm';
import { Attente, Bouton, Carte, Champ, Selecteur, s } from './CalendriersUi';

const STATUTS = { PREPAREE: 'Préparée', EN_COURS: 'En cours', TERMINEE: 'Terminée', VALIDEE: 'Validée' };

export default function CalendriersScreen() {
  const [serveur, setServeur] = useState(serveurCalendriers);
  const [amicale, setAmicale] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [memoriser, setMemoriser] = useState(false);
  const [connexionEnregistree, setConnexionEnregistree] = useState(false);
  const [avisMemoire, setAvisMemoire] = useState('');
  const connexionMemorisee = useRef<ConnexionMemorisee | null>(null);
  const [profil, setProfil] = useState<Profil | null>(null);
  const [tournees, setTournees] = useState<Tournee[]>([]);
  const [tournee, setTournee] = useState<Tournee | null>(null);
  const [annee, setAnnee] = useState('');
  const [saisie, setSaisie] = useState<FormulairePassage | null>(null);
  const [filtres, setFiltres] = useState({ ...FILTRES_INITIAUX });
  const [carnet, setCarnet] = useState<{ numero: string; premierRecu: string; nombreRecus: string } | null>(null);
  const [erreur, setErreur] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [chargement, setChargement] = useState(true);
  const api = useRef<CalendriersApi | null>(null);
  const occupe = useRef(false);
  const scroll = useRef<ScrollView>(null);
  const actif = useIsFocused();

  const vider = useCallback(() => {
    setProfil(null); setTournees([]); setTournee(null); setSaisie(null); setCarnet(null); setConfirmation('');
    const connexion = connexionMemorisee.current;
    setAmicale(connexion?.amicale ?? ''); setEmail(connexion?.email ?? ''); setPassword(connexion?.password ?? '');
    if (connexion) setServeur(connexion.serveur);
  }, []);
  const afficherErreur = useCallback((cause: unknown) => {
    if (cause instanceof ErreurCalendriers && cause.sessionExpiree) vider();
    setErreur(cause instanceof Error ? cause.message : 'La demande a échoué.');
  }, [vider]);
  async function executer(action: () => Promise<void>) {
    if (occupe.current) return;
    occupe.current = true; setChargement(true); setErreur('');
    try { await action(); } catch (cause) { afficherErreur(cause); }
    finally { occupe.current = false; setChargement(false); }
  }
  async function liste(client: CalendriersApi, user: Profil) {
    setProfil(user); setAnnee(String(user.amicale.campagne));
    setTournees(await client.tournees());
  }
  // Le cookie de session est fourni par le serveur, y compris après un rechargement.
  useEffect(() => {
    let mounted = true;
    occupe.current = true;
    void (async () => {
      try {
        let connexion: ConnexionMemorisee | null = null;
        try { connexion = await chargerConnexion(); }
        catch (cause) { if (mounted) setAvisMemoire(cause instanceof Error ? cause.message : 'Les informations mémorisées sont indisponibles.'); }
        if (!mounted) return;
        connexionMemorisee.current = connexion;
        if (connexion) {
          setServeur(connexion.serveur); setAmicale(connexion.amicale); setEmail(connexion.email); setPassword(connexion.password);
          setMemoriser(true); setConnexionEnregistree(true);
        }
        const client = new CalendriersApi(connexion?.serveur ?? serveurCalendriers()); api.current = client;
        const user = await client.session();
        if (mounted && user) { const tours = await client.tournees(); if (mounted) { setProfil(user); setAnnee(String(user.amicale.campagne)); setTournees(tours); } }
      } catch (cause) { if (mounted) afficherErreur(cause); }
      finally { if (mounted) { occupe.current = false; setChargement(false); } }
    })();
    return () => { mounted = false; };
  }, [afficherErreur]);

  useEffect(() => { if (erreur) scroll.current?.scrollTo({ y: 0, animated: true }); }, [erreur]);

  const carnetOuvert = carnet !== null;
  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); }, [tournee?.id, saisie?.mode, saisie?.source?.id, carnetOuvert]);
  const retour = useCallback(() => {
    if (occupe.current) return true;
    if (saisie) setSaisie(null);
    else if (carnet) setCarnet(null);
    else if (tournee) { setTournee(null); setFiltres({ ...FILTRES_INITIAUX }); }
    else return false;
    setErreur(''); setConfirmation(''); return true;
  }, [saisie, carnet, tournee]);
  useFocusEffect(useCallback(() => {
    if (Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', retour);
    return () => subscription.remove();
  }, [retour]));

  function connecter() { void executer(async () => {
    if (!/^[a-zA-Z0-9]{4,20}$/.test(amicale.trim())) throw new Error('L’identifiant d’amicale doit contenir 4 à 20 lettres non accentuées ou chiffres.');
    const client = new CalendriersApi(serveur); api.current = client;
    const user = await client.login(amicale, email, password);
    if (!user) throw new Error('La connexion n’a pas pu être établie.');
    setAvisMemoire('');
    if (memoriser) {
      const connexion = { serveur: client.base, amicale: user.amicale.identifiant, email: email.trim(), password };
      try {
        await enregistrerConnexion(connexion);
        connexionMemorisee.current = connexion; setConnexionEnregistree(true);
      } catch (cause) { setAvisMemoire(cause instanceof Error ? cause.message : 'Connexion réussie, mais les informations n’ont pas été mémorisées.'); }
    }
    setPassword(''); await liste(client, user);
  }); }
  function effacerConnexion(effacerSaisie = true) { void executer(async () => {
    await oublierConnexion();
    connexionMemorisee.current = null; setConnexionEnregistree(false); setMemoriser(false); setAvisMemoire('');
    if (effacerSaisie) { setAmicale(''); setEmail(''); setPassword(''); }
    setConfirmation('Informations de connexion effacées de cet appareil.');
  }); }
  function changerMemorisation(value: boolean) {
    if (value) setMemoriser(true);
    else effacerConnexion(false);
  }
  async function chargerTournee(id: string) {
    const detail = await api.current!.tournee(id);
    setTournee(detail); setTournees(values => values.map(t => t.id === id ? detail : t));
  }
  function actualiser() { void executer(async () => {
    const user = await api.current!.session();
    if (!user) { vider(); throw new Error('Votre session a expiré. Reconnectez-vous.'); }
    setProfil(user);
    if (tournee) await chargerTournee(tournee.id); else setTournees(await api.current!.tournees());
  }); }
  function enregistrer() { if (!tournee || !saisie) return; void executer(async () => {
    if (tournee.statut === 'VALIDEE') throw new Error('Cette tournée est validée et ne peut plus être modifiée.');
    const payload = payloadPassage(saisie, tournee.carnets);
    try { await api.current!.enregistrer(tournee.id, saisie.mode, saisie.source?.id, payload); }
    catch (cause) {
      // Garder le formulaire, mais relire les reçus après un conflit concurrent.
      if (cause instanceof ErreurCalendriers && cause.status === 409) {
        try { await chargerTournee(tournee.id); } catch { /* La saisie et l'erreur initiale restent visibles. */ }
      }
      throw cause;
    }
    if (saisie.mode !== 'existing') setFiltres({ ...FILTRES_INITIAUX });
    setSaisie(null); setConfirmation('Passage enregistré sur le serveur.');
    try { await chargerTournee(tournee.id); }
    catch (cause) { if (cause instanceof ErreurCalendriers && cause.sessionExpiree) throw cause; throw new Error('Passage enregistré. La liste n’a pas pu être actualisée ; appuyez sur Actualiser.'); }
  }); }
  function ajouterCarnet() { if (!tournee || !carnet) return; void executer(async () => {
    const premier = Number(carnet.premierRecu), nombre = Number(carnet.nombreRecus);
    if (!carnet.numero.trim() || carnet.numero.trim().length > 40 || !/^\d+$/.test(carnet.premierRecu) || !/^\d+$/.test(carnet.nombreRecus)
      || premier < 1 || nombre < 1 || nombre > 1000 || premier + nombre - 1 > 999999999) throw new Error('Renseignez le carnet, un premier reçu positif et de 1 à 1 000 reçus.');
    await api.current!.creerCarnet(tournee.id, { numero: carnet.numero.trim(), premierRecu: premier, nombreRecus: nombre });
    setCarnet(null); setConfirmation('Carnet créé sur le serveur.');
    try { await chargerTournee(tournee.id); } catch { throw new Error('Carnet créé. Actualisez pour recharger la liste.'); }
  }); }

  const verrouille = tournee?.statut === 'VALIDEE';
  const adresses = tournee?.listeAdresses ?? [];
  const visibles = filtrerAdresses(adresses, filtres);
  const update = (patch: Partial<FormulairePassage>) => setSaisie(value => value && ({ ...value, ...patch }));
  const totaux = tournees.filter(t => !annee || t.dateDebut.slice(0, 4) === annee);
  return <SafeAreaView edges={['top', 'left', 'right']} style={s.safe}>
    {actif && <StatusBar style="dark" />}
    <View style={s.header}><Text accessibilityRole="header" style={s.titre}>Calendriers</Text>
      <Text style={s.secondaire}>{profil ? `${profil.amicale.nom} · ${profil.email}` : 'Connexion à votre amicale'}</Text></View>
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView ref={scroll} contentContainerStyle={s.contenu} keyboardShouldPersistTaps="handled"><View style={s.largeur}>
        {chargement && <Attente />}
        {!!erreur && <Text accessibilityRole="alert" style={s.erreur}>{erreur}</Text>}
        {!!avisMemoire && <Text accessibilityRole="alert" style={s.erreur}>{avisMemoire}</Text>}
        {!!confirmation && <Text accessibilityLiveRegion="polite" style={s.confirmation}>{confirmation}</Text>}
        {!profil ? <Carte>
          <Text style={s.sousTitre}>Se connecter</Text>
          <Champ label="Adresse de l’API" value={serveur} onChange={value => { setServeur(value); setPassword(''); }} disabled={chargement} clavier="url" aide="Ex. https://calendriers.monamicale.fr/api" />
          <Champ label="Identifiant de l’amicale" value={amicale} onChange={setAmicale} disabled={chargement} longueur={20} aide="4 à 20 lettres non accentuées ou chiffres" />
          <Champ label="E-mail" value={email} onChange={setEmail} disabled={chargement} clavier="email-address" />
          <Champ label="Mot de passe" value={password} onChange={setPassword} disabled={chargement} secret />
          <View style={s.ligne}>
            <Text style={[s.libelle, { flex: 1 }]}>Mémoriser mes informations de connexion</Text>
            <Switch accessibilityLabel="Mémoriser mes informations de connexion" value={memoriser} onValueChange={changerMemorisation} disabled={chargement} trackColor={{ true: '#1f176a' }} />
          </View>
          <Text style={s.secondaire}>{Platform.OS === 'web'
            ? 'L’amicale, l’e-mail et le mot de passe seront conservés dans ce navigateur, sans chiffrement. À activer sur un appareil personnel.'
            : 'L’amicale, l’e-mail et le mot de passe seront conservés dans le stockage sécurisé de cet appareil.'}</Text>
          <Bouton disabled={chargement} onPress={connecter}>Se connecter</Bouton>
          {connexionEnregistree && <Bouton secondaire disabled={chargement} onPress={() => effacerConnexion()}>Oublier mes informations de connexion</Bouton>}
        </Carte> : <>
          <View style={s.ligne}><Bouton secondaire disabled={chargement} onPress={actualiser}>Actualiser</Bouton>
            <Bouton secondaire disabled={chargement} onPress={() => { void executer(async () => { await api.current!.logout(); vider(); }); }}>Déconnexion</Bouton></View>
          {connexionEnregistree && <Bouton secondaire disabled={chargement} onPress={() => effacerConnexion()}>Oublier mes informations de connexion</Bouton>}
          {tournee && <Bouton secondaire disabled={chargement} onPress={retour}>{saisie || carnet ? 'Retour aux adresses' : 'Mes tournées'}</Bouton>}
          {!tournee ? <>
            <Text accessibilityRole="header" style={s.sousTitre}>Mes tournées</Text>
            <Selecteur label="Campagne" value={annee} disabled={chargement} onChange={setAnnee}
              options={ [['', 'Toutes les campagnes'], ...[...new Set([String(profil.amicale.campagne), ...tournees.map(t => t.dateDebut.slice(0, 4))])].sort().reverse().map(y => [y, y] as [string, string])] } />
            <Carte><Text style={s.nom}>{totaux.reduce((n, t) => n + t.traitees, 0)} passages · {totaux.reduce((n, t) => n + t.calendriersVendus, 0)} calendriers</Text>
              <Text style={s.nom}>{euros((totaux.reduce((n, t) => n + Math.round(Number(t.montant) * 100), 0) / 100).toFixed(2))} encaissés</Text></Carte>
            {!totaux.length && <Text style={s.secondaire}>Aucune tournée pour cette campagne. Un sapeur voit uniquement ses tournées affectées.</Text>}
            {totaux.map(t => <Carte key={t.id}>
              <Text style={s.nom}>{t.nom}</Text><Text style={s.secondaire}>{t.secteur} · {dateAffichee(t.dateDebut)} · {STATUTS[t.statut]}</Text>
              <Text style={s.secondaire}>{t.traitees}/{t.adresses} adresses traitées · {euros(t.montant)}</Text>
              <BilanCalendriers tournee={t} />
              <Bouton secondaire disabled={chargement} onPress={() => { setConfirmation(''); setFiltres({ ...FILTRES_INITIAUX }); void executer(() => chargerTournee(t.id)); }}>{`Ouvrir ${t.nom}`}</Bouton>
            </Carte>)}
            <BilanCarnets carnets={totaux.flatMap(t => t.carnets)} />
          </> : <>
            <Text accessibilityRole="header" style={s.sousTitre}>{tournee.nom}</Text>
            <Text style={s.secondaire}>{tournee.secteur} · {STATUTS[tournee.statut]} · {tournee.traitees}/{tournee.adresses} traitées · {euros(tournee.montant)}</Text>
            <Carte><BilanCalendriers tournee={tournee} /></Carte>
            {verrouille && <Text style={s.confirmation}>Tournée validée : consultation uniquement.</Text>}
            {saisie ? <Carte>
              <Text accessibilityRole="header" style={s.sousTitre}>{saisie.mode === 'new' ? 'Nouvelle adresse' : saisie.mode === 'duplicate' ? 'Ajouter un appartement' : 'Saisie du passage'}</Text>
              <AdresseForm saisie={saisie} onChange={update} disabled={chargement || verrouille} />
              <Champ label="Date du passage" value={saisie.datePassage} onChange={datePassage => update({ datePassage })} disabled={chargement || verrouille} longueur={10} aide="JJ/MM/AAAA, aujourd’hui ou une date antérieure" />
              <Selecteur label="Résultat du passage" value={saisie.statut} disabled={chargement || verrouille} options={Object.entries(RESULTATS)} onChange={statut => update({ statut: statut as FormulairePassage['statut'] })} />
              {['VENTE', 'DON'].includes(saisie.statut) && <RecuForm carnets={tournee.carnets} saisie={saisie} onChange={update} disabled={chargement || verrouille} />}
              {saisie.statut === 'VENTE' && <>
                <Champ label="Nombre de calendriers" value={saisie.quantite} onChange={quantite => update({ quantite })} disabled={chargement || verrouille} clavier="number-pad" />
                <Champ label="Montant total encaissé (€)" value={saisie.montant} onChange={montant => update({ montant })} disabled={chargement || verrouille} clavier="decimal-pad" />
                <Selecteur label="Moyen de paiement" value={saisie.moyenPaiement} disabled={chargement || verrouille} options={Object.entries(PAIEMENTS)} onChange={moyenPaiement => update({ moyenPaiement: moyenPaiement as FormulairePassage['moyenPaiement'] })} />
              </>}
              <Text style={s.libelle}>Commentaire</Text><TextInput accessibilityLabel="Commentaire" multiline maxLength={2000} editable={!chargement && !verrouille}
                value={saisie.commentaire} onChangeText={commentaire => update({ commentaire })} style={[s.champ, { minHeight: 90, textAlignVertical: 'top' }]} />
              <Bouton disabled={chargement || verrouille} onPress={enregistrer}>Enregistrer le passage</Bouton>
            </Carte> : carnet ? <Carte>
              <Text style={s.sousTitre}>Ajouter un carnet</Text>
              <Champ label="Numéro du carnet" value={carnet.numero} onChange={numero => setCarnet({ ...carnet, numero })} longueur={40} disabled={chargement} />
              <Champ label="Premier reçu" value={carnet.premierRecu} onChange={premierRecu => setCarnet({ ...carnet, premierRecu })} clavier="number-pad" disabled={chargement} />
              <Champ label="Nombre de reçus" value={carnet.nombreRecus} onChange={nombreRecus => setCarnet({ ...carnet, nombreRecus })} clavier="number-pad" disabled={chargement} />
              <Bouton disabled={chargement || verrouille} onPress={ajouterCarnet}>Créer le carnet</Bouton>
            </Carte> : <>
              <BilanCarnets carnets={tournee.carnets} />
              {!verrouille && <>
                <Bouton disabled={chargement} onPress={() => { setErreur(''); setConfirmation(''); setSaisie(formulaire('new', null)); }}>Nouvelle adresse</Bouton>
                {profil.canManage && <Bouton secondaire disabled={chargement} onPress={() => { setErreur(''); setCarnet({ numero: '', premierRecu: '', nombreRecus: '25' }); }}>Ajouter un carnet</Bouton>}
              </>}
              <Carte>
                <Selecteur label="Rue" value={filtres.rue} disabled={chargement} options={ [['', 'Toutes les rues'], ...rues(adresses)] } onChange={rue => setFiltres({ ...filtres, rue })} />
                <Selecteur label="Filtrer par résultat" value={filtres.statut} disabled={chargement} options={ [['', 'Tous les résultats'], ...Object.entries(RESULTATS)] } onChange={statut => setFiltres({ ...filtres, statut })} />
                <Selecteur label="Filtrer par carnet" value={filtres.carnet} disabled={chargement} options={ [['', 'Tous les carnets'], ['sans-carnet', 'Sans carnet'], ...tournee.carnets.map(c => [c.id, c.numero] as [string, string])] } onChange={carnet => setFiltres({ ...filtres, carnet })} />
                <Champ label="Rechercher un reçu" value={filtres.recu} onChange={recu => setFiltres({ ...filtres, recu })} disabled={chargement} clavier="number-pad" aide="Numéro exact du reçu" />
                <Selecteur label="Trier par" value={filtres.tri} disabled={chargement} options={ [['adresse', 'Adresse'], ['montant', 'Montant'], ['resultat', 'Résultat']] } onChange={tri => setFiltres({ ...filtres, tri: tri as typeof filtres.tri })} />
                <Selecteur label="Ordre" value={filtres.decroissant ? 'desc' : 'asc'} disabled={chargement} options={ [['asc', 'Croissant'], ['desc', 'Décroissant']] } onChange={value => setFiltres({ ...filtres, decroissant: value === 'desc' })} />
                <Bouton secondaire onPress={() => setFiltres({ ...FILTRES_INITIAUX })}>Réinitialiser les filtres</Bouton>
              </Carte>
              <Text accessibilityLiveRegion="polite" style={s.libelle}>{visibles.length} / {adresses.length} adresses affichées</Text>
              {!adresses.length && <Text style={s.secondaire}>Aucune adresse dans ce secteur. Vous pouvez ajouter une nouvelle adresse.</Text>}
              {!!adresses.length && !visibles.length && <Text style={s.secondaire}>Aucune adresse ne correspond aux filtres.</Text>}
              {visibles.map(a => <Carte key={a.id}>
                <Text style={s.nom}>{a.ligne1}</Text><Text style={s.secondaire}>{a.codePostal} {a.ville}</Text>
                {!!logement(a) && <Text style={s.secondaire}>{logement(a)}</Text>}
                <Text style={{ color: couleurResultat(a.passage?.statut ?? 'NON_VISITEE'), fontWeight: '700' }}>{RESULTATS[a.passage?.statut ?? 'NON_VISITEE']}{a.passage?.statut === 'VENTE' ? ` · ${a.passage.nbCalendriers} calendrier(s) · ${euros(a.passage.montant)}` : ''}</Text>
                {a.passage && <Text style={s.secondaire}>Passage du {dateAffichee(a.passage.datePassage)}</Text>}
                {a.passage?.recu && <Text style={s.secondaire}>Carnet {a.passage.recu.carnetNumero} · Reçu n° {a.passage.recu.numero}</Text>}
                {a.passage && ['VENTE', 'DON'].includes(a.passage.statut) && !a.passage.recu && <Text style={s.erreur}>Reçu à renseigner lors d’une correction.</Text>}
                {!!a.passage?.commentaire && <Text style={s.secondaire}>{a.passage.commentaire}</Text>}
                {!verrouille && <>
                  <Bouton secondaire disabled={chargement} onPress={() => { setErreur(''); setConfirmation(''); setSaisie(formulaire('existing', a)); }}>{`${a.passage ? 'Modifier' : 'Saisir'} · ${a.ligne1}`}</Bouton>
                  <Bouton secondaire disabled={chargement} onPress={() => { setErreur(''); setConfirmation(''); setSaisie(formulaire('duplicate', a)); }}>{`Ajouter un appartement · ${a.ligne1}`}</Bouton>
                </>}
              </Carte>)}
            </>}
          </>}
          <Text style={s.secondaire}>Une connexion est nécessaire pour enregistrer. Les modifications sont confirmées après leur sauvegarde sur le serveur.</Text>
        </>}
      </View></ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

function BilanCarnets({ carnets }: { carnets: Carnet[] }) {
  return <Carte><Text accessibilityRole="header" style={s.nom}>Reçus par carnet</Text>
    {!carnets.length && <Text style={s.secondaire}>Aucun carnet dans cette sélection.</Text>}
    {carnets.map(c => <View key={c.id} style={s.groupe}><Text style={s.nom}>{c.numero} · {euros(c.montant)}</Text>
      <Text style={s.secondaire}>{c.recusUtilises}/{c.nombreRecus} reçus utilisés · {c.recusDisponibles} disponibles · {c.ventes} ventes · {c.dons} dons · {c.recusAnnules} annulés</Text>
    </View>)}
  </Carte>;
}
