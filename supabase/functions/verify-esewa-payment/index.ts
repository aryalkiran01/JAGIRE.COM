import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// eSewa v2 status verification endpoint
const ESEWA_STATUS_URL = "https://rc-epay.esewa.com.np/api/epay/status/v2";
const MERCHANT_CODE = "EPAYTEST";

interface VerifyBody {
  transaction_uuid: string;
  total_amount: string;
  product_code?: string;
  user_id?: string;
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
      return new Response(
        JSON.stringify({ error: "Missing transaction_uuid or total_amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const product_code = body.product_code ?? MERCHANT_CODE;

    // 1. Verify with eSewa server-to-server
    const statusUrl = `${ESEWA_STATUS_URL}/?product_code=${encodeURIComponent(product_code)}&total_amount=${encodeURIComponent(total_amount)}&transaction_uuid=${encodeURIComponent(transaction_uuid)}`;

    let esewaResponse: Response;
    try {
      esewaResponse = await fetch(statusUrl, { method: "GET" });
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Unable to reach eSewa", verified: false }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const rawText = await esewaResponse.text();
    let esewaData: any = null;
    try {
      esewaData = JSON.parse(rawText);
    } catch {
      esewaData = { raw: rawText };
    }

    // eSewa status response: { status: "COMPLETE", transaction_code: ..., ... }
    const isVerified =
      esewaResponse.ok &&
      esewaData?.status === "COMPLETE" &&
      String(esewaData?.total_amount ?? "") === String(total_amount);

    // 2. Connect to Supabase with service role (bypass RLS) — server-side only
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server misconfiguration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 3. Idempotency: check if this transaction was already verified + activated
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
          message: "Payment already verified and premium activated.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 4. Record verification attempt (audit log)
    const { error: logError } = await supabase.from("payment_verifications").insert({
      transaction_uuid,
      user_id: body.user_id ?? null,
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
          esewa_status: esewaData?.status ?? "UNKNOWN",
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 5. Activate premium subscription
    const amount = Number(total_amount);
    let planType = "starter";
    if (amount >= 9900) planType = "pro";
    else if (amount >= 4900) planType = "starter";

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 30); // 30-day premium

    // Upsert subscription (one row per user)
    if (body.user_id) {
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
          JSON.stringify({ verified: true, error: "Failed to activate premium" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Also record in payments table for history
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

      // Notify user
      await supabase.from("notifications").insert({
        user_id: body.user_id,
        type: "payment_success",
        title: "Premium activated",
        message: `Your ${planType} plan is now active for 30 days. AI features unlocked!`,
        link: "/dashboard",
        is_read: false,
      });
    }

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
    return new Response(
      JSON.stringify({ error: String(err), verified: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
