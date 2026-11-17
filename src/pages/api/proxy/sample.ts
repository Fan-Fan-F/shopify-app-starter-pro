import type { NextApiRequest, NextApiResponse } from "next";
import { withProxyAuth } from "@/middleware/apiGuards";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const shop = (req.query.shop as string) || "unknown.myshopify.com";
  const loggedInCustomerId = req.query.logged_in_customer_id as string | undefined;

  // Supports JSON response or liquid/html
  if (req.headers.accept?.includes("application/json") || req.query.format === "json") {
    return res.status(200).json({
      success: true,
      message: "Shopify App Proxy authenticated successfully",
      shop,
      customerId: loggedInCustomerId || null,
      timestamp: new Date().toISOString(),
      proxyFeatures: [
        "HMAC SHA256 timing-safe verification",
        "Liquid storefront embed support",
        "Customer context propagation",
      ],
    });
  }

  // Default Liquid storefront response
  res.setHeader("Content-Type", "application/liquid; charset=utf-8");
  return res.status(200).send(`
    <div style="padding: 16px; border: 1px solid #e1e3e5; border-radius: 8px; background: #fafbfc; font-family: -apple-system, sans-serif;">
      <h3 style="color: #202223; margin-top: 0;">Shopify App Proxy Active</h3>
      <p style="color: #6d7175;">This content is securely routed from <code>shopify-app-starter-pro</code> and verified via HMAC signature.</p>
      <ul>
        <li><strong>Connected Store:</strong> ${shop}</li>
        <li><strong>Customer ID:</strong> ${loggedInCustomerId || "Guest"}</li>
        <li><strong>Server Time:</strong> ${new Date().toISOString()}</li>
      </ul>
    </div>
  `);
}

export default withProxyAuth(handler);
