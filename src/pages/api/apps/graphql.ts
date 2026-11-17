import type { NextApiResponse } from "next";
import { withSessionAuth, AuthenticatedNextApiRequest } from "@/middleware/apiGuards";
import { shopifyClients } from "@/lib/shopify/client";

async function handler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { query, variables } = req.body || {};
  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Missing 'query' string in request body" });
  }

  const shopDomain = req.shop || "demo-merchant.myshopify.com";
  const client = shopifyClients.online({
    shop: shopDomain,
    accessToken: req.userSession?.accessToken,
  });

  try {
    const result = await client.graphql(query, variables);
    return res.status(200).json({
      success: true,
      shop: shopDomain,
      result,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "GraphQL execution failed",
    });
  }
}

export default withSessionAuth(handler);
