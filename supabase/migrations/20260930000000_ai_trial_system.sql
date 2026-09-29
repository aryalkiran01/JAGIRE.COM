-- ==============================================================================
-- Migration: 3-Day Free AI Trial System for Job Seekers & Employers
-- ==============================================================================

-- 1. Add AI trial tracking fields to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ai_trial_started_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS ai_trial_expires_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS ai_trial_status text DEFAULT 'none'::text,
  ADD COLUMN IF NOT EXISTS ai_trial_used boolean DEFAULT false;

-- 2. Add check constraint for ai_trial_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_ai_trial_status_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_ai_trial_status_check
      CHECK (ai_trial_status IN ('none', 'active', 'expired'));
  END IF;
END $$;

-- 3. Add index for fast server-side entitlement checks
CREATE INDEX IF NOT EXISTS idx_profiles_ai_trial
  ON public.profiles (id, ai_trial_status, ai_trial_expires_at);

-- 4. Comment on table columns
COMMENT ON COLUMN public.profiles.ai_trial_started_at IS 'Server timestamp when the 3-day AI trial was first activated by the user';
COMMENT ON COLUMN public.profiles.ai_trial_expires_at IS 'Server timestamp when the 3-day AI trial expires (exactly 72 hours from activation)';
COMMENT ON COLUMN public.profiles.ai_trial_status IS 'Lifecycle of AI trial: none | active | expired';
COMMENT ON COLUMN public.profiles.ai_trial_used IS 'Boolean flag ensuring trial can only be claimed once per account';
