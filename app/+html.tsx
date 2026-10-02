import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

import { COLORS } from '../components/theme';

// This file customizes the root HTML for every static web page (title,
// favicon, theme color, "Add to Home Screen" name) — it does not run on
// native. See https://docs.expo.dev/router/reference/static-rendering/
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Sprout" />
        <meta name="theme-color" content={COLORS.background} />
        <title>Sprout — The Mustard Seed Bible Reading App</title>
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
