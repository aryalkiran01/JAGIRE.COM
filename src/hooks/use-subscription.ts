import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface SubscriptionStatus {
  isPremium: boolean;
  plan_type?: string;
  plan_name?: string;
  status?: string;
  payment_status?: string;
  started_at?: string | null;
  expires_at?: string | null;
  amount?: number | null;
  currency?: string | null;
  transaction_id?: string | null;
  esewa_ref_id?: string | null;
  daysRemaining?: number | null;
  isActive?: boolean;
  isExpired?: boolean;
  isTrialing?: boolean;
  // 3-Day Free AI Trial state
  isTrialActive?: boolean;
  isTrialExpired?: boolean;
  trialStartedAt?: string | null;
  trialExpiresAt?: string | null;
  trialDaysRemaining?: number | null;
  trialHoursRemaining?: number | null;
  trialUsed?: boolean;
  trialStatus?: "none" | "active" | "expired";
  accessType?: "admin" | "paid" | "trial" | "none";
}

export function useSubscription() {
  const { user, role } = useAuth();

  return useQuery<SubscriptionStatus>({
    queryKey: ["subscription", user?.id],
    enabled: !!user?.id,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    queryFn: async () => {
      if (!user?.id) {
        return {
          isPremium: false,
          isActive: false,
          isExpired: false,
          isTrialing: false,
          isTrialActive: false,
          isTrialExpired: false,
          daysRemaining: null,
          accessType: "none",
        };
      }

      // 1. Admins get unrestricted full platform access without payment
      if (role === "admin") {
        return {
          isPremium: true,
          plan_type: "enterprise",
          plan_name: "Administrator / Unlimited",
          status: "active",
          payment_status: "paid",
          started_at: null,
          expires_at: null,
          daysRemaining: null,
          isActive: true,
          isExpired: false,
          isTrialing: false,
          isTrialActive: false,
          isTrialExpired: false,
          accessType: "admin",
        };
      }

      const now = Date.now();

      // 2. Query for active subscriptions first (highest priority)
      const { data: activeSub, error: activeSubError } = await supabase
        .from("subscriptions")
        .select(
          "status, payment_status, plan_type, started_at, expires_at, amount, currency, transaction_id, esewa_ref_id, created_at",
        )
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeSubError) {
        console.warn("Notice: subscriptions query error:", activeSubError.message);
      }

      if (activeSub) {
        const expiresAt = activeSub.expires_at ? new Date(activeSub.expires_at).getTime() : null;
        const isActive =
          activeSub.status === "active" &&
          (activeSub.payment_status === "paid" ||
            activeSub.payment_status === "completed" ||
            !activeSub.payment_status) &&
          (!expiresAt || expiresAt > now);

        if (isActive) {
          let daysRemaining: number | null = null;
          if (expiresAt) {
            const ms = expiresAt - now;
            daysRemaining = ms > 0 ? Math.ceil(ms / (1000 * 60 * 60 * 24)) : 0;
          }

          const isPlanPremium = activeSub.plan_type !== "free";
          const planName = activeSub.plan_type
            ? PLAN_NAMES[activeSub.plan_type] || activeSub.plan_type
            : undefined;

          return {
            isPremium: isPlanPremium,
            plan_type: activeSub.plan_type,
            plan_name: planName,
            status: activeSub.status,
            payment_status: activeSub.payment_status,
            started_at: activeSub.started_at,
            expires_at: activeSub.expires_at,
            amount: activeSub.amount,
            currency: activeSub.currency,
            transaction_id: activeSub.transaction_id,
            esewa_ref_id: activeSub.esewa_ref_id,
            daysRemaining,
            isActive: true,
            isExpired: false,
            isTrialing: false,
            isTrialActive: false,
            isTrialExpired: false,
            accessType: "paid",
          };
        }
      }

      // 3. Fallback: Query any latest subscription row
      const { data: latestSub } = await supabase
        .from("subscriptions")
        .select(
          "status, payment_status, plan_type, started_at, expires_at, amount, currency, transaction_id, esewa_ref_id, created_at",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestSub) {
        const expiresAt = latestSub.expires_at ? new Date(latestSub.expires_at).getTime() : null;
        const isActive =
          latestSub.status === "active" &&
          (latestSub.payment_status === "paid" || latestSub.payment_status === "completed") &&
          (!expiresAt || expiresAt > now);

        const isExpired = latestSub.status === "active" && expiresAt !== null && expiresAt <= now;
        const isTrialing = latestSub.status === "trialing";

        let daysRemaining: number | null = null;
        if (expiresAt) {
          const ms = expiresAt - now;
          daysRemaining = ms > 0 ? Math.ceil(ms / (1000 * 60 * 60 * 24)) : 0;
        }

        const isPlanPremium = isActive && latestSub.plan_type !== "free";
        const planName = latestSub.plan_type
          ? PLAN_NAMES[latestSub.plan_type] || latestSub.plan_type
          : undefined;

        if (isActive) {
          return {
            isPremium: isPlanPremium,
            plan_type: latestSub.plan_type,
            plan_name: planName,
            status: latestSub.status,
            payment_status: latestSub.payment_status,
            started_at: latestSub.started_at,
            expires_at: latestSub.expires_at,
            amount: latestSub.amount,
            currency: latestSub.currency,
            transaction_id: latestSub.transaction_id,
            esewa_ref_id: latestSub.esewa_ref_id,
            daysRemaining,
            isActive: true,
            isExpired: false,
            isTrialing: false,
            isTrialActive: false,
            isTrialExpired: false,
            accessType: "paid",
          };
        }
      }

      // 4. Query profiles table for active paid plan AND 3-Day Free AI Trial state
      const { data: profileData } = await supabase
        .from("profiles")
        .select(
          "subscription_status, subscription_plan, subscription_expires_at, ai_trial_started_at, ai_trial_expires_at, ai_trial_status, ai_trial_used",
        )
        .eq("id", user.id)
        .maybeSingle();

      // 4A. Profile active paid subscription
      if (profileData?.subscription_status === "active" && profileData.subscription_plan) {
        const profileExpiry = profileData.subscription_expires_at
          ? new Date(profileData.subscription_expires_at).getTime()
          : null;

        const isProfileActive = !profileExpiry || profileExpiry > now;
        if (isProfileActive) {
          let daysRemaining: number | null = null;
          if (profileExpiry) {
            const ms = profileExpiry - now;
            daysRemaining = ms > 0 ? Math.ceil(ms / (1000 * 60 * 60 * 24)) : 0;
          }

          const planName =
            PLAN_NAMES[profileData.subscription_plan] || profileData.subscription_plan;

          return {
            isPremium: profileData.subscription_plan !== "free",
            plan_type: profileData.subscription_plan,
            plan_name: planName,
            status: "active",
            payment_status: "paid",
            started_at: null,
            expires_at: profileData.subscription_expires_at,
            daysRemaining,
            isActive: true,
            isExpired: false,
            isTrialing: false,
            isTrialActive: false,
            isTrialExpired: false,
            accessType: "paid",
          };
        }
      }

      // 4B. 3-Day Free AI Trial Verification from Profile
      const trialUsed = Boolean(profileData?.ai_trial_used);
      const trialExpiresAt = profileData?.ai_trial_expires_at
        ? new Date(profileData.ai_trial_expires_at).getTime()
        : null;

      if (trialUsed && trialExpiresAt) {
        const msRemaining = trialExpiresAt - now;
        const isTrialActive = msRemaining > 0;
        const trialDaysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
        const trialHoursRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60)));

        if (isTrialActive) {
          const defaultRolePlan = role === "employer" ? "starter" : "premium";
          return {
            isPremium: true,
            isActive: true,
            plan_type: defaultRolePlan,
            plan_name: "3-Day Free AI Trial",
            status: "active",
            payment_status: "paid",
            started_at: profileData?.ai_trial_started_at ?? null,
            expires_at: profileData?.ai_trial_expires_at ?? null,
            daysRemaining: trialDaysRemaining,
            isExpired: false,
            isTrialing: true,
            isTrialActive: true,
            isTrialExpired: false,
            trialStartedAt: profileData?.ai_trial_started_at ?? null,
            trialExpiresAt: profileData?.ai_trial_expires_at ?? null,
            trialDaysRemaining,
            trialHoursRemaining,
            trialUsed: true,
            trialStatus: "active",
            accessType: "trial",
          };
        }

        // Trial has expired
        return {
          isPremium: false,
          isActive: false,
          plan_type: "free",
          plan_name: "Free (Trial Ended)",
          status: "expired",
          payment_status: "pending",
          started_at: profileData?.ai_trial_started_at ?? null,
          expires_at: profileData?.ai_trial_expires_at ?? null,
          daysRemaining: 0,
          isExpired: true,
          isTrialing: false,
          isTrialActive: false,
          isTrialExpired: true,
          trialStartedAt: profileData?.ai_trial_started_at ?? null,
          trialExpiresAt: profileData?.ai_trial_expires_at ?? null,
          trialDaysRemaining: 0,
          trialHoursRemaining: 0,
          trialUsed: true,
          trialStatus: "expired",
          accessType: "none",
        };
      }

      // 5. Default: No active subscription and trial not yet used
      return {
        isPremium: false,
        isActive: false,
        isExpired: false,
        isTrialing: false,
        isTrialActive: false,
        isTrialExpired: false,
        trialUsed: false,
        trialStatus: "none",
        trialDaysRemaining: 3,
        trialHoursRemaining: 72,
        daysRemaining: null,
        accessType: "none",
      };
    },
  });
}

export const PLAN_NAMES: Record<string, string> = {
  free: "Free",
  premium: "Premium",
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
  pro: "Professional",
  admin: "Administrator / Unlimited",
};

// Helper function to check if a plan is for employers
export function isEmployerPlan(planType?: string): boolean {
  return planType === "starter" || planType === "professional" || planType === "enterprise";
}

// Helper function to check if a plan is for job seekers
export function isSeekerPlan(planType?: string): boolean {
  return planType === "free" || planType === "premium";
}
