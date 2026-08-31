/* eslint-disable @typescript-eslint/no-explicit-any */

import { createServerFn } from "@tanstack/react-start";
import { randomBytes, createHash } from "node:crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth.middleware";
import { requirePremium } from "@/lib/premium.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function getCompanyIdForUser(userId: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("companies")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();
  if (error || !data) throw new Error("You don't have a company. Create one first.");
  return data.id;
}

// ── Departments ──────────────────────────────────────────────────────────────────

export const listDepartments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const companyId = await getCompanyIdForUser(context.userId);
    const { data, error } = await supabaseAdmin
      .from("departments")
      .select("*, head:profiles(id,full_name,avatar_url), members:department_members(count)")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    if (error) throw new Error("Failed to fetch departments");
    return { departments: data ?? [] };
  });

export const createDepartment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { name: string; description?: string; headId?: string };
    if (!i?.name?.trim()) throw new Error("Department name is required");
    return {
      name: i.name.trim().slice(0, 100),
      description: (i.description ?? "").trim().slice(0, 500),
      headId: i.headId || undefined,
    };
  })
  .handler(async ({ data, context }) => {
    await requirePremium(context.userId);
    const companyId = await getCompanyIdForUser(context.userId);

    const { data: dept, error } = await supabaseAdmin
      .from("departments")
      .insert({
        company_id: companyId,
        name: data.name,
        description: data.description,
        head_id: data.headId ?? null,
      })
      .select()
      .single();

    if (error) throw new Error("Failed to create department");

    await supabaseAdmin.rpc("log_audit_entry", {
      p_company_id: companyId,
      p_user_id: context.userId,
      p_action: "department.created",
      p_entity_type: "department",
      p_entity_id: dept.id,
      p_metadata: { name: data.name },
    });

    return { department: dept };
  });

export const deleteDepartment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { departmentId: string };
    if (!i?.departmentId) throw new Error("Department ID is required");
    return { departmentId: i.departmentId };
  })
  .handler(async ({ data, context }) => {
    const companyId = await getCompanyIdForUser(context.userId);
    const { error } = await supabaseAdmin
      .from("departments")
      .delete()
      .eq("id", data.departmentId)
      .eq("company_id", companyId);
    if (error) throw new Error("Failed to delete department");

    await supabaseAdmin.rpc("log_audit_entry", {
      p_company_id: companyId,
      p_user_id: context.userId,
      p_action: "department.deleted",
      p_entity_type: "department",
      p_entity_id: data.departmentId,
    });

    return { success: true };
  });

// ── Audit Logs ────────────────────────────────────────────────────────────────────

export const listAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = (input ?? {}) as { limit?: number; offset?: number };
    return { limit: i.limit ?? 50, offset: i.offset ?? 0 };
  })
  .handler(async ({ data, context }) => {
    const companyId = await getCompanyIdForUser(context.userId);
    const { data: logs, error } = await supabaseAdmin
      .from("audit_logs")
      .select("*, user:profiles!audit_logs_user_id_fkey(full_name,avatar_url)")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .range(data.offset, data.offset + data.limit - 1);
    if (error) throw new Error("Failed to fetch audit logs");
    return { logs: logs ?? [], hasMore: (logs?.length ?? 0) === data.limit };
  });

// ── API Keys ──────────────────────────────────────────────────────────────────────

export const listApiKeys = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const companyId = await getCompanyIdForUser(context.userId);
    const { data: keys, error } = await supabaseAdmin
      .from("api_keys")
      .select("id,name,key_prefix,permissions,last_used_at,expires_at,created_at,revoked_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    if (error) throw new Error("Failed to fetch API keys");
    return { keys: keys ?? [] };
  });

export const createApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { name: string; permissions?: Record<string, unknown>; expiresAt?: string };
    if (!i?.name?.trim()) throw new Error("Key name is required");
    return {
      name: i.name.trim().slice(0, 100),
      permissions: i.permissions ?? {},
      expiresAt: i.expiresAt || undefined,
    };
  })
  .handler(async ({ data, context }) => {
    await requirePremium(context.userId);
    const companyId = await getCompanyIdForUser(context.userId);

    const rawKey = `jgr_${randomBytes(32).toString("hex")}`;
    const keyHash = createHash("sha256").update(rawKey).digest("hex");
    const keyPrefix = rawKey.slice(0, 12);

    const { data: apiKey, error } = await supabaseAdmin
      .from("api_keys")
      .insert({
        company_id: companyId,
        name: data.name,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        permissions: data.permissions,
        expires_at: data.expiresAt ?? null,
        created_by: context.userId,
      })
      .select("id,name,key_prefix,created_at")
      .single();

    if (error) throw new Error("Failed to create API key");

    await supabaseAdmin.rpc("log_audit_entry", {
      p_company_id: companyId,
      p_user_id: context.userId,
      p_action: "api_key.created",
      p_entity_type: "api_key",
      p_entity_id: apiKey.id,
      p_metadata: { name: data.name },
    });

    return { apiKey, rawKey };
  });

export const revokeApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { keyId: string };
    if (!i?.keyId) throw new Error("Key ID is required");
    return { keyId: i.keyId };
  })
  .handler(async ({ data, context }) => {
    const companyId = await getCompanyIdForUser(context.userId);
    const { error } = await supabaseAdmin
      .from("api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", data.keyId)
      .eq("company_id", companyId);
    if (error) throw new Error("Failed to revoke API key");

    await supabaseAdmin.rpc("log_audit_entry", {
      p_company_id: companyId,
      p_user_id: context.userId,
      p_action: "api_key.revoked",
      p_entity_type: "api_key",
      p_entity_id: data.keyId,
    });

    return { success: true };
  });
