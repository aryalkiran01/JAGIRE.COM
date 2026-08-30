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
    queryKey: ["subscription", user?.id, role],
    enabled: !!user,
    queryFn: async () => {
      // Admins get full access without subscription
      if (role === "admin") {
        return {
          isPremium: true,
          plan_type: "enterprise",
          plan_name: "Admin Access",
          status: "active",
          payment_status: "paid",
          daysRemaining: null,
          isActive: true,
          isExpired: false,
          isTrialing: false,
        };
      }

      const { data, error } = await supabase
        .from("subscriptions")
        .select(
          "status, payment_status, plan_type, started_at, expires_at, amount, currency, transaction_id, esewa_ref_id",
        )
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching subscription:", error);
        return {
          isPremium: false,
          isActive: false,
          isExpired: false,
          isTrialing: false,
          daysRemaining: null,
        };
      }

      // If no subscription found
      if (!data) {
        return {
          isPremium: false,
          isActive: false,
          isExpired: false,
          isTrialing: false,
          daysRemaining: null,
        };
      }

      const now = Date.now();
      const expiresAt = data?.expires_at ? new Date(data.expires_at).getTime() : null;

      // Check if subscription is active
      const isActive =
        data?.status === "active" &&
        data?.payment_status === "paid" &&
        (!expiresAt || expiresAt > now);

      // Check if subscription is expired
      const isExpired = data?.status === "active" && expiresAt !== null && expiresAt <= now;

      // Check if in trial period
      const isTrialing = data?.status === "trialing";

      // Calculate days remaining
      let daysRemaining: number | null = null;
      if (expiresAt) {
        const ms = expiresAt - now;
        daysRemaining = ms > 0 ? Math.ceil(ms / (1000 * 60 * 60 * 24)) : 0;
      }

      // Get plan name from PLAN_NAMES
      const planName = data?.plan_type ? PLAN_NAMES[data.plan_type] : undefined;

      return {
        isPremium: isActive && data?.plan_type !== "free",
        plan_type: data?.plan_type,
        plan_name: planName,
        status: data?.status,
        payment_status: data?.payment_status,
        started_at: data?.started_at,
        expires_at: data?.expires_at,
        amount: data?.amount,
        currency: data?.currency,
        transaction_id: data?.transaction_id,
        esewa_ref_id: data?.esewa_ref_id,
        daysRemaining,
        isActive,
        isExpired,
        isTrialing,
      };
    },
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    placeholderData: (previousData) => previousData,
  });
}

export const PLAN_NAMES: Record<string, string> = {
  free: "Free",
  premium: "Premium",
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
  pro: "Professional",
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
