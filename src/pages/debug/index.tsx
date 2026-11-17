import React, { useState } from "react";
import Layout from "@/components/Layout";

export default function DebugPage() {
  // GraphQL Test State
  const [gqlQuery, setGqlQuery] = useState(
    `query GetProducts {\n  products(first: 5) {\n    edges {\n      node {\n        id\n        title\n        status\n        totalInventory\n      }\n    }\n  }\n}`
  );
  const [gqlLoading, setGqlLoading] = useState(false);
  const [gqlResponse, setGqlResponse] = useState<any>(null);

  // Webhook Simulator State
  const [webhookTopic, setWebhookTopic] = useState("customers/data_request");
  const [webhookShop, setWebhookShop] = useState("demo-merchant.myshopify.com");
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookResponse, setWebhookResponse] = useState<any>(null);

  // Proxy Test State
  const [proxyResponse, setProxyResponse] = useState<any>(null);
  const [proxyLoading, setProxyLoading] = useState(false);

  async function handleExecuteGraphQL() {
    setGqlLoading(true);
    setGqlResponse(null);
    try {
      const res = await fetch("/api/apps/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: gqlQuery }),
      });
      const data = await res.json();
      setGqlResponse(data);
    } catch (err: any) {
      setGqlResponse({ error: err.message });
    } finally {
      setGqlLoading(false);
    }
  }

  async function handleSimulateWebhook() {
    setWebhookLoading(true);
    setWebhookResponse(null);
    try {
      const res = await fetch("/api/sandbox/simulate-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: webhookTopic,
          shop: webhookShop,
          payload: {
            shop_id: 99001,
            shop_domain: webhookShop,
            customer: { id: 88001, email: "shopper@example.com" },
            orders_requested: [1001, 1002],
          },
        }),
      });
      const data = await res.json();
      setWebhookResponse(data);
    } catch (err: any) {
      setWebhookResponse({ error: err.message });
    } finally {
      setWebhookLoading(false);
    }
  }

  async function handleTestProxy() {
    setProxyLoading(true);
    setProxyResponse(null);
    try {
      const res = await fetch(
        "/api/proxy/sample?shop=demo-merchant.myshopify.com&path_prefix=%2Fapps%2Fstarter-proxy&format=json&timestamp=1700000000"
      );
      const data = await res.json();
      setProxyResponse(data);
    } catch (err: any) {
      setProxyResponse({ error: err.message });
    } finally {
      setProxyLoading(false);
    }
  }

  return (
    <Layout title="Debug Console & Sandbox" badge="Developer Tools">
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Section 1: GraphQL Client Test */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e1e3e5",
            borderRadius: "8px",
            padding: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: 600 }}>
            1. GraphQL Client Query Tester
          </h3>
          <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#6d7175" }}>
            Tests the <code>shopifyClients.online()</code> GraphQL client abstraction with Session Token authorization.
          </p>
          <textarea
            value={gqlQuery}
            onChange={(e) => setGqlQuery(e.target.value)}
            rows={7}
            style={{
              width: "100%",
              boxSizing: "border-box",
              fontFamily: "monospace",
              fontSize: "13px",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #c9cccf",
              background: "#fcfdfe",
            }}
          />
          <div style={{ marginTop: "10px" }}>
            <button
              onClick={handleExecuteGraphQL}
              disabled={gqlLoading}
              style={{
                background: "#008060",
                color: "#ffffff",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              {gqlLoading ? "Executing Query..." : "Execute Query"}
            </button>
          </div>
          {gqlResponse && (
            <pre
              style={{
                marginTop: "12px",
                background: "#1e1e1e",
                color: "#d4d4d4",
                padding: "12px",
                borderRadius: "6px",
                fontSize: "12px",
                overflowX: "auto",
                maxHeight: "260px",
              }}
            >
              {JSON.stringify(gqlResponse, null, 2)}
            </pre>
          )}
        </div>

        {/* Section 2: Webhook & GDPR Simulator */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e1e3e5",
            borderRadius: "8px",
            padding: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: 600 }}>
            2. Webhook & GDPR Compliance Simulator
          </h3>
          <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#6d7175" }}>
            Simulates incoming webhooks, generates an HMAC signature, and persists audit logs to the Prisma database.
          </p>
          <div style={{ display: "flex", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>
                Topic:
              </label>
              <select
                value={webhookTopic}
                onChange={(e) => setWebhookTopic(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #c9cccf",
                  fontSize: "13px",
                  background: "#fff",
                }}
              >
                <option value="customers/data_request">customers/data_request (GDPR)</option>
                <option value="customers/redact">customers/redact (GDPR)</option>
                <option value="shop/redact">shop/redact (GDPR)</option>
                <option value="app/uninstalled">app/uninstalled (Lifecycle)</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>
                Target Store:
              </label>
              <input
                type="text"
                value={webhookShop}
                onChange={(e) => setWebhookShop(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #c9cccf",
                  fontSize: "13px",
                  minWidth: "260px",
                }}
              />
            </div>
          </div>
          <button
            onClick={handleSimulateWebhook}
            disabled={webhookLoading}
            style={{
              background: "#202223",
              color: "#ffffff",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            {webhookLoading ? "Simulating Webhook..." : "Trigger Simulated Webhook"}
          </button>
          {webhookResponse && (
            <pre
              style={{
                marginTop: "12px",
                background: "#1e1e1e",
                color: "#d4d4d4",
                padding: "12px",
                borderRadius: "6px",
                fontSize: "12px",
                overflowX: "auto",
                maxHeight: "260px",
              }}
            >
              {JSON.stringify(webhookResponse, null, 2)}
            </pre>
          )}
        </div>

        {/* Section 3: App Proxy Tester */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e1e3e5",
            borderRadius: "8px",
            padding: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: 600 }}>
            3. App Proxy HMAC Verification Tester
          </h3>
          <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#6d7175" }}>
            Invokes <code>/api/proxy/sample</code> to verify the proxy routing logic and parameter parsing.
          </p>
          <button
            onClick={handleTestProxy}
            disabled={proxyLoading}
            style={{
              background: "#5c5f62",
              color: "#ffffff",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            {proxyLoading ? "Testing Proxy..." : "Call App Proxy Endpoint (JSON)"}
          </button>
          {proxyResponse && (
            <pre
              style={{
                marginTop: "12px",
                background: "#1e1e1e",
                color: "#d4d4d4",
                padding: "12px",
                borderRadius: "6px",
                fontSize: "12px",
                overflowX: "auto",
                maxHeight: "260px",
              }}
            >
              {JSON.stringify(proxyResponse, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </Layout>
  );
}
