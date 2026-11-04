// LOGI 05 à 08 / 07-2026 — Logigrammes PSE.pdf, pages 8 à 11.
import type { DefinitionLogigramme, EtapeLogigramme } from '@/types/logigrammes';
import { action, aller, appeler, fin, question, vers } from './construction';

const conseilsRcp = [
  'Relayer le sauveteur au massage cardiaque toutes les 2 minutes.',
  'Si les effectifs le permettent, mettre en place un coach RCP.',
  'Si les insufflations sont inefficaces, vérifier la libération des voies aériennes.',
  'Utiliser un DAE adapté à l’enfant.',
  'Limiter les mouvements du cou et de la tête si un traumatisme du rachis est suspecté.',
  'Aspirer les sécrétions et mettre en place une canule oropharyngée si nécessaire.',
];

function cycleRcp(age: string, gestes: readonly string[], ventilation: string): Record<string, EtapeLogigramme> {
  return {
    [`cycle-${age}`]: {
      ...action(`Réanimation : ${age}`, `opiaces-${age}`, [...gestes, ...conseilsRcp], 'Réanimation'),
      liens: [appeler('Vérifier la libération des voies aériennes', '04', undefined, 'ventre')],
    },
    [`opiaces-${age}`]: question('Intoxication aux opiacés ou opioïdes ?', [vers('Oui', `naloxone-${age}`), vers('Non ou traitée', `recuperation-${age}`)]),
    [`naloxone-${age}`]: action('Administrer de la naloxone – PSE2', `recuperation-${age}`),
    [`recuperation-${age}`]: question('Des signes de récupération sont-ils présents ?', [vers('Oui', 'fonctions'), vers('Non', `pouls-${age}`)], ['La victime bouge, ouvre les yeux ou respire normalement.']),
    [`pouls-${age}`]: question('Un pouls est-il présent, si la prise de pouls est réalisée ?', [vers('Oui – continuer les insufflations', `insufflations-${age}`), vers('Non ou prise de pouls non réalisée – poursuivre la RCP', `cycle-${age}`)]),
    [`insufflations-${age}`]: question('Continuer les insufflations', [vers('Signes de récupération', 'fonctions'), vers('Pouls toujours présent – poursuivre les insufflations', `insufflations-${age}`), vers('Absence de pouls – reprendre la RCP', `cycle-${age}`)], [ventilation]),
  };
}

export const reanimer: DefinitionLogigramme = {
  debut: 'contexte', etapes: {
    contexte: question('Quel est le contexte de la réanimation ?', [vers('Signes d’un arrêt cardiaque', 'arret'), vers('Intoxication aux opiacés ou opioïdes – PSE2', 'respiration'), vers('Nouveau-né à la naissance – PSE2', 'aspirer')]),
    respiration: question('Respiration en cas d’intoxication aux opiacés ou opioïdes', [vers('Moins de 6 mouvements par minute', 'ventilation'), vers('Rechercher les signes de récupération', 'recuperationInitiale')]),
    aspirer: question('Aspirer les mucosités si nécessaire chez le nouveau-né', [vers('État inchangé', 'ventilation'), vers('Changement d’état – rechercher une récupération', 'recuperationInitiale')]),
    ventilation: action('Effectuer une ventilation artificielle, oralement ou avec matériel', 'recuperationInitiale', ['Adulte : 10 par minute.', 'Enfant : 20 par minute.', 'Nourrisson : 30 par minute.', 'Nouveau-né : 40 insufflations.'], 'Ventilation'),
    recuperationInitiale: question('Des signes de récupération sont-ils présents ?', [aller('Oui – reprendre le 2ème regard', '00', 'echange'), vers('Non – signes d’un arrêt cardiaque', 'arret')], ['La victime bouge, ouvre les yeux ou respire normalement.']),
    arret: question('Signes d’un arrêt cardiaque : quelle est la catégorie de la victime ?', [vers('Adulte', 'cycle-adulte'), vers('Enfant ou nourrisson', 'cycle-enfant'), vers('Nouveau-né à la naissance', 'cycle-nouveau-ne')], [], 'Réanimation'),
    ...cycleRcp('adulte', ['30 compressions avec 2 mains, puis 2 insufflations.', 'Oxygène : 15 l/min.', 'Poser le défibrillateur.'], 'Adulte : 10 insufflations par minute.'),
    ...cycleRcp('enfant', ['15 compressions, puis 2 insufflations.', 'Enfant : 1 main. Nourrisson : 2 pouces.', 'Oxygène : 15 l/min.', 'Poser le défibrillateur.'], 'Enfant : 20 insufflations par minute. Nourrisson : 30 par minute.'),
    ...cycleRcp('nouveau-ne', ['3 compressions avec 2 pouces, puis 1 insufflation.', 'Oxygène : 15 l/min.'], 'Nouveau-né : ventilation selon le processus de réanimation à la naissance.'),
    fonctions: question('Évaluer les fonctions vitales après récupération', [aller('Reprendre le 2ème regard', '00', 'echange'), vers('Reprendre la réanimation si nécessaire', 'arret')], ['Surveillance constante de la conscience et de la ventilation.', 'Garder la victime sur le dos.', 'Se tenir prêt à reprendre la RCP.'], 'Surveillance'),
  },
};

export const maintenir: DefinitionLogigramme = {
  debut: 'origine', etapes: {
    origine: question('Quelle est l’origine de la perte de connaissance ?', [vers('Origine inconnue ou traumatique', 'allonger'), vers('Origine connue et non traumatique', 'pls1')]),
    allonger: action('Maintenir allongé et stabiliser le rachis cervical', 'menton'),
    menton: action('Libérer les voies aériennes par élévation du menton', 'avis', ['Poursuivre l’intervention.']),
    avis: question('Quel est l’avis médical pour la position ?', [vers('Demande de maintenir allongé', 'maintien'), vers('Position latérale de sécurité à deux', 'pls2')]),
    maintien: action('Maintenir la victime allongée', 'encombrement'),
    pls2: action('Position latérale de sécurité à deux secouristes', 'encombrement'),
    pls1: action('Position latérale de sécurité à un secouriste', 'encombrement'),
    encombrement: question('Les voies aériennes sont-elles encombrées ?', [vers('Oui', 'aspirer'), vers('Non', 'oxygene')]),
    aspirer: action('Aspirer les sécrétions', 'oxygene'),
    oxygene: question('Une inhalation d’oxygène est-elle nécessaire ?', [appeler('Oui – inhalation d’oxygène', '07', 'proteger', 'oxygene'), vers('Non', 'proteger')]),
    proteger: action('Protéger et poursuivre le bilan', 'fin', ['Protéger la victime contre le froid, la chaleur et les intempéries.', 'Surveiller attentivement la conscience et la respiration.']),
    fin: fin(),
  },
};

export const detresse: DefinitionLogigramme = {
  debut: 'type', etapes: {
    type: question('Quelle détresse vitale faut-il prendre en charge ?', [vers('Respiratoire', 'respiratoire'), vers('Circulatoire', 'circulatoire'), vers('Neurologique', 'neurologique'), vers('Inhalation d’oxygène', 'oxygene')]),
    respiratoire: question('Apprécier et mesurer les signes de détresse respiratoire', [vers('Détresse respiratoire présente', 'agirRespiratoire'), vers('Poursuivre le bilan', 'proteger')], [
      'Confusion, somnolence, anxiété, agitation ; cherche à rester assise ; difficultés à ventiler.',
      'Ventilation bruyante, rapide, superficielle, difficilement visible ; tirage ; battement des ailes du nez.',
      'Creusement au-dessus du sternum ou au creux de l’estomac ; sueurs sans effort ; cyanose.',
      'Fréquence > 30 mouvements/min ; saturation < 94 %, ou < 89 % si IRC.',
    ]),
    agirRespiratoire: action('Installer assise ou demi-assise et desserrer les vêtements', 'oxygene'),
    circulatoire: question('Apprécier et mesurer les signes de détresse circulatoire', [vers('Détresse circulatoire présente', 'agirCirculatoire'), vers('Poursuivre le bilan', 'proteger')], [
      'Somnolence, angoisse, agitation ; pâleur ; marbrures ; peau moite ; sueurs froides.',
      'Pouls radial non perceptible alors que le pouls carotidien est perçu.',
      'TRC > 2 secondes ; FC < 40 ou > 120 battements/min.',
      'Tension systolique < 90 mmHg ou diminuée de 30 % chez la victime hypertendue.',
    ]),
    agirCirculatoire: action('Installer allongée et réchauffer la victime', 'proteger'),
    neurologique: question('Apprécier et mesurer les signes de détresse neurologique', [vers('Détresse neurologique présente', 'agirNeurologique'), vers('Poursuivre le bilan', 'proteger')], [
      'Somnolence, retard de réponse, désorientation, ne parle plus, paralysie ou perte de la vue.',
      'Convulsion, asymétrie du visage ou des pupilles à la lumière faible ou celle du jour.',
      'Score EVDA ; glycémie capillaire < 0,6 g/l (60 mg/dl).',
    ]),
    agirNeurologique: action('Installer la victime allongée', 'proteger'),
    oxygene: action('Inhalation d’oxygène : adapter le débit à l’objectif', 'proteger', [
      'Objectif adulte, enfant, nourrisson : SpO₂ de 94 à 98 %. IRC : de 89 à 94 %.',
      'Si IRC avec saturation < 89 % : augmenter de 1 à 2 l/min par rapport au débit initial.',
      '15 l/min si détresse vitale avec mesure impossible, saturation < 94 %, saturation IRC < 89 % malgré 1 à 2 l/min supplémentaires, intoxication au CO ou accident de plongée.',
      'Diminuer le débit tant que l’objectif est atteint ; l’augmenter si l’objectif n’est pas atteint.',
      'Plages du diagramme : masque haute concentration 6 à 15 l/min ; masque simple 5 à 10 l/min ; lunettes 1 à 6 l/min.',
    ], 'Oxygène'),
    proteger: question('Protéger, poursuivre le bilan et surveiller', [vers('Prendre en charge une autre détresse', 'type'), vers('Poursuivre l’intervention', 'fin')], ['Protéger contre le froid, la chaleur et les intempéries.', 'Surveiller attentivement la conscience et la respiration.']),
    fin: fin(),
  },
};

export const position: DefinitionLogigramme = {
  debut: 'situation', etapes: {
    situation: question('Quelle situation ressort du bilan ?', [
      vers('Difficultés respiratoires ou plaie au thorax', 'assise'),
      vers('Douleur, traumatisme ou plaie de l’abdomen', 'jambes'),
      vers('Fracture de la face, vomissements ou femme enceinte', 'cote'),
      vers('Atteinte de l’œil', 'oeil'), vers('AVC ou autres situations', 'dos'),
    ]),
    assise: action('Installer demi-assise ou assise', 'tolerance'),
    jambes: action('Installer allongée, jambes fléchies', 'tolerance'),
    cote: action('Installer sur le côté, horizontalement', 'tolerance'),
    oeil: action('Recouvrir les deux yeux fermés', 'dos'),
    dos: action('Installer allongée sur le dos', 'tolerance'),
    tolerance: question('La victime supporte-t-elle la position ?', [vers('Oui', 'proteger'), vers('Non', 'confort')]),
    confort: action('Installer dans la position où la victime se sent le mieux', 'proteger'),
    proteger: action('Protéger contre le froid, la chaleur et les intempéries', 'fin'),
    fin: fin(),
  },
};
