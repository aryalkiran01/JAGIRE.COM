/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth.middleware";

export type ActivityType =
  | "RESUME_UPLOADED"
  | "RESUME_SCAN_STARTED"
  | "RESUME_SCAN_COMPLETED"
  | "RESUME_SCAN_FAILED"
  | "ATS_SCORE_UPDATED"
  | "CAREER_ROADMAP_GENERATED"
  | "RESUME_UPDATED"
  | "RESUME_DOWNLOADED"
  | "AI_INTERACTION"
  | "PROFILE_UPDATED"
  | "JOB_CREATED"
  | "JOB_UPDATED"
  | "APPLICATION_REVIEWED"
  | "CANDIDATE_SHORTLISTED"
  | "INTERVIEW_SCHEDULED"
  | "AI_MATCHING"
  | "AI_SCREENING"
  | "AI_RECOMMENDATION"
  | "COMPANY_PROFILE_UPDATED"
  | "COMPANY_INTELLIGENCE_SYNCED";

export interface ActivityLogParams {
  userId: string;
  activityType: ActivityType | string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Record a user activity event persistently.
 */
export async function recordUserActivity({
  userId,
  activityType,
  entityType = "resume_scan",
  entityId,
  metadata = {},
}: ActivityLogParams): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from("user_activities").insert({
      user_id: userId,
      activity_type: activityType,
      entity_type: entityType,
      entity_id: entityId ?? null,
      metadata: metadata as any,
    });

    if (error) {
      console.warn("[Activity Tracker] Non-fatal error inserting activity:", error.message);
    }
  } catch (err) {
    console.warn("[Activity Tracker] Exception recording activity:", err);
  }
}

/**
 * Get authenticated user's own scan history.
 */
export const getUserResumeScans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    if (!userId) throw new Error("Not authenticated");

    const { data: scans, error } = await supabaseAdmin
      .from("resume_scans")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching user resume scans:", error.message);
      return [];
    }

    return scans ?? [];
  });

/**
 * Get authenticated user's recent activities.
 */
export const getUserActivities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    if (!userId) throw new Error("Not authenticated");

    const { data: activities, error } = await supabaseAdmin
      .from("user_activities")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      console.error("Error fetching user activities:", error.message);
      return [];
    }

    return activities ?? [];
  });

/**
 * Update user's profile full name (e.g. from AI prompt interaction).
 */
export const updatePreferredName = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ name: z.string().min(1).max(100) }))
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    if (!userId) throw new Error("Not authenticated");

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: data.name.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) throw new Error(error.message);

    await recordUserActivity({
      userId,
      activityType: "AI_INTERACTION",
      entityType: "profile",
      entityId: userId,
      metadata: { action: "preferred_name_updated", name: data.name.trim() },
    });

    return { success: true, name: data.name.trim() };
  });
