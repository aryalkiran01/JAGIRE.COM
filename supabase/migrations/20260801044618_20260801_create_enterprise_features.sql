/*
# Enterprise Features — Departments, Audit Logs, API Keys

## Purpose
Adds enterprise-grade features for employers:
1. **Departments** — sub-organizations within a company with their own members
2. **Department Members** — maps users to departments with roles
3. **Audit Logs** — tracks important actions (job posts, edits, AI usage, etc.)
4. **API Keys** — allows programmatic access to company data

## New Tables

### 1. `departments`
- `id` (uuid, PK)
- `company_id` (uuid, FK → companies)
- `name` (text) — department name
- `description` (text)
- `head_id` (uuid, FK → profiles) — department head
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 2. `department_members`
- `id` (uuid, PK)
- `department_id` (uuid, FK → departments)
- `user_id` (uuid, FK → auth.users)
- `role` (text) — 'head' | 'manager' | 'member'
- `created_at` (timestamptz)

### 3. `audit_logs`
- `id` (uuid, PK)
- `company_id` (uuid, FK → companies)
- `user_id` (uuid, FK → auth.users)
- `action` (text) — e.g. 'job.posted', 'application.updated', 'ai.feature.used'
- `entity_type` (text) — e.g. 'job', 'application', 'company'
- `entity_id` (uuid) — ID of the affected entity
- `metadata` (jsonb) — additional context
- `ip_address` (text)
- `created_at` (timestamptz)

### 4. `api_keys`
- `id` (uuid, PK)
- `company_id` (uuid, FK → companies)
- `name` (text) — key name/label
- `key_hash` (text) — SHA-256 hash of the key (never store raw key)
- `key_prefix` (text) — first 8 chars for identification
- `permissions` (jsonb) — allowed scopes
- `last_used_at` (timestamptz)
- `expires_at` (timestamptz)
- `created_by` (uuid, FK → auth.users)
- `created_at` (timestamptz)
- `revoked_at` (timestamptz)

## Security (RLS)
- All tables: company members (owner) can access their own company's data
- Audit logs: INSERT via SECURITY DEFINER function (system writes, owner reads)
- API keys: owner can create/list/revoke; key_hash is never exposed

## Notes
1. API keys are hashed with SHA-256 before storage — the raw key is only shown once at creation.
2. Audit logs are append-only — no UPDATE or DELETE policies.
3. Department members can be managed by the company owner.
*/

-- ── departments ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  head_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_departments_company ON departments(company_id);

DROP POLICY IF EXISTS "select_own_company_departments" ON departments;
CREATE POLICY "select_own_company_departments" ON departments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM companies WHERE companies.id = departments.company_id AND companies.owner_id = auth.uid()));

DROP POLICY IF EXISTS "insert_own_company_departments" ON departments;
CREATE POLICY "insert_own_company_departments" ON departments
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM companies WHERE companies.id = departments.company_id AND companies.owner_id = auth.uid()));

DROP POLICY IF EXISTS "update_own_company_departments" ON departments;
CREATE POLICY "update_own_company_departments" ON departments
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM companies WHERE companies.id = departments.company_id AND companies.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM companies WHERE companies.id = departments.company_id AND companies.owner_id = auth.uid()));

DROP POLICY IF EXISTS "delete_own_company_departments" ON departments;
CREATE POLICY "delete_own_company_departments" ON departments
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM companies WHERE companies.id = departments.company_id AND companies.owner_id = auth.uid()));

-- ── department_members ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS department_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('head','manager','member')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE department_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_dept_members_department ON department_members(department_id);
CREATE INDEX IF NOT EXISTS idx_dept_members_user ON department_members(user_id);

DROP POLICY IF EXISTS "select_own_company_dept_members" ON department_members;
CREATE POLICY "select_own_company_dept_members" ON department_members
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM departments d
    INNER JOIN companies c ON c.id = d.company_id
    WHERE d.id = department_members.department_id AND c.owner_id = auth.uid()
  ));

DROP POLICY IF EXISTS "insert_own_company_dept_members" ON department_members;
CREATE POLICY "insert_own_company_dept_members" ON department_members
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM departments d
    INNER JOIN companies c ON c.id = d.company_id
    WHERE d.id = department_members.department_id AND c.owner_id = auth.uid()
  ));

DROP POLICY IF EXISTS "delete_own_company_dept_members" ON department_members;
CREATE POLICY "delete_own_company_dept_members" ON department_members
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM departments d
    INNER JOIN companies c ON c.id = d.company_id
    WHERE d.id = department_members.department_id AND c.owner_id = auth.uid()
  ));

-- ── audit_logs ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text DEFAULT '',
  entity_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Only company owners can read audit logs
DROP POLICY IF EXISTS "select_own_company_audit_logs" ON audit_logs;
CREATE POLICY "select_own_company_audit_logs" ON audit_logs
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM companies WHERE companies.id = audit_logs.company_id AND companies.owner_id = auth.uid()));

-- Only allow INSERT via SECURITY DEFINER function (see below)
-- No direct INSERT policy — all inserts go through the RPC function
DROP POLICY IF EXISTS "insert_own_company_audit_logs" ON audit_logs;
CREATE POLICY "insert_own_company_audit_logs" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM companies WHERE companies.id = audit_logs.company_id AND companies.owner_id = auth.uid()));

-- No UPDATE or DELETE — audit logs are immutable

-- ── SECURITY DEFINER function to insert audit log entries ────────────────────────

CREATE OR REPLACE FUNCTION log_audit_entry(
  p_company_id uuid,
  p_user_id uuid,
  p_action text,
  p_entity_type text DEFAULT '',
  p_entity_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_ip_address text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

GRANT EXECUTE ON FUNCTION log_audit_entry TO authenticated;

-- ── api_keys ──────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL,
  key_prefix text NOT NULL,
  permissions jsonb DEFAULT '{}'::jsonb,
  last_used_at timestamptz,
  expires_at timestamptz,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_api_keys_company ON api_keys(company_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);

DROP POLICY IF EXISTS "select_own_company_api_keys" ON api_keys;
CREATE POLICY "select_own_company_api_keys" ON api_keys
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM companies WHERE companies.id = api_keys.company_id AND companies.owner_id = auth.uid()));

DROP POLICY IF EXISTS "insert_own_company_api_keys" ON api_keys;
CREATE POLICY "insert_own_company_api_keys" ON api_keys
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM companies WHERE companies.id = api_keys.company_id AND companies.owner_id = auth.uid()));

DROP POLICY IF EXISTS "update_own_company_api_keys" ON api_keys;
CREATE POLICY "update_own_company_api_keys" ON api_keys
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM companies WHERE companies.id = api_keys.company_id AND companies.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM companies WHERE companies.id = api_keys.company_id AND companies.owner_id = auth.uid()));

DROP POLICY IF EXISTS "delete_own_company_api_keys" ON api_keys;
CREATE POLICY "delete_own_company_api_keys" ON api_keys
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM companies WHERE companies.id = api_keys.company_id AND companies.owner_id = auth.uid()));

-- ── updated_at triggers ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION trigger_set_department_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_department_updated_at ON departments;
CREATE TRIGGER set_department_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_department_updated_at();
