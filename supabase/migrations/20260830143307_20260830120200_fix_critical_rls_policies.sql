/*
# Fix Critical RLS Vulnerabilities

1. career_coach_sessions: "Temporary allow inserts" WITH CHECK (true) — any user can write into another user's sessions
2. learning_items: using(true)/with check(true) on INSERT/UPDATE/DELETE — any user can modify any learning item
3. user_roles: self-insert and self-update policies allow privilege escalation to admin
4. admin_users view: no security_invoker — bypasses RLS, exposes all profiles
5. profiles: "Profiles are viewable by everyone" exposes sensitive fields to public anon
6. storage posts bucket: insert without owner path check — any user can upload to any path
*/

-- ── 1. career_coach_sessions: Remove "Temporary allow inserts"
DROP POLICY IF EXISTS "Temporary allow inserts" ON public.career_coach_sessions;

-- ── 2. learning_items: Replace open policies with admin-only
DROP POLICY IF EXISTS "Allow authenticated users to delete learning_items" ON public.learning_items;
DROP POLICY IF EXISTS "Allow authenticated users to insert learning_items" ON public.learning_items;
DROP POLICY IF EXISTS "Allow authenticated users to update learning_items" ON public.learning_items;
DROP POLICY IF EXISTS "Allow authenticated users to view learning_items" ON public.learning_items;
DROP POLICY IF EXISTS "Anyone can view learning items" ON public.learning_items;

CREATE POLICY "Anyone can view learning_items"
  ON public.learning_items FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "admin_insert_learning_items"
  ON public.learning_items FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "admin_update_learning_items"
  ON public.learning_items FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "admin_delete_learning_items"
  ON public.learning_items FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ── 3. user_roles: Remove self-insert and self-update policies (privilege escalation)
DROP POLICY IF EXISTS "insert_own_user_role" ON public.user_roles;
DROP POLICY IF EXISTS "update_own_user_role" ON public.user_roles;
DROP POLICY IF EXISTS "insert_user_roles" ON public.user_roles;

CREATE POLICY "admin_insert_user_roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ── 4. admin_users view: Add security_invoker to respect RLS
CREATE OR REPLACE VIEW public.admin_users
WITH (security_invoker = true) AS
SELECT p.id, p.full_name, p.headline, p.bio, p.avatar_url, p.location,
    p.created_at, p.updated_at, p.current_position, p.experience_years,
    p.preferred_location, p.expected_salary, p.phone, p.email,
    p.website, p.github_url, p.linkedin_url, p.skills, p.languages,
    p.education, p.experience, p.projects, p.certifications,
    p.referral_code, p.banner_url, p.github_username, p.about,
    p.onboarding_completed, p.ai_profile_data, ur.role
FROM (public.profiles p
  LEFT JOIN public.user_roles ur ON (ur.user_id = p.id));

REVOKE SELECT ON public.admin_users FROM anon;
GRANT SELECT ON public.admin_users TO authenticated;

-- ── 5. profiles: Remove public read of sensitive fields
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Authenticated can view profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);

-- ── 6. storage posts bucket: Fix insert to require owner path
DROP POLICY IF EXISTS "Users can upload posts" ON storage.objects;

CREATE POLICY "Users can upload posts"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK ((bucket_id = 'posts'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]));

-- ── 7. Ensure RLS is enabled
ALTER TABLE public.career_coach_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;