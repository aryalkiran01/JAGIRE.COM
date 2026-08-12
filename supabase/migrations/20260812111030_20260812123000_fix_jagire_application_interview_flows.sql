ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS rejection_remark text;
CREATE INDEX IF NOT EXISTS applications_job_id_idx ON public.applications (job_id);
CREATE INDEX IF NOT EXISTS applications_applicant_id_idx ON public.applications (applicant_id);
CREATE INDEX IF NOT EXISTS interviews_employer_id_scheduled_at_idx ON public.interviews (employer_id, scheduled_at);
CREATE INDEX IF NOT EXISTS interviews_candidate_id_scheduled_at_idx ON public.interviews (candidate_id, scheduled_at);

CREATE OR REPLACE FUNCTION public.sync_job_application_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.jobs SET applications_count = (SELECT count(*) FROM public.applications WHERE job_id = NEW.job_id), updated_at = now() WHERE id = NEW.job_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.jobs SET applications_count = (SELECT count(*) FROM public.applications WHERE job_id = OLD.job_id), updated_at = now() WHERE id = OLD.job_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' AND NEW.job_id IS DISTINCT FROM OLD.job_id THEN
    UPDATE public.jobs SET applications_count = (SELECT count(*) FROM public.applications WHERE job_id = OLD.job_id), updated_at = now() WHERE id = OLD.job_id;
    UPDATE public.jobs SET applications_count = (SELECT count(*) FROM public.applications WHERE job_id = NEW.job_id), updated_at = now() WHERE id = NEW.job_id;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS applications_sync_job_count ON public.applications;
CREATE TRIGGER applications_sync_job_count AFTER INSERT OR UPDATE OF job_id OR DELETE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.sync_job_application_count();
UPDATE public.jobs j SET applications_count = (SELECT count(*) FROM public.applications a WHERE a.job_id = j.id), updated_at = now();

DROP FUNCTION IF EXISTS public.create_notification(uuid, text, text, text, text, jsonb);
CREATE FUNCTION public.create_notification(p_user_id uuid, p_type text, p_title text, p_message text, p_link text DEFAULT NULL, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, is_read, link, metadata)
  VALUES (p_user_id, p_type, p_title, p_message, false, p_link, COALESCE(p_metadata, '{}'::jsonb))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text, jsonb) TO service_role;