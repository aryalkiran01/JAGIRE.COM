-- Issue 1: Employers must NOT be able to apply for jobs.
-- Remove all old INSERT policies that could bypass the role restriction.

DROP POLICY IF EXISTS "Applicants can apply" ON public.applications;
DROP POLICY IF EXISTS "Users can apply" ON public.applications;
DROP POLICY IF EXISTS "insert_own_application" ON public.applications;

-- Recreate the secure INSERT policy.

DROP POLICY IF EXISTS "Applicants create own" ON public.applications;

CREATE POLICY "Applicants create own"
ON public.applications
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = applicant_id
  AND NOT has_role(auth.uid(), 'employer'::app_role)
);