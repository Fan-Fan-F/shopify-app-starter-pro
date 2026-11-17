import type { NextApiRequest, NextApiResponse } from "next";
import { appConfig } from "@/config/env";
import { calculateWebhookHmac } from "@/lib/shopify/crypto";
import { dispatchWebhook } from "@/lib/webhooks/dispatcher";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { topic = "customers/data_request", shop = "demo-merchant.myshopify.com", payload = {} } = req.body || {};

  const rawBody = JSON.stringify(payload);
  const signature = calculateWebhookHmac(rawBody, appConfig.shopify.apiSecret);

  try {
    const dispatchResult = await dispatchWebhook({
      topic,
      shop,
      webhookId: `sim-${Date.now()}`,
      apiVersion: appConfig.shopify.apiVersion,
      payload,
      rawBody,
    });

    return res.status(200).json({
      success: true,
      simulation: {
        topic,
        shop,
        generatedHmac: signature,
        dispatchResult,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}
