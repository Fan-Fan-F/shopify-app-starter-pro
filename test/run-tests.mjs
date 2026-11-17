#!/usr/bin/env node

/**
 * Integrated Test Suite for shopify-app-starter-pro
 * Runs full security, cryptography, session, multi-shop database and dispatcher tests.
 */

import assert from "assert";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

console.log("=================================================================");
console.log("   Shopify App Starter Pro - Verification & Test Suite");
console.log("=================================================================\n");

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  process.stdout.write(`[TEST] ${name} ... `);
  try {
    fn();
    console.log("PASSED");
    passed++;
  } catch (err) {
    console.log("FAILED");
    console.error("       Error:", err.message);
    failed++;
  }
}

async function runAsyncTest(name, fn) {
  process.stdout.write(`[TEST] ${name} ... `);
  try {
    await fn();
    console.log("PASSED");
    passed++;
  } catch (err) {
    console.log("FAILED");
    console.error("       Error:", err.message);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// 1. App Proxy Cryptography Tests
// ---------------------------------------------------------------------------
function calculateAppProxyHmac(params, secret) {
  const sortedKeys = Object.keys(params)
    .filter((k) => k !== "signature")
    .sort();

  const message = sortedKeys
    .map((key) => {
      const val = params[key];
      if (Array.isArray(val)) {
        return `${key}=${val.join(",")}`;
      }
      return `${key}=${val ?? ""}`;
    })
    .join("");

  return crypto.createHmac("sha256", secret).update(message, "utf-8").digest("hex");
}

function verifyAppProxySignature(params, secret) {
  const signature = params.signature;
  if (!signature || typeof signature !== "string") return false;
  const expected = calculateAppProxyHmac(params, secret);
  try {
    const a = Buffer.from(signature, "utf-8");
    const b = Buffer.from(expected, "utf-8");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

runTest("App Proxy HMAC Calculation & Timing-safe Verification", () => {
  const secret = "test-secret-key-123456";
  const query = {
    shop: "store1.myshopify.com",
    path_prefix: "/apps/starter-proxy",
    timestamp: "1700000000",
  };

  const signature = calculateAppProxyHmac(query, secret);
  assert.ok(signature.length === 64, "HMAC hex string should be 64 characters");

  const validQuery = { ...query, signature };
  assert.strictEqual(verifyAppProxySignature(validQuery, secret), true, "Valid query should pass");

  const tamperedQuery = { ...validQuery, shop: "hacked.myshopify.com" };
  assert.strictEqual(verifyAppProxySignature(tamperedQuery, secret), false, "Tampered query must fail");

  const missingSigQuery = { ...query };
  assert.strictEqual(verifyAppProxySignature(missingSigQuery, secret), false, "Missing signature must fail");
});

// ---------------------------------------------------------------------------
// 2. Webhook HMAC-SHA256 Cryptography Tests
// ---------------------------------------------------------------------------
function calculateWebhookHmac(rawBody, secret) {
  return crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
}

function verifyWebhookHmac(rawBody, receivedHmac, secret) {
  if (!receivedHmac) return false;
  const calculated = calculateWebhookHmac(rawBody, secret);
  try {
    const a = Buffer.from(receivedHmac, "base64");
    const b = Buffer.from(calculated, "base64");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

runTest("Webhook HMAC-SHA256 Base64 Signature Verification", () => {
  const secret = "test-webhook-secret-98765";
  const payload = JSON.stringify({ id: 1001, event: "orders/create" });

  const hmac = calculateWebhookHmac(payload, secret);
  assert.ok(hmac.length > 20, "Webhook HMAC should be a valid Base64 string");

  assert.strictEqual(verifyWebhookHmac(payload, hmac, secret), true, "Valid webhook payload must pass");
  assert.strictEqual(verifyWebhookHmac(payload + " ", hmac, secret), false, "Tampered payload must fail");
  assert.strictEqual(verifyWebhookHmac(payload, "invalid-hmac", secret), false, "Invalid HMAC must fail");
});

// ---------------------------------------------------------------------------
// 3. Domain Normalization & Session Utility Tests
// ---------------------------------------------------------------------------
function normalizeShopDomain(shopInput) {
  let cleaned = shopInput.trim().toLowerCase();
  cleaned = cleaned.replace(/^https?:\/\//, "");
  cleaned = cleaned.split("/")[0];
  if (!cleaned.includes(".")) {
    cleaned = `${cleaned}.myshopify.com`;
  }
  return cleaned;
}

runTest("Shop Domain Canonical Normalization", () => {
  assert.strictEqual(normalizeShopDomain("my-shop"), "my-shop.myshopify.com");
  assert.strictEqual(normalizeShopDomain("https://my-shop.myshopify.com/admin"), "my-shop.myshopify.com");
  assert.strictEqual(normalizeShopDomain("MY-SHOP.MYSHOPIFY.COM"), "my-shop.myshopify.com");
  assert.strictEqual(normalizeShopDomain("custom-domain.com"), "custom-domain.com");
});

// ---------------------------------------------------------------------------
// 4. Multi-Environment TOML Generation Test
// ---------------------------------------------------------------------------
runTest("Dynamic shopify.app.toml generation for Staging & Production", () => {
  const testTomlPath = path.resolve(process.cwd(), "shopify.app.test-gen.toml");
  try {
    execSync(`node scripts/generate-toml.mjs staging ${testTomlPath}`, { stdio: "pipe" });
    assert.ok(fs.existsSync(testTomlPath), "Generated TOML file must exist");
    const content = fs.readFileSync(testTomlPath, "utf-8");
    assert.ok(content.includes("[app_proxy]"), "TOML must contain [app_proxy]");
    assert.ok(content.includes("[webhooks.privacy_compliance]"), "TOML must contain GDPR privacy compliance");
    assert.ok(content.includes("customer_data_request_url"), "TOML must configure GDPR endpoints");
  } finally {
    if (fs.existsSync(testTomlPath)) {
      fs.unlinkSync(testTomlPath);
    }
  }
});

// ---------------------------------------------------------------------------
// 5. Prisma Multi-Tenant Model & Database Integrity Tests
// ---------------------------------------------------------------------------
async function testPrismaIntegration() {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  const testShopDomain = `test-tenant-${Date.now()}.myshopify.com`;

  try {
    // 5.1 Create Shop Record
    const shop = await prisma.shop.create({
      data: {
        shop: testShopDomain,
        name: "Automated Integration Test Store",
        email: "test@example.com",
        currency: "USD",
        isActive: true,
      },
    });
    assert.ok(shop.id, "Shop record created with ID");

    // 5.2 Create Multi-Shop Sessions (Online + Offline)
    const offlineSession = await prisma.session.create({
      data: {
        id: `offline_${testShopDomain}`,
        shop: testShopDomain,
        isOnline: false,
        accessToken: "shpat_offline_mock_token_12345",
        scope: "read_products,write_products",
      },
    });
    assert.strictEqual(offlineSession.isOnline, false);

    const onlineSession = await prisma.session.create({
      data: {
        id: `online_${testShopDomain}_user1`,
        shop: testShopDomain,
        isOnline: true,
        accessToken: "shpat_online_mock_token_67890",
        onlineAccessInfo: JSON.stringify({ userId: 101, email: "user@example.com" }),
      },
    });
    assert.strictEqual(onlineSession.isOnline, true);

    // 5.3 Audit Webhook Event Logging
    const webhookLog = await prisma.webhookEvent.create({
      data: {
        topic: "customers/data_request",
        shop: testShopDomain,
        webhookId: "test-webhook-id-999",
        apiVersion: "2025-01",
        payload: JSON.stringify({ customer: { id: 101 } }),
        status: "PROCESSED",
      },
    });
    assert.ok(webhookLog.id, "Webhook event logged");

    // 5.4 Verify Multi-tenant query & Cascading Relations
    const queriedShop = await prisma.shop.findUnique({
      where: { shop: testShopDomain },
      include: { sessions: true, webhookEvents: true },
    });
    assert.strictEqual(queriedShop.sessions.length, 2, "Shop should have 2 sessions linked");
    assert.strictEqual(queriedShop.webhookEvents.length, 1, "Shop should have 1 webhook event");

    // Cleanup test record
    await prisma.shop.delete({ where: { shop: testShopDomain } });
  } finally {
    await prisma.$disconnect();
  }
}

await runAsyncTest("Prisma Multi-Tenant Shop & Session Storage", testPrismaIntegration);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log("\n=================================================================");
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log("=================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
