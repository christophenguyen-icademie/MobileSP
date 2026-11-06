import * as FileSystem from 'expo-file-system/legacy';

import type { PassageCalendrier } from '@/types/calendriers';
import { decoderPassages, encoderPassages } from './calendriers';

function fichierPassages() {
  if (!FileSystem.documentDirectory) throw new Error('Le stockage local est indisponible.');
  return `${FileSystem.documentDirectory}calendriersp-demo-passages-v1.json`;
}

export async function chargerPassages(): Promise<PassageCalendrier[]> {
  const fichier = fichierPassages();
  if ((await FileSystem.getInfoAsync(fichier)).exists) {
    return decoderPassages(await FileSystem.readAsStringAsync(fichier));
  }
  // Reprise d'une écriture interrompue entre le remplacement et le déplacement.
  const temporaire = `${fichier}.tmp`;
  if ((await FileSystem.getInfoAsync(temporaire)).exists) {
    return decoderPassages(await FileSystem.readAsStringAsync(temporaire));
  }
  return [];
}

export async function enregistrerPassages(passages: PassageCalendrier[]): Promise<void> {
  const fichier = fichierPassages();
  await FileSystem.writeAsStringAsync(`${fichier}.tmp`, encoderPassages(passages));
  await FileSystem.moveAsync({ from: `${fichier}.tmp`, to: fichier });
}
