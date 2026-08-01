/*
# Security Fixes — RLS, Search Paths, and Policy Hardening

## Purpose
Fixes critical security findings from Supabase's security advisor:
1. RLS disabled on career_coach_sessions — Enable RLS + add owner-scoped policies
2. RLS enabled but no policy on chat_participants — Add owner-scoped policies
3. RLS enabled but no policy on jagire — Add minimal read policy
4. Function search_path mutable — Set search_path = public on all user-defined functions
5. RLS policy always true on badges — Restrict write to admin only
6. RLS policy always true on learning_items — Restrict write to admin only
*/

-- ── career_coach_sessions: Enable RLS + add policies ────────────────────────────

ALTER TABLE career_coach_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_coach_sessions" ON career_coach_sessions;
CREATE POLICY "select_own_coach_sessions" ON career_coach_sessions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_coach_sessions" ON career_coach_sessions;
CREATE POLICY "insert_own_coach_sessions" ON career_coach_sessions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_coach_sessions" ON career_coach_sessions;
CREATE POLICY "update_own_coach_sessions" ON career_coach_sessions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_coach_sessions" ON career_coach_sessions;
CREATE POLICY "delete_own_coach_sessions" ON career_coach_sessions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── chat_participants: Add owner-scoped policies ──────────────────────────────

DROP POLICY IF EXISTS "select_own_chat_participation" ON chat_participants;
CREATE POLICY "select_own_chat_participation" ON chat_participants
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_chat_participation" ON chat_participants;
CREATE POLICY "insert_own_chat_participation" ON chat_participants
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_chat_participation" ON chat_participants;
CREATE POLICY "delete_own_chat_participation" ON chat_participants
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── jagire: Add minimal read policy ──────────────────────────────────────────────

DROP POLICY IF EXISTS "read_jagire" ON jagire;
CREATE POLICY "read_jagire" ON jagire
  FOR SELECT TO authenticated USING (true);

-- ── badges: Restrict write to admin only ──────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated users can delete badges" ON badges;
CREATE POLICY "admin_delete_badges" ON badges
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

DROP POLICY IF EXISTS "Authenticated users can insert badges" ON badges;
CREATE POLICY "admin_insert_badges" ON badges
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

DROP POLICY IF EXISTS "Authenticated users can update badges" ON badges;
CREATE POLICY "admin_update_badges" ON badges
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- ── learning_items: Restrict write to admin only ───────────────────────────────────

DROP POLICY IF EXISTS "Authenticated users can delete learning items" ON learning_items;
CREATE POLICY "admin_delete_learning_items" ON learning_items
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

DROP POLICY IF EXISTS "Authenticated users can insert learning items" ON learning_items;
CREATE POLICY "admin_insert_learning_items" ON learning_items
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

DROP POLICY IF EXISTS "Authenticated users can update learning items" ON learning_items;
CREATE POLICY "admin_update_learning_items" ON learning_items
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- ── Fix function search_path for all user-defined functions ──────────────────────

ALTER FUNCTION calculate_profile_completion(p_user_id uuid) SET search_path = public;
ALTER FUNCTION create_notification(_user_id uuid, _type text, _title text, _message text, _link text, _metadata jsonb) SET search_path = public;
ALTER FUNCTION get_assessment_questions(_assessment_id uuid) SET search_path = public;
ALTER FUNCTION get_or_create_chat(_user_a uuid, _user_b uuid) SET search_path = public;
ALTER FUNCTION get_user_role(_user_id uuid) SET search_path = public;
ALTER FUNCTION handle_new_user() SET search_path = public;
ALTER FUNCTION has_role(_role app_role) SET search_path = public;
ALTER FUNCTION has_role(_user_id uuid, _role app_role) SET search_path = public;
ALTER FUNCTION is_premium() SET search_path = public;
ALTER FUNCTION log_audit_entry(p_company_id uuid, p_user_id uuid, p_action text, p_entity_type text, p_entity_id uuid, p_metadata jsonb, p_ip_address text) SET search_path = public;
ALTER FUNCTION notify_admins_contact_message() SET search_path = public;
ALTER FUNCTION notify_ticket_owner_reply() SET search_path = public;
ALTER FUNCTION prevent_self_job_application() SET search_path = public;
ALTER FUNCTION search_knowledge_base_text(search_query text, match_company_id uuid, match_limit integer) SET search_path = public;
ALTER FUNCTION set_updated_at() SET search_path = public;
ALTER FUNCTION submit_assessment(_assessment_id uuid, _answers jsonb) SET search_path = public;
ALTER FUNCTION sync_application_seeker_id() SET search_path = public;
ALTER FUNCTION touch_conversation_updated_at() SET search_path = public;
ALTER FUNCTION touch_updated_at() SET search_path = public;
ALTER FUNCTION trigger_set_department_updated_at() SET search_path = public;
ALTER FUNCTION trigger_set_kb_doc_updated_at() SET search_path = public;
ALTER FUNCTION update_application_status(_application_id uuid, _new_status application_status, _actor_id uuid, _note text) SET search_path = public;
ALTER FUNCTION update_blog_comments_count() SET search_path = public;
ALTER FUNCTION update_blog_likes_count() SET search_path = public;
ALTER FUNCTION update_comment_counters() SET search_path = public;
ALTER FUNCTION update_comment_likes_count() SET search_path = public;
ALTER FUNCTION update_company_rating() SET search_path = public;
ALTER FUNCTION update_post_comments_count() SET search_path = public;
ALTER FUNCTION update_post_counters() SET search_path = public;
ALTER FUNCTION update_post_likes_count() SET search_path = public;
ALTER FUNCTION update_updated_at() SET search_path = public;
