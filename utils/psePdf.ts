import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import { Linking, Platform } from "react-native";

import { PSE_ASSETS } from "@/constants/pseAssets";

export async function ouvrirPdfPse(reference: string) {
  const modulePdf = PSE_ASSETS[reference];
  if (!modulePdf) throw new Error(`PDF ${reference} non indexé`);
  const asset = Asset.fromModule(modulePdf);
  await asset.downloadAsync();
  let uri = asset.localUri ?? asset.uri;
  if (Platform.OS === "android" && uri.startsWith("file://")) {
    uri = await FileSystem.getContentUriAsync(uri);
  }
  await Linking.openURL(uri);
}
