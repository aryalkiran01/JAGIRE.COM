
CREATE TABLE IF NOT EXISTS public.interview_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  employer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  candidate_email text NOT NULL,
  title text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  google_event_id text,
  meet_link text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_events TO authenticated;
GRANT ALL ON public.interview_events TO service_role;
ALTER TABLE public.interview_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Employers manage their interview events" ON public.interview_events;
CREATE POLICY "Employers manage their interview events" ON public.interview_events
  FOR ALL USING (auth.uid() = employer_id) WITH CHECK (auth.uid() = employer_id);
