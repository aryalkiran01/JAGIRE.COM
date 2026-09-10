import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// eSewa TEST environment configuration
const ESEWA_STATUS_URL =
  Deno.env.get("ESEWA_STATUS_URL") || "https://rc-epay.esewa.com.np/api/epay/status/v2";
const MERCHANT_CODE = Deno.env.get("ESEWA_MERCHANT_CODE") || "EPAYTEST";
const ESEWA_SECRET = Deno.env.get("ESEWA_SECRET_KEY") || "8gBm/:&EnhH.1/q";

const PLAN_PRICES: Record<string, number> = {
  premium: 499,
  starter: 1999,
  professional: 4999,
};
const PLAN_DURATIONS: Record<string, number> = {
  premium: 30,
  starter: 30,
  professional: 30,
};

interface VerifyBody {
  transaction_uuid: string;
  total_amount: string | number;
  product_code?: string;
  esewa_signature?: string;
  signature?: string;
  signed_field_names?: string;
  transaction_code?: string;
  status?: string;
  raw_data?: string;
  [key: string]: unknown;
}

async function hmacSha256(
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed", verified: false }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    console.log("[PAYMENT_VERIFICATION_STARTED] Received verification request");

    // 0. Authenticate the caller via Supabase JWT — do NOT trust client-supplied user_id
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.warn("[PAYMENT_AUTH_REQUIRED] Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({
          error: "Unauthorized: Missing authentication token",
          verified: false,
          auth_required: true,
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      console.error("[PAYMENT_VERIFICATION_FAILED] Server configuration missing required env vars");
      return new Response(JSON.stringify({ error: "Server misconfiguration", verified: false }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) {
      console.warn("[PAYMENT_AUTH_REQUIRED] Token validation failed:", userError?.message);
      return new Response(
        JSON.stringify({
          error: "Unauthorized: Invalid session token",
          verified: false,
          auth_required: true,
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    const userId = user.id;

    const body = (await req.json()) as VerifyBody;
    const transaction_uuid = String(body.transaction_uuid ?? "");
    const rawTotalAmount = String(body.total_amount ?? "");
    const total_amount = rawTotalAmount.replace(/,/g, "");

    if (!transaction_uuid || !total_amount) {
      console.warn("[PAYMENT_VERIFICATION_FAILED] Missing transaction_uuid or total_amount");
      return new Response(
        JSON.stringify({ error: "Missing transaction_uuid or total_amount", verified: false }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const product_code = body.product_code ?? MERCHANT_CODE;
    const clientSignature = body.esewa_signature || body.signature || "";

    // 1. Signature Verification with full field extraction
    let isValidSignature = false;
    if (clientSignature && body.signed_field_names) {
      const fields = body.signed_field_names.split(",");
      const messageParts: string[] = [];
      for (const f of fields) {
        const fieldName = f.trim();
        let val = "";
        if (fieldName === "total_amount") val = total_amount;
        else if (fieldName === "transaction_uuid") val = transaction_uuid;
        else if (fieldName === "product_code") val = product_code;
        else if (fieldName === "transaction_code") val = String(body.transaction_code ?? "");
        else if (fieldName === "status") val = String(body.status ?? "");
        else if (fieldName === "signed_field_names") val = String(body.signed_field_names ?? "");
        else val = String(body[fieldName] ?? "");
        messageParts.push(`${fieldName}=${val}`);
      }
      const message = messageParts.join(",");
      const { hex: computedHex, base64: computedBase64 } = await hmacSha256(message, ESEWA_SECRET);

      const fallbackMsg = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
      const fallbackSig = await hmacSha256(fallbackMsg, ESEWA_SECRET);

      isValidSignature =
        clientSignature === computedHex ||
        clientSignature === computedBase64 ||
        clientSignature.toLowerCase() === computedHex.toLowerCase() ||
        clientSignature === fallbackSig.hex ||
        clientSignature === fallbackSig.base64 ||
        clientSignature.toLowerCase() === fallbackSig.hex.toLowerCase();
    }

    // 2. Connect to Supabase with service role (bypasses RLS for secure atomic updates)
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 3. Idempotency & User Binding: check if this transaction was already verified
    const { data: existing } = await supabase
      .from("payment_verifications")
      .select("verified, transaction_uuid, user_id")
      .eq("transaction_uuid", transaction_uuid)
      .maybeSingle();

    if (existing?.verified) {
      if (existing.user_id && existing.user_id !== userId) {
        console.warn("[PAYMENT_VERIFICATION_FAILED] Transaction claimed by different user");
        return new Response(
          JSON.stringify({
            verified: false,
            error: "Transaction was already claimed by another account.",
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Fetch existing subscription to return accurate metadata
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan_type, expires_at, status")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log("[PAYMENT_VERIFICATION_SUCCESS] Idempotent hit — already activated for user");
      return new Response(
        JSON.stringify({
          verified: true,
          already_activated: true,
          plan_type: sub?.plan_type || "premium",
          expires_at: sub?.expires_at,
          message: "Payment already verified and subscription is active.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 4. Authoritative Server-to-Server Verification with eSewa TEST API
    const statusUrl = `${ESEWA_STATUS_URL}?product_code=${encodeURIComponent(product_code)}&total_amount=${encodeURIComponent(total_amount)}&transaction_uuid=${encodeURIComponent(transaction_uuid)}`;

    let esewaResponse: Response;
    try {
      esewaResponse = await fetch(statusUrl, { method: "GET" });
    } catch (fetchErr) {
      console.error("[PAYMENT_VERIFICATION_RETRY] Network error reaching eSewa:", fetchErr);
      return new Response(
        JSON.stringify({
          error: "Unable to reach eSewa status endpoint. Please retry.",
          verified: false,
          retryable: true,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const rawText = await esewaResponse.text();
    let esewaData: Record<string, unknown> | null = null;
    try {
      esewaData = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      esewaData = { raw: rawText };
    }

    const esewaStatus = String(esewaData?.status ?? "").toUpperCase();
    const isComplete = esewaStatus === "COMPLETE";
    const returnedAmount = String(esewaData?.total_amount ?? "").replace(/,/g, "");
    const isAmountMatch = parseFloat(returnedAmount) === parseFloat(total_amount);
    const isS2SVerified = esewaResponse.ok && isComplete && isAmountMatch;

    // Both S2S confirmation or valid callback HMAC signature prove transaction validity
    const isVerified = isS2SVerified || (isValidSignature && String(body.status ?? "").toUpperCase() === "COMPLETE");

    // If eSewa is still processing or returned pending status, inform client with retryable response
    if (esewaStatus === "PENDING" || esewaStatus === "AMBIGUOUS") {
      console.log(`[PAYMENT_VERIFICATION_RETRY] eSewa status is ${esewaStatus}, retryable`);
      return new Response(
        JSON.stringify({
          verified: false,
          pending: true,
          retryable: true,
          status: esewaStatus,
          message: "Payment is still being processed by eSewa. Please wait…",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 5. Record verification attempt (audit log)
    const { error: logError } = await supabase.from("payment_verifications").insert({
      transaction_uuid,
      user_id: userId,
      product_code,
      total_amount: Number(total_amount),
      verified: isVerified,
      esewa_ref_id:
        (esewaData?.transaction_code as string) ??
        (esewaData?.ref_id as string) ??
        body.transaction_code ??
        null,
      status: esewaStatus || body.status || null,
      raw_response: esewaData,
      verified_at: isVerified ? new Date().toISOString() : null,
    });

    if (logError) {
      console.error("Failed to log verification audit record:", logError.message);
    }

    if (!isVerified) {
      console.warn(`[PAYMENT_VERIFICATION_FAILED] eSewa S2S status: ${esewaStatus}, isValidSignature: ${isValidSignature}`);
      return new Response(
        JSON.stringify({
          verified: false,
          status: esewaStatus || "FAILED",
          error: `Payment could not be verified by eSewa (status: ${esewaStatus || "INVALID_SIGNATURE"}).`,
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 6. Determine plan from the verified amount (authoritative single source of truth)
    const amount = Number(total_amount);
    let planType: string | null = null;
    for (const [slug, price] of Object.entries(PLAN_PRICES)) {
      if (amount === price) {
        planType = slug;
        break;
      }
    }
    if (!planType) {
      console.error(`[PAYMENT_VERIFICATION_FAILED] Unknown price Rs. ${amount}`);
      return new Response(
        JSON.stringify({
          verified: true,
          error: `No plan matches amount Rs. ${amount}`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const durationDays = PLAN_DURATIONS[planType] ?? 30;
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    const refId =
      (esewaData?.transaction_code as string) ??
      (esewaData?.ref_id as string) ??
      body.transaction_code ??
      null;

    // 7. Upsert subscription with active paid state
    const { error: subError } = await supabase.from("subscriptions").upsert(
      {
        user_id: userId,
        plan_type: planType,
        status: "active",
        payment_status: "paid",
        transaction_id: transaction_uuid,
        esewa_ref_id: refId,
        amount,
        currency: "NPR",
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (subError) {
      console.error(
        "[PAYMENT_VERIFICATION_FAILED] Failed to activate subscription:",
        subError.message,
      );
      return new Response(
        JSON.stringify({ verified: true, error: "Failed to activate subscription in database" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    console.log(
      `[SUBSCRIPTION_CREATED] Plan ${planType} activated for user ${userId} until ${expiresAt.toISOString()}`,
    );

    // 8. Record in payments table
    try {
      await supabase.from("payments").insert({
        user_id: userId,
        amount,
        currency: "NPR",
        plan_type: planType,
        status: "paid",
        esewa_ref_id: refId,
        esewa_transaction_id: transaction_uuid,
        product_id: product_code,
      });
    } catch (payErr) {
      console.warn("Non-fatal payment log error:", payErr);
    }

    // 9. Synchronize profile subscription fields
    await supabase
      .from("profiles")
      .update({
        subscription_status: "active",
        subscription_plan: planType,
        subscription_expires_at: expiresAt.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", userId);

    console.log("[SUBSCRIPTION_UPDATED] Profile record updated with active subscription");

    // 10. Notify user
    try {
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "payment_success",
        title: `${planType.charAt(0).toUpperCase() + planType.slice(1)} plan activated`,
        message: `Your ${planType} plan is now active for ${durationDays} days. AI features unlocked!`,
        link: "/dashboard",
        is_read: false,
      });
    } catch (notifErr) {
      console.warn("Non-fatal notification insert error:", notifErr);
    }

    console.log(
      "[PAYMENT_VERIFICATION_SUCCESS] Verification and subscription provisioning complete",
    );

    return new Response(
      JSON.stringify({
        verified: true,
        activated: true,
        plan_type: planType,
        expires_at: expiresAt.toISOString(),
        message: "Payment verified and premium subscription successfully activated.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[PAYMENT_VERIFICATION_FAILED] Unhandled error:", err);
    return new Response(
      JSON.stringify({
        error: "Internal server error during payment verification",
        verified: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
