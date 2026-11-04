// LOGI 13 et 14 / 07-2026 — Logigrammes PSE.pdf, pages 16 et 17.
import type { DefinitionLogigramme, EtapeLogigramme } from '@/types/logigrammes';
import { action, aller, appeler, fin, question, vers } from './construction';

const variations: Record<string, { titre: string; points: string[]; liens?: EtapeLogigramme['liens'] }> = {
  suspension: { titre: 'Syndrome de suspension – OPT', points: ['1er regard : dégager si possible rapidement et en sécurité ; essayer de maintenir l’horizontalité si la victime est suspendue.', '2ème regard : desserrer le harnais et lutter contre l’hypothermie si la victime est consciente après décrochage.'] },
  avalanche: { titre: 'Victime d’avalanche – OPT', points: ['1er regard : appliquer les conduites à tenir de l’asphyxie, du traumatisme et de l’hypothermie.', '4ème regard : noter les heures d’ensevelissement et de dégagement.'], liens: [appeler('Prendre en charge un traumatisme', '11')] },
  foudre: { titre: 'Accidents liés à la foudre – OPT', points: ['1er regard : analyser le mécanisme. Direct : foudre sur la victime ou propagation par contact. Indirect : point de contact ou tension de pas.', 'Se protéger : casque, petits pas, s’éloigner de 3 mètres, éviter les clairières.', 'Prévenir : cône de protection en montagne ; s’éloigner de l’entrée en grotte ; si risque élevé, position en boule sur un sac ou une corde ; éloigner les matières conductrices.'], liens: [appeler('Sécuriser l’intervention', '01')] },
  hypothermie: { titre: 'Hypothermie – PSE2', points: ['2ème regard, lors de la réanimation : mesurer la température et limiter à 3 chocs.', 'Si légère : réchauffer.', 'Si modérée ou sévère : réchauffer et mettre l’oxygène.'], liens: [appeler('Réanimer la victime', '05'), appeler('Inhalation d’oxygène', '07', undefined, 'oxygene')] },
  gelures: { titre: 'Gelures – PSE2', points: ['1er degré : localisée, rouge, insensible, sans cloque.', '2ème degré : localisée, rouge, insensible, œdème et cloques claires.', '3ème degré : insensible, bleutée/noirâtre, insensibilité persistante, cloque sanguinolente, risque d’amputation.', '4ème degré : insensible, bleutée, extensive ; tissus restant froids malgré le réchauffement, pouvant devenir nécrotiques ; persistance de l’insensibilité = amputation inévitable.', '4ème regard, gelures mineures : sécher sans frictionner, réchauffer 10 minutes les extrémités au contact de la peau du sauveteur.', '4ème regard, gelures sévères et graves de moins de 24 heures : immerger 20 à 30 minutes dans l’eau à 37–39 °C. Pas de chaleur sèche ni supérieure à 39 °C.'] },
  pendaison: { titre: 'Pendaison, strangulation – OPT', points: ['1er regard : soutenir la victime, desserrer le lien et allonger en limitant les mouvements du rachis.', '4ème regard : immobiliser si nécessaire.'], liens: [appeler('Prendre en charge un traumatisme du rachis', '11', undefined, 'agitation')] },
  explosion: { titre: 'Victimes d’explosion – PSE2', points: ['1er regard : regrouper toutes les victimes.', 'Primaire : onde de choc. Secondaire : projection de matériaux. Tertiaire : projection de la victime.', 'Quaternaire : brûlures externes et internes par fumées ou produits.'], liens: [appeler('Repérer de nombreuses victimes', '02'), appeler('Prendre en charge une brûlure', '10'), appeler('Prendre en charge un traumatisme', '11')] },
  compression: { titre: 'Compression de membres – PSE2', points: ['1er regard : évaluer la durée de compression.', '2ème regard : placer un garrot et dégager si l’avis médical est impossible et la durée de compression supérieure à 4 heures.'], liens: [appeler('Ouvrir le logigramme hémorragie', '03')] },
  electrique: { titre: 'Accident électrique – PSE2', points: ['1er regard : sécuriser la zone ; ne pas sortir d’un véhicule exposé.', '4ème regard : rechercher les lésions par contraction musculaire ou les lésions traumatiques par projections.'], liens: [appeler('Sécuriser l’intervention', '01'), appeler('Prendre en charge un traumatisme', '11')] },
  plongee: { titre: 'Accidents liés à la plongée – PSE2', points: ['1er regard : déséquiper, déshabiller, sécher et réchauffer.', '2ème regard : mettre sous oxygène à 15 l/min, quelle que soit la saturation.', 'Faire boire 0,5 à 1 litre d’eau plate.', 'Aider à prendre de l’aspirine si le médecin le demande dans les 30 premières minutes.', '4ème regard : recueillir les paramètres de la plongée, les tables et les symptômes.'], liens: [appeler('Inhalation d’oxygène', '07', undefined, 'oxygene')] },
  chaleur: { titre: 'Chaleur – PSE2', points: ['Refroidissement passif pour tous.', 'Crampe : refroidir et effectuer des étirements.', 'Insolation : refroidissement actif simple.', 'Coup de chaleur et hyperthermie maligne d’effort : important refroidissement actif avancé, en plongeant dans l’eau.'] },
  accouchement: { titre: 'Accouchement inopiné : maman – PSE1', points: ['4ème regard : questionner sur la grossesse.', 'Si l’accouchement est imminent : procéder à l’accouchement ; préparer les zones maman et nouveau-né.', 'Dégager le cordon en présence d’un circulaire autour du cou.', 'Après la délivrance : procéder ou faire procéder à un massage utérin.'] },
  nouveauNe: { titre: 'Accouchement inopiné : nouveau-né – PSE1', points: ['Clamper le cordon après 1 minute de vie, sauf urgence vitale.', 'Protéger spécifiquement contre le froid : éviter les courants d’air, mettre un bonnet, etc.', '2ème regard : adapter la réanimation.'], liens: [appeler('Réanimation du nouveau-né à la naissance', '05', undefined, 'aspirer')] },
  cordon: { titre: 'Soin au cordon ombilical – PSE1', points: ['4ème regard : changer de gants et essuyer la zone de clampage.', 'Poser le premier clamp à 10–15 cm.', 'Pincer et vider le cordon, puis poser le second clamp.', 'Couper le cordon et protéger son extrémité.'] },
  intoxication: { titre: 'Intoxications – PSE2', points: ['1er regard, ingestion ou inhalation : appliquer la conduite à tenir d’une brûlure chimique.', 'Opiacés ou opioïdes, 3ème regard : oxygène si respiration < 12 mouvements/min.', '4ème regard : si respiration < 6 mouvements/min et âge > 14 ans, naloxone par voie nasale. En l’absence d’évolution ou en cas de réapparition des signes : 1 injection toutes les 3 minutes.'], liens: [appeler('Brûlure chimique par ingestion', '10', undefined, 'ingestion'), appeler('Brûlure chimique par inhalation', '10', undefined, 'inhalation'), appeler('Réanimation en cas d’intoxication aux opiacés', '05', undefined, 'respiration')] },
  noyade: { titre: 'Noyade – PSE2', points: ['2ème regard : pratiquer une RCP si nécessaire en commençant par les compressions.', 'Sécher en frictionnant.'], liens: [appeler('Réanimer en commençant par les compressions', '05', undefined, 'arret')] },
};

export const circonstancielle: DefinitionLogigramme = {
  debut: 'situation', etapes: {
    situation: question('Quelle atteinte circonstancielle faut-il prendre en charge ?', Object.entries(variations).map(([id, variation]) => vers(variation.titre, id)), ['Appliquer la procédure générale et intégrer la variation au regard indiqué.']),
    ...Object.fromEntries(Object.entries(variations).map(([id, variation]) => [id, {
      ...question(variation.titre, [vers('Choisir une autre situation', 'situation'), vers('Poursuivre l’intervention', 'fin')], variation.points, 'Variations selon le regard'),
      liens: variation.liens,
    }])),
    fin: fin(),
  },
};

export const surveillance: DefinitionLogigramme = {
  debut: 'detresse', etapes: {
    detresse: question('Une détresse vitale est-elle présente ?', [vers('Oui – bilan de surveillance toutes les 5 minutes', 'cinq'), vers('Non – bilan de surveillance toutes les 10 minutes', 'dix')], [], 'Surveillance'),
    cinq: question('Bilan de surveillance toutes les 5 minutes', [appeler('Effectuer le bilan du 2ème au 4ème regard', '00', 'evolution', 'echange', 'position'), vers('Bilan de surveillance effectué', 'evolution')], ['Vérifier l’efficacité des gestes et des matériels.'], 'Surveillance'),
    dix: question('Bilan de surveillance toutes les 10 minutes', [appeler('Effectuer le bilan du 2ème au 4ème regard', '00', 'evolution', 'echange', 'position'), vers('Bilan de surveillance effectué', 'evolution')], ['Vérifier l’efficacité des gestes et des matériels.'], 'Surveillance'),
    evolution: question('Une évolution nécessite-t-elle d’adapter la prise en charge ?', [vers('Oui', 'adapter'), vers('Non', 'evacuation')], [], 'Surveillance'),
    adapter: question('Adapter la prise en charge', [appeler('Reprendre le bilan et adapter la prise en charge', '00', 'detresse', 'echange', 'surveiller'), vers('Prise en charge adaptée – reprendre la surveillance', 'detresse')]),
    evacuation: question('Un ordre d’évacuation a-t-il été reçu ?', [vers('Oui', 'conditionnement'), vers('Non – poursuivre la surveillance', 'detresse')], [], 'Évacuation'),
    conditionnement: action('Conditionner la victime', 'relevage', [], 'Évacuation'),
    relevage: action('Effectuer le relevage', 'brancardage', [], 'Évacuation'),
    brancardage: action('Effectuer le brancardage', 'installation', [], 'Évacuation'),
    installation: action('Installer la victime dans un véhicule', 'transport', [], 'Évacuation'),
    transport: question('Transporter la victime sous surveillance', [aller('Évolution – reprendre le 2ème regard', '00', 'echange'), vers('Transport terminé', 'nettoyage')], [], 'Transport'),
    nettoyage: action('Nettoyage et désinfection', 'debriefing', ['Matériel.', 'Véhicule.', 'Locaux.'], 'Après l’intervention'),
    debriefing: action('Débriefing technique et defusing psychologique de l’équipe', 'potentiel', [], 'Après l’intervention'),
    potentiel: question('Préserver le potentiel opérationnel', [], [], 'Après l’intervention'),
  },
};
