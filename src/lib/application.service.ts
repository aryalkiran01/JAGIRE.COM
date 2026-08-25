import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth.middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const applicationInput = z.object({ applicationId: z.string().uuid() });

async function employerApplication(applicationId: string, userId: string) {
  const { data: application, error } = await supabaseAdmin
    .from("applications")
    .select("id, applicant_id, job_id, status")
    .eq("id", applicationId)
    .maybeSingle();
  if (error) throw error;
  if (!application) throw new Error("Application not found");
  const { data: job, error: jobError } = await supabaseAdmin
    .from("jobs")
    .select("employer_id, posted_by, company_id")
    .eq("id", application.job_id)
    .maybeSingle();
  if (jobError) throw jobError;
  let allowed = job?.employer_id === userId || job?.posted_by === userId;
  if (!allowed && job?.company_id) {
    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .select("owner_id")
      .eq("id", job.company_id)
      .maybeSingle();
    if (companyError) throw companyError;
    allowed = company?.owner_id === userId;
  }
  if (!allowed) throw new Error("You are not authorized to manage this application");
  return application;
}

async function notifyOnce(
  userId: string | null,
  type: string,
  title: string,
  message: string,
  applicationId: string,
  jobId: string,
) {
  if (!userId) return;
  const { data: existing, error: lookupError } = await supabaseAdmin
    .from("notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("type", type)
    .eq("data->>application_id", applicationId)
    .limit(1);
  if (lookupError) throw lookupError;
  if (existing?.length) return;
  const { error } = await supabaseAdmin
    .from("notifications")
    .insert({
      user_id: userId,
      type,
      title,
      message,
      data: { application_id: applicationId, job_id: jobId },
      link: "/applications",
      is_read: false,
    });
  if (error) throw error;
}

async function updateApplication(
  applicationId: string,
  userId: string,
  status: "shortlisted" | "rejected",
  remark?: string,
) {
  const application = await employerApplication(applicationId, userId);
  const validFrom =
    status === "shortlisted"
      ? ["applied", "viewed"]
      : ["applied", "viewed", "shortlisted", "interview"];
  if (!validFrom.includes(application.status))
    throw new Error(`This application cannot be changed from ${application.status}`);
  if (status === "rejected" && !remark?.trim()) throw new Error("A rejection remark is required");
  const { data: updated, error } = await supabaseAdmin
    .from("applications")
    .update({
      status,
      status_text: status === "rejected" ? "Rejected" : "Shortlisted",
      employer_notes: status === "rejected" ? remark!.trim() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", applicationId)
    .eq("status", application.status)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!updated) throw new Error("This application was already updated. Refresh and try again.");
  await notifyOnce(
    application.applicant_id,
    `application_${status}`,
    status === "rejected" ? "Application update" : "You have been shortlisted",
    status === "rejected"
      ? `Your application was not selected. Employer note: ${remark!.trim()}`
      : "Your application has been shortlisted. The employer will contact you about the next step.",
    applicationId,
    application.job_id,
  );
  return { ok: true, status };
}

export const shortlistApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { applicationId: string }) => applicationInput.parse(input))
  .handler(({ data, context }) =>
    updateApplication(data.applicationId, context.userId, "shortlisted"),
  );
export const rejectApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { applicationId: string; remark: string }) =>
    applicationInput.extend({ remark: z.string().trim().min(1).max(2000) }).parse(input),
  )
  .handler(({ data, context }) =>
    updateApplication(data.applicationId, context.userId, "rejected", data.remark),
  );

export const deleteJobAsAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { jobId: string }) => z.object({ jobId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: role, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (roleError) throw roleError;
    if (role?.role !== "admin") throw new Error("Administrator permission required");
    const { data: job, error: jobError } = await supabaseAdmin
      .from("jobs")
      .select("id")
      .eq("id", data.jobId)
      .maybeSingle();
    if (jobError) throw jobError;
    if (!job) throw new Error("Job not found");
    const { error } = await supabaseAdmin.from("jobs").delete().eq("id", data.jobId);
    if (error) throw error;
    return { ok: true };
  });
