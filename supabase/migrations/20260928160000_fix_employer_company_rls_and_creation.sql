/*
# Fix Employer Company Creation & Management RLS Policies

1. Fix `companies` table permissions and RLS policies:
   - Ensure authenticated users have INSERT, UPDATE, DELETE grants and anon/authenticated have SELECT.
   - Allow authenticated users who are the owner (`owner_id = auth.uid()`), or have role 'employer' or 'admin', to INSERT into `companies`.
   - Allow owners (`owner_id = auth.uid()`) and admins to UPDATE their own companies.
   - Allow owners (`owner_id = auth.uid()`) and admins to DELETE their own companies.
   - Maintain public/authenticated SELECT access.
*/

-- Grant table-level permissions to authenticated and service_role
GRANT SELECT ON public.companies TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;

-- Ensure RLS is enabled
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive or conflicting policies on companies
DROP POLICY IF EXISTS "Companies public read" ON public.companies;
DROP POLICY IF EXISTS "select_companies" ON public.companies;
DROP POLICY IF EXISTS "admin_insert_companies" ON public.companies;
DROP POLICY IF EXISTS "admin_update_companies" ON public.companies;
DROP POLICY IF EXISTS "admin_delete_companies" ON public.companies;
DROP POLICY IF EXISTS "Employers can create companies" ON public.companies;
DROP POLICY IF EXISTS "Owners can update companies" ON public.companies;
DROP POLICY IF EXISTS "Owners can delete companies" ON public.companies;
DROP POLICY IF EXISTS "Admins manage companies" ON public.companies;
DROP POLICY IF EXISTS "employers_and_admins_insert_companies" ON public.companies;
DROP POLICY IF EXISTS "owners_and_admins_update_companies" ON public.companies;
DROP POLICY IF EXISTS "owners_and_admins_delete_companies" ON public.companies;

-- Ensure owner_id defaults to authenticated user if not explicitly provided
ALTER TABLE public.companies ALTER COLUMN owner_id SET DEFAULT auth.uid();

-- 1. Public & Authenticated Read Policy (needed for job listings, public company pages, etc.)
CREATE POLICY "select_companies"
  ON public.companies
  FOR SELECT
  USING (true);

-- 2. Secure Insert Policy: Non-admins MUST have owner_id = auth.uid(); Admins can set any owner_id
CREATE POLICY "employers_and_admins_insert_companies"
  ON public.companies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = owner_id
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- 3. Owner and Admin Update Policy
CREATE POLICY "owners_and_admins_update_companies"
  ON public.companies
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = owner_id
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  WITH CHECK (
    auth.uid() = owner_id
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- 4. Owner and Admin Delete Policy
CREATE POLICY "owners_and_admins_delete_companies"
  ON public.companies
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = owner_id
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );
