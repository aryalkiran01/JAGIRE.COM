import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Only these recipients are allowed for client-side calls (support form) — prevents open relay abuse
const ALLOWED_TO = ["admin@jagire.com"];

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
    if (!supabaseUrl || !anonKey) {
      return new Response(JSON.stringify({ error: "Server misconfiguration" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.slice("Bearer ".length);
    const secretKey = Deno.env.get("SUPABASE_SECRET_KEY");
    let isServiceRole =
      (serviceRoleKey !== undefined && token === serviceRoleKey) ||
      (secretKey !== undefined && token === secretKey);

    if (!isServiceRole) {
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload?.role === "service_role") {
            isServiceRole = true;
          }
        }
      } catch {}
    }

    let isTrustedServer = false;

    if (isServiceRole) {
      // Server-side calls (interview scheduling, etc.) use the service role key
      // and are allowed to send transactional emails to any recipient.
      isTrustedServer = true;
    } else {
      // Client-side calls (support form) must have a valid user JWT
      const supabase = createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: authHeader } },
      });
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { to, subject, html, text, reply_to } = await req.json();

    if (!to || !subject) {
      return new Response(JSON.stringify({ error: "Missing 'to' or 'subject'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const recipients = Array.isArray(to) ? to : [to];

    // Enforce recipient allowlist only for untrusted (client-side) callers
    if (!isTrustedServer) {
      for (const r of recipients) {
        if (!ALLOWED_TO.includes(r)) {
          return new Response(JSON.stringify({ error: "Recipient not allowed" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    const safeSubject = escapeHtml(String(subject)).slice(0, 200);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fromAddress =
      Deno.env.get("RESEND_FROM") || "Jagire <notifications@jagire.aryalkiran21.com.np>";

    const emailPayload: Record<string, unknown> = {
      from: fromAddress,
      to: recipients,
      subject: safeSubject,
      html: html || text || "",
    };
    if (reply_to && typeof reply_to === "string") {
      emailPayload.reply_to = reply_to;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(emailPayload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn("[send-email] Resend API error:", res.status, errText);

      let isSandboxRestriction = false;
      try {
        const parsed = JSON.parse(errText);
        if (
          res.status === 403 ||
          parsed?.name === "validation_error" ||
          parsed?.message?.includes("only send testing emails") ||
          parsed?.message?.includes("verify a domain") ||
          parsed?.message?.includes("not verified") ||
          parsed?.message?.includes("domain")
        ) {
          isSandboxRestriction = true;
        }
      } catch {
        if (
          errText.includes("only send testing emails") ||
          errText.includes("verify a domain") ||
          errText.includes("not verified") ||
          errText.includes("domain")
        ) {
          isSandboxRestriction = true;
        }
      }

      return new Response(
        JSON.stringify({
          success: false,
          emailSent: false,
          emailRestricted: isSandboxRestriction,
          errorCode: isSandboxRestriction ? "RESEND_TESTING_RESTRICTION" : "EMAIL_DELIVERY_FAILED",
          message: isSandboxRestriction
            ? "Interview scheduled successfully, but email could not be delivered because Resend is currently in testing mode."
            : "Email delivery failed.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const data = await res.json();
    return new Response(
      JSON.stringify({
        success: true,
        emailSent: true,
        emailRestricted: false,
        id: data.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("[send-email] Internal error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        emailSent: false,
        emailRestricted: false,
        errorCode: "INTERNAL_ERROR",
        message: "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
