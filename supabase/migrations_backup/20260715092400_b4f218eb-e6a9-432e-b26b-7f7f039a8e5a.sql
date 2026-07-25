
-- Restrict profiles reads to authenticated users only (no anon)
REVOKE SELECT ON public.profiles FROM anon;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);

-- Prevent activity_logs forgery: users cannot set ip_address or metadata; only server (service_role) may.
REVOKE INSERT ON public.activity_logs FROM authenticated;
GRANT INSERT (user_id, action, entity_type, entity_id) ON public.activity_logs TO authenticated;
DROP POLICY IF EXISTS "Anyone can log own action" ON public.activity_logs;
CREATE POLICY "Users can log own action" ON public.activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND ip_address IS NULL AND metadata = '{}'::jsonb);
