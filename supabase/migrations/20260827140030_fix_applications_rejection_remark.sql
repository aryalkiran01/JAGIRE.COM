/*
# Fix applications table — add missing rejection_remark column

## Problem
The employer job detail page queries `rejection_remark` from the applications table,
but this column was never created in the database. This causes the entire Supabase
query to fail with a PostgREST error, returning no data — so the employer sees
0 applicants even when applications exist.

## Fix
Add the `rejection_remark` column (nullable text) to the applications table.
Also backfill any existing rejected applications that have remarks stored in
`employer_notes` to the new column for consistency.

## Security
No RLS policy changes needed — existing policies already cover the column.
*/

ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS rejection_remark text;

-- Backfill: move any rejection remarks from employer_notes to rejection_remark
-- for applications that were rejected but don't have rejection_remark set
UPDATE public.applications
SET rejection_remark = employer_notes
WHERE status = 'rejected'
  AND rejection_remark IS NULL
  AND employer_notes IS NOT NULL
  AND employer_notes != '';
