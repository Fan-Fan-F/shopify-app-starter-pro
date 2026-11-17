import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  badge?: string;
}

export default function Layout({ children, title = "Shopify App Starter Pro", badge }: LayoutProps) {
  const router = useRouter();

  const navLinks = [
    { label: "Dashboard", href: "/" },
    { label: "Debug Console & Sandbox", href: "/debug" },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", color: "#202223" }}>
      {/* Top Header */}
      <header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e1e3e5",
          padding: "14px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "#008060",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: "16px",
            }}
          >
            S
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#202223" }}>
              Shopify App Starter Pro
            </h1>
            <span style={{ fontSize: "12px", color: "#6d7175" }}>
              Next.js 14 • Prisma ORM • Multi-Shop • Local Sandbox
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: "flex", gap: "8px" }}>
          {navLinks.map((link) => {
            const isActive = router.pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  padding: "6px 14px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: 500,
                  textDecoration: "none",
                  color: isActive ? "#008060" : "#5c5f62",
                  background: isActive ? "#f1f8f5" : "transparent",
                  border: isActive ? "1px solid #cce5dc" : "1px solid transparent",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: "1000px", width: "100%", margin: "0 auto", padding: "24px 16px", flex: 1 }}>
        {title && (
          <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}>{title}</h2>
            {badge && (
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  background: "#e4e5e7",
                  color: "#202223",
                  padding: "2px 8px",
                  borderRadius: "12px",
                }}
              >
                {badge}
              </span>
            )}
          </div>
        )}
        {children}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid #e1e3e5",
          padding: "16px 24px",
          textAlign: "center",
          fontSize: "13px",
          color: "#8c9196",
          background: "#ffffff",
        }}
      >
        Shopify App Starter Pro — Modernized embedded architecture inspired by shopify-nextjs-prisma-app.
      </footer>
    </div>
  );
}
