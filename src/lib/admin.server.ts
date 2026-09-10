/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth.middleware";
const deleteJobSchema = z.object({
  jobId: z.string().uuid("Invalid job ID"),
});

async function notifyUser(
  supabaseAdmin: any,
  userId: string | null,
  title: string,
  body: string,
  type: "interview" | "application" | "message" | "system" = "system",
  link = "/dashboard",
  metadata: Record<string, unknown> = {},
) {
  if (!userId) return;
  const { error } = await supabaseAdmin.from("notifications").insert({
    user_id: userId,
    type,
    title,
    message: body,
    metadata,
    link,
    is_read: false,
  });
  if (error) console.error("[notifyUser] insert failed:", error.message);
}

export const adminDeleteJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(deleteJobSchema)

  .handler(async ({ data, context }) => {
    const userId = (context as any)?.userId;
    if (!userId) throw new Error("Not authenticated");

    // Verify admin role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (!roleData || roleData.role !== "admin") {
      throw new Error("Not authorized: admin role required");
    }

    // Fetch the job to get info for notification
    const { data: job, error: jobError } = await supabaseAdmin
      .from("jobs")
      .select("id, title, company_id, employer_id, posted_by")
      .eq("id", data.jobId)
      .maybeSingle();

    if (jobError) throw new Error(jobError.message);
    if (!job) throw new Error("Job not found");

    // Delete related data: applications, interviews, saved_jobs
    await supabaseAdmin.from("interviews").delete().eq("job_id", data.jobId);
    await supabaseAdmin.from("applications").delete().eq("job_id", data.jobId);
    await supabaseAdmin.from("saved_jobs").delete().eq("job_id", data.jobId);

    // Delete the job itself
    const { error: deleteError } = await supabaseAdmin.from("jobs").delete().eq("id", data.jobId);

    if (deleteError) throw new Error(deleteError.message);

    // Notify the job owner
    const owner = job.employer_id ?? job.posted_by;
    await notifyUser(
      supabaseAdmin,
      owner,
      "Job Removed by Admin",
      `Your job posting "${job.title}" has been removed by an administrator.`,
      "system",
      "/employer",
      { job_id: data.jobId, action: "admin_delete" },
    );

    return { success: true, message: "Job deleted" };
  });

const deletePostSchema = z.object({
  postId: z.string().uuid("Invalid post ID"),
});

export const adminDeletePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(deletePostSchema)
  .handler(async ({ data, context }) => {
    const userId = (context as any)?.userId;
    if (!userId) throw new Error("Not authenticated");

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (!roleData || roleData.role !== "admin") {
      throw new Error("Not authorized: admin role required");
    }

    const { data: post } = await supabaseAdmin
      .from("posts")
      .select("id, author_id, content, image_url")
      .eq("id", data.postId)
      .maybeSingle();

    if (!post) throw new Error("Post not found");

    if (post.image_url) {
      try {
        const url = new URL(post.image_url);
        const pathStart = url.pathname.indexOf("/posts/");
        if (pathStart !== -1) {
          const storagePath = url.pathname.slice(pathStart + 7);
          await supabaseAdmin.storage.from("posts").remove([storagePath]);
        }
      } catch {
        // ignore storage cleanup errors
      }
    }

    await supabaseAdmin.from("post_likes").delete().eq("post_id", data.postId);
    await supabaseAdmin.from("post_comments").delete().eq("post_id", data.postId);
    await supabaseAdmin.from("post_saves").delete().eq("post_id", data.postId);
    await supabaseAdmin.from("notifications").delete().eq("data->>post_id", data.postId);

    const { error } = await supabaseAdmin.from("posts").delete().eq("id", data.postId);
    if (error) throw new Error(error.message);

    await notifyUser(
      supabaseAdmin,
      post.author_id,
      "Post Removed by Admin",
      "Your post has been removed by an administrator.",
      "system",
      "/feed",
      { post_id: data.postId, action: "admin_delete_post" },
    );

    return { success: true, message: "Post deleted" };
  });

const deleteCommentSchema = z.object({
  commentId: z.string().uuid("Invalid comment ID"),
});

export const adminDeleteComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(deleteCommentSchema)
  .handler(async ({ data, context }) => {
    const userId = (context as any)?.userId;
    if (!userId) throw new Error("Not authenticated");

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (!roleData || roleData.role !== "admin") {
      throw new Error("Not authorized: admin role required");
    }

    const { data: comment } = await supabaseAdmin
      .from("post_comments")
      .select("id, author_id, post_id")
      .eq("id", data.commentId)
      .maybeSingle();

    if (!comment) throw new Error("Comment not found");

    await supabaseAdmin.from("comment_likes").delete().eq("comment_id", data.commentId);

    const { error } = await supabaseAdmin.from("post_comments").delete().eq("id", data.commentId);
    if (error) throw new Error(error.message);

    await notifyUser(
      supabaseAdmin,
      comment.author_id,
      "Comment Removed by Admin",
      "Your comment has been removed by an administrator.",
      "system",
      "/feed",
      { comment_id: data.commentId, post_id: comment.post_id, action: "admin_delete_comment" },
    );

    return { success: true, message: "Comment deleted" };
  });

const deleteBlogCommentSchema = z.object({
  commentId: z.string().uuid("Invalid comment ID"),
});

export const adminDeleteBlogComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(deleteBlogCommentSchema)
  .handler(async ({ data, context }) => {
    const userId = (context as any)?.userId;
    if (!userId) throw new Error("Not authenticated");

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (!roleData || roleData.role !== "admin") {
      throw new Error("Not authorized: admin role required");
    }

    const { data: comment } = await supabaseAdmin
      .from("blog_comments")
      .select("id, author_id, blog_id")
      .eq("id", data.commentId)
      .maybeSingle();

    if (!comment) throw new Error("Comment not found");

    const { error } = await supabaseAdmin.from("blog_comments").delete().eq("id", data.commentId);
    if (error) throw new Error(error.message);

    await notifyUser(
      supabaseAdmin,
      comment.author_id,
      "Blog Comment Removed by Admin",
      "Your blog comment has been removed by an administrator.",
      "system",
      "/blog",
      { comment_id: data.commentId, blog_id: comment.blog_id, action: "admin_delete_blog_comment" },
    );

    return { success: true, message: "Blog comment deleted" };
  });

const grantSubscriptionSchema = z.object({
  targetUserId: z.string().uuid("Invalid target user ID"),
  planType: z.enum(["free", "premium", "starter", "professional", "enterprise"]),
  status: z.enum(["active", "trialing", "cancelled", "expired"]).default("active"),
  startedAt: z.string().optional(),
  expiresAt: z.string().nullable().optional(),
});

export const adminGrantSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(grantSubscriptionSchema)
  .handler(async ({ data, context }) => {
    const userId = (context as any)?.userId;
    if (!userId) throw new Error("Not authenticated");

    // Verify caller is admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (!roleData || roleData.role !== "admin") {
      throw new Error("Not authorized: admin role required");
    }

    const now = new Date().toISOString();
    const startedAt = data.startedAt || now;
    const paymentStatus = data.status === "active" ? "paid" : "unpaid";
    const transactionId = `admin_grant_${Date.now()}`;
    const esewaRefId = "ADMIN_MANUAL_GRANT";

    // Check if target user has an existing subscription record
    const { data: existingSub, error: findError } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("user_id", data.targetUserId)
      .maybeSingle();

    if (findError) throw new Error(findError.message);

    if (existingSub) {
      const { error: updateError } = await supabaseAdmin
        .from("subscriptions")
        .update({
          plan_type: data.planType,
          status: data.status,
          payment_status: paymentStatus,
          started_at: startedAt,
          expires_at: data.expiresAt ?? null,
          transaction_id: transactionId,
          esewa_ref_id: esewaRefId,
          updated_at: now,
        })
        .eq("id", existingSub.id);

      if (updateError) throw new Error(updateError.message);
    } else {
      const { error: insertError } = await supabaseAdmin.from("subscriptions").insert({
        user_id: data.targetUserId,
        plan_type: data.planType,
        status: data.status,
        payment_status: paymentStatus,
        started_at: startedAt,
        expires_at: data.expiresAt ?? null,
        amount: 0,
        currency: "NPR",
        transaction_id: transactionId,
        esewa_ref_id: esewaRefId,
      });

      if (insertError) throw new Error(insertError.message);
    }

    // Send notification to the user
    await notifyUser(
      supabaseAdmin,
      data.targetUserId,
      "Subscription Updated by Administrator",
      `Your subscription has been updated to the ${data.planType.toUpperCase()} plan.`,
      "system",
      "/pricing",
      { action: "admin_grant_subscription", plan: data.planType },
    );

    return { success: true, message: "Subscription granted successfully" };
  });

/**
 * Admin: Get aggregated resume analytics and recent scans.
 */
export const adminGetResumeIntelligence = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = (context as any)?.userId;
    if (!userId) throw new Error("Not authenticated");

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (!roleData || roleData.role !== "admin") {
      throw new Error("Not authorized: admin role required");
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      { count: totalScans },
      { count: scansToday },
      { data: scans },
      { data: usersWithScans },
    ] = await Promise.all([
      supabaseAdmin.from("resume_scans").select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("resume_scans")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayStart.toISOString()),
      supabaseAdmin
        .from("resume_scans")
        .select(
          "id, user_id, file_name, file_type, file_size, source, scan_status, ats_score, overall_score, score_improvement, candidate_name, ai_provider, ai_model, duration_ms, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(100),
      supabaseAdmin.from("resume_scans").select("user_id"),
    ]);

    const uniqueUserIds = new Set((usersWithScans ?? []).map((s: any) => s.user_id));
    const validAtsScores = (scans ?? [])
      .map((s: any) => s.ats_score)
      .filter((s: any) => typeof s === "number" && s > 0);

    const avgAts =
      validAtsScores.length > 0
        ? Math.round(
            validAtsScores.reduce((a: number, b: number) => a + b, 0) / validAtsScores.length,
          )
        : 0;

    const highestAts = validAtsScores.length > 0 ? Math.max(...validAtsScores) : 0;

    const improvements = (scans ?? [])
      .map((s: any) => s.score_improvement)
      .filter((i: any) => typeof i === "number" && i > 0);

    const avgImprovement =
      improvements.length > 0
        ? Math.round(improvements.reduce((a: number, b: number) => a + b, 0) / improvements.length)
        : 0;

    return {
      aggregate: {
        totalScans: totalScans ?? 0,
        scansToday: scansToday ?? 0,
        uniqueUsers: uniqueUserIds.size,
        avgAtsScore: avgAts,
        highestAtsScore: highestAts,
        avgScoreImprovement: avgImprovement,
      },
      stats: {
        totalScans: totalScans ?? 0,
        scansToday: scansToday ?? 0,
        uniqueUsers: uniqueUserIds.size,
        avgAts,
        highestAts,
        avgImprovement,
      },
      scans: scans ?? [],
    };
  });

/**
 * Admin: Get all resume scans and history for a specific user.
 */
export const adminGetUserResumeHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ targetUserId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const userId = (context as any)?.userId;
    if (!userId) throw new Error("Not authenticated");

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (!roleData || roleData.role !== "admin") {
      throw new Error("Not authorized: admin role required");
    }

    const [{ data: profile }, { data: scans }, { data: activities }, { data: subscription }] =
      await Promise.all([
        supabaseAdmin.from("profiles").select("*").eq("id", data.targetUserId).maybeSingle(),
        supabaseAdmin
          .from("resume_scans")
          .select("*")
          .eq("user_id", data.targetUserId)
          .order("created_at", { ascending: false }),
        supabaseAdmin
          .from("user_activities")
          .select("*")
          .eq("user_id", data.targetUserId)
          .order("created_at", { ascending: false })
          .limit(50),
        supabaseAdmin
          .from("subscriptions")
          .select("*")
          .eq("user_id", data.targetUserId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    return {
      profile: profile ?? null,
      scans: scans ?? [],
      activities: activities ?? [],
      subscription: subscription ?? null,
    };
  });
