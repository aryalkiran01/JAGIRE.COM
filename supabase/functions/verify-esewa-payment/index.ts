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
  user_id?: string;
  // eSewa callback signature for verification
  esewa_signature?: string;
  signed_field_names?: string;
}

async function hmacSha256Hex(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
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
    const body = (await req.json()) as VerifyBody;
    const { transaction_uuid, total_amount } = body;

    if (!transaction_uuid || !total_amount) {
      return new Response(JSON.stringify({ error: "Missing transaction_uuid or total_amount" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!body.user_id) {
      return new Response(JSON.stringify({ error: "Missing user_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const product_code = body.product_code ?? MERCHANT_CODE;

    // 1. Verify eSewa callback signature if provided
    if (body.esewa_signature && body.signed_field_names) {
      const fields = body.signed_field_names.split(",");
      const messageParts: string[] = [];
      for (const f of fields) {
        const val = (body as any)[f.trim()] ?? "";
        messageParts.push(`${f.trim()}=${val}`);
      }
      const message = messageParts.join(",");
      const computedSig = await hmacSha256Hex(message, ESEWA_SECRET);
      if (computedSig !== body.esewa_signature) {
        console.error("Signature mismatch:", { computed: computedSig, provided: body.esewa_signature });
        return new Response(JSON.stringify({ error: "Invalid eSewa signature", verified: false }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
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
    let esewaData: any = null;
    try {
      esewaData = JSON.parse(rawText);
    } catch {
      esewaData = { raw: rawText };
    }

    const isVerified =
      esewaResponse.ok &&
      esewaData?.status === "COMPLETE" &&
      String(esewaData?.total_amount ?? "") === String(total_amount);

    // 3. Connect to Supabase with service role (bypass RLS)
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Server misconfiguration" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 4. Idempotency: check if this transaction was already verified + activated
    const { data: existing } = await supabase
      .from("payment_verifications")
      .select("verified, transaction_uuid")
      .eq("transaction_uuid", transaction_uuid)
      .eq("verified", true)
      .maybeSingle();

    if (existing?.verified) {
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
      user_id: body.user_id,
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
          http_status: esewaResponse.status,
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
        user_id: body.user_id,
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
      user_id: body.user_id,
      amount,
      currency: "NPR",
      plan_type: planType,
      status: "paid",
      esewa_ref_id: esewaData?.transaction_code ?? null,
      esewa_transaction_id: transaction_uuid,
      product_id: product_code,
    });

    // 9. Update profile subscription fields
    await supabase.from("profiles").update({
      subscription_status: "active",
      subscription_plan: planType,
      subscription_expires_at: expiresAt.toISOString(),
      updated_at: now.toISOString(),
    }).eq("id", body.user_id);

    // 10. Notify user
    await supabase.from("notifications").insert({
      user_id: body.user_id,
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
      headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
