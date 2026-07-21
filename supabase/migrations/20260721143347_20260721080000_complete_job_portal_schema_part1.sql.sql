/*
# Complete Job Portal Schema - Part 1: Enums, New Tables, Columns

## Overview
Adds missing enum values, creates new tables, and adds missing columns to existing tables.

## New Tables
- app_user_connections: OAuth tokens for external services
- interview_events: Interview scheduling events with Google Meet
- meetings: Formal meeting/interview records
- post_reports: Reports against community posts

## Enum Changes
- application_status: + reviewing, interview_scheduled, interview_completed, offer, withdrawn
- job_status: + paused
- experience_level: + junior, executive
- job_type: + freelance

## Column Additions
- interviews: employer_id, candidate_id, candidate_email, title, message, accepted_at, declined_at, google_event_id, meet_link, updated_at
- notifications: link, metadata
- applications: applicant_id, status_text, applied_at, employer_notes
- jobs: slug, category_id, application_deadline, responsibilities, benefits, salary_currency
- blogs: published_at, author_id
- assessments: updated_at
- assessment_attempts: user_id, assessment_id
*/

-- ============================================================
-- 1. ENUM ADDITIONS
-- ============================================================

DO $$ BEGIN
  ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'reviewing';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'interview_scheduled';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'interview_completed';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'offer';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'withdrawn';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'paused';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE experience_level ADD VALUE IF NOT EXISTS 'junior';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE experience_level ADD VALUE IF NOT EXISTS 'executive';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE job_type ADD VALUE IF NOT EXISTS 'freelance';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. NEW TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS app_user_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);

CREATE TABLE IF NOT EXISTS interview_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  employer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  candidate_email text,
  title text NOT NULL DEFAULT 'Interview',
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  meet_link text,
  google_event_id text,
  message text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  candidate_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Interview',
  description text,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer DEFAULT 60,
  meeting_url text,
  google_event_id text,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS post_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(post_id, reporter_id)
);

-- ============================================================
-- 3. ADD MISSING COLUMNS
-- ============================================================

ALTER TABLE interviews ADD COLUMN IF NOT EXISTS employer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS candidate_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS candidate_email text;
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS title text DEFAULT 'Interview';
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS accepted_at timestamptz;
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS declined_at timestamptz;
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS google_event_id text;
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS meet_link text;
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link text;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

ALTER TABLE applications ADD COLUMN IF NOT EXISTS applicant_id uuid;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS status_text text;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS applied_at timestamptz DEFAULT now();
ALTER TABLE applications ADD COLUMN IF NOT EXISTS employer_notes text;

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS category_id uuid;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS application_deadline timestamptz;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS responsibilities text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS benefits text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_currency text DEFAULT 'USD';

ALTER TABLE blogs ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS author_id uuid;

ALTER TABLE assessments ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE assessment_attempts ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE assessment_attempts ADD COLUMN IF NOT EXISTS assessment_id uuid REFERENCES assessments(id) ON DELETE CASCADE;

ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ============================================================
-- 4. FOREIGN KEYS
-- ============================================================

DO $$ BEGIN
  ALTER TABLE applications ADD CONSTRAINT applications_applicant_id_fkey
    FOREIGN KEY (applicant_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE applications ADD CONSTRAINT applications_job_id_fkey
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE interviews ADD CONSTRAINT interviews_application_id_fkey
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 5. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_seeker_id ON applications(seeker_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant_id ON applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_by ON jobs(posted_by);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_slug ON jobs(slug);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_saves_user_id ON post_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_chats_user_a ON chats(user_a);
CREATE INDEX IF NOT EXISTS idx_chats_user_b ON chats(user_b);
CREATE INDEX IF NOT EXISTS idx_interviews_application_id ON interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_interview_events_application_id ON interview_events(application_id);
CREATE INDEX IF NOT EXISTS idx_meetings_application_id ON meetings(application_id);
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_published ON blogs(published);
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_user_id ON assessment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_assessment_id ON assessment_attempts(assessment_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_app_user_connections_user_id ON app_user_connections(user_id);
