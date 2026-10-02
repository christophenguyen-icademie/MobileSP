import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export async function downloadDocumentationVideo(source: number | string, fileName: string) {
  const asset = typeof source === 'number' ? Asset.fromModule(source) : Asset.fromURI(source);
  const name = fileName.split('/').pop()?.split(/[?#]/)[0] || 'video.webm';

  if (Platform.OS === 'web') {
    const uri = new URL(asset.uri, window.location.href);
    let objectUrl: string | undefined;
    let downloadUrl = uri.href;

    // Le navigateur accepte l'attribut download pour les URL de même origine.
    if (uri.origin !== window.location.origin) {
      const response = await fetch(uri.href);
      if (!response.ok) throw new Error('Le téléchargement de la vidéo a échoué.');
      objectUrl = URL.createObjectURL(await response.blob());
      downloadUrl = objectUrl;
    }

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    if (objectUrl) setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
    return;
  }

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("L'enregistrement et le partage ne sont pas disponibles sur cet appareil.");
  }
  if (!FileSystem.cacheDirectory) throw new Error('Le stockage local est indisponible.');

  await asset.downloadAsync();
  if (!asset.localUri) throw new Error('La vidéo n’a pas pu être téléchargée.');

  const directory = `${FileSystem.cacheDirectory}documentation-videos/`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const uri = `${directory}${encodeURIComponent(name)}`;
  await FileSystem.copyAsync({ from: asset.localUri, to: uri });
  await Sharing.shareAsync(uri, { mimeType: 'video/webm', dialogTitle: 'Enregistrer la vidéo' });
}
