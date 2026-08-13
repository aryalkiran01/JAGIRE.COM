-- Issue 1: Employers must NOT be able to apply for jobs.
-- Replace the existing INSERT policy on applications to add a check
-- that the applicant does NOT have the 'employer' role.

DROP POLICY IF EXISTS "Applicants create own" ON applications;

CREATE POLICY "Applicants create own"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = applicant_id
    AND NOT has_role(auth.uid(), 'employer'::app_role)
  );
