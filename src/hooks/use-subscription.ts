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
          daysRemaining: null,
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
          (activeSub.payment_status === "paid" || activeSub.payment_status === "completed" || !activeSub.payment_status) &&
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
          };
        }
      }

      // 4. Fallback check on profiles table (which edge function updates synchronously)
      const { data: profileData } = await supabase
        .from("profiles")
        .select("subscription_status, subscription_plan, subscription_expires_at")
        .eq("id", user.id)
        .maybeSingle();

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
          };
        }
      }

      // 5. Default: No active paid subscription found
      return {
        isPremium: false,
        isActive: false,
        isExpired: false,
        isTrialing: false,
        daysRemaining: null,
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

// Helper function to get plan type from amount
export function getPlanTypeFromAmount(amount: number): string | null {
  if (amount === 499) return "premium";
  if (amount === 1999) return "starter";
  if (amount === 4999) return "professional";
  return null;
}

// Helper function to get plan details
export function getPlanDetails(planType?: string) {
  if (!planType) return null;

  return {
    type: planType,
    name: PLAN_NAMES[planType] || planType,
    isEmployer: isEmployerPlan(planType),
    isSeeker: isSeekerPlan(planType),
  };
}

// Helper function to check if user has access to specific features
export function hasFeatureAccess(
  sub: SubscriptionStatus | undefined,
  requiredPlans: string[],
): boolean {
  if (!sub?.isPremium || !sub.plan_type) return false;
  return requiredPlans.includes(sub.plan_type);
}

export const SEEKER_BENEFITS: Record<string, string[]> = {
  free: [
    "Apply to Jobs",
    "Basic Resume Builder",
    "Save Jobs",
    "Track Applications",
    "Job Alerts",
    "5 AI Credits/month",
  ],
  premium: [
    "Unlimited Job Applications",
    "Unlimited AI Resume Builder",
    "AI Resume Optimization",
    "AI Cover Letter Generator",
    "AI Interview Practice",
    "ATS Resume Score",
    "AI Career Coach",
    "AI Career Roadmap",
    "Skills Gap Analysis",
    "Salary Insights",
    "Resume Templates",
    "Portfolio Builder",
    "Application Analytics",
    "Priority Support",
  ],
};

export const EMPLOYER_BENEFITS: Record<string, string[]> = {
  starter: [
    "5 Active Job Posts",
    "Candidate Dashboard",
    "Resume Search",
    "Company Profile",
    "Email Notifications",
    "Basic Hiring Analytics",
  ],
  professional: [
    "Unlimited Job Posts",
    "Unlimited Candidates",
    "Team Collaboration",
    "Google Calendar Integration",
    "Interview Scheduling",
    "Candidate Pipeline",
    "Hiring Dashboard",
    "Resume Database",
    "Company Branding",
    "Advanced Search",
  ],
  enterprise: [
    "Unlimited Recruiters",
    "Unlimited Jobs",
    "Unlimited Candidates",
    "SSO",
    "API Access",
    "White Label",
    "Dedicated Success Manager",
    "Enterprise Security",
    "SLA",
    "Custom Integrations",
  ],
};
