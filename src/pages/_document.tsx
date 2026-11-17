import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Shopify App Bridge CDN (Official recommended delivery method) */}
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js" async />
      </Head>
      <body style={{ margin: 0, padding: 0, background: "#f6f6f7", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
