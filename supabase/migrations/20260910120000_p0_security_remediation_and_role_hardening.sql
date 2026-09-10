/*
# P0 Security Remediation & Authorization Hardening

## Summary of Fixes:
1. P0-3: Signup Role Injection Prevention in `handle_new_user()`
   - Strict whitelist for public signup roles (`job_seeker`, `seeker`, `employer`).
   - Rejects privileged role requests (`admin`, `super_admin`, etc.) from raw_user_meta_data and defaults safely to `job_seeker`.
   - Explicitly sets `search_path = public` to prevent search path hijacking.

2. P0-2: Admin Privilege Escalation through `user_roles`
   - Drops all legacy self-insert and self-update policies on `user_roles`.
   - Enforces that normal users can only SELECT their own assigned roles.
   - All role modifications (INSERT, UPDATE, DELETE) and cross-user reads require verified `admin` role.
   - Re-enforces RLS on `user_roles`.

3. P0-1: Payment & Subscription Table Access Lock
   - Confirms that `subscriptions`, `payments`, and `payment_verifications` have RLS enabled.
   - Ensures no client-side INSERT/UPDATE policies exist for non-admins (all modifications occur through Edge Functions with service role or admin).
*/

-- ── 1. Fix handle_new_user() Signup Role Injection (P0-3) ────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.app_role;
  v_raw_role text;
  v_user_role_text text;
BEGIN
  -- Extract and sanitize the role from client metadata
  v_raw_role := LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'role', '')));

  -- Whitelist safe signup roles only. Never allow client metadata to grant 'admin'.
  IF v_raw_role IN ('job_seeker', 'seeker') THEN
    v_role := 'job_seeker'::public.app_role;
    v_user_role_text := 'job_seeker';
  ELSIF v_raw_role = 'employer' THEN
    v_role := 'employer'::public.app_role;
    v_user_role_text := 'employer';
  ELSE
    -- Safe fallback: all unrecognized or privileged roles default to job_seeker
    v_role := 'job_seeker'::public.app_role;
    v_user_role_text := 'job_seeker';
  END IF;

  -- Create user profile safely
  INSERT INTO public.profiles (id, full_name, avatar_url, user_role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    v_user_role_text
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    user_role = EXCLUDED.user_role
  WHERE profiles.user_role IS NULL;

  -- Assign the sanitized role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;


-- ── 2. Fix user_roles Privilege Escalation (P0-2) ────────────────────────────────

-- Drop any lingering or legacy self-management policies on user_roles
DROP POLICY IF EXISTS "insert_own_user_role" ON public.user_roles;
DROP POLICY IF EXISTS "update_own_user_role" ON public.user_roles;
DROP POLICY IF EXISTS "delete_own_user_role" ON public.user_roles;
DROP POLICY IF EXISTS "insert_user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "update_user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "delete_user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "select_own_user_role" ON public.user_roles;
DROP POLICY IF EXISTS "select_user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "admin_select_user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "admin_insert_user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "admin_update_user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "admin_delete_user_roles" ON public.user_roles;

-- 2a. Users can ONLY read their own roles
CREATE POLICY "select_own_user_role"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2b. Admins can view all user roles
CREATE POLICY "admin_select_user_roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2c. Only Admins can INSERT user roles
CREATE POLICY "admin_insert_user_roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2d. Only Admins can UPDATE user roles
CREATE POLICY "admin_update_user_roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2e. Only Admins can DELETE user roles
CREATE POLICY "admin_delete_user_roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Explicitly enforce RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Revoke dangerous permissions from public and anon
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon, authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;


-- ── 3. Hardening Subscriptions & Payments RLS (P0-1) ──────────────────────────────

-- Ensure any legacy client write policies on subscriptions are dropped
DROP POLICY IF EXISTS "insert_own_subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "update_own_subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "insert_subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "update_subscriptions" ON public.subscriptions;

-- Ensure any legacy client write policies on payments are dropped
DROP POLICY IF EXISTS "insert_own_payment" ON public.payments;
DROP POLICY IF EXISTS "update_own_payment" ON public.payments;
DROP POLICY IF EXISTS "insert_payments" ON public.payments;
DROP POLICY IF EXISTS "update_payments" ON public.payments;

-- Ensure payment_verifications is strictly protected
DROP POLICY IF EXISTS "select_own_verifications" ON public.payment_verifications;
CREATE POLICY "select_own_verifications"
  ON public.payment_verifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- Ensure RLS is active on all payment tables
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_verifications ENABLE ROW LEVEL SECURITY;

-- Revoke direct write permissions on payment tables from anon and normal users
REVOKE INSERT, UPDATE, DELETE ON public.subscriptions FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.payments FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.payment_verifications FROM anon, authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT SELECT ON public.payments TO authenticated;
GRANT SELECT ON public.payment_verifications TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
GRANT ALL ON public.payments TO service_role;
GRANT ALL ON public.payment_verifications TO service_role;


-- ── 4. Ensure Search Paths on Security Functions ──────────────────────────────────

ALTER FUNCTION public.has_role(public.app_role) SET search_path = public;
ALTER FUNCTION public.has_role(uuid, public.app_role) SET search_path = public;
ALTER FUNCTION public.is_premium() SET search_path = public;
