
-- Rebuild assessments_catalog as SECURITY DEFINER-equivalent (no security_invoker)
DROP VIEW IF EXISTS public.assessments_catalog;
CREATE VIEW public.assessments_catalog AS
SELECT
  id, title, description, category, difficulty,
  duration_minutes, passing_score, created_at,
  COALESCE(jsonb_array_length(questions), 0) AS question_count
FROM public.assessments;
GRANT SELECT ON public.assessments_catalog TO authenticated, anon;

-- Sanitized questions (strip `correct`) for taking an assessment
CREATE OR REPLACE FUNCTION public.get_assessment_questions(_assessment_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_agg(jsonb_build_object('question', q->>'question', 'options', q->'options')),
    '[]'::jsonb
  )
  FROM public.assessments a, jsonb_array_elements(a.questions) q
  WHERE a.id = _assessment_id;
$$;
REVOKE ALL ON FUNCTION public.get_assessment_questions(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_assessment_questions(UUID) TO authenticated;

-- Server-side grading: user submits answer indices, we compute score & insert attempt
CREATE OR REPLACE FUNCTION public.submit_assessment(_assessment_id UUID, _answers JSONB)
RETURNS TABLE(score INT, passed BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_questions JSONB;
  v_passing INT;
  v_total INT;
  v_correct INT := 0;
  v_i INT;
  v_score INT;
  v_passed BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT questions, passing_score INTO v_questions, v_passing
  FROM public.assessments WHERE id = _assessment_id;
  IF v_questions IS NULL THEN RAISE EXCEPTION 'Assessment not found'; END IF;
  v_total := jsonb_array_length(v_questions);
  FOR v_i IN 0..v_total-1 LOOP
    IF (v_questions->v_i->>'correct')::INT = (_answers->>v_i)::INT THEN
      v_correct := v_correct + 1;
    END IF;
  END LOOP;
  v_score := CASE WHEN v_total = 0 THEN 0 ELSE ROUND((v_correct::NUMERIC / v_total) * 100)::INT END;
  v_passed := v_score >= COALESCE(v_passing, 70);
  INSERT INTO public.assessment_attempts(assessment_id, user_id, score, answers, passed)
  VALUES (_assessment_id, auth.uid(), v_score, _answers, v_passed);
  RETURN QUERY SELECT v_score, v_passed;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_assessment(UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_assessment(UUID, JSONB) TO authenticated;
