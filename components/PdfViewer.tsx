import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { WebView } from "./WebViewWrapper";

export default function PdfViewerExpo({ initialUri }) {
  const [uri, setUri] = useState(null);

  useEffect(() => {
    async function prepare() {
      const url =  `https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(initialUri)}`;
      console.log(url);
      setUri(url);
    }

    prepare();
  }, []);

  if (!uri) {
    return (
      <View style={{ flex:1,justifyContent:"center",alignItems:"center"}}>
        <ActivityIndicator size="large" />
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