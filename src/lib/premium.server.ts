import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth.middleware";

export class PremiumRequiredError extends Error {
  readonly code: string;
  readonly reason: string;
  readonly requiredPlan?: string;

  constructor(message?: string, code: string = "PREMIUM_REQUIRED", requiredPlan?: string) {
    super(
      message ||
        "Upgrade your plan to access AI-powered features. Choose a plan that fits your needs.",
    );
    this.name = "PremiumRequiredError";
    this.code = code;
    this.reason = code;
    this.requiredPlan = requiredPlan;
  }
}

export interface AIAccessResult {
  allowed: boolean;
  accessType: "admin" | "paid" | "trial" | "none";
  reason:
    | "ACTIVE_SUBSCRIPTION"
    | "TRIAL_ACTIVE"
    | "TRIAL_STARTED"
    | "TRIAL_EXPIRED"
    | "PAYMENT_REQUIRED"
    | "ROLE_UNAUTHORIZED"
    | "UNAUTHENTICATED";
  expiresAt: string | null;
  trialUsed: boolean;
  trialStatus: "none" | "active" | "expired" | "not_started";
  trialActive?: boolean;
  trialExpired?: boolean;
  planType?: string;
  userRole?: string;
  role?: string;
  trialDaysRemaining?: number | null;
  trialHoursRemaining?: number | null;
  daysRemaining?: number | null;
  hoursRemaining?: number | null;
  isActive?: boolean;
  isExpired?: boolean;
  status?: string;
}

export const TRIAL_DURATION_MS = 72 * 60 * 60 * 1000; // 3 calendar days (72 hours)

/**
 * Server-side entitlement and 3-Day Free AI Trial verification.
 * 
 * Rules:
 * 1. Admins get unrestricted full platform access.
 * 2. Active Paid Subscriptions grant full AI access matching plan level.
 * 3. Eligible Job Seekers & Employers who have never activated the trial are granted
 *    exactly 72 hours of full AI access starting on their first AI action.
 * 4. Active trials grant access across all eligible AI features for the 72-hour window.
 * 5. Expired trials require plan upgrade. Trials cannot be reset or claimed multiple times.
 */
export async function canUseAI(
  userId?: string | null,
  options: {
    autoActivateTrial?: boolean;
    autoStartTrial?: boolean;
    allowedPlans?: string[];
  } = { autoActivateTrial: true },
): Promise<AIAccessResult> {
  if (!userId) {
    return {
      allowed: false,
      accessType: "none",
      reason: "UNAUTHENTICATED",
      expiresAt: null,
      trialUsed: false,
      trialStatus: "none",
      trialActive: false,
      trialExpired: false,
      isActive: false,
      isExpired: false,
      status: "none",
    };
  }

  const shouldAutoActivate = options.autoActivateTrial ?? options.autoStartTrial ?? true;

  // 1. Authoritative Admin check via user_roles
  const { data: roleData } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  const userRole = roleData?.role || "job_seeker";

  if (userRole === "admin") {
    return {
      allowed: true,
      accessType: "admin",
      reason: "ACTIVE_SUBSCRIPTION",
      expiresAt: null,
      trialUsed: true,
      trialStatus: "none",
      trialActive: false,
      trialExpired: false,
      planType: "enterprise",
      userRole,
      role: userRole,
    };
  }

  const nowMs = Date.now();

  // 2. Active Paid Subscription check
  const { data: activeSub } = await supabaseAdmin
    .from("subscriptions")
    .select("status, payment_status, expires_at, plan_type")
    .eq("user_id", userId)
    .eq("status", "active")
    .eq("payment_status", "paid")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeSub) {
    const subExpiresAt = activeSub.expires_at ? new Date(activeSub.expires_at).getTime() : null;
    const isSubActive = !subExpiresAt || subExpiresAt > nowMs;

    if (isSubActive) {
      if (options.allowedPlans && activeSub.plan_type && !options.allowedPlans.includes(activeSub.plan_type)) {
        return {
          allowed: false,
          accessType: "none",
          reason: "ROLE_UNAUTHORIZED",
          expiresAt: activeSub.expires_at,
          trialUsed: true,
          trialStatus: "none",
          trialActive: false,
          trialExpired: false,
          planType: activeSub.plan_type,
          userRole,
          role: userRole,
        };
      }

      return {
        allowed: true,
        accessType: "paid",
        reason: "ACTIVE_SUBSCRIPTION",
        expiresAt: activeSub.expires_at,
        trialUsed: true,
        trialStatus: "none",
        trialActive: false,
        trialExpired: false,
        planType: activeSub.plan_type,
        userRole,
        role: userRole,
      };
    }
  }

  // 3. AI Trial Check from profiles table
  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("profiles")
    .select("ai_trial_started_at, ai_trial_expires_at, ai_trial_status, ai_trial_used, user_role")
    .eq("id", userId)
    .maybeSingle();

  if (profileErr) {
    console.error("Error fetching profile trial state:", profileErr.message);
  }

  const effectiveRole = profile?.user_role || userRole;
  const trialUsed = Boolean(profile?.ai_trial_used);
  const trialExpiresAt = profile?.ai_trial_expires_at ? new Date(profile.ai_trial_expires_at).getTime() : null;

  // 3A. Active Trial (within 72-hour window)
  if (trialUsed && trialExpiresAt && trialExpiresAt > nowMs) {
    const msRemaining = trialExpiresAt - nowMs;
    const trialDaysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
    const trialHoursRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60)));

    return {
      allowed: true,
      accessType: "trial",
      reason: "TRIAL_ACTIVE",
      expiresAt: profile!.ai_trial_expires_at,
      trialUsed: true,
      trialStatus: "active",
      trialActive: true,
      trialExpired: false,
      userRole: effectiveRole,
      role: effectiveRole,
      trialDaysRemaining,
      trialHoursRemaining,
      daysRemaining: trialDaysRemaining,
      hoursRemaining: trialHoursRemaining,
      isActive: true,
      isExpired: false,
      status: "active",
    };
  }

  // 3B. Expired Trial (past 72 hours)
  if (trialUsed && trialExpiresAt && trialExpiresAt <= nowMs) {
    // Synchronize expired status in database if not marked yet
    if (profile?.ai_trial_status !== "expired") {
      await supabaseAdmin
        .from("profiles")
        .update({ ai_trial_status: "expired", updated_at: new Date().toISOString() })
        .eq("id", userId);
    }

    return {
      allowed: false,
      accessType: "none",
      reason: "TRIAL_EXPIRED",
      expiresAt: profile!.ai_trial_expires_at,
      trialUsed: true,
      trialStatus: "expired",
      trialActive: false,
      trialExpired: true,
      userRole: effectiveRole,
      role: effectiveRole,
      trialDaysRemaining: 0,
      trialHoursRemaining: 0,
      daysRemaining: 0,
      hoursRemaining: 0,
      isActive: false,
      isExpired: true,
      status: "expired",
    };
  }

  // 3C. Trial Never Used -> Auto-activate 3-Day (72-Hour) Trial on First AI Request
  if (!trialUsed) {
    if (shouldAutoActivate) {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + TRIAL_DURATION_MS); // exactly 72 hours from server now

      const { error: updateErr } = await supabaseAdmin
        .from("profiles")
        .update({
          ai_trial_started_at: now.toISOString(),
          ai_trial_expires_at: expiresAt.toISOString(),
          ai_trial_status: "active",
          ai_trial_used: true,
          updated_at: now.toISOString(),
        })
        .eq("id", userId);

      if (updateErr) {
        console.error("Failed to activate AI trial:", updateErr.message);
      }

      return {
        allowed: true,
        accessType: "trial",
        reason: "TRIAL_STARTED",
        expiresAt: expiresAt.toISOString(),
        trialUsed: true,
        trialStatus: "active",
        trialActive: true,
        trialExpired: false,
        userRole: effectiveRole,
        role: effectiveRole,
        trialDaysRemaining: 3,
        trialHoursRemaining: 72,
        daysRemaining: 3,
        hoursRemaining: 72,
        isActive: true,
        isExpired: false,
        status: "active",
      };
    }

    // If query is read-only (not yet activated)
    return {
      allowed: false,
      accessType: "none",
      reason: "PAYMENT_REQUIRED",
      expiresAt: null,
      trialUsed: false,
      trialStatus: "not_started",
      trialActive: false,
      trialExpired: false,
      userRole: effectiveRole,
      role: effectiveRole,
      trialDaysRemaining: 3,
      trialHoursRemaining: 72,
      daysRemaining: 3,
      hoursRemaining: 72,
      isActive: false,
      isExpired: false,
      status: "not_started",
    };
  }

  return {
    allowed: false,
    accessType: "none",
    reason: "PAYMENT_REQUIRED",
    expiresAt: null,
    trialUsed,
    trialStatus: (profile?.ai_trial_status as any) || "none",
    trialActive: false,
    trialExpired: profile?.ai_trial_status === "expired",
    userRole: effectiveRole,
    role: effectiveRole,
    isActive: false,
    isExpired: profile?.ai_trial_status === "expired",
    status: profile?.ai_trial_status || "none",
  };
}

/**
 * Pure server function: fetch current AI trial and subscription entitlement for a user.
 */
export async function getAITrialStatusForUser(userId: string): Promise<AIAccessResult> {
  return canUseAI(userId, { autoActivateTrial: false });
}

/**
 * Pure server function: activate the 3-day AI trial on user demand.
 */
export async function activateAITrialForUser(userId: string): Promise<{ activated: boolean; result: AIAccessResult }> {
  const check = await canUseAI(userId, { autoActivateTrial: false });
  if (check.trialUsed) {
    return { activated: false, result: check };
  }
  const result = await canUseAI(userId, { autoActivateTrial: true });
  return { activated: result.allowed && result.accessType === "trial", result };
}

/**
 * Throws PremiumRequiredError if the user does NOT have an active paid subscription or active 3-day trial.
 * Auto-activates the 3-day trial on the user's first AI request.
 */
export async function requirePremium(userId?: string | null): Promise<void> {
  const result = await canUseAI(userId, { autoActivateTrial: true });
  if (!result.allowed) {
    if (result.reason === "TRIAL_EXPIRED") {
      throw new PremiumRequiredError(
        "Your 3-day free AI trial has ended. Upgrade your plan to continue using Jagire's AI features.",
        "TRIAL_EXPIRED",
      );
    }
    if (result.reason === "UNAUTHENTICATED") {
      throw new PremiumRequiredError("Authentication required.", "UNAUTHENTICATED");
    }
    throw new PremiumRequiredError();
  }
}

/**
 * Checks if the user has a specific plan type or an active trial.
 * During 3-day trial, users have full access to AI tools.
 */
export async function requirePlan(userId?: string | null, allowedPlans: string[] = []): Promise<void> {
  const result = await canUseAI(userId, { autoActivateTrial: true, allowedPlans });
  if (!result.allowed) {
    if (result.reason === "TRIAL_EXPIRED") {
      throw new PremiumRequiredError(
        "Your 3-day free AI trial has ended. Upgrade your plan to continue using Jagire's AI features.",
        "TRIAL_EXPIRED",
        allowedPlans[0] || "premium",
      );
    }
    if (result.reason === "ROLE_UNAUTHORIZED") {
      throw new PremiumRequiredError(
        `This feature requires one of these plans: ${allowedPlans.join(", ")}`,
        "PLAN_REQUIRED",
        allowedPlans[0] || "premium",
      );
    }
    if (result.reason === "UNAUTHENTICATED") {
      throw new PremiumRequiredError("Authentication required.", "UNAUTHENTICATED");
    }
    throw new PremiumRequiredError(undefined, "PREMIUM_REQUIRED", allowedPlans[0] || "premium");
  }
}

/**
 * Checks if the user has an employer plan or an active trial.
 */
export async function requireEmployerPlan(userId?: string | null, plan: string = "starter"): Promise<void> {
  await requirePlan(userId, [plan, "starter", "professional", "enterprise"]);
}

/**
 * Checks if the user has a job seeker premium plan or an active trial.
 */
export async function requireSeekerPremium(userId?: string | null): Promise<void> {
  await requirePlan(userId, ["premium"]);
}

/**
 * Server Function: Explicitly fetch current AI trial and subscription entitlement.
 */
export const getAITrialStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = (context as any)?.userId;
    if (!userId) throw new Error("Not authenticated");
    return getAITrialStatusForUser(userId);
  });

/**
 * Server Function: Explicitly activate the 3-day AI trial on user demand.
 */
export const activateAITrial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = (context as any)?.userId;
    if (!userId) throw new Error("Not authenticated");
    return activateAITrialForUser(userId);
  });
