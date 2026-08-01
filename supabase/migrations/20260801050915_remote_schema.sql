drop extension if exists "pg_net";
drop trigger if exists "trg_apps_count" on "public"."applications";

drop trigger if exists "trg_apps_updated" on "public"."applications";

drop trigger if exists "trg_prevent_self_apply" on "public"."applications";

drop trigger if exists "trg_assessments_updated" on "public"."assessments";

drop trigger if exists "trg_blogs_updated" on "public"."blogs";

drop trigger if exists "trg_companies_updated" on "public"."companies";

drop trigger if exists "trg_jobs_updated" on "public"."jobs";

drop trigger if exists "trg_meetings_updated" on "public"."meetings";

drop trigger if exists "trg_post_comments_count" on "public"."post_comments";

drop trigger if exists "trg_post_likes_count" on "public"."post_likes";

drop trigger if exists "trg_posts_updated" on "public"."posts";

drop trigger if exists "ensure_referral_code" on "public"."profiles";

drop trigger if exists "trg_profiles_updated" on "public"."profiles";

drop trigger if exists "trg_referrals_updated" on "public"."referrals";

drop trigger if exists "trg_resumes_updated" on "public"."resumes";

drop trigger if exists "trg_tickets_updated" on "public"."support_tickets";

drop policy "Admins read logs" on "public"."activity_logs";

drop policy "Users can log own action" on "public"."activity_logs";

drop policy "Events viewable to app participants" on "public"."application_events";

drop policy "Participants can insert events" on "public"."application_events";

drop policy "Applicant delete own" on "public"."applications";

drop policy "Applicant or employer update" on "public"."applications";

drop policy "Applicants create own" on "public"."applications";

drop policy "Users create own attempts" on "public"."assessment_attempts";

drop policy "Users read own attempts" on "public"."assessment_attempts";

drop policy "Admins manage assessments" on "public"."assessments";

drop policy "Assessments viewable by authenticated" on "public"."assessments";

drop policy "badges own d" on "public"."badges";

drop policy "badges own w" on "public"."badges";

drop policy "badges read" on "public"."badges";

drop policy "Authors delete blogs" on "public"."blogs";

drop policy "Authors update blogs" on "public"."blogs";

drop policy "Authors write blogs" on "public"."blogs";

drop policy "Published blogs public" on "public"."blogs";

drop policy "delete_own_coach" on "public"."career_coach_sessions";

drop policy "insert_own_coach" on "public"."career_coach_sessions";

drop policy "select_own_coach" on "public"."career_coach_sessions";

drop policy "update_own_coach" on "public"."career_coach_sessions";

drop policy "Admins manage categories" on "public"."categories";

drop policy "Categories are public" on "public"."categories";

drop policy "Chat participants read" on "public"."chats";

drop policy "Chat participants update" on "public"."chats";

drop policy "Users start chats" on "public"."chats";

drop policy "Admins manage companies" on "public"."companies";

drop policy "Employers can create companies" on "public"."companies";

drop policy "Owners can delete companies" on "public"."companies";

drop policy "Owners can update companies" on "public"."companies";

drop policy "admin_delete_companies" on "public"."companies";

drop policy "admin_delete_contact_messages" on "public"."contact_messages";

drop policy "follows own d" on "public"."follows";

drop policy "follows own w" on "public"."follows";

drop policy "follows read" on "public"."follows";

drop policy "Employers manage their interview events" on "public"."interview_events";

drop policy "slots delete" on "public"."interview_slots";

drop policy "slots employer write" on "public"."interview_slots";

drop policy "slots read" on "public"."interview_slots";

drop policy "slots update" on "public"."interview_slots";

drop policy "Active jobs are public" on "public"."jobs";

drop policy "Employers post jobs for their company" on "public"."jobs";

drop policy "Poster can delete jobs" on "public"."jobs";

drop policy "Poster can update jobs" on "public"."jobs";

drop policy "learn admin write" on "public"."learning_items";

drop policy "learn read" on "public"."learning_items";

drop policy "lp own" on "public"."learning_progress";

drop policy "Employer schedules" on "public"."meetings";

drop policy "Meeting participants read" on "public"."meetings";

drop policy "Participants delete meeting" on "public"."meetings";

drop policy "Participants update meeting" on "public"."meetings";

drop policy "Messages visible to participants" on "public"."messages";

drop policy "Participants send messages" on "public"."messages";

drop policy "Read receipts by recipient" on "public"."messages";

drop policy "Own notifications delete" on "public"."notifications";

drop policy "Own notifications update" on "public"."notifications";

drop policy "Own notifications" on "public"."notifications";

drop policy "comm del own" on "public"."post_comments";

drop policy "comm insert" on "public"."post_comments";

drop policy "comm read" on "public"."post_comments";

drop policy "likes del own" on "public"."post_likes";

drop policy "likes own" on "public"."post_likes";

drop policy "likes read" on "public"."post_likes";

drop policy "saves own d" on "public"."post_saves";

drop policy "saves own read" on "public"."post_saves";

drop policy "saves own w" on "public"."post_saves";

drop policy "posts delete own" on "public"."posts";

drop policy "posts insert own" on "public"."posts";

drop policy "posts read" on "public"."posts";

drop policy "posts update own" on "public"."posts";

drop policy "Authenticated can read profile skills" on "public"."profile_skills";

drop policy "Own profile skills manage" on "public"."profile_skills";

drop policy "Admins can view all profiles" on "public"."profiles";

drop policy "Employers can view applicants profiles" on "public"."profiles";

drop policy "Users can view own profile" on "public"."profiles";

drop policy "admin_select_profiles" on "public"."profiles";

drop policy "Create own referrals" on "public"."referrals";

drop policy "Own referrals" on "public"."referrals";

drop policy "Update own referrals" on "public"."referrals";

drop policy "Employers view resumes of applicants" on "public"."resumes";

drop policy "Own resumes only" on "public"."resumes";

drop policy "reply company owner write" on "public"."review_replies";

drop policy "reply delete own" on "public"."review_replies";

drop policy "reply read" on "public"."review_replies";

drop policy "reply update own" on "public"."review_replies";

drop policy "Reviews public read" on "public"."reviews";

drop policy "Users create own reviews" on "public"."reviews";

drop policy "Users delete own reviews" on "public"."reviews";

drop policy "Users update own reviews" on "public"."reviews";

drop policy "Users manage own saved jobs" on "public"."saved_jobs";

drop policy "Admins manage skills" on "public"."skills";

drop policy "Authenticated can suggest skills" on "public"."skills";

drop policy "Skills are public" on "public"."skills";

drop policy "Admin update tickets" on "public"."support_tickets";

drop policy "Create own ticket" on "public"."support_tickets";

drop policy "Own tickets" on "public"."support_tickets";

drop policy "admin_delete_user_roles" on "public"."user_roles";

drop policy "admin_update_user_roles" on "public"."user_roles";

drop policy "Applicants view own applications" on "public"."applications";

drop policy "admin_select_contact_messages" on "public"."contact_messages";

drop policy "admin_select_subscriptions" on "public"."subscriptions";

drop policy "admin_update_subscriptions" on "public"."subscriptions";

drop policy "Users can view own roles" on "public"."user_roles";

revoke references on table "public"."profile_skills" from "anon";

revoke select on table "public"."profile_skills" from "anon";

revoke trigger on table "public"."profile_skills" from "anon";

revoke truncate on table "public"."profile_skills" from "anon";

revoke delete on table "public"."profile_skills" from "authenticated";

revoke insert on table "public"."profile_skills" from "authenticated";

revoke references on table "public"."profile_skills" from "authenticated";

revoke select on table "public"."profile_skills" from "authenticated";

revoke trigger on table "public"."profile_skills" from "authenticated";

revoke truncate on table "public"."profile_skills" from "authenticated";

revoke update on table "public"."profile_skills" from "authenticated";

revoke delete on table "public"."profile_skills" from "service_role";

revoke insert on table "public"."profile_skills" from "service_role";

revoke references on table "public"."profile_skills" from "service_role";

revoke select on table "public"."profile_skills" from "service_role";

revoke trigger on table "public"."profile_skills" from "service_role";

revoke truncate on table "public"."profile_skills" from "service_role";

revoke update on table "public"."profile_skills" from "service_role";

revoke references on table "public"."skills" from "anon";

revoke select on table "public"."skills" from "anon";

revoke trigger on table "public"."skills" from "anon";

revoke truncate on table "public"."skills" from "anon";

revoke insert on table "public"."skills" from "authenticated";

revoke references on table "public"."skills" from "authenticated";

revoke select on table "public"."skills" from "authenticated";

revoke trigger on table "public"."skills" from "authenticated";

revoke truncate on table "public"."skills" from "authenticated";

revoke delete on table "public"."skills" from "service_role";

revoke insert on table "public"."skills" from "service_role";

revoke references on table "public"."skills" from "service_role";

revoke select on table "public"."skills" from "service_role";

revoke trigger on table "public"."skills" from "service_role";

revoke truncate on table "public"."skills" from "service_role";

revoke update on table "public"."skills" from "service_role";

alter table "public"."app_user_connections" drop constraint "app_user_connections_user_connector_unique";

alter table "public"."application_events" drop constraint "application_events_actor_id_fkey";

alter table "public"."applications" drop constraint "applications_resume_fk";

alter table "public"."assessment_attempts" drop constraint "assessment_attempts_assessment_id_fkey";

alter table "public"."categories" drop constraint "categories_name_key";

alter table "public"."chats" drop constraint "chats_check";

alter table "public"."chats" drop constraint "chats_user_a_user_b_key";

alter table "public"."interview_slots" drop constraint "interview_slots_taken_by_fkey";

alter table "public"."jobs" drop constraint "jobs_category_id_fkey";

alter table "public"."jobs" drop constraint "jobs_company_id_slug_key";

alter table "public"."learning_progress" drop constraint "learning_progress_user_id_item_id_key";

alter table "public"."profile_skills" drop constraint "profile_skills_proficiency_check";

alter table "public"."profile_skills" drop constraint "profile_skills_profile_id_fkey";

alter table "public"."profile_skills" drop constraint "profile_skills_skill_id_fkey";

alter table "public"."reviews" drop constraint "reviews_company_id_reviewer_id_key";

alter table "public"."skills" drop constraint "skills_name_key";

alter table "public"."activity_logs" drop constraint "activity_logs_user_id_fkey";

alter table "public"."applications" drop constraint "applications_applicant_id_fkey";

alter table "public"."assessments" drop constraint "assessments_created_by_fkey";

alter table "public"."blogs" drop constraint "blogs_author_id_fkey";

alter table "public"."chats" drop constraint "chats_user_a_fkey";

alter table "public"."chats" drop constraint "chats_user_b_fkey";

alter table "public"."follows" drop constraint "follows_check";

alter table "public"."interview_slots" drop constraint "interview_slots_application_id_fkey";

alter table "public"."post_comments" drop constraint "post_comments_author_id_fkey";

alter table "public"."posts" drop constraint "posts_author_id_fkey";

alter table "public"."referrals" drop constraint "referrals_referred_user_id_fkey";

alter table "public"."referrals" drop constraint "referrals_referrer_id_fkey";

alter table "public"."review_replies" drop constraint "review_replies_author_id_fkey";

alter table "public"."reviews" drop constraint "reviews_reviewer_id_fkey";

drop view if exists "public"."assessments_catalog";

drop function if exists "public"."bump_job_applications_count"();

drop function if exists "public"."ensure_referral_code_on_insert"();

drop function if exists "public"."generate_referral_code"();

drop function if exists "public"."prevent_self_apply"();

drop function if exists "public"."process_referral_on_signup"();

drop function if exists "public"."tg_post_comments_count"();

drop function if exists "public"."tg_post_likes_count"();

drop view if exists "public"."admin_users";

drop function if exists "public"."submit_assessment"(_assessment_id uuid, _answers jsonb);

alter table "public"."assessments" drop constraint "assessments_pkey";

alter table "public"."profile_skills" drop constraint "profile_skills_pkey";

alter table "public"."skills" drop constraint "skills_pkey";

alter table "public"."follows" drop constraint "follows_pkey";

alter table "public"."post_likes" drop constraint "post_likes_pkey";

alter table "public"."post_saves" drop constraint "post_saves_pkey";

alter table "public"."saved_jobs" drop constraint "saved_jobs_pkey";

drop index if exists "public"."app_user_connections_user_connector_unique";

drop index if exists "public"."applications_unique_applicant_job";

drop index if exists "public"."assessments_pkey";

drop index if exists "public"."categories_name_key";

drop index if exists "public"."chats_user_a_user_b_key";

drop index if exists "public"."idx_activity_created";

drop index if exists "public"."idx_apps_applicant";

drop index if exists "public"."idx_apps_job";

drop index if exists "public"."idx_coach_user";

drop index if exists "public"."idx_jobs_category";

drop index if exists "public"."idx_jobs_status_created";

drop index if exists "public"."idx_messages_chat";

drop index if exists "public"."idx_notif_user";

drop index if exists "public"."idx_referrals_referrer";

drop index if exists "public"."jobs_company_id_slug_key";

drop index if exists "public"."learning_progress_user_id_item_id_key";

drop index if exists "public"."profile_skills_pkey";

drop index if exists "public"."reviews_company_id_reviewer_id_key";

drop index if exists "public"."skills_name_key";

drop index if exists "public"."skills_pkey";

drop index if exists "public"."follows_pkey";

drop index if exists "public"."post_likes_pkey";

drop index if exists "public"."post_saves_pkey";

drop index if exists "public"."saved_jobs_pkey";

drop table "public"."profile_skills";

drop table "public"."skills";

alter table "public"."applications" alter column "status" drop default;

alter table "public"."jobs" alter column "experience_level" drop default;

alter table "public"."jobs" alter column "job_type" drop default;

alter table "public"."jobs" alter column "status" drop default;

alter type "public"."app_role" rename to "app_role__old_version_to_be_dropped";

create type "public"."app_role" as enum ('seeker', 'employer', 'admin', 'job_seeker');

alter type "public"."application_status" rename to "application_status__old_version_to_be_dropped";

create type "public"."application_status" as enum ('applied', 'viewed', 'shortlisted', 'interview', 'selected', 'rejected', 'reviewing', 'interview_scheduled', 'interview_completed', 'offer', 'withdrawn');

alter type "public"."experience_level" rename to "experience_level__old_version_to_be_dropped";

create type "public"."experience_level" as enum ('entry', 'mid', 'senior', 'lead', 'junior', 'executive');

alter type "public"."job_status" rename to "job_status__old_version_to_be_dropped";

create type "public"."job_status" as enum ('draft', 'published', 'closed', 'active', 'paused');

alter type "public"."job_type" rename to "job_type__old_version_to_be_dropped";

create type "public"."job_type" as enum ('full_time', 'part_time', 'contract', 'internship', 'remote', 'freelance');


  create table "public"."blog_comments" (
    "id" uuid not null default gen_random_uuid(),
    "blog_id" uuid not null,
    "author_id" uuid not null default auth.uid(),
    "content" text not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."blog_comments" enable row level security;


  create table "public"."blog_likes" (
    "id" uuid not null default gen_random_uuid(),
    "blog_id" uuid not null,
    "user_id" uuid not null default auth.uid(),
    "created_at" timestamp with time zone default now()
      );


alter table "public"."blog_likes" enable row level security;


  create table "public"."bookmarks" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null default auth.uid(),
    "job_id" uuid not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."bookmarks" enable row level security;


  create table "public"."chat_participants" (
    "id" uuid not null default gen_random_uuid(),
    "chat_id" uuid,
    "user_id" uuid,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."chat_participants" enable row level security;


  create table "public"."comment_likes" (
    "id" uuid not null default gen_random_uuid(),
    "comment_id" uuid not null,
    "user_id" uuid not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."comment_likes" enable row level security;


  create table "public"."company_reviews" (
    "id" uuid not null default gen_random_uuid(),
    "company_id" uuid not null,
    "reviewer_id" uuid not null default auth.uid(),
    "rating" integer not null,
    "title" text not null,
    "body" text,
    "pros" text,
    "cons" text,
    "is_current_employee" boolean default false,
    "job_title" text,
    "employer_reply" text,
    "employer_replied_at" timestamp with time zone,
    "is_approved" boolean default true,
    "helpful_count" integer default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."company_reviews" enable row level security;


  create table "public"."interviews" (
    "id" uuid not null default gen_random_uuid(),
    "application_id" uuid not null,
    "scheduled_at" timestamp with time zone not null,
    "duration_minutes" integer default 60,
    "location" text,
    "meeting_link" text,
    "status" text default 'scheduled'::text,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "employer_id" uuid,
    "candidate_id" uuid,
    "candidate_email" text,
    "title" text default 'Interview'::text,
    "message" text,
    "accepted_at" timestamp with time zone,
    "declined_at" timestamp with time zone,
    "google_event_id" text,
    "meet_link" text,
    "updated_at" timestamp with time zone default now(),
    "job_id" uuid
      );


alter table "public"."interviews" enable row level security;


  create table "public"."jagire" (
    "id" bigint generated by default as identity not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."jagire" enable row level security;


  create table "public"."job_matches" (
    "id" uuid not null default gen_random_uuid(),
    "job_id" uuid not null,
    "user_id" uuid not null default auth.uid(),
    "overall_match" integer,
    "reasons" jsonb default '[]'::jsonb,
    "missing_skills" jsonb default '[]'::jsonb,
    "strengths" jsonb default '[]'::jsonb,
    "weaknesses" jsonb default '[]'::jsonb,
    "recommendations" jsonb default '[]'::jsonb,
    "ranking" integer,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."job_matches" enable row level security;


  create table "public"."learning_courses" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "description" text,
    "type" text not null,
    "category" text,
    "difficulty" text default 'beginner'::text,
    "url" text,
    "duration_minutes" integer,
    "thumbnail_url" text,
    "skills" jsonb default '[]'::jsonb,
    "provider" text,
    "is_featured" boolean default false,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."learning_courses" enable row level security;


  create table "public"."post_reports" (
    "id" uuid not null default gen_random_uuid(),
    "post_id" uuid not null,
    "reporter_id" uuid not null default auth.uid(),
    "reason" text not null,
    "details" text,
    "status" text not null default 'pending'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."post_reports" enable row level security;


  create table "public"."reports" (
    "id" uuid not null default gen_random_uuid(),
    "reporter_id" uuid not null default auth.uid(),
    "target_type" text not null,
    "target_id" uuid not null,
    "reason" text not null,
    "details" text,
    "status" text default 'pending'::text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."reports" enable row level security;

alter table "public"."applications" alter column status type "public"."application_status" using status::text::"public"."application_status";

alter table "public"."jobs" alter column experience_level type "public"."experience_level" using experience_level::text::"public"."experience_level";

alter table "public"."jobs" alter column job_type type "public"."job_type" using job_type::text::"public"."job_type";

alter table "public"."jobs" alter column status type "public"."job_status" using status::text::"public"."job_status";

alter table "public"."user_roles" alter column role type "public"."app_role" using role::text::"public"."app_role";

alter table "public"."applications" alter column "status" set default 'applied'::public.application_status;

alter table "public"."jobs" alter column "experience_level" set default 'mid'::public.experience_level;

alter table "public"."jobs" alter column "job_type" set default 'full_time'::public.job_type;

alter table "public"."jobs" alter column "status" set default 'active'::public.job_status;

drop type "public"."app_role__old_version_to_be_dropped";

drop type "public"."application_status__old_version_to_be_dropped";

drop type "public"."experience_level__old_version_to_be_dropped";

drop type "public"."job_status__old_version_to_be_dropped";

drop type "public"."job_type__old_version_to_be_dropped";

alter table "public"."activity_logs" drop column "ip_address";

alter table "public"."activity_logs" drop column "metadata";

alter table "public"."activity_logs" add column "details" jsonb default '{}'::jsonb;

alter table "public"."activity_logs" alter column "created_at" drop not null;

alter table "public"."activity_logs" alter column "user_id" set default auth.uid();

alter table "public"."activity_logs" alter column "user_id" set not null;

alter table "public"."app_user_connections" drop column "connection_key_ciphertext";

alter table "public"."app_user_connections" drop column "connector_id";

alter table "public"."app_user_connections" add column "access_token" text;

alter table "public"."app_user_connections" add column "metadata" jsonb default '{}'::jsonb;

alter table "public"."app_user_connections" add column "provider" text not null;

alter table "public"."app_user_connections" add column "refresh_token" text;

alter table "public"."app_user_connections" add column "scopes" text[];

alter table "public"."app_user_connections" add column "token_expires_at" timestamp with time zone;

alter table "public"."app_user_connections" alter column "created_at" drop not null;

alter table "public"."app_user_connections" alter column "updated_at" drop not null;

alter table "public"."app_user_connections" alter column "user_id" set default auth.uid();

alter table "public"."application_events" drop column "actor_id";

alter table "public"."application_events" drop column "note";

alter table "public"."application_events" drop column "status";

alter table "public"."application_events" add column "event_type" text not null;

alter table "public"."application_events" add column "message" text;

alter table "public"."application_events" alter column "created_at" drop not null;

alter table "public"."applications" add column "ai_match_data" jsonb;

alter table "public"."applications" add column "ai_match_score" integer;

alter table "public"."applications" add column "created_at" timestamp with time zone not null default now();

alter table "public"."applications" add column "match_breakdown" jsonb;

alter table "public"."applications" add column "seeker_id" uuid;

alter table "public"."applications" add column "status_text" text default 'pending'::text;

alter table "public"."applications" add column "timeline" jsonb not null default '[]'::jsonb;

alter table "public"."applications" alter column "applicant_id" drop not null;

alter table "public"."applications" alter column "applied_at" drop not null;

alter table "public"."applications" alter column "match_score" set data type numeric(5,2) using "match_score"::numeric(5,2);

alter table "public"."assessment_attempts" add column "completed_at" timestamp with time zone;

alter table "public"."assessment_attempts" add column "started_at" timestamp with time zone default now();

alter table "public"."assessment_attempts" add column "status" text not null default 'completed'::text;

alter table "public"."assessment_attempts" alter column "answers" drop default;

alter table "public"."assessment_attempts" alter column "answers" drop not null;

alter table "public"."assessment_attempts" alter column "assessment_id" drop not null;

alter table "public"."assessment_attempts" alter column "created_at" drop not null;

alter table "public"."assessment_attempts" alter column "score" drop default;

alter table "public"."assessment_attempts" alter column "score" drop not null;

alter table "public"."assessment_attempts" alter column "user_id" drop not null;

alter table "public"."assessments" add column "is_active" boolean default true;

alter table "public"."assessments" alter column "created_at" drop not null;

alter table "public"."assessments" alter column "difficulty" drop default;

alter table "public"."assessments" alter column "duration_minutes" drop default;

alter table "public"."assessments" alter column "passing_score" drop default;

alter table "public"."assessments" alter column "passing_score" drop not null;

alter table "public"."assessments" alter column "updated_at" drop not null;

alter table "public"."badges" add column "description" text;

alter table "public"."badges" add column "icon" text;

alter table "public"."badges" add column "points" integer default 0;

alter table "public"."badges" alter column "created_at" drop not null;

alter table "public"."badges" alter column "kind" drop not null;

alter table "public"."badges" alter column "user_id" drop not null;

alter table "public"."blogs" add column "category" text;

alter table "public"."blogs" add column "comments_count" integer default 0;

alter table "public"."blogs" add column "cover_image" text;

alter table "public"."blogs" add column "likes_count" integer default 0;

alter table "public"."blogs" add column "status" text default 'draft'::text;

alter table "public"."blogs" add column "views_count" integer default 0;

alter table "public"."blogs" alter column "author_id" drop not null;

alter table "public"."blogs" alter column "created_at" drop not null;

alter table "public"."blogs" alter column "published" drop not null;

alter table "public"."blogs" alter column "tags" drop default;

alter table "public"."blogs" alter column "updated_at" drop not null;

alter table "public"."career_coach_sessions" add column "title" text;

alter table "public"."career_coach_sessions" alter column "messages" drop not null;

alter table "public"."career_coach_sessions" alter column "user_id" drop default;

alter table "public"."career_coach_sessions" alter column "user_id" drop not null;

alter table "public"."categories" drop column "description";

alter table "public"."categories" drop column "icon";

alter table "public"."categories" alter column "created_at" drop not null;

alter table "public"."chats" add column "updated_at" timestamp with time zone default now();

alter table "public"."chats" alter column "created_at" drop not null;

alter table "public"."chats" alter column "last_message_at" set default now();

alter table "public"."chats" alter column "user_a" drop not null;

alter table "public"."chats" alter column "user_b" drop not null;

alter table "public"."companies" drop column "cover_url";

alter table "public"."companies" drop column "verified";

alter table "public"."companies" add column "banner_url" text;

alter table "public"."companies" add column "company_size" text default '1-10'::text;

alter table "public"."companies" add column "follower_count" integer default 0;

alter table "public"."companies" add column "hr_contact_email" text;

alter table "public"."companies" add column "hr_contact_name" text;

alter table "public"."companies" add column "hr_contact_phone" text;

alter table "public"."companies" add column "instagram_url" text;

alter table "public"."companies" add column "is_verified" boolean default false;

alter table "public"."companies" add column "linkedin_url" text;

alter table "public"."companies" add column "location" text;

alter table "public"."companies" add column "office_photos" jsonb default '[]'::jsonb;

alter table "public"."companies" add column "pan_number" text;

alter table "public"."companies" add column "rating_avg" numeric default 0;

alter table "public"."companies" add column "review_count" integer default 0;

alter table "public"."companies" add column "vat_number" text;

alter table "public"."companies" add column "verification_status" text default 'unverified'::text;

alter table "public"."companies" add column "work_model" text default 'on-site'::text;

alter table "public"."companies" alter column "benefits" set default '[]'::jsonb;

alter table "public"."companies" alter column "benefits" set data type jsonb using "benefits"::jsonb;

alter table "public"."companies" alter column "culture" set default '[]'::jsonb;

alter table "public"."companies" alter column "culture" set data type jsonb using "culture"::jsonb;

alter table "public"."companies" alter column "hiring_process" set default '[]'::jsonb;

alter table "public"."companies" alter column "hiring_process" set data type jsonb using "hiring_process"::jsonb;

alter table "public"."companies" alter column "locations" set default '[]'::jsonb;

alter table "public"."companies" alter column "locations" set data type jsonb using "locations"::jsonb;

alter table "public"."companies" alter column "technologies" set default '[]'::jsonb;

alter table "public"."companies" alter column "technologies" set data type jsonb using "technologies"::jsonb;

alter table "public"."contact_messages" alter column "created_at" set not null;

alter table "public"."follows" add column "company_id" uuid;

alter table "public"."follows" add column "id" uuid not null default gen_random_uuid();

alter table "public"."follows" alter column "created_at" drop not null;

alter table "public"."follows" alter column "follower_id" set default auth.uid();

alter table "public"."follows" alter column "following_id" drop not null;

alter table "public"."interview_events" add column "message" text;

alter table "public"."interview_events" alter column "candidate_email" drop not null;

alter table "public"."interview_events" alter column "created_at" drop not null;

alter table "public"."interview_events" alter column "title" set default 'Interview'::text;

alter table "public"."interview_slots" drop column "ends_at";

alter table "public"."interview_slots" drop column "meet_url";

alter table "public"."interview_slots" drop column "starts_at";

alter table "public"."interview_slots" drop column "taken_by";

alter table "public"."interview_slots" add column "booked_by" uuid;

alter table "public"."interview_slots" add column "calendar_event_id" text;

alter table "public"."interview_slots" add column "end_time" timestamp with time zone not null;

alter table "public"."interview_slots" add column "is_booked" boolean default false;

alter table "public"."interview_slots" add column "job_id" uuid not null;

alter table "public"."interview_slots" add column "meeting_link" text;

alter table "public"."interview_slots" add column "notes" text;

alter table "public"."interview_slots" add column "start_time" timestamp with time zone not null;

alter table "public"."interview_slots" alter column "created_at" drop not null;

alter table "public"."interview_slots" alter column "employer_id" set default auth.uid();

alter table "public"."jobs" add column "currency" text default 'USD'::text;

alter table "public"."jobs" add column "employer_id" uuid;

alter table "public"."jobs" add column "employment_type" text default 'full-time'::text;

alter table "public"."jobs" add column "featured_until" timestamp with time zone;

alter table "public"."jobs" add column "industry" text;

alter table "public"."jobs" add column "is_featured" boolean default false;

alter table "public"."jobs" add column "job_category" text;

alter table "public"."jobs" add column "keywords" jsonb default '[]'::jsonb;

alter table "public"."jobs" add column "requirements_list" jsonb default '[]'::jsonb;

alter table "public"."jobs" add column "salary_max_usd" integer;

alter table "public"."jobs" add column "salary_min_usd" integer;

alter table "public"."jobs" add column "skills" text[] not null default '{}'::text[];

alter table "public"."jobs" add column "skills_required" jsonb default '[]'::jsonb;

alter table "public"."jobs" add column "technologies" jsonb default '[]'::jsonb;

alter table "public"."jobs" alter column "required_skills" drop default;

alter table "public"."jobs" alter column "responsibilities" set default '[]'::jsonb;

alter table "public"."jobs" alter column "responsibilities" set data type jsonb using "responsibilities"::jsonb;

alter table "public"."jobs" alter column "salary_max" set data type integer using "salary_max"::integer;

alter table "public"."jobs" alter column "salary_min" set data type integer using "salary_min"::integer;

alter table "public"."jobs" alter column "slug" drop not null;

alter table "public"."jobs" alter column "status" set default 'published'::public.job_status;

alter table "public"."learning_items" add column "content" text;

alter table "public"."learning_items" add column "course_id" uuid;

alter table "public"."learning_items" add column "duration_minutes" integer;

alter table "public"."learning_items" add column "is_published" boolean default true;

alter table "public"."learning_items" add column "item_type" text default 'lesson'::text;

alter table "public"."learning_items" add column "order_index" integer default 0;

alter table "public"."learning_items" add column "updated_at" timestamp with time zone default now();

alter table "public"."learning_items" alter column "created_at" drop not null;

alter table "public"."learning_items" alter column "kind" set default 'lesson'::text;

alter table "public"."learning_items" alter column "kind" drop not null;

alter table "public"."learning_items" alter column "skills" drop default;

alter table "public"."learning_items" alter column "skills" drop not null;

alter table "public"."learning_items" alter column "url" drop not null;

alter table "public"."learning_progress" drop column "updated_at";

alter table "public"."learning_progress" add column "badges_earned" jsonb default '[]'::jsonb;

alter table "public"."learning_progress" add column "completed_at" timestamp with time zone;

alter table "public"."learning_progress" add column "course_id" uuid;

alter table "public"."learning_progress" add column "created_at" timestamp with time zone default now();

alter table "public"."learning_progress" add column "progress_percent" integer default 0;

alter table "public"."learning_progress" add column "score" integer;

alter table "public"."learning_progress" add column "started_at" timestamp with time zone;

alter table "public"."learning_progress" alter column "item_id" drop not null;

alter table "public"."learning_progress" alter column "progress" drop not null;

alter table "public"."learning_progress" alter column "status" set default 'not_started'::text;

alter table "public"."learning_progress" alter column "status" drop not null;

alter table "public"."learning_progress" alter column "user_id" set default auth.uid();

alter table "public"."meetings" alter column "candidate_id" drop not null;

alter table "public"."meetings" alter column "created_at" drop not null;

alter table "public"."meetings" alter column "duration_minutes" set default 60;

alter table "public"."meetings" alter column "status" set default 'scheduled'::text;

alter table "public"."meetings" alter column "status" set data type text using "status"::text;

alter table "public"."meetings" alter column "title" set default 'Interview'::text;

alter table "public"."meetings" alter column "updated_at" drop not null;

alter table "public"."messages" add column "attachment_name" text;

alter table "public"."messages" add column "conversation_id" uuid default gen_random_uuid();

alter table "public"."messages" add column "job_id" uuid;

alter table "public"."messages" add column "receiver_id" uuid;

alter table "public"."messages" add column "subject" text;

alter table "public"."messages" alter column "chat_id" drop not null;

alter table "public"."messages" alter column "created_at" drop not null;

alter table "public"."messages" alter column "sender_id" set default auth.uid();

alter table "public"."notifications" drop column "body";

alter table "public"."notifications" drop column "read";

alter table "public"."notifications" add column "data" jsonb default '{}'::jsonb;

alter table "public"."notifications" add column "message" text;

alter table "public"."notifications" alter column "created_at" drop not null;

alter table "public"."notifications" alter column "metadata" set default '{}'::jsonb;

alter table "public"."notifications" alter column "type" set data type text using "type"::text;

alter table "public"."notifications" alter column "user_id" set default auth.uid();

alter table "public"."payments" add column "currency" text default 'NPR'::text;

alter table "public"."payments" add column "esewa_ref_id" text;

alter table "public"."payments" add column "job_id" uuid;

alter table "public"."payments" add column "metadata" jsonb default '{}'::jsonb;

alter table "public"."payments" add column "plan_type" text;

alter table "public"."payments" add column "product_id" text;

alter table "public"."payments" add column "updated_at" timestamp with time zone default now();

alter table "public"."payments" alter column "amount" drop default;

alter table "public"."payments" alter column "amount" set not null;

alter table "public"."payments" alter column "user_id" set default auth.uid();

alter table "public"."payments" alter column "user_id" set not null;

alter table "public"."payments" enable row level security;

alter table "public"."post_comments" add column "body" text;

alter table "public"."post_comments" add column "likes_count" integer default 0;

alter table "public"."post_comments" add column "parent_id" uuid;

alter table "public"."post_comments" alter column "author_id" set default auth.uid();

alter table "public"."post_comments" alter column "content" drop not null;

alter table "public"."post_comments" alter column "created_at" drop not null;

alter table "public"."post_likes" add column "id" uuid not null default gen_random_uuid();

alter table "public"."post_likes" alter column "created_at" drop not null;

alter table "public"."post_likes" alter column "user_id" set default auth.uid();

alter table "public"."post_saves" add column "id" uuid not null default gen_random_uuid();

alter table "public"."post_saves" alter column "created_at" drop not null;

alter table "public"."post_saves" alter column "user_id" set default auth.uid();

alter table "public"."posts" add column "blog_content" text;

alter table "public"."posts" add column "body" text;

alter table "public"."posts" add column "is_published" boolean default true;

alter table "public"."posts" add column "media_urls" jsonb default '[]'::jsonb;

alter table "public"."posts" add column "shares_count" integer default 0;

alter table "public"."posts" add column "tags" jsonb default '[]'::jsonb;

alter table "public"."posts" add column "title" text;

alter table "public"."posts" add column "type" text not null default 'post'::text;

alter table "public"."posts" add column "views_count" integer default 0;

alter table "public"."posts" alter column "author_id" set default auth.uid();

alter table "public"."posts" alter column "comments_count" drop not null;

alter table "public"."posts" alter column "content" drop not null;

alter table "public"."posts" alter column "created_at" drop not null;

alter table "public"."posts" alter column "likes_count" drop not null;

alter table "public"."posts" alter column "updated_at" drop not null;

alter table "public"."profiles" drop column "ai_profile_data";

alter table "public"."profiles" drop column "onboarding_completed";

alter table "public"."profiles" drop column "preferred_job_type";

alter table "public"."profiles" add column "ats_score" integer default 0;

alter table "public"."profiles" add column "availability" text default 'open'::text;

alter table "public"."profiles" add column "awards" jsonb default '[]'::jsonb;

alter table "public"."profiles" add column "cover_letter" text;

alter table "public"."profiles" add column "current_company" text;

alter table "public"."profiles" add column "employment_type_preference" text default 'full-time'::text;

alter table "public"."profiles" add column "expected_salary_usd" integer;

alter table "public"."profiles" add column "followers_count" integer default 0;

alter table "public"."profiles" add column "following_count" integer default 0;

alter table "public"."profiles" add column "industry_preference" jsonb default '[]'::jsonb;

alter table "public"."profiles" add column "interests" jsonb default '[]'::jsonb;

alter table "public"."profiles" add column "is_admin" boolean default false;

alter table "public"."profiles" add column "is_premium" boolean default false;

alter table "public"."profiles" add column "job_type_preference" jsonb default '[]'::jsonb;

alter table "public"."profiles" add column "linkedin_imported" boolean default false;

alter table "public"."profiles" add column "notice_period" text;

alter table "public"."profiles" add column "overall_score" numeric default 0;

alter table "public"."profiles" add column "portfolio_url" text;

alter table "public"."profiles" add column "premium_expires_at" timestamp with time zone;

alter table "public"."profiles" add column "profile_completion" integer default 0;

alter table "public"."profiles" add column "profile_visibility" text default 'public'::text;

alter table "public"."profiles" add column "public_url" text;

alter table "public"."profiles" add column "recommendations" jsonb default '[]'::jsonb;

alter table "public"."profiles" add column "remote_preference" text default 'flexible'::text;

alter table "public"."profiles" add column "subscription_expires_at" timestamp with time zone;

alter table "public"."profiles" add column "subscription_plan" text;

alter table "public"."profiles" add column "subscription_status" text default 'inactive'::text;

alter table "public"."profiles" add column "technologies" jsonb default '[]'::jsonb;

alter table "public"."profiles" add column "twitter_url" text;

alter table "public"."profiles" add column "user_role" text not null default 'job_seeker'::text;

alter table "public"."profiles" add column "volunteer_experience" jsonb default '[]'::jsonb;

alter table "public"."profiles" add column "years_experience" integer default 0;

alter table "public"."profiles" alter column "certifications" drop not null;

alter table "public"."profiles" alter column "education" drop not null;

alter table "public"."profiles" alter column "expected_salary" set data type integer using "expected_salary"::integer;

alter table "public"."profiles" alter column "experience" drop not null;

alter table "public"."profiles" alter column "experience_years" drop default;

alter table "public"."profiles" alter column "languages" set default '[]'::jsonb;

alter table "public"."profiles" alter column "languages" set data type jsonb using "languages"::jsonb;

alter table "public"."profiles" alter column "projects" drop not null;

alter table "public"."profiles" alter column "skills" set default '[]'::jsonb;

alter table "public"."profiles" alter column "skills" drop not null;

alter table "public"."profiles" alter column "skills" set data type jsonb using "skills"::jsonb;

alter table "public"."referrals" drop column "code";

alter table "public"."referrals" drop column "referred_email";

alter table "public"."referrals" drop column "reward_credits";

alter table "public"."referrals" drop column "status";

alter table "public"."referrals" drop column "updated_at";

alter table "public"."referrals" alter column "created_at" drop not null;

alter table "public"."referrals" alter column "referrer_id" drop not null;

alter table "public"."resumes" add column "career_roadmap" jsonb;

alter table "public"."resumes" add column "file_type" text;

alter table "public"."resumes" add column "file_url" text;

alter table "public"."resumes" add column "is_active" boolean default true;

alter table "public"."resumes" add column "match_breakdown" jsonb;

alter table "public"."resumes" add column "parsed" jsonb default '{}'::jsonb;

alter table "public"."resumes" add column "raw_text" text;

alter table "public"."resumes" add column "scores" jsonb default '{}'::jsonb;

alter table "public"."resumes" add column "version" integer default 1;

alter table "public"."resumes" alter column "file_size" set data type bigint using "file_size"::bigint;

alter table "public"."resumes" alter column "is_default" set not null;

alter table "public"."resumes" alter column "suggestions" set default '[]'::jsonb;

alter table "public"."review_replies" add column "updated_at" timestamp with time zone default now();

alter table "public"."review_replies" add column "user_id" uuid;

alter table "public"."review_replies" alter column "author_id" drop not null;

alter table "public"."review_replies" alter column "created_at" drop not null;

alter table "public"."reviews" alter column "company_id" drop not null;

alter table "public"."reviews" alter column "created_at" drop not null;

alter table "public"."reviews" alter column "rating" drop not null;

alter table "public"."reviews" alter column "reviewer_id" drop not null;

alter table "public"."saved_jobs" add column "id" uuid not null default gen_random_uuid();

alter table "public"."support_tickets" drop column "notified_at";

alter table "public"."support_tickets" alter column "status" set default 'open'::text;

alter table "public"."support_tickets" alter column "status" set data type text using "status"::text;

alter table "public"."support_tickets" alter column "user_id" drop not null;

drop type "public"."meeting_status";

drop type "public"."notification_type";

drop type "public"."ticket_status";

CREATE UNIQUE INDEX app_user_connections_user_id_provider_key ON public.app_user_connections USING btree (user_id, provider);

CREATE INDEX applications_job_idx ON public.applications USING btree (job_id);

CREATE INDEX applications_seeker_idx ON public.applications USING btree (seeker_id);

CREATE UNIQUE INDEX assessments_catalog_pkey ON public.assessments USING btree (id);

CREATE UNIQUE INDEX blog_comments_pkey ON public.blog_comments USING btree (id);

CREATE UNIQUE INDEX blog_likes_blog_id_user_id_key ON public.blog_likes USING btree (blog_id, user_id);

CREATE UNIQUE INDEX blog_likes_pkey ON public.blog_likes USING btree (id);

CREATE UNIQUE INDEX bookmarks_pkey ON public.bookmarks USING btree (id);

CREATE UNIQUE INDEX bookmarks_user_id_job_id_key ON public.bookmarks USING btree (user_id, job_id);

CREATE UNIQUE INDEX chat_participants_chat_id_user_id_key ON public.chat_participants USING btree (chat_id, user_id);

CREATE UNIQUE INDEX chat_participants_pkey ON public.chat_participants USING btree (id);

CREATE UNIQUE INDEX comment_likes_comment_id_user_id_key ON public.comment_likes USING btree (comment_id, user_id);

CREATE UNIQUE INDEX comment_likes_pkey ON public.comment_likes USING btree (id);

CREATE UNIQUE INDEX company_reviews_pkey ON public.company_reviews USING btree (id);

CREATE UNIQUE INDEX follows_follower_id_following_id_company_id_key ON public.follows USING btree (follower_id, following_id, company_id);

CREATE INDEX idx_activity_logs_user_id ON public.activity_logs USING btree (user_id);

CREATE INDEX idx_api_keys_created_by ON public.api_keys USING btree (created_by);

CREATE INDEX idx_app_user_connections_user_id ON public.app_user_connections USING btree (user_id);

CREATE INDEX idx_application_events_application_id ON public.application_events USING btree (application_id);

CREATE INDEX idx_applications_applicant ON public.applications USING btree (applicant_id);

CREATE INDEX idx_applications_applicant_id ON public.applications USING btree (applicant_id);

CREATE INDEX idx_applications_job ON public.applications USING btree (job_id);

CREATE INDEX idx_applications_job_id ON public.applications USING btree (job_id);

CREATE INDEX idx_applications_resume_id ON public.applications USING btree (resume_id);

CREATE INDEX idx_applications_seeker ON public.applications USING btree (seeker_id);

CREATE INDEX idx_applications_seeker_id ON public.applications USING btree (seeker_id);

CREATE INDEX idx_applications_status ON public.applications USING btree (status);

CREATE INDEX idx_assessment_attempts_assessment_id ON public.assessment_attempts USING btree (assessment_id);

CREATE INDEX idx_assessment_attempts_user_id ON public.assessment_attempts USING btree (user_id);

CREATE INDEX idx_assessments_created_by ON public.assessments USING btree (created_by);

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);

CREATE INDEX idx_badges_user_id ON public.badges USING btree (user_id);

CREATE INDEX idx_blog_comments_author_id ON public.blog_comments USING btree (author_id);

CREATE INDEX idx_blog_comments_blog_id ON public.blog_comments USING btree (blog_id);

CREATE INDEX idx_blog_likes_blog_id ON public.blog_likes USING btree (blog_id);

CREATE INDEX idx_blog_likes_user_id ON public.blog_likes USING btree (user_id);

CREATE INDEX idx_blogs_author_id ON public.blogs USING btree (author_id);

CREATE INDEX idx_blogs_published ON public.blogs USING btree (published);

CREATE INDEX idx_blogs_slug ON public.blogs USING btree (slug);

CREATE INDEX idx_bookmarks_job_id ON public.bookmarks USING btree (job_id);

CREATE INDEX idx_bookmarks_user ON public.bookmarks USING btree (user_id);

CREATE INDEX idx_career_coach_sessions_user_id ON public.career_coach_sessions USING btree (user_id);

CREATE INDEX idx_chat_participants_user_id ON public.chat_participants USING btree (user_id);

CREATE INDEX idx_chats_user_a ON public.chats USING btree (user_a);

CREATE INDEX idx_chats_user_b ON public.chats USING btree (user_b);

CREATE INDEX idx_comment_likes_comment_id ON public.comment_likes USING btree (comment_id);

CREATE INDEX idx_comment_likes_user_id ON public.comment_likes USING btree (user_id);

CREATE INDEX idx_companies_owner ON public.companies USING btree (owner_id);

CREATE INDEX idx_companies_owner_id ON public.companies USING btree (owner_id);

CREATE INDEX idx_companies_slug ON public.companies USING btree (slug);

CREATE INDEX idx_departments_head_id ON public.departments USING btree (head_id);

CREATE INDEX idx_follows_company ON public.follows USING btree (company_id);

CREATE INDEX idx_follows_follower ON public.follows USING btree (follower_id);

CREATE INDEX idx_follows_following ON public.follows USING btree (following_id);

CREATE INDEX idx_interview_events_application_id ON public.interview_events USING btree (application_id);

CREATE INDEX idx_interview_events_employer_id ON public.interview_events USING btree (employer_id);

CREATE INDEX idx_interview_slots_application_id ON public.interview_slots USING btree (application_id);

CREATE INDEX idx_interview_slots_booked_by ON public.interview_slots USING btree (booked_by);

CREATE INDEX idx_interview_slots_employer ON public.interview_slots USING btree (employer_id);

CREATE INDEX idx_interview_slots_job ON public.interview_slots USING btree (job_id);

CREATE INDEX idx_interviews_application_id ON public.interviews USING btree (application_id);

CREATE INDEX idx_interviews_candidate_id ON public.interviews USING btree (candidate_id);

CREATE INDEX idx_interviews_employer_id ON public.interviews USING btree (employer_id);

CREATE INDEX idx_interviews_job_id ON public.interviews USING btree (job_id);

CREATE INDEX idx_interviews_scheduled_at ON public.interviews USING btree (scheduled_at);

CREATE INDEX idx_interviews_status ON public.interviews USING btree (status);

CREATE INDEX idx_job_matches_job ON public.job_matches USING btree (job_id);

CREATE INDEX idx_job_matches_user ON public.job_matches USING btree (user_id);

CREATE INDEX idx_jobs_company_id ON public.jobs USING btree (company_id);

CREATE INDEX idx_jobs_employer ON public.jobs USING btree (employer_id);

CREATE INDEX idx_jobs_posted_by ON public.jobs USING btree (posted_by);

CREATE INDEX idx_jobs_slug ON public.jobs USING btree (slug);

CREATE INDEX idx_jobs_status ON public.jobs USING btree (status);

CREATE INDEX idx_knowledge_documents_uploaded_by ON public.knowledge_documents USING btree (uploaded_by);

CREATE INDEX idx_learning_items_course_id ON public.learning_items USING btree (course_id);

CREATE INDEX idx_learning_progress_course_id ON public.learning_progress USING btree (course_id);

CREATE INDEX idx_learning_progress_item_id ON public.learning_progress USING btree (item_id);

CREATE INDEX idx_learning_progress_user ON public.learning_progress USING btree (user_id);

CREATE INDEX idx_meetings_application_id ON public.meetings USING btree (application_id);

CREATE INDEX idx_meetings_candidate_id ON public.meetings USING btree (candidate_id);

CREATE INDEX idx_meetings_scheduled_by ON public.meetings USING btree (scheduled_by);

CREATE INDEX idx_messages_chat_id ON public.messages USING btree (chat_id);

CREATE INDEX idx_messages_conversation ON public.messages USING btree (conversation_id, created_at);

CREATE INDEX idx_messages_job_id ON public.messages USING btree (job_id);

CREATE INDEX idx_messages_receiver_id ON public.messages USING btree (receiver_id);

CREATE INDEX idx_messages_receiver_read ON public.messages USING btree (receiver_id, is_read, read_at);

CREATE INDEX idx_messages_receiver_unread ON public.messages USING btree (receiver_id, is_read);

CREATE INDEX idx_messages_sender_id ON public.messages USING btree (sender_id);

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id, is_read);

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);

CREATE INDEX idx_notifications_user_unread ON public.notifications USING btree (user_id, is_read);

CREATE INDEX idx_payment_verifications_user ON public.payment_verifications USING btree (user_id);

CREATE INDEX idx_payment_verifications_uuid ON public.payment_verifications USING btree (transaction_uuid);

CREATE INDEX idx_payments_job_id ON public.payments USING btree (job_id);

CREATE INDEX idx_payments_status ON public.payments USING btree (status);

CREATE INDEX idx_payments_user ON public.payments USING btree (user_id);

CREATE INDEX idx_post_comments_parent_id ON public.post_comments USING btree (parent_id);

CREATE INDEX idx_post_comments_post ON public.post_comments USING btree (post_id);

CREATE INDEX idx_post_comments_post_id ON public.post_comments USING btree (post_id);

CREATE INDEX idx_post_likes_post ON public.post_likes USING btree (post_id);

CREATE INDEX idx_post_likes_post_id ON public.post_likes USING btree (post_id);

CREATE INDEX idx_post_likes_user_id ON public.post_likes USING btree (user_id);

CREATE INDEX idx_post_reports_reporter_id ON public.post_reports USING btree (reporter_id);

CREATE INDEX idx_post_saves_user ON public.post_saves USING btree (user_id);

CREATE INDEX idx_post_saves_user_id ON public.post_saves USING btree (user_id);

CREATE INDEX idx_posts_author ON public.posts USING btree (author_id);

CREATE INDEX idx_posts_author_id ON public.posts USING btree (author_id);

CREATE INDEX idx_posts_created ON public.posts USING btree (created_at DESC);

CREATE INDEX idx_posts_created_at ON public.posts USING btree (created_at DESC);

CREATE INDEX idx_profiles_role ON public.profiles USING btree (user_role);

CREATE INDEX idx_referrals_referred_user_id ON public.referrals USING btree (referred_user_id);

CREATE INDEX idx_referrals_referrer_id ON public.referrals USING btree (referrer_id);

CREATE INDEX idx_reports_reporter_id ON public.reports USING btree (reporter_id);

CREATE INDEX idx_reports_status ON public.reports USING btree (status);

CREATE INDEX idx_resumes_user ON public.resumes USING btree (user_id);

CREATE INDEX idx_review_replies_author_id ON public.review_replies USING btree (author_id);

CREATE INDEX idx_review_replies_review_id ON public.review_replies USING btree (review_id);

CREATE INDEX idx_review_replies_user_id ON public.review_replies USING btree (user_id);

CREATE INDEX idx_reviews_company ON public.company_reviews USING btree (company_id);

CREATE INDEX idx_reviews_company_id ON public.reviews USING btree (company_id);

CREATE INDEX idx_reviews_reviewer ON public.company_reviews USING btree (reviewer_id);

CREATE INDEX idx_reviews_reviewer_id ON public.reviews USING btree (reviewer_id);

CREATE INDEX idx_saved_jobs_job_id ON public.saved_jobs USING btree (job_id);

CREATE INDEX idx_saved_jobs_user ON public.saved_jobs USING btree (user_id);

CREATE INDEX idx_saved_jobs_user_id ON public.saved_jobs USING btree (user_id);

CREATE INDEX idx_subscriptions_user ON public.subscriptions USING btree (user_id);

CREATE INDEX idx_support_tickets_user_id ON public.support_tickets USING btree (user_id);

CREATE UNIQUE INDEX interviews_pkey ON public.interviews USING btree (id);

CREATE UNIQUE INDEX jagire_pkey ON public.jagire USING btree (id);

CREATE UNIQUE INDEX job_matches_job_id_user_id_key ON public.job_matches USING btree (job_id, user_id);

CREATE UNIQUE INDEX job_matches_pkey ON public.job_matches USING btree (id);

CREATE INDEX jobs_company_idx ON public.jobs USING btree (company_id);

CREATE UNIQUE INDEX jobs_slug_idx ON public.jobs USING btree (slug);

CREATE INDEX jobs_status_idx ON public.jobs USING btree (status);

CREATE UNIQUE INDEX learning_courses_pkey ON public.learning_courses USING btree (id);

CREATE UNIQUE INDEX learning_progress_user_id_course_id_key ON public.learning_progress USING btree (user_id, course_id);

CREATE INDEX messages_receiver_read_idx ON public.messages USING btree (receiver_id, is_read) WHERE (receiver_id IS NOT NULL);

CREATE UNIQUE INDEX payments_esewa_transaction_id_key ON public.payments USING btree (esewa_transaction_id);

CREATE UNIQUE INDEX post_likes_post_id_user_id_key ON public.post_likes USING btree (post_id, user_id);

CREATE UNIQUE INDEX post_reports_pkey ON public.post_reports USING btree (id);

CREATE UNIQUE INDEX post_reports_post_id_reporter_id_key ON public.post_reports USING btree (post_id, reporter_id);

CREATE UNIQUE INDEX post_saves_post_id_user_id_key ON public.post_saves USING btree (post_id, user_id);

CREATE UNIQUE INDEX reports_pkey ON public.reports USING btree (id);

CREATE UNIQUE INDEX saved_jobs_user_id_job_id_key ON public.saved_jobs USING btree (user_id, job_id);

CREATE UNIQUE INDEX follows_pkey ON public.follows USING btree (id);

CREATE UNIQUE INDEX post_likes_pkey ON public.post_likes USING btree (id);

CREATE UNIQUE INDEX post_saves_pkey ON public.post_saves USING btree (id);

CREATE UNIQUE INDEX saved_jobs_pkey ON public.saved_jobs USING btree (id);

alter table "public"."assessments" add constraint "assessments_catalog_pkey" PRIMARY KEY using index "assessments_catalog_pkey";

alter table "public"."blog_comments" add constraint "blog_comments_pkey" PRIMARY KEY using index "blog_comments_pkey";

alter table "public"."blog_likes" add constraint "blog_likes_pkey" PRIMARY KEY using index "blog_likes_pkey";

alter table "public"."bookmarks" add constraint "bookmarks_pkey" PRIMARY KEY using index "bookmarks_pkey";

alter table "public"."chat_participants" add constraint "chat_participants_pkey" PRIMARY KEY using index "chat_participants_pkey";

alter table "public"."comment_likes" add constraint "comment_likes_pkey" PRIMARY KEY using index "comment_likes_pkey";

alter table "public"."company_reviews" add constraint "company_reviews_pkey" PRIMARY KEY using index "company_reviews_pkey";

alter table "public"."interviews" add constraint "interviews_pkey" PRIMARY KEY using index "interviews_pkey";

alter table "public"."jagire" add constraint "jagire_pkey" PRIMARY KEY using index "jagire_pkey";

alter table "public"."job_matches" add constraint "job_matches_pkey" PRIMARY KEY using index "job_matches_pkey";

alter table "public"."learning_courses" add constraint "learning_courses_pkey" PRIMARY KEY using index "learning_courses_pkey";

alter table "public"."post_reports" add constraint "post_reports_pkey" PRIMARY KEY using index "post_reports_pkey";

alter table "public"."reports" add constraint "reports_pkey" PRIMARY KEY using index "reports_pkey";

alter table "public"."follows" add constraint "follows_pkey" PRIMARY KEY using index "follows_pkey";

alter table "public"."post_likes" add constraint "post_likes_pkey" PRIMARY KEY using index "post_likes_pkey";

alter table "public"."post_saves" add constraint "post_saves_pkey" PRIMARY KEY using index "post_saves_pkey";

alter table "public"."saved_jobs" add constraint "saved_jobs_pkey" PRIMARY KEY using index "saved_jobs_pkey";

alter table "public"."app_user_connections" add constraint "app_user_connections_user_id_provider_key" UNIQUE using index "app_user_connections_user_id_provider_key";

alter table "public"."applications" add constraint "applications_resume_id_fkey" FOREIGN KEY (resume_id) REFERENCES public.resumes(id) ON DELETE SET NULL not valid;

alter table "public"."applications" validate constraint "applications_resume_id_fkey";

alter table "public"."blog_comments" add constraint "blog_comments_author_id_fkey" FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."blog_comments" validate constraint "blog_comments_author_id_fkey";

alter table "public"."blog_comments" add constraint "blog_comments_blog_id_fkey" FOREIGN KEY (blog_id) REFERENCES public.blogs(id) ON DELETE CASCADE not valid;

alter table "public"."blog_comments" validate constraint "blog_comments_blog_id_fkey";

alter table "public"."blog_likes" add constraint "blog_likes_blog_id_fkey" FOREIGN KEY (blog_id) REFERENCES public.blogs(id) ON DELETE CASCADE not valid;

alter table "public"."blog_likes" validate constraint "blog_likes_blog_id_fkey";

alter table "public"."blog_likes" add constraint "blog_likes_blog_id_user_id_key" UNIQUE using index "blog_likes_blog_id_user_id_key";

alter table "public"."blog_likes" add constraint "blog_likes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."blog_likes" validate constraint "blog_likes_user_id_fkey";

alter table "public"."bookmarks" add constraint "bookmarks_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE not valid;

alter table "public"."bookmarks" validate constraint "bookmarks_job_id_fkey";

alter table "public"."bookmarks" add constraint "bookmarks_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."bookmarks" validate constraint "bookmarks_user_id_fkey";

alter table "public"."bookmarks" add constraint "bookmarks_user_id_job_id_key" UNIQUE using index "bookmarks_user_id_job_id_key";

alter table "public"."chat_participants" add constraint "chat_participants_chat_id_fkey" FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE not valid;

alter table "public"."chat_participants" validate constraint "chat_participants_chat_id_fkey";

alter table "public"."chat_participants" add constraint "chat_participants_chat_id_user_id_key" UNIQUE using index "chat_participants_chat_id_user_id_key";

alter table "public"."chat_participants" add constraint "chat_participants_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."chat_participants" validate constraint "chat_participants_user_id_fkey";

alter table "public"."comment_likes" add constraint "comment_likes_comment_id_fkey" FOREIGN KEY (comment_id) REFERENCES public.post_comments(id) ON DELETE CASCADE not valid;

alter table "public"."comment_likes" validate constraint "comment_likes_comment_id_fkey";

alter table "public"."comment_likes" add constraint "comment_likes_comment_id_user_id_key" UNIQUE using index "comment_likes_comment_id_user_id_key";

alter table "public"."comment_likes" add constraint "comment_likes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."comment_likes" validate constraint "comment_likes_user_id_fkey";

alter table "public"."companies" add constraint "companies_verification_status_check" CHECK ((verification_status = ANY (ARRAY['unverified'::text, 'pending'::text, 'verified'::text, 'rejected'::text]))) not valid;

alter table "public"."companies" validate constraint "companies_verification_status_check";

alter table "public"."companies" add constraint "companies_work_model_check" CHECK ((work_model = ANY (ARRAY['remote'::text, 'hybrid'::text, 'on-site'::text]))) not valid;

alter table "public"."companies" validate constraint "companies_work_model_check";

alter table "public"."company_reviews" add constraint "company_reviews_company_id_fkey" FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE not valid;

alter table "public"."company_reviews" validate constraint "company_reviews_company_id_fkey";

alter table "public"."company_reviews" add constraint "company_reviews_rating_check" CHECK (((rating >= 1) AND (rating <= 5))) not valid;

alter table "public"."company_reviews" validate constraint "company_reviews_rating_check";

alter table "public"."company_reviews" add constraint "company_reviews_reviewer_id_fkey" FOREIGN KEY (reviewer_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."company_reviews" validate constraint "company_reviews_reviewer_id_fkey";

alter table "public"."follows" add constraint "follows_company_id_fkey" FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE not valid;

alter table "public"."follows" validate constraint "follows_company_id_fkey";

alter table "public"."follows" add constraint "follows_follower_id_following_id_company_id_key" UNIQUE using index "follows_follower_id_following_id_company_id_key";

alter table "public"."interview_events" add constraint "interview_events_application_id_fkey" FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE not valid;

alter table "public"."interview_events" validate constraint "interview_events_application_id_fkey";

alter table "public"."interview_slots" add constraint "interview_slots_booked_by_fkey" FOREIGN KEY (booked_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."interview_slots" validate constraint "interview_slots_booked_by_fkey";

alter table "public"."interview_slots" add constraint "interview_slots_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE not valid;

alter table "public"."interview_slots" validate constraint "interview_slots_job_id_fkey";

alter table "public"."interviews" add constraint "interviews_application_id_fkey" FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE not valid;

alter table "public"."interviews" validate constraint "interviews_application_id_fkey";

alter table "public"."interviews" add constraint "interviews_candidate_id_fkey" FOREIGN KEY (candidate_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."interviews" validate constraint "interviews_candidate_id_fkey";

alter table "public"."interviews" add constraint "interviews_employer_id_fkey" FOREIGN KEY (employer_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."interviews" validate constraint "interviews_employer_id_fkey";

alter table "public"."interviews" add constraint "interviews_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE SET NULL not valid;

alter table "public"."interviews" validate constraint "interviews_job_id_fkey";

alter table "public"."interviews" add constraint "interviews_status_check" CHECK ((status = ANY (ARRAY['scheduled'::text, 'confirmed'::text, 'ongoing'::text, 'completed'::text, 'cancelled'::text, 'missed'::text, 'expired'::text, 'reschedule_requested'::text]))) not valid;

alter table "public"."interviews" validate constraint "interviews_status_check";

alter table "public"."job_matches" add constraint "job_matches_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE not valid;

alter table "public"."job_matches" validate constraint "job_matches_job_id_fkey";

alter table "public"."job_matches" add constraint "job_matches_job_id_user_id_key" UNIQUE using index "job_matches_job_id_user_id_key";

alter table "public"."job_matches" add constraint "job_matches_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."job_matches" validate constraint "job_matches_user_id_fkey";

alter table "public"."jobs" add constraint "jobs_employer_id_fkey" FOREIGN KEY (employer_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."jobs" validate constraint "jobs_employer_id_fkey";

alter table "public"."learning_courses" add constraint "learning_courses_difficulty_check" CHECK ((difficulty = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text]))) not valid;

alter table "public"."learning_courses" validate constraint "learning_courses_difficulty_check";

alter table "public"."learning_courses" add constraint "learning_courses_type_check" CHECK ((type = ANY (ARRAY['course'::text, 'video'::text, 'challenge'::text, 'interview_prep'::text]))) not valid;

alter table "public"."learning_courses" validate constraint "learning_courses_type_check";

alter table "public"."learning_items" add constraint "learning_items_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.learning_courses(id) ON DELETE CASCADE not valid;

alter table "public"."learning_items" validate constraint "learning_items_course_id_fkey";

alter table "public"."learning_progress" add constraint "learning_progress_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.learning_courses(id) ON DELETE CASCADE not valid;

alter table "public"."learning_progress" validate constraint "learning_progress_course_id_fkey";

alter table "public"."learning_progress" add constraint "learning_progress_status_check" CHECK ((status = ANY (ARRAY['not_started'::text, 'in_progress'::text, 'completed'::text]))) not valid;

alter table "public"."learning_progress" validate constraint "learning_progress_status_check";

alter table "public"."learning_progress" add constraint "learning_progress_user_id_course_id_key" UNIQUE using index "learning_progress_user_id_course_id_key";

alter table "public"."messages" add constraint "messages_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE SET NULL not valid;

alter table "public"."messages" validate constraint "messages_job_id_fkey";

alter table "public"."messages" add constraint "messages_receiver_id_fkey" FOREIGN KEY (receiver_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."messages" validate constraint "messages_receiver_id_fkey";

alter table "public"."payments" add constraint "payments_esewa_transaction_id_key" UNIQUE using index "payments_esewa_transaction_id_key";

alter table "public"."payments" add constraint "payments_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE SET NULL not valid;

alter table "public"."payments" validate constraint "payments_job_id_fkey";

alter table "public"."payments" add constraint "payments_plan_type_check" CHECK ((plan_type = ANY (ARRAY['premium_seeker'::text, 'featured_job'::text, 'employer_premium'::text]))) not valid;

alter table "public"."payments" validate constraint "payments_plan_type_check";

alter table "public"."payments" add constraint "payments_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'refunded'::text]))) not valid;

alter table "public"."payments" validate constraint "payments_status_check";

alter table "public"."post_comments" add constraint "post_comments_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES public.post_comments(id) ON DELETE CASCADE not valid;

alter table "public"."post_comments" validate constraint "post_comments_parent_id_fkey";

alter table "public"."post_likes" add constraint "post_likes_post_id_user_id_key" UNIQUE using index "post_likes_post_id_user_id_key";

alter table "public"."post_reports" add constraint "post_reports_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE not valid;

alter table "public"."post_reports" validate constraint "post_reports_post_id_fkey";

alter table "public"."post_reports" add constraint "post_reports_post_id_reporter_id_key" UNIQUE using index "post_reports_post_id_reporter_id_key";

alter table "public"."post_reports" add constraint "post_reports_reporter_id_fkey" FOREIGN KEY (reporter_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."post_reports" validate constraint "post_reports_reporter_id_fkey";

alter table "public"."post_saves" add constraint "post_saves_post_id_user_id_key" UNIQUE using index "post_saves_post_id_user_id_key";

alter table "public"."posts" add constraint "posts_type_check" CHECK ((type = ANY (ARRAY['post'::text, 'blog'::text, 'job_share'::text, 'article'::text]))) not valid;

alter table "public"."posts" validate constraint "posts_type_check";

alter table "public"."profiles" add constraint "profiles_availability_check" CHECK ((availability = ANY (ARRAY['open'::text, 'looking'::text, 'not_looking'::text, 'hired'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_availability_check";

alter table "public"."profiles" add constraint "profiles_profile_visibility_check" CHECK ((profile_visibility = ANY (ARRAY['public'::text, 'private'::text, 'employer_only'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_profile_visibility_check";

alter table "public"."profiles" add constraint "profiles_remote_preference_check" CHECK ((remote_preference = ANY (ARRAY['remote'::text, 'hybrid'::text, 'onsite'::text, 'flexible'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_remote_preference_check";

alter table "public"."profiles" add constraint "profiles_user_role_check" CHECK ((user_role = ANY (ARRAY['job_seeker'::text, 'employer'::text, 'admin'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_user_role_check";

alter table "public"."reports" add constraint "reports_reporter_id_fkey" FOREIGN KEY (reporter_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."reports" validate constraint "reports_reporter_id_fkey";

alter table "public"."reports" add constraint "reports_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'reviewing'::text, 'resolved'::text, 'dismissed'::text]))) not valid;

alter table "public"."reports" validate constraint "reports_status_check";

alter table "public"."reports" add constraint "reports_target_type_check" CHECK ((target_type = ANY (ARRAY['job'::text, 'company'::text, 'user'::text, 'application'::text]))) not valid;

alter table "public"."reports" validate constraint "reports_target_type_check";

alter table "public"."review_replies" add constraint "review_replies_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."review_replies" validate constraint "review_replies_user_id_fkey";

alter table "public"."saved_jobs" add constraint "saved_jobs_user_id_job_id_key" UNIQUE using index "saved_jobs_user_id_job_id_key";

alter table "public"."support_tickets" add constraint "support_tickets_status_check" CHECK ((status = ANY (ARRAY['open'::text, 'in_progress'::text, 'resolved'::text, 'closed'::text]))) not valid;

alter table "public"."support_tickets" validate constraint "support_tickets_status_check";

alter table "public"."activity_logs" add constraint "activity_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."activity_logs" validate constraint "activity_logs_user_id_fkey";

alter table "public"."applications" add constraint "applications_applicant_id_fkey" FOREIGN KEY (applicant_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."applications" validate constraint "applications_applicant_id_fkey";

alter table "public"."assessments" add constraint "assessments_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."assessments" validate constraint "assessments_created_by_fkey";

alter table "public"."blogs" add constraint "blogs_author_id_fkey" FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."blogs" validate constraint "blogs_author_id_fkey";

alter table "public"."chats" add constraint "chats_user_a_fkey" FOREIGN KEY (user_a) REFERENCES public.profiles(id) not valid;

alter table "public"."chats" validate constraint "chats_user_a_fkey";

alter table "public"."chats" add constraint "chats_user_b_fkey" FOREIGN KEY (user_b) REFERENCES public.profiles(id) not valid;

alter table "public"."chats" validate constraint "chats_user_b_fkey";

alter table "public"."follows" add constraint "follows_check" CHECK (((following_id IS NOT NULL) OR (company_id IS NOT NULL))) not valid;

alter table "public"."follows" validate constraint "follows_check";

alter table "public"."interview_slots" add constraint "interview_slots_application_id_fkey" FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE SET NULL not valid;

alter table "public"."interview_slots" validate constraint "interview_slots_application_id_fkey";

alter table "public"."post_comments" add constraint "post_comments_author_id_fkey" FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."post_comments" validate constraint "post_comments_author_id_fkey";

alter table "public"."posts" add constraint "posts_author_id_fkey" FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."posts" validate constraint "posts_author_id_fkey";

alter table "public"."referrals" add constraint "referrals_referred_user_id_fkey" FOREIGN KEY (referred_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."referrals" validate constraint "referrals_referred_user_id_fkey";

alter table "public"."referrals" add constraint "referrals_referrer_id_fkey" FOREIGN KEY (referrer_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."referrals" validate constraint "referrals_referrer_id_fkey";

alter table "public"."review_replies" add constraint "review_replies_author_id_fkey" FOREIGN KEY (author_id) REFERENCES public.profiles(id) not valid;

alter table "public"."review_replies" validate constraint "review_replies_author_id_fkey";

alter table "public"."reviews" add constraint "reviews_reviewer_id_fkey" FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id) not valid;

alter table "public"."reviews" validate constraint "reviews_reviewer_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.calculate_profile_completion(p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.create_notification(_user_id uuid, _type text, _title text, _message text DEFAULT NULL::text, _link text DEFAULT NULL::text, _metadata jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
v_id uuid;
BEGIN
INSERT INTO notifications (user_id, type, title, message, link, metadata)
VALUES (_user_id, _type, _title, _message, _link, COALESCE(_metadata, '{}'::jsonb))
RETURNING id INTO v_id;
RETURN v_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_or_create_chat(_user_a uuid, _user_b uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
SELECT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = _role);
$function$
;

CREATE OR REPLACE FUNCTION public.prevent_self_job_application()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.sync_application_seeker_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.seeker_id := NEW.applicant_id;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_application_status(_application_id uuid, _new_status public.application_status, _actor_id uuid DEFAULT NULL::uuid, _note text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_blog_comments_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_blog_likes_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_comment_counters()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_comment_likes_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_company_rating()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
UPDATE companies SET 
rating_avg = COALESCE((SELECT AVG(rating) FROM company_reviews WHERE company_id = COALESCE(NEW.company_id, OLD.company_id) AND is_approved = true), 0),
review_count = COALESCE((SELECT COUNT(*) FROM company_reviews WHERE company_id = COALESCE(NEW.company_id, OLD.company_id) AND is_approved = true), 0)
WHERE id = COALESCE(NEW.company_id, OLD.company_id);
RETURN COALESCE(NEW, OLD);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_post_comments_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_post_counters()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_post_likes_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$function$
;

create or replace view "public"."admin_users" as  SELECT p.id,
    p.full_name,
    p.headline,
    p.bio,
    p.avatar_url,
    p.location,
    p.created_at,
    p.updated_at,
    p.user_role,
    p.current_position,
    p.years_experience,
    p.current_company,
    p.preferred_location,
    p.remote_preference,
    p.expected_salary_usd,
    p.phone,
    p.email,
    p.website,
    p.portfolio_url,
    p.github_url,
    p.linkedin_url,
    p.twitter_url,
    p.skills,
    p.technologies,
    p.languages,
    p.education,
    p.experience,
    p.projects,
    p.certifications,
    p.cover_letter,
    p.availability,
    p.notice_period,
    p.employment_type_preference,
    p.job_type_preference,
    p.industry_preference,
    p.profile_completion,
    p.profile_visibility,
    p.public_url,
    p.is_admin,
    p.banner_url,
    p.followers_count,
    p.following_count,
    p.recommendations,
    p.volunteer_experience,
    p.awards,
    p.interests,
    p.is_premium,
    p.premium_expires_at,
    p.linkedin_imported,
    p.github_username,
    p.referral_code,
    p.experience_years,
    p.overall_score,
    p.about,
    p.expected_salary,
    p.ats_score,
    p.subscription_status,
    p.subscription_plan,
    p.subscription_expires_at,
    ur.role
   FROM (public.profiles p
     LEFT JOIN public.user_roles ur ON ((ur.user_id = p.id)));


CREATE OR REPLACE FUNCTION public.get_assessment_questions(_assessment_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
 RETURNS public.app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
SELECT role FROM user_roles WHERE user_id = _user_id LIMIT 1;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'seeker'));
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
SELECT EXISTS (SELECT 1 FROM user_roles WHERE user_id = _user_id AND role = _role);
$function$
;

CREATE OR REPLACE FUNCTION public.is_premium()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
SELECT EXISTS (
SELECT 1 FROM subscriptions
WHERE user_id = auth.uid()
AND status = 'active'
AND payment_status = 'paid'
AND (expires_at IS NULL OR expires_at > now())
);
$function$
;

CREATE OR REPLACE FUNCTION public.log_audit_entry(p_company_id uuid, p_user_id uuid, p_action text, p_entity_type text DEFAULT ''::text, p_entity_id uuid DEFAULT NULL::uuid, p_metadata jsonb DEFAULT '{}'::jsonb, p_ip_address text DEFAULT ''::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
log_id uuid;
BEGIN
INSERT INTO audit_logs (company_id, user_id, action, entity_type, entity_id, metadata, ip_address)
VALUES (p_company_id, p_user_id, p_action, p_entity_type, p_entity_id, p_metadata, p_ip_address)
RETURNING id INTO log_id;
RETURN log_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_admins_contact_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.notify_ticket_owner_reply()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
-- Only fire when admin_reply changes from null to a value
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
$function$
;

CREATE OR REPLACE FUNCTION public.search_knowledge_base(query_embedding public.vector, match_company_id uuid, match_limit integer DEFAULT 5)
 RETURNS TABLE(content text, document_id uuid, document_title text, similarity double precision, chunk_index integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
RETURN QUERY
SELECT
kc.content,
kc.document_id,
kd.title AS document_title,
1 - (kc.embedding <=> query_embedding) AS similarity,
kc.chunk_index
FROM knowledge_chunks kc
INNER JOIN knowledge_documents kd ON kd.id = kc.document_id
WHERE kc.company_id = match_company_id
AND kc.embedding IS NOT NULL
AND kd.status = 'ready'
ORDER BY kc.embedding <=> query_embedding
LIMIT match_limit;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.search_knowledge_base_text(search_query text, match_company_id uuid, match_limit integer DEFAULT 5)
 RETURNS TABLE(content text, document_id uuid, document_title text, similarity double precision, chunk_index integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
RETURN QUERY
SELECT
kc.content,
kc.document_id,
kd.title AS document_title,
similarity(search_query, kc.content) AS similarity,
kc.chunk_index
FROM knowledge_chunks kc
INNER JOIN knowledge_documents kd ON kd.id = kc.document_id
WHERE kc.company_id = match_company_id
AND kd.status = 'ready'
AND kc.content % search_query
ORDER BY similarity(search_query, kc.content) DESC
LIMIT match_limit;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.submit_assessment(_assessment_id uuid, _answers jsonb)
 RETURNS TABLE(passed boolean, score integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.touch_conversation_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
UPDATE ai_conversations SET updated_at = now() WHERE id = NEW.conversation_id;
RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_set_department_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_set_kb_doc_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$function$
;

grant delete on table "public"."activity_logs" to "anon";

grant insert on table "public"."activity_logs" to "anon";

grant select on table "public"."activity_logs" to "anon";

grant update on table "public"."activity_logs" to "anon";

grant delete on table "public"."activity_logs" to "authenticated";

grant insert on table "public"."activity_logs" to "authenticated";

grant update on table "public"."activity_logs" to "authenticated";

grant delete on table "public"."ai_conversations" to "anon";

grant insert on table "public"."ai_conversations" to "anon";

grant select on table "public"."ai_conversations" to "anon";

grant update on table "public"."ai_conversations" to "anon";

grant delete on table "public"."ai_conversations" to "authenticated";

grant insert on table "public"."ai_conversations" to "authenticated";

grant select on table "public"."ai_conversations" to "authenticated";

grant update on table "public"."ai_conversations" to "authenticated";

grant delete on table "public"."ai_conversations" to "service_role";

grant insert on table "public"."ai_conversations" to "service_role";

grant select on table "public"."ai_conversations" to "service_role";

grant update on table "public"."ai_conversations" to "service_role";

grant delete on table "public"."ai_messages" to "anon";

grant insert on table "public"."ai_messages" to "anon";

grant select on table "public"."ai_messages" to "anon";

grant update on table "public"."ai_messages" to "anon";

grant delete on table "public"."ai_messages" to "authenticated";

grant insert on table "public"."ai_messages" to "authenticated";

grant select on table "public"."ai_messages" to "authenticated";

grant update on table "public"."ai_messages" to "authenticated";

grant delete on table "public"."ai_messages" to "service_role";

grant insert on table "public"."ai_messages" to "service_role";

grant select on table "public"."ai_messages" to "service_role";

grant update on table "public"."ai_messages" to "service_role";

grant delete on table "public"."ai_usage_log" to "anon";

grant insert on table "public"."ai_usage_log" to "anon";

grant select on table "public"."ai_usage_log" to "anon";

grant update on table "public"."ai_usage_log" to "anon";

grant delete on table "public"."ai_usage_log" to "authenticated";

grant insert on table "public"."ai_usage_log" to "authenticated";

grant select on table "public"."ai_usage_log" to "authenticated";

grant update on table "public"."ai_usage_log" to "authenticated";

grant delete on table "public"."ai_usage_log" to "service_role";

grant insert on table "public"."ai_usage_log" to "service_role";

grant select on table "public"."ai_usage_log" to "service_role";

grant update on table "public"."ai_usage_log" to "service_role";

grant delete on table "public"."api_keys" to "anon";

grant insert on table "public"."api_keys" to "anon";

grant select on table "public"."api_keys" to "anon";

grant update on table "public"."api_keys" to "anon";

grant delete on table "public"."api_keys" to "authenticated";

grant insert on table "public"."api_keys" to "authenticated";

grant select on table "public"."api_keys" to "authenticated";

grant update on table "public"."api_keys" to "authenticated";

grant delete on table "public"."api_keys" to "service_role";

grant insert on table "public"."api_keys" to "service_role";

grant select on table "public"."api_keys" to "service_role";

grant update on table "public"."api_keys" to "service_role";

grant delete on table "public"."app_user_connections" to "anon";

grant insert on table "public"."app_user_connections" to "anon";

grant select on table "public"."app_user_connections" to "anon";

grant update on table "public"."app_user_connections" to "anon";

grant delete on table "public"."app_user_connections" to "authenticated";

grant insert on table "public"."app_user_connections" to "authenticated";

grant select on table "public"."app_user_connections" to "authenticated";

grant update on table "public"."app_user_connections" to "authenticated";

grant delete on table "public"."app_user_connections" to "service_role";

grant insert on table "public"."app_user_connections" to "service_role";

grant select on table "public"."app_user_connections" to "service_role";

grant update on table "public"."app_user_connections" to "service_role";

grant delete on table "public"."application_events" to "anon";

grant insert on table "public"."application_events" to "anon";

grant select on table "public"."application_events" to "anon";

grant update on table "public"."application_events" to "anon";

grant delete on table "public"."application_events" to "authenticated";

grant update on table "public"."application_events" to "authenticated";

grant delete on table "public"."applications" to "anon";

grant insert on table "public"."applications" to "anon";

grant select on table "public"."applications" to "anon";

grant update on table "public"."applications" to "anon";

grant delete on table "public"."assessment_attempts" to "anon";

grant insert on table "public"."assessment_attempts" to "anon";

grant select on table "public"."assessment_attempts" to "anon";

grant update on table "public"."assessment_attempts" to "anon";

grant delete on table "public"."assessment_attempts" to "authenticated";

grant update on table "public"."assessment_attempts" to "authenticated";

grant delete on table "public"."assessments" to "anon";

grant insert on table "public"."assessments" to "anon";

grant select on table "public"."assessments" to "anon";

grant update on table "public"."assessments" to "anon";

grant delete on table "public"."audit_logs" to "anon";

grant insert on table "public"."audit_logs" to "anon";

grant select on table "public"."audit_logs" to "anon";

grant update on table "public"."audit_logs" to "anon";

grant delete on table "public"."audit_logs" to "authenticated";

grant insert on table "public"."audit_logs" to "authenticated";

grant select on table "public"."audit_logs" to "authenticated";

grant update on table "public"."audit_logs" to "authenticated";

grant delete on table "public"."audit_logs" to "service_role";

grant insert on table "public"."audit_logs" to "service_role";

grant select on table "public"."audit_logs" to "service_role";

grant update on table "public"."audit_logs" to "service_role";

grant delete on table "public"."badges" to "anon";

grant insert on table "public"."badges" to "anon";

grant select on table "public"."badges" to "anon";

grant update on table "public"."badges" to "anon";

grant update on table "public"."badges" to "authenticated";

grant delete on table "public"."blog_comments" to "anon";

grant insert on table "public"."blog_comments" to "anon";

grant references on table "public"."blog_comments" to "anon";

grant select on table "public"."blog_comments" to "anon";

grant trigger on table "public"."blog_comments" to "anon";

grant truncate on table "public"."blog_comments" to "anon";

grant update on table "public"."blog_comments" to "anon";

grant delete on table "public"."blog_comments" to "authenticated";

grant insert on table "public"."blog_comments" to "authenticated";

grant references on table "public"."blog_comments" to "authenticated";

grant select on table "public"."blog_comments" to "authenticated";

grant trigger on table "public"."blog_comments" to "authenticated";

grant truncate on table "public"."blog_comments" to "authenticated";

grant update on table "public"."blog_comments" to "authenticated";

grant delete on table "public"."blog_comments" to "service_role";

grant insert on table "public"."blog_comments" to "service_role";

grant references on table "public"."blog_comments" to "service_role";

grant select on table "public"."blog_comments" to "service_role";

grant trigger on table "public"."blog_comments" to "service_role";

grant truncate on table "public"."blog_comments" to "service_role";

grant update on table "public"."blog_comments" to "service_role";

grant delete on table "public"."blog_likes" to "anon";

grant insert on table "public"."blog_likes" to "anon";

grant references on table "public"."blog_likes" to "anon";

grant select on table "public"."blog_likes" to "anon";

grant trigger on table "public"."blog_likes" to "anon";

grant truncate on table "public"."blog_likes" to "anon";

grant update on table "public"."blog_likes" to "anon";

grant delete on table "public"."blog_likes" to "authenticated";

grant insert on table "public"."blog_likes" to "authenticated";

grant references on table "public"."blog_likes" to "authenticated";

grant select on table "public"."blog_likes" to "authenticated";

grant trigger on table "public"."blog_likes" to "authenticated";

grant truncate on table "public"."blog_likes" to "authenticated";

grant update on table "public"."blog_likes" to "authenticated";

grant delete on table "public"."blog_likes" to "service_role";

grant insert on table "public"."blog_likes" to "service_role";

grant references on table "public"."blog_likes" to "service_role";

grant select on table "public"."blog_likes" to "service_role";

grant trigger on table "public"."blog_likes" to "service_role";

grant truncate on table "public"."blog_likes" to "service_role";

grant update on table "public"."blog_likes" to "service_role";

grant delete on table "public"."blogs" to "anon";

grant insert on table "public"."blogs" to "anon";

grant update on table "public"."blogs" to "anon";

grant delete on table "public"."bookmarks" to "anon";

grant insert on table "public"."bookmarks" to "anon";

grant references on table "public"."bookmarks" to "anon";

grant select on table "public"."bookmarks" to "anon";

grant trigger on table "public"."bookmarks" to "anon";

grant truncate on table "public"."bookmarks" to "anon";

grant update on table "public"."bookmarks" to "anon";

grant delete on table "public"."bookmarks" to "authenticated";

grant insert on table "public"."bookmarks" to "authenticated";

grant references on table "public"."bookmarks" to "authenticated";

grant select on table "public"."bookmarks" to "authenticated";

grant trigger on table "public"."bookmarks" to "authenticated";

grant truncate on table "public"."bookmarks" to "authenticated";

grant update on table "public"."bookmarks" to "authenticated";

grant delete on table "public"."bookmarks" to "service_role";

grant insert on table "public"."bookmarks" to "service_role";

grant references on table "public"."bookmarks" to "service_role";

grant select on table "public"."bookmarks" to "service_role";

grant trigger on table "public"."bookmarks" to "service_role";

grant truncate on table "public"."bookmarks" to "service_role";

grant update on table "public"."bookmarks" to "service_role";

grant delete on table "public"."career_coach_sessions" to "anon";

grant insert on table "public"."career_coach_sessions" to "anon";

grant select on table "public"."career_coach_sessions" to "anon";

grant update on table "public"."career_coach_sessions" to "anon";

grant delete on table "public"."career_coach_sessions" to "authenticated";

grant insert on table "public"."career_coach_sessions" to "authenticated";

grant select on table "public"."career_coach_sessions" to "authenticated";

grant update on table "public"."career_coach_sessions" to "authenticated";

grant delete on table "public"."career_coach_sessions" to "service_role";

grant insert on table "public"."career_coach_sessions" to "service_role";

grant select on table "public"."career_coach_sessions" to "service_role";

grant update on table "public"."career_coach_sessions" to "service_role";

grant delete on table "public"."categories" to "anon";

grant insert on table "public"."categories" to "anon";

grant update on table "public"."categories" to "anon";

grant delete on table "public"."categories" to "authenticated";

grant insert on table "public"."categories" to "authenticated";

grant update on table "public"."categories" to "authenticated";

grant delete on table "public"."chat_participants" to "anon";

grant insert on table "public"."chat_participants" to "anon";

grant references on table "public"."chat_participants" to "anon";

grant select on table "public"."chat_participants" to "anon";

grant trigger on table "public"."chat_participants" to "anon";

grant truncate on table "public"."chat_participants" to "anon";

grant update on table "public"."chat_participants" to "anon";

grant delete on table "public"."chat_participants" to "authenticated";

grant insert on table "public"."chat_participants" to "authenticated";

grant references on table "public"."chat_participants" to "authenticated";

grant select on table "public"."chat_participants" to "authenticated";

grant trigger on table "public"."chat_participants" to "authenticated";

grant truncate on table "public"."chat_participants" to "authenticated";

grant update on table "public"."chat_participants" to "authenticated";

grant delete on table "public"."chat_participants" to "service_role";

grant insert on table "public"."chat_participants" to "service_role";

grant references on table "public"."chat_participants" to "service_role";

grant select on table "public"."chat_participants" to "service_role";

grant trigger on table "public"."chat_participants" to "service_role";

grant truncate on table "public"."chat_participants" to "service_role";

grant update on table "public"."chat_participants" to "service_role";

grant delete on table "public"."chats" to "anon";

grant insert on table "public"."chats" to "anon";

grant select on table "public"."chats" to "anon";

grant update on table "public"."chats" to "anon";

grant delete on table "public"."chats" to "authenticated";

grant delete on table "public"."comment_likes" to "anon";

grant insert on table "public"."comment_likes" to "anon";

grant references on table "public"."comment_likes" to "anon";

grant select on table "public"."comment_likes" to "anon";

grant trigger on table "public"."comment_likes" to "anon";

grant truncate on table "public"."comment_likes" to "anon";

grant update on table "public"."comment_likes" to "anon";

grant delete on table "public"."comment_likes" to "authenticated";

grant insert on table "public"."comment_likes" to "authenticated";

grant references on table "public"."comment_likes" to "authenticated";

grant select on table "public"."comment_likes" to "authenticated";

grant trigger on table "public"."comment_likes" to "authenticated";

grant truncate on table "public"."comment_likes" to "authenticated";

grant update on table "public"."comment_likes" to "authenticated";

grant delete on table "public"."comment_likes" to "service_role";

grant insert on table "public"."comment_likes" to "service_role";

grant references on table "public"."comment_likes" to "service_role";

grant select on table "public"."comment_likes" to "service_role";

grant trigger on table "public"."comment_likes" to "service_role";

grant truncate on table "public"."comment_likes" to "service_role";

grant update on table "public"."comment_likes" to "service_role";

grant delete on table "public"."companies" to "anon";

grant insert on table "public"."companies" to "anon";

grant update on table "public"."companies" to "anon";

grant delete on table "public"."company_reviews" to "anon";

grant insert on table "public"."company_reviews" to "anon";

grant references on table "public"."company_reviews" to "anon";

grant select on table "public"."company_reviews" to "anon";

grant trigger on table "public"."company_reviews" to "anon";

grant truncate on table "public"."company_reviews" to "anon";

grant update on table "public"."company_reviews" to "anon";

grant delete on table "public"."company_reviews" to "authenticated";

grant insert on table "public"."company_reviews" to "authenticated";

grant references on table "public"."company_reviews" to "authenticated";

grant select on table "public"."company_reviews" to "authenticated";

grant trigger on table "public"."company_reviews" to "authenticated";

grant truncate on table "public"."company_reviews" to "authenticated";

grant update on table "public"."company_reviews" to "authenticated";

grant delete on table "public"."company_reviews" to "service_role";

grant insert on table "public"."company_reviews" to "service_role";

grant references on table "public"."company_reviews" to "service_role";

grant select on table "public"."company_reviews" to "service_role";

grant trigger on table "public"."company_reviews" to "service_role";

grant truncate on table "public"."company_reviews" to "service_role";

grant update on table "public"."company_reviews" to "service_role";

grant delete on table "public"."contact_messages" to "anon";

grant insert on table "public"."contact_messages" to "anon";

grant select on table "public"."contact_messages" to "anon";

grant update on table "public"."contact_messages" to "anon";

grant delete on table "public"."contact_messages" to "authenticated";

grant insert on table "public"."contact_messages" to "authenticated";

grant select on table "public"."contact_messages" to "authenticated";

grant update on table "public"."contact_messages" to "authenticated";

grant delete on table "public"."contact_messages" to "service_role";

grant insert on table "public"."contact_messages" to "service_role";

grant select on table "public"."contact_messages" to "service_role";

grant update on table "public"."contact_messages" to "service_role";

grant delete on table "public"."department_members" to "anon";

grant insert on table "public"."department_members" to "anon";

grant select on table "public"."department_members" to "anon";

grant update on table "public"."department_members" to "anon";

grant delete on table "public"."department_members" to "authenticated";

grant insert on table "public"."department_members" to "authenticated";

grant select on table "public"."department_members" to "authenticated";

grant update on table "public"."department_members" to "authenticated";

grant delete on table "public"."department_members" to "service_role";

grant insert on table "public"."department_members" to "service_role";

grant select on table "public"."department_members" to "service_role";

grant update on table "public"."department_members" to "service_role";

grant delete on table "public"."departments" to "anon";

grant insert on table "public"."departments" to "anon";

grant select on table "public"."departments" to "anon";

grant update on table "public"."departments" to "anon";

grant delete on table "public"."departments" to "authenticated";

grant insert on table "public"."departments" to "authenticated";

grant select on table "public"."departments" to "authenticated";

grant update on table "public"."departments" to "authenticated";

grant delete on table "public"."departments" to "service_role";

grant insert on table "public"."departments" to "service_role";

grant select on table "public"."departments" to "service_role";

grant update on table "public"."departments" to "service_role";

grant delete on table "public"."follows" to "anon";

grant insert on table "public"."follows" to "anon";

grant select on table "public"."follows" to "anon";

grant update on table "public"."follows" to "anon";

grant update on table "public"."follows" to "authenticated";

grant delete on table "public"."interview_events" to "anon";

grant insert on table "public"."interview_events" to "anon";

grant select on table "public"."interview_events" to "anon";

grant update on table "public"."interview_events" to "anon";

grant delete on table "public"."interview_slots" to "anon";

grant insert on table "public"."interview_slots" to "anon";

grant select on table "public"."interview_slots" to "anon";

grant update on table "public"."interview_slots" to "anon";

grant delete on table "public"."interviews" to "anon";

grant insert on table "public"."interviews" to "anon";

grant references on table "public"."interviews" to "anon";

grant select on table "public"."interviews" to "anon";

grant trigger on table "public"."interviews" to "anon";

grant truncate on table "public"."interviews" to "anon";

grant update on table "public"."interviews" to "anon";

grant delete on table "public"."interviews" to "authenticated";

grant insert on table "public"."interviews" to "authenticated";

grant references on table "public"."interviews" to "authenticated";

grant select on table "public"."interviews" to "authenticated";

grant trigger on table "public"."interviews" to "authenticated";

grant truncate on table "public"."interviews" to "authenticated";

grant update on table "public"."interviews" to "authenticated";

grant delete on table "public"."interviews" to "service_role";

grant insert on table "public"."interviews" to "service_role";

grant references on table "public"."interviews" to "service_role";

grant select on table "public"."interviews" to "service_role";

grant trigger on table "public"."interviews" to "service_role";

grant truncate on table "public"."interviews" to "service_role";

grant update on table "public"."interviews" to "service_role";

grant delete on table "public"."jagire" to "anon";

grant insert on table "public"."jagire" to "anon";

grant references on table "public"."jagire" to "anon";

grant select on table "public"."jagire" to "anon";

grant trigger on table "public"."jagire" to "anon";

grant truncate on table "public"."jagire" to "anon";

grant update on table "public"."jagire" to "anon";

grant delete on table "public"."jagire" to "authenticated";

grant insert on table "public"."jagire" to "authenticated";

grant references on table "public"."jagire" to "authenticated";

grant select on table "public"."jagire" to "authenticated";

grant trigger on table "public"."jagire" to "authenticated";

grant truncate on table "public"."jagire" to "authenticated";

grant update on table "public"."jagire" to "authenticated";

grant delete on table "public"."jagire" to "service_role";

grant insert on table "public"."jagire" to "service_role";

grant references on table "public"."jagire" to "service_role";

grant select on table "public"."jagire" to "service_role";

grant trigger on table "public"."jagire" to "service_role";

grant truncate on table "public"."jagire" to "service_role";

grant update on table "public"."jagire" to "service_role";

grant delete on table "public"."job_matches" to "anon";

grant insert on table "public"."job_matches" to "anon";

grant references on table "public"."job_matches" to "anon";

grant select on table "public"."job_matches" to "anon";

grant trigger on table "public"."job_matches" to "anon";

grant truncate on table "public"."job_matches" to "anon";

grant update on table "public"."job_matches" to "anon";

grant delete on table "public"."job_matches" to "authenticated";

grant insert on table "public"."job_matches" to "authenticated";

grant references on table "public"."job_matches" to "authenticated";

grant select on table "public"."job_matches" to "authenticated";

grant trigger on table "public"."job_matches" to "authenticated";

grant truncate on table "public"."job_matches" to "authenticated";

grant update on table "public"."job_matches" to "authenticated";

grant delete on table "public"."job_matches" to "service_role";

grant insert on table "public"."job_matches" to "service_role";

grant references on table "public"."job_matches" to "service_role";

grant select on table "public"."job_matches" to "service_role";

grant trigger on table "public"."job_matches" to "service_role";

grant truncate on table "public"."job_matches" to "service_role";

grant update on table "public"."job_matches" to "service_role";

grant delete on table "public"."jobs" to "anon";

grant insert on table "public"."jobs" to "anon";

grant update on table "public"."jobs" to "anon";

grant delete on table "public"."knowledge_chunks" to "anon";

grant insert on table "public"."knowledge_chunks" to "anon";

grant select on table "public"."knowledge_chunks" to "anon";

grant update on table "public"."knowledge_chunks" to "anon";

grant delete on table "public"."knowledge_chunks" to "authenticated";

grant insert on table "public"."knowledge_chunks" to "authenticated";

grant select on table "public"."knowledge_chunks" to "authenticated";

grant update on table "public"."knowledge_chunks" to "authenticated";

grant delete on table "public"."knowledge_chunks" to "service_role";

grant insert on table "public"."knowledge_chunks" to "service_role";

grant select on table "public"."knowledge_chunks" to "service_role";

grant update on table "public"."knowledge_chunks" to "service_role";

grant delete on table "public"."knowledge_documents" to "anon";

grant insert on table "public"."knowledge_documents" to "anon";

grant select on table "public"."knowledge_documents" to "anon";

grant update on table "public"."knowledge_documents" to "anon";

grant delete on table "public"."knowledge_documents" to "authenticated";

grant insert on table "public"."knowledge_documents" to "authenticated";

grant select on table "public"."knowledge_documents" to "authenticated";

grant update on table "public"."knowledge_documents" to "authenticated";

grant delete on table "public"."knowledge_documents" to "service_role";

grant insert on table "public"."knowledge_documents" to "service_role";

grant select on table "public"."knowledge_documents" to "service_role";

grant update on table "public"."knowledge_documents" to "service_role";

grant delete on table "public"."learning_courses" to "anon";

grant insert on table "public"."learning_courses" to "anon";

grant references on table "public"."learning_courses" to "anon";

grant select on table "public"."learning_courses" to "anon";

grant trigger on table "public"."learning_courses" to "anon";

grant truncate on table "public"."learning_courses" to "anon";

grant update on table "public"."learning_courses" to "anon";

grant delete on table "public"."learning_courses" to "authenticated";

grant insert on table "public"."learning_courses" to "authenticated";

grant references on table "public"."learning_courses" to "authenticated";

grant select on table "public"."learning_courses" to "authenticated";

grant trigger on table "public"."learning_courses" to "authenticated";

grant truncate on table "public"."learning_courses" to "authenticated";

grant update on table "public"."learning_courses" to "authenticated";

grant delete on table "public"."learning_courses" to "service_role";

grant insert on table "public"."learning_courses" to "service_role";

grant references on table "public"."learning_courses" to "service_role";

grant select on table "public"."learning_courses" to "service_role";

grant trigger on table "public"."learning_courses" to "service_role";

grant truncate on table "public"."learning_courses" to "service_role";

grant update on table "public"."learning_courses" to "service_role";

grant delete on table "public"."learning_items" to "anon";

grant insert on table "public"."learning_items" to "anon";

grant select on table "public"."learning_items" to "anon";

grant update on table "public"."learning_items" to "anon";

grant delete on table "public"."learning_progress" to "anon";

grant insert on table "public"."learning_progress" to "anon";

grant select on table "public"."learning_progress" to "anon";

grant update on table "public"."learning_progress" to "anon";

grant delete on table "public"."meetings" to "anon";

grant insert on table "public"."meetings" to "anon";

grant select on table "public"."meetings" to "anon";

grant update on table "public"."meetings" to "anon";

grant delete on table "public"."messages" to "anon";

grant insert on table "public"."messages" to "anon";

grant select on table "public"."messages" to "anon";

grant update on table "public"."messages" to "anon";

grant delete on table "public"."messages" to "authenticated";

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "authenticated";

grant delete on table "public"."payment_verifications" to "anon";

grant insert on table "public"."payment_verifications" to "anon";

grant select on table "public"."payment_verifications" to "anon";

grant update on table "public"."payment_verifications" to "anon";

grant delete on table "public"."payment_verifications" to "authenticated";

grant insert on table "public"."payment_verifications" to "authenticated";

grant select on table "public"."payment_verifications" to "authenticated";

grant update on table "public"."payment_verifications" to "authenticated";

grant delete on table "public"."payment_verifications" to "service_role";

grant insert on table "public"."payment_verifications" to "service_role";

grant select on table "public"."payment_verifications" to "service_role";

grant update on table "public"."payment_verifications" to "service_role";

grant delete on table "public"."payments" to "anon";

grant insert on table "public"."payments" to "anon";

grant select on table "public"."payments" to "anon";

grant update on table "public"."payments" to "anon";

grant delete on table "public"."payments" to "authenticated";

grant insert on table "public"."payments" to "authenticated";

grant select on table "public"."payments" to "authenticated";

grant update on table "public"."payments" to "authenticated";

grant delete on table "public"."payments" to "service_role";

grant insert on table "public"."payments" to "service_role";

grant select on table "public"."payments" to "service_role";

grant update on table "public"."payments" to "service_role";

grant delete on table "public"."post_comments" to "anon";

grant insert on table "public"."post_comments" to "anon";

grant select on table "public"."post_comments" to "anon";

grant update on table "public"."post_comments" to "anon";

grant delete on table "public"."post_likes" to "anon";

grant insert on table "public"."post_likes" to "anon";

grant select on table "public"."post_likes" to "anon";

grant update on table "public"."post_likes" to "anon";

grant update on table "public"."post_likes" to "authenticated";

grant delete on table "public"."post_reports" to "anon";

grant insert on table "public"."post_reports" to "anon";

grant references on table "public"."post_reports" to "anon";

grant select on table "public"."post_reports" to "anon";

grant trigger on table "public"."post_reports" to "anon";

grant truncate on table "public"."post_reports" to "anon";

grant update on table "public"."post_reports" to "anon";

grant delete on table "public"."post_reports" to "authenticated";

grant insert on table "public"."post_reports" to "authenticated";

grant references on table "public"."post_reports" to "authenticated";

grant select on table "public"."post_reports" to "authenticated";

grant trigger on table "public"."post_reports" to "authenticated";

grant truncate on table "public"."post_reports" to "authenticated";

grant update on table "public"."post_reports" to "authenticated";

grant delete on table "public"."post_reports" to "service_role";

grant insert on table "public"."post_reports" to "service_role";

grant references on table "public"."post_reports" to "service_role";

grant select on table "public"."post_reports" to "service_role";

grant trigger on table "public"."post_reports" to "service_role";

grant truncate on table "public"."post_reports" to "service_role";

grant update on table "public"."post_reports" to "service_role";

grant delete on table "public"."post_saves" to "anon";

grant insert on table "public"."post_saves" to "anon";

grant select on table "public"."post_saves" to "anon";

grant update on table "public"."post_saves" to "anon";

grant update on table "public"."post_saves" to "authenticated";

grant delete on table "public"."posts" to "anon";

grant insert on table "public"."posts" to "anon";

grant select on table "public"."posts" to "anon";

grant update on table "public"."posts" to "anon";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."referrals" to "anon";

grant insert on table "public"."referrals" to "anon";

grant select on table "public"."referrals" to "anon";

grant update on table "public"."referrals" to "anon";

grant delete on table "public"."referrals" to "authenticated";

grant delete on table "public"."reports" to "anon";

grant insert on table "public"."reports" to "anon";

grant references on table "public"."reports" to "anon";

grant select on table "public"."reports" to "anon";

grant trigger on table "public"."reports" to "anon";

grant truncate on table "public"."reports" to "anon";

grant update on table "public"."reports" to "anon";

grant delete on table "public"."reports" to "authenticated";

grant insert on table "public"."reports" to "authenticated";

grant references on table "public"."reports" to "authenticated";

grant select on table "public"."reports" to "authenticated";

grant trigger on table "public"."reports" to "authenticated";

grant truncate on table "public"."reports" to "authenticated";

grant update on table "public"."reports" to "authenticated";

grant delete on table "public"."reports" to "service_role";

grant insert on table "public"."reports" to "service_role";

grant references on table "public"."reports" to "service_role";

grant select on table "public"."reports" to "service_role";

grant trigger on table "public"."reports" to "service_role";

grant truncate on table "public"."reports" to "service_role";

grant update on table "public"."reports" to "service_role";

grant delete on table "public"."resumes" to "anon";

grant insert on table "public"."resumes" to "anon";

grant select on table "public"."resumes" to "anon";

grant update on table "public"."resumes" to "anon";

grant delete on table "public"."review_replies" to "anon";

grant insert on table "public"."review_replies" to "anon";

grant select on table "public"."review_replies" to "anon";

grant update on table "public"."review_replies" to "anon";

grant delete on table "public"."reviews" to "anon";

grant insert on table "public"."reviews" to "anon";

grant update on table "public"."reviews" to "anon";

grant delete on table "public"."saved_jobs" to "anon";

grant insert on table "public"."saved_jobs" to "anon";

grant select on table "public"."saved_jobs" to "anon";

grant update on table "public"."saved_jobs" to "anon";

grant update on table "public"."saved_jobs" to "authenticated";

grant delete on table "public"."subscriptions" to "anon";

grant insert on table "public"."subscriptions" to "anon";

grant select on table "public"."subscriptions" to "anon";

grant update on table "public"."subscriptions" to "anon";

grant delete on table "public"."subscriptions" to "authenticated";

grant insert on table "public"."subscriptions" to "authenticated";

grant select on table "public"."subscriptions" to "authenticated";

grant update on table "public"."subscriptions" to "authenticated";

grant delete on table "public"."subscriptions" to "service_role";

grant insert on table "public"."subscriptions" to "service_role";

grant select on table "public"."subscriptions" to "service_role";

grant update on table "public"."subscriptions" to "service_role";

grant delete on table "public"."support_tickets" to "anon";

grant insert on table "public"."support_tickets" to "anon";

grant select on table "public"."support_tickets" to "anon";

grant update on table "public"."support_tickets" to "anon";

grant delete on table "public"."support_tickets" to "authenticated";

grant delete on table "public"."user_roles" to "anon";

grant insert on table "public"."user_roles" to "anon";

grant select on table "public"."user_roles" to "anon";

grant update on table "public"."user_roles" to "anon";

grant delete on table "public"."user_roles" to "authenticated";

grant insert on table "public"."user_roles" to "authenticated";

grant update on table "public"."user_roles" to "authenticated";


  create policy "delete_own_activity_logs"
  on "public"."activity_logs"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



  create policy "insert_own_activity_logs"
  on "public"."activity_logs"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "select_own_activity_logs"
  on "public"."activity_logs"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "delete_own_conversations"
  on "public"."ai_conversations"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



  create policy "insert_own_conversations"
  on "public"."ai_conversations"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "select_own_conversations"
  on "public"."ai_conversations"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "update_own_conversations"
  on "public"."ai_conversations"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Users can view application events"
  on "public"."application_events"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.applications a
  WHERE ((a.id = application_events.application_id) AND ((a.applicant_id = auth.uid()) OR public.has_role(auth.uid(), 'employer'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role))))));



  create policy "Applicants can apply"
  on "public"."applications"
  as permissive
  for insert
  to public
with check ((auth.uid() = applicant_id));



  create policy "Applicants or employers update"
  on "public"."applications"
  as permissive
  for update
  to public
using (((auth.uid() = applicant_id) OR (EXISTS ( SELECT 1
   FROM public.jobs j
  WHERE ((j.id = applications.job_id) AND (j.posted_by = auth.uid())))) OR public.has_role(auth.uid(), 'admin'::public.app_role)));



  create policy "Users can apply"
  on "public"."applications"
  as permissive
  for insert
  to public
with check ((auth.uid() = applicant_id));



  create policy "Users or employers update applications"
  on "public"."applications"
  as permissive
  for update
  to public
using (((auth.uid() = applicant_id) OR (EXISTS ( SELECT 1
   FROM public.jobs j
  WHERE ((j.id = applications.job_id) AND (j.posted_by = auth.uid())))) OR public.has_role(auth.uid(), 'admin'::public.app_role)));



  create policy "Users view own applications"
  on "public"."applications"
  as permissive
  for select
  to public
using (((auth.uid() = applicant_id) OR (EXISTS ( SELECT 1
   FROM public.jobs j
  WHERE ((j.id = applications.job_id) AND (j.posted_by = auth.uid())))) OR public.has_role(auth.uid(), 'admin'::public.app_role)));



  create policy "delete_own_application"
  on "public"."applications"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = applicant_id));



  create policy "insert_own_application"
  on "public"."applications"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = applicant_id));



  create policy "select_own_applications"
  on "public"."applications"
  as permissive
  for select
  to authenticated
using (((auth.uid() = applicant_id) OR (EXISTS ( SELECT 1
   FROM public.jobs
  WHERE ((jobs.id = applications.job_id) AND (jobs.employer_id = auth.uid()))))));



  create policy "update_own_application"
  on "public"."applications"
  as permissive
  for update
  to authenticated
using (((auth.uid() = applicant_id) OR (EXISTS ( SELECT 1
   FROM public.jobs
  WHERE ((jobs.id = applications.job_id) AND (jobs.employer_id = auth.uid()))))))
with check (((auth.uid() = applicant_id) OR (EXISTS ( SELECT 1
   FROM public.jobs
  WHERE ((jobs.id = applications.job_id) AND (jobs.employer_id = auth.uid()))))));



  create policy "Users can insert own assessment attempts"
  on "public"."assessment_attempts"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "Users can view own assessment attempts"
  on "public"."assessment_attempts"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "insert_assessment_attempts"
  on "public"."assessment_attempts"
  as permissive
  for insert
  to authenticated
with check ((user_id = auth.uid()));



  create policy "select_assessment_attempts"
  on "public"."assessment_attempts"
  as permissive
  for select
  to authenticated
using (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));



  create policy "Admins and employers can insert assessments"
  on "public"."assessments"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['admin'::public.app_role, 'employer'::public.app_role]))))));



  create policy "Admins and employers can view assessments"
  on "public"."assessments"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['admin'::public.app_role, 'employer'::public.app_role]))))));



  create policy "Authenticated users can view assessments"
  on "public"."assessments"
  as permissive
  for select
  to authenticated
using (true);



  create policy "delete_assessments"
  on "public"."assessments"
  as permissive
  for delete
  to authenticated
using ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (created_by = auth.uid())));



  create policy "insert_assessments"
  on "public"."assessments"
  as permissive
  for insert
  to authenticated
with check ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (created_by = auth.uid())));



  create policy "select_assessments"
  on "public"."assessments"
  as permissive
  for select
  to authenticated
using (true);



  create policy "update_assessments"
  on "public"."assessments"
  as permissive
  for update
  to authenticated
using ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (created_by = auth.uid())))
with check ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (created_by = auth.uid())));



  create policy "Public can view badges"
  on "public"."badges"
  as permissive
  for select
  to public
using (true);



  create policy "admin_delete_badges"
  on "public"."badges"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));



  create policy "admin_insert_badges"
  on "public"."badges"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));



  create policy "admin_update_badges"
  on "public"."badges"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))))
with check ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));



  create policy "delete_blog_comments"
  on "public"."blog_comments"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = author_id));



  create policy "insert_blog_comments"
  on "public"."blog_comments"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = author_id));



  create policy "select_blog_comments"
  on "public"."blog_comments"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "update_blog_comments"
  on "public"."blog_comments"
  as permissive
  for update
  to authenticated
using ((auth.uid() = author_id))
with check ((auth.uid() = author_id));



  create policy "delete_blog_likes"
  on "public"."blog_likes"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



  create policy "insert_blog_likes"
  on "public"."blog_likes"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "select_blog_likes"
  on "public"."blog_likes"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Public can view published blogs"
  on "public"."blogs"
  as permissive
  for select
  to anon, authenticated
using ((published = true));



  create policy "Users can create blogs"
  on "public"."blogs"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = author_id));



  create policy "delete_blogs"
  on "public"."blogs"
  as permissive
  for delete
  to authenticated
using (((author_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));



  create policy "insert_blogs"
  on "public"."blogs"
  as permissive
  for insert
  to authenticated
with check ((author_id = auth.uid()));



  create policy "select_blogs"
  on "public"."blogs"
  as permissive
  for select
  to authenticated
using (true);



  create policy "update_blogs"
  on "public"."blogs"
  as permissive
  for update
  to authenticated
using (((author_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)))
with check (((author_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));



  create policy "delete_own_bookmarks"
  on "public"."bookmarks"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



  create policy "insert_own_bookmarks"
  on "public"."bookmarks"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "select_own_bookmarks"
  on "public"."bookmarks"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "Temporary allow inserts"
  on "public"."career_coach_sessions"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "delete_own_coach_sessions"
  on "public"."career_coach_sessions"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



  create policy "insert_own_coach_sessions"
  on "public"."career_coach_sessions"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "select_own_coach_sessions"
  on "public"."career_coach_sessions"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "update_own_coach_sessions"
  on "public"."career_coach_sessions"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Anyone can view categories"
  on "public"."categories"
  as permissive
  for select
  to public
using (true);



  create policy "delete_categories"
  on "public"."categories"
  as permissive
  for delete
  to authenticated
using (public.has_role(auth.uid(), 'admin'::public.app_role));



  create policy "insert_categories"
  on "public"."categories"
  as permissive
  for insert
  to authenticated
with check (public.has_role(auth.uid(), 'admin'::public.app_role));



  create policy "select_categories"
  on "public"."categories"
  as permissive
  for select
  to authenticated
using (true);



  create policy "update_categories"
  on "public"."categories"
  as permissive
  for update
  to authenticated
using (public.has_role(auth.uid(), 'admin'::public.app_role))
with check (public.has_role(auth.uid(), 'admin'::public.app_role));



  create policy "delete_own_chat_participation"
  on "public"."chat_participants"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



  create policy "insert_own_chat_participation"
  on "public"."chat_participants"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "select_own_chat_participation"
  on "public"."chat_participants"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "Users can create chats"
  on "public"."chats"
  as permissive
  for insert
  to authenticated
with check (((auth.uid() = user_a) OR (auth.uid() = user_b)));



  create policy "Users can view chats"
  on "public"."chats"
  as permissive
  for select
  to authenticated
using (((auth.uid() = user_a) OR (auth.uid() = user_b)));



  create policy "insert_chats"
  on "public"."chats"
  as permissive
  for insert
  to authenticated
with check (((user_a = auth.uid()) OR (user_b = auth.uid())));



  create policy "select_chats"
  on "public"."chats"
  as permissive
  for select
  to authenticated
using (((user_a = auth.uid()) OR (user_b = auth.uid())));



  create policy "update_chats"
  on "public"."chats"
  as permissive
  for update
  to authenticated
using (((user_a = auth.uid()) OR (user_b = auth.uid())))
with check (((user_a = auth.uid()) OR (user_b = auth.uid())));



  create policy "delete_comment_likes"
  on "public"."comment_likes"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



  create policy "insert_comment_likes"
  on "public"."comment_likes"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "select_comment_likes"
  on "public"."comment_likes"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Owner can delete"
  on "public"."companies"
  as permissive
  for delete
  to authenticated
using (((auth.uid() = owner_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));



  create policy "Owner can insert"
  on "public"."companies"
  as permissive
  for insert
  to authenticated
with check (((auth.uid() = owner_id) AND public.has_role(auth.uid(), 'employer'::public.app_role)));



  create policy "Owner can update"
  on "public"."companies"
  as permissive
  for update
  to authenticated
using (((auth.uid() = owner_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));



  create policy "delete_companies"
  on "public"."companies"
  as permissive
  for delete
  to authenticated
using (((owner_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));



  create policy "delete_own_company"
  on "public"."companies"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = owner_id));



  create policy "insert_companies"
  on "public"."companies"
  as permissive
  for insert
  to authenticated
with check ((owner_id = auth.uid()));



  create policy "insert_own_company"
  on "public"."companies"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = owner_id));



  create policy "select_companies"
  on "public"."companies"
  as permissive
  for select
  to authenticated
using (true);



  create policy "update_companies"
  on "public"."companies"
  as permissive
  for update
  to authenticated
using (((owner_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)))
with check (((owner_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));



  create policy "update_own_company"
  on "public"."companies"
  as permissive
  for update
  to authenticated
using ((auth.uid() = owner_id))
with check ((auth.uid() = owner_id));



  create policy "delete_own_review"
  on "public"."company_reviews"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = reviewer_id));



  create policy "insert_own_review"
  on "public"."company_reviews"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = reviewer_id));



  create policy "select_reviews"
  on "public"."company_reviews"
  as permissive
  for select
  to authenticated
using (((is_approved = true) OR (auth.uid() = reviewer_id) OR (EXISTS ( SELECT 1
   FROM public.companies c
  WHERE ((c.id = company_reviews.company_id) AND (c.owner_id = auth.uid()))))));



  create policy "update_own_review"
  on "public"."company_reviews"
  as permissive
  for update
  to authenticated
using (((auth.uid() = reviewer_id) OR (EXISTS ( SELECT 1
   FROM public.companies c
  WHERE ((c.id = company_reviews.company_id) AND (c.owner_id = auth.uid()))))))
with check (((auth.uid() = reviewer_id) OR (EXISTS ( SELECT 1
   FROM public.companies c
  WHERE ((c.id = company_reviews.company_id) AND (c.owner_id = auth.uid()))))));



  create policy "delete_follows"
  on "public"."follows"
  as permissive
  for delete
  to authenticated
using ((follower_id = auth.uid()));



  create policy "delete_own_follow"
  on "public"."follows"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = follower_id));



  create policy "insert_follows"
  on "public"."follows"
  as permissive
  for insert
  to authenticated
with check ((follower_id = auth.uid()));



  create policy "insert_own_follow"
  on "public"."follows"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = follower_id));



  create policy "select_follows"
  on "public"."follows"
  as permissive
  for select
  to authenticated
using (true);



  create policy "delete_interview_events"
  on "public"."interview_events"
  as permissive
  for delete
  to authenticated
using ((employer_id = auth.uid()));



  create policy "insert_interview_events"
  on "public"."interview_events"
  as permissive
  for insert
  to authenticated
with check ((employer_id = auth.uid()));



  create policy "select_interview_events"
  on "public"."interview_events"
  as permissive
  for select
  to public
using (((employer_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.applications a
  WHERE ((a.id = interview_events.application_id) AND (a.applicant_id = auth.uid())))) OR public.has_role(auth.uid(), 'admin'::public.app_role)));



  create policy "update_interview_events"
  on "public"."interview_events"
  as permissive
  for update
  to authenticated
using ((employer_id = auth.uid()))
with check ((employer_id = auth.uid()));



  create policy "delete_employer_slot"
  on "public"."interview_slots"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = employer_id));



  create policy "insert_employer_slot"
  on "public"."interview_slots"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = employer_id));



  create policy "select_interview_slots"
  on "public"."interview_slots"
  as permissive
  for select
  to authenticated
using (((auth.uid() = employer_id) OR (auth.uid() = booked_by)));



  create policy "update_interview_slots"
  on "public"."interview_slots"
  as permissive
  for update
  to authenticated
using (((auth.uid() = employer_id) OR (auth.uid() = booked_by)))
with check (((auth.uid() = employer_id) OR (auth.uid() = booked_by)));



  create policy "delete_interviews"
  on "public"."interviews"
  as permissive
  for delete
  to authenticated
using (((employer_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));



  create policy "delete_own_interviews"
  on "public"."interviews"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.applications
  WHERE ((applications.id = interviews.application_id) AND (EXISTS ( SELECT 1
           FROM public.jobs
          WHERE ((jobs.id = applications.job_id) AND (jobs.employer_id = auth.uid()))))))));



  create policy "insert_interviews"
  on "public"."interviews"
  as permissive
  for insert
  to authenticated
with check (((employer_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));



  create policy "insert_own_interviews"
  on "public"."interviews"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.applications
  WHERE ((applications.id = interviews.application_id) AND (EXISTS ( SELECT 1
           FROM public.jobs
          WHERE ((jobs.id = applications.job_id) AND (jobs.employer_id = auth.uid()))))))));



  create policy "select_interviews"
  on "public"."interviews"
  as permissive
  for select
  to public
using (((employer_id = auth.uid()) OR (candidate_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.applications a
  WHERE ((a.id = interviews.application_id) AND (a.applicant_id = auth.uid())))) OR public.has_role(auth.uid(), 'admin'::public.app_role)));



  create policy "select_own_interviews"
  on "public"."interviews"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.applications
  WHERE ((applications.id = interviews.application_id) AND ((applications.applicant_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.jobs
          WHERE ((jobs.id = applications.job_id) AND (jobs.employer_id = auth.uid())))))))));



  create policy "update_interviews"
  on "public"."interviews"
  as permissive
  for update
  to authenticated
using (((employer_id = auth.uid()) OR (candidate_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)))
with check (((employer_id = auth.uid()) OR (candidate_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));



  create policy "update_own_interviews"
  on "public"."interviews"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.applications
  WHERE ((applications.id = interviews.application_id) AND ((applications.applicant_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.jobs
          WHERE ((jobs.id = applications.job_id) AND (jobs.employer_id = auth.uid())))))))))
with check ((EXISTS ( SELECT 1
   FROM public.applications
  WHERE ((applications.id = interviews.application_id) AND ((applications.applicant_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.jobs
          WHERE ((jobs.id = applications.job_id) AND (jobs.employer_id = auth.uid())))))))));



  create policy "read_jagire"
  on "public"."jagire"
  as permissive
  for select
  to authenticated
using (true);



  create policy "delete_own_matches"
  on "public"."job_matches"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



  create policy "insert_own_matches"
  on "public"."job_matches"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "select_own_matches"
  on "public"."job_matches"
  as permissive
  for select
  to authenticated
using (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM public.jobs
  WHERE ((jobs.id = job_matches.job_id) AND (jobs.employer_id = auth.uid()))))));



  create policy "update_own_matches"
  on "public"."job_matches"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Employer can insert"
  on "public"."jobs"
  as permissive
  for insert
  to authenticated
with check (((auth.uid() = posted_by) AND public.has_role(auth.uid(), 'employer'::public.app_role)));



  create policy "Owner can delete"
  on "public"."jobs"
  as permissive
  for delete
  to authenticated
using (((auth.uid() = posted_by) OR public.has_role(auth.uid(), 'admin'::public.app_role)));



  create policy "Owner can update"
  on "public"."jobs"
  as permissive
  for update
  to authenticated
using (((auth.uid() = posted_by) OR public.has_role(auth.uid(), 'admin'::public.app_role)));



  create policy "Public can view jobs"
  on "public"."jobs"
  as permissive
  for select
  to public
using (((status = ANY (ARRAY['published'::public.job_status, 'active'::public.job_status])) OR (posted_by = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));



  create policy "delete_jobs"
  on "public"."jobs"
  as permissive
  for delete
  to authenticated
using (((posted_by = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));



  create policy "delete_own_job"
  on "public"."jobs"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = employer_id));



  create policy "insert_jobs"
  on "public"."jobs"
  as permissive
  for insert
  to authenticated
with check ((posted_by = auth.uid()));



  create policy "insert_own_job"
  on "public"."jobs"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = employer_id));



  create policy "select_jobs"
  on "public"."jobs"
  as permissive
  for select
  to authenticated
using (true);



  create policy "update_jobs"
  on "public"."jobs"
  as permissive
  for update
  to authenticated
using (((posted_by = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)))
with check (((posted_by = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));



  create policy "update_own_job"
  on "public"."jobs"
  as permissive
  for update
  to authenticated
using ((auth.uid() = employer_id))
with check ((auth.uid() = employer_id));



  create policy "delete_admin_course"
  on "public"."learning_courses"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.user_role = 'admin'::text)))));



  create policy "insert_admin_course"
  on "public"."learning_courses"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.user_role = 'admin'::text)))));



  create policy "select_learning_courses"
  on "public"."learning_courses"
  as permissive
  for select
  to authenticated
using (true);



  create policy "update_admin_course"
  on "public"."learning_courses"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.user_role = 'admin'::text)))));



  create policy "Anyone can view learning items"
  on "public"."learning_items"
  as permissive
  for select
  to public
using (true);



  create policy "admin_delete_learning_items"
  on "public"."learning_items"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));



  create policy "admin_insert_learning_items"
  on "public"."learning_items"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));



  create policy "admin_update_learning_items"
  on "public"."learning_items"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))))
with check ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));



  create policy "insert_own_progress"
  on "public"."learning_progress"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "select_own_progress"
  on "public"."learning_progress"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "update_own_progress"
  on "public"."learning_progress"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "delete_meetings"
  on "public"."meetings"
  as permissive
  for delete
  to authenticated
using (((scheduled_by = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));



  create policy "insert_meetings"
  on "public"."meetings"
  as permissive
  for insert
  to authenticated
with check ((scheduled_by = auth.uid()));



  create policy "select_meetings"
  on "public"."meetings"
  as permissive
  for select
  to authenticated
using (((scheduled_by = auth.uid()) OR (candidate_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));



  create policy "update_meetings"
  on "public"."meetings"
  as permissive
  for update
  to authenticated
using (((scheduled_by = auth.uid()) OR (candidate_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)))
with check (((scheduled_by = auth.uid()) OR (candidate_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));



  create policy "delete_own_messages"
  on "public"."messages"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = sender_id));



  create policy "insert_messages"
  on "public"."messages"
  as permissive
  for insert
  to authenticated
with check ((sender_id = auth.uid()));



  create policy "insert_own_messages"
  on "public"."messages"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = sender_id));



  create policy "select_messages"
  on "public"."messages"
  as permissive
  for select
  to authenticated
using (((sender_id = auth.uid()) OR (receiver_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.chats c
  WHERE ((c.id = messages.chat_id) AND ((c.user_a = auth.uid()) OR (c.user_b = auth.uid())))))));



  create policy "select_own_messages"
  on "public"."messages"
  as permissive
  for select
  to authenticated
using (((auth.uid() = sender_id) OR (auth.uid() = receiver_id)));



  create policy "update_messages"
  on "public"."messages"
  as permissive
  for update
  to authenticated
using (((sender_id = auth.uid()) OR (receiver_id = auth.uid())))
with check (((sender_id = auth.uid()) OR (receiver_id = auth.uid())));



  create policy "delete_notifications"
  on "public"."notifications"
  as permissive
  for delete
  to authenticated
using ((user_id = auth.uid()));



  create policy "delete_own_notifications"
  on "public"."notifications"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



  create policy "insert_notifications"
  on "public"."notifications"
  as permissive
  for insert
  to authenticated
with check ((user_id = auth.uid()));



  create policy "insert_own_notifications"
  on "public"."notifications"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "select_notifications"
  on "public"."notifications"
  as permissive
  for select
  to authenticated
using ((user_id = auth.uid()));



  create policy "select_own_notifications"
  on "public"."notifications"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "update_notifications"
  on "public"."notifications"
  as permissive
  for update
  to authenticated
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));



  create policy "update_own_notifications"
  on "public"."notifications"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "insert_own_payment"
  on "public"."payments"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "select_own_payments"
  on "public"."payments"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "update_own_payment"
  on "public"."payments"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Anyone can view comments"
  on "public"."post_comments"
  as permissive
  for select
  to public
using (true);



  create policy "Authenticated users can comment"
  on "public"."post_comments"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = author_id));



  create policy "delete_own_comment"
  on "public"."post_comments"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = author_id));



  create policy "delete_post_comments"
  on "public"."post_comments"
  as permissive
  for delete
  to authenticated
using (((author_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));



  create policy "insert_own_comment"
  on "public"."post_comments"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = author_id));



  create policy "insert_post_comments"
  on "public"."post_comments"
  as permissive
  for insert
  to authenticated
with check ((author_id = auth.uid()));



  create policy "select_post_comments"
  on "public"."post_comments"
  as permissive
  for select
  to authenticated
using (true);



  create policy "update_own_comment"
  on "public"."post_comments"
  as permissive
  for update
  to authenticated
using ((auth.uid() = author_id))
with check ((auth.uid() = author_id));



  create policy "update_post_comments"
  on "public"."post_comments"
  as permissive
  for update
  to authenticated
using ((author_id = auth.uid()))
with check ((author_id = auth.uid()));



  create policy "delete_own_like"
  on "public"."post_likes"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



  create policy "delete_post_likes"
  on "public"."post_likes"
  as permissive
  for delete
  to authenticated
using ((user_id = auth.uid()));



  create policy "insert_own_like"
  on "public"."post_likes"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "insert_post_likes"
  on "public"."post_likes"
  as permissive
  for insert
  to authenticated
with check ((user_id = auth.uid()));



  create policy "select_post_likes"
  on "public"."post_likes"
  as permissive
  for select
  to authenticated
using (true);



  create policy "insert_post_reports"
  on "public"."post_reports"
  as permissive
  for insert
  to authenticated
with check ((reporter_id = auth.uid()));



  create policy "select_post_reports"
  on "public"."post_reports"
  as permissive
  for select
  to authenticated
using (((reporter_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));



  create policy "update_post_reports"
  on "public"."post_reports"
  as permissive
  for update
  to authenticated
using (public.has_role(auth.uid(), 'admin'::public.app_role))
with check (public.has_role(auth.uid(), 'admin'::public.app_role));



  create policy "delete_own_post_save"
  on "public"."post_saves"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



  create policy "delete_post_saves"
  on "public"."post_saves"
  as permissive
  for delete
  to authenticated
using ((user_id = auth.uid()));



  create policy "insert_own_post_save"
  on "public"."post_saves"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "insert_post_saves"
  on "public"."post_saves"
  as permissive
  for insert
  to authenticated
with check ((user_id = auth.uid()));



  create policy "select_own_post_saves"
  on "public"."post_saves"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "select_post_saves"
  on "public"."post_saves"
  as permissive
  for select
  to authenticated
using ((user_id = auth.uid()));



  create policy "delete_own_post"
  on "public"."posts"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = author_id));



  create policy "delete_posts"
  on "public"."posts"
  as permissive
  for delete
  to authenticated
using (((author_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));



  create policy "insert_own_post"
  on "public"."posts"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = author_id));



  create policy "insert_posts"
  on "public"."posts"
  as permissive
  for insert
  to authenticated
with check ((author_id = auth.uid()));



  create policy "select_posts"
  on "public"."posts"
  as permissive
  for select
  to authenticated
using (true);



  create policy "update_own_post"
  on "public"."posts"
  as permissive
  for update
  to authenticated
using ((auth.uid() = author_id))
with check ((auth.uid() = author_id));



  create policy "update_posts"
  on "public"."posts"
  as permissive
  for update
  to authenticated
using ((author_id = auth.uid()))
with check ((author_id = auth.uid()));



  create policy "Profiles are viewable by everyone"
  on "public"."profiles"
  as permissive
  for select
  to public
using (true);



  create policy "delete_own_profile"
  on "public"."profiles"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = id));



  create policy "insert_own_profile"
  on "public"."profiles"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = id));



  create policy "insert_profiles"
  on "public"."profiles"
  as permissive
  for insert
  to authenticated
with check ((id = auth.uid()));



  create policy "select_own_profile"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using ((auth.uid() = id));



  create policy "select_profiles"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using (true);



  create policy "update_own_profile"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
using ((auth.uid() = id))
with check ((auth.uid() = id));



  create policy "update_profiles"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
using ((id = auth.uid()))
with check ((id = auth.uid()));



  create policy "insert_referrals"
  on "public"."referrals"
  as permissive
  for insert
  to authenticated
with check ((referrer_id = auth.uid()));



  create policy "select_referrals"
  on "public"."referrals"
  as permissive
  for select
  to authenticated
using (((referrer_id = auth.uid()) OR (referred_user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));



  create policy "update_referrals"
  on "public"."referrals"
  as permissive
  for update
  to authenticated
using (((referrer_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)))
with check (((referrer_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));



  create policy "delete_own_reports"
  on "public"."reports"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = reporter_id));



  create policy "insert_own_reports"
  on "public"."reports"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = reporter_id));



  create policy "insert_reports"
  on "public"."reports"
  as permissive
  for insert
  to authenticated
with check ((reporter_id = auth.uid()));



  create policy "select_own_reports"
  on "public"."reports"
  as permissive
  for select
  to authenticated
using ((auth.uid() = reporter_id));



  create policy "select_reports"
  on "public"."reports"
  as permissive
  for select
  to authenticated
using (((reporter_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));



  create policy "update_reports"
  on "public"."reports"
  as permissive
  for update
  to authenticated
using (public.has_role(auth.uid(), 'admin'::public.app_role))
with check (public.has_role(auth.uid(), 'admin'::public.app_role));



  create policy "delete_own_resumes"
  on "public"."resumes"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



  create policy "delete_resumes"
  on "public"."resumes"
  as permissive
  for delete
  to authenticated
using ((user_id = auth.uid()));



  create policy "insert_own_resumes"
  on "public"."resumes"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "insert_resumes"
  on "public"."resumes"
  as permissive
  for insert
  to authenticated
with check ((user_id = auth.uid()));



  create policy "select_own_resumes"
  on "public"."resumes"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "select_resumes"
  on "public"."resumes"
  as permissive
  for select
  to authenticated
using ((user_id = auth.uid()));



  create policy "update_own_resumes"
  on "public"."resumes"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "update_resumes"
  on "public"."resumes"
  as permissive
  for update
  to authenticated
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));



  create policy "Company users can reply"
  on "public"."review_replies"
  as permissive
  for insert
  to authenticated
with check (((auth.uid() = author_id) AND (EXISTS ( SELECT 1
   FROM public.companies c
  WHERE (c.owner_id = auth.uid())))));



  create policy "delete_review_replies"
  on "public"."review_replies"
  as permissive
  for delete
  to authenticated
using (((author_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));



  create policy "insert_review_replies"
  on "public"."review_replies"
  as permissive
  for insert
  to authenticated
with check ((author_id = auth.uid()));



  create policy "select_review_replies"
  on "public"."review_replies"
  as permissive
  for select
  to authenticated
using (true);



  create policy "update_review_replies"
  on "public"."review_replies"
  as permissive
  for update
  to authenticated
using ((author_id = auth.uid()))
with check ((author_id = auth.uid()));



  create policy "delete_reviews"
  on "public"."reviews"
  as permissive
  for delete
  to authenticated
using (((reviewer_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));



  create policy "insert_reviews"
  on "public"."reviews"
  as permissive
  for insert
  to authenticated
with check ((reviewer_id = auth.uid()));



  create policy "select_reviews"
  on "public"."reviews"
  as permissive
  for select
  to authenticated
using (true);



  create policy "update_reviews"
  on "public"."reviews"
  as permissive
  for update
  to authenticated
using ((reviewer_id = auth.uid()))
with check ((reviewer_id = auth.uid()));



  create policy "delete_own_saved_jobs"
  on "public"."saved_jobs"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



  create policy "delete_saved_jobs"
  on "public"."saved_jobs"
  as permissive
  for delete
  to authenticated
using ((user_id = auth.uid()));



  create policy "insert_own_saved_jobs"
  on "public"."saved_jobs"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "insert_saved_jobs"
  on "public"."saved_jobs"
  as permissive
  for insert
  to authenticated
with check ((user_id = auth.uid()));



  create policy "select_own_saved_jobs"
  on "public"."saved_jobs"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "select_saved_jobs"
  on "public"."saved_jobs"
  as permissive
  for select
  to authenticated
using ((user_id = auth.uid()));



  create policy "update_own_saved_jobs"
  on "public"."saved_jobs"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "insert_support_tickets"
  on "public"."support_tickets"
  as permissive
  for insert
  to authenticated
with check ((user_id = auth.uid()));



  create policy "select_support_tickets"
  on "public"."support_tickets"
  as permissive
  for select
  to authenticated
using (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));



  create policy "update_support_tickets"
  on "public"."support_tickets"
  as permissive
  for update
  to authenticated
using (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)))
with check (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));



  create policy "insert_own_user_role"
  on "public"."user_roles"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "insert_user_roles"
  on "public"."user_roles"
  as permissive
  for insert
  to authenticated
with check ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (user_id = auth.uid())));



  create policy "select_own_user_role"
  on "public"."user_roles"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "select_user_roles"
  on "public"."user_roles"
  as permissive
  for select
  to authenticated
using (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));



  create policy "update_own_user_role"
  on "public"."user_roles"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "update_user_roles"
  on "public"."user_roles"
  as permissive
  for update
  to authenticated
using (public.has_role(auth.uid(), 'admin'::public.app_role))
with check (public.has_role(auth.uid(), 'admin'::public.app_role));



  create policy "Applicants view own applications"
  on "public"."applications"
  as permissive
  for select
  to public
using (((auth.uid() = applicant_id) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR (EXISTS ( SELECT 1
   FROM public.jobs j
  WHERE ((j.id = applications.job_id) AND (j.posted_by = auth.uid()))))));



  create policy "admin_select_contact_messages"
  on "public"."contact_messages"
  as permissive
  for select
  to authenticated
using (public.has_role('admin'::public.app_role));



  create policy "admin_select_subscriptions"
  on "public"."subscriptions"
  as permissive
  for select
  to authenticated
using (public.has_role('admin'::public.app_role));



  create policy "admin_update_subscriptions"
  on "public"."subscriptions"
  as permissive
  for update
  to authenticated
using (public.has_role('admin'::public.app_role))
with check (public.has_role('admin'::public.app_role));



  create policy "Users can view own roles"
  on "public"."user_roles"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));


CREATE TRIGGER applications_set_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER prevent_self_job_application_trigger BEFORE INSERT ON public.applications FOR EACH ROW EXECUTE FUNCTION public.prevent_self_job_application();

CREATE TRIGGER sync_application_seeker_id_trigger BEFORE INSERT OR UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.sync_application_seeker_id();

CREATE TRIGGER blog_comments_count_delete AFTER DELETE ON public.blog_comments FOR EACH ROW EXECUTE FUNCTION public.update_blog_comments_count();

CREATE TRIGGER blog_comments_count_insert AFTER INSERT ON public.blog_comments FOR EACH ROW EXECUTE FUNCTION public.update_blog_comments_count();

CREATE TRIGGER blog_likes_count_delete AFTER DELETE ON public.blog_likes FOR EACH ROW EXECUTE FUNCTION public.update_blog_likes_count();

CREATE TRIGGER blog_likes_count_insert AFTER INSERT ON public.blog_likes FOR EACH ROW EXECUTE FUNCTION public.update_blog_likes_count();

CREATE TRIGGER comment_likes_count_delete AFTER DELETE ON public.comment_likes FOR EACH ROW EXECUTE FUNCTION public.update_comment_likes_count();

CREATE TRIGGER comment_likes_count_insert AFTER INSERT ON public.comment_likes FOR EACH ROW EXECUTE FUNCTION public.update_comment_likes_count();

CREATE TRIGGER companies_set_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER company_rating_trigger AFTER INSERT OR DELETE OR UPDATE ON public.company_reviews FOR EACH ROW EXECUTE FUNCTION public.update_company_rating();

CREATE TRIGGER company_reviews_updated_at BEFORE UPDATE ON public.company_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER interviews_updated_at BEFORE UPDATE ON public.interviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER jobs_set_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER messages_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER post_comments_count_delete AFTER DELETE ON public.post_comments FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

CREATE TRIGGER post_comments_count_insert AFTER INSERT ON public.post_comments FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

CREATE TRIGGER post_likes_count_trigger AFTER INSERT OR DELETE ON public.post_likes FOR EACH ROW EXECUTE FUNCTION public.update_post_counters();

CREATE TRIGGER posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER resumes_set_updated_at BEFORE UPDATE ON public.resumes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER resumes_updated_at BEFORE UPDATE ON public.resumes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

drop trigger if exists "on_auth_user_created_referral" on "auth"."users";

drop policy "Public read avatars" on "storage"."objects";

drop policy "Users delete own avatars" on "storage"."objects";

drop policy "Users delete own resume" on "storage"."objects";

drop policy "Users read own attachment" on "storage"."objects";

drop policy "Users read own resume" on "storage"."objects";

drop policy "Users update own avatars" on "storage"."objects";

drop policy "Users update own resume" on "storage"."objects";

drop policy "Users upload own attachment" on "storage"."objects";

drop policy "Users upload own avatars" on "storage"."objects";

drop policy "Users upload own resume" on "storage"."objects";

drop policy "avatars_owner_delete" on "storage"."objects";

drop policy "avatars_owner_update" on "storage"."objects";

drop policy "avatars_owner_write" on "storage"."objects";

drop policy "avatars_public_read" on "storage"."objects";

drop policy "logos_owner_all" on "storage"."objects";

drop policy "logos_public_read" on "storage"."objects";

drop policy "posts_owner_all" on "storage"."objects";

drop policy "posts_public_read" on "storage"."objects";

drop policy "resumes_employer_read" on "storage"."objects";

drop policy "resumes_owner_all" on "storage"."objects";


  create policy "Anyone can view post images"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'posts'::text));



  create policy "Avatars public read"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'avatars'::text));



  create policy "Logos public read"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'company-logos'::text));



  create policy "Users can upload posts"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'posts'::text));



  create policy "Users delete own avatar"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users delete own logo"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'company-logos'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users delete own resumes"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'resumes'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users read own resumes"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'resumes'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users update own avatar"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users update own logo"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'company-logos'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users update own resumes"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'resumes'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users upload own avatar"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users upload own logo"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'company-logos'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users upload own resumes"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'resumes'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



