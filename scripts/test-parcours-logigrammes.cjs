// node scripts/test-parcours-logigrammes.cjs
/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const cache = new Map();
function load(file) {
  if (file.endsWith('.pdf')) { assert.ok(fs.existsSync(file)); return file; }
  if (!path.extname(file)) file += '.ts';
  if (cache.has(file)) return cache.get(file);
  const result = {};
  cache.set(file, result);
  const { outputText } = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  vm.runInNewContext(outputText, { exports: result, require(name) {
    return load(name.startsWith('@/') ? path.join(root, name.slice(2)) : path.resolve(path.dirname(file), name));
  } }, { filename: file });
  return result;
}
const { LOGIGRAMMES, REPRISES } = load(path.join(root, 'constants/logigrammes/parcoursPse'));
const { PROCESSUS } = load(path.join(root, 'constants/logigrammes/pourTouteIntervention'));
const { creerParcours, naviguerLogigrammes: nav } = load(path.join(root, 'utils/navigationLogigrammes'));
const actuel = parcours => parcours.at(-1);
const noeud = parcours => LOGIGRAMMES[actuel(parcours).processus].etapes[actuel(parcours).etape];
function choisir(parcours, libelle) {
  const index = typeof libelle === 'number' ? libelle : noeud(parcours).choix.findIndex(choix => choix.libelle === libelle);
  assert.ok(index >= 0, `${actuel(parcours).processus}/${actuel(parcours).etape} : ${libelle}`);
  return nav(nav(parcours, { type: 'repondre', reponse: index }), { type: 'avancer' });
}
function suivre(parcours, ...etapes) {
  for (const id of etapes) {
    const index = noeud(parcours).choix.findIndex(choix => choix.action.type === 'etape' && choix.action.etape === id);
    assert.ok(index >= 0, `${actuel(parcours).processus}/${actuel(parcours).etape} → ${id}`);
    parcours = choisir(parcours, index);
    assert.equal(actuel(parcours).etape, id);
  }
  return parcours;
}
function positionInitiale(processus, etape) {
  // Point d'entrée ciblé : même format que les renvois déclarés par le PDF.
  return [{ ...actuel(creerParcours(processus)), etape }];
}
function verifier(parcours, processus, etape, profondeur) {
  assert.equal(actuel(parcours).processus, processus);
  assert.equal(actuel(parcours).etape, etape);
  if (profondeur !== undefined) assert.equal(actuel(parcours).retours.length, profondeur);
}

test('Les 15 parcours, étapes, entrées ciblées et reprises sont tous accessibles et valides', () => {
  assert.equal(Object.keys(LOGIGRAMMES).length, 15);
  const accessibles = new Map(Object.entries(LOGIGRAMMES).map(([id, definition]) => [id, new Set([definition.debut])]));
  let transitions = 0;
  function valider(id, action) {
    transitions++;
    if (action.type === 'etape') assert.ok(LOGIGRAMMES[id].etapes[action.etape], `${id}/${action.etape}`);
    if (action.type === 'appel' || action.type === 'aller') {
      assert.ok(LOGIGRAMMES[action.processus]);
      const cible = action.etape ?? LOGIGRAMMES[action.processus].debut;
      assert.ok(LOGIGRAMMES[action.processus].etapes[cible], `${action.processus}/${cible}`);
      accessibles.get(action.processus).add(cible);
      if (action.reprise) assert.ok(LOGIGRAMMES[id].etapes[action.reprise], `${id}/${action.reprise}`);
      if (action.arretAvant) assert.ok(LOGIGRAMMES[action.processus].etapes[action.arretAvant]);
    }
  }
  for (const [id, definition] of Object.entries(LOGIGRAMMES)) {
    assert.ok(PROCESSUS[id].pdf);
    assert.ok(LOGIGRAMMES['00'].etapes[REPRISES[id]]);
    for (const etape of Object.values(definition.etapes)) {
      assert.ok(etape.titre && etape.phase);
      for (const choix of [...etape.choix, ...(etape.liens ?? [])]) valider(id, choix.action);
    }
  }
  for (const [id, definition] of Object.entries(LOGIGRAMMES)) {
    const visites = accessibles.get(id);
    const queue = [...visites];
    while (queue.length) {
      const etape = definition.etapes[queue.shift()];
      for (const choix of [...etape.choix, ...(etape.liens ?? [])]) {
        const cible = choix.action.type === 'etape' ? choix.action.etape : choix.action.type === 'appel' ? choix.action.reprise : null;
        if (cible && !visites.has(cible)) { visites.add(cible); queue.push(cible); }
      }
    }
    assert.equal(visites.size, Object.keys(definition.etapes).length, `Étape inaccessible dans ${id}`);
  }
  assert.ok(transitions > 300);
});

test('Une plaie ouvre 03, reprend au corps étranger, ouvre 08 puis reprend à sa localisation', () => {
  let p = suivre(creerParcours('09'), 'hemorragie');
  p = choisir(p, 0);
  verifier(p, '03', 'protection', 1);
  p = suivre(p, 'type', 'vetements', 'compression', 'manuelle', 'allonger', 'surveiller', 'fin');
  p = choisir(p, 0);
  verifier(p, '09', 'corps', 0);
  p = choisir(p, 0);
  verifier(p, '08', 'situation', 1);
  p = suivre(p, 'assise', 'tolerance', 'proteger', 'fin');
  p = choisir(p, 0);
  verifier(p, '09', 'localisation', 0);
  p = nav(p, { type: 'precedent' });
  verifier(p, '08', 'fin', 1);
});

test('Quitter un sous-parcours inachevé restitue l’étape d’origine sans valider le traitement', () => {
  let p = suivre(creerParcours('09'), 'hemorragie');
  p = choisir(p, 0);
  p = nav(p, { type: 'fermer' });
  verifier(p, '09', 'hemorragie', 0);
  assert.equal(actuel(p).reponse, 0);
});

test('Le parcours général ouvre un formulaire 01 et récupère sa question de confirmation', () => {
  let p = suivre(creerParcours('00'), 'nature', 'danger', 'securiser');
  p = nav(p, { type: 'ouvrir', action: noeud(p).liens[0].action });
  verifier(p, '01', 'observer', 1);
  p = suivre(p, 'controle', 'proteger', 'zone', 'fin');
  p = choisir(p, 0);
  verifier(p, '00', 'securiser', 0);
  assert.equal(actuel(p).reponse, null);
});

test('En repérage nombreuses victimes, absence de respiration après LVA mène au noir', () => {
  let p = positionInitiale('02', 'conscience');
  p = choisir(p, 0);
  verifier(p, '04', 'ventre', 1);
  p = suivre(p, 'casque', 'perteConnaissance', 'assise', 'rachis', 'nonTraumatise', 'encombrement', 'fin');
  p = choisir(p, 0);
  verifier(p, '02', 'respiration');
  p = suivre(p, 'noir', 'bracelet', 'deces');
  verifier(p, '02', 'deces');
});

test('Obstruction avec perte de connaissance ouvre directement la réanimation', () => {
  const p = choisir(suivre(creerParcours('04'), 'toux', 'conscience'), 0);
  verifier(p, '05', 'arret', 0);
});

test('La RCP se répète par âge et ne quitte le parcours qu’après signes de récupération', () => {
  for (const age of ['adulte', 'enfant', 'nouveau-ne']) {
    let p = suivre(creerParcours('05'), 'arret', `cycle-${age}`, `opiaces-${age}`, `recuperation-${age}`, `pouls-${age}`, `cycle-${age}`);
    p = suivre(p, `opiaces-${age}`, `recuperation-${age}`, 'fonctions');
    p = choisir(p, 0);
    verifier(p, '00', 'echange', 0);
  }
});

test('Les regards appelés depuis Malaise reprennent à la bonne étape du parcours 12', () => {
  let p = choisir(creerParcours('12'), 0);
  verifier(p, '00', 'nature', 1);
  p = suivre(p, 'danger', 'victimes', 'informations');
  p = choisir(p, 0);
  verifier(p, '12', 'bilan23', 0);
  p = choisir(p, 0);
  verifier(p, '00', 'echange', 1);
  p = suivre(p, 'hemorragie', 'voiesAeriennes', 'conscience', 'apprecierRespiration', 'apprecierCirculation', 'apprecierNeurologique');
  p = choisir(p, 1);
  verifier(p, '12', 'cause', 0);
});

test('Surveillance : fréquence, bilan des regards, boucle et ordre d’évacuation', () => {
  let p = suivre(creerParcours('14'), 'cinq');
  p = choisir(p, 0);
  p = suivre(p, 'hemorragie', 'voiesAeriennes', 'conscience', 'apprecierRespiration', 'apprecierCirculation', 'apprecierNeurologique', 'mesurerRespiration', 'mesurerCirculation', 'mesurerNeurologique', 'bilan');
  p = choisir(p, 0);
  verifier(p, '14', 'evolution', 0);
  p = suivre(p, 'evacuation', 'detresse', 'dix', 'evolution', 'evacuation', 'conditionnement', 'relevage', 'brancardage', 'installation', 'transport', 'nettoyage', 'debriefing', 'potentiel');
  assert.equal(noeud(p).choix.length, 0);
});

test('Précédent annule une branche, aucune réponse présélectionnée et redémarrage depuis la liste', () => {
  const initial = creerParcours('09');
  assert.strictEqual(nav(initial, { type: 'avancer' }), initial);
  assert.strictEqual(nav(initial, { type: 'repondre', reponse: 99 }), initial);
  let p = suivre(initial, 'hemorragie');
  p = choisir(p, 0);
  p = nav(p, { type: 'precedent' });
  p = suivre(p, 'corps');
  verifier(p, '09', 'corps', 0);
  assert.equal(actuel(p).reponse, null);
  assert.ok(!p.some(entree => entree.processus === '03'));
  p = nav(p, { type: 'recommencer', processus: '09' });
  assert.equal(p.length, 1);
  verifier(p, '09', 'gravite', 0);
});

test('Perte de connaissance traumatique : maintien allongé sur avis médical, puis oxygène et reprise', () => {
  let p = suivre(creerParcours('06'), 'allonger', 'menton', 'avis', 'maintien', 'encombrement', 'aspirer', 'oxygene');
  p = choisir(p, 0);
  verifier(p, '07', 'oxygene', 1);
  p = suivre(p, 'proteger', 'fin');
  p = choisir(p, 0);
  verifier(p, '06', 'proteger', 0);
  p = suivre(p, 'fin');
  p = choisir(p, 0);
  verifier(p, '00', 'apprecierRespiration', 0);
});

test('Les trois détresses ont leur conduite à tenir ; plusieurs peuvent se succéder', () => {
  let p = suivre(creerParcours('07'), 'respiratoire', 'agirRespiratoire', 'oxygene', 'proteger', 'type',
    'circulatoire', 'agirCirculatoire', 'proteger', 'type', 'neurologique', 'agirNeurologique', 'proteger', 'fin');
  p = choisir(p, 0);
  verifier(p, '00', 'mesurerRespiration', 0);
});

test('Brûlure chimique : projection, inhalation et ingestion restent des branches distinctes', () => {
  let p = suivre(creerParcours('10'), 'projection', 'vetementsChimique', 'fin');
  p = choisir(p, 0);
  verifier(p, '00', 'surveiller');
  p = suivre(creerParcours('10'), 'inhalation');
  p = choisir(p, 0);
  verifier(p, '07', 'respiratoire', 1);
  p = suivre(creerParcours('10'), 'ingestion');
  assert.ok(noeud(p).points.includes('Ne pas faire vomir.'));
});

test('Traumatisme du rachis : fiabilité, signes, risque et âge conduisent aux branches du PDF', () => {
  let p = suivre(creerParcours('11'), 'localisation', 'agitation', 'stabiliser', 'fiabilite', 'immobilisation', 'sol', 'mid', 'fin');
  p = choisir(p, 0);
  verifier(p, '00', 'surveiller');
  p = suivre(creerParcours('11'), 'localisation', 'agitation', 'stabiliser', 'fiabilite', 'signes', 'risque', 'age', 'sansImmobilisation', 'aggravation', 'vecteur', 'fin');
  verifier(p, '11', 'fin');
});
