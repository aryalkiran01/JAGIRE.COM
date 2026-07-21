# AI Job Portal (Jagire) — Complete Feature Documentation

## Overview

A full-featured AI-powered job portal built with React, TypeScript, TanStack Router, React Query, and Supabase. Supports job seekers, employers, and admins with real-time messaging, interview scheduling, assessments, community feed, blogging, and more.

## Architecture

- **Frontend**: React 19 + TanStack Router + React Query + Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Edge Functions, Storage)
- **Email**: Resend via Supabase Edge Function (`send-email`)
- **Calendar**: Google Calendar API integration for interview scheduling
- **AI**: Google Gemini for job matching and resume scanning

## Database Schema

### Core Tables

| Table                  | Purpose                                              |
| ---------------------- | ---------------------------------------------------- |
| `profiles`             | User profiles (job seekers, employers, admins)       |
| `user_roles`           | Role assignments (`job_seeker`, `employer`, `admin`) |
| `companies`            | Company profiles owned by employers                  |
| `jobs`                 | Job postings with status, type, experience level     |
| `applications`         | Job applications with status workflow                |
| `application_events`   | Event log for each application status change         |
| `interviews`           | Interview records linked to applications             |
| `interview_events`     | Google Calendar interview events with Meet links     |
| `meetings`             | Formal meeting records                               |
| `notifications`        | User notifications for all events                    |
| `chats`                | 1:1 conversation threads between users               |
| `messages`             | Individual messages in chats                         |
| `posts`                | Community feed posts                                 |
| `post_comments`        | Comments and replies on posts                        |
| `post_likes`           | Like records                                         |
| `post_saves`           | Saved posts                                          |
| `post_reports`         | Reports for moderation                               |
| `blogs`                | Blog articles                                        |
| `assessments`          | Assessment definitions with questions                |
| `assessment_attempts`  | User attempt records with scores                     |
| `support_tickets`      | Support ticket system                                |
| `saved_jobs`           | Bookmarked jobs                                      |
| `reviews`              | Company reviews                                      |
| `review_replies`       | Replies to reviews                                   |
| `app_user_connections` | OAuth tokens (Google Calendar)                       |
| `reports`              | General content reports                              |
| `referrals`            | Referral tracking                                    |
| `follows`              | User follow relationships                            |
| `categories`           | Job/content categories                               |
| `resumes`              | User resumes with parsed data                        |
| `activity_logs`        | User activity audit log                              |

### Enums

- **`app_role`**: `job_seeker`, `seeker`, `employer`, `admin`
- **`application_status`**: `applied`, `viewed`, `reviewing`, `shortlisted`, `interview`, `interview_scheduled`, `interview_completed`, `selected`, `rejected`, `offer`, `withdrawn`
- **`job_status`**: `draft`, `published`, `closed`, `active`, `paused`
- **`job_type`**: `full_time`, `part_time`, `contract`, `internship`, `remote`, `freelance`
- **`experience_level`**: `entry`, `junior`, `mid`, `senior`, `lead`, `executive`

### RPC Functions

| Function                                                                | Purpose                                            |
| ----------------------------------------------------------------------- | -------------------------------------------------- |
| `get_user_role(user_id)`                                                | Returns the role for a user                        |
| `has_role(user_id, role)`                                               | Checks if user has a specific role                 |
| `submit_assessment(assessment_id, answers)`                             | Validates answers, computes score, records attempt |
| `get_assessment_questions(assessment_id)`                               | Returns questions without correct answers          |
| `create_notification(user_id, type, title, message, link, metadata)`    | Creates a notification                             |
| `get_or_create_chat(user_a, user_b)`                                    | Returns existing or creates new chat between users |
| `update_application_status(application_id, new_status, actor_id, note)` | Updates status, creates event + notification       |

### RLS (Row Level Security)

All tables have RLS enabled with ownership-based policies:

- Users can only CRUD their own data (resumes, profiles, posts, etc.)
- Public data (jobs, companies, blogs, posts) is readable by all authenticated users
- Admin role (`has_role(auth.uid(), 'admin')`) gets elevated access
- Application events visible to both seeker and employer
- Messages visible to both chat participants

---

## Feature Flows

### 1. Job CRUD (Employer)

**Create Job** (`/employer/jobs/new`):

1. Employer must have a company profile first
2. Fill in title, description, requirements, responsibilities, benefits, skills, location, salary, job type, experience level
3. Job is created with `status: 'active'`
4. Redirected to job applicants page

**Edit/Delete/Publish/Close**:

- Employer can update job fields via the employer dashboard
- Job status can be toggled between `active`, `closed`, `draft`, `paused`
- Deleting a job cascades to applications and interview records

**Routes**:

- `/employer/jobs/new` — Create job
- `/employer/jobs/$jobId` — View applicants for a job
- `/employer` — Employer dashboard with job list

### 2. Application Workflow

**Status Flow**:

```
Applied → Viewed → Reviewing → Shortlisted → Interview Scheduled → Interview Completed → Selected
                    ↓                                                                    ↓
                 Rejected                                                              Offer
                    ↓
                 Withdrawn
```

**How it works**:

1. **Job seeker applies** (`ApplyJobDialog`): Submits cover letter + optional resume. Application created with `status: 'applied'`. An `application_events` row is created. Notification sent to employer.
2. **Employer reviews** (`/employer/jobs/$jobId`): Views all applicants, can change status via dropdown. Each status change:
   - Updates `applications.status`
   - Creates an `application_events` row with event type and timestamp
   - Creates a `notifications` row for the job seeker
3. **Job seeker tracks** (`/applications`): Views all applications with a timeline of events showing each status change.

**Status Values and Meanings**:

| Status                              | Meaning                                |
| ----------------------------------- | -------------------------------------- |
| `applied`                           | Initial application submitted          |
| `viewed`                            | Employer opened/viewed the application |
| `reviewing`                         | Employer is actively reviewing         |
| `shortlisted`                       | Passed initial screening               |
| `interview` / `interview_scheduled` | Interview has been scheduled           |
| `interview_completed`               | Interview finished, awaiting decision  |
| `selected`                          | Candidate selected for the role        |
| `rejected`                          | Candidate not selected                 |
| `offer`                             | Job offer extended                     |
| `withdrawn`                         | Candidate withdrew application         |

### 3. Interview Workflow

**Scheduling** (`ScheduleInterviewDialog`):

1. Employer clicks "Schedule" on an applicant card
2. Dialog checks Google Calendar connection status
3. If not connected: Employer connects Google account via OAuth popup
   - OAuth flow: `startGoogleCalendarConnect` → Google consent → `saveGoogleCalendarConnection`
   - Refresh token stored encrypted in `app_user_connections`
4. If connected: Employer enters title, start time, duration
5. `scheduleInterview` server function:
   - Creates Google Calendar event with `conferenceData` (auto-generates Meet link)
   - Sends email invitation to candidate via Google Calendar (`sendUpdates: all`)
   - Saves event to `interview_events` table with `meet_link`, `google_event_id`
   - Creates a notification for the candidate
6. Meet link is copied to clipboard for sharing

**Candidate Accept/Decline**:

- Candidate sees interview notification in dashboard and notifications page
- Interview record includes `accepted_at` / `declined_at` timestamps
- Both employer and candidate can see interview status

**Dashboard Display**:

- Employer dashboard: Shows upcoming interviews with candidate name, date, Meet link
- Candidate dashboard: Shows scheduled interviews with employer info and Meet link

**Email Invitation**:

- Google Calendar automatically sends email invitation to candidate
- Additional email notifications sent via `send-email` edge function for:
  - Interview scheduled
  - Interview reminder (can be configured)
  - Interview cancelled

### 4. Email Notifications

**Edge Function**: `send-email` (deployed to Supabase)

**Triggered for**:

| Event                      | Recipient  | Content                                               |
| -------------------------- | ---------- | ----------------------------------------------------- |
| Application received       | Employer   | New application for {job title} from {candidate}      |
| Application status changed | Job seeker | Your application status is now {status}               |
| Shortlisted                | Job seeker | You've been shortlisted for {job title}               |
| Interview scheduled        | Job seeker | Interview scheduled for {date} — Meet link: {link}    |
| Selected                   | Job seeker | Congratulations! You've been selected for {job title} |
| Rejected                   | Job seeker | Update on your application for {job title}            |
| Job offer                  | Job seeker | Job offer for {job title}                             |
| New message                | Recipient  | New message from {sender}                             |
| Assessment assigned        | Job seeker | New assessment: {assessment title}                    |

**Configuration**:

- Set `RESEND_API_KEY` as a Supabase Edge Function secret
- The `send-email` function uses Resend API (`https://api.resend.com/emails`)
- From address: `Jagire <noreply@resend.dev>`

### 5. Real-Time Messaging

**Architecture**:

- `chats` table: Stores 1:1 conversation threads between `user_a` and `user_b`
- `messages` table: Individual messages with `sender_id`, `receiver_id`, `chat_id`, `body`, `is_read`, `read_at`
- Real-time via Supabase Realtime channels

**Flow**:

1. **Start conversation**: Employer clicks message icon on applicant card → navigates to `/messages?with={userId}`
2. **Chat list**: Left panel shows all conversations with latest message preview and unread count
3. **Active chat**: Right panel shows message history with real-time updates
4. **Send message**: Type and send — message inserted into `messages` table, triggers real-time event
5. **Read receipts**: Messages marked as `is_read: true` when viewed by recipient
6. **Notifications**: New message creates a notification for the recipient

**Real-time subscription**:

```typescript
supabase
  .channel("messages")
  .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, handler)
  .subscribe();
```

### 6. Blog CRUD

**Routes**:

- `/blog` — Public blog listing (published posts only)
- `/blog/$slug` — Individual blog post
- `/blog-editor` — Author's blog management

**Create/Edit** (`/blog-editor`):

1. Author creates new post with title, slug, excerpt, content (markdown), cover image, tags, published flag
2. Save: Insert or update in `blogs` table
3. Publish: Set `published: true` and `published_at: now()`
4. Draft: `published: false` — only visible to author

**Delete**: Author can delete their own posts; admins can delete any post

### 7. Community Posts CRUD

**Feed** (`/feed`):

1. **Create post**: Text content + optional image upload (stored in Supabase Storage `posts` bucket)
2. **View feed**: All posts ordered by `created_at DESC` with author info, likes count, comments count
3. **Like**: Toggle like on any post (insert/delete in `post_likes`)
4. **Save**: Bookmark posts (insert/delete in `post_saves`)
5. **Comment**: Add comment to any post (insert in `post_comments` with `content`)
6. **Reply**: Comments support `parent_id` for threaded replies
7. **Edit/Delete**: Authors can edit/delete their own posts and comments
8. **Report**: Users can report posts for moderation (insert in `post_reports`)
9. **Pagination**: Load 50 posts at a time with infinite scroll capability
10. **Real-time**: New posts and likes update via Supabase Realtime channels

**Triggers**:

- `post_comments_count_trigger`: Updates `posts.comments_count` on comment insert/delete
- `post_likes_count_trigger`: Updates `posts.likes_count` on like insert/delete

### 8. Admin Dashboard

**Route**: `/admin` (requires `admin` role)

**Analytics**:

- Total users, jobs, applications, companies count cards
- Real-time stats via `supabase.from('table').select('*', { count: 'exact', head: true })`

**User Management**:

- View all users with their roles (joined from `profiles` + `user_roles`)
- Promote/demote roles: Update `user_roles.role` between `job_seeker`, `employer`, `admin`
- Suspend/delete users

**Job Management**:

- View all jobs with company name and application count
- Activate/close jobs (toggle `status` between `active` and `closed`)

**Company Management**:

- View all companies
- Verify companies (set `is_verified: true` or `verification_status: 'verified'`)
- Suspend/delete companies

**Blog Management**:

- View, edit, delete any blog post

**Support Tickets**:

- View all support tickets
- Reply to tickets (update `admin_reply` and `status`)
- Mark as resolved/in_progress

**Content Moderation**:

- View reported posts (`post_reports` and `reports` tables)
- Review and action reports (update `status` to `reviewed`, `actioned`, or `dismissed`)
- Delete reported content if necessary

### 9. Assessment Flow

**Routes**:

- `/assessments` — Assessment list and taking interface

**Create/Edit/Delete** (Admin/Employer):

1. Create assessment with title, description, category, difficulty, duration, passing score
2. Add questions as JSON array: `[{ question, options: [], correct_answer, points }]`
3. Set `is_active: true` to publish
4. Edit: Update fields and questions
5. Delete: Remove assessment (cascades to attempts)

**Take Assessment** (Job Seeker):

1. View available assessments on dashboard
2. Click "Take assessment" → questions displayed without correct answers
3. Select answers for each question
4. Submit: Calls `submit_assessment` RPC function
   - Validates answers against `correct_answer` field
   - Computes score as `(correct / total) * 100`
   - Checks against `passing_score` (default 70)
   - Records attempt in `assessment_attempts` with `score`, `passed`, `answers`, `completed_at`

**Scoring**:

- Score = percentage of correct answers
- Pass/Fail = score >= passing_score
- Attempt history visible to user and admin

### 10. Notifications System

**Table**: `notifications` (columns: `user_id`, `type`, `title`, `message`, `link`, `metadata`, `is_read`, `created_at`)

**Types**:

| Type          | Trigger                                  |
| ------------- | ---------------------------------------- |
| `application` | Application status changed               |
| `interview`   | Interview scheduled/cancelled            |
| `message`     | New message received                     |
| `assessment`  | Assessment assigned/completed            |
| `admin`       | Admin action (role change, verification) |
| `job`         | New job matching preferences             |
| `system`      | System announcements                     |

**Flow**:

1. Event occurs (e.g., application status change)
2. `create_notification()` RPC inserts a row
3. User sees unread badge in header
4. Notifications page shows all notifications with timestamps
5. Click marks as read (`is_read: true`)
6. "Mark all read" button bulk updates

**Real-time**: Notifications update via Supabase Realtime subscription on the `notifications` table

---

## Edge Functions

### `send-email`

**Purpose**: Sends transactional emails via Resend API

**Endpoint**: `POST /functions/send-email`

**Request body**:

```json
{
  "to": "user@example.com",
  "subject": "Email subject",
  "html": "<h1>HTML content</h1>",
  "text": "Plain text fallback"
}
```

**Required secret**: `RESEND_API_KEY`

---

## Environment Variables

| Variable                     | Purpose                                 |
| ---------------------------- | --------------------------------------- |
| `SUPABASE_URL`               | Supabase project URL                    |
| `SUPABASE_ANON_KEY`          | Supabase anon/public key                |
| `SUPABASE_SERVICE_ROLE_KEY`  | Supabase service role key (server only) |
| `GOOGLE_OAUTH_CLIENT_ID`     | Google OAuth client ID for Calendar     |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google OAuth client secret              |
| `RESEND_API_KEY`             | Resend API key for emails               |
| `GEMINI_API_KEY`             | Google Gemini AI API key                |

---

## File Structure

```
src/
├── components/
│   ├── apply-job-dialog.tsx        # Job application dialog
│   ├── schedule-interview-dialog.tsx # Interview scheduling with Google Calendar
│   ├── layout/
│   │   ├── site-header.tsx         # Navigation header
│   │   └── site-footer.tsx         # Footer
│   └── ui/                         # shadcn/ui components
├── hooks/
│   ├── use-auth.tsx                # Auth context with role management
│   └── use-mobile.tsx              # Mobile detection
├── integrations/
│   ├── gemini/server.ts            # Gemini AI server functions
│   └── supabase/
│       ├── client.ts               # Browser Supabase client
│       ├── client.server.ts        # Server Supabase client (service role)
│       ├── auth-attacher.ts         # Auth session attacher
│       ├── auth-middleware.ts       # Auth middleware for server functions
│       └── types.ts                 # Generated database types
├── lib/
│   ├── ai.functions.ts             # AI-powered job matching
│   ├── connection-key-crypto.server.ts # OAuth token encryption
│   ├── demo-seed.ts                 # Demo data seeding
│   ├── error-capture.ts            # Error boundary capture
│   ├── error-page.ts               # Error page component
│   ├── google-calendar.functions.ts # Google Calendar server functions
│   └── utils.ts                    # Utility functions
├── routes/
│   ├── __root.tsx                  # Root layout
│   ├── index.tsx                   # Landing page
│   ├── auth.tsx                    # Login/signup
│   ├── _authenticated.tsx          # Authenticated layout
│   ├── _authenticated/
│   │   ├── dashboard.tsx           # Job seeker dashboard
│   │   ├── applications.tsx        # Application tracking
│   │   ├── admin.tsx               # Admin panel
│   │   ├── assessments.tsx         # Assessment taking
│   │   ├── blog-editor.tsx          # Blog management
│   │   ├── career.tsx              # Career resources
│   │   ├── employer.tsx            # Employer layout
│   │   ├── employer/
│   │   │   ├── company.tsx         # Company profile
│   │   │   ├── jobs/
│   │   │   │   ├── new.tsx         # Create job
│   │   │   │   └── $jobId.tsx      # Job applicants
│   │   │   └── index.tsx           # Employer dashboard
│   │   ├── feed.tsx                # Community feed
│   │   ├── learn.tsx               # Learning resources
│   │   ├── messages.tsx            # Real-time messaging
│   │   ├── notifications.tsx       # Notifications
│   │   ├── profile.tsx             # User profile
│   │   ├── referrals.tsx           # Referral tracking
│   │   ├── resume-builder.tsx      # Resume builder
│   │   ├── resume-scanner.tsx      # ATS resume scanner
│   │   └── saved.tsx               # Saved jobs
│   ├── blog/
│   │   ├── index.tsx               # Blog listing
│   │   └── $slug.tsx               # Blog post
│   ├── jobs/
│   │   ├── index.tsx               # Job listings
│   │   └── $jobId.tsx              # Job detail
│   ├── companies/
│   │   ├── index.tsx               # Company listings
│   │   └── $slug.tsx               # Company profile + reviews
│   ├── pricing.tsx                 # Pricing page
│   ├── checkout.$plan.tsx          # Stripe checkout
│   ├── support.tsx                 # Support tickets
│   └── google-calendar.callback.tsx # OAuth callback
├── router.tsx                      # Router configuration
├── server.ts                       # Server configuration
├── start.ts                        # App entry point
└── styles.css                      # Global styles
supabase/
├── functions/
│   └── send-email/index.ts         # Email edge function
└── migrations/                     # SQL migrations
```

---

## Setup Checklist

1. **Database**: All migrations applied (enums, tables, columns, RLS, functions, indexes)
2. **Types**: `types.ts` regenerated to match actual DB schema
3. **Edge Functions**: `send-email` deployed with `RESEND_API_KEY` secret
4. **Storage Buckets**: `resumes`, `posts` buckets created in Supabase Storage
5. **Auth**: Email/password enabled, email confirmation off
6. **Google OAuth**: Client ID/secret configured for Calendar integration
7. **Build**: `npm run build` passes with zero TypeScript errors
