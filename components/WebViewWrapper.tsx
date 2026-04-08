import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { Platform, View } from "react-native";
import NativeWebView, { WebViewSource } from "react-native-webview";

export interface WebViewRef {
  injectJavaScript: (script: string) => void;
  postMessage: (data: string) => void;
}

type WebViewProps = {
  source: WebViewSource;
  originWhitelist?: string[];
  javaScriptEnabled?: boolean;
  domStorageEnabled?: boolean;
  allowFileAccess?: boolean;
  style?: any;
  onMessage?: (event: { nativeEvent: { data: string } }) => void;
};

export const WebView = forwardRef<WebViewRef, WebViewProps>(
    (
        {
          source,
          originWhitelist,
          javaScriptEnabled = true,
          domStorageEnabled = true,
          allowFileAccess = false,
          style,
          onMessage,
        },
        ref
    ) => {
      const nativeWebViewRef = useRef<any>(null);
      const iframeRef = useRef<HTMLIFrameElement>(null);

      useImperativeHandle(ref, () => ({
        injectJavaScript: (script: string) => {
          if (Platform.OS === "web") {
            console.warn(
                "injectJavaScript is not supported on web in this wrapper. Use postMessage instead."
            );
            return;
          }

          if (nativeWebViewRef.current) {
            nativeWebViewRef.current.injectJavaScript(script);
          }
        },
        postMessage: (data: string) => {
          if (Platform.OS === "web" && iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage(data, "*");
          } else if (nativeWebViewRef.current) {
            nativeWebViewRef.current.postMessage?.(data);
          }
        },
      }));

      useEffect(() => {
        if (Platform.OS !== "web" || !onMessage) return;

        const handleMessage = (e: MessageEvent) => {
          if (e.data != null) {
            onMessage({
              nativeEvent: {
                data: typeof e.data === "string" ? e.data : JSON.stringify(e.data),
              },
            });
          }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
      }, [onMessage]);

      if (Platform.OS !== "web") {
        return (
            <NativeWebView
                ref={nativeWebViewRef}
                source={source}
                originWhitelist={originWhitelist || ["*"]}
                javaScriptEnabled={javaScriptEnabled}
                domStorageEnabled={domStorageEnabled}
                allowFileAccess={allowFileAccess}
                style={style}
                onMessage={onMessage}
            />
        );
      }

      const isHtmlSource = typeof source === "object" && "html" in source && !!source.html;
      const isUriSource = typeof source === "object" && "uri" in source && !!source.uri;

      return (
          <View style={[{ flex: 1 }, style]} testID="webview-web-container">
            {isHtmlSource ? (
                <iframe
                    ref={iframeRef}
                    srcDoc={source.html}
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "none",
                      display: "block",
                    }}
                    title="WebView"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                />
            ) : isUriSource ? (
                <iframe
                    ref={iframeRef}
                    src={source.uri}
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "none",
                      display: "block",
                    }}
                    title="WebView"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                />
            ) : null}
          </View>
      );
    }
);

WebView.displayName = "WebView";