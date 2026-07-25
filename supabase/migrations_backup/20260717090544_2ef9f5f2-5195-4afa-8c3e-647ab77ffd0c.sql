
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Employers can view applicants profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.jobs j ON j.id = a.job_id
    WHERE a.applicant_id = profiles.id
      AND j.posted_by = auth.uid()
  )
);

DROP POLICY IF EXISTS "Profile skills public read" ON public.profile_skills;

CREATE POLICY "Authenticated can read profile skills"
ON public.profile_skills FOR SELECT
TO authenticated
USING (true);
