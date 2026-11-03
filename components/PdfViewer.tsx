import { Asset } from 'expo-asset';
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Text, View } from "react-native";
import { WebView } from "./WebViewWrapper";

export default function PdfViewerExpo({ initialUri }: { initialUri: string | number }) {
  const [uri, setUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setUri(null);
    setError(null);

    async function prepare() {
      try {
        let url: string;
        // Sur le web, require() peut renvoyer une URL plutôt qu'un identifiant.
        if (Platform.OS === 'web' || typeof initialUri === 'number' || !/^https?:\/\//i.test(initialUri)) {
          const asset = Asset.fromModule(initialUri);
          if (Platform.OS !== 'web') await asset.downloadAsync();
          url = Platform.OS === 'web' ? asset.uri : asset.localUri ?? asset.uri;
        } else {
          url = `https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(initialUri)}`;
        }
        if (active) setUri(url);
      } catch {
        if (active) setError('Impossible de charger ce document.');
      }
    }

    prepare();
    return () => { active = false; };
  }, [initialUri]);

  if (error) {
    return <Text accessibilityRole="alert" style={{ padding: 20 }}>{error}</Text>;
  }

  if (!uri) {
    return (
      <View style={{ flex:1,justifyContent:"center",alignItems:"center"}}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1 }}>
        <iframe
          title="Document PDF"
          src={uri}
          style={{ width: '100%', height: '100%', flex: 1, border: 0 }}
        />
      </View>
    );
  }

  return (
    <WebView
      originWhitelist={["*"]}
      source={{ uri: uri }}
      allowFileAccess
      javaScriptEnabled
      style={{ flex: 1 }}
    />
  );
}
