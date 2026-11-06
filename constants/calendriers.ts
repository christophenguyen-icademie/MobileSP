import type { TourneeCalendrier } from '@/types/calendriers';

// Données isolées du futur service métier : aucune identité ou adresse réelle.
export const TOURNEES_DEMONSTRATION: TourneeCalendrier[] = [
  {
    id: 'demo-centre',
    nom: 'Centre-ville — Nord',
    secteur: 'Centre-ville',
    date: '08/11/2026',
    statut: 'EN_COURS',
    adresses: [
      { id: 'demo-centre-1', ligne1: '12 rue des Lilas', ville: 'Ville exemple' },
      { id: 'demo-centre-2', ligne1: '4 avenue Victor Hugo', ville: 'Ville exemple' },
      { id: 'demo-centre-3', ligne1: '8 rue du Moulin', ville: 'Ville exemple' },
      { id: 'demo-centre-4', ligne1: '21 rue Pasteur', ville: 'Ville exemple' },
      { id: 'demo-centre-5', ligne1: '3 place de la République', ville: 'Ville exemple' },
      { id: 'demo-centre-6', ligne1: '16 rue des Écoles', ville: 'Ville exemple' },
    ],
  },
  {
    id: 'demo-chartreux',
    nom: 'Les Chartreux',
    secteur: 'Chartreux',
    date: '09/11/2026',
    statut: 'PREPAREE',
    adresses: [
      { id: 'demo-chartreux-1', ligne1: '2 rue des Roses', ville: 'Ville exemple' },
      { id: 'demo-chartreux-2', ligne1: '5 allée des Tilleuls', ville: 'Ville exemple' },
      { id: 'demo-chartreux-3', ligne1: '10 rue des Jardins', ville: 'Ville exemple' },
      { id: 'demo-chartreux-4', ligne1: '7 impasse du Parc', ville: 'Ville exemple' },
    ],
  },
];

export const LIBELLES_PASSAGES = {
  VENTE: 'Vente',
  REFUS: 'Refus',
  ABSENT: 'Absent',
  A_REVOIR: 'À revoir',
} as const;

export const LIBELLES_PAIEMENTS = {
  ESPECES: 'Espèces',
  CHEQUE: 'Chèque',
  AUTRE: 'Autre',
} as const;
