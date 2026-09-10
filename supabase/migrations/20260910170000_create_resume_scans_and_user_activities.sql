-- ── 1. Create resume_scans Table ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.resume_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
    file_name TEXT,
    file_type TEXT,
    file_size BIGINT,
    file_path TEXT,
    source TEXT DEFAULT 'pdf_text',
    scan_status TEXT DEFAULT 'completed',
    overall_score INTEGER,
    ats_score INTEGER,
    grammar_score INTEGER,
    formatting_score INTEGER,
    keyword_score INTEGER,
    professionalism_score INTEGER,
    score_improvement INTEGER DEFAULT 0,
    candidate_name TEXT,
    parsed_data JSONB DEFAULT '{}'::jsonb,
    extracted_skills JSONB DEFAULT '[]'::jsonb,
    career_roadmap JSONB DEFAULT '{}'::jsonb,
    suggestions JSONB DEFAULT '[]'::jsonb,
    ai_model TEXT,
    ai_provider TEXT,
    duration_ms INTEGER,
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resume_scans_user_id ON public.resume_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_scans_created_at ON public.resume_scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resume_scans_ats_score ON public.resume_scans(ats_score);

-- ── 2. Create user_activities Table ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    entity_type TEXT DEFAULT 'resume_scan',
    entity_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON public.user_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON public.user_activities(activity_type);

-- ── 3. Enable RLS ────────────────────────────────────────────────────────────

ALTER TABLE public.resume_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- ── 4. RLS Policies on resume_scans ──────────────────────────────────────────

DROP POLICY IF EXISTS "select_own_resume_scans" ON public.resume_scans;
CREATE POLICY "select_own_resume_scans"
    ON public.resume_scans FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_resume_scans" ON public.resume_scans;
CREATE POLICY "insert_own_resume_scans"
    ON public.resume_scans FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_resume_scans" ON public.resume_scans;
CREATE POLICY "update_own_resume_scans"
    ON public.resume_scans FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_resume_scans" ON public.resume_scans;
CREATE POLICY "delete_own_resume_scans"
    ON public.resume_scans FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_select_resume_scans" ON public.resume_scans;
CREATE POLICY "admin_select_resume_scans"
    ON public.resume_scans FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );

-- ── 5. RLS Policies on user_activities ────────────────────────────────────────

DROP POLICY IF EXISTS "select_own_user_activities" ON public.user_activities;
CREATE POLICY "select_own_user_activities"
    ON public.user_activities FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_user_activities" ON public.user_activities;
CREATE POLICY "insert_own_user_activities"
    ON public.user_activities FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_select_user_activities" ON public.user_activities;
CREATE POLICY "admin_select_user_activities"
    ON public.user_activities FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );

-- ── 6. Grant Permissions ─────────────────────────────────────────────────────

GRANT SELECT, INSERT, UPDATE, DELETE ON public.resume_scans TO authenticated;
GRANT SELECT, INSERT ON public.user_activities TO authenticated;
GRANT ALL ON public.resume_scans TO service_role;
GRANT ALL ON public.user_activities TO service_role;
