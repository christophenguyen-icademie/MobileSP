import * as FileSystem from 'expo-file-system/legacy';

import type { DonneesCalendriers } from '@/types/calendriers';
import { decoderCalendriers, encoderCalendriers, verifierConservationRecus } from './calendriers';

function fichierPassages() {
  if (!FileSystem.documentDirectory) throw new Error('Le stockage local est indisponible.');
  return `${FileSystem.documentDirectory}calendriersp-demo-passages-v1.json`;
}

export async function chargerCalendriers(): Promise<DonneesCalendriers> {
  const fichier = fichierPassages();
  if ((await FileSystem.getInfoAsync(fichier)).exists) {
    return decoderCalendriers(await FileSystem.readAsStringAsync(fichier));
  }
  // Reprise d'une écriture interrompue entre le remplacement et le déplacement.
  const temporaire = `${fichier}.tmp`;
  if ((await FileSystem.getInfoAsync(temporaire)).exists) {
    const donnees = decoderCalendriers(await FileSystem.readAsStringAsync(temporaire));
    await FileSystem.moveAsync({ from: temporaire, to: fichier });
    return donnees;
  }
  return { passages: [], adresses: [], recusUtilises: [] };
}

export async function enregistrerCalendriers(donnees: DonneesCalendriers): Promise<void> {
  const fichier = fichierPassages();
  const contenu = encoderCalendriers(donnees);
  verifierConservationRecus(await chargerCalendriers(), donnees);
  await FileSystem.writeAsStringAsync(`${fichier}.tmp`, contenu);
  await FileSystem.moveAsync({ from: `${fichier}.tmp`, to: fichier });
}
