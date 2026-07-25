/*
# Complete Job Portal Schema - Part 2: RLS Policies

## Overview
Enables RLS on all new tables and adds/refreshes RLS policies across all tables.

## Security
- All new tables get RLS enabled with ownership-based policies
- Existing tables get policies refreshed (drop + recreate)
- Admin role gets elevated access via has_role() checks
- All policies use auth.uid() for ownership checks

## Tables Covered
- app_user_connections, interview_events, meetings, post_reports (new)
- interviews, notifications, posts, post_comments, post_likes, post_saves
- chats, messages, jobs, companies, blogs, assessments, assessment_attempts
- user_roles, support_tickets, saved_jobs, reports, resumes, profiles
- follows, referrals, categories, reviews, review_replies
*/

-- Enable RLS on new tables
ALTER TABLE app_user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- app_user_connections
DROP POLICY IF EXISTS "select_own_connections" ON app_user_connections;
CREATE POLICY "select_own_connections" ON app_user_connections FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_connections" ON app_user_connections;
CREATE POLICY "insert_own_connections" ON app_user_connections FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_connections" ON app_user_connections;
CREATE POLICY "update_own_connections" ON app_user_connections FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_connections" ON app_user_connections;
CREATE POLICY "delete_own_connections" ON app_user_connections FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- interview_events
DROP POLICY IF EXISTS "select_interview_events" ON interview_events;
CREATE POLICY "select_interview_events" ON interview_events FOR SELECT
  TO authenticated USING (
    employer_id = auth.uid() OR
    EXISTS (SELECT 1 FROM applications a WHERE a.id = application_id AND (a.seeker_id = auth.uid() OR a.applicant_id = auth.uid())) OR
    has_role(auth.uid(), 'admin'::app_role)
  );
DROP POLICY IF EXISTS "insert_interview_events" ON interview_events;
CREATE POLICY "insert_interview_events" ON interview_events FOR INSERT
  TO authenticated WITH CHECK (employer_id = auth.uid());
DROP POLICY IF EXISTS "update_interview_events" ON interview_events;
CREATE POLICY "update_interview_events" ON interview_events FOR UPDATE
  TO authenticated USING (employer_id = auth.uid()) WITH CHECK (employer_id = auth.uid());
DROP POLICY IF EXISTS "delete_interview_events" ON interview_events;
CREATE POLICY "delete_interview_events" ON interview_events FOR DELETE
  TO authenticated USING (employer_id = auth.uid());

-- meetings
DROP POLICY IF EXISTS "select_meetings" ON meetings;
CREATE POLICY "select_meetings" ON meetings FOR SELECT
  TO authenticated USING (
    scheduled_by = auth.uid() OR candidate_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)
  );
DROP POLICY IF EXISTS "insert_meetings" ON meetings;
CREATE POLICY "insert_meetings" ON meetings FOR INSERT
  TO authenticated WITH CHECK (scheduled_by = auth.uid());
DROP POLICY IF EXISTS "update_meetings" ON meetings;
CREATE POLICY "update_meetings" ON meetings FOR UPDATE
  TO authenticated USING (scheduled_by = auth.uid() OR candidate_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (scheduled_by = auth.uid() OR candidate_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "delete_meetings" ON meetings;
CREATE POLICY "delete_meetings" ON meetings FOR DELETE
  TO authenticated USING (scheduled_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- post_reports
DROP POLICY IF EXISTS "select_post_reports" ON post_reports;
CREATE POLICY "select_post_reports" ON post_reports FOR SELECT
  TO authenticated USING (reporter_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "insert_post_reports" ON post_reports;
CREATE POLICY "insert_post_reports" ON post_reports FOR INSERT
  TO authenticated WITH CHECK (reporter_id = auth.uid());
DROP POLICY IF EXISTS "update_post_reports" ON post_reports;
CREATE POLICY "update_post_reports" ON post_reports FOR UPDATE
  TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- interviews
DROP POLICY IF EXISTS "select_interviews" ON interviews;
CREATE POLICY "select_interviews" ON interviews FOR SELECT
  TO authenticated USING (
    employer_id = auth.uid() OR candidate_id = auth.uid() OR
    EXISTS (SELECT 1 FROM applications a WHERE a.id = interviews.application_id AND (a.seeker_id = auth.uid() OR a.applicant_id = auth.uid())) OR
    has_role(auth.uid(), 'admin'::app_role)
  );
DROP POLICY IF EXISTS "insert_interviews" ON interviews;
CREATE POLICY "insert_interviews" ON interviews FOR INSERT
  TO authenticated WITH CHECK (employer_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "update_interviews" ON interviews;
CREATE POLICY "update_interviews" ON interviews FOR UPDATE
  TO authenticated USING (employer_id = auth.uid() OR candidate_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (employer_id = auth.uid() OR candidate_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "delete_interviews" ON interviews;
CREATE POLICY "delete_interviews" ON interviews FOR DELETE
  TO authenticated USING (employer_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- notifications
DROP POLICY IF EXISTS "select_notifications" ON notifications;
CREATE POLICY "select_notifications" ON notifications FOR SELECT
  TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "insert_notifications" ON notifications;
CREATE POLICY "insert_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "update_notifications" ON notifications;
CREATE POLICY "update_notifications" ON notifications FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "delete_notifications" ON notifications;
CREATE POLICY "delete_notifications" ON notifications FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- posts
DROP POLICY IF EXISTS "select_posts" ON posts;
CREATE POLICY "select_posts" ON posts FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_posts" ON posts;
CREATE POLICY "insert_posts" ON posts FOR INSERT
  TO authenticated WITH CHECK (author_id = auth.uid());
DROP POLICY IF EXISTS "update_posts" ON posts;
CREATE POLICY "update_posts" ON posts FOR UPDATE
  TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
DROP POLICY IF EXISTS "delete_posts" ON posts;
CREATE POLICY "delete_posts" ON posts FOR DELETE
  TO authenticated USING (author_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- post_comments
DROP POLICY IF EXISTS "select_post_comments" ON post_comments;
CREATE POLICY "select_post_comments" ON post_comments FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_post_comments" ON post_comments;
CREATE POLICY "insert_post_comments" ON post_comments FOR INSERT
  TO authenticated WITH CHECK (author_id = auth.uid());
DROP POLICY IF EXISTS "update_post_comments" ON post_comments;
CREATE POLICY "update_post_comments" ON post_comments FOR UPDATE
  TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
DROP POLICY IF EXISTS "delete_post_comments" ON post_comments;
CREATE POLICY "delete_post_comments" ON post_comments FOR DELETE
  TO authenticated USING (author_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- post_likes
DROP POLICY IF EXISTS "select_post_likes" ON post_likes;
CREATE POLICY "select_post_likes" ON post_likes FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_post_likes" ON post_likes;
CREATE POLICY "insert_post_likes" ON post_likes FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "delete_post_likes" ON post_likes;
CREATE POLICY "delete_post_likes" ON post_likes FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- post_saves
DROP POLICY IF EXISTS "select_post_saves" ON post_saves;
CREATE POLICY "select_post_saves" ON post_saves FOR SELECT
  TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "insert_post_saves" ON post_saves;
CREATE POLICY "insert_post_saves" ON post_saves FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "delete_post_saves" ON post_saves;
CREATE POLICY "delete_post_saves" ON post_saves FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- chats
DROP POLICY IF EXISTS "select_chats" ON chats;
CREATE POLICY "select_chats" ON chats FOR SELECT
  TO authenticated USING (user_a = auth.uid() OR user_b = auth.uid());
DROP POLICY IF EXISTS "insert_chats" ON chats;
CREATE POLICY "insert_chats" ON chats FOR INSERT
  TO authenticated WITH CHECK (user_a = auth.uid() OR user_b = auth.uid());
DROP POLICY IF EXISTS "update_chats" ON chats;
CREATE POLICY "update_chats" ON chats FOR UPDATE
  TO authenticated USING (user_a = auth.uid() OR user_b = auth.uid())
  WITH CHECK (user_a = auth.uid() OR user_b = auth.uid());

-- messages
DROP POLICY IF EXISTS "select_messages" ON messages;
CREATE POLICY "select_messages" ON messages FOR SELECT
  TO authenticated USING (
    sender_id = auth.uid() OR receiver_id = auth.uid() OR
    EXISTS (SELECT 1 FROM chats c WHERE c.id = messages.chat_id AND (c.user_a = auth.uid() OR c.user_b = auth.uid()))
  );
DROP POLICY IF EXISTS "insert_messages" ON messages;
CREATE POLICY "insert_messages" ON messages FOR INSERT
  TO authenticated WITH CHECK (sender_id = auth.uid());
DROP POLICY IF EXISTS "update_messages" ON messages;
CREATE POLICY "update_messages" ON messages FOR UPDATE
  TO authenticated USING (sender_id = auth.uid() OR receiver_id = auth.uid())
  WITH CHECK (sender_id = auth.uid() OR receiver_id = auth.uid());

-- jobs
DROP POLICY IF EXISTS "select_jobs" ON jobs;
CREATE POLICY "select_jobs" ON jobs FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_jobs" ON jobs;
CREATE POLICY "insert_jobs" ON jobs FOR INSERT
  TO authenticated WITH CHECK (posted_by = auth.uid());
DROP POLICY IF EXISTS "update_jobs" ON jobs;
CREATE POLICY "update_jobs" ON jobs FOR UPDATE
  TO authenticated USING (posted_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (posted_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "delete_jobs" ON jobs;
CREATE POLICY "delete_jobs" ON jobs FOR DELETE
  TO authenticated USING (posted_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- companies
DROP POLICY IF EXISTS "select_companies" ON companies;
CREATE POLICY "select_companies" ON companies FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_companies" ON companies;
CREATE POLICY "insert_companies" ON companies FOR INSERT
  TO authenticated WITH CHECK (owner_id = auth.uid());
DROP POLICY IF EXISTS "update_companies" ON companies;
CREATE POLICY "update_companies" ON companies FOR UPDATE
  TO authenticated USING (owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "delete_companies" ON companies;
CREATE POLICY "delete_companies" ON companies FOR DELETE
  TO authenticated USING (owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- blogs
DROP POLICY IF EXISTS "select_blogs" ON blogs;
CREATE POLICY "select_blogs" ON blogs FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_blogs" ON blogs;
CREATE POLICY "insert_blogs" ON blogs FOR INSERT
  TO authenticated WITH CHECK (author_id = auth.uid());
DROP POLICY IF EXISTS "update_blogs" ON blogs;
CREATE POLICY "update_blogs" ON blogs FOR UPDATE
  TO authenticated USING (author_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (author_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "delete_blogs" ON blogs;
CREATE POLICY "delete_blogs" ON blogs FOR DELETE
  TO authenticated USING (author_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- assessments
DROP POLICY IF EXISTS "select_assessments" ON assessments;
CREATE POLICY "select_assessments" ON assessments FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_assessments" ON assessments;
CREATE POLICY "insert_assessments" ON assessments FOR INSERT
  TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR created_by = auth.uid());
DROP POLICY IF EXISTS "update_assessments" ON assessments;
CREATE POLICY "update_assessments" ON assessments FOR UPDATE
  TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR created_by = auth.uid())
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR created_by = auth.uid());
DROP POLICY IF EXISTS "delete_assessments" ON assessments;
CREATE POLICY "delete_assessments" ON assessments FOR DELETE
  TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR created_by = auth.uid());

-- assessment_attempts
DROP POLICY IF EXISTS "select_assessment_attempts" ON assessment_attempts;
CREATE POLICY "select_assessment_attempts" ON assessment_attempts FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "insert_assessment_attempts" ON assessment_attempts;
CREATE POLICY "insert_assessment_attempts" ON assessment_attempts FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

-- user_roles
DROP POLICY IF EXISTS "select_user_roles" ON user_roles;
CREATE POLICY "select_user_roles" ON user_roles FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "update_user_roles" ON user_roles;
CREATE POLICY "update_user_roles" ON user_roles FOR UPDATE
  TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "insert_user_roles" ON user_roles;
CREATE POLICY "insert_user_roles" ON user_roles FOR INSERT
  TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR user_id = auth.uid());

-- support_tickets
DROP POLICY IF EXISTS "select_support_tickets" ON support_tickets;
CREATE POLICY "select_support_tickets" ON support_tickets FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "insert_support_tickets" ON support_tickets;
CREATE POLICY "insert_support_tickets" ON support_tickets FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "update_support_tickets" ON support_tickets;
CREATE POLICY "update_support_tickets" ON support_tickets FOR UPDATE
  TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- saved_jobs
DROP POLICY IF EXISTS "select_saved_jobs" ON saved_jobs;
CREATE POLICY "select_saved_jobs" ON saved_jobs FOR SELECT
  TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "insert_saved_jobs" ON saved_jobs;
CREATE POLICY "insert_saved_jobs" ON saved_jobs FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "delete_saved_jobs" ON saved_jobs;
CREATE POLICY "delete_saved_jobs" ON saved_jobs FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- reports
DROP POLICY IF EXISTS "select_reports" ON reports;
CREATE POLICY "select_reports" ON reports FOR SELECT
  TO authenticated USING (reporter_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "insert_reports" ON reports;
CREATE POLICY "insert_reports" ON reports FOR INSERT
  TO authenticated WITH CHECK (reporter_id = auth.uid());
DROP POLICY IF EXISTS "update_reports" ON reports;
CREATE POLICY "update_reports" ON reports FOR UPDATE
  TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- resumes
DROP POLICY IF EXISTS "select_resumes" ON resumes;
CREATE POLICY "select_resumes" ON resumes FOR SELECT
  TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "insert_resumes" ON resumes;
CREATE POLICY "insert_resumes" ON resumes FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "update_resumes" ON resumes;
CREATE POLICY "update_resumes" ON resumes FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "delete_resumes" ON resumes;
CREATE POLICY "delete_resumes" ON resumes FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- profiles
DROP POLICY IF EXISTS "select_profiles" ON profiles;
CREATE POLICY "select_profiles" ON profiles FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_profiles" ON profiles;
CREATE POLICY "insert_profiles" ON profiles FOR INSERT
  TO authenticated WITH CHECK (id = auth.uid());
DROP POLICY IF EXISTS "update_profiles" ON profiles;
CREATE POLICY "update_profiles" ON profiles FOR UPDATE
  TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- follows
DROP POLICY IF EXISTS "select_follows" ON follows;
CREATE POLICY "select_follows" ON follows FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_follows" ON follows;
CREATE POLICY "insert_follows" ON follows FOR INSERT
  TO authenticated WITH CHECK (follower_id = auth.uid());
DROP POLICY IF EXISTS "delete_follows" ON follows;
CREATE POLICY "delete_follows" ON follows FOR DELETE
  TO authenticated USING (follower_id = auth.uid());

-- referrals
DROP POLICY IF EXISTS "select_referrals" ON referrals;
CREATE POLICY "select_referrals" ON referrals FOR SELECT
  TO authenticated USING (referrer_id = auth.uid() OR referred_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "insert_referrals" ON referrals;
CREATE POLICY "insert_referrals" ON referrals FOR INSERT
  TO authenticated WITH CHECK (referrer_id = auth.uid());
DROP POLICY IF EXISTS "update_referrals" ON referrals;
CREATE POLICY "update_referrals" ON referrals FOR UPDATE
  TO authenticated USING (referrer_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (referrer_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- categories
DROP POLICY IF EXISTS "select_categories" ON categories;
CREATE POLICY "select_categories" ON categories FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_categories" ON categories;
CREATE POLICY "insert_categories" ON categories FOR INSERT
  TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "update_categories" ON categories;
CREATE POLICY "update_categories" ON categories FOR UPDATE
  TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "delete_categories" ON categories;
CREATE POLICY "delete_categories" ON categories FOR DELETE
  TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- reviews
DROP POLICY IF EXISTS "select_reviews" ON reviews;
CREATE POLICY "select_reviews" ON reviews FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_reviews" ON reviews;
CREATE POLICY "insert_reviews" ON reviews FOR INSERT
  TO authenticated WITH CHECK (reviewer_id = auth.uid());
DROP POLICY IF EXISTS "update_reviews" ON reviews;
CREATE POLICY "update_reviews" ON reviews FOR UPDATE
  TO authenticated USING (reviewer_id = auth.uid()) WITH CHECK (reviewer_id = auth.uid());
DROP POLICY IF EXISTS "delete_reviews" ON reviews;
CREATE POLICY "delete_reviews" ON reviews FOR DELETE
  TO authenticated USING (reviewer_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- review_replies
DROP POLICY IF EXISTS "select_review_replies" ON review_replies;
CREATE POLICY "select_review_replies" ON review_replies FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_review_replies" ON review_replies;
CREATE POLICY "insert_review_replies" ON review_replies FOR INSERT
  TO authenticated WITH CHECK (author_id = auth.uid());
DROP POLICY IF EXISTS "update_review_replies" ON review_replies;
CREATE POLICY "update_review_replies" ON review_replies FOR UPDATE
  TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
DROP POLICY IF EXISTS "delete_review_replies" ON review_replies;
CREATE POLICY "delete_review_replies" ON review_replies FOR DELETE
  TO authenticated USING (author_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
