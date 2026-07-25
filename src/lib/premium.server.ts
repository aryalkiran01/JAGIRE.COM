import { supabaseAdmin } from "@/integrations/supabase/client.server";

export class PremiumRequiredError extends Error {
  constructor() {
    super(
      "Buy Premium to access AI-powered features. Upgrade your plan to unlock AI career tools.",
    );
    this.name = "PremiumRequiredError";
  }
}

/**
 * Throws PremiumRequiredError if the user does NOT have an active, paid,
 * non-expired premium subscription. Call this at the top of every AI server
 * function handler, before any AI provider call.
 *
 * Uses the service-role client to bypass RLS so the check is authoritative
 * and cannot be spoofed from the client.
 */
export async function requirePremium(userId: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("status, payment_status, expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    // Fail closed — if we can't verify, block AI access.
    throw new PremiumRequiredError();
  }

  const isPaid =
    data?.status === "active" &&
    data?.payment_status === "paid" &&
    (!data?.expires_at || new Date(data.expires_at).getTime() > Date.now());

  if (!isPaid) {
    throw new PremiumRequiredError();
  }
}
