import type { NextApiRequest, NextApiResponse } from "next";
import { appConfig } from "@/config/env";
import { verifyAppProxySignature, verifyWebhookSignature } from "@/lib/shopify/crypto";
import {
  AuthenticatedUserSession,
  verifyAndDecodeSessionToken,
  createMockSessionToken,
} from "@/lib/shopify/session";

export interface AuthenticatedNextApiRequest extends NextApiRequest {
  userSession?: AuthenticatedUserSession;
  shop?: string;
}

export type AuthenticatedApiHandler = (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse
) => Promise<void> | void;

/**
 * Middleware that secures embedded Shopify application API routes via App Bridge Session Tokens.
 */
export function withSessionAuth(handler: AuthenticatedApiHandler) {
  return async (req: AuthenticatedNextApiRequest, res: NextApiResponse) => {
    try {
      let authHeader = req.headers.authorization;

      // In local sandbox mode, if no auth header was sent, auto-generate a mock session for seamless dev experience
      if (!authHeader && appConfig.isSandboxMode) {
        const mockShop = (req.query.shop as string) || "demo-merchant.myshopify.com";
        const mockToken = createMockSessionToken(mockShop);
        authHeader = `Bearer ${mockToken}`;
      }

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Missing Bearer Session Token in Authorization header",
        });
      }

      const session = await verifyAndDecodeSessionToken(authHeader);
      req.userSession = session;
      req.shop = session.shop;

      return await handler(req, res);
    } catch (err: any) {
      return res.status(401).json({
        error: "Unauthorized",
        message: err.message || "Invalid session credentials",
      });
    }
  };
}

/**
 * Middleware that validates incoming Shopify App Proxy requests via HMAC-SHA256 signature.
 */
export function withProxyAuth(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const query = req.query as Record<string, string | string[] | undefined>;
    const isValid = verifyAppProxySignature(query, appConfig.shopify.apiSecret);

    // If sandbox mode is enabled and secret is not set, allow dev bypass with a warning
    if (!isValid && !appConfig.isSandboxMode) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid App Proxy HMAC signature",
      });
    }

    return await handler(req, res);
  };
}

/**
 * Middleware to verify Shopify Webhook HMAC signatures.
 */
export function withWebhookAuth(
  handler: (
    req: NextApiRequest & { rawBody?: string; webhookTopic?: string; shopDomain?: string },
    res: NextApiResponse
  ) => Promise<void> | void
) {
  return async (
    req: NextApiRequest & { rawBody?: string; webhookTopic?: string; shopDomain?: string },
    res: NextApiResponse
  ) => {
    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const topicHeader = (req.headers["x-shopify-topic"] as string) || "";
    const shopHeader = (req.headers["x-shopify-shop-domain"] as string) || "";
    const hmacHeader = (req.headers["x-shopify-hmac-sha256"] as string) || "";

    const rawBody =
      typeof req.body === "string"
        ? req.body
        : Buffer.isBuffer(req.body)
        ? req.body.toString("utf-8")
        : JSON.stringify(req.body || {});

    const isValid = verifyWebhookSignature(rawBody, hmacHeader, appConfig.shopify.apiSecret);

    if (!isValid && !appConfig.isSandboxMode) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid webhook HMAC signature",
      });
    }

    req.rawBody = rawBody;
    req.webhookTopic = topicHeader;
    req.shopDomain = shopHeader;

    return await handler(req, res);
  };
}
