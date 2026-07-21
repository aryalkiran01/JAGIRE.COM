/*
# Complete Job Portal Schema - Part 3: RPC Functions and Triggers

## Overview
Creates all RPC functions needed by the application and adds missing triggers.

## Functions
- get_user_role(uuid): returns app_role for a user
- has_role(uuid, app_role): checks if user has a role
- submit_assessment(uuid, jsonb): validates answers, computes score, records attempt
- get_assessment_questions(uuid): returns questions without correct answers
- create_notification(uuid, text, text, text, text, jsonb): inserts a notification
- get_or_create_chat(uuid, uuid): returns existing or new chat between two users
- update_application_status(uuid, application_status, uuid, text): updates status + creates event + notification

## Triggers
- interviews_updated_at: auto-update updated_at on interviews table
*/

-- get_user_role
CREATE OR REPLACE FUNCTION get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM user_roles WHERE user_id = _user_id LIMIT 1;
$$;

-- has_role (redefine with correct signature for existing callers)
CREATE OR REPLACE FUNCTION has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Keep old signature working too (for code that calls has_role('admin'::app_role) with single arg)
CREATE OR REPLACE FUNCTION has_role(_role app_role)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = _role);
$$;

-- submit_assessment
CREATE OR REPLACE FUNCTION submit_assessment(_assessment_id uuid, _answers jsonb)
RETURNS TABLE (passed boolean, score integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assessment RECORD;
  v_questions jsonb;
  v_correct_count integer := 0;
  v_total_count integer := 0;
  v_score integer;
  v_passed boolean;
  v_user_id uuid := auth.uid();
BEGIN
  SELECT * INTO v_assessment FROM assessments WHERE id = _assessment_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assessment not found';
  END IF;

  v_questions := v_assessment.questions;
  v_total_count := jsonb_array_length(v_questions);

  SELECT count(*) INTO v_correct_count
  FROM generate_series(0, GREATEST(v_total_count - 1, 0)) AS i,
       jsonb_array_elements(v_questions) WITH ORDINALITY AS q(question, idx)
  WHERE i = idx - 1
    AND (_answers -> i::text ->> 'answer') = (q.question ->> 'correct_answer');

  v_score := CASE WHEN v_total_count > 0 THEN round((v_correct_count::numeric / v_total_count) * 100) ELSE 0 END;
  v_passed := v_score >= COALESCE(v_assessment.passing_score, 70);

  INSERT INTO assessment_attempts (user_id, assessment_id, answers, score, passed)
  VALUES (v_user_id, _assessment_id, _answers, v_score, v_passed);

  RETURN QUERY SELECT v_passed, v_score;
END;
$$;

-- get_assessment_questions
CREATE OR REPLACE FUNCTION get_assessment_questions(_assessment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_questions jsonb;
  v_sanitized jsonb;
BEGIN
  SELECT questions INTO v_questions FROM assessments WHERE id = _assessment_id;
  IF NOT FOUND THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT jsonb_agg(
    q - 'correct_answer'
  )
  INTO v_sanitized
  FROM jsonb_array_elements(v_questions) AS q;

  RETURN COALESCE(v_sanitized, '[]'::jsonb);
END;
$$;

-- create_notification
CREATE OR REPLACE FUNCTION create_notification(
  _user_id uuid,
  _type text,
  _title text,
  _message text DEFAULT NULL,
  _link text DEFAULT NULL,
  _metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  VALUES (_user_id, _type, _title, _message, _link, COALESCE(_metadata, '{}'::jsonb))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- get_or_create_chat
CREATE OR REPLACE FUNCTION get_or_create_chat(_user_a uuid, _user_b uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_chat_id uuid;
BEGIN
  SELECT id INTO v_chat_id
  FROM chats
  WHERE (user_a = _user_a AND user_b = _user_b)
     OR (user_a = _user_b AND user_b = _user_a)
  LIMIT 1;

  IF v_chat_id IS NULL THEN
    INSERT INTO chats (user_a, user_b)
    VALUES (least(_user_a, _user_b), greatest(_user_a, _user_b))
    RETURNING id INTO v_chat_id;
  END IF;

  RETURN v_chat_id;
END;
$$;

-- update_application_status
CREATE OR REPLACE FUNCTION update_application_status(
  _application_id uuid,
  _new_status application_status,
  _actor_id uuid DEFAULT NULL,
  _note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_app RECORD;
  v_event_type text;
  v_seeker_id uuid;
BEGIN
  SELECT * INTO v_app FROM applications WHERE id = _application_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found';
  END IF;

  v_seeker_id := COALESCE(v_app.seeker_id, v_app.applicant_id);

  UPDATE applications SET status = _new_status, updated_at = now() WHERE id = _application_id;

  v_event_type := CASE _new_status
    WHEN 'applied' THEN 'applied'
    WHEN 'viewed' THEN 'viewed'
    WHEN 'reviewing' THEN 'reviewing'
    WHEN 'shortlisted' THEN 'shortlisted'
    WHEN 'interview' THEN 'interview_scheduled'
    WHEN 'interview_scheduled' THEN 'interview_scheduled'
    WHEN 'interview_completed' THEN 'interview_completed'
    WHEN 'selected' THEN 'selected'
    WHEN 'rejected' THEN 'rejected'
    WHEN 'offer' THEN 'offer'
    WHEN 'withdrawn' THEN 'withdrawn'
    ELSE _new_status::text
  END;

  INSERT INTO application_events (application_id, event_type, message, actor_id)
  VALUES (_application_id, v_event_type, _note, _actor_id);

  IF v_seeker_id IS NOT NULL THEN
    PERFORM create_notification(
      v_seeker_id,
      'application',
      'Application ' || replace(v_event_type, '_', ' '),
      COALESCE(_note, 'Your application status has been updated to: ' || _new_status::text),
      '/applications'
    );
  END IF;
END;
$$;

-- Trigger for interviews updated_at
DROP TRIGGER IF EXISTS interviews_updated_at ON interviews;
CREATE TRIGGER interviews_updated_at
  BEFORE UPDATE ON interviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
