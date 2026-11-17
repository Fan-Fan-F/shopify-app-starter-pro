import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";

export default function Home() {
  const [shopData, setShopData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchShopData();
  }, []);

  async function fetchShopData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/apps/shop?shop=demo-merchant.myshopify.com");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to load shop data");
      }
      setShopData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout title="Dashboard" badge="v1.0.0 Pro">
      {/* Status Banner */}
      <div
        style={{
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: "8px",
          padding: "16px 20px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#16a34a" }} />
            <strong style={{ color: "#166534", fontSize: "15px" }}>
              App Backend & Sandbox Ready
            </strong>
          </div>
          <p style={{ margin: 0, fontSize: "13px", color: "#15803d" }}>
            Local sandbox is active. You can safely build, test App Proxy routes, trigger GDPR webhooks, and query GraphQL without a live tunnel.
          </p>
        </div>
        <button
          onClick={fetchShopData}
          style={{
            background: "#ffffff",
            border: "1px solid #bbf7d0",
            color: "#166534",
            padding: "6px 14px",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: 500,
            fontSize: "13px",
          }}
        >
          {loading ? "Refreshing..." : "Refresh Shop"}
        </button>
      </div>

      {/* Grid: Left Store Status, Right Features */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Active Store Card */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e1e3e5",
            borderRadius: "8px",
            padding: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: 600 }}>Connected Shop Profile</h3>
          {loading && <p style={{ color: "#6d7175", fontSize: "14px" }}>Fetching shop metadata from Prisma & API...</p>}
          {error && <p style={{ color: "#d72c0d", fontSize: "14px" }}>Error: {error}</p>}
          {shopData && (
            <div style={{ fontSize: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f2f3" }}>
                <span style={{ color: "#6d7175" }}>Shop Domain:</span>
                <strong>{shopData.shop?.shop}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f2f3" }}>
                <span style={{ color: "#6d7175" }}>Store Name:</span>
                <span>{shopData.graphqlData?.name || shopData.shop?.name}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f2f3" }}>
                <span style={{ color: "#6d7175" }}>Currency:</span>
                <span>{shopData.graphqlData?.currencyCode || shopData.shop?.currency}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f2f3" }}>
                <span style={{ color: "#6d7175" }}>Active State:</span>
                <span style={{ color: "#008060", fontWeight: 600 }}>Active (Multi-Tenant Managed)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                <span style={{ color: "#6d7175" }}>User ID:</span>
                <span>{shopData.sessionUser?.userId || "Guest"}</span>
              </div>
            </div>
          )}
        </div>

        {/* Feature Highlights */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e1e3e5",
            borderRadius: "8px",
            padding: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: 600 }}>Core Architecture Specs</h3>
          <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", lineHeight: "1.7", color: "#4a4d50" }}>
            <li>
              <strong>Shopify 2025+ Standards:</strong> App Bridge CDN & Managed Session Token authentication.
            </li>
            <li>
              <strong>Multi-Shop & Multi-Tenant:</strong> Isolated Prisma schema tracking sessions, stores & audit logs.
            </li>
            <li>
              <strong>App Proxy Engine:</strong> Strict HMAC-SHA256 signature verification with timing-safe comparison.
            </li>
            <li>
              <strong>GDPR & Webhooks:</strong> Built-in compliance handlers for customer redact, data request & shop redact.
            </li>
            <li>
              <strong>Zero-Config Local Sandbox:</strong> SQLite embedded storage with mock mode for high developer velocity.
            </li>
          </ul>
        </div>
      </div>

      {/* Quick Action Guides */}
      <div
        style={{
          marginTop: "24px",
          background: "#ffffff",
          border: "1px solid #e1e3e5",
          borderRadius: "8px",
          padding: "20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <h3 style={{ margin: "0 0 14px 0", fontSize: "16px", fontWeight: 600 }}>Developer Quick Actions</h3>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <a
            href="/debug"
            style={{
              display: "inline-block",
              background: "#008060",
              color: "#ffffff",
              padding: "10px 18px",
              borderRadius: "6px",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            Launch Debug Console & Sandbox
          </a>
          <a
            href="/api/proxy/sample?shop=demo-merchant.myshopify.com&path_prefix=%2Fapps%2Fstarter-proxy&timestamp=1700000000&signature=test"
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-block",
              background: "#f1f2f3",
              color: "#202223",
              padding: "10px 18px",
              borderRadius: "6px",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            Preview App Proxy Liquid Endpoint
          </a>
        </div>
      </div>
    </Layout>
  );
}
