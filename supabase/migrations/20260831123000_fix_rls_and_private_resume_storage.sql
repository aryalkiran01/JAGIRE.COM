-- Harden production RLS for application and coaching access.
-- Ensure the resumes storage bucket remains private and only user-owned signed URLs are used.

-- Applications: applicants can access their own, employers can access job applicants, admins can do everything.
DROP POLICY IF EXISTS "Applicants view own applications" ON public.applications;
DROP POLICY IF EXISTS "Applicants create own" ON public.applications;
DROP POLICY IF EXISTS "Applicant or employer update" ON public.applications;
DROP POLICY IF EXISTS "Applicant delete own" ON public.applications;

CREATE POLICY "Applications are readable by owner, employer, or admin"
ON public.applications FOR SELECT TO authenticated
USING (
  auth.uid() = applicant_id
  OR EXISTS (
    SELECT 1
    FROM public.jobs j
    WHERE j.id = public.applications.job_id
      AND j.posted_by = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Applications can be created only by the applicant"
ON public.applications FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = applicant_id
  AND EXISTS (
    SELECT 1
    FROM public.jobs j
    WHERE j.id = public.applications.job_id
      AND j.status = 'active'
  )
);

CREATE POLICY "Applications can be updated by owner or employer"
ON public.applications FOR UPDATE TO authenticated
USING (
  auth.uid() = applicant_id
  OR EXISTS (
    SELECT 1
    FROM public.jobs j
    WHERE j.id = public.applications.job_id
      AND j.posted_by = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  auth.uid() = applicant_id
  OR EXISTS (
    SELECT 1
    FROM public.jobs j
    WHERE j.id = public.applications.job_id
      AND j.posted_by = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Applications can be deleted only by the applicant or admin"
ON public.applications FOR DELETE TO authenticated
USING (
  auth.uid() = applicant_id
  OR public.has_role(auth.uid(), 'admin')
);

-- learning_items: public read, admin write only.
DROP POLICY IF EXISTS "learn read" ON public.learning_items;
DROP POLICY IF EXISTS "learn admin write" ON public.learning_items;

CREATE POLICY "learning_items_public_select"
ON public.learning_items FOR SELECT TO authenticated
USING (true);

CREATE POLICY "learning_items_admin_all"
ON public.learning_items FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- career_coach_sessions: only the owner can read/write.
DROP POLICY IF EXISTS "select_own_coach" ON public.career_coach_sessions;
DROP POLICY IF EXISTS "insert_own_coach" ON public.career_coach_sessions;
DROP POLICY IF EXISTS "update_own_coach" ON public.career_coach_sessions;
DROP POLICY IF EXISTS "delete_own_coach" ON public.career_coach_sessions;

CREATE POLICY "career_coach_sessions_select_own"
ON public.career_coach_sessions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "career_coach_sessions_insert_own"
ON public.career_coach_sessions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "career_coach_sessions_update_own"
ON public.career_coach_sessions FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "career_coach_sessions_delete_own"
ON public.career_coach_sessions FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Storage: keep private bucket and enforce owner-only object access.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('resumes', 'resumes', false, 10485760, ARRAY['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Users upload own resume" ON storage.objects;
DROP POLICY IF EXISTS "Users read own resume" ON storage.objects;
DROP POLICY IF EXISTS "Users update own resume" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own resume" ON storage.objects;
DROP POLICY IF EXISTS "resumes_owner_all" ON storage.objects;
DROP POLICY IF EXISTS "resumes_employer_read" ON storage.objects;

CREATE POLICY "resumes_owner_all"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'resumes'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'resumes'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Public access is disabled by default; use signed URLs for any legitimate retrieval.
-- This keeps the resume bucket private in production and prevents direct public file exposure.
