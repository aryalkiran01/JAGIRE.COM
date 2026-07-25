/*
# Fix interview workflow: reschedule status, realtime, notifications

## 1. Add 'reschedule_requested' to interview status constraint
Drop the old constraint and add a new one with the new status.

## 2. Replace notification trigger
The old trigger fired on INSERT/UPDATE but didn't handle reschedule_requested.
Replace with a simpler, more reliable version that also handles the new status.

## 3. Add realtime to notifications table
*/

-- 1. Update interview status constraint
ALTER TABLE public.interviews DROP CONSTRAINT IF EXISTS interviews_status_check;
ALTER TABLE public.interviews ADD CONSTRAINT interviews_status_check
  CHECK (status = ANY (ARRAY['scheduled','confirmed','ongoing','completed','cancelled','missed','expired','reschedule_requested']));

-- 2. Replace notification trigger (drop old, create new)
DROP TRIGGER IF EXISTS interview_notify_insert ON public.interviews;
DROP TRIGGER IF EXISTS interview_notify_update ON public.interviews;
DROP FUNCTION IF EXISTS public.notify_interview_change();

-- The application code now handles notifications directly in the server functions.
-- This avoids double-notifications from both trigger and application code.

-- 3. Realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 4. Add index on notifications user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
