import type { Adresse, Carnet, Filtres, FormulairePassage, StatutPassage } from '@/types/calendriersApi';

export const RESULTATS: Record<StatutPassage, string> = { VENTE: 'Vente', DON: 'Don', REFUS: 'Refus', ABSENT: 'Absent', A_REVOIR: 'À revoir', NON_VISITEE: 'Non visitée' };
export const PAIEMENTS = { ESPECES: 'Espèces', CHEQUE: 'Chèque', CB: 'CB', AUTRE: 'Autre' } as const;
export const LOGEMENT = { batiment: 'Bâtiment', etage: 'Étage', appartement: 'Appartement', porte: 'Porte' } as const;
export const nomSapeur = (sapeur: { nom?: string | null; email: string }) => sapeur.nom?.trim() || sapeur.email;
export const FILTRES_INITIAUX: Filtres = { rue: '', statut: '', carnet: '', recu: '', tri: 'adresse', decroissant: false };
export const euros = (montant: string) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(montant));
export const dateAffichee = (date: string) => date.split('-').reverse().join('/');
export function dateLocale(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
export const logement = (adresse: Adresse) => [adresse.complement, ...Object.entries(LOGEMENT).map(([key, label]) => adresse[key as keyof typeof LOGEMENT] ? `${label} ${adresse[key as keyof typeof LOGEMENT]}` : '')].filter(Boolean).join(' · ');
export const couleurResultat = (statut: StatutPassage) => ['VENTE', 'DON'].includes(statut) ? '#267046' : statut === 'REFUS' ? '#b12836' : ['ABSENT', 'A_REVOIR'].includes(statut) ? '#a45d00' : '#66748a';

export function formulaire(mode: FormulairePassage['mode'], source: Adresse | null): FormulairePassage {
  const p = mode === 'existing' ? source?.passage : null;
  return { mode, source, ligne1: source?.ligne1 ?? '', codePostal: source?.codePostal ?? '', ville: source?.ville ?? '',
    batiment: mode === 'existing' ? source?.batiment ?? '' : '', etage: mode === 'existing' ? source?.etage ?? '' : '',
    appartement: mode === 'existing' ? source?.appartement ?? '' : '', porte: mode === 'existing' ? source?.porte ?? '' : '',
    statut: p?.statut ?? 'VENTE', datePassage: dateAffichee(p?.datePassage ?? dateLocale()), quantite: String(p?.nbCalendriers || 1),
    montant: p?.statut === 'VENTE' ? p.montant : '', moyenPaiement: p?.moyenPaiement ?? 'ESPECES', commentaire: p?.commentaire ?? '',
    carnetId: p?.recu?.carnetId ?? '', recuId: p?.recu?.id ?? '',
  };
}

export function recusSelectionnables(carnet: Carnet | undefined, f: FormulairePassage) {
  const courant = f.mode === 'existing' ? f.source?.passage?.recu?.id : null;
  return (carnet?.recus ?? []).filter(r => !r.utilise || r.id === courant);
}

export function payloadPassage(f: FormulairePassage, carnets: Carnet[], aujourdHui = dateLocale()) {
  if (!Object.hasOwn(RESULTATS, f.statut)) throw new Error('Choisissez un résultat.');
  const date = f.datePassage.trim().split('/').reverse().join('-');
  const parsed = new Date(`${date}T12:00:00Z`);
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(f.datePassage.trim()) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date || date < '1900-01-01' || date > aujourdHui) {
    throw new Error('Saisissez une date de passage valide au format JJ/MM/AAAA, aujourd’hui ou dans le passé.');
  }
  const housing = Object.fromEntries(Object.keys(LOGEMENT).map(key => {
    const value = f[key as keyof typeof LOGEMENT].trim();
    if (value.length > 80) throw new Error('Chaque précision de logement est limitée à 80 caractères.');
    return [key, value || null];
  }));
  if (f.mode === 'duplicate' && !Object.values(housing).some(Boolean)) throw new Error('Précisez le logement du nouvel appartement.');
  const address = f.mode === 'new' ? { ligne1: f.ligne1.trim(), codePostal: f.codePostal.trim(), ville: f.ville.trim() } : {};
  if (f.mode === 'new' && (!address.ligne1 || address.ligne1.length > 180 || !address.codePostal || address.codePostal.length > 10 || !address.ville || address.ville.length > 120)) {
    throw new Error('Renseignez le numéro et la voie, le code postal et la ville.');
  }
  if (f.commentaire.trim().length > 2000) throw new Error('Le commentaire est limité à 2 000 caractères.');
  const receipt = ['VENTE', 'DON'].includes(f.statut);
  if (receipt && !recusSelectionnables(carnets.find(c => c.id === f.carnetId), f).some(r => r.id === f.recuId)) {
    throw new Error('Choisissez un carnet et un reçu disponible dans cette tournée.');
  }
  let nbCalendriers = 0, montant = '0.00';
  if (f.statut === 'VENTE') {
    nbCalendriers = Number(f.quantite);
    if (!/^\d+$/.test(f.quantite.trim()) || nbCalendriers < 1 || nbCalendriers > 100000) throw new Error('La quantité doit être un entier de 1 à 100 000.');
    const value = f.montant.trim().replace(',', '.');
    if (!/^\d{1,7}(\.\d{1,2})?$/.test(value)) throw new Error('Saisissez un montant positif ou nul avec deux décimales maximum.');
    const [entier, fraction = ''] = value.split('.'); montant = `${Number(entier)}.${fraction.padEnd(2, '0')}`;
    if (!Object.hasOwn(PAIEMENTS, f.moyenPaiement)) throw new Error('Choisissez un moyen de paiement.');
  }
  return { ...address, ...housing, statut: f.statut, datePassage: date, nbCalendriers, montant,
    moyenPaiement: f.statut === 'VENTE' ? f.moyenPaiement : null, commentaire: f.commentaire.trim() || null,
    carnetId: receipt ? f.carnetId : null, recuId: receipt ? f.recuId : null,
  };
}

const compare = new Intl.Collator('fr', { numeric: true, sensitivity: 'base' }).compare;
export const rue = (a: Adresse) => a.ligne1.replace(/^\s*\d+(?:\s*(?:bis|ter|quater|quinquies|[a-z])(?=\s|[-/]|$))?(?:\s*[-/]\s*\d+(?:\s*(?:bis|ter|quater|quinquies|[a-z])(?=\s|$))?)?\s+/iu, '').trim().replace(/\s+/g, ' ');
export const cleRue = (value: string) => value.normalize('NFC').toLocaleLowerCase('fr');
export function rues(adresses: Adresse[]) { return [...new Map(adresses.map(a => [cleRue(rue(a)), rue(a)])).entries()].sort((a, b) => compare(a[1], b[1])); }
export function comparerAdresses(a: Adresse, b: Adresse): number {
  const voie = compare(rue(a), rue(b));
  if (voie) return voie;
  const numeroA = a.ligne1.match(/^\s*(\d+)/u);
  const numeroB = b.ligne1.match(/^\s*(\d+)/u);
  // Les suffixes sont ignorés ; un même numéro conserve l’ordre d’origine.
  if (numeroA && numeroB) return Number(numeroA[1]) - Number(numeroB[1]);
  if (numeroA) return -1;
  if (numeroB) return 1;
  return compare(a.ligne1, b.ligne1);
}
export function filtrerAdresses(adresses: Adresse[], f: Filtres) {
  return adresses.filter(a => (!f.rue || cleRue(rue(a)) === f.rue) && (!f.statut || (a.passage?.statut ?? 'NON_VISITEE') === f.statut)
    && (!f.carnet || (f.carnet === 'sans-carnet' ? !a.passage?.recu : a.passage?.recu?.carnetId === f.carnet))
    && (!f.recu.trim() || (/^\d+$/.test(f.recu.trim()) && a.passage?.recu?.numero === Number(f.recu.trim()))))
    .sort((a, b) => {
      const adresse = comparerAdresses(a, b);
      const result = f.tri === 'montant' ? Number(a.passage?.montant ?? 0) - Number(b.passage?.montant ?? 0)
        : f.tri === 'resultat' ? compare(RESULTATS[a.passage?.statut ?? 'NON_VISITEE'], RESULTATS[b.passage?.statut ?? 'NON_VISITEE']) : adresse;
      return (result || adresse) * (f.decroissant ? -1 : 1);
    });
}
