import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface SubscriptionStatus {
  isPremium: boolean;
  plan_type?: string;
  status?: string;
  payment_status?: string;
  started_at?: string | null;
  expires_at?: string | null;
  amount?: number | null;
  currency?: string | null;
  transaction_id?: string | null;
  esewa_ref_id?: string | null;
  daysRemaining?: number | null;
}

export function useSubscription() {
  const { user } = useAuth();
  return useQuery<SubscriptionStatus>({
    queryKey: ["subscription", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select(
          "status, payment_status, plan_type, started_at, expires_at, amount, currency, transaction_id, esewa_ref_id",
        )
        .eq("user_id", user!.id)
        .maybeSingle();

      const isPremium =
        data?.status === "active" &&
        data?.payment_status === "paid" &&
        (!data?.expires_at || new Date(data.expires_at).getTime() > Date.now());

      let daysRemaining: number | null = null;
      if (data?.expires_at) {
        const ms = new Date(data.expires_at).getTime() - Date.now();
        daysRemaining = ms > 0 ? Math.ceil(ms / (1000 * 60 * 60 * 24)) : 0;
      }

      return {
        isPremium,
        plan_type: data?.plan_type,
        status: data?.status,
        payment_status: data?.payment_status,
        started_at: data?.started_at,
        expires_at: data?.expires_at,
        amount: data?.amount,
        currency: data?.currency,
        transaction_id: data?.transaction_id,
        esewa_ref_id: data?.esewa_ref_id,
        daysRemaining,
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
};

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
