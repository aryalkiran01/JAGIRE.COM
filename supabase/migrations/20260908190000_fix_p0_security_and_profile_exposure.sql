/*
# Fix P0 Security Vulnerabilities & Schema Drift

1. P0-1: Subscription & Payment Payment Bypass
   - Drop any remaining client write policies on subscriptions and payments.
   - Enforce that standard authenticated users CANNOT INSERT or UPDATE subscriptions/payments directly.
   - Payments and subscriptions are modified ONLY by trusted server-side code / Edge Functions (Service Role) or Admins.

2. P0-2: Profile Data Exposure
   - Drop all open SELECT policies with USING (true) on profiles ("select_profiles", "Profiles are viewable by everyone", "Authenticated can view profiles").
   - Create strict relation-scoped SELECT policies on profiles:
     a) select_own_profile: Users can view all fields of their own profile (id = auth.uid()).
     b) select_employer_applicants: Employers can view profiles of candidates who applied to their posted jobs.
     c) select_chat_participants: Users can view profiles of users they share an active chat room with.
     d) admin_select_profiles: Admins can view all profiles.
     e) select_public_profiles: Users can view profiles marked public (profile_visibility IS NULL OR profile_visibility = 'public').

3. P0-3: Idempotent Cleanup & Schema Hardening
   - Remove duplicate policies on profiles (insert_profiles, update_profiles).
   - Ensure RLS is explicitly ENABLED on profiles, subscriptions, payments, payment_verifications.
   - Set search_path = public on all security functions.
*/

-- ── 1. Fix profiles RLS (P0-2) ────────────────────────────────────────────────

DROP POLICY IF EXISTS "select_profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "admin_select_profiles" ON public.profiles;
DROP POLICY IF EXISTS "select_employer_applicants" ON public.profiles;
DROP POLICY IF EXISTS "select_chat_participants" ON public.profiles;
DROP POLICY IF EXISTS "select_public_profiles" ON public.profiles;
DROP POLICY IF EXISTS "insert_profiles" ON public.profiles;
DROP POLICY IF EXISTS "update_profiles" ON public.profiles;

-- 1a. User views own profile
CREATE POLICY "select_own_profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 1b. Employer views candidate profiles for applications to their jobs
CREATE POLICY "select_employer_applicants"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.jobs j ON a.job_id = j.id
      WHERE a.applicant_id = profiles.id
        AND j.posted_by = auth.uid()
    )
  );

-- 1c. Users view profiles of users they share a chat with
CREATE POLICY "select_chat_participants"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chats c
      WHERE (c.user_a = auth.uid() AND c.user_b = profiles.id)
         OR (c.user_b = auth.uid() AND c.user_a = profiles.id)
    )
  );

-- 1d. Admins view all profiles
CREATE POLICY "admin_select_profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 1e. View basic public profiles (community/feed)
CREATE POLICY "select_public_profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (profile_visibility IS NULL OR profile_visibility = 'public');

-- Ensure RLS is enabled on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ── 2. Fix subscriptions & payments RLS (P0-1) ────────────────────────────────

DROP POLICY IF EXISTS "insert_own_subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "update_own_subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "insert_subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "update_subscriptions" ON public.subscriptions;

DROP POLICY IF EXISTS "insert_own_payment" ON public.payments;
DROP POLICY IF EXISTS "update_own_payment" ON public.payments;
DROP POLICY IF EXISTS "insert_payments" ON public.payments;
DROP POLICY IF EXISTS "update_payments" ON public.payments;

-- Ensure read-only policies for owner & admin exist on subscriptions
DROP POLICY IF EXISTS "select_own_subscriptions" ON public.subscriptions;
CREATE POLICY "select_own_subscriptions"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_select_subscriptions" ON public.subscriptions;
CREATE POLICY "admin_select_subscriptions"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "admin_update_subscriptions" ON public.subscriptions;
CREATE POLICY "admin_update_subscriptions"
  ON public.subscriptions
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "delete_own_subscriptions" ON public.subscriptions;
CREATE POLICY "delete_own_subscriptions"
  ON public.subscriptions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Ensure read-only policies for owner & admin exist on payments
DROP POLICY IF EXISTS "select_own_payments" ON public.payments;
CREATE POLICY "select_own_payments"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_select_payments" ON public.payments;
CREATE POLICY "admin_select_payments"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Enable RLS on payment & subscription tables
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_verifications ENABLE ROW LEVEL SECURITY;

-- ── 3. Hardening security functions search_path ────────────────────────────────

ALTER FUNCTION public.is_premium() SET search_path = public;
ALTER FUNCTION public.calculate_profile_completion(uuid) SET search_path = public;
