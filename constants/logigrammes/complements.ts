// Encadrés complémentaires des pages 4, 12 et 15 du PDF PSE (07-2026).
import type { ProcessusId } from './pourTouteIntervention';

type Complement = { titre: string; points: readonly string[] };
export const COMPLEMENTS: Partial<Record<ProcessusId, readonly Complement[]>> = {
  '01': [
    { titre: 'Accident électrique – PSE2', points: ['Ne pas toucher la victime si elle est encore en contact avec l’électricité.', 'Couper le courant au disjoncteur ou débrancher l’appareil avant de s’approcher.', 'Rester à distance d’un câble électrique au sol et attendre les équipes spécialisées.'] },
    { titre: 'Monoxyde de carbone – PSE2', points: ['Faire évacuer les personnes.', 'Rassembler les personnes.', 'Alerter et attendre les secours.'] },
    { titre: 'Accident de la route – PSE2', points: ['Se garer avant ou après et baliser la zone 150 à 200 mètres en amont et en aval : gyrophares, triangles, gilet, lampes, feux, etc.', 'Rester à distance si danger.', 'Préparer un extincteur et l’utiliser en cas de départ de feu.', 'Couper le contact ou éloigner la clé électronique d’au moins 5 mètres.', 'Serrer le frein à main ou caler le véhicule.'] },
    { titre: 'Environnement toxique – PSE2', points: ['Assurer la sécurité avant toute chose et pour tous.'] },
    { titre: 'Incendie – PSE2', points: ['Alerter et appliquer les consignes.', 'Évacuer ou faire évacuer : guider, fermer les portes, donner l’alarme, faciliter l’évacuation.', 'Se protéger pendant l’évacuation : se baisser près du sol, ne pas s’engager s’il y a de la fumée ou du feu.'] },
    { titre: 'Local enfumé – PSE2', points: ['Dégager d’urgence la victime si elle est visible et si les capacités du sauveteur sont suffisantes.', 'Sinon, informer les secours de la présence d’une victime.'] },
    { titre: 'Fuite de gaz – PSE2', points: ['Rester à distance et ne pas pénétrer dans le local.', 'Empêcher l’accès.', 'Ne pas provoquer d’étincelle.'] },
    { titre: 'Substances dangereuses – PSE2', points: ['Rester en amont et à distance de la fuite.', 'Empêcher d’approcher et interdire de fumer.', 'Transmettre aux secours les informations du panneau de danger signalant les toxiques.'] },
    { titre: 'Vêtements en feu – PSE2', points: ['Allonger rapidement la victime au sol.', 'Éteindre les flammes ou les étouffer avec une couverture.'] },
    { titre: 'Violence ou terrorisme – PSC', points: ['S’échapper.', 'Si impossible, s’enfermer et se barricader.', 'Si impossible, résister.'] },
  ],
  '09': [
    { titre: 'Morsure de serpent – PSE2', points: ['Allonger et demander de ne pas bouger pour limiter la diffusion du venin.', 'Retirer les bijoux à proximité de la morsure.', 'Laver à l’eau ou au sérum physiologique.', 'Mettre un pansement stérile humidifié, puis poursuivre le bilan.'] },
    { titre: 'Piqûre de méduses – PSE2', points: ['Rincer à l’eau de mer.', 'Enlever les filaments en se protégeant.', 'Si la douleur persiste, enduire de sable et racler avec une carte rigide.', 'Appliquer du chaud supportable jusqu’à disparition de la douleur.'] },
    { titre: 'Piqûre d’insecte – PSE2', points: ['Alerter en urgence si la piqûre est dans la bouche ou la gorge, ou si la victime est allergique.', 'Retirer le dard sans écraser la poche à venin.', 'Sucer des glaçons si piqûre dans la bouche ou la gorge.', 'Aider la victime à s’injecter son médicament si elle est allergique.', 'Conseiller de consulter si la douleur ou le gonflement persiste.'] },
    { titre: 'Morsure animale ou humaine – PSE2', points: ['Laver à l’eau ou au sérum physiologique.', 'Mettre un pansement stérile humidifié, puis poursuivre le bilan.', 'En cas de contact de la peau avec la salive d’un animal errant, demander un avis médical.'] },
    { titre: 'Autres animaux marins – PSE2', points: ['Immerger dans l’eau chaude durant 30 minutes.', 'Demander un avis médical.'] },
    { titre: 'Morsure de tique – PSE2', points: ['Retirer l’animal avec un tire-tique ou une pince à épiler.', 'Conseiller de consulter en cas de rougeur.'] },
  ],
  '12': [
    { titre: 'AVC ou AIT – PSE2', points: ['Allonger strictement sur le dos ou le côté.', 'Prendre une glycémie capillaire.', 'Évaluer le score de l’accident vasculaire cérébral.'] },
    { titre: 'Crise convulsive généralisée – OPT', points: ['Au début : allonger au sol et écarter les personnes.', 'Pendant : protéger la tête du sol et des objets ; noter l’heure et la durée de la crise.', 'Après : évaluer le 2ème regard et prendre une glycémie capillaire.', 'Chez le nourrisson : prendre la température et pratiquer un refroidissement actif.'] },
    { titre: 'Crise d’asthme – OPT', points: ['Asseoir.', 'Aider à prendre son médicament.'] },
    { titre: 'Douleur thoracique non traumatique – PSE2', points: ['Réaliser un ECG à la demande du médecin.'] },
    { titre: 'Hypoglycémie – OPT', points: ['Prendre une glycémie capillaire.', 'Si mesure < 3,3 mmol/l, 60 mg/dl ou 0,6 g/l : resucrer, 4 sucres chez l’adulte, 2 ou 3 chez l’enfant.', 'Contrôler après 10 à 15 minutes.', 'En l’absence d’amélioration après 15 minutes, resucrer de nouveau.'] },
    { titre: 'Réaction allergique grave – OPT', points: ['Aider à prendre son médicament.', 'En l’absence d’amélioration ou en cas de récidive au bout de 5 minutes, procéder à une seconde injection par AIA.'] },
  ],
};
