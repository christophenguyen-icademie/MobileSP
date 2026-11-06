import type {
  AdresseCalendrier, PassageCalendrier, SaisiePassage, TourneeCalendrier,
} from '@/types/calendriers';

function normaliserMontant(valeur: string): string {
  const montant = valeur.trim().replace(',', '.');
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(montant)) {
    throw new Error('Saisissez un montant positif ou nul avec au maximum deux décimales.');
  }
  const [euros, centimes = ''] = montant.split('.');
  return `${Number(euros)}.${centimes.padEnd(2, '0')}`;
}

export function creerPassage(
  tournee: TourneeCalendrier,
  adresse: AdresseCalendrier,
  saisie: SaisiePassage,
): PassageCalendrier {
  if (tournee.statut === 'VALIDEE') throw new Error('Cette tournée est validée et ne peut plus être modifiée.');
  if (!tournee.adresses.some(item => item.id === adresse.id)) throw new Error('Cette adresse ne fait pas partie de la tournée.');
  if (!['VENTE', 'REFUS', 'ABSENT', 'A_REVOIR'].includes(saisie.statut)) throw new Error('Résultat du passage invalide.');

  let nbCalendriers = 0;
  let montant = '0.00';
  if (saisie.statut === 'VENTE') {
    nbCalendriers = Number(saisie.quantite.trim());
    if (!/^\d+$/.test(saisie.quantite.trim()) || !Number.isSafeInteger(nbCalendriers) || nbCalendriers < 1) {
      throw new Error('Saisissez un nombre entier de calendriers supérieur à zéro.');
    }
    if (!['ESPECES', 'CHEQUE', 'AUTRE'].includes(saisie.moyenPaiement)) throw new Error('Choisissez un moyen de paiement.');
    montant = normaliserMontant(saisie.montant);
  }

  return {
    tourneeId: tournee.id,
    adresseId: adresse.id,
    statut: saisie.statut,
    nbCalendriers,
    montant,
    moyenPaiement: saisie.statut === 'VENTE' ? saisie.moyenPaiement : null,
    commentaire: saisie.commentaire.trim(),
    updatedAt: new Date().toISOString(),
  };
}

export function remplacerPassage(passages: PassageCalendrier[], passage: PassageCalendrier): PassageCalendrier[] {
  return [
    ...passages.filter(item => item.tourneeId !== passage.tourneeId || item.adresseId !== passage.adresseId),
    passage,
  ];
}

export function bilanPassages(passages: PassageCalendrier[]) {
  return passages.reduce((bilan, passage) => {
    if (passage.statut === 'VENTE') {
      const [euros, centimes] = passage.montant.split('.');
      bilan.nbCalendriers += passage.nbCalendriers;
      bilan.montantCentimes += Number(euros) * 100 + Number(centimes);
    }
    return bilan;
  }, { nbCalendriers: 0, montantCentimes: 0 });
}

export function passagesTournee(passages: PassageCalendrier[], tournee: TourneeCalendrier) {
  return passages.filter(passage => passage.tourneeId === tournee.id
    && tournee.adresses.some(adresse => adresse.id === passage.adresseId));
}

export function afficherEuros(centimes: number) {
  return (centimes / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

function passageValide(valeur: unknown): valeur is PassageCalendrier {
  if (!valeur || typeof valeur !== 'object') return false;
  const passage = valeur as Partial<PassageCalendrier>;
  if (typeof passage.tourneeId !== 'string' || !passage.tourneeId
    || typeof passage.adresseId !== 'string' || !passage.adresseId
    || typeof passage.commentaire !== 'string'
    || typeof passage.updatedAt !== 'string' || Number.isNaN(Date.parse(passage.updatedAt))
    || typeof passage.nbCalendriers !== 'number' || !Number.isSafeInteger(passage.nbCalendriers)
    || typeof passage.montant !== 'string' || !/^\d{1,7}\.\d{2}$/.test(passage.montant)) return false;
  if (passage.statut === 'VENTE') {
    return passage.nbCalendriers > 0 && ['ESPECES', 'CHEQUE', 'AUTRE'].includes(passage.moyenPaiement ?? '');
  }
  return ['REFUS', 'ABSENT', 'A_REVOIR'].includes(passage.statut ?? '')
    && passage.nbCalendriers === 0 && passage.montant === '0.00' && passage.moyenPaiement === null;
}

export function decoderPassages(contenu: string): PassageCalendrier[] {
  const stockage: unknown = JSON.parse(contenu);
  if (!stockage || typeof stockage !== 'object' || !('version' in stockage) || stockage.version !== 1
    || !('passages' in stockage) || !Array.isArray(stockage.passages)
    || !stockage.passages.every(passageValide)) {
    throw new Error('Le fichier des passages est invalide.');
  }
  const cles = stockage.passages.map(passage => JSON.stringify([passage.tourneeId, passage.adresseId]));
  if (new Set(cles).size !== cles.length) throw new Error('Le fichier contient des passages en double.');
  return stockage.passages;
}

export function encoderPassages(passages: PassageCalendrier[]): string {
  const contenu = JSON.stringify({ version: 1, passages });
  decoderPassages(contenu);
  return contenu;
}
