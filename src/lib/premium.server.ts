import { supabaseAdmin } from "@/integrations/supabase/client.server";

export class PremiumRequiredError extends Error {
  constructor(message?: string) {
    super(
      message ||
        "Upgrade your plan to access AI-powered features. Choose a plan that fits your needs.",
    );
    this.name = "PremiumRequiredError";
  }
}

/**
 * Throws PremiumRequiredError if the user does NOT have an active, paid,
 * non-expired subscription. Supports all plan types (premium, starter, professional, enterprise).
 */
export async function requirePremium(userId: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("status, payment_status, expires_at, plan_type")
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

/**
 * Checks if the user has a specific plan type.
 * Useful for restricting enterprise-only features.
 */
export async function requirePlan(userId: string, allowedPlans: string[]): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("status, payment_status, expires_at, plan_type")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new PremiumRequiredError();
  }

  const isPaid =
    data?.status === "active" &&
    data?.payment_status === "paid" &&
    (!data?.expires_at || new Date(data.expires_at).getTime() > Date.now());

  if (!isPaid || !data?.plan_type || !allowedPlans.includes(data.plan_type)) {
    throw new PremiumRequiredError(
      `This feature requires one of these plans: ${allowedPlans.join(", ")}`,
    );
  }
}

/**
 * Checks if the user has an employer plan (starter, professional, enterprise).
 */
export async function requireEmployerPlan(userId: string): Promise<void> {
  await requirePlan(userId, ["starter", "professional", "enterprise"]);
}

/**
 * Checks if the user has a job seeker premium plan.
 */
export async function requireSeekerPremium(userId: string): Promise<void> {
  await requirePlan(userId, ["premium"]);
}
