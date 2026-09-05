import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content="#1f176a" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: styles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const styles = `
  html, body, #root {
    width: 100%;
    min-height: 100%;
    margin: 0;
    overflow-x: hidden;
  }

  html {
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
  }

  body {
    background: #f5f5f8;
    overscroll-behavior-x: none;
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }
`;
