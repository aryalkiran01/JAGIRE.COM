import { createServerFn } from "@tanstack/react-start";

/**
 * eSewa payment configuration.
 *
 * The secret key and merchant code are read from server-side environment
 * variables (Deno/Nitro process env) and NEVER exposed to the client.
 * The frontend only receives the signed form fields needed to POST to eSewa.
 *
 * Explicit environment isolation:
 * NODE_ENV (development vs production deployment) is decoupled from
 * ESEWA_ENVIRONMENT (sandbox vs production gateway).
 *
 * Supported configurations:
 * 1. NODE_ENV=development, ESEWA_ENVIRONMENT=sandbox
 * 2. NODE_ENV=production, ESEWA_ENVIRONMENT=sandbox (Production Jagire with Sandbox eSewa)
 * 3. NODE_ENV=production, ESEWA_ENVIRONMENT=production (Full Production eSewa Gateway)
 */

export const PUBLIC_SANDBOX_SECRET = "8gBm/:&EnhH.1/q";
export const PUBLIC_SANDBOX_MERCHANT = "EPAYTEST";

export function isEsewaProduction(): boolean {
  const env = (
    process.env.ESEWA_ENVIRONMENT ||
    process.env.ESEWA_ENV ||
    "sandbox"
  )
    .toLowerCase()
    .trim();
  return env === "production" || env === "prod" || env === "live";
}

export function getEsewaConfig() {
  const isProdGateway = isEsewaProduction();
  const merchantCode = process.env.ESEWA_MERCHANT_CODE?.trim();
  const secret = process.env.ESEWA_SECRET_KEY?.trim();

  if (isProdGateway) {
    if (!secret || secret === PUBLIC_SANDBOX_SECRET) {
      throw new Error(
        "CRITICAL_SECURITY_ERROR: ESEWA_SECRET_KEY is not configured or is using public sandbox secret in production eSewa environment.",
      );
    }
    if (!merchantCode || merchantCode === PUBLIC_SANDBOX_MERCHANT) {
      throw new Error(
        "CRITICAL_SECURITY_ERROR: ESEWA_MERCHANT_CODE is not configured for production eSewa environment.",
      );
    }
  }

  const effectiveMerchantCode = merchantCode || PUBLIC_SANDBOX_MERCHANT;
  const effectiveSecret = secret || PUBLIC_SANDBOX_SECRET;
  const esewaUrl =
    process.env.ESEWA_URL ||
    (isProdGateway
      ? "https://epay.esewa.com.np/api/epay/main/v2/form"
      : "https://rc-epay.esewa.com.np/api/epay/main/v2/form");

  return {
    merchantCode: effectiveMerchantCode,
    secret: effectiveSecret,
    esewaUrl,
    isProductionGateway: isProdGateway,
  };
}

async function hmacSha256Base64(message: string, secret: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  const bytes = new Uint8Array(sig);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

export interface EsewaPaymentPayload {
  amount: string;
  tax_amount: string;
  total_amount: string;
  transaction_uuid: string;
  product_code: string;
  product_service_charge: string;
  product_delivery_charge: string;
  success_url: string;
  failure_url: string;
  signed_field_names: string;
  signature: string;
  esewa_url: string;
}

export const createEsewaPayment = createServerFn({ method: "POST" })
  .validator((d: { planSlug: string; origin: string }) => {
    if (!d.planSlug) throw new Error("planSlug is required");
    if (!d.origin) throw new Error("origin is required");
    return d;
  })
  .handler(async ({ data }) => {
    const { planSlug, origin } = data;
    const { merchantCode, secret, esewaUrl } = getEsewaConfig();

    // Import the single source of truth for plan pricing.
    // We dynamically import to keep the server bundle lean.
    const { PLANS } = await import("./plans");
    const plan = PLANS[planSlug];
    if (!plan) throw new Error(`Unknown plan: ${planSlug}`);
    if (plan.contactSales) throw new Error("Contact-sales plans cannot be purchased");

    const amount = plan.price.toString();
    const tax = "0";
    const totalAmount = amount;
    const productServiceCharge = "0";
    const productDeliveryCharge = "0";
    const transactionUuid = `JAG-${planSlug}-${Date.now()}`;
    const signedFieldNames = "total_amount,transaction_uuid,product_code";
    const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${merchantCode}`;
    const signature = await hmacSha256Base64(message, secret);

    const payload: EsewaPaymentPayload = {
      amount,
      tax_amount: tax,
      total_amount: totalAmount,
      transaction_uuid: transactionUuid,
      product_code: merchantCode,
      product_service_charge: productServiceCharge,
      product_delivery_charge: productDeliveryCharge,
      success_url: `${origin}/payment-success`,
      failure_url: `${origin}/payment-failure`,
      signed_field_names: signedFieldNames,
      signature,
      esewa_url: esewaUrl,
    };

    return payload;
  });
