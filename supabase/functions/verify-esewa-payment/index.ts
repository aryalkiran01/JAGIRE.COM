import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
  total_amount: string;
  product_code?: string;
  esewa_signature: string;
  signed_field_names: string;
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
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // 0. Authenticate the caller via Supabase JWT — do NOT trust client-supplied user_id
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Server misconfiguration" }), {
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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const body = (await req.json()) as VerifyBody;
    const { transaction_uuid, total_amount } = body;

    if (!transaction_uuid || !total_amount) {
      return new Response(JSON.stringify({ error: "Missing transaction_uuid or total_amount" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Signature is MANDATORY — reject if missing
    if (!body.esewa_signature || !body.signed_field_names) {
      return new Response(JSON.stringify({ error: "Missing eSewa signature", verified: false }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const product_code = body.product_code ?? MERCHANT_CODE;

    // 1. Verify eSewa callback signature (mandatory)
    const fields = body.signed_field_names.split(",");
    const messageParts: string[] = [];
    for (const f of fields) {
      const fieldName = f.trim();
      // Look up the value from the body by field name
      let val: string;
      if (fieldName === "total_amount") val = total_amount;
      else if (fieldName === "transaction_uuid") val = transaction_uuid;
      else if (fieldName === "product_code") val = product_code;
      else val = String((body as Record<string, unknown>)[fieldName] ?? "");
      messageParts.push(`${fieldName}=${val}`);
    }
    const message = messageParts.join(",");
    const { hex: computedHex, base64: computedBase64 } = await hmacSha256(message, ESEWA_SECRET);
    const isValidSignature =
      body.esewa_signature === computedHex ||
      body.esewa_signature === computedBase64 ||
      body.esewa_signature.toLowerCase() === computedHex.toLowerCase();

    if (!isValidSignature) {
      console.error("Signature mismatch");
      return new Response(JSON.stringify({ error: "Invalid eSewa signature", verified: false }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Verify with eSewa server-to-server
    const statusUrl = `${ESEWA_STATUS_URL}?product_code=${encodeURIComponent(product_code)}&total_amount=${encodeURIComponent(total_amount)}&transaction_uuid=${encodeURIComponent(transaction_uuid)}`;

    let esewaResponse: Response;
    try {
      esewaResponse = await fetch(statusUrl, { method: "GET" });
    } catch {
      return new Response(JSON.stringify({ error: "Unable to reach eSewa", verified: false }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawText = await esewaResponse.text();
    let esewaData: Record<string, unknown> | null = null;
    try {
      esewaData = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      esewaData = { raw: rawText };
    }

    const isVerified =
      esewaResponse.ok &&
      esewaData?.status === "COMPLETE" &&
      String(esewaData?.total_amount ?? "") === String(total_amount);

    // 3. Connect to Supabase with service role (bypass RLS)
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 4. Idempotency & User Binding: check if this transaction was already verified
    const { data: existing } = await supabase
      .from("payment_verifications")
      .select("verified, transaction_uuid, user_id")
      .eq("transaction_uuid", transaction_uuid)
      .maybeSingle();

    if (existing?.verified) {
      if (existing.user_id && existing.user_id !== userId) {
        return new Response(
          JSON.stringify({
            verified: false,
            error: "Transaction was already claimed by another user.",
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({
          verified: true,
          already_activated: true,
          message: "Payment already verified and subscription activated.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 5. Record verification attempt (audit log)
    const { error: logError } = await supabase.from("payment_verifications").insert({
      transaction_uuid,
      user_id: userId,
      product_code,
      total_amount: Number(total_amount),
      verified: isVerified,
      esewa_ref_id: esewaData?.transaction_code ?? esewaData?.ref_id ?? null,
      status: esewaData?.status ?? null,
      raw_response: esewaData,
      verified_at: isVerified ? new Date().toISOString() : null,
    });

    if (logError) {
      console.error("Failed to log verification:", logError.message);
    }

    if (!isVerified) {
      return new Response(
        JSON.stringify({
          verified: false,
          error: "Payment not confirmed by eSewa",
        }),
        {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 6. Determine plan from the verified amount (single source of truth)
    const amount = Number(total_amount);
    let planType: string | null = null;
    for (const [slug, price] of Object.entries(PLAN_PRICES)) {
      if (amount === price) {
        planType = slug;
        break;
      }
    }
    if (!planType) {
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

    // 7. Upsert subscription (service role bypasses RLS)
    const { error: subError } = await supabase.from("subscriptions").upsert(
      {
        user_id: userId,
        plan_type: planType,
        status: "active",
        payment_status: "paid",
        transaction_id: transaction_uuid,
        esewa_ref_id: esewaData?.transaction_code ?? null,
        amount,
        currency: "NPR",
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (subError) {
      console.error("Failed to activate subscription:", subError.message);
      return new Response(
        JSON.stringify({ verified: true, error: "Failed to activate subscription" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 8. Record in payments table
    await supabase.from("payments").insert({
      user_id: userId,
      amount,
      currency: "NPR",
      plan_type: planType,
      status: "paid",
      esewa_ref_id: esewaData?.transaction_code ?? null,
      esewa_transaction_id: transaction_uuid,
      product_id: product_code,
    });

    // 9. Update profile subscription fields
    await supabase
      .from("profiles")
      .update({
        subscription_status: "active",
        subscription_plan: planType,
        subscription_expires_at: expiresAt.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", userId);

    // 10. Notify user
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "payment_success",
      title: `${planType.charAt(0).toUpperCase() + planType.slice(1)} plan activated`,
      message: `Your ${planType} plan is now active for ${durationDays} days. AI features unlocked!`,
      link: "/dashboard",
      is_read: false,
    });

    return new Response(
      JSON.stringify({
        verified: true,
        activated: true,
        plan_type: planType,
        expires_at: expiresAt.toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("verify-esewa-payment error:", err);
    return new Response(JSON.stringify({ error: "Internal server error", verified: false }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
