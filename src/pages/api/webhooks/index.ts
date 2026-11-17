import type { NextApiRequest, NextApiResponse } from "next";
import { withWebhookAuth } from "@/middleware/apiGuards";
import { dispatchWebhook } from "@/lib/webhooks/dispatcher";

// Disable Next.js default body parser to allow raw body HMAC verification if needed
export const config = {
  api: {
    bodyParser: true,
  },
};

async function handler(
  req: NextApiRequest & { rawBody?: string; webhookTopic?: string; shopDomain?: string },
  res: NextApiResponse
) {
  const topic = req.webhookTopic || (req.headers["x-shopify-topic"] as string);
  const shop = req.shopDomain || (req.headers["x-shopify-shop-domain"] as string);
  const webhookId = req.headers["x-shopify-webhook-id"] as string | undefined;
  const apiVersion = req.headers["x-shopify-api-version"] as string | undefined;

  if (!topic || !shop) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Missing 'X-Shopify-Topic' or 'X-Shopify-Shop-Domain' headers",
    });
  }

  try {
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const parsedPayload = typeof req.body === "object" ? req.body : JSON.parse(rawBody || "{}");

    const result = await dispatchWebhook({
      topic,
      shop,
      webhookId,
      apiVersion,
      payload: parsedPayload,
      rawBody,
    });

    return res.status(200).json({
      received: true,
      topic,
      shop,
      message: result.message,
    });
  } catch (err: any) {
    console.error(`[Webhook Dispatch Error] Topic: ${topic}, Shop: ${shop}`, err);
    return res.status(500).json({
      received: false,
      error: err.message || "Failed to process webhook",
    });
  }
}

export default withWebhookAuth(handler);
