import { createServerFn } from "@tanstack/react-start";

/**
 * eSewa payment configuration.
 *
 * The secret key and merchant code are read from server-side environment
 * variables (Deno/Nitro process env) and NEVER exposed to the client.
 * The frontend only receives the signed form fields needed to POST to eSewa.
 */

function getEsewaConfig() {
  const merchantCode = process.env.ESEWA_MERCHANT_CODE || "EPAYTEST";
  const secret = process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q";
  const esewaUrl = process.env.ESEWA_URL || "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
  return { merchantCode, secret, esewaUrl };
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
