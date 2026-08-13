/* eslint-disable @typescript-eslint/no-explicit-any */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth.middleware";
import { saveConnectionKeyForUser } from "@/lib/connection-key-crypto.server";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

const SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

function clientCreds() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  return { clientId, clientSecret };
}

function hasGoogleCreds() {
  return Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET);
}

// ------------------- OAuth endpoints -------------------
export const startGoogleCalendarConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((targetOrigin: string) => z.string().url().parse(targetOrigin))
  .handler(async ({ data: targetOrigin }) => {
    const { clientId } = clientCreds();
    if (!clientId) throw new Error("Google OAuth is not configured.");
    const redirectUri = `${targetOrigin}/google-calendar/callback`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: SCOPES,
      access_type: "offline",
      prompt: "consent",
    });
    return { authorizationUrl: `${GOOGLE_AUTH_URL}?${params.toString()}` };
  });

export const saveGoogleCalendarConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { code: string; redirectOrigin: string }) =>
    z.object({ code: z.string().min(1), redirectOrigin: z.string().url() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    console.log("=== saveGoogleCalendarConnection START ===");

    const { clientId, clientSecret } = clientCreds();

    console.log("User:", context.userId);
    console.log("Code received:", !!data.code);

    const redirectUri = `${data.redirectOrigin}/google-calendar/callback`;

    const body = new URLSearchParams({
      code: data.code,
      client_id: clientId!,
      client_secret: clientSecret!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });

    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    console.log("Google status:", res.status);

    const response = await res.text();
    console.log("Google response:", response);

    if (!res.ok) {
      throw new Error(response);
    }

    const tokens = JSON.parse(response);

    console.log("Refresh token exists:", !!tokens.refresh_token);

    await saveConnectionKeyForUser(context.userId, "google_calendar", tokens.refresh_token);

    console.log("=== SAVED SUCCESSFULLY ===");

    return { ok: true };
  });

export const getGoogleCalendarStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getConnectionKeyForUser } = await import("@/lib/connection-key-crypto.server");
    const key = await getConnectionKeyForUser(context.userId, "google_calendar");
    return { connected: Boolean(key), configured: hasGoogleCreds() };
  });

export const disconnectGoogleCalendar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { deleteConnectionKeyForUser } = await import("@/lib/connection-key-crypto.server");
    await deleteConnectionKeyForUser(context.userId, "google_calendar");
    return { ok: true };
  });

// ------------------- Token & Calendar helpers -------------------
async function getValidAccessToken(userId: string): Promise<string | null> {
  const { getConnectionKeyForUser } = await import("@/lib/connection-key-crypto.server");

  const refreshToken = await getConnectionKeyForUser(userId, "google_calendar");
  console.log(`🔍 Retrieved token for user ${userId}:`, refreshToken ? "exists" : "null");
  if (!refreshToken) {
    console.log("No refresh token found");
    return null;
  }

  const { clientId, clientSecret } = clientCreds();
  if (!clientId || !clientSecret) return null;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const responseText = await res.text();
  if (!res.ok) {
    console.error("Google refresh failed:", res.status, responseText);
    return null;
  }
  const tokens = JSON.parse(responseText);
  console.log("Access token obtained:", !!tokens.access_token);
  return tokens.access_token;
}

async function createGoogleCalendarEvent(
  accessToken: string,
  title: string,
  description: string,
  start: Date,
  end: Date,
  attendeeEmail: string,
  applicationId: string,
): Promise<{ eventId: string; meetLink: string | null }> {
  const eventBody = {
    summary: title,
    description,
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
    attendees: [{ email: attendeeEmail }],
    conferenceData: {
      createRequest: {
        requestId: `jagire-${applicationId}-${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };

  const res = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(eventBody),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Calendar API failed (${res.status}): ${text}`);
  }
  const event = (await res.json()) as {
    id: string;
    hangoutLink?: string;
    conferenceData?: { entryPoints?: Array<{ uri?: string; entryPointType?: string }> };
  };
  const meetLink =
    event.hangoutLink ??
    event.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri ??
    null;
  return { eventId: event.id, meetLink };
}

// ------------------- Notification helper -------------------
async function notifyUser(
  supabaseAdmin: any,
  userId: string | null,
  title: string,
  body: string,
  type: "interview" | "application" | "message" | "system" = "interview",
  link = "/interviews",
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

async function notifyCandidate(
  supabaseAdmin: any,
  candidateId: string | null,
  employerId: string,
  interviewId: string,
  applicationId: string,
  title: string,
  _type: string,
  message: string,
) {
  await notifyUser(supabaseAdmin, candidateId, title, message, "interview", "/interviews", {
    interview_id: interviewId,
    application_id: applicationId,
    employer_id: employerId,
  });
}

async function sendInterviewEmail(
  supabaseAdmin: any,
  candidateEmail: string,
  title: string,
  start: Date,
  end: Date,
  meetLink: string | null,
  candidateName?: string,
  notes?: string,
) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("[sendInterviewEmail] Missing SUPABASE_URL or SERVICE_ROLE_KEY – skipping email");
    return;
  }

  const fmt = (d: Date) =>
    d.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1a1a1a;">Interview Scheduled</h2>
      <p>Hi ${candidateName || "there"},</p>
      <p>Your interview <strong>"${title}"</strong> has been scheduled.</p>
      <table style="border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 4px 16px 4px 0; color: #666;">Start</td><td style="padding: 4px 0;">${fmt(start)}</td></tr>
        <tr><td style="padding: 4px 16px 4px 0; color: #666;">End</td><td style="padding: 4px 0;">${fmt(end)}</td></tr>
        ${meetLink ? `<tr><td style="padding: 4px 16px 4px 0; color: #666;">Meeting Link</td><td style="padding: 4px 0;"><a href="${meetLink}">${meetLink}</a></td></tr>` : ""}
      </table>
      ${notes ? `<p style="background: #f5f5f5; padding: 12px; border-radius: 8px;"><strong>Notes:</strong> ${notes}</p>` : ""}
      <p style="color: #666; font-size: 13px; margin-top: 24px;">This is an automated message from Jagire.</p>
    </div>`;

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({
        to: candidateEmail,
        subject: `Interview Scheduled: ${title}`,
        html,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("[sendInterviewEmail] Edge function returned error:", res.status, errText);
    } else {
      console.log("[sendInterviewEmail] Email sent to", candidateEmail);
    }
  } catch (e) {
    console.error("[sendInterviewEmail] Failed to send email:", e);
  }
}

async function getApplicationDetails(supabaseAdmin: any, applicationId: string) {
  const { data, error } = await supabaseAdmin
    .from("applications")
    .select(
      `
      id,
      applicant_id,
      jobs (
        id,
        title,
        companies (
          name
        )
      )
    `,
    )
    .eq("id", applicationId)
    .single();
  if (error) throw error;
  return data;
}

// ------------------- Main schedule function -------------------
export const scheduleInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      applicationId: string;
      candidateEmail: string;
      candidateName?: string;
      title: string;
      startISO: string;
      durationMinutes: number;
      meetingLink?: string;
      location?: string;
      notes?: string;
      useGoogleCalendar?: boolean;
    }) =>
      z
        .object({
          applicationId: z.string().uuid(),
          candidateEmail: z.string().email(),
          candidateName: z.string().optional(),
          title: z.string().min(1).max(200),
          startISO: z.string(),
          durationMinutes: z.number().int().min(15).max(480),
          meetingLink: z.string().url().optional().or(z.literal("").optional()),
          location: z.string().optional(),
          notes: z.string().optional(),
          useGoogleCalendar: z.boolean().optional(),
        })
        .parse(input),
  )
  .handler(async ({ data, context }) => {
    const start = new Date(data.startISO);
    if (Number.isNaN(start.getTime())) {
      throw new Error("Invalid interview date.");
    }
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    if (startDate.getTime() < today.getTime()) {
      throw new Error(
        "Interview cannot be scheduled in the past. Please pick today or a future date.",
      );
    }
    const end = new Date(start.getTime() + data.durationMinutes * 60_000);

    let googleEventId: string | null = null;
    let meetLink: string | null = data.meetingLink || null;

    if (data.useGoogleCalendar) {
      const accessToken = await getValidAccessToken(context.userId);
      console.log("Access Token:", accessToken ? "obtained" : "null");
      if (accessToken) {
        try {
          const result = await createGoogleCalendarEvent(
            accessToken,
            data.title,
            `Interview scheduled via Jagire${data.candidateName ? ` with ${data.candidateName}` : ""}.`,
            start,
            end,
            data.candidateEmail,
            data.applicationId,
          );
          googleEventId = result.eventId;
          if (result.meetLink) meetLink = result.meetLink;
        } catch (e) {
          console.error("Google Calendar event creation failed:", e);
          // Continue scheduling without Meet link if desired – rethrow to fail the whole request.
          throw e;
        }
      } else {
        console.warn("No valid access token – scheduling without Google Calendar.");
      }
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const application = await getApplicationDetails(supabaseAdmin, data.applicationId);
    const candidateId = application.applicant_id;

    const { data: interview, error: interviewError } = await supabaseAdmin
      .from("interviews")
      .insert({
        application_id: data.applicationId,
        employer_id: context.userId,
        candidate_id: candidateId,
        candidate_email: data.candidateEmail,
        title: data.title,
        scheduled_at: start.toISOString(),
        duration_minutes: data.durationMinutes,
        meeting_link: meetLink,
        meet_link: meetLink,
        google_event_id: googleEventId,
        status: "scheduled",
        location: data.location || null,
        notes: data.notes || null,
      })
      .select()
      .single();
    if (interviewError) throw interviewError;

    await supabaseAdmin
      .from("applications")
      .update({ status: "interview", updated_at: new Date().toISOString() })
      .eq("id", data.applicationId);

    await supabaseAdmin.from("interview_events").insert({
      application_id: data.applicationId,
      employer_id: context.userId,
      candidate_email: data.candidateEmail,
      title: data.title,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      google_event_id: googleEventId,
      meet_link: meetLink,
    });

    await notifyUser(
      supabaseAdmin,
      candidateId,
      "Interview Scheduled",
      `Your interview "${data.title}" has been scheduled for ${start.toLocaleString()}.`,
      "interview",
      "/interviews",
      {
        interview_id: interview.id,
        application_id: data.applicationId,
        employer_id: context.userId,
      },
    );
    await notifyUser(
      supabaseAdmin,
      context.userId,
      "Interview Scheduled",
      `You scheduled an interview "${data.title}" for ${start.toLocaleString()}.`,
      "interview",
      "/interviews",
      { interview_id: interview.id, application_id: data.applicationId, candidate_id: candidateId },
    );

    await sendInterviewEmail(
      supabaseAdmin,
      data.candidateEmail,
      data.title,
      start,
      end,
      meetLink,
      data.candidateName,
      data.notes,
    );

    return { interviewId: interview.id, eventId: googleEventId, meetLink };
  });

// ------------------- Status update functions -------------------
export const updateInterviewStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { interviewId: string; status: string; notes?: string }) =>
    z
      .object({
        interviewId: z.string().uuid(),
        status: z.string(),
        notes: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: interview } = await supabaseAdmin
      .from("interviews")
      .select("id, employer_id, candidate_id, application_id, title")
      .eq("id", data.interviewId)
      .maybeSingle();

    if (!interview) throw new Error("Interview not found");
    const isEmployer = interview.employer_id === context.userId;
    const isCandidate = interview.candidate_id === context.userId;
    if (!isEmployer && !isCandidate) throw new Error("Not authorized");

    const allowedCandidate = ["confirmed", "cancelled", "reschedule_requested"];
    if (isCandidate && !isEmployer && !allowedCandidate.includes(data.status)) {
      throw new Error("Candidates can only confirm, cancel, or request reschedule");
    }

    const updateData: any = { status: data.status, updated_at: new Date().toISOString() };
    if (data.status === "confirmed") updateData.accepted_at = new Date().toISOString();
    if (data.status === "cancelled") updateData.declined_at = new Date().toISOString();
    if (data.notes) updateData.notes = data.notes;

    const { error } = await supabaseAdmin
      .from("interviews")
      .update(updateData)
      .eq("id", data.interviewId);
    if (error) throw error;

    const otherId = isEmployer ? interview.candidate_id : interview.employer_id;
    const actorId = context.userId;
    const msg =
      data.status === "confirmed"
        ? `Interview "${interview.title}" was confirmed.`
        : data.status === "cancelled"
          ? `Interview "${interview.title}" was cancelled.`
          : data.status === "reschedule_requested"
            ? `Reschedule requested for "${interview.title}".`
            : data.status === "completed"
              ? `Interview "${interview.title}" marked as completed.`
              : `Interview "${interview.title}" status updated to ${data.status}.`;
    await notifyUser(supabaseAdmin, otherId, "Interview Update", msg, "interview", "/interviews", {
      interview_id: interview.id,
      application_id: interview.application_id,
      actor_id: actorId,
    });
    await notifyUser(supabaseAdmin, actorId, "Interview Update", msg, "interview", "/interviews", {
      interview_id: interview.id,
      application_id: interview.application_id,
      actor_id: actorId,
    });

    return { ok: true };
  });

export const rescheduleInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { interviewId: string; proposedTimeISO: string; reason?: string }) =>
    z
      .object({
        interviewId: z.string().uuid(),
        proposedTimeISO: z.string(),
        reason: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: interview } = await supabaseAdmin
      .from("interviews")
      .select("id, employer_id, candidate_id, application_id, title, scheduled_at")
      .eq("id", data.interviewId)
      .maybeSingle();
    if (!interview) throw new Error("Interview not found");
    if (interview.candidate_id !== context.userId && interview.employer_id !== context.userId) {
      throw new Error("Not authorized");
    }

    const proposed = new Date(data.proposedTimeISO);
    if (Number.isNaN(proposed.getTime())) throw new Error("Invalid proposed time.");
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const proposedDate = new Date(proposed.getFullYear(), proposed.getMonth(), proposed.getDate());
    if (proposedDate.getTime() < today.getTime()) {
      throw new Error("Cannot reschedule to a past date. Please pick today or a future date.");
    }

    const { error } = await supabaseAdmin
      .from("interviews")
      .update({
        status: "reschedule_requested",
        notes: `Reschedule requested for ${new Date(data.proposedTimeISO).toLocaleString()}. Reason: ${data.reason || "N/A"}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.interviewId);
    if (error) throw error;

    const otherId =
      interview.candidate_id === context.userId ? interview.employer_id : interview.candidate_id;
    const rescheduleMsg = `Reschedule requested for "${interview.title}" to ${proposed.toLocaleString()}.`;
    await notifyUser(
      supabaseAdmin,
      otherId,
      "Reschedule Request",
      rescheduleMsg,
      "interview",
      "/interviews",
      {
        interview_id: interview.id,
        application_id: interview.application_id,
        actor_id: context.userId,
      },
    );
    await notifyUser(
      supabaseAdmin,
      context.userId,
      "Reschedule Request",
      rescheduleMsg,
      "interview",
      "/interviews",
      {
        interview_id: interview.id,
        application_id: interview.application_id,
        actor_id: context.userId,
      },
    );

    return { ok: true };
  });
