import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface SubscriptionStatus {
  isPremium: boolean;
  plan_type?: string;
  expires_at?: string | null;
  status?: string;
  payment_status?: string;
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
        .select("status, payment_status, plan_type, expires_at")
        .eq("user_id", user!.id)
        .maybeSingle();

      const isPremium =
        data?.status === "active" &&
        data?.payment_status === "paid" &&
        (!data?.expires_at || new Date(data.expires_at).getTime() > Date.now());

      return {
        isPremium,
        plan_type: data?.plan_type,
        expires_at: data?.expires_at,
        status: data?.status,
        payment_status: data?.payment_status,
      };
    },
  });
}
