/*
# Fix Critical RLS Vulnerabilities (part 2 — functions)

7. update_application_status: SECURITY DEFINER callable by anyone — any user can change any application status
8. SECURITY DEFINER trigger functions missing search_path
*/

-- ── 7. update_application_status: Add auth check to SECURITY DEFINER function
CREATE OR REPLACE FUNCTION public.update_application_status(
  _application_id uuid, _new_status public.application_status,
  _actor_id uuid DEFAULT NULL::uuid, _note text DEFAULT NULL::text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $function$
DECLARE
  v_app RECORD; v_event_type text; v_seeker_id uuid; v_actor uuid;
BEGIN
  v_actor := COALESCE(_actor_id, auth.uid());
  SELECT * INTO v_app FROM applications WHERE id = _application_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Application not found'; END IF;
  IF v_actor IS NULL THEN RAISE EXCEPTION 'Authorization required: no actor identified'; END IF;
  IF NOT (
    v_app.applicant_id = v_actor
    OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = v_app.job_id AND (j.employer_id = v_actor OR j.posted_by = v_actor))
    OR public.has_role(v_actor, 'admin'::public.app_role)
  ) THEN
    RAISE EXCEPTION 'Authorization failed: you can only update applications for your own jobs or your own application';
  END IF;
  v_seeker_id := COALESCE(v_app.seeker_id, v_app.applicant_id);
  UPDATE applications SET status = _new_status, updated_at = now() WHERE id = _application_id;
  v_event_type := CASE _new_status
    WHEN 'applied' THEN 'applied' WHEN 'viewed' THEN 'viewed' WHEN 'reviewing' THEN 'reviewing'
    WHEN 'shortlisted' THEN 'shortlisted' WHEN 'interview' THEN 'interview_scheduled'
    WHEN 'interview_scheduled' THEN 'interview_scheduled' WHEN 'interview_completed' THEN 'interview_completed'
    WHEN 'selected' THEN 'selected' WHEN 'rejected' THEN 'rejected' WHEN 'offer' THEN 'offer'
    WHEN 'withdrawn' THEN 'withdrawn' ELSE _new_status::text END;
  INSERT INTO application_events (application_id, event_type, message, actor_id)
  VALUES (_application_id, v_event_type, _note, v_actor);
  IF v_seeker_id IS NOT NULL THEN
    PERFORM create_notification(v_seeker_id, 'application',
      'Application ' || replace(v_event_type, '_', ' '),
      COALESCE(_note, 'Your application status has been updated to: ' || _new_status::text), '/applications');
  END IF;
END;
$function$;

-- ── 8. Fix SECURITY DEFINER trigger functions missing search_path
CREATE OR REPLACE FUNCTION public.handle_new_comment_notification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $function$
DECLARE post_owner_id UUID; commenter_name TEXT;
BEGIN
  SELECT author_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
  SELECT full_name INTO commenter_name FROM profiles WHERE id = NEW.author_id;
  IF post_owner_id IS NOT NULL AND post_owner_id != NEW.author_id THEN
    INSERT INTO notifications (user_id, type, title, message, link, data)
    VALUES (post_owner_id, 'comment',
      COALESCE(commenter_name, 'Someone') || ' commented on your post',
      COALESCE(NEW.content, NEW.body, 'Check out the comment'),
      '/feed#post-' || NEW.post_id,
      jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id, 'commenter_id', NEW.author_id));
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_like_notification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $function$
DECLARE post_owner_id UUID; liker_name TEXT;
BEGIN
  SELECT author_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
  SELECT full_name INTO liker_name FROM profiles WHERE id = NEW.user_id;
  IF post_owner_id IS NOT NULL AND post_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, title, message, link, data)
    VALUES (post_owner_id, 'post_like',
      COALESCE(liker_name, 'Someone') || ' liked your post',
      'Your post received a like', '/feed#post-' || NEW.post_id,
      jsonb_build_object('post_id', NEW.post_id, 'liker_id', NEW.user_id));
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_message_notification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $function$
DECLARE chat_record RECORD; recipient_id UUID; sender_name TEXT;
BEGIN
  SELECT * INTO chat_record FROM chats WHERE id = NEW.chat_id;
  IF chat_record.id IS NOT NULL THEN
    IF chat_record.user_a = NEW.sender_id THEN recipient_id := chat_record.user_b;
    ELSE recipient_id := chat_record.user_a; END IF;
    SELECT full_name INTO sender_name FROM profiles WHERE id = NEW.sender_id;
    IF recipient_id IS NOT NULL AND recipient_id != NEW.sender_id THEN
      INSERT INTO notifications (user_id, type, title, message, link, data)
      VALUES (recipient_id, 'message',
        'New message from ' || COALESCE(sender_name, 'Someone'),
        COALESCE(NEW.body, 'You have a new message'),
        '/messages?chat=' || NEW.chat_id,
        jsonb_build_object('chat_id', NEW.chat_id, 'sender_id', NEW.sender_id, 'message_id', NEW.id));
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_job_applications(job_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $function$
BEGIN
  UPDATE jobs SET applications_count = COALESCE(applications_count, 0) + 1 WHERE id = job_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_job_views(job_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $function$
BEGIN
  UPDATE jobs SET views_count = COALESCE(views_count, 0) + 1 WHERE id = job_id;
END;
$function$;