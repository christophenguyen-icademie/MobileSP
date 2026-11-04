// LOGI 09 à 12 / 07-2026 — Logigrammes PSE.pdf, pages 12 à 15.
import type { DefinitionLogigramme } from '@/types/logigrammes';
import { action, appeler, fin, question, vers } from './construction';

export const plaie: DefinitionLogigramme = {
  debut: 'gravite', etapes: {
    gravite: question('Observer la plaie : quelle est sa gravité ?', [vers('Simple', 'simple'), vers('Grave', 'hemorragie')]),
    simple: action('Nettoyer, sécher le tour de la plaie et mettre un pansement', 'fin', ['Demander un avis médical si vaccination antitétanique non à jour.', 'Avis médical en cas de plaie chaude, rouge, qui suinte, gonfle ou devient douloureuse dans les 24 heures.']),
    hemorragie: question('Une hémorragie est-elle présente ?', [appeler('Oui – arrêter l’hémorragie', '03', 'corps'), vers('Non', 'corps')]),
    corps: question('Ne pas retirer le corps étranger', [appeler('Mettre en position d’attente', '08', 'localisation')]),
    localisation: question('Quelle est la localisation ou la nature de la plaie grave ?', [vers('Thorax', 'thorax'), vers('Dent', 'dent'), vers('Amputation ou arrachement', 'amputation'), vers('Abdomen', 'abdomen'), vers('Liquide sous pression', 'pression'), vers('Autre localisation', 'fin')]),
    thorax: action('Laisser la plaie du thorax à l’air libre', 'fin', ['Si disponible, il est possible de placer un dispositif non occlusif.']),
    dent: action('Conditionner la dent', 'fin', ['Rincer la dent 10 secondes au maximum à l’eau ou au sérum physiologique.', 'L’envelopper dans un film étirable ; à défaut, dans de la salive ou du lait de vache.']),
    amputation: action('Mettre un pansement compressif et conditionner la partie amputée', 'fin', ['Pansement compressif même en l’absence de saignement.']),
    abdomen: action('Ne pas toucher les viscères', 'sterile'),
    sterile: action('Mettre un pansement stérile humidifié', 'fin'),
    pression: action('Se renseigner sur le liquide sous pression', 'fin', ['Nature du produit.', 'Pression d’injection.']),
    fin: fin(['Poursuivre le bilan.']),
  },
};

export const brulure: DefinitionLogigramme = {
  debut: 'nature', etapes: {
    nature: question('Quelle est la nature de la brûlure ?', [vers('Thermique ou électrique', 'condition'), vers('Chimique – projection sur le corps ou l’œil', 'projection'), vers('Chimique – inhalation', 'inhalation'), vers('Chimique – ingestion', 'ingestion')]),
    condition: question('Les trois critères écrits dans le PDF sont-ils réunis ?', [vers('Oui – poursuivre le bilan', 'bilanDetresse'), vers('Non – évaluer la gravité', 'gravite')], ['Victime consciente.', 'Pas de détresse circulatoire.', 'Brûlure > 30 minutes.']),
    bilanDetresse: question('Poursuivre le bilan et prendre en charge les détresses vitales', [appeler('Ouvrir « Limiter l’aggravation d’une détresse vitale »', '07', 'fin'), vers('Poursuivre le bilan', 'fin')]),
    gravite: question('Quelle est la gravité de la brûlure ?', [vers('Simple', 'simple'), vers('Grave', 'grave')], ['Chez l’adulte, l’étendue peut être évaluée avec la règle de Wallace.', 'Chez l’enfant et pour les petites surfaces, paume et doigts de la victime représentent 1 % de sa surface cutanée, quel que soit l’âge.']),
    simple: action('Refroidir la zone brûlée jusqu’à disparition de la douleur', 'fin', ['Avis médical si vaccination antitétanique non à jour ou signes d’infection dans les 24 heures : chaleur, rougeur, suintement, gonflement, douleur.']),
    grave: action('Refroidir la zone brûlée', 'vetements', ['10 minutes minimum, idéalement 20 minutes, ou jusqu’aux consignes.']),
    vetements: action('Ôter ou faire ôter vêtements et bijoux tout en arrosant', 'proteger', ['Sauf les vêtements qui adhèrent à la peau.']),
    proteger: action('Protéger la brûlure et couvrir la victime', 'vigilance', ['Pansement, champ stérile ou film plastique non adhésif.']),
    vigilance: action('Poursuivre le bilan : points de vigilance', 'fin', ['Caractéristiques et circonstances de la brûlure.', 'Traces noires dans les narines, la bouche ou sur la langue.', 'Raucité de la voix.']),
    projection: action('Se protéger puis rincer la zone atteinte', 'vetementsChimique', ['Éviter que l’eau de rinçage coule sur des zones non atteintes.', 'Si l’œil est atteint, essayer de le maintenir ouvert.']),
    vetementsChimique: action('Ôter ou faire ôter vêtements et bijoux tout en arrosant', 'fin', ['Sauf les vêtements qui adhèrent à la peau.']),
    inhalation: question('Lutter contre une éventuelle détresse respiratoire – PSE1', [appeler('Ouvrir le logigramme de détresse respiratoire', '07', 'fin', 'respiratoire'), vers('Poursuivre le bilan', 'fin')]),
    ingestion: action('Prendre en charge une ingestion – PSE1', 'fin', ['Allonger sur le côté.', 'Ne pas faire vomir.', 'Garder l’emballage du produit.']),
    fin: fin(['Poursuivre le bilan.']),
  },
};

export const traumatisme: DefinitionLogigramme = {
  debut: 'detresse', etapes: {
    detresse: question('Traiter toute détresse vitale avant le traumatisme', [appeler('Ouvrir le logigramme des détresses vitales', '07', 'localisation'), vers('Absence de détresse ou détresse traitée', 'localisation')]),
    localisation: question('Conseiller de ne pas bouger : quelle localisation ?', [vers('Bassin', 'bassin'), vers('Membre inférieur', 'inferieur'), vers('Membre supérieur', 'superieur'), vers('Dos, cou ou crâne', 'agitation')]),
    bassin: question('Contrôler le bassin en dénudant : détresse circulatoire ?', [vers('Oui – consigne médicale de pose ou avis médical impossible à obtenir', 'ceinture'), vers('Non', 'immobilisation')]),
    ceinture: action('Mettre une ceinture pelvienne', 'immobilisation'),
    inferieur: action('Installer en position allongée', 'fracture'),
    superieur: action('Installer en position assise', 'fracture'),
    fracture: question('Une fracture est-elle identifiée ?', [vers('Fracture fermée', 'avisMembre'), vers('Fracture ouverte', 'avisMembre'), vers('Non', 'froid')]),
    avisMembre: question('Demander un avis médical', [vers('Consigne médicale de réalignement ou avis impossible à obtenir', 'realigner'), vers('Poursuivre selon l’avis médical sans réalignement', 'deformation')]),
    realigner: action('Réaligner le membre', 'deformation'),
    froid: action('Appliquer du froid', 'deformation'),
    deformation: question('Une déformation est-elle présente ?', [vers('Oui', 'depression'), vers('Non', 'modulable')]),
    depression: action('Mettre une attelle à dépression', 'fin'),
    modulable: action('Mettre une attelle modulable ou des écharpes', 'fin'),
    agitation: question('La victime est-elle agitée et non coopérative ?', [vers('Oui', 'aggravation'), vers('Non', 'stabiliser')]),
    stabiliser: action('Stabiliser le rachis si besoin', 'fiabilite'),
    fiabilite: question('Les réponses de la victime sont-elles fiables (A) ?', [vers('Oui', 'signes'), vers('Non', 'immobilisation')]),
    signes: question('Signes d’atteinte du rachis (B) ou de la moelle (C) ?', [vers('Oui', 'immobilisation'), vers('Non', 'risque')]),
    risque: question('Traumatisme à haut risque d’atteinte du rachis (D) ?', [vers('Oui', 'age'), vers('Non', 'sansImmobilisation')]),
    age: question('Âge > 65 ans ou antécédents à risque (E) ?', [vers('Oui', 'immobilisation'), vers('Non', 'sansImmobilisation')]),
    sansImmobilisation: action('Pas d’immobilisation du rachis : la victime se déplace seule', 'aggravation'),
    aggravation: question('Une aggravation est-elle constatée ?', [vers('Oui', 'immobilisation'), vers('Non', 'vecteur')]),
    vecteur: action('Installer dans un vecteur', 'fin'),
    immobilisation: question('Immobilisation du rachis : quelle situation ?', [vers('Accès difficile', 'acces'), vers('Victime au sol', 'sol')], ['Stabilisation : demander de ne pas bouger, maintien de la tête.', 'Restriction : blocs de tête, collier cervical, MID.', 'Immobilisation : MID, plan dur si MID indisponible, combinaison de moyens.']),
    acces: action('Accès difficile : plan dur ou attelle cervico-thoracique', 'mid'),
    sol: action('Victime au sol : cuillère, plan dur ou relevage à quatre', 'mid'),
    mid: action('Immobiliser avec un MID', 'fin'),
    fin: fin(),
  },
};

export const malaise: DefinitionLogigramme = {
  debut: 'bilan1', etapes: {
    bilan1: question('Effectuer le 1er regard', [appeler('Ouvrir le 1er regard', '00', 'bilan23', 'nature', 'echange'), vers('1er regard déjà effectué', 'bilan23')]),
    bilan23: question('Effectuer les 2ème et 3ème regards', [appeler('Ouvrir les 2ème et 3ème regards', '00', 'cause', 'echange', 'mesurerRespiration'), vers('2ème et 3ème regards déjà effectués', 'cause')]),
    cause: action('Soustraire la victime à la cause', 'position'),
    position: question('Mettre en position d’attente', [appeler('Ouvrir le logigramme des positions d’attente', '08', 'bilan4'), vers('Position adaptée déjà mise en place', 'bilan4')]),
    bilan4: question('Effectuer le 4ème regard', [appeler('Ouvrir le 4ème regard', '00', 'medicament', 'mesurerRespiration', 'position'), vers('4ème regard déjà effectué', 'medicament')]),
    medicament: question('Un médicament est-il demandé par la victime ou le médecin ?', [vers('Oui', 'aideMedicament'), vers('Non', 'sucre')]),
    aideMedicament: action('Aider à la prise de médicament', 'sucre'),
    sucre: question('Du sucre est-il demandé par la victime ou le médecin ?', [vers('Oui', 'aideSucre'), vers('Non', 'avis')]),
    aideSucre: action('Aider à la prise de sucre', 'avis'),
    avis: action('Demander un avis médical', 'proteger'),
    proteger: action('Protéger la victime', 'fin'),
    fin: fin(),
  },
};
