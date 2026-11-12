/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const key = 'mobilesp.calendriers.connexion.v1';
const credentials = { serveur: 'https://amicale.example/api', amicale: 'troyes10', email: 'sapeur@example.test', password: '  Test-seulement-123!  ' };

function charger(file, mocks = {}) {
  const cache = new Map();
  function lire(filename) {
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
    const run = vm.runInThisContext(`(function(exports, require, module) { ${outputText}\n})`, { filename });
    run(module.exports, name => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      return lire(path.resolve(path.dirname(filename), name + '.ts'));
    }, module);
    return module.exports;
  }
  return lire(path.join(root, file));
}

test('Le stockage web ne crée rien à la lecture, préserve les trois valeurs au rechargement et permet de les effacer', async () => {
  const previous = global.window;
  const values = new Map();
  global.window = { localStorage: {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  } };
  try {
    const storage = charger('utils/calendriersConnexion.web.ts');
    assert.equal(await storage.chargerConnexion(), null);
    assert.equal(values.size, 0);
    await storage.enregistrerConnexion(credentials);
    const restarted = charger('utils/calendriersConnexion.web.ts');
    assert.deepEqual(await restarted.chargerConnexion(), credentials);
    await restarted.oublierConnexion();
    assert.equal(await storage.chargerConnexion(), null);
    assert.equal(values.has(key), false);
  } finally { if (previous === undefined) delete global.window; else global.window = previous; }
});

test('Le stockage natif utilise le coffre système, conserve exactement le mot de passe et supprime réellement son entrée', async () => {
  const values = new Map();
  let options;
  const secure = {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 7,
    getItemAsync: async key => values.get(key) ?? null,
    setItemAsync: async (key, value, configuration) => { options = configuration; values.set(key, value); },
    deleteItemAsync: async key => { values.delete(key); },
  };
  const storage = charger('utils/calendriersConnexion.ts', { 'expo-secure-store': secure });
  assert.equal(await storage.chargerConnexion(), null);
  await storage.enregistrerConnexion(credentials);
  assert.deepEqual(options, { keychainAccessible: secure.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  assert.deepEqual(await charger('utils/calendriersConnexion.ts', { 'expo-secure-store': secure }).chargerConnexion(), credentials);
  await storage.oublierConnexion();
  assert.equal(values.size, 0);
});

test('Les sauvegardes corrompues ou mal formées ne préremplissent aucun identifiant', () => {
  const { decoderConnexion } = charger('utils/calendriersConnexionCommun.ts');
  for (const raw of [null, 'invalid', 'null', '[]', '{}',
    JSON.stringify({ version: 2, ...credentials }),
    JSON.stringify({ version: 1, ...credentials, password: 123 }),
    JSON.stringify({ version: 1, ...credentials, serveur: 'https://user:secret@example.test' }),
    JSON.stringify({ version: 1, ...credentials, amicale: 'amicale invalide' })]) {
    assert.equal(decoderConnexion(raw), null);
  }
});

test('Un refus de stockage ou de suppression remonte une erreur sans exposer le secret ni prétendre avoir effacé', async () => {
  const previous = global.window;
  const fail = () => { throw new Error('Storage disabled'); };
  global.window = { localStorage: { getItem: fail, setItem: fail, removeItem: fail } };
  try {
    const web = charger('utils/calendriersConnexion.web.ts');
    await assert.rejects(web.chargerConnexion(), /Impossible de lire/);
    await assert.rejects(web.enregistrerConnexion(credentials), e => e.message.includes('n’ont pas pu être mémorisées') && !e.message.includes(credentials.password));
    await assert.rejects(web.oublierConnexion(), /n’ont pas pu être effacées/);
  } finally { if (previous === undefined) delete global.window; else global.window = previous; }
  const native = charger('utils/calendriersConnexion.ts', { 'expo-secure-store': { getItemAsync: fail, setItemAsync: fail, deleteItemAsync: fail } });
  await assert.rejects(native.chargerConnexion(), /Impossible de lire/);
  await assert.rejects(native.enregistrerConnexion(credentials), /n’ont pas pu être mémorisées/);
  await assert.rejects(native.oublierConnexion(), /n’ont pas pu être effacées/);
});
