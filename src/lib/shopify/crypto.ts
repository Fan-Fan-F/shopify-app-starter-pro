import crypto from "crypto";

/**
 * Validates a Shopify App Proxy incoming request query string.
 * According to Shopify's specification:
 * 1. Filter out the `signature` param.
 * 2. Sort the remaining keys lexicographically.
 * 3. Concatenate each key-value pair as `key=value` (or `key=val1,val2` if array).
 * 4. Compute HMAC-SHA256 with the app's client secret (hex digest).
 * 5. Compare with the received `signature` using a timing-safe equality check.
 */
export function calculateAppProxyHmac(
  params: Record<string, string | string[] | undefined>,
  apiSecret: string
): string {
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

  return crypto.createHmac("sha256", apiSecret).update(message, "utf-8").digest("hex");
}

export function verifyAppProxySignature(
  params: Record<string, string | string[] | undefined>,
  apiSecret: string
): boolean {
  const signature = params.signature;
  if (!signature || typeof signature !== "string") {
    return false;
  }

  const expectedHmac = calculateAppProxyHmac(params, apiSecret);

  try {
    const receivedBuffer = Buffer.from(signature, "utf-8");
    const expectedBuffer = Buffer.from(expectedHmac, "utf-8");
    if (receivedBuffer.length !== expectedBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * Calculates Shopify Webhook HMAC-SHA256 (Base64 digest of raw body).
 */
export function calculateWebhookHmac(
  rawBody: string | Buffer,
  apiSecret: string
): string {
  return crypto.createHmac("sha256", apiSecret).update(rawBody).digest("base64");
}

/**
 * Verifies the incoming `x-shopify-hmac-sha256` header against the raw request body.
 */
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  receivedHmac: string | undefined,
  apiSecret: string
): boolean {
  if (!receivedHmac || typeof receivedHmac !== "string") {
    return false;
  }

  const calculated = calculateWebhookHmac(rawBody, apiSecret);

  try {
    const receivedBuffer = Buffer.from(receivedHmac, "base64");
    const calculatedBuffer = Buffer.from(calculated, "base64");

    if (receivedBuffer.length !== calculatedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(receivedBuffer, calculatedBuffer);
  } catch {
    return false;
  }
}
