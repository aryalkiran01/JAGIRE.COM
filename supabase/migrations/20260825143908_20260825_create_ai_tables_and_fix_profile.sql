/*
# Create AI Conversation Tables and Fix Profile Column

1. Create `ai_conversations` table — stores AI chat sessions per user
   - id, user_id (owner), title, created_at, updated_at
   - RLS enabled with owner-scoped CRUD policies
   - trigger to auto-update updated_at

2. Create `ai_messages` table — stores individual messages within conversations
   - id, conversation_id (FK to ai_conversations), role, content, created_at
   - RLS enabled with owner-scoped policies (checks via conversation ownership)

3. Create `career_coach_sessions` table — stores career coach Q&A sessions
   - id, user_id (owner), messages (jsonb), created_at, updated_at
   - RLS enabled with owner-scoped CRUD policies

4. Add `ai_profile_data` jsonb column to `profiles` — stores AI-extracted profile summary
   - Used by scanResumeFromStorage to cache AI analysis results

All statements are idempotent — safe to re-run.
*/

-- ── 1. ai_conversations ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New conversation',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_conversations" ON ai_conversations;
CREATE POLICY "select_own_conversations"
  ON ai_conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_conversations" ON ai_conversations;
CREATE POLICY "insert_own_conversations"
  ON ai_conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_conversations" ON ai_conversations;
CREATE POLICY "update_own_conversations"
  ON ai_conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_conversations" ON ai_conversations;
CREATE POLICY "delete_own_conversations"
  ON ai_conversations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for user's conversations lookup
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION touch_conversation_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ai_conversations_updated ON ai_conversations;
CREATE TRIGGER trg_ai_conversations_updated
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW
  EXECUTE FUNCTION touch_conversation_updated_at();

-- ── 2. ai_messages ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- Messages are visible/managed by the conversation owner
DROP POLICY IF EXISTS "select_own_messages" ON ai_messages;
CREATE POLICY "select_own_messages"
  ON ai_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ai_conversations
      WHERE ai_conversations.id = ai_messages.conversation_id
      AND ai_conversations.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_own_messages" ON ai_messages;
CREATE POLICY "insert_own_messages"
  ON ai_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_conversations
      WHERE ai_conversations.id = ai_messages.conversation_id
      AND ai_conversations.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_own_messages" ON ai_messages;
CREATE POLICY "delete_own_messages"
  ON ai_messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ai_conversations
      WHERE ai_conversations.id = ai_messages.conversation_id
      AND ai_conversations.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON ai_messages(conversation_id);

-- ── 3. career_coach_sessions ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS career_coach_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE career_coach_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_coach" ON career_coach_sessions;
CREATE POLICY "select_own_coach"
  ON career_coach_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_coach" ON career_coach_sessions;
CREATE POLICY "insert_own_coach"
  ON career_coach_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_coach" ON career_coach_sessions;
CREATE POLICY "update_own_coach"
  ON career_coach_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_coach" ON career_coach_sessions;
CREATE POLICY "delete_own_coach"
  ON career_coach_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_career_coach_sessions_user_id ON career_coach_sessions(user_id);

-- ── 4. Add ai_profile_data to profiles ───────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'ai_profile_data'
  ) THEN
    ALTER TABLE profiles ADD COLUMN ai_profile_data jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;
