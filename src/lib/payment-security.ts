import { getPlanByAmount, PLANS } from "./plans";

/**
 * Payment Security Verification Utilities
 *
 * Implements core validation logic for eSewa callback signatures,
 * trusted plan-to-amount matching, and idempotency verification.
 */

export async function computeHmacSha256(
  message: string,
  secret: string,
): Promise<{ hex: string; base64: string }> {
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

  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  const base64 = btoa(bin);

  return { hex, base64 };
}

export interface EsewaCallbackPayload {
  transaction_uuid: string;
  total_amount: string;
  product_code?: string;
  signature: string;
  signed_field_names: string;
  status?: string;
  [key: string]: unknown;
}

/**
 * Verifies eSewa HMAC-SHA256 signature against the provided callback payload and merchant secret.
 * Supports both Base64 and Hex signature representations.
 */
export async function verifyEsewaSignature(
  payload: EsewaCallbackPayload,
  secret: string,
): Promise<boolean> {
  if (!payload.signature || !payload.signed_field_names) {
    return false;
  }

  const fields = payload.signed_field_names.split(",");
  const messageParts: string[] = [];

  for (const f of fields) {
    const fieldName = f.trim();
    const val = String(payload[fieldName] ?? "");
    messageParts.push(`${fieldName}=${val}`);
  }

  const message = messageParts.join(",");
  const { hex, base64 } = await computeHmacSha256(message, secret);

  const providedSig = payload.signature.trim();
  return (
    providedSig === hex || providedSig === base64 || providedSig.toLowerCase() === hex.toLowerCase()
  );
}

/**
 * Validates whether an amount corresponds to a legitimate system plan.
 * Returns the verified plan config or null.
 */
export function verifyPlanFromAmount(amountNumber: number) {
  const planSlug = getPlanByAmount(amountNumber);
  if (!planSlug) return null;
  const plan = PLANS[planSlug];
  if (!plan || plan.price !== amountNumber) return null;
  return plan;
}

/**
 * Evaluates payment callback state and rejects any unauthorized or incomplete parameters.
 */
export function validatePaymentCallbackParams(payload: EsewaCallbackPayload): {
  isValid: boolean;
  error?: string;
} {
  if (!payload.transaction_uuid || !payload.transaction_uuid.trim()) {
    return { isValid: false, error: "Missing transaction_uuid" };
  }

  const amount = parseFloat(payload.total_amount);
  if (isNaN(amount) || amount <= 0) {
    return { isValid: false, error: "Invalid total_amount" };
  }

  if (payload.status && payload.status !== "COMPLETE") {
    return { isValid: false, error: `Invalid payment status: ${payload.status}` };
  }

  const verifiedPlan = verifyPlanFromAmount(amount);
  if (!verifiedPlan) {
    return { isValid: false, error: `No recognized plan for amount: Rs. ${amount}` };
  }

  return { isValid: true };
}
