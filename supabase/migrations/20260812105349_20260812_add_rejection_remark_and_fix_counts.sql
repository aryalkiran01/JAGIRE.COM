-- Add rejection_remark column to applications
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS rejection_remark text;

-- Dedup index on notifications (same user, type, metadata while unread)
CREATE UNIQUE INDEX IF NOT EXISTS notifications_dedup_idx
  ON notifications (user_id, type, md5(coalesce(metadata::text, '')))
  WHERE read = false;

-- Fix applications_count: recompute function + triggers
CREATE OR REPLACE FUNCTION recompute_job_applications_count(job_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE jobs
  SET applications_count = (
    SELECT count(*) FROM applications WHERE job_id = job_uuid
  )
  WHERE id = job_uuid;
END;
$$;

CREATE OR REPLACE FUNCTION update_applications_count_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    PERFORM recompute_job_applications_count(NEW.job_id);
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    PERFORM recompute_job_applications_count(OLD.job_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS applications_count_insert ON applications;
DROP TRIGGER IF EXISTS applications_count_delete ON applications;
CREATE TRIGGER applications_count_insert
  AFTER INSERT ON applications
  FOR EACH ROW EXECUTE FUNCTION update_applications_count_trigger();
CREATE TRIGGER applications_count_delete
  AFTER DELETE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_applications_count_trigger();

-- Backfill existing counts
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM jobs LOOP
    PERFORM recompute_job_applications_count(r.id);
  END LOOP;
END;
$$;

-- Allow admins to delete any job
DROP POLICY IF EXISTS admin_delete_jobs ON jobs;
CREATE POLICY admin_delete_jobs ON jobs
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );
