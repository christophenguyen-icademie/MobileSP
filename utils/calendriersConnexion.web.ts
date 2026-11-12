import { CLE_CONNEXION, decoderConnexion, encoderConnexion, type ConnexionMemorisee } from './calendriersConnexionCommun';

export async function chargerConnexion(): Promise<ConnexionMemorisee | null> {
  if (typeof window === 'undefined') return null;
  try { return decoderConnexion(window.localStorage.getItem(CLE_CONNEXION)); }
  catch { throw new Error('Impossible de lire les informations de connexion mémorisées dans ce navigateur.'); }
}

export async function enregistrerConnexion(connexion: ConnexionMemorisee): Promise<void> {
  try { window.localStorage.setItem(CLE_CONNEXION, encoderConnexion(connexion)); }
  catch { throw new Error('Connexion réussie, mais les informations n’ont pas pu être mémorisées dans ce navigateur.'); }
}

export async function oublierConnexion(): Promise<void> {
  try { window.localStorage.removeItem(CLE_CONNEXION); }
  catch { throw new Error('Les informations mémorisées n’ont pas pu être effacées. Réessayez.'); }
}
