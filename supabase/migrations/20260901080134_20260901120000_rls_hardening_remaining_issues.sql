/*
# RLS Hardening — Remaining Issues

## Purpose
Completes the security hardening started in the 20260830 migrations:
1. Three SECURITY DEFINER functions still lack `search_path = public`: `is_premium`, `notify_admins_contact_message`, `notify_ticket_owner_reply`.
2. Five SECURITY DEFINER functions are executable by the `anon` role, leaking role info and allowing unauthenticated calls: `has_role`, `get_user_role`, `is_premium`, `notify_admins_contact_message`, `notify_ticket_owner_reply`.
3. `applications` UPDATE policy has no `WITH CHECK` — a user could change `applicant_id` or `job_id` to claim another user's application.
4. `saved_jobs` uses a single `FOR ALL` policy instead of per-verb policies.
5. `companies` uses a single `FOR ALL` admin policy instead of per-verb policies.

## Security Changes
- Added `SET search_path = public` to 3 SECURITY DEFINER functions.
- Revoked EXECUTE from `anon` on 5 SECURITY DEFINER functions; kept `authenticated` EXECUTE.
- Replaced `applications` UPDATE policy with one that has `WITH CHECK` matching the `USING` predicate.
- Split `saved_jobs` `FOR ALL` into 4 per-verb policies (SELECT, INSERT, UPDATE, DELETE).
- Split `companies` admin `FOR ALL` into 4 per-verb policies (SELECT, INSERT, UPDATE, DELETE).

## Important Notes
1. All policy drops use `IF EXISTS` for idempotency.
2. No data is modified or deleted — only policy and function definition changes.
3. The `companies` SELECT policy is scoped to `authenticated` (not `anon`) since the app requires sign-in.
4. The `saved_jobs` policies are owner-scoped via `auth.uid() = user_id`.
5. The `companies` admin policies use `public.has_role(auth.uid(), 'admin'::app_role)`.
*/

-- ── 1. Fix search_path on remaining SECURITY DEFINER functions ──────────────────

ALTER FUNCTION public.is_premium() SET search_path = public;
ALTER FUNCTION public.notify_admins_contact_message() SET search_path = public;
ALTER FUNCTION public.notify_ticket_owner_reply() SET search_path = public;

-- ── 2. Revoke anon EXECUTE on sensitive SECURITY DEFINER functions ──────────────

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_premium() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_admins_contact_message() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_ticket_owner_reply() FROM anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_premium() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_admins_contact_message() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_ticket_owner_reply() TO authenticated;

-- ── 3. applications: Add WITH CHECK to UPDATE policy ────────────────────────────

DROP POLICY IF EXISTS "Applicant or employer update" ON public.applications;

CREATE POLICY "Applicant or employer update"
  ON public.applications FOR UPDATE TO authenticated
  USING (
    (auth.uid() = applicant_id)
    OR (EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = applications.job_id AND j.posted_by = auth.uid()
    ))
    OR has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    (auth.uid() = applicant_id)
    OR (EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = applications.job_id AND j.posted_by = auth.uid()
    ))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- ── 4. saved_jobs: Split FOR ALL into per-verb policies ─────────────────────────

DROP POLICY IF EXISTS "Users manage own saved jobs" ON public.saved_jobs;

CREATE POLICY "select_own_saved_jobs"
  ON public.saved_jobs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "insert_own_saved_jobs"
  ON public.saved_jobs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_saved_jobs"
  ON public.saved_jobs FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_saved_jobs"
  ON public.saved_jobs FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ── 5. companies: Split FOR ALL into per-verb admin policies ────────────────────

DROP POLICY IF EXISTS "Admins manage companies" ON public.companies;
DROP POLICY IF EXISTS "select_companies" ON public.companies;
DROP POLICY IF EXISTS "admin_insert_companies" ON public.companies;
DROP POLICY IF EXISTS "admin_update_companies" ON public.companies;
DROP POLICY IF EXISTS "admin_delete_companies" ON public.companies;

CREATE POLICY "select_companies"
  ON public.companies FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "admin_insert_companies"
  ON public.companies FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin_update_companies"
  ON public.companies FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin_delete_companies"
  ON public.companies FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
