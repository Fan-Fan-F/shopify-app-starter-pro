import jwt from "jsonwebtoken";
import { appConfig } from "@/config/env";
import db from "@/lib/db";

export interface ShopifySessionPayload {
  iss: string;
  dest: string;
  aud: string;
  sub: string;
  exp: number;
  nbf: number;
  iat: number;
  jti: string;
  sid: string;
}

export interface AuthenticatedUserSession {
  shop: string;
  userId: string;
  isOnline: boolean;
  accessToken?: string;
  payload: ShopifySessionPayload;
}

/**
 * Normalizes any shop input into a clean canonical myshopify domain: `example.myshopify.com`.
 */
export function normalizeShopDomain(shopInput: string): string {
  let cleaned = shopInput.trim().toLowerCase();
  cleaned = cleaned.replace(/^https?:\/\//, "");
  cleaned = cleaned.split("/")[0];
  if (!cleaned.includes(".")) {
    cleaned = `${cleaned}.myshopify.com`;
  }
  return cleaned;
}

/**
 * Creates a mock JWT session token for testing and local sandbox scenarios.
 */
export function createMockSessionToken(
  shopDomain: string = "demo-shop.myshopify.com",
  userId: string = "10001"
): string {
  const normalized = normalizeShopDomain(shopDomain);
  const now = Math.floor(Date.now() / 1000);
  const payload: ShopifySessionPayload = {
    iss: `https://${normalized}/admin`,
    dest: `https://${normalized}`,
    aud: appConfig.shopify.apiKey,
    sub: userId,
    exp: now + 3600,
    nbf: now - 60,
    iat: now,
    jti: `mock-token-${Date.now()}`,
    sid: `session-${normalized}`,
  };

  return jwt.sign(payload, appConfig.shopify.apiSecret);
}

/**
 * Verifies and decodes an incoming Shopify Session Token.
 */
export async function verifyAndDecodeSessionToken(
  bearerToken: string
): Promise<AuthenticatedUserSession> {
  const cleanToken = bearerToken.replace(/^Bearer\s+/i, "").trim();
  if (!cleanToken) {
    throw new Error("Missing or empty bearer token");
  }

  // In local sandbox mode, support decoding self-signed tokens with secret
  let decoded: ShopifySessionPayload;
  try {
    decoded = jwt.verify(cleanToken, appConfig.shopify.apiSecret) as ShopifySessionPayload;
  } catch (err: any) {
    // If running in development sandbox and secret mismatches, fall back to safe decode if enabled
    if (appConfig.isSandboxMode) {
      const parsed = jwt.decode(cleanToken) as ShopifySessionPayload | null;
      if (parsed && parsed.dest) {
        decoded = parsed;
      } else {
        throw new Error(`Invalid session token: ${err.message}`);
      }
    } else {
      throw new Error(`Token verification failed: ${err.message}`);
    }
  }

  // Extract canonical shop domain from dest
  const shop = normalizeShopDomain(decoded.dest);

  // Look up offline or online session in database if available
  const storedSession = await db.session.findFirst({
    where: { shop },
    orderBy: { createdAt: "desc" },
  });

  return {
    shop,
    userId: decoded.sub,
    isOnline: Boolean(storedSession?.isOnline),
    accessToken: storedSession?.accessToken,
    payload: decoded,
  };
}
