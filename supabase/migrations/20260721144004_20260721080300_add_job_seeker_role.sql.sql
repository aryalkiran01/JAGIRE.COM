-- Add job_seeker to app_role enum (code uses 'job_seeker', DB only had 'seeker')
DO $$ BEGIN
  ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'job_seeker';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
