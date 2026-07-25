/*
# Fix blog visibility, interview workflow, and career roadmap storage

## 1. Blog visibility fix
The blog SELECT policy checks `status = 'published'` but the frontend queries `published = true`.
Some blogs have `status='draft'` but `published=true`, making them invisible.
Fix: update the public SELECT policy to check `published = true` (the boolean column the frontend uses).

## 2. Interview status constraint
Add a CHECK constraint on interviews.status to enforce valid statuses:
scheduled, confirmed, ongoing, completed, cancelled, missed, expired.

## 3. Career roadmap storage
Add a `career_roadmap` jsonb column to resumes to store the AI-generated roadmap.

## 4. Notification triggers for interviews
Add a trigger that fires when an interview is inserted/updated in the `interviews` table,
creating a notification for the candidate.
*/

-- 1. Fix blog public SELECT policy
DROP POLICY IF EXISTS "Public can view published blogs" ON public.blogs;
CREATE POLICY "Public can view published blogs"
  ON public.blogs FOR SELECT
  TO anon, authenticated
  USING (published = true);

-- 2. Interview status constraint (add only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'interviews_status_check'
  ) THEN
    ALTER TABLE public.interviews ADD CONSTRAINT interviews_status_check
      CHECK (status = ANY (ARRAY['scheduled','confirmed','ongoing','completed','cancelled','missed','expired']));
  END IF;
END $$;

-- 3. Career roadmap column on resumes
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS career_roadmap jsonb;

-- 4. Notification helper: create_notification RPC already exists.
-- Add trigger function for interview notifications
CREATE OR REPLACE FUNCTION public.notify_interview_change()
RETURNS trigger AS $$
DECLARE
  v_candidate_id uuid;
  v_employer_id uuid;
  v_title text;
  v_msg text;
  v_type text;
  v_link text;
BEGIN
  v_candidate_id := COALESCE(NEW.candidate_id, NEW.employer_id);
  v_employer_id := NEW.employer_id;
  v_title := NEW.title;

  IF TG_OP = 'INSERT' THEN
    v_type := 'interview_scheduled';
    v_msg := 'Your interview "' || COALESCE(v_title, 'Interview') || '" has been scheduled.';
    v_link := '/interviews';
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status <> NEW.status THEN
      v_type := 'interview_' || NEW.status;
      v_msg := 'Your interview "' || COALESCE(v_title, 'Interview') || '" status changed to ' || NEW.status || '.';
    ELSE
      v_type := 'interview_updated';
      v_msg := 'Your interview "' || COALESCE(v_title, 'Interview') || '" has been updated.';
    END IF;
    v_link := '/interviews';
  END IF;

  -- Notify candidate
  IF v_candidate_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, data, link, is_read)
    VALUES (v_candidate_id, v_type, COALESCE(v_title, 'Interview Update'), v_msg,
            jsonb_build_object('interview_id', NEW.id, 'application_id', NEW.application_id),
            v_link, false);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS interview_notify_insert ON public.interviews;
DROP TRIGGER IF EXISTS interview_notify_update ON public.interviews;
CREATE TRIGGER interview_notify_insert AFTER INSERT ON public.interviews
  FOR EACH ROW EXECUTE FUNCTION public.notify_interview_change();
CREATE TRIGGER interview_notify_update AFTER UPDATE ON public.interviews
  FOR EACH ROW EXECUTE FUNCTION public.notify_interview_change();

-- 5. Enable realtime for interviews table
ALTER PUBLICATION supabase_realtime ADD TABLE public.interviews;

-- 6. Index on interviews for candidate lookup
CREATE INDEX IF NOT EXISTS idx_interviews_candidate_id ON public.interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interviews_employer_id ON public.interviews(employer_id);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON public.interviews(status);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_at ON public.interviews(scheduled_at);

-- 7. Backfill: sync blogs where published=true but status != 'published'
UPDATE public.blogs SET status = 'published', published_at = COALESCE(published_at, now())
WHERE published = true AND status <> 'published';
