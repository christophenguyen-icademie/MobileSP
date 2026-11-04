/**
 * Transcription de LOGI / 00 / 07-2026, « Pour toute intervention »,
 * Logigrammes PSE.pdf, page 3. Les renvois interactifs sont définis dans parcoursPse.ts.
 * Les seules précisions de sortie de réanimation viennent du processus 05 (page 8).
 */
export const PHASES = [
  'Départ', '1er regard', '2ème regard', '3ème regard', '4ème regard', 'Surveillance',
] as const;

export const PROCESSUS = {
  '00': { titre: 'Pour toute intervention', pdf: require('../../assets/logigrammes/pse/00.pdf') },
  '01': { titre: 'Sécuriser l’intervention', pdf: require('../../assets/logigrammes/pse/01.pdf') },
  '02': { titre: 'Effectuer le repérage de nombreuses victimes', pdf: require('../../assets/logigrammes/pse/02.pdf') },
  '03': { titre: 'Arrêter l’hémorragie', pdf: require('../../assets/logigrammes/pse/03.pdf') },
  '04': { titre: 'Libérer les voies aériennes', pdf: require('../../assets/logigrammes/pse/04.pdf') },
  '05': { titre: 'Réanimer la victime', pdf: require('../../assets/logigrammes/pse/05.pdf') },
  '06': { titre: 'Maintenir les voies aériennes libres', pdf: require('../../assets/logigrammes/pse/06.pdf') },
  '07': { titre: 'Limiter l’aggravation d’une détresse vitale', pdf: require('../../assets/logigrammes/pse/07.pdf') },
  '08': { titre: 'Mettre en position d’attente', pdf: require('../../assets/logigrammes/pse/08.pdf') },
  '09': { titre: 'Prendre en charge une plaie', pdf: require('../../assets/logigrammes/pse/09.pdf') },
  '10': { titre: 'Prendre en charge une brûlure', pdf: require('../../assets/logigrammes/pse/10.pdf') },
  '11': { titre: 'Prendre en charge un traumatisme', pdf: require('../../assets/logigrammes/pse/11.pdf') },
  '12': { titre: 'Prendre en charge un malaise', pdf: require('../../assets/logigrammes/pse/12.pdf') },
  '13': { titre: 'Prendre en charge une atteinte circonstancielle', pdf: require('../../assets/logigrammes/pse/13.pdf') },
  '14': { titre: 'Surveiller et transporter la victime sous surveillance', pdf: require('../../assets/logigrammes/pse/14.pdf') },
} as const;

export type ProcessusId = keyof typeof PROCESSUS;
export type EtapeId =
  | 'depart' | 'surPlace' | 'nature' | 'danger' | 'securiser' | 'victimes' | 'reperage' | 'informations'
  | 'echange' | 'plainte' | 'hemorragie' | 'arreterHemorragie' | 'voiesAeriennes' | 'libererVoies'
  | 'conscience' | 'respiration' | 'pouls' | 'reanimer' | 'recuperation' | 'maintenirVoies'
  | 'apprecierRespiration' | 'detresseRespiratoire' | 'apprecierCirculation' | 'detresseCirculatoire'
  | 'apprecierNeurologique' | 'detresseNeurologique' | 'mesurerRespiration' | 'mesurerCirculation'
  | 'mesurerNeurologique' | 'bilan' | 'position' | 'soins' | 'plaie' | 'brulure'
  | 'traumatisme' | 'malaise' | 'circonstancielle' | 'surveiller' | 'transporter';

export type Etape = {
  phase: typeof PHASES[number];
  titre: string;
  description?: string;
  points?: readonly string[];
  processus?: ProcessusId;
  choix: readonly { libelle: string; suite: EtapeId }[];
};

function detresse(titre: string, suite: EtapeId): Etape {
  return {
    phase: '3ème regard', titre, processus: '07',
    description: 'Limiter l’aggravation de la détresse vitale, puis poursuivre le bilan.',
    choix: [{ libelle: 'Prise en charge engagée – poursuivre le bilan', suite }],
  };
}

function mesure(titre: string, suite: EtapeId): Etape {
  return {
    phase: '4ème regard', titre,
    description: 'Mesurer les paramètres de la fonction évaluée. Poursuivre en l’absence de détresse ou lorsque celle-ci est traitée.',
    choix: [
      { libelle: 'Poursuivre le bilan', suite },
      { libelle: 'Mettre en position d’attente et adapter la conduite à tenir', suite: 'position' },
    ],
  };
}

function soin(processus: ProcessusId): Etape {
  return {
    phase: '4ème regard', titre: PROCESSUS[processus].titre, processus,
    description: 'Appliquer la conduite à tenir du logigramme associé.',
    choix: [
      { libelle: 'Choisir une autre prise en charge', suite: 'soins' },
      { libelle: 'Passer à la surveillance', suite: 'surveiller' },
    ],
  };
}

export const ETAPES: Record<EtapeId, Etape> = {
  depart: {
    phase: 'Départ', titre: 'Comment débute l’intervention ?',
    choix: [
      { libelle: 'La victime se présente à l’équipe', suite: 'nature' },
      { libelle: 'Déclenchement de l’équipe', suite: 'surPlace' },
    ],
  },
  surPlace: {
    phase: 'Départ', titre: 'Se rendre sur place',
    choix: [{ libelle: 'Équipe sur place', suite: 'nature' }],
  },
  nature: {
    phase: '1er regard', titre: 'Identifier la nature de l’intervention',
    choix: [{ libelle: 'Nature de l’intervention identifiée', suite: 'danger' }],
  },
  danger: {
    phase: '1er regard', titre: 'Un danger est-il présent ?',
    choix: [
      { libelle: 'Oui', suite: 'securiser' },
      { libelle: 'Non ou danger traité', suite: 'victimes' },
    ],
  },
  securiser: {
    phase: '1er regard', titre: 'Sécuriser l’intervention', processus: '01',
    choix: [
      { libelle: 'Danger traité – poursuivre', suite: 'victimes' },
      { libelle: 'Réévaluer le danger', suite: 'danger' },
    ],
  },
  victimes: {
    phase: '1er regard', titre: 'Y a-t-il de nombreuses victimes ?',
    choix: [
      { libelle: 'Oui', suite: 'reperage' },
      { libelle: 'Non', suite: 'informations' },
    ],
  },
  reperage: {
    phase: '1er regard', titre: 'Effectuer le repérage de nombreuses victimes', processus: '02',
    choix: [{ libelle: 'Repérage effectué', suite: 'informations' }],
  },
  informations: {
    phase: '1er regard', titre: 'Compléter les informations',
    choix: [{ libelle: 'Informations complétées', suite: 'echange' }],
  },
  echange: {
    phase: '2ème regard', titre: 'Y a-t-il un échange spontané ?',
    choix: [
      { libelle: 'Oui', suite: 'plainte' },
      { libelle: 'Non ou plaintes déjà identifiées', suite: 'hemorragie' },
    ],
  },
  plainte: {
    phase: '2ème regard', titre: 'Identifier la plainte principale',
    description: 'Douleurs, difficultés à respirer, à bouger, nausées, vertiges, fatigue, etc.',
    choix: [{ libelle: 'Plainte principale identifiée', suite: 'hemorragie' }],
  },
  hemorragie: {
    phase: '2ème regard', titre: 'Une hémorragie est-elle présente ?',
    choix: [
      { libelle: 'Oui', suite: 'arreterHemorragie' },
      { libelle: 'Non ou hémorragie traitée', suite: 'voiesAeriennes' },
    ],
  },
  arreterHemorragie: {
    phase: '2ème regard', titre: 'Arrêter l’hémorragie', processus: '03',
    choix: [{ libelle: 'Hémorragie traitée', suite: 'voiesAeriennes' }],
  },
  voiesAeriennes: {
    phase: '2ème regard', titre: 'Les voies aériennes sont-elles libres ?',
    choix: [
      { libelle: 'Oui ou obstruction traitée', suite: 'conscience' },
      { libelle: 'Non', suite: 'libererVoies' },
    ],
  },
  libererVoies: {
    phase: '2ème regard', titre: 'Libérer les voies aériennes', processus: '04',
    choix: [{ libelle: 'Voies aériennes libérées', suite: 'conscience' }],
  },
  conscience: {
    phase: '2ème regard', titre: 'La victime est-elle consciente ?',
    choix: [
      { libelle: 'Oui', suite: 'apprecierRespiration' },
      { libelle: 'Non', suite: 'respiration' },
    ],
  },
  respiration: {
    phase: '2ème regard', titre: 'La victime respire-t-elle normalement ?',
    choix: [
      { libelle: 'Oui', suite: 'pouls' },
      { libelle: 'Non ou respiration anormale', suite: 'reanimer' },
    ],
  },
  pouls: {
    phase: '2ème regard', titre: 'Rechercher la circulation',
    description: 'Prise de pouls selon les pratiques de l’entité, comme indiqué dans le diagramme.',
    choix: [
      { libelle: 'Pouls présent', suite: 'maintenirVoies' },
      { libelle: 'Absence de pouls', suite: 'reanimer' },
      { libelle: 'Prise de pouls non réalisée par l’entité', suite: 'maintenirVoies' },
    ],
  },
  reanimer: {
    phase: '2ème regard', titre: 'Réanimer la victime', processus: '05',
    description: 'Suivre le logigramme 05. En l’absence de signes de récupération, poursuivre la réanimation selon ce processus.',
    choix: [{ libelle: 'Signes de récupération : la victime bouge, ouvre les yeux ou respire normalement', suite: 'recuperation' }],
  },
  recuperation: {
    phase: '2ème regard', titre: 'Évaluer les fonctions vitales', processus: '05',
    points: [
      'Surveillance constante de la conscience et de la ventilation.',
      'Garder la victime sur le dos.',
      'Se tenir prêt à reprendre la RCP.',
    ],
    choix: [
      { libelle: 'Reprendre le 2ème regard', suite: 'echange' },
      { libelle: 'Reprendre la réanimation', suite: 'reanimer' },
    ],
  },
  maintenirVoies: {
    phase: '2ème regard', titre: 'Maintenir les voies aériennes libres', processus: '06',
    choix: [{ libelle: 'Poursuivre le bilan', suite: 'apprecierRespiration' }],
  },
  apprecierRespiration: {
    phase: '3ème regard', titre: 'Apprécier la respiration',
    choix: [
      { libelle: 'Présence d’une détresse respiratoire', suite: 'detresseRespiratoire' },
      { libelle: 'Absence de détresse ou détresse traitée', suite: 'apprecierCirculation' },
    ],
  },
  detresseRespiratoire: detresse('Limiter l’aggravation d’une détresse respiratoire', 'apprecierCirculation'),
  apprecierCirculation: {
    phase: '3ème regard', titre: 'Apprécier la circulation',
    choix: [
      { libelle: 'Présence d’une détresse circulatoire', suite: 'detresseCirculatoire' },
      { libelle: 'Absence de détresse ou détresse traitée', suite: 'apprecierNeurologique' },
    ],
  },
  detresseCirculatoire: detresse('Limiter l’aggravation d’une détresse circulatoire', 'apprecierNeurologique'),
  apprecierNeurologique: {
    phase: '3ème regard', titre: 'Apprécier la fonction neurologique',
    choix: [
      { libelle: 'Présence d’une détresse neurologique', suite: 'detresseNeurologique' },
      { libelle: 'Absence de détresse ou détresse traitée', suite: 'mesurerRespiration' },
    ],
  },
  detresseNeurologique: detresse('Limiter l’aggravation d’une détresse neurologique', 'mesurerRespiration'),
  mesurerRespiration: mesure('Mesurer les paramètres respiratoires', 'mesurerCirculation'),
  mesurerCirculation: mesure('Mesurer les paramètres circulatoires', 'mesurerNeurologique'),
  mesurerNeurologique: mesure('Mesurer les paramètres neurologiques', 'bilan'),
  bilan: {
    phase: '4ème regard', titre: 'Compléter le bilan',
    points: [
      'Glycémie ou température.',
      'Interrogatoire : mécanisme, OPQRST, MHTAF.',
      'Examen.',
      'Scores et échelles : FAST, EVS, etc.',
    ],
    choix: [{ libelle: 'Bilan complété – mettre en position d’attente', suite: 'position' }],
  },
  position: {
    phase: '4ème regard', titre: 'Mettre en position d’attente', processus: '08',
    choix: [{ libelle: 'Adapter la conduite à tenir', suite: 'soins' }],
  },
  soins: {
    phase: '4ème regard', titre: 'Adapter la conduite à tenir',
    description: 'Choisissez la prise en charge adaptée. Plusieurs peuvent être consultées successivement.',
    choix: [
      { libelle: 'Prendre en charge une plaie', suite: 'plaie' },
      { libelle: 'Prendre en charge une brûlure', suite: 'brulure' },
      { libelle: 'Prendre en charge un traumatisme', suite: 'traumatisme' },
      { libelle: 'Prendre en charge un malaise', suite: 'malaise' },
      { libelle: 'Prendre en charge une atteinte circonstancielle', suite: 'circonstancielle' },
      { libelle: 'Passer à la surveillance', suite: 'surveiller' },
    ],
  },
  plaie: soin('09'),
  brulure: soin('10'),
  traumatisme: soin('11'),
  malaise: soin('12'),
  circonstancielle: soin('13'),
  surveiller: {
    phase: 'Surveillance', titre: 'Surveiller la victime', processus: '14',
    description: 'Poursuivre la surveillance. Le diagramme prévoit un retour au 2ème regard pour réévaluer la victime.',
    choix: [
      { libelle: 'Réévaluer la victime – reprendre le 2ème regard', suite: 'echange' },
      { libelle: 'Ordre d’évacuation reçu – transporter sous surveillance', suite: 'transporter' },
    ],
  },
  transporter: {
    phase: 'Surveillance', titre: 'Transporter la victime sous surveillance', processus: '14',
    description: 'Maintenir la surveillance pendant le transport selon le processus 14.',
    choix: [{ libelle: 'Réévaluer la victime – reprendre le 2ème regard', suite: 'echange' }],
  },
};

export type Passage = { etape: EtapeId; reponse: number | null };
export type Navigation =
  | { type: 'repondre'; reponse: number }
  | { type: 'avancer' }
  | { type: 'retour' }
  | { type: 'recommencer' };

export function nouveauParcours(): Passage[] {
  return [{ etape: 'depart', reponse: null }];
}

export function naviguer(parcours: Passage[], action: Navigation): Passage[] {
  const actuel = parcours[parcours.length - 1];
  switch (action.type) {
    case 'repondre':
      if (!ETAPES[actuel.etape].choix[action.reponse]) return parcours;
      return [...parcours.slice(0, -1), { ...actuel, reponse: action.reponse }];
    case 'avancer': {
      if (actuel.reponse === null) return parcours;
      const choix = ETAPES[actuel.etape].choix[actuel.reponse];
      if (!choix) return parcours;
      return [...parcours, { etape: choix.suite, reponse: null }];
    }
    case 'retour':
      return parcours.length > 1 ? parcours.slice(0, -1) : parcours;
    case 'recommencer':
      return nouveauParcours();
  }
}
