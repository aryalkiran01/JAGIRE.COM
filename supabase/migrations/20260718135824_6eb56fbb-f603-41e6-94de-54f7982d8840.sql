
-- Prevent duplicate applications
CREATE UNIQUE INDEX IF NOT EXISTS applications_unique_applicant_job
  ON public.applications (applicant_id, job_id);

-- Prevent applying to your own company's jobs
CREATE OR REPLACE FUNCTION public.prevent_self_apply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
BEGIN
  SELECT c.owner_id INTO v_owner
  FROM public.jobs j
  JOIN public.companies c ON c.id = j.company_id
  WHERE j.id = NEW.job_id;
  IF v_owner = NEW.applicant_id THEN
    RAISE EXCEPTION 'You cannot apply to a job posted by your own company';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_self_apply ON public.applications;
CREATE TRIGGER trg_prevent_self_apply
BEFORE INSERT ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_apply();
