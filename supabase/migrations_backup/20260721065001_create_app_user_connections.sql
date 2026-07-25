/*
# Create app_user_connections table

1. Purpose
   Stores per-user encrypted OAuth connection keys for third-party connectors
   (e.g. Google Calendar). The ciphertext is produced by the server-side
   connection-key-crypto module using AES-256-GCM. Only the owning user can
   read or modify their own rows; the service_role bypasses RLS for server
   operations.

2. New Tables
   - `app_user_connections`
     - `id` (uuid, primary key)
     - `user_id` (uuid, not null, references auth.users, cascade on delete)
     - `connector_id` (text, not null — e.g. "google_calendar")
     - `connection_key_ciphertext` (text, not null — base64 AES-256-GCM blob)
     - `created_at` (timestamptz, default now())
     - `updated_at` (timestamptz, default now())
     - Unique constraint on (user_id, connector_id) — one connection per user per connector

3. Security
   - Enable RLS on `app_user_connections`.
   - Owner-scoped CRUD: each authenticated user can only access their own rows.
   - service_role retains full access (bypasses RLS) for server-side operations.
*/

CREATE TABLE IF NOT EXISTS public.app_user_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connector_id text NOT NULL,
  connection_key_ciphertext text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_user_connections_user_connector_unique UNIQUE (user_id, connector_id)
);

ALTER TABLE public.app_user_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_connections" ON public.app_user_connections;
CREATE POLICY "select_own_connections" ON public.app_user_connections
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_connections" ON public.app_user_connections;
CREATE POLICY "insert_own_connections" ON public.app_user_connections
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_connections" ON public.app_user_connections;
CREATE POLICY "update_own_connections" ON public.app_user_connections
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_connections" ON public.app_user_connections;
CREATE POLICY "delete_own_connections" ON public.app_user_connections
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
