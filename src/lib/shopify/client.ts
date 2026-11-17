import { appConfig } from "@/config/env";
import db from "@/lib/db";

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{ message: string; locations?: any[]; path?: string[] }>;
}

export class ShopifyApiClient {
  private shop: string;
  private accessToken?: string;
  private apiVersion: string;

  constructor(shop: string, accessToken?: string, apiVersion: string = appConfig.shopify.apiVersion) {
    this.shop = shop;
    this.accessToken = accessToken;
    this.apiVersion = apiVersion;
  }

  /**
   * Executes a Shopify GraphQL query / mutation.
   */
  async graphql<T = any>(query: string, variables?: Record<string, any>): Promise<GraphQLResponse<T>> {
    // If running in sandbox mode or no token available, return structured mock data
    if (appConfig.isSandboxMode || !this.accessToken || this.accessToken.startsWith("mock-")) {
      return this.mockGraphQLResponse<T>(query, variables);
    }

    const endpoint = `https://${this.shop}/admin/api/${this.apiVersion}/graphql.json`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": this.accessToken,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`Shopify GraphQL request failed with HTTP status ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }

  /**
   * Executes a Shopify REST API call.
   */
  async rest<T = any>(endpointPath: string, options: RequestInit = {}): Promise<T> {
    const cleanPath = endpointPath.replace(/^\//, "");

    if (appConfig.isSandboxMode || !this.accessToken || this.accessToken.startsWith("mock-")) {
      return this.mockRestResponse<T>(cleanPath);
    }

    const url = `https://${this.shop}/admin/api/${this.apiVersion}/${cleanPath}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": this.accessToken,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Shopify REST request failed [${response.status}]: ${await response.text()}`);
    }

    return response.json();
  }

  private mockGraphQLResponse<T>(query: string, _variables?: Record<string, any>): GraphQLResponse<T> {
    const isProductQuery = query.toLowerCase().includes("products");
    const isShopQuery = query.toLowerCase().includes("shop");

    if (isProductQuery) {
      return {
        data: {
          products: {
            edges: [
              {
                node: {
                  id: "gid://shopify/Product/1001",
                  title: "Wireless Ergonomic Keyboard",
                  handle: "wireless-ergonomic-keyboard",
                  status: "ACTIVE",
                  totalInventory: 128,
                },
              },
              {
                node: {
                  id: "gid://shopify/Product/1002",
                  title: "Ultra-Fast USB-C Charging Hub",
                  handle: "ultrafast-usbc-hub",
                  status: "ACTIVE",
                  totalInventory: 64,
                },
              },
            ],
          },
        } as unknown as T,
      };
    }

    if (isShopQuery) {
      return {
        data: {
          shop: {
            id: "gid://shopify/Shop/99001",
            name: "Demo Merchant Pro Store",
            email: "merchant@example.com",
            currencyCode: "USD",
            myshopifyDomain: this.shop,
          },
        } as unknown as T,
      };
    }

    return {
      data: {
        message: "Sandbox mock response executed successfully",
        queryPreview: query.slice(0, 100).trim(),
      } as unknown as T,
    };
  }

  private mockRestResponse<T>(path: string): T {
    return {
      sandboxMock: true,
      path,
      shop: this.shop,
      timestamp: new Date().toISOString(),
    } as unknown as T;
  }
}

/**
 * Modern Client Provider factory for Shopify online and offline access modes.
 */
export const shopifyClients = {
  /**
   * Creates an authenticated client using an online user session token.
   */
  online: (session: { shop: string; accessToken?: string }) => {
    return new ShopifyApiClient(session.shop, session.accessToken);
  },

  /**
   * Creates a client using the stored offline access token for background tasks / webhooks.
   */
  offline: async (shop: string) => {
    const offlineSession = await db.session.findFirst({
      where: { shop, isOnline: false },
      orderBy: { createdAt: "desc" },
    });

    return new ShopifyApiClient(shop, offlineSession?.accessToken);
  },
};
