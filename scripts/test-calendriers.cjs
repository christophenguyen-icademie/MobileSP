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
const { TOURNEES_DEMONSTRATION: tournees } = chargerModule('constants/calendriers.ts');
const tournee = tournees[0];
const saisie = { statut: 'VENTE', quantite: '2', montant: '10,50', moyenPaiement: 'CHEQUE', commentaire: '  Reçu remis  ' };
const vente = (modifications = {}) => metier.creerPassage(tournee, tournee.adresses[0], { ...saisie, ...modifications });

test('La vente accepte les décimales françaises et conserve un montant exact', () => {
  const passage = vente();
  assert.equal(passage.montant, '10.50');
  assert.equal(passage.nbCalendriers, 2);
  assert.equal(passage.commentaire, 'Reçu remis');
  assert.equal(vente({ montant: '0003.5' }).montant, '3.50');
  const dixCentimes = vente({ quantite: '1', montant: '0,10' });
  assert.equal(metier.bilanPassages(Array(10).fill(dixCentimes)).montantCentimes, 100);
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
  assert.deepEqual(metier.decoderPassages(metier.encoderPassages([passage])), [passage]);
  for (const contenu of ['{', '{}', '{"version":2,"passages":[]}', JSON.stringify({ version: 1, passages: [passage, passage] }),
    JSON.stringify({ version: 1, passages: [{ ...passage, montant: '-1.00' }] }),
    JSON.stringify({ version: 1, passages: [{ ...passage, statut: 'REFUS' }] })]) {
    assert.throws(() => metier.decoderPassages(contenu));
  }
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
  assert.deepEqual(await ouvrir().chargerPassages(), []);
  const passage = vente();
  await ouvrir().enregistrerPassages([passage]);
  assert.deepEqual(await ouvrir().chargerPassages(), [passage]);
  echec = true;
  await assert.rejects(ouvrir().enregistrerPassages([vente({ statut: 'REFUS' })]), /Disque plein/);
  assert.deepEqual(await ouvrir().chargerPassages(), [passage]);
  fichiers.set(`${fichier}.tmp`, fichiers.get(fichier));
  fichiers.delete(fichier);
  assert.deepEqual(await ouvrir().chargerPassages(), [passage]);
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
    assert.deepEqual(await ouvrir().chargerPassages(), []);
    await ouvrir().enregistrerPassages([passage]);
    assert.deepEqual(await ouvrir().chargerPassages(), [passage]);
    echec = true;
    await assert.rejects(ouvrir().enregistrerPassages([]), /Quota/);
    assert.deepEqual(await ouvrir().chargerPassages(), [passage]);
  } finally {
    if (original === undefined) delete global.window;
    else global.window = original;
  }
});
