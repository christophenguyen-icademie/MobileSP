import type { DonneesCalendriers } from '@/types/calendriers';
import { decoderCalendriers, encoderCalendriers, verifierConservationRecus } from './calendriers';

const CLE_STOCKAGE = 'mobilesp.calendriers.demo.v1';

export async function chargerCalendriers(): Promise<DonneesCalendriers> {
  if (typeof window === 'undefined') throw new Error('Le stockage du navigateur est indisponible.');
  const contenu = window.localStorage.getItem(CLE_STOCKAGE);
  return contenu === null ? { passages: [], adresses: [], recusUtilises: [] } : decoderCalendriers(contenu);
}

export async function enregistrerCalendriers(donnees: DonneesCalendriers): Promise<void> {
  const contenu = encoderCalendriers(donnees);
  const precedent = window.localStorage.getItem(CLE_STOCKAGE);
  if (precedent !== null) verifierConservationRecus(decoderCalendriers(precedent), donnees);
  window.localStorage.setItem(CLE_STOCKAGE, contenu);
}
