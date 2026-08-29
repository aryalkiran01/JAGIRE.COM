


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."app_role" AS ENUM (
    'seeker',
    'employer',
    'admin',
    'job_seeker'
);


ALTER TYPE "public"."app_role" OWNER TO "postgres";


CREATE TYPE "public"."application_status" AS ENUM (
    'applied',
    'viewed',
    'shortlisted',
    'interview',
    'selected',
    'rejected',
    'reviewing',
    'interview_scheduled',
    'interview_completed',
    'offer',
    'withdrawn'
);


ALTER TYPE "public"."application_status" OWNER TO "postgres";


CREATE TYPE "public"."experience_level" AS ENUM (
    'entry',
    'mid',
    'senior',
    'lead',
    'junior',
    'executive'
);


ALTER TYPE "public"."experience_level" OWNER TO "postgres";


CREATE TYPE "public"."job_status" AS ENUM (
    'draft',
    'published',
    'closed',
    'active',
    'paused'
);


ALTER TYPE "public"."job_status" OWNER TO "postgres";


CREATE TYPE "public"."job_type" AS ENUM (
    'full_time',
    'part_time',
    'contract',
    'internship',
    'remote',
    'freelance'
);


ALTER TYPE "public"."job_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_profile_completion"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
total_fields integer := 0;
filled_fields integer := 0;
rec record;
BEGIN
SELECT * INTO rec FROM profiles WHERE id = p_user_id;
IF NOT FOUND THEN RETURN 0; END IF;
IF rec.full_name IS NOT NULL AND rec.full_name != '' THEN filled_fields := filled_fields + 1; END IF;
total_fields := total_fields + 1;
IF rec.headline IS NOT NULL AND rec.headline != '' THEN filled_fields := filled_fields + 1; END IF;
total_fields := total_fields + 1;
IF rec.current_position IS NOT NULL AND rec.current_position != '' THEN filled_fields := filled_fields + 1; END IF;
total_fields := total_fields + 1;
IF rec.location IS NOT NULL AND rec.location != '' THEN filled_fields := filled_fields + 1; END IF;
total_fields := total_fields + 1;
IF rec.bio IS NOT NULL AND rec.bio != '' THEN filled_fields := filled_fields + 1; END IF;
total_fields := total_fields + 1;
IF rec.skills::text != '[]' THEN filled_fields := filled_fields + 1; END IF;
total_fields := total_fields + 1;
IF rec.technologies::text != '[]' THEN filled_fields := filled_fields + 1; END IF;
total_fields := total_fields + 1;
IF rec.experience::text != '[]' THEN filled_fields := filled_fields + 1; END IF;
total_fields := total_fields + 1;
IF rec.education::text != '[]' THEN filled_fields := filled_fields + 1; END IF;
total_fields := total_fields + 1;
IF rec.linkedin_url IS NOT NULL AND rec.linkedin_url != '' THEN filled_fields := filled_fields + 1; END IF;
total_fields := total_fields + 1;
IF rec.phone IS NOT NULL AND rec.phone != '' THEN filled_fields := filled_fields + 1; END IF;
total_fields := total_fields + 1;
IF rec.expected_salary_usd IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
total_fields := total_fields + 1;
RETURN round((filled_fields::numeric / total_fields) * 100);
END;
$$;


ALTER FUNCTION "public"."calculate_profile_completion"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_link" "text" DEFAULT NULL::"text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE v_id uuid;
BEGIN
INSERT INTO public.notifications (user_id, type, title, message, is_read, link, metadata)
VALUES (p_user_id, p_type, p_title, p_message, false, p_link, COALESCE(p_metadata, '{}'::jsonb))
RETURNING id INTO v_id;
RETURN v_id;
END;
$$;


ALTER FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_link" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_assessment_questions"("_assessment_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."get_assessment_questions"("_assessment_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_chat"("_user_a" "uuid", "_user_b" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."get_or_create_chat"("_user_a" "uuid", "_user_b" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role"("_user_id" "uuid") RETURNS "public"."app_role"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
SELECT role FROM user_roles WHERE user_id = _user_id LIMIT 1;
$$;


ALTER FUNCTION "public"."get_user_role"("_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_comment_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  post_owner_id UUID;
  commenter_name TEXT;
BEGIN
  -- Get post owner
  SELECT author_id INTO post_owner_id 
  FROM posts WHERE id = NEW.post_id;
  
  -- Get commenter name
  SELECT full_name INTO commenter_name FROM profiles WHERE id = NEW.author_id;
  
  -- Only notify if comment is not from post owner
  IF post_owner_id IS NOT NULL AND post_owner_id != NEW.author_id THEN
    INSERT INTO notifications (user_id, type, title, message, link, data)
    VALUES (
      post_owner_id,
      'comment',
      COALESCE(commenter_name, 'Someone') || ' commented on your post',
      COALESCE(NEW.content, NEW.body, 'Check out the comment'),
      '/feed#post-' || NEW.post_id,
      jsonb_build_object(
        'post_id', NEW.post_id,
        'comment_id', NEW.id,
        'commenter_id', NEW.author_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_comment_notification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_like_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  post_owner_id UUID;
  liker_name TEXT;
BEGIN
  -- Get post owner
  SELECT author_id INTO post_owner_id 
  FROM posts WHERE id = NEW.post_id;
  
  -- Get liker name
  SELECT full_name INTO liker_name FROM profiles WHERE id = NEW.user_id;
  
  -- Only notify if like is not from post owner
  IF post_owner_id IS NOT NULL AND post_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, title, message, link, data)
    VALUES (
      post_owner_id,
      'post_like',
      COALESCE(liker_name, 'Someone') || ' liked your post',
      'Your post received a like',
      '/feed#post-' || NEW.post_id,
      jsonb_build_object(
        'post_id', NEW.post_id,
        'liker_id', NEW.user_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_like_notification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_message_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  chat_record RECORD;
  recipient_id UUID;
  sender_name TEXT;
BEGIN
  -- Get chat details
  SELECT * INTO chat_record FROM chats WHERE id = NEW.chat_id;
  
  IF chat_record.id IS NOT NULL THEN
    -- Determine recipient
    IF chat_record.user_a = NEW.sender_id THEN
      recipient_id := chat_record.user_b;
    ELSE
      recipient_id := chat_record.user_a;
    END IF;
    
    -- Get sender name
    SELECT full_name INTO sender_name FROM profiles WHERE id = NEW.sender_id;
    
    -- Only notify if recipient is not sender
    IF recipient_id IS NOT NULL AND recipient_id != NEW.sender_id THEN
      INSERT INTO notifications (user_id, type, title, message, link, data)
      VALUES (
        recipient_id,
        'message',
        'New message from ' || COALESCE(sender_name, 'Someone'),
        COALESCE(NEW.body, 'You have a new message'),
        '/messages?chat=' || NEW.chat_id,
        jsonb_build_object(
          'chat_id', NEW.chat_id,
          'sender_id', NEW.sender_id,
          'message_id', NEW.id
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_message_notification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'seeker'));
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role"("_role" "public"."app_role") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
SELECT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = _role);
$$;


ALTER FUNCTION "public"."has_role"("_role" "public"."app_role") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
SELECT EXISTS (SELECT 1 FROM user_roles WHERE user_id = _user_id AND role = _role);
$$;


ALTER FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_job_applications"("job_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE jobs
  SET applications_count = COALESCE(applications_count, 0) + 1
  WHERE id = job_id;
END;
$$;


ALTER FUNCTION "public"."increment_job_applications"("job_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_job_views"("job_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE jobs
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = job_id;
END;
$$;


ALTER FUNCTION "public"."increment_job_views"("job_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_premium"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
SELECT EXISTS (
SELECT 1 FROM subscriptions
WHERE user_id = auth.uid()
AND status = 'active'
AND payment_status = 'paid'
AND (expires_at IS NULL OR expires_at > now())
);
$$;


ALTER FUNCTION "public"."is_premium"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_audit_entry"("p_company_id" "uuid", "p_user_id" "uuid", "p_action" "text", "p_entity_type" "text" DEFAULT ''::"text", "p_entity_id" "uuid" DEFAULT NULL::"uuid", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb", "p_ip_address" "text" DEFAULT ''::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
log_id uuid;
BEGIN
INSERT INTO audit_logs (company_id, user_id, action, entity_type, entity_id, metadata, ip_address)
VALUES (p_company_id, p_user_id, p_action, p_entity_type, p_entity_id, p_metadata, p_ip_address)
RETURNING id INTO log_id;
RETURN log_id;
END;
$$;


ALTER FUNCTION "public"."log_audit_entry"("p_company_id" "uuid", "p_user_id" "uuid", "p_action" "text", "p_entity_type" "text", "p_entity_id" "uuid", "p_metadata" "jsonb", "p_ip_address" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_admins_contact_message"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
admin RECORD;
BEGIN
FOR admin IN SELECT user_id FROM user_roles WHERE role = 'admin'::app_role LOOP
INSERT INTO notifications (user_id, type, title, message, link, is_read)
VALUES (
admin.user_id,
'contact_message',
'New contact message from ' || NEW.name,
LEFT(NEW.message, 200),
'/admin',
false
);
END LOOP;
RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_admins_contact_message"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_ticket_owner_reply"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
IF NEW.admin_reply IS DISTINCT FROM OLD.admin_reply AND NEW.admin_reply IS NOT NULL AND NEW.user_id IS NOT NULL THEN
INSERT INTO notifications (user_id, type, title, message, link, is_read)
VALUES (
NEW.user_id,
'support_reply',
'Support replied to your ticket',
LEFT(NEW.subject, 200),
'/support',
false
);
END IF;
RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_ticket_owner_reply"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_self_job_application"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.jobs j
    JOIN public.companies c ON c.id = j.company_id
    WHERE j.id = NEW.job_id
      AND c.owner_id = NEW.seeker_id
  ) THEN
    RAISE EXCEPTION 'Company owners cannot apply to their own jobs.';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."prevent_self_job_application"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recompute_job_applications_count"("job_uuid" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE jobs
  SET applications_count = (
    SELECT count(*) FROM applications WHERE job_id = job_uuid
  )
  WHERE id = job_uuid;
END;
$$;


ALTER FUNCTION "public"."recompute_job_applications_count"("job_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_knowledge_base"("query_embedding" "public"."vector", "match_company_id" "uuid", "match_limit" integer DEFAULT 5) RETURNS TABLE("content" "text", "document_id" "uuid", "document_title" "text", "similarity" double precision, "chunk_index" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.content,
    kc.document_id,
    kd.title AS document_title,
    1 - (kc.embedding <=> query_embedding) AS similarity,
    kc.chunk_index
  FROM knowledge_chunks kc
  JOIN knowledge_documents kd ON kd.id = kc.document_id
  WHERE kc.company_id = match_company_id
    AND kc.embedding IS NOT NULL
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_limit;
END;
$$;


ALTER FUNCTION "public"."search_knowledge_base"("query_embedding" "public"."vector", "match_company_id" "uuid", "match_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_knowledge_base_text"("search_query" "text", "match_company_id" "uuid", "match_limit" integer DEFAULT 5) RETURNS TABLE("content" "text", "document_id" "uuid", "document_title" "text", "similarity" double precision, "chunk_index" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.content,
    kc.document_id,
    kd.title AS document_title,
    similarity(search_query, kc.content) AS similarity,
    kc.chunk_index
  FROM knowledge_chunks kc
  JOIN knowledge_documents kd ON kd.id = kc.document_id
  WHERE kc.company_id = match_company_id
    AND similarity(search_query, kc.content) > 0.1
  ORDER BY similarity(search_query, kc.content) DESC
  LIMIT match_limit;
END;
$$;


ALTER FUNCTION "public"."search_knowledge_base_text"("search_query" "text", "match_company_id" "uuid", "match_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_assessment"("_assessment_id" "uuid", "_answers" "jsonb") RETURNS TABLE("passed" boolean, "score" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."submit_assessment"("_assessment_id" "uuid", "_answers" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_application_seeker_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.seeker_id := NEW.applicant_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_application_seeker_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_job_application_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."sync_job_application_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_conversation_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
UPDATE ai_conversations SET updated_at = now() WHERE id = NEW.conversation_id;
RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."touch_conversation_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."touch_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_set_department_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_set_department_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_set_kb_doc_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_set_kb_doc_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_application_status"("_application_id" "uuid", "_new_status" "public"."application_status", "_actor_id" "uuid" DEFAULT NULL::"uuid", "_note" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."update_application_status"("_application_id" "uuid", "_new_status" "public"."application_status", "_actor_id" "uuid", "_note" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_applications_count_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."update_applications_count_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_blog_comments_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
IF (TG_OP = 'INSERT') THEN
UPDATE public.blogs SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = NEW.blog_id;
RETURN NEW;
ELSIF (TG_OP = 'DELETE') THEN
UPDATE public.blogs SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0) WHERE id = OLD.blog_id;
RETURN OLD;
END IF;
RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_blog_comments_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_blog_likes_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
IF (TG_OP = 'INSERT') THEN
UPDATE public.blogs SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.blog_id;
RETURN NEW;
ELSIF (TG_OP = 'DELETE') THEN
UPDATE public.blogs SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) WHERE id = OLD.blog_id;
RETURN OLD;
END IF;
RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_blog_likes_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_comment_counters"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
    if TG_OP = 'INSERT' then
        update public.posts
        set comments_count = coalesce(comments_count, 0) + 1
        where id = NEW.post_id;
        return NEW;
    elsif TG_OP = 'DELETE' then
        update public.posts
        set comments_count = greatest(coalesce(comments_count, 0) - 1, 0)
        where id = OLD.post_id;
        return OLD;
    end if;

    return null;
end;
$$;


ALTER FUNCTION "public"."update_comment_counters"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_comment_likes_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
IF (TG_OP = 'INSERT') THEN
UPDATE public.post_comments SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.comment_id;
RETURN NEW;
ELSIF (TG_OP = 'DELETE') THEN
UPDATE public.post_comments SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) WHERE id = OLD.comment_id;
RETURN OLD;
END IF;
RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_comment_likes_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_company_rating"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
UPDATE companies SET 
rating_avg = COALESCE((SELECT AVG(rating) FROM company_reviews WHERE company_id = COALESCE(NEW.company_id, OLD.company_id) AND is_approved = true), 0),
review_count = COALESCE((SELECT COUNT(*) FROM company_reviews WHERE company_id = COALESCE(NEW.company_id, OLD.company_id) AND is_approved = true), 0)
WHERE id = COALESCE(NEW.company_id, OLD.company_id);
RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_company_rating"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_post_comments_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
    if TG_OP = 'INSERT' then
        update public.posts
        set comments_count = coalesce(comments_count, 0) + 1
        where id = NEW.post_id;
        return NEW;
    elsif TG_OP = 'DELETE' then
        update public.posts
        set comments_count = greatest(coalesce(comments_count, 0) - 1, 0)
        where id = OLD.post_id;
        return OLD;
    end if;

    return null;
end;
$$;


ALTER FUNCTION "public"."update_post_comments_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_post_counters"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
    if TG_OP = 'INSERT' then
        update public.posts
        set likes_count = coalesce(likes_count,0) + 1
        where id = NEW.post_id;
        return NEW;
    elsif TG_OP = 'DELETE' then
        update public.posts
        set likes_count = greatest(coalesce(likes_count,0)-1,0)
        where id = OLD.post_id;
        return OLD;
    end if;

    return null;
end;
$$;


ALTER FUNCTION "public"."update_post_counters"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_post_likes_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
IF (TG_OP = 'INSERT') THEN
UPDATE public.posts SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.post_id;
RETURN NEW;
ELSIF (TG_OP = 'DELETE') THEN
UPDATE public.posts SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) WHERE id = OLD.post_id;
RETURN OLD;
END IF;
RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_post_likes_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activity_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "action" "text" NOT NULL,
    "entity_type" "text",
    "entity_id" "uuid",
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."activity_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "headline" "text",
    "bio" "text",
    "avatar_url" "text",
    "location" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_role" "text" DEFAULT 'job_seeker'::"text" NOT NULL,
    "current_position" "text",
    "years_experience" integer DEFAULT 0,
    "current_company" "text",
    "preferred_location" "text",
    "remote_preference" "text" DEFAULT 'flexible'::"text",
    "expected_salary_usd" integer,
    "phone" "text",
    "email" "text",
    "website" "text",
    "portfolio_url" "text",
    "github_url" "text",
    "linkedin_url" "text",
    "twitter_url" "text",
    "skills" "jsonb" DEFAULT '[]'::"jsonb",
    "technologies" "jsonb" DEFAULT '[]'::"jsonb",
    "languages" "jsonb" DEFAULT '[]'::"jsonb",
    "education" "jsonb" DEFAULT '[]'::"jsonb",
    "experience" "jsonb" DEFAULT '[]'::"jsonb",
    "projects" "jsonb" DEFAULT '[]'::"jsonb",
    "certifications" "jsonb" DEFAULT '[]'::"jsonb",
    "cover_letter" "text",
    "availability" "text" DEFAULT 'open'::"text",
    "notice_period" "text",
    "employment_type_preference" "text" DEFAULT 'full-time'::"text",
    "job_type_preference" "jsonb" DEFAULT '[]'::"jsonb",
    "industry_preference" "jsonb" DEFAULT '[]'::"jsonb",
    "profile_completion" integer DEFAULT 0,
    "profile_visibility" "text" DEFAULT 'public'::"text",
    "public_url" "text",
    "is_admin" boolean DEFAULT false,
    "banner_url" "text",
    "followers_count" integer DEFAULT 0,
    "following_count" integer DEFAULT 0,
    "recommendations" "jsonb" DEFAULT '[]'::"jsonb",
    "volunteer_experience" "jsonb" DEFAULT '[]'::"jsonb",
    "awards" "jsonb" DEFAULT '[]'::"jsonb",
    "interests" "jsonb" DEFAULT '[]'::"jsonb",
    "is_premium" boolean DEFAULT false,
    "premium_expires_at" timestamp with time zone,
    "linkedin_imported" boolean DEFAULT false,
    "github_username" "text",
    "referral_code" "text",
    "experience_years" integer,
    "overall_score" numeric DEFAULT 0,
    "about" "text",
    "expected_salary" integer,
    "ats_score" integer DEFAULT 0,
    "subscription_status" "text" DEFAULT 'inactive'::"text",
    "subscription_plan" "text",
    "subscription_expires_at" timestamp with time zone,
    CONSTRAINT "profiles_availability_check" CHECK (("availability" = ANY (ARRAY['open'::"text", 'looking'::"text", 'not_looking'::"text", 'hired'::"text"]))),
    CONSTRAINT "profiles_profile_visibility_check" CHECK (("profile_visibility" = ANY (ARRAY['public'::"text", 'private'::"text", 'employer_only'::"text"]))),
    CONSTRAINT "profiles_remote_preference_check" CHECK (("remote_preference" = ANY (ARRAY['remote'::"text", 'hybrid'::"text", 'onsite'::"text", 'flexible'::"text"]))),
    CONSTRAINT "profiles_user_role_check" CHECK (("user_role" = ANY (ARRAY['job_seeker'::"text", 'employer'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."app_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."admin_users" WITH ("security_invoker"='true') AS
 SELECT "p"."id",
    "p"."full_name",
    "p"."headline",
    "p"."bio",
    "p"."avatar_url",
    "p"."location",
    "p"."created_at",
    "p"."updated_at",
    "p"."user_role",
    "p"."current_position",
    "p"."years_experience",
    "p"."current_company",
    "p"."preferred_location",
    "p"."remote_preference",
    "p"."expected_salary_usd",
    "p"."phone",
    "p"."email",
    "p"."website",
    "p"."portfolio_url",
    "p"."github_url",
    "p"."linkedin_url",
    "p"."twitter_url",
    "p"."skills",
    "p"."technologies",
    "p"."languages",
    "p"."education",
    "p"."experience",
    "p"."projects",
    "p"."certifications",
    "p"."cover_letter",
    "p"."availability",
    "p"."notice_period",
    "p"."employment_type_preference",
    "p"."job_type_preference",
    "p"."industry_preference",
    "p"."profile_completion",
    "p"."profile_visibility",
    "p"."public_url",
    "p"."is_admin",
    "p"."banner_url",
    "p"."followers_count",
    "p"."following_count",
    "p"."recommendations",
    "p"."volunteer_experience",
    "p"."awards",
    "p"."interests",
    "p"."is_premium",
    "p"."premium_expires_at",
    "p"."linkedin_imported",
    "p"."github_username",
    "p"."referral_code",
    "p"."experience_years",
    "p"."overall_score",
    "p"."about",
    "p"."expected_salary",
    "p"."ats_score",
    "p"."subscription_status",
    "p"."subscription_plan",
    "p"."subscription_expires_at",
    "ur"."role"
   FROM ("public"."profiles" "p"
     LEFT JOIN "public"."user_roles" "ur" ON (("ur"."user_id" = "p"."id")));


ALTER VIEW "public"."admin_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "title" "text" DEFAULT 'New conversation'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "content" "text" DEFAULT ''::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_messages_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'assistant'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."ai_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_usage_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "task" "text" NOT NULL,
    "provider" "text",
    "model" "text",
    "latency_ms" integer,
    "success" boolean DEFAULT true,
    "error" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ai_usage_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."api_keys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "key_hash" "text" NOT NULL,
    "key_prefix" "text" NOT NULL,
    "permissions" "jsonb" DEFAULT '{}'::"jsonb",
    "last_used_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "created_by" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revoked_at" timestamp with time zone
);


ALTER TABLE "public"."api_keys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_user_connections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "provider" "text" NOT NULL,
    "access_token" "text",
    "refresh_token" "text",
    "token_expires_at" timestamp with time zone,
    "scopes" "text"[],
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."app_user_connections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."application_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "application_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "message" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."application_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid" NOT NULL,
    "seeker_id" "uuid",
    "resume_id" "uuid",
    "status" "public"."application_status" DEFAULT 'applied'::"public"."application_status" NOT NULL,
    "match_score" numeric(5,2),
    "cover_letter" "text",
    "timeline" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "match_breakdown" "jsonb",
    "applicant_id" "uuid",
    "ai_match_score" integer,
    "ai_match_data" "jsonb",
    "employer_notes" "text",
    "status_text" "text" DEFAULT 'pending'::"text",
    "applied_at" timestamp with time zone DEFAULT "now"(),
    "rejection_remark" "text"
);


ALTER TABLE "public"."applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assessment_attempts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "assessment_id" "uuid",
    "score" integer,
    "answers" "jsonb",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "passed" boolean DEFAULT false NOT NULL,
    "status" "text" DEFAULT 'completed'::"text" NOT NULL
);


ALTER TABLE "public"."assessment_attempts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assessments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text",
    "difficulty" "text",
    "duration_minutes" integer,
    "passing_score" integer,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "questions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."assessments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "action" "text" NOT NULL,
    "entity_type" "text" DEFAULT ''::"text",
    "entity_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "ip_address" "text" DEFAULT ''::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."badges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "icon" "text",
    "points" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "kind" "text"
);


ALTER TABLE "public"."badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "blog_id" "uuid" NOT NULL,
    "author_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."blog_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "blog_id" "uuid" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."blog_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blogs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "author_id" "uuid",
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "excerpt" "text",
    "content" "text" NOT NULL,
    "cover_image" "text",
    "category" "text",
    "tags" "text"[],
    "status" "text" DEFAULT 'draft'::"text",
    "views_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "cover_url" "text",
    "published" boolean DEFAULT false,
    "published_at" timestamp with time zone,
    "comments_count" integer DEFAULT 0,
    "likes_count" integer DEFAULT 0
);


ALTER TABLE "public"."blogs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookmarks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "job_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bookmarks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."career_coach_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "title" "text",
    "messages" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."career_coach_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_participants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "chat_id" "uuid",
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."chat_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "user_a" "uuid",
    "user_b" "uuid",
    "last_message_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."chats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comment_likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "comment_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."comment_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."companies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "logo_url" "text",
    "website" "text",
    "description" "text",
    "location" "text",
    "industry" "text",
    "size" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "banner_url" "text",
    "company_size" "text" DEFAULT '1-10'::"text",
    "linkedin_url" "text",
    "twitter_url" "text",
    "is_verified" boolean DEFAULT false,
    "mission" "text",
    "vision" "text",
    "culture" "jsonb" DEFAULT '[]'::"jsonb",
    "benefits" "jsonb" DEFAULT '[]'::"jsonb",
    "technologies" "jsonb" DEFAULT '[]'::"jsonb",
    "office_photos" "jsonb" DEFAULT '[]'::"jsonb",
    "hiring_process" "jsonb" DEFAULT '[]'::"jsonb",
    "locations" "jsonb" DEFAULT '[]'::"jsonb",
    "facebook_url" "text",
    "instagram_url" "text",
    "verification_status" "text" DEFAULT 'unverified'::"text",
    "pan_number" "text",
    "vat_number" "text",
    "hr_contact_name" "text",
    "hr_contact_email" "text",
    "hr_contact_phone" "text",
    "work_model" "text" DEFAULT 'on-site'::"text",
    "founded_year" integer,
    "rating_avg" numeric DEFAULT 0,
    "review_count" integer DEFAULT 0,
    "follower_count" integer DEFAULT 0,
    "headquarters" "text",
    "tagline" "text",
    CONSTRAINT "companies_verification_status_check" CHECK (("verification_status" = ANY (ARRAY['unverified'::"text", 'pending'::"text", 'verified'::"text", 'rejected'::"text"]))),
    CONSTRAINT "companies_work_model_check" CHECK (("work_model" = ANY (ARRAY['remote'::"text", 'hybrid'::"text", 'on-site'::"text"])))
);


ALTER TABLE "public"."companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "reviewer_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "rating" integer NOT NULL,
    "title" "text" NOT NULL,
    "body" "text",
    "pros" "text",
    "cons" "text",
    "is_current_employee" boolean DEFAULT false,
    "job_title" "text",
    "employer_reply" "text",
    "employer_replied_at" timestamp with time zone,
    "is_approved" boolean DEFAULT true,
    "helpful_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "company_reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."company_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "message" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."contact_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."department_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "department_id" "uuid" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "department_members_role_check" CHECK (("role" = ANY (ARRAY['head'::"text", 'manager'::"text", 'member'::"text"])))
);


ALTER TABLE "public"."department_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."departments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text",
    "head_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."departments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."follows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "follower_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "following_id" "uuid",
    "company_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "follows_check" CHECK ((("following_id" IS NOT NULL) OR ("company_id" IS NOT NULL)))
);


ALTER TABLE "public"."follows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interview_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "application_id" "uuid" NOT NULL,
    "employer_id" "uuid" NOT NULL,
    "candidate_email" "text",
    "title" "text" DEFAULT 'Interview'::"text" NOT NULL,
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "meet_link" "text",
    "google_event_id" "text",
    "message" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."interview_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interview_slots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid" NOT NULL,
    "employer_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "is_booked" boolean DEFAULT false,
    "booked_by" "uuid",
    "application_id" "uuid",
    "meeting_link" "text",
    "calendar_event_id" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."interview_slots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "application_id" "uuid" NOT NULL,
    "scheduled_at" timestamp with time zone NOT NULL,
    "duration_minutes" integer DEFAULT 60,
    "location" "text",
    "meeting_link" "text",
    "status" "text" DEFAULT 'scheduled'::"text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "employer_id" "uuid",
    "candidate_id" "uuid",
    "candidate_email" "text",
    "title" "text" DEFAULT 'Interview'::"text",
    "message" "text",
    "accepted_at" timestamp with time zone,
    "declined_at" timestamp with time zone,
    "google_event_id" "text",
    "meet_link" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "job_id" "uuid",
    CONSTRAINT "interviews_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'confirmed'::"text", 'ongoing'::"text", 'completed'::"text", 'cancelled'::"text", 'missed'::"text", 'expired'::"text", 'reschedule_requested'::"text"])))
);


ALTER TABLE "public"."interviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."jagire" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."jagire" OWNER TO "postgres";


ALTER TABLE "public"."jagire" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."jagire_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."job_matches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "overall_match" integer,
    "reasons" "jsonb" DEFAULT '[]'::"jsonb",
    "missing_skills" "jsonb" DEFAULT '[]'::"jsonb",
    "strengths" "jsonb" DEFAULT '[]'::"jsonb",
    "weaknesses" "jsonb" DEFAULT '[]'::"jsonb",
    "recommendations" "jsonb" DEFAULT '[]'::"jsonb",
    "ranking" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."job_matches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "posted_by" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "requirements" "text",
    "skills" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "location" "text",
    "job_type" "public"."job_type" DEFAULT 'full_time'::"public"."job_type" NOT NULL,
    "experience_level" "public"."experience_level" DEFAULT 'mid'::"public"."experience_level" NOT NULL,
    "salary_min" integer,
    "salary_max" integer,
    "currency" "text" DEFAULT 'USD'::"text",
    "status" "public"."job_status" DEFAULT 'published'::"public"."job_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "employer_id" "uuid",
    "responsibilities" "jsonb" DEFAULT '[]'::"jsonb",
    "skills_required" "jsonb" DEFAULT '[]'::"jsonb",
    "technologies" "jsonb" DEFAULT '[]'::"jsonb",
    "job_category" "text",
    "is_remote" boolean DEFAULT false,
    "industry" "text",
    "keywords" "jsonb" DEFAULT '[]'::"jsonb",
    "applications_count" integer DEFAULT 0,
    "views_count" integer DEFAULT 0,
    "salary_min_usd" integer,
    "salary_max_usd" integer,
    "employment_type" "text" DEFAULT 'full-time'::"text",
    "requirements_list" "jsonb" DEFAULT '[]'::"jsonb",
    "is_featured" boolean DEFAULT false,
    "featured_until" timestamp with time zone,
    "benefits" "text",
    "required_skills" "text"[],
    "slug" "text",
    "salary_currency" "text" DEFAULT 'NPR'::"text",
    "category_id" "uuid",
    "application_deadline" timestamp with time zone
);


ALTER TABLE "public"."jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."knowledge_chunks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "document_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "chunk_index" integer DEFAULT 0 NOT NULL,
    "content" "text" NOT NULL,
    "embedding" "public"."vector"(1024),
    "token_count" integer DEFAULT 0,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."knowledge_chunks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."knowledge_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "uploaded_by" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text",
    "file_url" "text" DEFAULT ''::"text",
    "file_name" "text" DEFAULT ''::"text",
    "file_type" "text" DEFAULT ''::"text",
    "file_size" bigint DEFAULT 0,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "chunk_count" integer DEFAULT 0 NOT NULL,
    "error_message" "text" DEFAULT ''::"text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "knowledge_documents_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'ready'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."knowledge_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."learning_courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "type" "text" NOT NULL,
    "category" "text",
    "difficulty" "text" DEFAULT 'beginner'::"text",
    "url" "text",
    "duration_minutes" integer,
    "thumbnail_url" "text",
    "skills" "jsonb" DEFAULT '[]'::"jsonb",
    "provider" "text",
    "is_featured" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "learning_courses_difficulty_check" CHECK (("difficulty" = ANY (ARRAY['beginner'::"text", 'intermediate'::"text", 'advanced'::"text"]))),
    CONSTRAINT "learning_courses_type_check" CHECK (("type" = ANY (ARRAY['course'::"text", 'video'::"text", 'challenge'::"text", 'interview_prep'::"text"])))
);


ALTER TABLE "public"."learning_courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."learning_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "course_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "content" "text",
    "item_type" "text" DEFAULT 'lesson'::"text",
    "order_index" integer DEFAULT 0,
    "duration_minutes" integer,
    "is_published" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "url" "text",
    "kind" "text" DEFAULT 'lesson'::"text",
    "provider" "text",
    "skills" "text"[]
);


ALTER TABLE "public"."learning_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."learning_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "course_id" "uuid",
    "status" "text" DEFAULT 'not_started'::"text",
    "progress_percent" integer DEFAULT 0,
    "score" integer,
    "badges_earned" "jsonb" DEFAULT '[]'::"jsonb",
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "item_id" "uuid",
    "progress" integer DEFAULT 0,
    CONSTRAINT "learning_progress_status_check" CHECK (("status" = ANY (ARRAY['not_started'::"text", 'in_progress'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."learning_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."learning_resources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "kind" "text",
    "title" "text" NOT NULL,
    "provider" "text",
    "url" "text" NOT NULL,
    "skills" "text"[] DEFAULT '{}'::"text"[],
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "learning_resources_kind_check" CHECK (("kind" = ANY (ARRAY['course'::"text", 'video'::"text", 'challenge'::"text", 'interview'::"text"])))
);


ALTER TABLE "public"."learning_resources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meetings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "application_id" "uuid" NOT NULL,
    "candidate_id" "uuid",
    "scheduled_by" "uuid" NOT NULL,
    "title" "text" DEFAULT 'Interview'::"text" NOT NULL,
    "description" "text",
    "scheduled_at" timestamp with time zone NOT NULL,
    "duration_minutes" integer DEFAULT 60,
    "meeting_url" "text",
    "google_event_id" "text",
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."meetings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sender_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "receiver_id" "uuid",
    "job_id" "uuid",
    "subject" "text",
    "body" "text",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "conversation_id" "uuid" DEFAULT "gen_random_uuid"(),
    "attachment_url" "text",
    "attachment_name" "text",
    "attachment_type" "text",
    "read_at" timestamp with time zone,
    "chat_id" "uuid"
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text",
    "data" "jsonb" DEFAULT '{}'::"jsonb",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "link" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_verifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "transaction_uuid" "text" NOT NULL,
    "user_id" "uuid",
    "product_code" "text",
    "total_amount" numeric,
    "verified" boolean DEFAULT false NOT NULL,
    "esewa_ref_id" "text",
    "status" "text",
    "raw_response" "jsonb",
    "verified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."payment_verifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "amount" numeric NOT NULL,
    "currency" "text" DEFAULT 'NPR'::"text",
    "plan_type" "text",
    "job_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "esewa_ref_id" "text",
    "esewa_transaction_id" "text",
    "product_id" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payments_plan_type_check" CHECK (("plan_type" = ANY (ARRAY['premium_seeker'::"text", 'featured_job'::"text", 'employer_premium'::"text"]))),
    CONSTRAINT "payments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'failed'::"text", 'refunded'::"text"])))
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."post_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "author_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "body" "text",
    "parent_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "content" "text",
    "likes_count" integer DEFAULT 0
);


ALTER TABLE "public"."post_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."post_likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."post_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."post_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "reporter_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "reason" "text" NOT NULL,
    "details" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."post_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."post_saves" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."post_saves" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "author_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "type" "text" DEFAULT 'post'::"text" NOT NULL,
    "title" "text",
    "body" "text",
    "media_urls" "jsonb" DEFAULT '[]'::"jsonb",
    "tags" "jsonb" DEFAULT '[]'::"jsonb",
    "blog_content" "text",
    "likes_count" integer DEFAULT 0,
    "comments_count" integer DEFAULT 0,
    "shares_count" integer DEFAULT 0,
    "views_count" integer DEFAULT 0,
    "is_published" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "content" "text",
    "image_url" "text",
    CONSTRAINT "posts_type_check" CHECK (("type" = ANY (ARRAY['post'::"text", 'blog'::"text", 'job_share'::"text", 'article'::"text"])))
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referrals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referrer_id" "uuid",
    "referred_user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."referrals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reporter_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "target_type" "text" NOT NULL,
    "target_id" "uuid" NOT NULL,
    "reason" "text" NOT NULL,
    "details" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "reports_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'reviewing'::"text", 'resolved'::"text", 'dismissed'::"text"]))),
    CONSTRAINT "reports_target_type_check" CHECK (("target_type" = ANY (ARRAY['job'::"text", 'company'::"text", 'user'::"text", 'application'::"text"])))
);


ALTER TABLE "public"."reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resumes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "file_url" "text",
    "file_name" "text",
    "parsed" "jsonb" DEFAULT '{}'::"jsonb",
    "scores" "jsonb" DEFAULT '{}'::"jsonb",
    "suggestions" "jsonb" DEFAULT '[]'::"jsonb",
    "is_default" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "match_breakdown" "jsonb",
    "file_type" "text",
    "file_size" bigint,
    "parsed_data" "jsonb",
    "ats_score" integer,
    "grammar_score" integer,
    "formatting_score" integer,
    "keyword_score" integer,
    "professionalism_score" integer,
    "overall_score" integer,
    "is_active" boolean DEFAULT true,
    "version" integer DEFAULT 1,
    "raw_text" "text",
    "file_path" "text",
    "mime_type" "text",
    "title" "text",
    "resume_data" "jsonb",
    "career_roadmap" "jsonb"
);


ALTER TABLE "public"."resumes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."review_replies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "review_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "author_id" "uuid"
);


ALTER TABLE "public"."review_replies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "company_id" "uuid",
    "content" "text",
    "rating" integer,
    "reviewer_id" "uuid",
    "title" "text",
    CONSTRAINT "reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."saved_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "job_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."saved_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "plan_type" "text" NOT NULL,
    "status" "text" DEFAULT 'inactive'::"text" NOT NULL,
    "payment_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "transaction_id" "text",
    "esewa_ref_id" "text",
    "amount" numeric DEFAULT 0 NOT NULL,
    "currency" "text" DEFAULT 'NPR'::"text" NOT NULL,
    "started_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "subscriptions_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'failed'::"text", 'refunded'::"text"]))),
    CONSTRAINT "subscriptions_plan_type_check" CHECK (("plan_type" = ANY (ARRAY['premium'::"text", 'starter'::"text", 'professional'::"text", 'enterprise'::"text", 'pro'::"text"]))),
    CONSTRAINT "subscriptions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'expired'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "subject" "text" NOT NULL,
    "message" "text" NOT NULL,
    "admin_reply" "text",
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "support_tickets_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'in_progress'::"text", 'resolved'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."support_tickets" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_messages"
    ADD CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_usage_log"
    ADD CONSTRAINT "ai_usage_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_user_connections"
    ADD CONSTRAINT "app_user_connections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_user_connections"
    ADD CONSTRAINT "app_user_connections_user_id_provider_key" UNIQUE ("user_id", "provider");



ALTER TABLE ONLY "public"."application_events"
    ADD CONSTRAINT "application_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_job_id_applicant_id_key" UNIQUE ("job_id", "applicant_id");



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assessment_attempts"
    ADD CONSTRAINT "assessment_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assessments"
    ADD CONSTRAINT "assessments_catalog_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_comments"
    ADD CONSTRAINT "blog_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_likes"
    ADD CONSTRAINT "blog_likes_blog_id_user_id_key" UNIQUE ("blog_id", "user_id");



ALTER TABLE ONLY "public"."blog_likes"
    ADD CONSTRAINT "blog_likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blogs"
    ADD CONSTRAINT "blogs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blogs"
    ADD CONSTRAINT "blogs_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."bookmarks"
    ADD CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookmarks"
    ADD CONSTRAINT "bookmarks_user_id_job_id_key" UNIQUE ("user_id", "job_id");



ALTER TABLE ONLY "public"."career_coach_sessions"
    ADD CONSTRAINT "career_coach_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."chat_participants"
    ADD CONSTRAINT "chat_participants_chat_id_user_id_key" UNIQUE ("chat_id", "user_id");



ALTER TABLE ONLY "public"."chat_participants"
    ADD CONSTRAINT "chat_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chats"
    ADD CONSTRAINT "chats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comment_likes"
    ADD CONSTRAINT "comment_likes_comment_id_user_id_key" UNIQUE ("comment_id", "user_id");



ALTER TABLE ONLY "public"."comment_likes"
    ADD CONSTRAINT "comment_likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."company_reviews"
    ADD CONSTRAINT "company_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_messages"
    ADD CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."department_members"
    ADD CONSTRAINT "department_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_follower_id_following_id_company_id_key" UNIQUE ("follower_id", "following_id", "company_id");



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interview_events"
    ADD CONSTRAINT "interview_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interview_slots"
    ADD CONSTRAINT "interview_slots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interviews"
    ADD CONSTRAINT "interviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jagire"
    ADD CONSTRAINT "jagire_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_matches"
    ADD CONSTRAINT "job_matches_job_id_user_id_key" UNIQUE ("job_id", "user_id");



ALTER TABLE ONLY "public"."job_matches"
    ADD CONSTRAINT "job_matches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."knowledge_chunks"
    ADD CONSTRAINT "knowledge_chunks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."knowledge_documents"
    ADD CONSTRAINT "knowledge_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."learning_courses"
    ADD CONSTRAINT "learning_courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."learning_items"
    ADD CONSTRAINT "learning_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."learning_progress"
    ADD CONSTRAINT "learning_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."learning_progress"
    ADD CONSTRAINT "learning_progress_user_id_course_id_key" UNIQUE ("user_id", "course_id");



ALTER TABLE ONLY "public"."learning_resources"
    ADD CONSTRAINT "learning_resources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."learning_resources"
    ADD CONSTRAINT "learning_resources_url_key" UNIQUE ("url");



ALTER TABLE ONLY "public"."meetings"
    ADD CONSTRAINT "meetings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_verifications"
    ADD CONSTRAINT "payment_verifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_esewa_transaction_id_key" UNIQUE ("esewa_transaction_id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "post_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_likes"
    ADD CONSTRAINT "post_likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_likes"
    ADD CONSTRAINT "post_likes_post_id_user_id_key" UNIQUE ("post_id", "user_id");



ALTER TABLE ONLY "public"."post_reports"
    ADD CONSTRAINT "post_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_reports"
    ADD CONSTRAINT "post_reports_post_id_reporter_id_key" UNIQUE ("post_id", "reporter_id");



ALTER TABLE ONLY "public"."post_saves"
    ADD CONSTRAINT "post_saves_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_saves"
    ADD CONSTRAINT "post_saves_post_id_user_id_key" UNIQUE ("post_id", "user_id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_referral_code_key" UNIQUE ("referral_code");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resumes"
    ADD CONSTRAINT "resumes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."review_replies"
    ADD CONSTRAINT "review_replies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_jobs"
    ADD CONSTRAINT "saved_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_jobs"
    ADD CONSTRAINT "saved_jobs_user_id_job_id_key" UNIQUE ("user_id", "job_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE ("user_id", "role");



CREATE INDEX "ai_usage_log_user_idx" ON "public"."ai_usage_log" USING "btree" ("user_id", "created_at");



CREATE INDEX "applications_applicant_id_idx" ON "public"."applications" USING "btree" ("applicant_id");



CREATE INDEX "applications_job_id_idx" ON "public"."applications" USING "btree" ("job_id");



CREATE INDEX "applications_job_idx" ON "public"."applications" USING "btree" ("job_id");



CREATE INDEX "applications_seeker_idx" ON "public"."applications" USING "btree" ("seeker_id");



CREATE INDEX "chats_last_msg_idx" ON "public"."chats" USING "btree" ("last_message_at" DESC NULLS LAST);



CREATE INDEX "chats_user_a_idx" ON "public"."chats" USING "btree" ("user_a");



CREATE INDEX "chats_user_b_idx" ON "public"."chats" USING "btree" ("user_b");



CREATE INDEX "idx_activity_logs_user_id" ON "public"."activity_logs" USING "btree" ("user_id");



CREATE INDEX "idx_ai_conversations_user" ON "public"."ai_conversations" USING "btree" ("user_id");



CREATE INDEX "idx_ai_messages_conversation" ON "public"."ai_messages" USING "btree" ("conversation_id");



CREATE INDEX "idx_ai_messages_created" ON "public"."ai_messages" USING "btree" ("created_at");



CREATE INDEX "idx_api_keys_company" ON "public"."api_keys" USING "btree" ("company_id");



CREATE INDEX "idx_api_keys_created_by" ON "public"."api_keys" USING "btree" ("created_by");



CREATE INDEX "idx_api_keys_hash" ON "public"."api_keys" USING "btree" ("key_hash");



CREATE INDEX "idx_app_user_connections_user_id" ON "public"."app_user_connections" USING "btree" ("user_id");



CREATE INDEX "idx_application_events_application_id" ON "public"."application_events" USING "btree" ("application_id");



CREATE INDEX "idx_applications_applicant" ON "public"."applications" USING "btree" ("applicant_id");



CREATE INDEX "idx_applications_applicant_id" ON "public"."applications" USING "btree" ("applicant_id");



CREATE INDEX "idx_applications_job" ON "public"."applications" USING "btree" ("job_id");



CREATE INDEX "idx_applications_job_id" ON "public"."applications" USING "btree" ("job_id");



CREATE INDEX "idx_applications_resume_id" ON "public"."applications" USING "btree" ("resume_id");



CREATE INDEX "idx_applications_seeker" ON "public"."applications" USING "btree" ("seeker_id");



CREATE INDEX "idx_applications_seeker_id" ON "public"."applications" USING "btree" ("seeker_id");



CREATE INDEX "idx_applications_status" ON "public"."applications" USING "btree" ("status");



CREATE INDEX "idx_assessment_attempts_assessment_id" ON "public"."assessment_attempts" USING "btree" ("assessment_id");



CREATE INDEX "idx_assessment_attempts_user_id" ON "public"."assessment_attempts" USING "btree" ("user_id");



CREATE INDEX "idx_assessments_created_by" ON "public"."assessments" USING "btree" ("created_by");



CREATE INDEX "idx_audit_logs_action" ON "public"."audit_logs" USING "btree" ("action");



CREATE INDEX "idx_audit_logs_company" ON "public"."audit_logs" USING "btree" ("company_id");



CREATE INDEX "idx_audit_logs_created" ON "public"."audit_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audit_logs_user_id" ON "public"."audit_logs" USING "btree" ("user_id");



CREATE INDEX "idx_badges_user_id" ON "public"."badges" USING "btree" ("user_id");



CREATE INDEX "idx_blog_comments_author_id" ON "public"."blog_comments" USING "btree" ("author_id");



CREATE INDEX "idx_blog_comments_blog_id" ON "public"."blog_comments" USING "btree" ("blog_id");



CREATE INDEX "idx_blog_likes_blog_id" ON "public"."blog_likes" USING "btree" ("blog_id");



CREATE INDEX "idx_blog_likes_user_id" ON "public"."blog_likes" USING "btree" ("user_id");



CREATE INDEX "idx_blogs_author_id" ON "public"."blogs" USING "btree" ("author_id");



CREATE INDEX "idx_blogs_published" ON "public"."blogs" USING "btree" ("published");



CREATE INDEX "idx_blogs_slug" ON "public"."blogs" USING "btree" ("slug");



CREATE INDEX "idx_bookmarks_job_id" ON "public"."bookmarks" USING "btree" ("job_id");



CREATE INDEX "idx_bookmarks_user" ON "public"."bookmarks" USING "btree" ("user_id");



CREATE INDEX "idx_career_coach_sessions_user_id" ON "public"."career_coach_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_chat_participants_user_id" ON "public"."chat_participants" USING "btree" ("user_id");



CREATE INDEX "idx_chats_user_a" ON "public"."chats" USING "btree" ("user_a");



CREATE INDEX "idx_chats_user_b" ON "public"."chats" USING "btree" ("user_b");



CREATE INDEX "idx_comment_likes_comment_id" ON "public"."comment_likes" USING "btree" ("comment_id");



CREATE INDEX "idx_comment_likes_user_id" ON "public"."comment_likes" USING "btree" ("user_id");



CREATE INDEX "idx_companies_owner" ON "public"."companies" USING "btree" ("owner_id");



CREATE INDEX "idx_companies_owner_id" ON "public"."companies" USING "btree" ("owner_id");



CREATE INDEX "idx_companies_slug" ON "public"."companies" USING "btree" ("slug");



CREATE INDEX "idx_departments_company" ON "public"."departments" USING "btree" ("company_id");



CREATE INDEX "idx_departments_head_id" ON "public"."departments" USING "btree" ("head_id");



CREATE INDEX "idx_dept_members_department" ON "public"."department_members" USING "btree" ("department_id");



CREATE INDEX "idx_dept_members_user" ON "public"."department_members" USING "btree" ("user_id");



CREATE INDEX "idx_follows_company" ON "public"."follows" USING "btree" ("company_id");



CREATE INDEX "idx_follows_follower" ON "public"."follows" USING "btree" ("follower_id");



CREATE INDEX "idx_follows_following" ON "public"."follows" USING "btree" ("following_id");



CREATE INDEX "idx_interview_events_application_id" ON "public"."interview_events" USING "btree" ("application_id");



CREATE INDEX "idx_interview_events_employer_id" ON "public"."interview_events" USING "btree" ("employer_id");



CREATE INDEX "idx_interview_slots_application_id" ON "public"."interview_slots" USING "btree" ("application_id");



CREATE INDEX "idx_interview_slots_booked_by" ON "public"."interview_slots" USING "btree" ("booked_by");



CREATE INDEX "idx_interview_slots_employer" ON "public"."interview_slots" USING "btree" ("employer_id");



CREATE INDEX "idx_interview_slots_job" ON "public"."interview_slots" USING "btree" ("job_id");



CREATE INDEX "idx_interviews_application_id" ON "public"."interviews" USING "btree" ("application_id");



CREATE INDEX "idx_interviews_candidate_id" ON "public"."interviews" USING "btree" ("candidate_id");



CREATE INDEX "idx_interviews_employer_id" ON "public"."interviews" USING "btree" ("employer_id");



CREATE INDEX "idx_interviews_job_id" ON "public"."interviews" USING "btree" ("job_id");



CREATE INDEX "idx_interviews_scheduled_at" ON "public"."interviews" USING "btree" ("scheduled_at");



CREATE INDEX "idx_interviews_status" ON "public"."interviews" USING "btree" ("status");



CREATE INDEX "idx_job_matches_job" ON "public"."job_matches" USING "btree" ("job_id");



CREATE INDEX "idx_job_matches_user" ON "public"."job_matches" USING "btree" ("user_id");



CREATE INDEX "idx_jobs_company" ON "public"."jobs" USING "btree" ("company_id");



CREATE INDEX "idx_jobs_company_id" ON "public"."jobs" USING "btree" ("company_id");



CREATE INDEX "idx_jobs_employer" ON "public"."jobs" USING "btree" ("employer_id");



CREATE INDEX "idx_jobs_posted_by" ON "public"."jobs" USING "btree" ("posted_by");



CREATE INDEX "idx_jobs_slug" ON "public"."jobs" USING "btree" ("slug");



CREATE INDEX "idx_jobs_status" ON "public"."jobs" USING "btree" ("status");



CREATE INDEX "idx_kb_chunks_company" ON "public"."knowledge_chunks" USING "btree" ("company_id");



CREATE INDEX "idx_kb_chunks_document" ON "public"."knowledge_chunks" USING "btree" ("document_id");



CREATE INDEX "idx_kb_chunks_embedding" ON "public"."knowledge_chunks" USING "hnsw" ("embedding" "public"."vector_cosine_ops") WITH ("m"='16', "ef_construction"='64');



CREATE INDEX "idx_kb_docs_company" ON "public"."knowledge_documents" USING "btree" ("company_id");



CREATE INDEX "idx_kb_docs_status" ON "public"."knowledge_documents" USING "btree" ("status");



CREATE INDEX "idx_knowledge_chunks_company" ON "public"."knowledge_chunks" USING "btree" ("company_id");



CREATE INDEX "idx_knowledge_chunks_document" ON "public"."knowledge_chunks" USING "btree" ("document_id");



CREATE INDEX "idx_knowledge_documents_company" ON "public"."knowledge_documents" USING "btree" ("company_id");



CREATE INDEX "idx_knowledge_documents_uploaded_by" ON "public"."knowledge_documents" USING "btree" ("uploaded_by");



CREATE INDEX "idx_learning_items_course_id" ON "public"."learning_items" USING "btree" ("course_id");



CREATE INDEX "idx_learning_progress_course_id" ON "public"."learning_progress" USING "btree" ("course_id");



CREATE INDEX "idx_learning_progress_item_id" ON "public"."learning_progress" USING "btree" ("item_id");



CREATE INDEX "idx_learning_progress_user" ON "public"."learning_progress" USING "btree" ("user_id");



CREATE INDEX "idx_learning_resources_skills" ON "public"."learning_resources" USING "gin" ("skills");



CREATE INDEX "idx_meetings_application_id" ON "public"."meetings" USING "btree" ("application_id");



CREATE INDEX "idx_meetings_candidate_id" ON "public"."meetings" USING "btree" ("candidate_id");



CREATE INDEX "idx_meetings_scheduled_by" ON "public"."meetings" USING "btree" ("scheduled_by");



CREATE INDEX "idx_messages_chat_id" ON "public"."messages" USING "btree" ("chat_id");



CREATE INDEX "idx_messages_conversation" ON "public"."messages" USING "btree" ("conversation_id", "created_at");



CREATE INDEX "idx_messages_job_id" ON "public"."messages" USING "btree" ("job_id");



CREATE INDEX "idx_messages_receiver_id" ON "public"."messages" USING "btree" ("receiver_id");



CREATE INDEX "idx_messages_receiver_read" ON "public"."messages" USING "btree" ("receiver_id", "is_read", "read_at");



CREATE INDEX "idx_messages_receiver_unread" ON "public"."messages" USING "btree" ("receiver_id", "is_read");



CREATE INDEX "idx_messages_sender_id" ON "public"."messages" USING "btree" ("sender_id");



CREATE INDEX "idx_notifications_is_read" ON "public"."notifications" USING "btree" ("is_read");



CREATE INDEX "idx_notifications_user" ON "public"."notifications" USING "btree" ("user_id", "is_read");



CREATE INDEX "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_notifications_user_unread" ON "public"."notifications" USING "btree" ("user_id", "is_read");



CREATE INDEX "idx_payment_verifications_user" ON "public"."payment_verifications" USING "btree" ("user_id");



CREATE INDEX "idx_payment_verifications_uuid" ON "public"."payment_verifications" USING "btree" ("transaction_uuid");



CREATE INDEX "idx_payments_job_id" ON "public"."payments" USING "btree" ("job_id");



CREATE INDEX "idx_payments_status" ON "public"."payments" USING "btree" ("status");



CREATE INDEX "idx_payments_user" ON "public"."payments" USING "btree" ("user_id");



CREATE INDEX "idx_post_comments_parent_id" ON "public"."post_comments" USING "btree" ("parent_id");



CREATE INDEX "idx_post_comments_post" ON "public"."post_comments" USING "btree" ("post_id");



CREATE INDEX "idx_post_comments_post_id" ON "public"."post_comments" USING "btree" ("post_id");



CREATE INDEX "idx_post_likes_post" ON "public"."post_likes" USING "btree" ("post_id");



CREATE INDEX "idx_post_likes_post_id" ON "public"."post_likes" USING "btree" ("post_id");



CREATE INDEX "idx_post_likes_user_id" ON "public"."post_likes" USING "btree" ("user_id");



CREATE INDEX "idx_post_reports_reporter_id" ON "public"."post_reports" USING "btree" ("reporter_id");



CREATE INDEX "idx_post_saves_user" ON "public"."post_saves" USING "btree" ("user_id");



CREATE INDEX "idx_post_saves_user_id" ON "public"."post_saves" USING "btree" ("user_id");



CREATE INDEX "idx_posts_author" ON "public"."posts" USING "btree" ("author_id");



CREATE INDEX "idx_posts_author_id" ON "public"."posts" USING "btree" ("author_id");



CREATE INDEX "idx_posts_created" ON "public"."posts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_posts_created_at" ON "public"."posts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_profiles_role" ON "public"."profiles" USING "btree" ("user_role");



CREATE INDEX "idx_referrals_referred_user_id" ON "public"."referrals" USING "btree" ("referred_user_id");



CREATE INDEX "idx_referrals_referrer_id" ON "public"."referrals" USING "btree" ("referrer_id");



CREATE INDEX "idx_reports_reporter_id" ON "public"."reports" USING "btree" ("reporter_id");



CREATE INDEX "idx_reports_status" ON "public"."reports" USING "btree" ("status");



CREATE INDEX "idx_resumes_user" ON "public"."resumes" USING "btree" ("user_id");



CREATE INDEX "idx_review_replies_author_id" ON "public"."review_replies" USING "btree" ("author_id");



CREATE INDEX "idx_review_replies_review_id" ON "public"."review_replies" USING "btree" ("review_id");



CREATE INDEX "idx_review_replies_user_id" ON "public"."review_replies" USING "btree" ("user_id");



CREATE INDEX "idx_reviews_company" ON "public"."company_reviews" USING "btree" ("company_id");



CREATE INDEX "idx_reviews_company_id" ON "public"."reviews" USING "btree" ("company_id");



CREATE INDEX "idx_reviews_reviewer" ON "public"."company_reviews" USING "btree" ("reviewer_id");



CREATE INDEX "idx_reviews_reviewer_id" ON "public"."reviews" USING "btree" ("reviewer_id");



CREATE INDEX "idx_saved_jobs_job_id" ON "public"."saved_jobs" USING "btree" ("job_id");



CREATE INDEX "idx_saved_jobs_user" ON "public"."saved_jobs" USING "btree" ("user_id");



CREATE INDEX "idx_saved_jobs_user_id" ON "public"."saved_jobs" USING "btree" ("user_id");



CREATE INDEX "idx_subscriptions_user" ON "public"."subscriptions" USING "btree" ("user_id");



CREATE INDEX "idx_support_tickets_user_id" ON "public"."support_tickets" USING "btree" ("user_id");



CREATE INDEX "interviews_candidate_id_scheduled_at_idx" ON "public"."interviews" USING "btree" ("candidate_id", "scheduled_at");



CREATE INDEX "interviews_employer_id_scheduled_at_idx" ON "public"."interviews" USING "btree" ("employer_id", "scheduled_at");



CREATE INDEX "jobs_company_idx" ON "public"."jobs" USING "btree" ("company_id");



CREATE UNIQUE INDEX "jobs_slug_idx" ON "public"."jobs" USING "btree" ("slug");



CREATE INDEX "jobs_status_idx" ON "public"."jobs" USING "btree" ("status");



CREATE INDEX "messages_chat_created_idx" ON "public"."messages" USING "btree" ("chat_id", "created_at");



CREATE INDEX "messages_receiver_read_idx" ON "public"."messages" USING "btree" ("receiver_id", "is_read") WHERE ("receiver_id" IS NOT NULL);



CREATE INDEX "messages_sender_created_idx" ON "public"."messages" USING "btree" ("sender_id", "created_at");



CREATE INDEX "notif_user_created_idx" ON "public"."notifications" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "notif_user_read_idx" ON "public"."notifications" USING "btree" ("user_id", "is_read");



CREATE INDEX "payment_verifications_txn_uuid_idx" ON "public"."payment_verifications" USING "btree" ("transaction_uuid");



CREATE UNIQUE INDEX "payment_verifications_txn_uuid_unique_idx" ON "public"."payment_verifications" USING "btree" ("transaction_uuid") WHERE ("verified" = true);



CREATE INDEX "payments_esewa_txn_idx" ON "public"."payments" USING "btree" ("esewa_transaction_id");



CREATE INDEX "payments_user_status_idx" ON "public"."payments" USING "btree" ("user_id", "status");



CREATE INDEX "post_comments_author_idx" ON "public"."post_comments" USING "btree" ("author_id");



CREATE INDEX "post_comments_post_idx" ON "public"."post_comments" USING "btree" ("post_id", "created_at");



CREATE INDEX "posts_author_created_idx" ON "public"."posts" USING "btree" ("author_id", "created_at" DESC);



CREATE INDEX "posts_created_idx" ON "public"."posts" USING "btree" ("created_at" DESC);



CREATE INDEX "subscriptions_expires_at_idx" ON "public"."subscriptions" USING "btree" ("expires_at");



CREATE INDEX "subscriptions_status_idx" ON "public"."subscriptions" USING "btree" ("status");



CREATE UNIQUE INDEX "subscriptions_user_id_unique_idx" ON "public"."subscriptions" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "ai_messages_touch_conversation" AFTER INSERT ON "public"."ai_messages" FOR EACH ROW EXECUTE FUNCTION "public"."touch_conversation_updated_at"();



CREATE OR REPLACE TRIGGER "applications_count_delete" AFTER DELETE ON "public"."applications" FOR EACH ROW EXECUTE FUNCTION "public"."update_applications_count_trigger"();



CREATE OR REPLACE TRIGGER "applications_count_insert" AFTER INSERT ON "public"."applications" FOR EACH ROW EXECUTE FUNCTION "public"."update_applications_count_trigger"();



CREATE OR REPLACE TRIGGER "applications_set_updated_at" BEFORE UPDATE ON "public"."applications" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "applications_sync_job_count" AFTER INSERT OR DELETE OR UPDATE OF "job_id" ON "public"."applications" FOR EACH ROW EXECUTE FUNCTION "public"."sync_job_application_count"();



CREATE OR REPLACE TRIGGER "applications_updated_at" BEFORE UPDATE ON "public"."applications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "blog_comments_count_delete" AFTER DELETE ON "public"."blog_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_blog_comments_count"();



CREATE OR REPLACE TRIGGER "blog_comments_count_insert" AFTER INSERT ON "public"."blog_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_blog_comments_count"();



CREATE OR REPLACE TRIGGER "blog_likes_count_delete" AFTER DELETE ON "public"."blog_likes" FOR EACH ROW EXECUTE FUNCTION "public"."update_blog_likes_count"();



CREATE OR REPLACE TRIGGER "blog_likes_count_insert" AFTER INSERT ON "public"."blog_likes" FOR EACH ROW EXECUTE FUNCTION "public"."update_blog_likes_count"();



CREATE OR REPLACE TRIGGER "comment_likes_count_delete" AFTER DELETE ON "public"."comment_likes" FOR EACH ROW EXECUTE FUNCTION "public"."update_comment_likes_count"();



CREATE OR REPLACE TRIGGER "comment_likes_count_insert" AFTER INSERT ON "public"."comment_likes" FOR EACH ROW EXECUTE FUNCTION "public"."update_comment_likes_count"();



CREATE OR REPLACE TRIGGER "companies_set_updated_at" BEFORE UPDATE ON "public"."companies" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "companies_updated_at" BEFORE UPDATE ON "public"."companies" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "company_rating_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."company_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_company_rating"();



CREATE OR REPLACE TRIGGER "company_reviews_updated_at" BEFORE UPDATE ON "public"."company_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "interviews_updated_at" BEFORE UPDATE ON "public"."interviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "jobs_set_updated_at" BEFORE UPDATE ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "jobs_updated_at" BEFORE UPDATE ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "messages_updated_at" BEFORE UPDATE ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "on_contact_message_insert" AFTER INSERT ON "public"."contact_messages" FOR EACH ROW EXECUTE FUNCTION "public"."notify_admins_contact_message"();



CREATE OR REPLACE TRIGGER "on_new_message_created" AFTER INSERT ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_message_notification"();



CREATE OR REPLACE TRIGGER "on_post_comment_created" AFTER INSERT ON "public"."post_comments" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_comment_notification"();



CREATE OR REPLACE TRIGGER "on_post_like_created" AFTER INSERT ON "public"."post_likes" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_like_notification"();



CREATE OR REPLACE TRIGGER "on_support_ticket_reply" AFTER UPDATE ON "public"."support_tickets" FOR EACH ROW EXECUTE FUNCTION "public"."notify_ticket_owner_reply"();



CREATE OR REPLACE TRIGGER "payments_updated_at" BEFORE UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "post_comments_count_delete" AFTER DELETE ON "public"."post_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_post_comments_count"();



CREATE OR REPLACE TRIGGER "post_comments_count_insert" AFTER INSERT ON "public"."post_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_post_comments_count"();



CREATE OR REPLACE TRIGGER "post_likes_count_trigger" AFTER INSERT OR DELETE ON "public"."post_likes" FOR EACH ROW EXECUTE FUNCTION "public"."update_post_counters"();



CREATE OR REPLACE TRIGGER "posts_updated_at" BEFORE UPDATE ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "prevent_self_job_application_trigger" BEFORE INSERT ON "public"."applications" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_self_job_application"();



CREATE OR REPLACE TRIGGER "profiles_set_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "resumes_set_updated_at" BEFORE UPDATE ON "public"."resumes" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "resumes_updated_at" BEFORE UPDATE ON "public"."resumes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_department_updated_at" BEFORE UPDATE ON "public"."departments" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_department_updated_at"();



CREATE OR REPLACE TRIGGER "set_kb_doc_updated_at" BEFORE UPDATE ON "public"."knowledge_documents" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_kb_doc_updated_at"();



CREATE OR REPLACE TRIGGER "subscriptions_touch" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "sync_application_seeker_id_trigger" BEFORE INSERT OR UPDATE ON "public"."applications" FOR EACH ROW EXECUTE FUNCTION "public"."sync_application_seeker_id"();



ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_messages"
    ADD CONSTRAINT "ai_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_usage_log"
    ADD CONSTRAINT "ai_usage_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_user_connections"
    ADD CONSTRAINT "app_user_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."application_events"
    ADD CONSTRAINT "application_events_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."assessment_attempts"
    ADD CONSTRAINT "assessment_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessments"
    ADD CONSTRAINT "assessments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blog_comments"
    ADD CONSTRAINT "blog_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blog_comments"
    ADD CONSTRAINT "blog_comments_blog_id_fkey" FOREIGN KEY ("blog_id") REFERENCES "public"."blogs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blog_likes"
    ADD CONSTRAINT "blog_likes_blog_id_fkey" FOREIGN KEY ("blog_id") REFERENCES "public"."blogs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blog_likes"
    ADD CONSTRAINT "blog_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blogs"
    ADD CONSTRAINT "blogs_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookmarks"
    ADD CONSTRAINT "bookmarks_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookmarks"
    ADD CONSTRAINT "bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."career_coach_sessions"
    ADD CONSTRAINT "career_coach_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_participants"
    ADD CONSTRAINT "chat_participants_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_participants"
    ADD CONSTRAINT "chat_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chats"
    ADD CONSTRAINT "chats_user_a_fkey" FOREIGN KEY ("user_a") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."chats"
    ADD CONSTRAINT "chats_user_b_fkey" FOREIGN KEY ("user_b") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."comment_likes"
    ADD CONSTRAINT "comment_likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."post_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment_likes"
    ADD CONSTRAINT "comment_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_reviews"
    ADD CONSTRAINT "company_reviews_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_reviews"
    ADD CONSTRAINT "company_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."department_members"
    ADD CONSTRAINT "department_members_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."department_members"
    ADD CONSTRAINT "department_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_head_id_fkey" FOREIGN KEY ("head_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interview_events"
    ADD CONSTRAINT "interview_events_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interview_events"
    ADD CONSTRAINT "interview_events_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interview_slots"
    ADD CONSTRAINT "interview_slots_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."interview_slots"
    ADD CONSTRAINT "interview_slots_booked_by_fkey" FOREIGN KEY ("booked_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."interview_slots"
    ADD CONSTRAINT "interview_slots_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interview_slots"
    ADD CONSTRAINT "interview_slots_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interviews"
    ADD CONSTRAINT "interviews_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interviews"
    ADD CONSTRAINT "interviews_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interviews"
    ADD CONSTRAINT "interviews_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interviews"
    ADD CONSTRAINT "interviews_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."job_matches"
    ADD CONSTRAINT "job_matches_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_matches"
    ADD CONSTRAINT "job_matches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_posted_by_fkey" FOREIGN KEY ("posted_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_chunks"
    ADD CONSTRAINT "knowledge_chunks_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_chunks"
    ADD CONSTRAINT "knowledge_chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."knowledge_documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_documents"
    ADD CONSTRAINT "knowledge_documents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_documents"
    ADD CONSTRAINT "knowledge_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."learning_items"
    ADD CONSTRAINT "learning_items_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."learning_courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."learning_progress"
    ADD CONSTRAINT "learning_progress_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."learning_courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."learning_progress"
    ADD CONSTRAINT "learning_progress_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."learning_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."learning_progress"
    ADD CONSTRAINT "learning_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meetings"
    ADD CONSTRAINT "meetings_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meetings"
    ADD CONSTRAINT "meetings_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meetings"
    ADD CONSTRAINT "meetings_scheduled_by_fkey" FOREIGN KEY ("scheduled_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_verifications"
    ADD CONSTRAINT "payment_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "post_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "post_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."post_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "post_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_likes"
    ADD CONSTRAINT "post_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_likes"
    ADD CONSTRAINT "post_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_reports"
    ADD CONSTRAINT "post_reports_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_reports"
    ADD CONSTRAINT "post_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_saves"
    ADD CONSTRAINT "post_saves_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_saves"
    ADD CONSTRAINT "post_saves_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referred_user_id_fkey" FOREIGN KEY ("referred_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resumes"
    ADD CONSTRAINT "resumes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."review_replies"
    ADD CONSTRAINT "review_replies_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."review_replies"
    ADD CONSTRAINT "review_replies_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."review_replies"
    ADD CONSTRAINT "review_replies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."saved_jobs"
    ADD CONSTRAINT "saved_jobs_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_jobs"
    ADD CONSTRAINT "saved_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins and employers can insert assessments" ON "public"."assessments" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = ANY (ARRAY['admin'::"public"."app_role", 'employer'::"public"."app_role"]))))));



CREATE POLICY "Admins and employers can view assessments" ON "public"."assessments" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = ANY (ARRAY['admin'::"public"."app_role", 'employer'::"public"."app_role"]))))));



CREATE POLICY "Allow authenticated users to delete learning_items" ON "public"."learning_items" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to insert learning_items" ON "public"."learning_items" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to update learning_items" ON "public"."learning_items" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated users to view learning_items" ON "public"."learning_items" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Anyone can view categories" ON "public"."categories" FOR SELECT USING (true);



CREATE POLICY "Anyone can view comments" ON "public"."post_comments" FOR SELECT USING (true);



CREATE POLICY "Anyone can view learning items" ON "public"."learning_items" FOR SELECT USING (true);



CREATE POLICY "Applicants can apply" ON "public"."applications" FOR INSERT WITH CHECK (("auth"."uid"() = "applicant_id"));



CREATE POLICY "Applicants create own" ON "public"."applications" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "applicant_id") AND (NOT "public"."has_role"("auth"."uid"(), 'employer'::"public"."app_role"))));



CREATE POLICY "Applicants or employers update" ON "public"."applications" FOR UPDATE USING ((("auth"."uid"() = "applicant_id") OR (EXISTS ( SELECT 1
   FROM "public"."jobs" "j"
  WHERE (("j"."id" = "applications"."job_id") AND ("j"."posted_by" = "auth"."uid"())))) OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")));



CREATE POLICY "Applicants view own applications" ON "public"."applications" FOR SELECT USING ((("auth"."uid"() = "applicant_id") OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role") OR (EXISTS ( SELECT 1
   FROM "public"."jobs" "j"
  WHERE (("j"."id" = "applications"."job_id") AND ("j"."posted_by" = "auth"."uid"()))))));



CREATE POLICY "Authenticated users can comment" ON "public"."post_comments" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "Authenticated users can view assessments" ON "public"."assessments" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Companies public read" ON "public"."companies" FOR SELECT USING (true);



CREATE POLICY "Company users can reply" ON "public"."review_replies" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "author_id") AND (EXISTS ( SELECT 1
   FROM "public"."companies" "c"
  WHERE ("c"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Employer can insert" ON "public"."jobs" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "posted_by") AND "public"."has_role"("auth"."uid"(), 'employer'::"public"."app_role")));



CREATE POLICY "Employers can view applicant resumes" ON "public"."resumes" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."applications" "a"
     JOIN "public"."jobs" "j" ON (("a"."job_id" = "j"."id")))
  WHERE (("a"."resume_id" = "resumes"."id") AND (("j"."employer_id" = "auth"."uid"()) OR ("j"."posted_by" = "auth"."uid"()))))));



CREATE POLICY "Employers can view applications for their jobs" ON "public"."applications" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."jobs" "j"
  WHERE (("j"."id" = "applications"."job_id") AND (("j"."employer_id" = "auth"."uid"()) OR ("j"."posted_by" = "auth"."uid"()))))));



CREATE POLICY "Owner can delete" ON "public"."companies" FOR DELETE TO "authenticated" USING ((("auth"."uid"() = "owner_id") OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")));



CREATE POLICY "Owner can delete" ON "public"."jobs" FOR DELETE TO "authenticated" USING ((("auth"."uid"() = "posted_by") OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")));



CREATE POLICY "Owner can insert" ON "public"."companies" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "owner_id") AND "public"."has_role"("auth"."uid"(), 'employer'::"public"."app_role")));



CREATE POLICY "Owner can update" ON "public"."companies" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "owner_id") OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")));



CREATE POLICY "Owner can update" ON "public"."jobs" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "posted_by") OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")));



CREATE POLICY "Profiles are viewable by everyone" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Public can view badges" ON "public"."badges" FOR SELECT USING (true);



CREATE POLICY "Public can view jobs" ON "public"."jobs" FOR SELECT USING ((("status" = ANY (ARRAY['published'::"public"."job_status", 'active'::"public"."job_status"])) OR ("posted_by" = "auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")));



CREATE POLICY "Public can view published blogs" ON "public"."blogs" FOR SELECT TO "authenticated", "anon" USING (("published" = true));



CREATE POLICY "Temporary allow inserts" ON "public"."career_coach_sessions" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Users can apply" ON "public"."applications" FOR INSERT WITH CHECK (("auth"."uid"() = "applicant_id"));



CREATE POLICY "Users can create blogs" ON "public"."blogs" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "Users can create chats" ON "public"."chats" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "user_a") OR ("auth"."uid"() = "user_b")));



CREATE POLICY "Users can delete own resumes" ON "public"."resumes" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own assessment attempts" ON "public"."assessment_attempts" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert own resumes" ON "public"."resumes" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own badges" ON "public"."badges" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own progress" ON "public"."learning_progress" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own resumes" ON "public"."resumes" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own progress" ON "public"."learning_progress" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view application events" ON "public"."application_events" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."applications" "a"
  WHERE (("a"."id" = "application_events"."application_id") AND (("a"."applicant_id" = "auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'employer'::"public"."app_role") OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"))))));



CREATE POLICY "Users can view chats" ON "public"."chats" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "user_a") OR ("auth"."uid"() = "user_b")));



CREATE POLICY "Users can view own assessment attempts" ON "public"."assessment_attempts" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own resumes" ON "public"."resumes" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own roles" ON "public"."user_roles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own badges" ON "public"."badges" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own progress" ON "public"."learning_progress" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users or employers update applications" ON "public"."applications" FOR UPDATE USING ((("auth"."uid"() = "applicant_id") OR (EXISTS ( SELECT 1
   FROM "public"."jobs" "j"
  WHERE (("j"."id" = "applications"."job_id") AND ("j"."posted_by" = "auth"."uid"())))) OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")));



CREATE POLICY "Users view own applications" ON "public"."applications" FOR SELECT USING ((("auth"."uid"() = "applicant_id") OR (EXISTS ( SELECT 1
   FROM "public"."jobs" "j"
  WHERE (("j"."id" = "applications"."job_id") AND ("j"."posted_by" = "auth"."uid"())))) OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")));



ALTER TABLE "public"."activity_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_delete_badges" ON "public"."badges" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "admin_delete_jobs" ON "public"."jobs" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"public"."app_role")))));



CREATE POLICY "admin_delete_learning_items" ON "public"."learning_items" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "admin_insert_badges" ON "public"."badges" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "admin_insert_learning_items" ON "public"."learning_items" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "admin_select_contact_messages" ON "public"."contact_messages" FOR SELECT TO "authenticated" USING ("public"."has_role"('admin'::"public"."app_role"));



CREATE POLICY "admin_select_subscriptions" ON "public"."subscriptions" FOR SELECT TO "authenticated" USING ("public"."has_role"('admin'::"public"."app_role"));



CREATE POLICY "admin_update_badges" ON "public"."badges" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "admin_update_learning_items" ON "public"."learning_items" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "admin_update_subscriptions" ON "public"."subscriptions" FOR UPDATE TO "authenticated" USING ("public"."has_role"('admin'::"public"."app_role")) WITH CHECK ("public"."has_role"('admin'::"public"."app_role"));



ALTER TABLE "public"."ai_conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_usage_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "anon_insert_contact_messages" ON "public"."contact_messages" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



ALTER TABLE "public"."api_keys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_user_connections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."application_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assessment_attempts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assessments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."badges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blog_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blog_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blogs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bookmarks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."career_coach_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comment_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "delete_admin_course" ON "public"."learning_courses" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."user_role" = 'admin'::"text")))));



CREATE POLICY "delete_assessments" ON "public"."assessments" FOR DELETE TO "authenticated" USING (("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role") OR ("created_by" = "auth"."uid"())));



CREATE POLICY "delete_blog_comments" ON "public"."blog_comments" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "author_id"));



CREATE POLICY "delete_blog_likes" ON "public"."blog_likes" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "delete_blogs" ON "public"."blogs" FOR DELETE TO "authenticated" USING ((("author_id" = "auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")));



CREATE POLICY "delete_categories" ON "public"."categories" FOR DELETE TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "delete_comment_likes" ON "public"."comment_likes" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "delete_companies" ON "public"."companies" FOR DELETE TO "authenticated" USING ((("owner_id" = "auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")));



CREATE POLICY "delete_employer_slot" ON "public"."interview_slots" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "employer_id"));



CREATE POLICY "delete_follows" ON "public"."follows" FOR DELETE TO "authenticated" USING (("follower_id" = "auth"."uid"()));



CREATE POLICY "delete_interview_events" ON "public"."interview_events" FOR DELETE TO "authenticated" USING (("employer_id" = "auth"."uid"()));



CREATE POLICY "delete_interviews" ON "public"."interviews" FOR DELETE TO "authenticated" USING ((("employer_id" = "auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")));



CREATE POLICY "delete_jobs" ON "public"."jobs" FOR DELETE TO "authenticated" USING ((("posted_by" = "auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")));



CREATE POLICY "delete_meetings" ON "public"."meetings" FOR DELETE TO "authenticated" USING ((("scheduled_by" = "auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")));



CREATE POLICY "delete_notifications" ON "public"."notifications" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "delete_own_activity_logs" ON "public"."activity_logs" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "delete_own_application" ON "public"."applications" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "applicant_id"));



CREATE POLICY "delete_own_bookmarks" ON "public"."bookmarks" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "delete_own_chat_participation" ON "public"."chat_participants" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "delete_own_coach_sessions" ON "public"."career_coach_sessions" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "delete_own_comment" ON "public"."post_comments" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "author_id"));



CREATE POLICY "delete_own_company" ON "public"."companies" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "delete_own_company_api_keys" ON "public"."api_keys" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "api_keys"."company_id") AND ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "delete_own_company_chunks" ON "public"."knowledge_chunks" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "knowledge_chunks"."company_id") AND ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "delete_own_company_departments" ON "public"."departments" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "departments"."company_id") AND ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "delete_own_company_dept_members" ON "public"."department_members" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."departments" "d"
     JOIN "public"."companies" "c" ON (("c"."id" = "d"."company_id")))
  WHERE (("d"."id" = "department_members"."department_id") AND ("c"."owner_id" = "auth"."uid"())))));



CREATE POLICY "delete_own_company_docs" ON "public"."knowledge_documents" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "knowledge_documents"."company_id") AND ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "delete_own_connections" ON "public"."app_user_connections" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "delete_own_conversations" ON "public"."ai_conversations" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "delete_own_follow" ON "public"."follows" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "follower_id"));



CREATE POLICY "delete_own_interviews" ON "public"."interviews" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."applications"
  WHERE (("applications"."id" = "interviews"."application_id") AND (EXISTS ( SELECT 1
           FROM "public"."jobs"
          WHERE (("jobs"."id" = "applications"."job_id") AND ("jobs"."employer_id" = "auth"."uid"()))))))));



CREATE POLICY "delete_own_job" ON "public"."jobs" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "employer_id"));



CREATE POLICY "delete_own_like" ON "public"."post_likes" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "delete_own_matches" ON "public"."job_matches" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "delete_own_messages" ON "public"."ai_messages" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."ai_conversations" "c"
  WHERE (("c"."id" = "ai_messages"."conversation_id") AND ("c"."user_id" = "auth"."uid"())))));



CREATE POLICY "delete_own_messages" ON "public"."messages" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "sender_id"));



CREATE POLICY "delete_own_notifications" ON "public"."notifications" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "delete_own_post" ON "public"."posts" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "author_id"));



CREATE POLICY "delete_own_post_save" ON "public"."post_saves" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "delete_own_profile" ON "public"."profiles" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "delete_own_reports" ON "public"."reports" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "reporter_id"));



CREATE POLICY "delete_own_resumes" ON "public"."resumes" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "delete_own_review" ON "public"."company_reviews" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "reviewer_id"));



CREATE POLICY "delete_own_saved_jobs" ON "public"."saved_jobs" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "delete_own_subscriptions" ON "public"."subscriptions" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "delete_post_comments" ON "public"."post_comments" FOR DELETE TO "authenticated" USING ((("author_id" = "auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")));



CREATE POLICY "delete_post_likes" ON "public"."post_likes" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "delete_post_saves" ON "public"."post_saves" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "delete_posts" ON "public"."posts" FOR DELETE TO "authenticated" USING ((("author_id" = "auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")));



CREATE POLICY "delete_resumes" ON "public"."resumes" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "delete_review_replies" ON "public"."review_replies" FOR DELETE TO "authenticated" USING ((("author_id" = "auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")));



CREATE POLICY "delete_reviews" ON "public"."reviews" FOR DELETE TO "authenticated" USING ((("reviewer_id" = "auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")));



CREATE POLICY "delete_saved_jobs" ON "public"."saved_jobs" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."department_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."departments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."follows" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "insert_admin_course" ON "public"."learning_courses" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."user_role" = 'admin'::"text")))));



CREATE POLICY "insert_assessment_attempts" ON "public"."assessment_attempts" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "insert_assessments" ON "public"."assessments" FOR INSERT TO "authenticated" WITH CHECK (("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role") OR ("created_by" = "auth"."uid"())));



CREATE POLICY "insert_blog_comments" ON "public"."blog_comments" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "insert_blog_likes" ON "public"."blog_likes" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "insert_blogs" ON "public"."blogs" FOR INSERT TO "authenticated" WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "insert_categories" ON "public"."categories" FOR INSERT TO "authenticated" WITH CHECK ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "insert_chats" ON "public"."chats" FOR INSERT TO "authenticated" WITH CHECK ((("user_a" = "auth"."uid"()) OR ("user_b" = "auth"."uid"())));



CREATE POLICY "insert_comment_likes" ON "public"."comment_likes" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "insert_companies" ON "public"."companies" FOR INSERT TO "authenticated" WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "insert_employer_slot" ON "public"."interview_slots" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "employer_id"));



CREATE POLICY "insert_follows" ON "public"."follows" FOR INSERT TO "authenticated" WITH CHECK (("follower_id" = "auth"."uid"()));



CREATE POLICY "insert_interview_events" ON "public"."interview_events" FOR INSERT TO "authenticated" WITH CHECK (("employer_id" = "auth"."uid"()));



CREATE POLICY "insert_interviews" ON "public"."interviews" FOR INSERT TO "authenticated" WITH CHECK ((("employer_id" = "auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")));



CREATE POLICY "insert_jobs" ON "public"."jobs" FOR INSERT TO "authenticated" WITH CHECK (("posted_by" = "auth"."uid"()));



CREATE POLICY "insert_meetings" ON "public"."meetings" FOR INSERT TO "authenticated" WITH CHECK (("scheduled_by" = "auth"."uid"()));



CREATE POLICY "insert_messages" ON "public"."messages" FOR INSERT TO "authenticated" WITH CHECK (("sender_id" = "auth"."uid"()));



CREATE POLICY "insert_notifications" ON "public"."notifications" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "insert_own_activity_logs" ON "public"."activity_logs" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "insert_own_ai_usage" ON "public"."ai_usage_log" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "insert_own_application" ON "public"."applications" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "applicant_id"));



CREATE POLICY "insert_own_bookmarks" ON "public"."bookmarks" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "insert_own_chat_participation" ON "public"."chat_participants" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "insert_own_coach_sessions" ON "public"."career_coach_sessions" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "insert_own_comment" ON "public"."post_comments" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "insert_own_company" ON "public"."companies" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "insert_own_company_api_keys" ON "public"."api_keys" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "api_keys"."company_id") AND ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "insert_own_company_audit_logs" ON "public"."audit_logs" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "audit_logs"."company_id") AND ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "insert_own_company_chunks" ON "public"."knowledge_chunks" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "knowledge_chunks"."company_id") AND ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "insert_own_company_departments" ON "public"."departments" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "departments"."company_id") AND ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "insert_own_company_dept_members" ON "public"."department_members" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."departments" "d"
     JOIN "public"."companies" "c" ON (("c"."id" = "d"."company_id")))
  WHERE (("d"."id" = "department_members"."department_id") AND ("c"."owner_id" = "auth"."uid"())))));



CREATE POLICY "insert_own_company_docs" ON "public"."knowledge_documents" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "knowledge_documents"."company_id") AND ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "insert_own_connections" ON "public"."app_user_connections" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "insert_own_conversations" ON "public"."ai_conversations" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "insert_own_follow" ON "public"."follows" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "follower_id"));



CREATE POLICY "insert_own_interviews" ON "public"."interviews" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."applications"
  WHERE (("applications"."id" = "interviews"."application_id") AND (EXISTS ( SELECT 1
           FROM "public"."jobs"
          WHERE (("jobs"."id" = "applications"."job_id") AND ("jobs"."employer_id" = "auth"."uid"()))))))));



CREATE POLICY "insert_own_job" ON "public"."jobs" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "employer_id"));



CREATE POLICY "insert_own_like" ON "public"."post_likes" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "insert_own_matches" ON "public"."job_matches" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "insert_own_messages" ON "public"."ai_messages" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."ai_conversations" "c"
  WHERE (("c"."id" = "ai_messages"."conversation_id") AND ("c"."user_id" = "auth"."uid"())))));



CREATE POLICY "insert_own_messages" ON "public"."messages" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "sender_id"));



CREATE POLICY "insert_own_notifications" ON "public"."notifications" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "insert_own_payment" ON "public"."payments" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "insert_own_payment_verifications" ON "public"."payment_verifications" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "insert_own_post" ON "public"."posts" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "insert_own_post_save" ON "public"."post_saves" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "insert_own_profile" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "insert_own_progress" ON "public"."learning_progress" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "insert_own_reports" ON "public"."reports" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "reporter_id"));



CREATE POLICY "insert_own_resumes" ON "public"."resumes" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "insert_own_review" ON "public"."company_reviews" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "reviewer_id"));



CREATE POLICY "insert_own_saved_jobs" ON "public"."saved_jobs" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "insert_own_subscriptions" ON "public"."subscriptions" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "insert_own_user_role" ON "public"."user_roles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "insert_post_comments" ON "public"."post_comments" FOR INSERT TO "authenticated" WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "insert_post_likes" ON "public"."post_likes" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "insert_post_reports" ON "public"."post_reports" FOR INSERT TO "authenticated" WITH CHECK (("reporter_id" = "auth"."uid"()));



CREATE POLICY "insert_post_saves" ON "public"."post_saves" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "insert_posts" ON "public"."posts" FOR INSERT TO "authenticated" WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "insert_profiles" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "insert_referrals" ON "public"."referrals" FOR INSERT TO "authenticated" WITH CHECK (("referrer_id" = "auth"."uid"()));



CREATE POLICY "insert_reports" ON "public"."reports" FOR INSERT TO "authenticated" WITH CHECK (("reporter_id" = "auth"."uid"()));



CREATE POLICY "insert_resumes" ON "public"."resumes" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "insert_review_replies" ON "public"."review_replies" FOR INSERT TO "authenticated" WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "insert_reviews" ON "public"."reviews" FOR INSERT TO "authenticated" WITH CHECK (("reviewer_id" = "auth"."uid"()));



CREATE POLICY "insert_saved_jobs" ON "public"."saved_jobs" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "insert_support_tickets" ON "public"."support_tickets" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "insert_user_roles" ON "public"."user_roles" FOR INSERT TO "authenticated" WITH CHECK (("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role") OR ("user_id" = "auth"."uid"())));



ALTER TABLE "public"."interview_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interview_slots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."jagire" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_matches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."knowledge_chunks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."knowledge_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."learning_courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."learning_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."learning_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."learning_resources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meetings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_verifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_saves" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "read_jagire" ON "public"."jagire" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."referrals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resumes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."review_replies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."saved_jobs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "select_assessment_attempts" ON "public"."assessment_attempts" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")));



CREATE POLICY "select_assessments" ON "public"."assessments" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "select_blog_comments" ON "public"."blog_comments" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "select_blog_likes" ON "public"."blog_likes" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "select_blogs" ON "public"."blogs" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "select_categories" ON "public"."categories" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "select_chats" ON "public"."chats" FOR SELECT TO "authenticated" USING ((("user_a" = "auth"."uid"()) OR ("user_b" = "auth"."uid"())));



CREATE POLICY "select_comment_likes" ON "public"."comment_likes" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "select_companies" ON "public"."companies" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "select_follows" ON "public"."follows" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "select_interview_events" ON "public"."interview_events" FOR SELECT USING ((("employer_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."applications" "a"
  WHERE (("a"."id" = "interview_events"."application_id") AND ("a"."applicant_id" = "auth"."uid"())))) OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")));



CREATE POLICY "select_interview_slots" ON "public"."interview_slots" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "employer_id") OR ("auth"."uid"() = "booked_by")));



CREATE POLICY "select_interviews" ON "public"."interviews" FOR SELECT USING ((("employer_id" = "auth"."uid"()) OR ("candidate_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."applications" "a"
  WHERE (("a"."id" = "interviews"."application_id") AND ("a"."applicant_id" = "auth"."uid"())))) OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")));



CREATE POLICY "select_jobs" ON "public"."jobs" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "select_learning_courses" ON "public"."learning_courses" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "select_meetings" ON "public"."meetings" FOR SELECT TO "authenticated" USING ((("scheduled_by" = "auth"."uid"()) OR ("candidate_id" = "auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")));



CREATE POLICY "select_messages" ON "public"."messages" FOR SELECT TO "authenticated" USING ((("sender_id" = "auth"."uid"()) OR ("receiver_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."chats" "c"
  WHERE (("c"."id" = "messages"."chat_id") AND (("c"."user_a" = "auth"."uid"()) OR ("c"."user_b" = "auth"."uid"())))))));



CREATE POLICY "select_notifications" ON "public"."notifications" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "select_own_activity_logs" ON "public"."activity_logs" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "select_own_ai_usage" ON "public"."ai_usage_log" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "select_own_applications" ON "public"."applications" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "applicant_id") OR (EXISTS ( SELECT 1
   FROM "public"."jobs"
  WHERE (("jobs"."id" = "applications"."job_id") AND ("jobs"."employer_id" = "auth"."uid"()))))));



CREATE POLICY "select_own_bookmarks" ON "public"."bookmarks" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "select_own_chat_participation" ON "public"."chat_participants" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "select_own_coach_sessions" ON "public"."career_coach_sessions" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "select_own_company_api_keys" ON "public"."api_keys" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "api_keys"."company_id") AND ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "select_own_company_audit_logs" ON "public"."audit_logs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "audit_logs"."company_id") AND ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "select_own_company_chunks" ON "public"."knowledge_chunks" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "knowledge_chunks"."company_id") AND ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "select_own_company_departments" ON "public"."departments" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "departments"."company_id") AND ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "select_own_company_dept_members" ON "public"."department_members" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."departments" "d"
     JOIN "public"."companies" "c" ON (("c"."id" = "d"."company_id")))
  WHERE (("d"."id" = "department_members"."department_id") AND ("c"."owner_id" = "auth"."uid"())))));



CREATE POLICY "select_own_company_docs" ON "public"."knowledge_documents" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "knowledge_documents"."company_id") AND ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "select_own_connections" ON "public"."app_user_connections" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "select_own_conversations" ON "public"."ai_conversations" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "select_own_interviews" ON "public"."interviews" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."applications"
  WHERE (("applications"."id" = "interviews"."application_id") AND (("applications"."applicant_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."jobs"
          WHERE (("jobs"."id" = "applications"."job_id") AND ("jobs"."employer_id" = "auth"."uid"())))))))));



CREATE POLICY "select_own_matches" ON "public"."job_matches" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."jobs"
  WHERE (("jobs"."id" = "job_matches"."job_id") AND ("jobs"."employer_id" = "auth"."uid"()))))));



CREATE POLICY "select_own_messages" ON "public"."ai_messages" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."ai_conversations" "c"
  WHERE (("c"."id" = "ai_messages"."conversation_id") AND ("c"."user_id" = "auth"."uid"())))));



CREATE POLICY "select_own_messages" ON "public"."messages" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "sender_id") OR ("auth"."uid"() = "receiver_id")));



CREATE POLICY "select_own_notifications" ON "public"."notifications" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "select_own_payment_verifications" ON "public"."payment_verifications" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "select_own_payments" ON "public"."payments" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "select_own_post_saves" ON "public"."post_saves" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "select_own_profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "select_own_progress" ON "public"."learning_progress" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "select_own_reports" ON "public"."reports" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "reporter_id"));



CREATE POLICY "select_own_resumes" ON "public"."resumes" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "select_own_saved_jobs" ON "public"."saved_jobs" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "select_own_subscriptions" ON "public"."subscriptions" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "select_own_user_role" ON "public"."user_roles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "select_post_comments" ON "public"."post_comments" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "select_post_likes" ON "public"."post_likes" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "select_post_reports" ON "public"."post_reports" FOR SELECT TO "authenticated" USING ((("reporter_id" = "auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")));



CREATE POLICY "select_post_saves" ON "public"."post_saves" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "select_posts" ON "public"."posts" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "select_profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "select_referrals" ON "public"."referrals" FOR SELECT TO "authenticated" USING ((("referrer_id" = "auth"."uid"()) OR ("referred_user_id" = "auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")));



CREATE POLICY "select_reports" ON "public"."reports" FOR SELECT TO "authenticated" USING ((("reporter_id" = "auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")));



CREATE POLICY "select_resumes" ON "public"."resumes" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "select_review_replies" ON "public"."review_replies" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "select_reviews" ON "public"."company_reviews" FOR SELECT TO "authenticated" USING ((("is_approved" = true) OR ("auth"."uid"() = "reviewer_id") OR (EXISTS ( SELECT 1
   FROM "public"."companies" "c"
  WHERE (("c"."id" = "company_reviews"."company_id") AND ("c"."owner_id" = "auth"."uid"()))))));



CREATE POLICY "select_reviews" ON "public"."reviews" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "select_saved_jobs" ON "public"."saved_jobs" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "select_support_tickets" ON "public"."support_tickets" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")));



CREATE POLICY "select_user_roles" ON "public"."user_roles" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")));



ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_tickets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "update_admin_course" ON "public"."learning_courses" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."user_role" = 'admin'::"text")))));



CREATE POLICY "update_assessments" ON "public"."assessments" FOR UPDATE TO "authenticated" USING (("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role") OR ("created_by" = "auth"."uid"()))) WITH CHECK (("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role") OR ("created_by" = "auth"."uid"())));



CREATE POLICY "update_blog_comments" ON "public"."blog_comments" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "author_id")) WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "update_blogs" ON "public"."blogs" FOR UPDATE TO "authenticated" USING ((("author_id" = "auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"))) WITH CHECK ((("author_id" = "auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")));



CREATE POLICY "update_categories" ON "public"."categories" FOR UPDATE TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")) WITH CHECK ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "update_chats" ON "public"."chats" FOR UPDATE TO "authenticated" USING ((("user_a" = "auth"."uid"()) OR ("user_b" = "auth"."uid"()))) WITH CHECK ((("user_a" = "auth"."uid"()) OR ("user_b" = "auth"."uid"())));



CREATE POLICY "update_companies" ON "public"."companies" FOR UPDATE TO "authenticated" USING ((("owner_id" = "auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"))) WITH CHECK ((("owner_id" = "auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")));



CREATE POLICY "update_interview_events" ON "public"."interview_events" FOR UPDATE TO "authenticated" USING (("employer_id" = "auth"."uid"())) WITH CHECK (("employer_id" = "auth"."uid"()));



CREATE POLICY "update_interview_slots" ON "public"."interview_slots" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "employer_id") OR ("auth"."uid"() = "booked_by"))) WITH CHECK ((("auth"."uid"() = "employer_id") OR ("auth"."uid"() = "booked_by")));



CREATE POLICY "update_interviews" ON "public"."interviews" FOR UPDATE TO "authenticated" USING ((("employer_id" = "auth"."uid"()) OR ("candidate_id" = "auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"))) WITH CHECK ((("employer_id" = "auth"."uid"()) OR ("candidate_id" = "auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")));



CREATE POLICY "update_jobs" ON "public"."jobs" FOR UPDATE TO "authenticated" USING ((("posted_by" = "auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"))) WITH CHECK ((("posted_by" = "auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")));



CREATE POLICY "update_meetings" ON "public"."meetings" FOR UPDATE TO "authenticated" USING ((("scheduled_by" = "auth"."uid"()) OR ("candidate_id" = "auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"))) WITH CHECK ((("scheduled_by" = "auth"."uid"()) OR ("candidate_id" = "auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")));



CREATE POLICY "update_messages" ON "public"."messages" FOR UPDATE TO "authenticated" USING ((("sender_id" = "auth"."uid"()) OR ("receiver_id" = "auth"."uid"()))) WITH CHECK ((("sender_id" = "auth"."uid"()) OR ("receiver_id" = "auth"."uid"())));



CREATE POLICY "update_notifications" ON "public"."notifications" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "update_own_application" ON "public"."applications" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "applicant_id") OR (EXISTS ( SELECT 1
   FROM "public"."jobs"
  WHERE (("jobs"."id" = "applications"."job_id") AND ("jobs"."employer_id" = "auth"."uid"())))))) WITH CHECK ((("auth"."uid"() = "applicant_id") OR (EXISTS ( SELECT 1
   FROM "public"."jobs"
  WHERE (("jobs"."id" = "applications"."job_id") AND ("jobs"."employer_id" = "auth"."uid"()))))));



CREATE POLICY "update_own_coach_sessions" ON "public"."career_coach_sessions" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "update_own_comment" ON "public"."post_comments" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "author_id")) WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "update_own_company" ON "public"."companies" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "owner_id")) WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "update_own_company_api_keys" ON "public"."api_keys" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "api_keys"."company_id") AND ("companies"."owner_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "api_keys"."company_id") AND ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "update_own_company_departments" ON "public"."departments" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "departments"."company_id") AND ("companies"."owner_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "departments"."company_id") AND ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "update_own_company_docs" ON "public"."knowledge_documents" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "knowledge_documents"."company_id") AND ("companies"."owner_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "knowledge_documents"."company_id") AND ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "update_own_connections" ON "public"."app_user_connections" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "update_own_conversations" ON "public"."ai_conversations" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "update_own_interviews" ON "public"."interviews" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."applications"
  WHERE (("applications"."id" = "interviews"."application_id") AND (("applications"."applicant_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."jobs"
          WHERE (("jobs"."id" = "applications"."job_id") AND ("jobs"."employer_id" = "auth"."uid"()))))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."applications"
  WHERE (("applications"."id" = "interviews"."application_id") AND (("applications"."applicant_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."jobs"
          WHERE (("jobs"."id" = "applications"."job_id") AND ("jobs"."employer_id" = "auth"."uid"())))))))));



CREATE POLICY "update_own_job" ON "public"."jobs" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "employer_id")) WITH CHECK (("auth"."uid"() = "employer_id"));



CREATE POLICY "update_own_matches" ON "public"."job_matches" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "update_own_messages_v2" ON "public"."messages" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "sender_id")) WITH CHECK (("auth"."uid"() = "sender_id"));



CREATE POLICY "update_own_notifications" ON "public"."notifications" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "update_own_payment" ON "public"."payments" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "update_own_post" ON "public"."posts" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "author_id")) WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "update_own_profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "update_own_progress" ON "public"."learning_progress" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "update_own_resumes" ON "public"."resumes" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "update_own_review" ON "public"."company_reviews" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "reviewer_id") OR (EXISTS ( SELECT 1
   FROM "public"."companies" "c"
  WHERE (("c"."id" = "company_reviews"."company_id") AND ("c"."owner_id" = "auth"."uid"())))))) WITH CHECK ((("auth"."uid"() = "reviewer_id") OR (EXISTS ( SELECT 1
   FROM "public"."companies" "c"
  WHERE (("c"."id" = "company_reviews"."company_id") AND ("c"."owner_id" = "auth"."uid"()))))));



CREATE POLICY "update_own_saved_jobs" ON "public"."saved_jobs" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "update_own_subscriptions" ON "public"."subscriptions" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "update_own_user_role" ON "public"."user_roles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "update_post_comments" ON "public"."post_comments" FOR UPDATE TO "authenticated" USING (("author_id" = "auth"."uid"())) WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "update_post_reports" ON "public"."post_reports" FOR UPDATE TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")) WITH CHECK ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "update_posts" ON "public"."posts" FOR UPDATE TO "authenticated" USING (("author_id" = "auth"."uid"())) WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "update_profiles" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "update_referrals" ON "public"."referrals" FOR UPDATE TO "authenticated" USING ((("referrer_id" = "auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"))) WITH CHECK ((("referrer_id" = "auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")));



CREATE POLICY "update_reports" ON "public"."reports" FOR UPDATE TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")) WITH CHECK ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "update_resumes" ON "public"."resumes" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "update_review_replies" ON "public"."review_replies" FOR UPDATE TO "authenticated" USING (("author_id" = "auth"."uid"())) WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "update_reviews" ON "public"."reviews" FOR UPDATE TO "authenticated" USING (("reviewer_id" = "auth"."uid"())) WITH CHECK (("reviewer_id" = "auth"."uid"()));



CREATE POLICY "update_support_tickets" ON "public"."support_tickets" FOR UPDATE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"))) WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")));



CREATE POLICY "update_user_roles" ON "public"."user_roles" FOR UPDATE TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")) WITH CHECK ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_profile_completion"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_profile_completion"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_profile_completion"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_link" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_link" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_assessment_questions"("_assessment_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_assessment_questions"("_assessment_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_assessment_questions"("_assessment_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_chat"("_user_a" "uuid", "_user_b" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_chat"("_user_a" "uuid", "_user_b" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_chat"("_user_a" "uuid", "_user_b" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_role"("_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"("_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"("_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_comment_notification"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_comment_notification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_comment_notification"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_like_notification"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_like_notification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_like_notification"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_message_notification"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_message_notification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_message_notification"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_role"("_role" "public"."app_role") TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("_role" "public"."app_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("_role" "public"."app_role") TO "service_role";



GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_job_applications"("job_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_job_applications"("job_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_job_applications"("job_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_job_views"("job_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_job_views"("job_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_job_views"("job_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_premium"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_premium"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_premium"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_audit_entry"("p_company_id" "uuid", "p_user_id" "uuid", "p_action" "text", "p_entity_type" "text", "p_entity_id" "uuid", "p_metadata" "jsonb", "p_ip_address" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_audit_entry"("p_company_id" "uuid", "p_user_id" "uuid", "p_action" "text", "p_entity_type" "text", "p_entity_id" "uuid", "p_metadata" "jsonb", "p_ip_address" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_audit_entry"("p_company_id" "uuid", "p_user_id" "uuid", "p_action" "text", "p_entity_type" "text", "p_entity_id" "uuid", "p_metadata" "jsonb", "p_ip_address" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_admins_contact_message"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_admins_contact_message"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_admins_contact_message"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_ticket_owner_reply"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_ticket_owner_reply"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_ticket_owner_reply"() TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_self_job_application"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_self_job_application"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_self_job_application"() TO "service_role";



GRANT ALL ON FUNCTION "public"."recompute_job_applications_count"("job_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."recompute_job_applications_count"("job_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."recompute_job_applications_count"("job_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_knowledge_base"("query_embedding" "public"."vector", "match_company_id" "uuid", "match_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_knowledge_base"("query_embedding" "public"."vector", "match_company_id" "uuid", "match_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_knowledge_base"("query_embedding" "public"."vector", "match_company_id" "uuid", "match_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_knowledge_base_text"("search_query" "text", "match_company_id" "uuid", "match_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_knowledge_base_text"("search_query" "text", "match_company_id" "uuid", "match_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_knowledge_base_text"("search_query" "text", "match_company_id" "uuid", "match_limit" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."submit_assessment"("_assessment_id" "uuid", "_answers" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."submit_assessment"("_assessment_id" "uuid", "_answers" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_assessment"("_assessment_id" "uuid", "_answers" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_application_seeker_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_application_seeker_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_application_seeker_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_job_application_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_job_application_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_job_application_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_conversation_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_conversation_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_conversation_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_set_department_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_set_department_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_set_department_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_set_kb_doc_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_set_kb_doc_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_set_kb_doc_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_application_status"("_application_id" "uuid", "_new_status" "public"."application_status", "_actor_id" "uuid", "_note" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_application_status"("_application_id" "uuid", "_new_status" "public"."application_status", "_actor_id" "uuid", "_note" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_application_status"("_application_id" "uuid", "_new_status" "public"."application_status", "_actor_id" "uuid", "_note" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_applications_count_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_applications_count_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_applications_count_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_blog_comments_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_blog_comments_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_blog_comments_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_blog_likes_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_blog_likes_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_blog_likes_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_comment_counters"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_comment_counters"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_comment_counters"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_comment_likes_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_comment_likes_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_comment_likes_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_company_rating"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_company_rating"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_company_rating"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_post_comments_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_post_comments_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_post_comments_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_post_counters"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_post_counters"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_post_counters"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_post_likes_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_post_likes_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_post_likes_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."activity_logs" TO "anon";
GRANT ALL ON TABLE "public"."activity_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_logs" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."admin_users" TO "anon";
GRANT ALL ON TABLE "public"."admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users" TO "service_role";



GRANT ALL ON TABLE "public"."ai_conversations" TO "anon";
GRANT ALL ON TABLE "public"."ai_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_conversations" TO "service_role";



GRANT ALL ON TABLE "public"."ai_messages" TO "anon";
GRANT ALL ON TABLE "public"."ai_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_messages" TO "service_role";



GRANT ALL ON TABLE "public"."ai_usage_log" TO "anon";
GRANT ALL ON TABLE "public"."ai_usage_log" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_usage_log" TO "service_role";



GRANT ALL ON TABLE "public"."api_keys" TO "anon";
GRANT ALL ON TABLE "public"."api_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."api_keys" TO "service_role";



GRANT ALL ON TABLE "public"."app_user_connections" TO "anon";
GRANT ALL ON TABLE "public"."app_user_connections" TO "authenticated";
GRANT ALL ON TABLE "public"."app_user_connections" TO "service_role";



GRANT ALL ON TABLE "public"."application_events" TO "anon";
GRANT ALL ON TABLE "public"."application_events" TO "authenticated";
GRANT ALL ON TABLE "public"."application_events" TO "service_role";



GRANT ALL ON TABLE "public"."applications" TO "anon";
GRANT ALL ON TABLE "public"."applications" TO "authenticated";
GRANT ALL ON TABLE "public"."applications" TO "service_role";



GRANT ALL ON TABLE "public"."assessment_attempts" TO "anon";
GRANT ALL ON TABLE "public"."assessment_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."assessment_attempts" TO "service_role";



GRANT ALL ON TABLE "public"."assessments" TO "anon";
GRANT ALL ON TABLE "public"."assessments" TO "authenticated";
GRANT ALL ON TABLE "public"."assessments" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."badges" TO "anon";
GRANT ALL ON TABLE "public"."badges" TO "authenticated";
GRANT ALL ON TABLE "public"."badges" TO "service_role";



GRANT ALL ON TABLE "public"."blog_comments" TO "anon";
GRANT ALL ON TABLE "public"."blog_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_comments" TO "service_role";



GRANT ALL ON TABLE "public"."blog_likes" TO "anon";
GRANT ALL ON TABLE "public"."blog_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_likes" TO "service_role";



GRANT ALL ON TABLE "public"."blogs" TO "anon";
GRANT ALL ON TABLE "public"."blogs" TO "authenticated";
GRANT ALL ON TABLE "public"."blogs" TO "service_role";



GRANT ALL ON TABLE "public"."bookmarks" TO "anon";
GRANT ALL ON TABLE "public"."bookmarks" TO "authenticated";
GRANT ALL ON TABLE "public"."bookmarks" TO "service_role";



GRANT ALL ON TABLE "public"."career_coach_sessions" TO "anon";
GRANT ALL ON TABLE "public"."career_coach_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."career_coach_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."chat_participants" TO "anon";
GRANT ALL ON TABLE "public"."chat_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_participants" TO "service_role";



GRANT ALL ON TABLE "public"."chats" TO "anon";
GRANT ALL ON TABLE "public"."chats" TO "authenticated";
GRANT ALL ON TABLE "public"."chats" TO "service_role";



GRANT ALL ON TABLE "public"."comment_likes" TO "anon";
GRANT ALL ON TABLE "public"."comment_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."comment_likes" TO "service_role";



GRANT ALL ON TABLE "public"."companies" TO "anon";
GRANT ALL ON TABLE "public"."companies" TO "authenticated";
GRANT ALL ON TABLE "public"."companies" TO "service_role";



GRANT ALL ON TABLE "public"."company_reviews" TO "anon";
GRANT ALL ON TABLE "public"."company_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."company_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."contact_messages" TO "anon";
GRANT ALL ON TABLE "public"."contact_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_messages" TO "service_role";



GRANT ALL ON TABLE "public"."department_members" TO "anon";
GRANT ALL ON TABLE "public"."department_members" TO "authenticated";
GRANT ALL ON TABLE "public"."department_members" TO "service_role";



GRANT ALL ON TABLE "public"."departments" TO "anon";
GRANT ALL ON TABLE "public"."departments" TO "authenticated";
GRANT ALL ON TABLE "public"."departments" TO "service_role";



GRANT ALL ON TABLE "public"."follows" TO "anon";
GRANT ALL ON TABLE "public"."follows" TO "authenticated";
GRANT ALL ON TABLE "public"."follows" TO "service_role";



GRANT ALL ON TABLE "public"."interview_events" TO "anon";
GRANT ALL ON TABLE "public"."interview_events" TO "authenticated";
GRANT ALL ON TABLE "public"."interview_events" TO "service_role";



GRANT ALL ON TABLE "public"."interview_slots" TO "anon";
GRANT ALL ON TABLE "public"."interview_slots" TO "authenticated";
GRANT ALL ON TABLE "public"."interview_slots" TO "service_role";



GRANT ALL ON TABLE "public"."interviews" TO "anon";
GRANT ALL ON TABLE "public"."interviews" TO "authenticated";
GRANT ALL ON TABLE "public"."interviews" TO "service_role";



GRANT ALL ON TABLE "public"."jagire" TO "anon";
GRANT ALL ON TABLE "public"."jagire" TO "authenticated";
GRANT ALL ON TABLE "public"."jagire" TO "service_role";



GRANT ALL ON SEQUENCE "public"."jagire_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."jagire_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."jagire_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."job_matches" TO "anon";
GRANT ALL ON TABLE "public"."job_matches" TO "authenticated";
GRANT ALL ON TABLE "public"."job_matches" TO "service_role";



GRANT ALL ON TABLE "public"."jobs" TO "anon";
GRANT ALL ON TABLE "public"."jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."jobs" TO "service_role";



GRANT ALL ON TABLE "public"."knowledge_chunks" TO "anon";
GRANT ALL ON TABLE "public"."knowledge_chunks" TO "authenticated";
GRANT ALL ON TABLE "public"."knowledge_chunks" TO "service_role";



GRANT ALL ON TABLE "public"."knowledge_documents" TO "anon";
GRANT ALL ON TABLE "public"."knowledge_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."knowledge_documents" TO "service_role";



GRANT ALL ON TABLE "public"."learning_courses" TO "anon";
GRANT ALL ON TABLE "public"."learning_courses" TO "authenticated";
GRANT ALL ON TABLE "public"."learning_courses" TO "service_role";



GRANT ALL ON TABLE "public"."learning_items" TO "anon";
GRANT ALL ON TABLE "public"."learning_items" TO "authenticated";
GRANT ALL ON TABLE "public"."learning_items" TO "service_role";



GRANT ALL ON TABLE "public"."learning_progress" TO "anon";
GRANT ALL ON TABLE "public"."learning_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."learning_progress" TO "service_role";



GRANT ALL ON TABLE "public"."learning_resources" TO "anon";
GRANT ALL ON TABLE "public"."learning_resources" TO "authenticated";
GRANT ALL ON TABLE "public"."learning_resources" TO "service_role";



GRANT ALL ON TABLE "public"."meetings" TO "anon";
GRANT ALL ON TABLE "public"."meetings" TO "authenticated";
GRANT ALL ON TABLE "public"."meetings" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."payment_verifications" TO "anon";
GRANT ALL ON TABLE "public"."payment_verifications" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_verifications" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."post_comments" TO "anon";
GRANT ALL ON TABLE "public"."post_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."post_comments" TO "service_role";



GRANT ALL ON TABLE "public"."post_likes" TO "anon";
GRANT ALL ON TABLE "public"."post_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."post_likes" TO "service_role";



GRANT ALL ON TABLE "public"."post_reports" TO "anon";
GRANT ALL ON TABLE "public"."post_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."post_reports" TO "service_role";



GRANT ALL ON TABLE "public"."post_saves" TO "anon";
GRANT ALL ON TABLE "public"."post_saves" TO "authenticated";
GRANT ALL ON TABLE "public"."post_saves" TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";



GRANT ALL ON TABLE "public"."referrals" TO "anon";
GRANT ALL ON TABLE "public"."referrals" TO "authenticated";
GRANT ALL ON TABLE "public"."referrals" TO "service_role";



GRANT ALL ON TABLE "public"."reports" TO "anon";
GRANT ALL ON TABLE "public"."reports" TO "authenticated";
GRANT ALL ON TABLE "public"."reports" TO "service_role";



GRANT ALL ON TABLE "public"."resumes" TO "anon";
GRANT ALL ON TABLE "public"."resumes" TO "authenticated";
GRANT ALL ON TABLE "public"."resumes" TO "service_role";



GRANT ALL ON TABLE "public"."review_replies" TO "anon";
GRANT ALL ON TABLE "public"."review_replies" TO "authenticated";
GRANT ALL ON TABLE "public"."review_replies" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."saved_jobs" TO "anon";
GRANT ALL ON TABLE "public"."saved_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."saved_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."support_tickets" TO "anon";
GRANT ALL ON TABLE "public"."support_tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."support_tickets" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







