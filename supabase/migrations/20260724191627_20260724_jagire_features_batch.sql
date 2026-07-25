/*
# Jagire Feature Batch Migration

## Changes

### 1. contact_messages table
New table to store contact form submissions from the public /contact page.
Fields: id, name, email, message, created_at.
Public insert allowed, admin-only select.

### 2. career_coach_sessions table
Stores AI Career Coach conversation history per user.
Fields: id, user_id, messages (jsonb array), created_at, updated_at.
Owner-scoped RLS.

### 3. profiles - ai_profile_data column
Stores the auto-extracted profile data from resume scan (name, skills, experience, education, certifications, bio, job_title). jsonb nullable.

### 4. jobs - salary_currency default NPR
Change default salary_currency to 'NPR' for all new jobs.

### 5. support_tickets - notified_at column
Tracks when an admin email notification was sent for a ticket.

### 6. user_roles - admin DELETE policy
Admins need to be able to delete user_roles rows when removing users.
*/

-- ── 1. contact_messages ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_contact" ON contact_messages;
CREATE POLICY "anon_insert_contact" ON contact_messages FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_select_contact" ON contact_messages;
CREATE POLICY "admin_select_contact" ON contact_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "admin_delete_contact" ON contact_messages;
CREATE POLICY "admin_delete_contact" ON contact_messages FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- ── 2. career_coach_sessions ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS career_coach_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE career_coach_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_coach" ON career_coach_sessions;
CREATE POLICY "select_own_coach" ON career_coach_sessions FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_coach" ON career_coach_sessions;
CREATE POLICY "insert_own_coach" ON career_coach_sessions FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_coach" ON career_coach_sessions;
CREATE POLICY "update_own_coach" ON career_coach_sessions FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_coach" ON career_coach_sessions;
CREATE POLICY "delete_own_coach" ON career_coach_sessions FOR DELETE
TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_coach_user ON career_coach_sessions(user_id);

-- ── 3. profiles - ai_profile_data column ────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_profile_data jsonb;

-- ── 4. jobs - default salary_currency NPR ────────────────────────────────────
ALTER TABLE jobs ALTER COLUMN salary_currency SET DEFAULT 'NPR';

-- ── 5. support_tickets - notified_at column ──────────────────────────────────
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS notified_at timestamptz;

-- ── 6. Admin RLS: delete user_roles (needed for user deletion flow) ───────────
DROP POLICY IF EXISTS "admin_delete_user_roles" ON user_roles;
CREATE POLICY "admin_delete_user_roles" ON user_roles FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur2
    WHERE ur2.user_id = auth.uid()
    AND ur2.role = 'admin'
  )
);

-- ── 7. Admin RLS: update user_roles (role change) ────────────────────────────
DROP POLICY IF EXISTS "admin_update_user_roles" ON user_roles;
CREATE POLICY "admin_update_user_roles" ON user_roles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur2
    WHERE ur2.user_id = auth.uid()
    AND ur2.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur2
    WHERE ur2.user_id = auth.uid()
    AND ur2.role = 'admin'
  )
);

-- ── 8. Admin RLS: admin can delete any company ───────────────────────────────
DROP POLICY IF EXISTS "admin_delete_companies" ON companies;
CREATE POLICY "admin_delete_companies" ON companies FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- ── 9. Admin RLS: admin can read all profiles ────────────────────────────────
DROP POLICY IF EXISTS "admin_select_profiles" ON profiles;
CREATE POLICY "admin_select_profiles" ON profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);
