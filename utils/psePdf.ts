import { isRunningInExpoGo } from "expo";
import { Asset } from "expo-asset";
import * as Sharing from "expo-sharing";
import { Linking, Platform } from "react-native";

import { SECOURISME_ASSETS } from "@/constants/secourisme";

export async function ouvrirPdfPse(reference: string) {
  const modulePdf = SECOURISME_ASSETS[reference];
  if (modulePdf == null) throw new Error(`PDF ${reference} non indexé`);
  return ouvrirPdfAsset(modulePdf, reference);
}

export async function ouvrirPdfAsset(modulePdf: number | string, reference: string) {
  const asset = Asset.fromModule(modulePdf);
  if (Platform.OS === "web") {
    await Linking.openURL(asset.uri);
    return;
  }
  await asset.downloadAsync();
  if (!asset.localUri) throw new Error(`PDF ${reference} indisponible`);
  if (isRunningInExpoGo()) {
    await Sharing.shareAsync(asset.localUri, { mimeType: "application/pdf", UTI: "com.adobe.pdf" });
    return;
  }
  const { default: ReactNativeBlobUtil } = await import("react-native-blob-util");
  const path = decodeURIComponent(asset.localUri.replace(/^file:\/\//, ""));
  if (Platform.OS === "android") {
    await ReactNativeBlobUtil.android.actionViewIntent(path, "application/pdf");
  } else {
    await ReactNativeBlobUtil.ios.previewDocument(path);
  }
}
