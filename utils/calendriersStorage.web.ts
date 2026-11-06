import type { PassageCalendrier } from '@/types/calendriers';
import { decoderPassages, encoderPassages } from './calendriers';

const CLE_STOCKAGE = 'mobilesp.calendriers.demo.v1';

export async function chargerPassages(): Promise<PassageCalendrier[]> {
  if (typeof window === 'undefined') throw new Error('Le stockage du navigateur est indisponible.');
  const contenu = window.localStorage.getItem(CLE_STOCKAGE);
  return contenu === null ? [] : decoderPassages(contenu);
}

export async function enregistrerPassages(passages: PassageCalendrier[]): Promise<void> {
  window.localStorage.setItem(CLE_STOCKAGE, encoderPassages(passages));
}
