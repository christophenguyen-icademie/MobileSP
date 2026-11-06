export type PassageStatut = 'VENTE' | 'REFUS' | 'ABSENT' | 'A_REVOIR';
export type MoyenPaiement = 'ESPECES' | 'CHEQUE' | 'CB' | 'DON' | 'AUTRE';

export type AdresseCalendrier = {
  id: string;
  ligne1: string;
  ville: string;
  codePostal?: string;
  appartement?: string;
  etage?: string;
  batiment?: string;
};

export type SaisieAdresse = {
  ligne1: string;
  ville: string;
  codePostal: string;
  appartement: string;
  etage: string;
  batiment: string;
};

export type AdresseLocale = AdresseCalendrier & { tourneeId: string };

export type DonneesCalendriers = {
  passages: PassageCalendrier[];
  adresses: AdresseLocale[];
  recusUtilises: AttributionRecu[];
};

export type CarnetRecus = {
  numero: string;
  recus: string[];
};

export type AttributionRecu = {
  numeroCarnet: string;
  numeroRecu: string;
  tourneeId: string;
  adresseId: string;
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
  datePassage: string;
  numeroCarnet: string;
  numeroRecu: string;
  quantite: string;
  montant: string;
  moyenPaiement: MoyenPaiement;
  commentaire: string;
};

export type PassageCalendrier = {
  tourneeId: string;
  adresseId: string;
  statut: PassageStatut;
  datePassage: string;
  // Les anciennes ventes restent sans reçu jusqu'à leur prochaine modification.
  numeroCarnet: string | null;
  numeroRecu: string | null;
  nbCalendriers: number;
  montant: string;
  moyenPaiement: MoyenPaiement | null;
  commentaire: string;
  updatedAt: string;
};
