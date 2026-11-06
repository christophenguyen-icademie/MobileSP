// node --test scripts/test-calendriers.cjs
/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const racine = path.resolve(__dirname, '..');

function chargerModule(fichier, mocks = {}) {
  const cache = new Map();
  function charger(cible) {
    if (cache.has(cible)) return cache.get(cible).exports;
    const module = { exports: {} };
    cache.set(cible, module);
    const { outputText } = ts.transpileModule(fs.readFileSync(cible, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    });
    const executer = vm.runInThisContext(`(function(exports, require, module) { ${outputText}\n})`, { filename: cible });
    executer(module.exports, nom => {
      if (Object.hasOwn(mocks, nom)) return mocks[nom];
      const relatif = nom.startsWith('@/') ? path.join(racine, nom.slice(2)) : path.resolve(path.dirname(cible), nom);
      return charger(`${relatif}.ts`);
    }, module);
    return module.exports;
  }
  return charger(path.join(racine, fichier));
}

const metier = chargerModule('utils/calendriers.ts');
const { TOURNEES_DEMONSTRATION: tournees, CARNETS_DEMONSTRATION: carnets } = chargerModule('constants/calendriers.ts');
const tournee = tournees[0];
const saisie = { datePassage: '15/10/2025', numeroCarnet: carnets[0].numero, numeroRecu: '00001', statut: 'VENTE', quantite: '2', montant: '10,50', moyenPaiement: 'CHEQUE', commentaire: '  Reçu remis  ' };
const vente = (modifications = {}) => metier.creerPassage(tournee, tournee.adresses[0], { ...saisie, ...modifications });
const donneesPour = (passages = [], adresses = []) => ({
  passages, adresses,
  recusUtilises: passages.filter(p => p.numeroCarnet).map(p => ({
    numeroCarnet: p.numeroCarnet, numeroRecu: p.numeroRecu, tourneeId: p.tourneeId, adresseId: p.adresseId,
  })),
});
const saisieAdresse = {
  ligne1: '24 rue des Écoles', ville: 'Troyes', codePostal: '10000', batiment: ' A ', etage: ' 2 ', appartement: ' 12B ',
};
const nouvelleAdresse = (modifications = {}) => metier.creerAdresse(tournee, { ...saisieAdresse, ...modifications });

test('La vente accepte les décimales françaises et conserve un montant exact', () => {
  const passage = vente();
  assert.equal(passage.montant, '10.50');
  assert.equal(passage.nbCalendriers, 2);
  assert.equal(passage.commentaire, 'Reçu remis');
  assert.equal(vente({ montant: '0003.5' }).montant, '3.50');
  const dixCentimes = vente({ quantite: '1', montant: '0,10' });
  assert.equal(metier.bilanPassages(Array(10).fill(dixCentimes)).montantCentimes, 100);
});

test('CB et DON sont conservés dans le passage et après rechargement', () => {
  for (const moyenPaiement of ['CB', 'DON']) {
    const passage = vente({ moyenPaiement });
    const donnees = donneesPour([passage]);
    assert.equal(passage.moyenPaiement, moyenPaiement);
    assert.deepEqual(metier.decoderCalendriers(metier.encoderCalendriers(donnees)), donnees);
    assert.equal(metier.bilanPassages([passage]).montantCentimes, 1050);
  }
});

test('Une adresse ajoutée conserve son logement et permet de saisir un passage', () => {
  const adresse = nouvelleAdresse();
  assert.equal(adresse.appartement, '12B');
  assert.equal(adresse.etage, '2');
  assert.equal(adresse.batiment, 'A');
  assert.equal(adresse.tourneeId, tournee.id);
  assert.notEqual(adresse.id, nouvelleAdresse().id);
  const resultat = metier.appliquerAdressesLocales(tournees, [adresse]);
  assert.equal(resultat[0].adresses.length, tournee.adresses.length + 1);
  assert.equal(resultat[1].adresses.length, tournees[1].adresses.length);
  assert.equal(tournee.adresses.length, 6);
  const passage = metier.creerPassage(resultat[0], adresse, saisie);
  assert.equal(metier.passagesTournee([passage], resultat[0]).length, 1);
});

test('Deux logements de la même rue sont distincts et les doublons sont signalés', () => {
  const adresse = nouvelleAdresse();
  const [avecAdresse] = metier.appliquerAdressesLocales([tournee], [adresse]);
  assert.throws(() => metier.creerAdresse(avecAdresse, saisieAdresse), /existe déjà/);
  assert.throws(() => metier.creerAdresse(avecAdresse, { ...saisieAdresse, ligne1: '  24 RUE DES ECOLES  ' }), /existe déjà/);
  assert.notEqual(metier.creerAdresse(avecAdresse, { ...saisieAdresse, appartement: '13' }).id, adresse.id);
  assert.throws(() => nouvelleAdresse({ ligne1: ' ' }), /numéro et la voie/);
  assert.throws(() => nouvelleAdresse({ ville: '' }), /ville/);
  assert.throws(() => nouvelleAdresse({ appartement: 'A'.repeat(21) }), /longueur/);
  assert.throws(() => metier.creerAdresse({ ...tournee, statut: 'VALIDEE' }, saisieAdresse), /validée/);
});

test('Compléter une adresse existante préserve son identifiant et son passage', () => {
  const passage = vente();
  const adresse = metier.creerAdresse(tournee, {
    ...saisieAdresse, ligne1: tournee.adresses[0].ligne1, ville: tournee.adresses[0].ville,
  }, tournee.adresses[0].id);
  let locales = metier.remplacerAdresseLocale([], adresse);
  locales = metier.remplacerAdresseLocale(locales, { ...adresse, etage: 'RDC' });
  assert.equal(locales.length, 1);
  const resultat = metier.appliquerAdressesLocales(tournees, locales);
  assert.equal(resultat[0].adresses.length, tournee.adresses.length);
  assert.equal(resultat[0].adresses[0].etage, 'RDC');
  assert.equal(metier.passagesTournee([passage], resultat[0]).length, 1);
  assert.equal(metier.bilanPassages([passage]).montantCentimes, 1050);
});

test('Les quantités et montants invalides ne peuvent pas être enregistrés', () => {
  for (const quantite of ['', '0', '-1', '1.5', '1e2', 'Infinity', '9007199254740992']) {
    assert.throws(() => vente({ quantite }), /nombre entier/);
  }
  for (const montant of ['', '-1', '1,234', 'NaN', '1e2', '10000000', '1,2.3']) {
    assert.throws(() => vente({ montant }), /montant/);
  }
  assert.throws(() => vente({ moyenPaiement: 'INCONNU' }), /paiement/);
});

test('Passer une vente en refus, absence ou à revoir retire son encaissement', () => {
  for (const statut of ['REFUS', 'ABSENT', 'A_REVOIR']) {
    const passage = vente({ statut });
    assert.equal(passage.nbCalendriers, 0);
    assert.equal(passage.montant, '0.00');
    assert.equal(passage.moyenPaiement, null);
    assert.equal(metier.bilanPassages([passage]).montantCentimes, 0);
  }
});

test('Une modification remplace le passage et reste limitée à sa tournée', () => {
  const premier = vente();
  const autreTournee = { ...premier, tourneeId: tournees[1].id };
  const secondeAdresse = { ...premier, adresseId: tournee.adresses[1].id };
  const refus = vente({ statut: 'REFUS' });
  const resultat = metier.remplacerPassage([premier, autreTournee, secondeAdresse], refus);
  assert.equal(resultat.length, 3);
  assert.ok(resultat.includes(autreTournee));
  assert.equal(metier.passagesTournee(resultat, tournee).length, 2);
  assert.equal(metier.bilanPassages(metier.passagesTournee(resultat, tournee)).montantCentimes, 1050);
  assert.equal(metier.passagesTournee(resultat, tournees[1]).length, 0);
});

test('Une tournée validée et une adresse hors tournée refusent les écritures', () => {
  assert.throws(() => metier.creerPassage({ ...tournee, statut: 'VALIDEE' }, tournee.adresses[0], saisie), /validée/);
  assert.throws(() => metier.creerPassage(tournee, tournees[1].adresses[0], saisie), /ne fait pas partie/);
});

test('Le stockage refuse les données corrompues, les doublons et les versions inconnues', () => {
  const passage = vente();
  const donnees = donneesPour([passage], [nouvelleAdresse()]);
  assert.deepEqual(metier.decoderCalendriers(metier.encoderCalendriers(donnees)), donnees);
  for (const contenu of ['{', '{}', '{"version":4,"passages":[]}', '{"version":"1","passages":[]}', JSON.stringify({ version: 1, passages: [passage, passage] }),
    JSON.stringify({ version: 1, passages: [{ ...passage, montant: '-1.00' }] }),
    JSON.stringify({ version: 1, passages: [{ ...passage, statut: 'REFUS' }] }),
    JSON.stringify({ version: 2, passages: [], adresses: [donnees.adresses[0], donnees.adresses[0]] }),
    JSON.stringify({ version: 2, passages: [], adresses: [{ ...donnees.adresses[0], etage: 2 }] })]) {
    assert.throws(() => metier.decoderCalendriers(contenu));
  }
});

test('Le format précédent recharge tous les passages sans perte ni adresse inventée', () => {
  const passage = vente();
  assert.deepEqual(metier.decoderCalendriers(JSON.stringify({ version: 1, passages: [passage] })), donneesPour([passage]));
});

test('La sauvegarde native survit à un nouveau chargement et à un échec d’écriture', async () => {
  const fichiers = new Map();
  let echec = false;
  const fichier = 'file:///documents/calendriersp-demo-passages-v1.json';
  const fileSystem = {
    documentDirectory: 'file:///documents/',
    getInfoAsync: async cible => ({ exists: fichiers.has(cible) }),
    readAsStringAsync: async cible => fichiers.get(cible),
    writeAsStringAsync: async (cible, contenu) => {
      if (echec) throw new Error('Disque plein');
      fichiers.set(cible, contenu);
    },
    moveAsync: async ({ from, to }) => { fichiers.set(to, fichiers.get(from)); fichiers.delete(from); },
  };
  const ouvrir = () => chargerModule('utils/calendriersStorage.ts', { 'expo-file-system/legacy': fileSystem });
  assert.deepEqual(await ouvrir().chargerCalendriers(), donneesPour());
  const passage = vente();
  const donnees = donneesPour([passage], [nouvelleAdresse()]);
  await ouvrir().enregistrerCalendriers(donnees);
  assert.deepEqual(await ouvrir().chargerCalendriers(), donnees);
  echec = true;
  await assert.rejects(ouvrir().enregistrerCalendriers({ ...donnees, passages: [vente({ statut: 'REFUS' })] }), /Disque plein/);
  assert.deepEqual(await ouvrir().chargerCalendriers(), donnees);
  fichiers.set(`${fichier}.tmp`, fichiers.get(fichier));
  fichiers.delete(fichier);
  assert.deepEqual(await ouvrir().chargerCalendriers(), donnees);
  await assert.rejects(ouvrir().enregistrerCalendriers(donneesPour()), /changé/);
  assert.deepEqual(await ouvrir().chargerCalendriers(), donnees);
});

test('La version web recharge les saisies et signale un quota dépassé', async () => {
  const original = global.window;
  const valeurs = new Map();
  let echec = false;
  global.window = { localStorage: {
    getItem: cle => valeurs.get(cle) ?? null,
    setItem: (cle, contenu) => { if (echec) throw new Error('Quota dépassé'); valeurs.set(cle, contenu); },
  } };
  try {
    const ouvrir = () => chargerModule('utils/calendriersStorage.web.ts');
    const passage = vente();
    const donnees = donneesPour([passage], [nouvelleAdresse()]);
    assert.deepEqual(await ouvrir().chargerCalendriers(), donneesPour());
    valeurs.set('mobilesp.calendriers.demo.v1', JSON.stringify({ version: 1, passages: [passage] }));
    assert.deepEqual(await ouvrir().chargerCalendriers(), donneesPour([passage]));
    await ouvrir().enregistrerCalendriers(donnees);
    assert.deepEqual(await ouvrir().chargerCalendriers(), donnees);
    echec = true;
    await assert.rejects(ouvrir().enregistrerCalendriers(donnees), /Quota/);
    assert.deepEqual(await ouvrir().chargerCalendriers(), donnees);
  } finally {
    if (original === undefined) delete global.window;
    else global.window = original;
  }
});


test('Les carnets d’exemple sont uniques et contiennent chacun 25 reçus à cinq chiffres', () => {
  assert.equal(carnets.length, 3);
  assert.equal(new Set(carnets.map(c => c.numero)).size, carnets.length);
  for (const carnet of carnets) {
    assert.equal(carnet.recus.length, 25);
    assert.equal(new Set(carnet.recus).size, 25);
    assert.ok(carnet.recus.every(numero => /^\d{5}$/.test(numero)));
    assert.equal(carnet.recus[0], '00001');
    assert.equal(carnet.recus[24], '00025');
  }
});

test('Toutes les ventes exigent un carnet connu et un reçu à cinq chiffres de ce carnet', () => {
  for (const numeroCarnet of ['', 'inconnu']) assert.throws(() => vente({ numeroCarnet }), /carnet/);
  for (const numeroRecu of ['', '1', '1234', '000001', '12A45', ' 00001']) {
    assert.throws(() => vente({ numeroRecu }), /5 chiffres/);
  }
  assert.throws(() => vente({ numeroRecu: '00026' }), /partie du carnet/);
  for (const moyenPaiement of ['ESPECES', 'CHEQUE', 'CB', 'DON', 'AUTRE']) {
    assert.throws(() => vente({ moyenPaiement, numeroRecu: '' }), /5 chiffres/);
  }
  assert.equal(vente({ statut: 'REFUS', numeroRecu: '', numeroCarnet: '' }).numeroRecu, null);
});

test('Un reçu ne peut être repris à une autre adresse ou dans une autre tournée', () => {
  const donnees = metier.enregistrerPassageLocal(donneesPour(), tournee, tournee.adresses[0], saisie);
  assert.throws(() => metier.enregistrerPassageLocal(donnees, tournee, tournee.adresses[1], saisie), /déjà été utilisé/);
  assert.throws(() => metier.enregistrerPassageLocal(donnees, tournees[1], tournees[1].adresses[0], saisie), /déjà été utilisé/);
  assert.ok(!metier.recusDisponibles(donnees, carnets[0].numero, tournees[1].id, tournees[1].adresses[0].id).includes('00001'));
  const autreCarnet = metier.enregistrerPassageLocal(donnees, tournees[1], tournees[1].adresses[0], {
    ...saisie, numeroCarnet: carnets[1].numero,
  });
  assert.equal(autreCarnet.recusUtilises.length, 2);
});

test('Modifier sa vente conserve son reçu ; un reçu remplacé ou annulé ne peut être réutilisé', () => {
  const adresse = tournee.adresses[0];
  let donnees = metier.enregistrerPassageLocal(donneesPour(), tournee, adresse, saisie);
  donnees = metier.enregistrerPassageLocal(donnees, tournee, adresse, { ...saisie, montant: '15' });
  assert.equal(donnees.recusUtilises.length, 1);
  assert.equal(donnees.passages.length, 1);
  assert.equal(metier.bilanCarnets(donnees.passages)[0].montantCentimes, 1500);
  donnees = metier.enregistrerPassageLocal(donnees, tournee, adresse, { ...saisie, numeroRecu: '00002' });
  assert.equal(donnees.recusUtilises.length, 2);
  assert.throws(() => metier.enregistrerPassageLocal(donnees, tournee, adresse, saisie), /déjà été utilisé/);
  donnees = metier.enregistrerPassageLocal(donnees, tournee, adresse, { ...saisie, statut: 'REFUS' });
  donnees = metier.decoderCalendriers(metier.encoderCalendriers(donnees));
  assert.equal(donnees.recusUtilises.length, 2);
  assert.deepEqual(metier.bilanCarnets(donnees.passages), []);
  for (const numeroRecu of ['00001', '00002']) {
    assert.throws(() => metier.enregistrerPassageLocal(donnees, tournee, adresse, { ...saisie, numeroRecu }), /déjà été utilisé/);
  }
});

test('Un carnet épuisé refuse un vingt-sixième reçu, tout en permettant de corriger sa vente', () => {
  const adresses = Array.from({ length: 26 }, (_, index) => ({ ...tournee.adresses[0], id: `test-${index}` }));
  const complete = { ...tournee, adresses };
  let donnees = donneesPour();
  for (let i = 0; i < 25; i++) {
    donnees = metier.enregistrerPassageLocal(donnees, complete, adresses[i], { ...saisie, numeroRecu: carnets[0].recus[i] });
  }
  assert.deepEqual(metier.recusDisponibles(donnees, carnets[0].numero, complete.id, adresses[25].id), []);
  assert.deepEqual(metier.recusDisponibles(donnees, carnets[0].numero, complete.id, adresses[0].id), ['00001']);
  assert.throws(() => metier.enregistrerPassageLocal(donnees, complete, adresses[25], saisie), /déjà été utilisé/);
  donnees = metier.enregistrerPassageLocal(donnees, complete, adresses[0], { ...saisie, montant: '1' });
  assert.equal(donnees.recusUtilises.length, 25);
});

test('Le bilan compte les reçus de vente par carnet avec des montants exacts et par tournée', () => {
  let donnees = metier.enregistrerPassageLocal(donneesPour(), tournee, tournee.adresses[0], { ...saisie, montant: '0,10' });
  donnees = metier.enregistrerPassageLocal(donnees, tournee, tournee.adresses[1], { ...saisie, numeroRecu: '00002', montant: '0,20' });
  donnees = metier.enregistrerPassageLocal(donnees, tournee, tournee.adresses[2], { ...saisie, numeroCarnet: carnets[1].numero, montant: '3' });
  donnees = metier.enregistrerPassageLocal(donnees, tournees[1], tournees[1].adresses[0], { ...saisie, numeroRecu: '00003', montant: '5' });
  const bilan = metier.bilanCarnets(metier.passagesTournee(donnees.passages, tournee));
  assert.deepEqual(bilan, [
    { numeroCarnet: carnets[0].numero, nbRecus: 2, nbVentes: 2, montantCentimes: 30 },
    { numeroCarnet: carnets[1].numero, nbRecus: 1, nbVentes: 1, montantCentimes: 300 },
  ]);
  assert.equal(metier.bilanCarnets(donnees.passages)[0].montantCentimes, 530);
});

test('Le stockage refuse les reçus dupliqués, hors carnet ou réattribués et conserve leur historique', () => {
  const passage = vente();
  const donnees = donneesPour([passage]);
  const json = modifications => JSON.stringify({ version: 3, ...donnees, ...modifications });
  assert.throws(() => metier.decoderCalendriers(json({ passages: [passage, { ...passage, tourneeId: 'autre' }] })), /plusieurs fois/);
  assert.throws(() => metier.decoderCalendriers(json({ recusUtilises: [...donnees.recusUtilises, ...donnees.recusUtilises] })), /plusieurs fois/);
  assert.throws(() => metier.decoderCalendriers(json({ passages: [{ ...passage, numeroRecu: '00026' }] })), /invalide/);
  assert.throws(() => metier.decoderCalendriers(json({ recusUtilises: [] })), /attribution/);
  assert.throws(() => metier.decoderCalendriers(json({ recusUtilises: [{ ...donnees.recusUtilises[0], adresseId: 'autre' }] })), /attribution/);
  assert.throws(() => metier.verifierConservationRecus(donnees, donneesPour()), /changé/);
  assert.throws(() => metier.verifierConservationRecus(donnees, {
    ...donnees, recusUtilises: [{ ...donnees.recusUtilises[0], adresseId: 'autre' }],
  }), /changé/);
});

test('Les passages anciens sans reçu migrent sans perte, avec la date de leur ancienne sauvegarde', () => {
  const { datePassage, numeroCarnet, numeroRecu, ...ancien } = vente();
  ancien.updatedAt = '2024-02-29T12:00:00.000Z';
  for (const version of [1, 2]) {
    const resultat = metier.decoderCalendriers(JSON.stringify({ version, passages: [ancien], adresses: [] }));
    assert.deepEqual(resultat.passages[0], { ...ancien, datePassage: '2024-02-29', numeroCarnet: null, numeroRecu: null });
    assert.deepEqual(resultat.recusUtilises, []);
    assert.deepEqual(metier.decoderCalendriers(metier.encoderCalendriers(resultat)), resultat);
    assert.equal(metier.bilanCarnets(resultat.passages)[0].nbRecus, 0);
    assert.equal(metier.bilanCarnets(resultat.passages)[0].montantCentimes, 1050);
    assert.throws(() => metier.enregistrerPassageLocal(resultat, tournee, tournee.adresses[0], { ...saisie, numeroCarnet: '' }), /carnet/);
  }
});

test('La date du passage peut être antérieure et reste distincte de la date réelle de sauvegarde', () => {
  const avant = Date.now();
  for (const statut of ['VENTE', 'REFUS', 'ABSENT', 'A_REVOIR']) {
    const passage = vente({ statut, datePassage: '29/02/2024' });
    assert.equal(passage.datePassage, '2024-02-29');
    assert.ok(Date.parse(passage.updatedAt) >= avant && Date.parse(passage.updatedAt) <= Date.now());
    const rechargement = metier.decoderCalendriers(metier.encoderCalendriers(donneesPour([passage])));
    assert.equal(rechargement.passages[0].datePassage, '2024-02-29');
    assert.equal(rechargement.passages[0].updatedAt, passage.updatedAt);
  }
  const aujourdHui = metier.afficherDatePassage(metier.dateLocale());
  assert.equal(vente({ datePassage: aujourdHui }).datePassage, metier.dateLocale());
  assert.equal(metier.dateLocale(new Date(2024, 1, 29, 23, 55)), '2024-02-29');
});

test('Les dates impossibles, absentes ou futures sont refusées sans normalisation silencieuse', () => {
  for (const datePassage of ['', '31/04/2024', '29/02/2025', '00/11/2025', '15/13/2025', '1/1/2025', '2025-01-01', '01/01/2025abc']) {
    assert.throws(() => vente({ datePassage }), /date de passage valide/);
  }
  const demain = new Date();
  demain.setDate(demain.getDate() + 1);
  assert.throws(() => vente({ datePassage: metier.afficherDatePassage(metier.dateLocale(demain)) }), /futur/);
  const donnees = donneesPour([vente()]);
  for (const datePassage of ['2025-02-29', '2024-04-31', undefined]) {
    assert.throws(() => metier.decoderCalendriers(JSON.stringify({ version: 3, ...donnees, passages: [{ ...donnees.passages[0], datePassage }] })), /invalide/);
  }
});

test('Une saisie web périmée ne peut pas écraser le reçu enregistré depuis un autre écran', async () => {
  const original = global.window;
  const valeurs = new Map();
  global.window = { localStorage: {
    getItem: cle => valeurs.get(cle) ?? null,
    setItem: (cle, contenu) => valeurs.set(cle, contenu),
  } };
  try {
    const stockage = chargerModule('utils/calendriersStorage.web.ts');
    const premier = metier.enregistrerPassageLocal(donneesPour(), tournee, tournee.adresses[0], saisie);
    const perime = metier.enregistrerPassageLocal(donneesPour(), tournees[1], tournees[1].adresses[0], saisie);
    await stockage.enregistrerCalendriers(premier);
    await assert.rejects(stockage.enregistrerCalendriers(perime), /changé/);
    assert.deepEqual(await stockage.chargerCalendriers(), premier);
  } finally {
    if (original === undefined) delete global.window;
    else global.window = original;
  }
});
