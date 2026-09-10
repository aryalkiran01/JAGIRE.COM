-- Migration: 20260910173000_create_user_career_intelligence.sql
-- Description: Create persistent User Career Intelligence and Versioned Career Snapshots tables with strict RLS

-- 1. Active User Career Intelligence Table (1:1 with user)
CREATE TABLE IF NOT EXISTS public.user_career_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  career_readiness_score INT DEFAULT 0,
  ats_score INT,
  profile_completeness INT DEFAULT 0,
  candidate_name TEXT,
  headline TEXT,
  current_position TEXT,
  experience_years NUMERIC(4,1) DEFAULT 0,
  location TEXT,
  skills JSONB DEFAULT '[]'::jsonb,
  projects JSONB DEFAULT '[]'::jsonb,
  experience JSONB DEFAULT '[]'::jsonb,
  education JSONB DEFAULT '[]'::jsonb,
  github_data JSONB DEFAULT '{}'::jsonb,
  linkedin_data JSONB DEFAULT '{}'::jsonb,
  resume_summary JSONB DEFAULT '{}'::jsonb,
  application_stats JSONB DEFAULT '{}'::jsonb,
  ai_career_roadmap JSONB DEFAULT '{}'::jsonb,
  ai_recommendations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_career_intelligence_user_id_unique UNIQUE (user_id)
);

-- 2. Versioned Career Intelligence Snapshots Table (1:Many for historical tracking)
CREATE TABLE IF NOT EXISTS public.career_intelligence_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  snapshot_type TEXT NOT NULL DEFAULT 'FULL_SYNC',
  career_readiness_score INT DEFAULT 0,
  ats_score INT,
  profile_completeness INT DEFAULT 0,
  candidate_name TEXT,
  headline TEXT,
  skills JSONB DEFAULT '[]'::jsonb,
  projects JSONB DEFAULT '[]'::jsonb,
  experience JSONB DEFAULT '[]'::jsonb,
  education JSONB DEFAULT '[]'::jsonb,
  github_data JSONB DEFAULT '{}'::jsonb,
  linkedin_data JSONB DEFAULT '{}'::jsonb,
  resume_summary JSONB DEFAULT '{}'::jsonb,
  application_stats JSONB DEFAULT '{}'::jsonb,
  ai_career_roadmap JSONB DEFAULT '{}'::jsonb,
  ai_recommendations JSONB DEFAULT '[]'::jsonb,
  score_change INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performant lookup
CREATE INDEX IF NOT EXISTS idx_user_career_intelligence_user_id ON public.user_career_intelligence(user_id);
CREATE INDEX IF NOT EXISTS idx_career_intelligence_snapshots_user_id ON public.career_intelligence_snapshots(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_career_intelligence_snapshots_version ON public.career_intelligence_snapshots(user_id, version DESC);

-- Enable RLS
ALTER TABLE public.user_career_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_intelligence_snapshots ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies for user_career_intelligence ──

DROP POLICY IF EXISTS "Users can view own career intelligence" ON public.user_career_intelligence;
CREATE POLICY "Users can view own career intelligence"
  ON public.user_career_intelligence
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own career intelligence" ON public.user_career_intelligence;
CREATE POLICY "Users can insert own career intelligence"
  ON public.user_career_intelligence
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own career intelligence" ON public.user_career_intelligence;
CREATE POLICY "Users can update own career intelligence"
  ON public.user_career_intelligence
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all user career intelligence" ON public.user_career_intelligence;
CREATE POLICY "Admins can view all user career intelligence"
  ON public.user_career_intelligence
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── RLS Policies for career_intelligence_snapshots ──

DROP POLICY IF EXISTS "Users can view own career snapshots" ON public.career_intelligence_snapshots;
CREATE POLICY "Users can view own career snapshots"
  ON public.career_intelligence_snapshots
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own career snapshots" ON public.career_intelligence_snapshots;
CREATE POLICY "Users can insert own career snapshots"
  ON public.career_intelligence_snapshots
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all career snapshots" ON public.career_intelligence_snapshots;
CREATE POLICY "Admins can view all career snapshots"
  ON public.career_intelligence_snapshots
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
