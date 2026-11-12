import * as SecureStore from 'expo-secure-store';

import { CLE_CONNEXION, decoderConnexion, encoderConnexion, type ConnexionMemorisee } from './calendriersConnexionCommun';

export async function chargerConnexion(): Promise<ConnexionMemorisee | null> {
  try { return decoderConnexion(await SecureStore.getItemAsync(CLE_CONNEXION)); }
  catch { throw new Error('Impossible de lire les informations de connexion mémorisées sur cet appareil.'); }
}

export async function enregistrerConnexion(connexion: ConnexionMemorisee): Promise<void> {
  try {
    await SecureStore.setItemAsync(CLE_CONNEXION, encoderConnexion(connexion), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch { throw new Error('Connexion réussie, mais les informations n’ont pas pu être mémorisées sur cet appareil.'); }
}

export async function oublierConnexion(): Promise<void> {
  try { await SecureStore.deleteItemAsync(CLE_CONNEXION); }
  catch { throw new Error('Les informations mémorisées n’ont pas pu être effacées. Réessayez.'); }
}
