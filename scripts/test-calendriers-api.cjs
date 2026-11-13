/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');
function charger(file) {
  const filename = path.resolve(__dirname, '..', file);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const module = { exports: {} };
  vm.runInThisContext(`(function(exports, module) { ${compiled.outputText}\n})`, { filename })(module.exports, module);
  return module.exports;
}
const rules = charger('utils/calendriersServeur.ts');
const { CalendriersApi, normaliserUrlApi } = charger('utils/calendriersApi.ts');
const address = { id: 'address1', ligne1: '12 T Rue Traversière', codePostal: '10000', ville: 'Troyes', batiment: 'A', etage: '2', appartement: '4', porte: 'Gauche', complement: null,
  passage: { statut: 'VENTE', nbCalendriers: 1, montant: '12.30', moyenPaiement: 'CB', datePassage: '2025-11-06', commentaire: 'Ancien', recu: { id: 'r1', carnetId: 'c1', carnetNumero: 'C1', numero: 102 } } };
const books = [{ id: 'c1', numero: 'C1', recus: [{ id: 'r1', numero: 102, utilise: true, annule: false }, { id: 'r2', numero: 103, utilise: false, annule: false }, { id: 'r3', numero: 104, utilise: true, annule: true }] }];

test('Un nouvel appartement copie la voie et vide les quatre précisions, le passage et le reçu', () => {
  const f = rules.formulaire('duplicate', address);
  assert.equal(f.ligne1, address.ligne1);
  for (const key of ['batiment', 'etage', 'appartement', 'porte', 'carnetId', 'recuId', 'commentaire', 'montant']) assert.equal(f[key], '');
  assert.deepEqual(rules.recusSelectionnables(books[0], f).map(r => r.id), ['r2']);
  assert.throws(() => rules.payloadPassage({ ...f, statut: 'ABSENT' }, books), /logement/);
});
test('Une correction garde le reçu courant ; un don envoie zéro et aucun paiement', () => {
  const f = rules.formulaire('existing', address);
  assert.deepEqual(rules.recusSelectionnables(books[0], f).map(r => r.id), ['r1', 'r2']);
  const sale = rules.payloadPassage({ ...f, montant: '12,30' }, books);
  assert.equal(sale.montant, '12.30'); assert.equal(sale.moyenPaiement, 'CB'); assert.equal(sale.datePassage, '2025-11-06');
  const donation = rules.payloadPassage({ ...f, statut: 'DON' }, books);
  assert.equal(donation.nbCalendriers, 0); assert.equal(donation.montant, '0.00'); assert.equal(donation.moyenPaiement, null); assert.equal(donation.recuId, 'r1');
  const refusal = rules.payloadPassage({ ...f, statut: 'REFUS', porte: '' }, books);
  assert.equal(refusal.recuId, null); assert.equal(refusal.carnetId, null); assert.equal(refusal.porte, null);
});
test('Une adresse exceptionnelle impose la voie, le code postal et la ville ; les dates et montants sont validés', () => {
  const f = { ...rules.formulaire('new', null), statut: 'ABSENT' };
  assert.throws(() => rules.payloadPassage(f, books), /numéro et la voie/);
  const valid = { ...f, ligne1: '2 avenue Nouvelle', codePostal: '10000', ville: 'Troyes', datePassage: '29/02/2024' };
  assert.equal(rules.payloadPassage(valid, books).datePassage, '2024-02-29');
  for (const datePassage of ['29/02/2025', '01/01/2100', '2025-01-01', '31/04/2025']) assert.throws(() => rules.payloadPassage({ ...valid, datePassage }, books), /date de passage/);
  for (const montant of ['-2', '1.234', 'NaN']) assert.throws(() => rules.payloadPassage({ ...rules.formulaire('existing', address), montant }, books), /montant/);
  assert.throws(() => rules.payloadPassage({ ...rules.formulaire('existing', address), recuId: 'r3' }, books), /reçu disponible/);
});
test('Les filtres se combinent, les suffixes de numéro sont retirés et le tri est naturel', () => {
  const addresses = ['12 T Rue Traversière', '14bis Rue Traversière', '16 B Rue Traversière', '18B Rue Traversière', '2 avenue Nouvelle'].map((ligne1, i) => ({ ...address, id: String(i), ligne1, passage: i === 4 ? null : address.passage }));
  assert.equal(rules.rues(addresses).length, 2);
  const filter = { ...rules.FILTRES_INITIAUX, rue: 'rue traversière', statut: 'VENTE', carnet: 'c1', recu: '00102' };
  assert.equal(rules.filtrerAdresses(addresses, filter).length, 4);
  assert.equal(rules.filtrerAdresses(addresses, { ...filter, recu: '10' }).length, 0);
  assert.equal(rules.filtrerAdresses(addresses, rules.FILTRES_INITIAUX)[0].ligne1, '2 avenue Nouvelle');
  assert.equal(rules.couleurResultat('VENTE'), rules.couleurResultat('DON'));
  assert.equal(rules.couleurResultat('ABSENT'), rules.couleurResultat('A_REVOIR'));
});
test('Le client utilise les cookies, le CSRF et les routes atomiques, sans rejouer une écriture', async () => {
  const calls = [];
  const transport = async (url, options) => {
    calls.push({ url, options });
    const data = url.endsWith('/session') ? { csrfToken: 'csrf-test', user: { id: 'user' } } : {};
    return new Response(JSON.stringify(data), { status: 200 });
  };
  const client = new CalendriersApi('http://localhost:18080', transport);
  await client.login('Troyes10', 'user@example.test', 'password');
  await client.enregistrer('tour', 'existing', 'address', { statut: 'ABSENT' });
  await client.enregistrer('tour', 'duplicate', 'address', { statut: 'ABSENT' });
  await client.enregistrer('tour', 'new', undefined, { statut: 'ABSENT' });
  assert(calls.every(c => c.options.credentials === 'include'));
  const writes = calls.filter(c => c.options.method !== 'GET');
  assert(writes.every(c => c.options.headers['X-CSRF-Token'] === 'csrf-test'));
  assert.equal(writes[1].options.method, 'PUT'); assert(writes[1].url.endsWith('/tournees/tour/passages/address'));
  assert(writes[2].url.endsWith('/tournees/tour/adresses/address/dupliquer')); assert(writes[3].url.endsWith('/tournees/tour/adresses'));
  let count = 0;
  const offline = new CalendriersApi('http://localhost', async () => { count++; throw new TypeError('offline'); });
  await assert.rejects(offline.enregistrer('t', 'new', undefined, {}), /Actualisez la tournée/); assert.equal(count, 1);
  const conflict = new CalendriersApi('http://localhost', async () => new Response(JSON.stringify({ error: 'Reçu déjà utilisé', code: 'CONFLICT' }), { status: 409 }));
  await assert.rejects(conflict.enregistrer('t', 'new', undefined, {}), e => e.status === 409 && e.message === 'Reçu déjà utilisé');
});
test('Les erreurs de session et les URL invalides sont explicites', async () => {
  assert.equal(normaliserUrlApi('https://example.test/'), 'https://example.test/api');
  assert.equal(normaliserUrlApi('https://example.test/prefix/api/'), 'https://example.test/prefix/api');
  for (const url of ['example.test', 'file:///tmp/api', 'https://user:password@example.test', 'https://example.test?token=x']) assert.throws(() => normaliserUrlApi(url));
  const client = new CalendriersApi('http://localhost', async () => new Response(JSON.stringify({ error: 'Session expirée', code: 'INVALID_CSRF' }), { status: 403 }));
  await assert.rejects(client.request('/tournees', 'POST', {}), e => e.sessionExpiree);
});

test('Le client appelle fetch sans lui imposer le contexte de son instance', async () => {
  const transport = async function () {
    'use strict';
    assert.equal(this, undefined, 'Le fetch du navigateur refuse un contexte CalendriersApi');
    return new Response(JSON.stringify({ csrfToken: 'csrf-test', user: null }), { status: 200 });
  };
  const client = new CalendriersApi('http://localhost:18080', transport);
  assert.equal(await client.session(), null);
});

test('Dans une rue, le tri compare le numéro et ignore les suffixes, dans les deux sens', () => {
  const lines = ['171 rue Exemple', '3t rue Exemple', '2 rue Exemple', '3 ter rue Exemple', '10 rue Exemple', '3 rue Exemple', ' 003 bis rue Exemple'];
  const addresses = lines.map((ligne1, i) => ({ ...address, id: String(i), ligne1 }));
  const sort = (decroissant = false) => rules.filtrerAdresses(addresses, { ...rules.FILTRES_INITIAUX, decroissant }).map(a => a.ligne1);
  assert.deepEqual(sort(), [lines[2], lines[1], lines[3], lines[5], lines[6], lines[4], lines[0]]);
  assert.deepEqual(sort(true), [lines[0], lines[4], lines[1], lines[3], lines[5], lines[6], lines[2]]);
  assert.deepEqual(addresses.map(a => a.ligne1), lines, 'Le tri ne modifie pas les données sources');
  const withoutNumber = { ...address, id: 'without-number', ligne1: 'rue Exemple' };
  assert.equal(rules.filtrerAdresses([withoutNumber, ...addresses], rules.FILTRES_INITIAUX).at(-1).id, withoutNumber.id);
});

test('Le tri groupe les rues avant de comparer leurs numéros et garde les filtres combinés', () => {
  const lines = ['2 rue Zola', '171 rue Alpha', '3t rue Alpha', '2 rue Alpha', '3 ter RUE Alpha', '10 rue Zola', '3 rue Alpha'];
  const addresses = lines.map((ligne1, i) => ({ ...address, id: String(i), ligne1 }));
  const sorted = rules.filtrerAdresses(addresses, rules.FILTRES_INITIAUX);
  assert.deepEqual(sorted.map(a => a.id), ['3', '2', '4', '6', '1', '0', '5']);
  assert.deepEqual(rules.filtrerAdresses(addresses, { ...rules.FILTRES_INITIAUX, decroissant: true }).map(a => a.id), ['5', '0', '1', '2', '4', '6', '3']);
  assert.deepEqual(rules.filtrerAdresses(addresses, { ...rules.FILTRES_INITIAUX, rue: 'rue alpha', carnet: 'c1', recu: '102' }).map(a => a.id), ['3', '2', '4', '6', '1']);
  assert.deepEqual(addresses.map(a => a.ligne1), lines);
});

test('Les équipes affichent le nom renseigné et gardent un libellé pour les anciens comptes', () => {
  assert.equal(rules.nomSapeur({ nom: 'Élodie Martin', email: 'login@example.test' }), 'Élodie Martin');
  assert.equal(rules.nomSapeur({ nom: null, email: 'ancien@example.test' }), 'ancien@example.test');
});
