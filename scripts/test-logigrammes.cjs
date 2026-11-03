// node --test scripts/test-logigrammes.cjs
/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

const file = path.resolve(__dirname, '../constants/logigrammes/pourTouteIntervention.ts');
const { outputText } = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});
const definition = {};
vm.runInNewContext(outputText, {
  exports: definition,
  require(asset) {
    const target = path.resolve(path.dirname(file), asset);
    assert.ok(fs.existsSync(target), `PDF manquant : ${target}`);
    return target;
  },
});
const { ETAPES, PROCESSUS, naviguer, nouveauParcours } = definition;
const actuel = parcours => parcours.at(-1);
function choisir(parcours, index) {
  return naviguer(naviguer(parcours, { type: 'repondre', reponse: index }), { type: 'avancer' });
}
function suivre(depart, ...destinations) {
  let parcours = depart;
  for (const destination of destinations) {
    const index = ETAPES[actuel(parcours).etape].choix.findIndex(choix => choix.suite === destination);
    assert.notEqual(index, -1, `${actuel(parcours).etape} → ${destination}`);
    parcours = choisir(parcours, index);
    assert.equal(actuel(parcours).etape, destination);
    assert.equal(actuel(parcours).reponse, null);
  }
  return parcours;
}

test('Chaque étape est accessible ; tous les embranchements et PDF sont valides', () => {
  const chemins = new Map([['depart', nouveauParcours()]]);
  const attente = ['depart'];
  let transitions = 0;
  while (attente.length) {
    const id = attente.shift();
    const etape = ETAPES[id];
    assert.ok(etape.titre);
    assert.ok(etape.choix.length);
    if (etape.processus) assert.ok(PROCESSUS[etape.processus]);
    etape.choix.forEach((choix, index) => {
      assert.ok(ETAPES[choix.suite], `${id} → ${choix.suite}`);
      const resultat = choisir(chemins.get(id), index);
      assert.equal(actuel(resultat).etape, choix.suite);
      assert.equal(actuel(resultat).reponse, null);
      transitions++;
      if (!chemins.has(choix.suite)) {
        chemins.set(choix.suite, resultat);
        attente.push(choix.suite);
      }
    });
  }
  assert.equal(chemins.size, Object.keys(ETAPES).length);
  assert.ok(transitions > 60);
  assert.equal(Object.keys(PROCESSUS).length, 15);
});

test('Parcours sans détresse, mesures, bilan, surveillance et transport', () => {
  const parcours = suivre(nouveauParcours(),
    'nature', 'danger', 'victimes', 'informations', 'echange', 'plainte',
    'hemorragie', 'voiesAeriennes', 'conscience', 'apprecierRespiration',
    'apprecierCirculation', 'apprecierNeurologique', 'mesurerRespiration',
    'mesurerCirculation', 'mesurerNeurologique', 'bilan', 'position', 'soins',
    'surveiller', 'transporter', 'echange');
  assert.equal(actuel(parcours).etape, 'echange');
});

test('Danger, nombreuses victimes, hémorragie et obstruction appellent leurs processus', () => {
  const parcours = suivre(nouveauParcours(),
    'surPlace', 'nature', 'danger', 'securiser', 'danger', 'securiser', 'victimes',
    'reperage', 'informations', 'echange', 'hemorragie', 'arreterHemorragie',
    'voiesAeriennes', 'libererVoies', 'conscience');
  for (const [id, reference] of [['securiser','01'], ['reperage','02'], ['arreterHemorragie','03'], ['libererVoies','04']]) {
    assert.ok(parcours.some(entree => entree.etape === id));
    assert.equal(ETAPES[id].processus, reference);
  }
});

function inconsciente() {
  return suivre(nouveauParcours(), 'nature', 'danger', 'victimes', 'informations',
    'echange', 'hemorragie', 'voiesAeriennes', 'conscience', 'respiration');
}

test('Respiration absente ou anormale : réanimation immédiate, sans détour par le pouls', () => {
  let parcours = suivre(inconsciente(), 'reanimer');
  assert.equal(ETAPES[actuel(parcours).etape].processus, '05');
  assert.equal(ETAPES.reanimer.choix.length, 1);
  assert.match(ETAPES.reanimer.choix[0].libelle, /Signes de récupération/);
  assert.equal(ETAPES.reanimer.choix[0].suite, 'recuperation');
  assert.strictEqual(naviguer(parcours, { type: 'avancer' }), parcours);
  parcours = suivre(parcours, 'recuperation', 'reanimer', 'recuperation', 'echange');
  assert.equal(actuel(parcours).etape, 'echange');
});

test('Respiration normale : les choix de circulation orientent vers 05 ou 06', () => {
  const parcours = suivre(inconsciente(), 'pouls');
  for (const [reponse, destination] of [[0,'maintenirVoies'], [1,'reanimer'], [2,'maintenirVoies']]) {
    const resultat = choisir(parcours, reponse);
    assert.equal(actuel(resultat).etape, destination);
    if (destination === 'maintenirVoies') {
      assert.equal(ETAPES[destination].processus, '06');
      suivre(resultat, 'apprecierRespiration');
    }
  }
});

test('Chaque détresse appelle 07, puis le bilan reprend à la fonction suivante', () => {
  let parcours = suivre(nouveauParcours(), 'nature', 'danger', 'victimes', 'informations',
    'echange', 'hemorragie', 'voiesAeriennes', 'conscience', 'apprecierRespiration');
  parcours = suivre(parcours, 'detresseRespiratoire', 'apprecierCirculation',
    'detresseCirculatoire', 'apprecierNeurologique', 'detresseNeurologique', 'mesurerRespiration');
  for (const id of ['detresseRespiratoire','detresseCirculatoire','detresseNeurologique']) {
    assert.equal(ETAPES[id].processus, '07');
  }
  assert.equal(actuel(parcours).etape, 'mesurerRespiration');
});

test('Plusieurs prises en charge peuvent se succéder avant la surveillance', () => {
  let parcours = suivre(nouveauParcours(), 'nature', 'danger', 'victimes', 'informations',
    'echange', 'hemorragie', 'voiesAeriennes', 'conscience', 'apprecierRespiration',
    'apprecierCirculation', 'apprecierNeurologique', 'mesurerRespiration', 'position', 'soins');
  for (const [id, reference] of [['plaie','09'], ['brulure','10'], ['traumatisme','11'], ['malaise','12'], ['circonstancielle','13']]) {
    parcours = suivre(parcours, id, 'soins');
    assert.equal(ETAPES[id].processus, reference);
  }
  suivre(parcours, 'surveiller', 'echange');
});

test('Retour et changement de réponse suppriment la branche abandonnée ; redémarrage vierge', () => {
  const initial = nouveauParcours();
  assert.strictEqual(naviguer(initial, { type: 'retour' }), initial);
  assert.strictEqual(naviguer(initial, { type: 'avancer' }), initial);
  assert.strictEqual(naviguer(initial, { type: 'repondre', reponse: 99 }), initial);
  let parcours = suivre(initial, 'nature', 'danger', 'securiser');
  parcours = naviguer(parcours, { type: 'retour' });
  assert.equal(actuel(parcours).etape, 'danger');
  assert.equal(actuel(parcours).reponse, 0);
  parcours = suivre(parcours, 'victimes');
  assert.ok(!parcours.some(entree => entree.etape === 'securiser'));
  const redemarre = naviguer(parcours, { type: 'recommencer' });
  assert.equal(redemarre.length, 1);
  assert.equal(actuel(redemarre).etape, 'depart');
  assert.equal(actuel(redemarre).reponse, null);
  assert.equal(initial.length, 1);
  assert.equal(actuel(initial).reponse, null);
});
