/**
 * Application environment configuration loader and validator.
 */

export interface AppConfig {
  nodeEnv: string;
  isDev: boolean;
  isProd: boolean;
  shopify: {
    apiKey: string;
    apiSecret: string;
    appUrl: string;
    apiVersion: string;
    scopes: string[];
    proxyPrefix: string;
    proxySubpath: string;
  };
  databaseUrl: string;
  isSandboxMode: boolean;
}

export function getAppConfig(): AppConfig {
  const nodeEnv = process.env.NODE_ENV || "development";
  const isSandbox =
    process.env.LOCAL_SANDBOX_MODE === "true" ||
    !process.env.SHOPIFY_API_SECRET ||
    process.env.SHOPIFY_API_SECRET.includes("<your-");

  const apiKey = process.env.SHOPIFY_API_KEY || "mock-shopify-api-key";
  const apiSecret = process.env.SHOPIFY_API_SECRET || "mock-shopify-api-secret-key-32b";
  const appUrl = process.env.SHOPIFY_APP_URL || "http://localhost:3000";
  const apiVersion = process.env.SHOPIFY_API_VERSION || "2025-01";
  const rawScopes = process.env.SHOPIFY_SCOPES || "read_products,write_products,read_orders";
  const scopes = rawScopes.split(",").map((s) => s.trim()).filter(Boolean);

  const proxyPrefix = process.env.APP_PROXY_PREFIX || "apps";
  const proxySubpath = process.env.APP_PROXY_SUBPATH || "starter-proxy";
  const databaseUrl = process.env.DATABASE_URL || "file:./dev.db";

  return {
    nodeEnv,
    isDev: nodeEnv === "development",
    isProd: nodeEnv === "production",
    shopify: {
      apiKey,
      apiSecret,
      appUrl,
      apiVersion,
      scopes,
      proxyPrefix,
      proxySubpath,
    },
    databaseUrl,
    isSandboxMode: isSandbox,
  };
}

export const appConfig = getAppConfig();
