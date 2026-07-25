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

/**
 * Reads the current user's subscription status from the `subscriptions`
 * table. RLS guarantees only the owner row is visible, so this is safe.
 */
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
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

export const PLAN_BENEFITS: Record<string, string[]> = {
  starter: [
    "3 active job posts",
    "AI candidate ranking",
    "Applicant management",
    "Email support",
  ],
  pro: [
    "10 active job posts",
    "Priority AI matching",
    "Interview scheduling",
    "Priority support",
    "AI career tools unlocked",
  ],
  enterprise: [
    "Unlimited job posts",
    "Priority AI matching",
    "Google Meet integration",
    "Dedicated support",
    "All AI features unlocked",
  ],
  free: [
    "Unlimited job search",
    "5 applications/day",
    "Basic career tips",
  ],
};
