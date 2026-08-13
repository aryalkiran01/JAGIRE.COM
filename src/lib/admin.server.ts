/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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
    const { error: deleteError } = await supabaseAdmin
      .from("jobs")
      .delete()
      .eq("id", data.jobId);

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
