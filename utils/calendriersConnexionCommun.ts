import { normaliserUrlApi } from './calendriersApi';

export type ConnexionMemorisee = { serveur: string; amicale: string; email: string; password: string };
export const CLE_CONNEXION = 'mobilesp.calendriers.connexion.v1';

export function decoderConnexion(contenu: string | null): ConnexionMemorisee | null {
  if (contenu === null) return null;
  try {
    const value = JSON.parse(contenu);
    if (!value || value.version !== 1 || typeof value.serveur !== 'string'
      || typeof value.amicale !== 'string' || !/^[a-zA-Z0-9]{4,20}$/.test(value.amicale)
      || typeof value.email !== 'string' || !value.email.trim()
      || typeof value.password !== 'string' || !value.password) return null;
    return { serveur: normaliserUrlApi(value.serveur), amicale: value.amicale, email: value.email, password: value.password };
  } catch { return null; }
}

export function encoderConnexion(connexion: ConnexionMemorisee): string {
  return JSON.stringify({ version: 1, ...connexion });
}
