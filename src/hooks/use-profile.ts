/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  banner_url?: string | null;
  headline?: string | null;
  bio?: string | null;
  about?: string | null;
  phone?: string | null;
  location?: string | null;
  website?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  github_username?: string | null;
  experience_years?: number | null;
  current_position?: string | null;
  expected_salary?: number | null;
  preferred_location?: string | null;
  skills?: string[] | null;
  user_role?: string | null;
  referral_code?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: any;
}

export function useProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    staleTime: 1000 * 30, // 30s fresh
    queryFn: async (): Promise<UserProfile | null> => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error loading user profile:", error);
        return null;
      }
      return data as unknown as UserProfile;
    },
  });

  const profile = query.data;

  // Single authoritative source of truth for display name and avatar
  const displayName =
    profile?.full_name?.trim() ||
    (user?.user_metadata?.full_name as string)?.trim() ||
    user?.email?.split("@")[0] ||
    "User";

  const avatarUrl = profile?.avatar_url || (user?.user_metadata?.avatar_url as string) || null;

  return {
    ...query,
    profile,
    displayName,
    avatarUrl,
    invalidate: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  };
}
