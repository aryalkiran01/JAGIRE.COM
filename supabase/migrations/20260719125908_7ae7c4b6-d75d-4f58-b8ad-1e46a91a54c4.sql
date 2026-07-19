
-- Storage RLS policies for resumes (private, owner-only), avatars, company-logos, posts

-- RESUMES: owner-scoped, employers who received the application can also read
CREATE POLICY "resumes_owner_all"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "resumes_employer_read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'resumes' AND EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.jobs j ON j.id = a.job_id
    JOIN public.companies c ON c.id = j.company_id
    JOIN public.resumes r ON r.id = a.resume_id
    WHERE r.file_path = storage.objects.name AND c.owner_id = auth.uid()
  )
);

-- AVATARS: public read, owner write
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');
CREATE POLICY "avatars_owner_write" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars_owner_update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars_owner_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- COMPANY LOGOS: public read, company owner write
CREATE POLICY "logos_public_read" ON storage.objects FOR SELECT TO public
USING (bucket_id = 'company-logos');
CREATE POLICY "logos_owner_all" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'company-logos' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'company-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- POSTS: public read, owner write
CREATE POLICY "posts_public_read" ON storage.objects FOR SELECT TO public
USING (bucket_id = 'posts');
CREATE POLICY "posts_owner_all" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'posts' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'posts' AND (storage.foldername(name))[1] = auth.uid()::text);
