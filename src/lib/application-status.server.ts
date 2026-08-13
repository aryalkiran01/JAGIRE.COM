/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth.middleware";

const schema = z.object({
  applicationId: z.string().uuid("Invalid application ID"),
  status: z.enum(["shortlisted", "selected", "rejected", "reviewing", "viewed", "offer"]),
  remark: z.string().optional(),
});

export const updateApplicationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.infer<typeof schema>) => schema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: app, error: appError } = await supabaseAdmin
      .from("applications")
      .select(
        "id, status, applicant_id, job_id, rejection_remark, job:jobs(id, title, employer_id, company:companies(name, owner_id))",
      )
      .eq("id", data.applicationId)
      .maybeSingle();

    if (appError) throw new Error(appError.message);
    if (!app) throw new Error("Application not found");

    const job = Array.isArray(app.job) ? app.job[0] : app.job;
    const employerId = job?.employer_id ?? job?.company?.owner_id;
    if (employerId !== context.userId) {
      throw new Error("Not authorized: only the job owner can update application status");
    }

    if (data.status === "rejected") {
      if (!data.remark || data.remark.trim().length < 3) {
        throw new Error("A rejection remark is required (minimum 3 characters)");
      }
    }

    if (app.status === data.status) {
      return { success: true, message: `Application already ${data.status}`, noop: true };
    }

    const updates: Record<string, unknown> = {
      status: data.status,
      updated_at: new Date().toISOString(),
    };
    if (data.status === "rejected" && data.remark) {
      updates.rejection_remark = data.remark.trim();
    }

    const { error: updateError } = await supabaseAdmin
      .from("applications")
      .update(updates)
      .eq("id", data.applicationId);
    if (updateError) throw new Error(updateError.message);

    const jobTitle = job?.title ?? "the position";
    const companyName = job?.company?.name ?? "the company";
    let notifTitle = "Application Update";
    let notifBody = "";

    switch (data.status) {
      case "shortlisted":
        notifTitle = "You've been shortlisted!";
        notifBody = `Your application for "${jobTitle}" at ${companyName} has been shortlisted.`;
        break;
      case "selected":
        notifTitle = "Application Approved!";
        notifBody = `Congratulations! You've been selected for "${jobTitle}" at ${companyName}.`;
        break;
      case "rejected":
        notifTitle = "Application Update";
        notifBody = `Your application for "${jobTitle}" at ${companyName} was not selected.${data.remark ? ` Feedback: ${data.remark}` : ""}`;
        break;
      case "offer":
        notifTitle = "Offer Extended!";
        notifBody = `You've received an offer for "${jobTitle}" at ${companyName}.`;
        break;
      default:
        notifBody = `Your application for "${jobTitle}" at ${companyName} is now ${data.status}.`;
        break;
    }

    if (app.applicant_id) {
      const { error: notifError } = await supabaseAdmin.from("notifications").insert({
        user_id: app.applicant_id,
        type: "application",
        title: notifTitle,
        message: notifBody,
        metadata: { application_id: data.applicationId, job_id: app.job_id, status: data.status },
        link: "/applications",
        is_read: false,
      });
      if (notifError)
        console.error("[updateApplicationStatus] notification failed:", notifError.message);
    }

    return { success: true, message: `Application ${data.status}`, noop: false };
  });
