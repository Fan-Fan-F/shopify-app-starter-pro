import type { NextApiResponse } from "next";
import { withSessionAuth, AuthenticatedNextApiRequest } from "@/middleware/apiGuards";
import { shopifyClients } from "@/lib/shopify/client";
import db from "@/lib/db";

async function handler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
  const shopDomain = req.shop || "demo-merchant.myshopify.com";

  // Ensure shop record exists in database
  let shopRecord = await db.shop.findUnique({
    where: { shop: shopDomain },
  });

  if (!shopRecord) {
    shopRecord = await db.shop.create({
      data: {
        shop: shopDomain,
        name: shopDomain.split(".")[0].toUpperCase() + " Store",
        email: `contact@${shopDomain}`,
        currency: "USD",
        isActive: true,
      },
    });
  }

  // Fetch shop metadata via GraphQL client
  const client = shopifyClients.online({
    shop: shopDomain,
    accessToken: req.userSession?.accessToken,
  });

  const gqlRes = await client.graphql(`
    query {
      shop {
        id
        name
        email
        currencyCode
        myshopifyDomain
      }
    }
  `);

  return res.status(200).json({
    success: true,
    shop: shopRecord,
    graphqlData: gqlRes.data?.shop || null,
    sessionUser: {
      userId: req.userSession?.userId,
      isOnline: req.userSession?.isOnline,
    },
  });
}

export default withSessionAuth(handler);
