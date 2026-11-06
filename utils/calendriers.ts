import type {
  AdresseCalendrier, AdresseLocale, AttributionRecu, DonneesCalendriers, PassageCalendrier, SaisieAdresse, SaisiePassage, TourneeCalendrier,
} from '@/types/calendriers';
import { CARNETS_DEMONSTRATION } from '@/constants/calendriers';

const MOYENS_PAIEMENT = ['ESPECES', 'CHEQUE', 'CB', 'DON', 'AUTRE'];

export function dateLocale(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function afficherDatePassage(date: string): string {
  return date.split('-').reverse().join('/');
}

function datePassageValide(date: unknown): date is string {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date < '1900-01-01') return false;
  const parsed = new Date(`${date}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

function normaliserDatePassage(saisie: string): string {
  const date = saisie.trim().split('/').reverse().join('-');
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(saisie.trim()) || !datePassageValide(date)) {
    throw new Error('Saisissez une date de passage valide au format JJ/MM/AAAA.');
  }
  if (date > dateLocale()) throw new Error('La date du passage ne peut pas être dans le futur.');
  return date;
}

function referenceRecuValide(numeroCarnet: unknown, numeroRecu: unknown): boolean {
  return typeof numeroRecu === 'string' && /^\d{5}$/.test(numeroRecu)
    && CARNETS_DEMONSTRATION.some(carnet => carnet.numero === numeroCarnet && carnet.recus.includes(numeroRecu));
}

export function recusDisponibles(donnees: DonneesCalendriers, numeroCarnet: string, tourneeId: string, adresseId: string): string[] {
  const actuel = donnees.passages.find(p => p.tourneeId === tourneeId && p.adresseId === adresseId);
  return CARNETS_DEMONSTRATION.find(carnet => carnet.numero === numeroCarnet)?.recus.filter(numeroRecu => {
    const utilise = donnees.recusUtilises.some(recu => recu.numeroCarnet === numeroCarnet && recu.numeroRecu === numeroRecu);
    return !utilise || (actuel?.numeroCarnet === numeroCarnet && actuel.numeroRecu === numeroRecu);
  }) ?? [];
}

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
  const datePassage = normaliserDatePassage(saisie.datePassage);

  let nbCalendriers = 0;
  let montant = '0.00';
  if (saisie.statut === 'VENTE') {
    nbCalendriers = Number(saisie.quantite.trim());
    if (!/^\d+$/.test(saisie.quantite.trim()) || !Number.isSafeInteger(nbCalendriers) || nbCalendriers < 1) {
      throw new Error('Saisissez un nombre entier de calendriers supérieur à zéro.');
    }
    if (!MOYENS_PAIEMENT.includes(saisie.moyenPaiement)) throw new Error('Choisissez un moyen de paiement.');
    montant = normaliserMontant(saisie.montant);
    if (!CARNETS_DEMONSTRATION.some(carnet => carnet.numero === saisie.numeroCarnet)) {
      throw new Error('Choisissez un carnet de reçus dans la liste.');
    }
    if (!/^\d{5}$/.test(saisie.numeroRecu)) throw new Error('Saisissez un numéro de reçu à exactement 5 chiffres.');
    if (!referenceRecuValide(saisie.numeroCarnet, saisie.numeroRecu)) {
      throw new Error('Ce numéro de reçu ne fait pas partie du carnet sélectionné.');
    }
  }

  return {
    tourneeId: tournee.id,
    adresseId: adresse.id,
    statut: saisie.statut,
    datePassage,
    numeroCarnet: saisie.statut === 'VENTE' ? saisie.numeroCarnet : null,
    numeroRecu: saisie.statut === 'VENTE' ? saisie.numeroRecu : null,
    nbCalendriers,
    montant,
    moyenPaiement: saisie.statut === 'VENTE' ? saisie.moyenPaiement : null,
    commentaire: saisie.commentaire.trim(),
    updatedAt: new Date().toISOString(),
  };
}

export function enregistrerPassageLocal(
  donnees: DonneesCalendriers, tournee: TourneeCalendrier, adresse: AdresseCalendrier, saisie: SaisiePassage,
): DonneesCalendriers {
  const passage = creerPassage(tournee, adresse, saisie);
  let recusUtilises = donnees.recusUtilises;
  if (passage.numeroCarnet && passage.numeroRecu) {
    if (!recusDisponibles(donnees, passage.numeroCarnet, tournee.id, adresse.id).includes(passage.numeroRecu)) {
      throw new Error('Ce reçu a déjà été utilisé. Choisissez un autre numéro.');
    }
    if (!recusUtilises.some(recu => recu.numeroCarnet === passage.numeroCarnet && recu.numeroRecu === passage.numeroRecu)) {
      recusUtilises = [...recusUtilises, {
        numeroCarnet: passage.numeroCarnet, numeroRecu: passage.numeroRecu, tourneeId: tournee.id, adresseId: adresse.id,
      }];
    }
  }
  return { ...donnees, passages: remplacerPassage(donnees.passages, passage), recusUtilises };
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

export function bilanCarnets(passages: PassageCalendrier[]) {
  const carnets = new Map<string | null, { numeroCarnet: string | null; nbRecus: number; nbVentes: number; montantCentimes: number }>();
  for (const passage of passages.filter(item => item.statut === 'VENTE')) {
    const bilan = carnets.get(passage.numeroCarnet) ?? { numeroCarnet: passage.numeroCarnet, nbRecus: 0, nbVentes: 0, montantCentimes: 0 };
    bilan.nbRecus += passage.numeroRecu ? 1 : 0;
    bilan.nbVentes += 1;
    bilan.montantCentimes += bilanPassages([passage]).montantCentimes;
    carnets.set(passage.numeroCarnet, bilan);
  }
  return [...carnets.values()].sort((a, b) => (a.numeroCarnet ?? '~').localeCompare(b.numeroCarnet ?? '~'));
}

export function passagesTournee(passages: PassageCalendrier[], tournee: TourneeCalendrier) {
  return passages.filter(passage => passage.tourneeId === tournee.id
    && tournee.adresses.some(adresse => adresse.id === passage.adresseId));
}

export function afficherEuros(centimes: number) {
  return (centimes / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

export function complementAdresse(adresse: AdresseCalendrier) {
  return [
    adresse.batiment && `Bât. ${adresse.batiment}`,
    adresse.etage && `Étage ${adresse.etage}`,
    adresse.appartement && `Appt. ${adresse.appartement}`,
  ].filter(Boolean).join(' · ');
}

export function appliquerAdressesLocales(tournees: TourneeCalendrier[], adresses: AdresseLocale[]): TourneeCalendrier[] {
  return tournees.map(tournee => {
    const locales = adresses.filter(adresse => adresse.tourneeId === tournee.id);
    return {
      ...tournee,
      adresses: [
        ...tournee.adresses.map(adresse => locales.find(locale => locale.id === adresse.id) ?? adresse),
        ...locales.filter(locale => !tournee.adresses.some(adresse => adresse.id === locale.id)),
      ],
    };
  });
}

let sequenceAdresse = 0;

export function creerAdresse(tournee: TourneeCalendrier, saisie: SaisieAdresse, adresseId?: string): AdresseLocale {
  if (tournee.statut === 'VALIDEE') throw new Error('Cette tournée est validée et ne peut plus être modifiée.');
  if (adresseId && !tournee.adresses.some(adresse => adresse.id === adresseId)) {
    throw new Error('Cette adresse ne fait pas partie de la tournée.');
  }
  const adresse: AdresseLocale = {
    id: adresseId ?? `local-${Date.now().toString(36)}-${++sequenceAdresse}-${Math.random().toString(36).slice(2, 10)}`,
    tourneeId: tournee.id,
    ligne1: saisie.ligne1.trim(),
    ville: saisie.ville.trim(),
    codePostal: saisie.codePostal.trim(),
    appartement: saisie.appartement.trim(),
    etage: saisie.etage.trim(),
    batiment: saisie.batiment.trim(),
  };
  if (!adresse.ligne1 || !adresse.ville) throw new Error('Renseignez le numéro et la voie, ainsi que la ville.');
  if (!adresseLocaleValide(adresse)) throw new Error('Vérifiez la longueur des champs de l’adresse.');
  const normaliser = (valeur = '') => valeur.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr-FR').replace(/\s+/g, ' ').trim();
  const memeAdresse = tournee.adresses.some(existante => existante.id !== adresse.id
    && (['ligne1', 'ville', 'appartement', 'etage', 'batiment'] as const)
      .every(champ => normaliser(existante[champ]) === normaliser(adresse[champ])));
  if (memeAdresse) throw new Error('Cette adresse existe déjà dans la tournée. Sélectionnez-la dans la liste.');
  return adresse;
}

export function remplacerAdresseLocale(adresses: AdresseLocale[], adresse: AdresseLocale): AdresseLocale[] {
  return [...adresses.filter(item => item.tourneeId !== adresse.tourneeId || item.id !== adresse.id), adresse];
}

function passageValide(valeur: unknown): valeur is PassageCalendrier {
  if (!valeur || typeof valeur !== 'object') return false;
  const passage = valeur as Partial<PassageCalendrier>;
  if (typeof passage.tourneeId !== 'string' || !passage.tourneeId
    || typeof passage.adresseId !== 'string' || !passage.adresseId
    || typeof passage.commentaire !== 'string'
    || typeof passage.updatedAt !== 'string' || Number.isNaN(Date.parse(passage.updatedAt))
    || !datePassageValide(passage.datePassage)
    || typeof passage.nbCalendriers !== 'number' || !Number.isSafeInteger(passage.nbCalendriers)
    || typeof passage.montant !== 'string' || !/^\d{1,7}\.\d{2}$/.test(passage.montant)) return false;
  if (passage.statut === 'VENTE') {
    return passage.nbCalendriers > 0 && MOYENS_PAIEMENT.includes(passage.moyenPaiement ?? '')
      && ((passage.numeroCarnet === null && passage.numeroRecu === null) || referenceRecuValide(passage.numeroCarnet, passage.numeroRecu));
  }
  return ['REFUS', 'ABSENT', 'A_REVOIR'].includes(passage.statut ?? '')
    && passage.nbCalendriers === 0 && passage.montant === '0.00' && passage.moyenPaiement === null
    && passage.numeroCarnet === null && passage.numeroRecu === null;
}

function adresseLocaleValide(valeur: unknown): valeur is AdresseLocale {
  if (!valeur || typeof valeur !== 'object') return false;
  const adresse = valeur as Partial<AdresseLocale>;
  if (typeof adresse.id !== 'string' || !adresse.id
    || typeof adresse.tourneeId !== 'string' || !adresse.tourneeId
    || typeof adresse.ligne1 !== 'string' || !adresse.ligne1.trim() || adresse.ligne1.length > 180
    || typeof adresse.ville !== 'string' || !adresse.ville.trim() || adresse.ville.length > 120) return false;
  return (['codePostal', 'appartement', 'etage', 'batiment'] as const).every(champ => {
    const limite = { codePostal: 10, appartement: 20, etage: 20, batiment: 50 }[champ];
    return adresse[champ] === undefined || (typeof adresse[champ] === 'string' && adresse[champ].length <= limite);
  });
}

function attributionRecuValide(valeur: unknown): valeur is AttributionRecu {
  if (!valeur || typeof valeur !== 'object') return false;
  const recu = valeur as Partial<AttributionRecu>;
  return referenceRecuValide(recu.numeroCarnet, recu.numeroRecu)
    && typeof recu.tourneeId === 'string' && !!recu.tourneeId
    && typeof recu.adresseId === 'string' && !!recu.adresseId;
}

export function decoderCalendriers(contenu: string): DonneesCalendriers {
  const stockage: unknown = JSON.parse(contenu);
  if (!stockage || typeof stockage !== 'object' || !('version' in stockage)
    || ![1, 2, 3].includes(stockage.version as number)
    || !('passages' in stockage) || !Array.isArray(stockage.passages)) {
    throw new Error('Le fichier des passages est invalide.');
  }
  const passages: unknown[] = stockage.passages.map((valeur: unknown) => {
    if (stockage.version === 3 || !valeur || typeof valeur !== 'object') return valeur;
    const ancien = valeur as Partial<PassageCalendrier>;
    return {
      ...ancien,
      datePassage: ancien.datePassage ?? (typeof ancien.updatedAt === 'string' ? dateLocale(new Date(ancien.updatedAt)) : null),
      numeroCarnet: ancien.numeroCarnet ?? null,
      numeroRecu: ancien.numeroRecu ?? null,
    };
  });
  if (!passages.every(passageValide)) throw new Error('Le fichier des passages est invalide.');
  const cles = passages.map(passage => JSON.stringify([passage.tourneeId, passage.adresseId]));
  if (new Set(cles).size !== cles.length) throw new Error('Le fichier contient des passages en double.');
  const adresses = stockage.version === 1 ? [] : ('adresses' in stockage ? stockage.adresses : null);
  if (!Array.isArray(adresses) || !adresses.every(adresseLocaleValide)) {
    throw new Error('Le fichier des adresses est invalide.');
  }
  const clesAdresses = adresses.map(adresse => JSON.stringify([adresse.tourneeId, adresse.id]));
  if (new Set(clesAdresses).size !== clesAdresses.length) throw new Error('Le fichier contient des adresses en double.');
  const ventesAvecRecu = passages.filter(passage => passage.numeroCarnet !== null);
  const recusUtilises = stockage.version === 3 ? ('recusUtilises' in stockage ? stockage.recusUtilises : null)
    : ventesAvecRecu.map(passage => ({
      numeroCarnet: passage.numeroCarnet, numeroRecu: passage.numeroRecu, tourneeId: passage.tourneeId, adresseId: passage.adresseId,
    }));
  if (!Array.isArray(recusUtilises) || !recusUtilises.every(attributionRecuValide)) {
    throw new Error('Le registre des reçus utilisés est invalide.');
  }
  const cleRecu = (recu: { numeroCarnet: string | null; numeroRecu: string | null }) => JSON.stringify([recu.numeroCarnet, recu.numeroRecu]);
  if (new Set(recusUtilises.map(cleRecu)).size !== recusUtilises.length
    || new Set(ventesAvecRecu.map(cleRecu)).size !== ventesAvecRecu.length) {
    throw new Error('Un numéro de reçu est utilisé plusieurs fois dans le même carnet.');
  }
  if (!ventesAvecRecu.every(passage => recusUtilises.some(recu => cleRecu(recu) === cleRecu(passage)
    && recu.tourneeId === passage.tourneeId && recu.adresseId === passage.adresseId))) {
    throw new Error('Un reçu ne correspond pas à son attribution enregistrée.');
  }
  return { passages, adresses, recusUtilises };
}

export function encoderCalendriers(donnees: DonneesCalendriers): string {
  const contenu = JSON.stringify({ version: 3, ...donnees });
  decoderCalendriers(contenu);
  return contenu;
}

export class ConflitRecusError extends Error {
  constructor() {
    super('Les reçus enregistrés ont changé depuis le chargement. Relancez l’application avant de réessayer.');
  }
}

export function verifierConservationRecus(precedentes: DonneesCalendriers, suivantes: DonneesCalendriers): void {
  if (!precedentes.recusUtilises.every(ancien => suivantes.recusUtilises.some(recu =>
    recu.numeroCarnet === ancien.numeroCarnet && recu.numeroRecu === ancien.numeroRecu
    && recu.tourneeId === ancien.tourneeId && recu.adresseId === ancien.adresseId))) {
    throw new ConflitRecusError();
  }
}
