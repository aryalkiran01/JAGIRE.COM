-- Migration: Create Company Intelligence and Company Intelligence Snapshots
-- Extends the 360-degree Intelligence + Activity system to Employer accounts

-- 1. Create table for active Company Intelligence record
CREATE TABLE IF NOT EXISTS public.company_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    industry TEXT,
    size TEXT,
    location TEXT,
    website TEXT,
    hiring_readiness_score NUMERIC(5,2) DEFAULT 0.00,
    profile_completeness NUMERIC(5,2) DEFAULT 0.00,
    technologies JSONB DEFAULT '[]'::jsonb,
    benefits JSONB DEFAULT '[]'::jsonb,
    culture_highlights JSONB DEFAULT '[]'::jsonb,
    projects_services JSONB DEFAULT '[]'::jsonb,
    job_stats JSONB DEFAULT '{"total_jobs": 0, "active_jobs": 0, "closed_jobs": 0, "total_applicants": 0, "shortlisted_count": 0, "interview_count": 0}'::jsonb,
    social_links JSONB DEFAULT '{}'::jsonb,
    ai_hiring_roadmap JSONB DEFAULT '{}'::jsonb,
    ai_recommendations JSONB DEFAULT '{}'::jsonb,
    score_change INTEGER DEFAULT 0,
    version_number INTEGER DEFAULT 1,
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT company_intelligence_company_id_unique UNIQUE (company_id)
);

-- 2. Create table for Company Intelligence Snapshots (Version / History tracking)
CREATE TABLE IF NOT EXISTS public.company_intelligence_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    snapshot_type TEXT NOT NULL, -- e.g. JOB_CREATED, JOB_UPDATED, APPLICATION_REVIEWED, CANDIDATE_SHORTLISTED, INTERVIEW_SCHEDULED, AI_MATCHING, AI_SCREENING, COMPANY_PROFILE_UPDATED, MANUAL_SYNC
    hiring_readiness_score NUMERIC(5,2) DEFAULT 0.00,
    profile_completeness NUMERIC(5,2) DEFAULT 0.00,
    job_stats JSONB DEFAULT '{}'::jsonb,
    technologies JSONB DEFAULT '[]'::jsonb,
    ai_hiring_roadmap JSONB DEFAULT '{}'::jsonb,
    ai_recommendations JSONB DEFAULT '{}'::jsonb,
    score_change INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes for fast query performance
CREATE INDEX IF NOT EXISTS idx_company_intelligence_company_id ON public.company_intelligence(company_id);
CREATE INDEX IF NOT EXISTS idx_company_intelligence_employer_id ON public.company_intelligence(employer_id);
CREATE INDEX IF NOT EXISTS idx_company_snapshots_company_id ON public.company_intelligence_snapshots(company_id);
CREATE INDEX IF NOT EXISTS idx_company_snapshots_created_at ON public.company_intelligence_snapshots(created_at DESC);

-- 4. Enable Row Level Security
ALTER TABLE public.company_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_intelligence_snapshots ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for company_intelligence
CREATE POLICY "company_intelligence_select_owner_or_admin"
    ON public.company_intelligence
    FOR SELECT
    TO authenticated
    USING (
        employer_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id = company_intelligence.company_id
              AND c.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
              AND ur.role = 'admin'
        )
    );

CREATE POLICY "company_intelligence_insert_owner_or_admin"
    ON public.company_intelligence
    FOR INSERT
    TO authenticated
    WITH CHECK (
        employer_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id = company_intelligence.company_id
              AND c.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
              AND ur.role = 'admin'
        )
    );

CREATE POLICY "company_intelligence_update_owner_or_admin"
    ON public.company_intelligence
    FOR UPDATE
    TO authenticated
    USING (
        employer_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id = company_intelligence.company_id
              AND c.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
              AND ur.role = 'admin'
        )
    )
    WITH CHECK (
        employer_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id = company_intelligence.company_id
              AND c.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
              AND ur.role = 'admin'
        )
    );

CREATE POLICY "company_intelligence_delete_owner_or_admin"
    ON public.company_intelligence
    FOR DELETE
    TO authenticated
    USING (
        employer_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id = company_intelligence.company_id
              AND c.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
              AND ur.role = 'admin'
        )
    );

-- 6. RLS Policies for company_intelligence_snapshots
CREATE POLICY "company_snapshots_select_owner_or_admin"
    ON public.company_intelligence_snapshots
    FOR SELECT
    TO authenticated
    USING (
        employer_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id = company_intelligence_snapshots.company_id
              AND c.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
              AND ur.role = 'admin'
        )
    );

CREATE POLICY "company_snapshots_insert_owner_or_admin"
    ON public.company_intelligence_snapshots
    FOR INSERT
    TO authenticated
    WITH CHECK (
        employer_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id = company_intelligence_snapshots.company_id
              AND c.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
              AND ur.role = 'admin'
        )
    );
