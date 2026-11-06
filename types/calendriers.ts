export type PassageStatut = 'VENTE' | 'REFUS' | 'ABSENT' | 'A_REVOIR';
export type MoyenPaiement = 'ESPECES' | 'CHEQUE' | 'AUTRE';

export type AdresseCalendrier = {
  id: string;
  ligne1: string;
  ville: string;
};

export type TourneeCalendrier = {
  id: string;
  nom: string;
  secteur: string;
  date: string;
  statut: 'PREPAREE' | 'EN_COURS' | 'TERMINEE' | 'VALIDEE';
  adresses: AdresseCalendrier[];
};

export type SaisiePassage = {
  statut: PassageStatut;
  quantite: string;
  montant: string;
  moyenPaiement: MoyenPaiement;
  commentaire: string;
};

export type PassageCalendrier = {
  tourneeId: string;
  adresseId: string;
  statut: PassageStatut;
  nbCalendriers: number;
  montant: string;
  moyenPaiement: MoyenPaiement | null;
  commentaire: string;
  updatedAt: string;
};
