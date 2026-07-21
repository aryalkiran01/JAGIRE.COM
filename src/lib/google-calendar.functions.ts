import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
    const { clientId, clientSecret } = clientCreds();
    if (!clientId || !clientSecret) throw new Error("Google OAuth is not configured.");
    const redirectUri = `${data.redirectOrigin}/google-calendar/callback`;
    const body = new URLSearchParams({
      code: data.code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });
    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Google token exchange failed (${res.status}): ${text}`);
    }
    const tokens = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };
    if (!tokens.refresh_token) {
      throw new Error(
        "Google did not return a refresh token. Revoke access at https://myaccount.google.com/permissions and try again.",
      );
    }
    const { saveConnectionKeyForUser } = await import("@/lib/connection-key-crypto.server");
    await saveConnectionKeyForUser(context.userId, "google_calendar", tokens.refresh_token);
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

async function getValidAccessToken(userId: string): Promise<string | null> {
  const { getConnectionKeyForUser } = await import("@/lib/connection-key-crypto.server");
    const refreshToken = await getConnectionKeyForUser(userId, "google_calendar");
  if (!refreshToken) return null;

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
  if (!res.ok) return null;
  const tokens = (await res.json()) as { access_token: string };
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

async function notifyCandidate(
  supabaseAdmin: any,
  candidateId: string | null,
  employerId: string,
  interviewId: string,
  applicationId: string,
  title: string,
  type: string,
  message: string,
) {
  if (!candidateId) return;
  await supabaseAdmin.from("notifications").insert({
    user_id: candidateId,
    type,
    title,
    message,
    data: { interview_id: interviewId, application_id: applicationId, employer_id: employerId },
    link: "/interviews",
    is_read: false,
  });
}

async function getApplicationDetails(supabaseAdmin: any, applicationId: string) {
  const { data } = await supabaseAdmin
    .from("applications")
    .select("id, applicant_id, seeker_id, job:jobs(id, title, company:companies(name))")
    .eq("id", applicationId)
    .maybeSingle();
  return data as any;
}

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
    const end = new Date(start.getTime() + data.durationMinutes * 60_000);

    let googleEventId: string | null = null;
    let meetLink: string | null = data.meetingLink || null;

    // Try Google Calendar if requested and available
    if (data.useGoogleCalendar) {
      const accessToken = await getValidAccessToken(context.userId);
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
          // If GCal fails, continue with custom link
          console.error("Google Calendar event creation failed:", e);
        }
      }
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const application = await getApplicationDetails(supabaseAdmin, data.applicationId);
    const candidateId = application?.applicant_id ?? application?.seeker_id ?? null;

    // Insert into the main interviews table
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

    // Update application status to 'interview'
    await supabaseAdmin
      .from("applications")
      .update({ status: "interview", updated_at: new Date().toISOString() })
      .eq("id", data.applicationId);

    // Also log to interview_events audit trail
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

    // Send notification to candidate
    await notifyCandidate(
      supabaseAdmin,
      candidateId,
      context.userId,
      interview.id,
      data.applicationId,
      "Interview Scheduled",
      "interview_scheduled",
      `Your interview "${data.title}" has been scheduled for ${start.toLocaleString()}.`,
    );

    return { interviewId: interview.id, eventId: googleEventId, meetLink };
  });

export const updateInterviewStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { interviewId: string; status: string; notes?: string }) =>
      z.object({
        interviewId: z.string().uuid(),
        status: z.string(),
        notes: z.string().optional(),
      }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Verify the user owns this interview (as employer or candidate)
    const { data: interview } = await supabaseAdmin
      .from("interviews")
      .select("id, employer_id, candidate_id, application_id, title")
      .eq("id", data.interviewId)
      .maybeSingle();

    if (!interview) throw new Error("Interview not found");
    const isEmployer = interview.employer_id === context.userId;
    const isCandidate = interview.candidate_id === context.userId;
    if (!isEmployer && !isCandidate) throw new Error("Not authorized");

    // Candidates can only set specific statuses
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

    // Notify the other party
    const otherId = isEmployer ? interview.candidate_id : interview.employer_id;
    if (otherId) {
      const msg =
        data.status === "confirmed"
          ? `Candidate confirmed the interview "${interview.title}".`
          : data.status === "cancelled"
            ? `Interview "${interview.title}" was cancelled.`
            : data.status === "reschedule_requested"
              ? `Candidate requested rescheduling for "${interview.title}".`
              : data.status === "completed"
                ? `Interview "${interview.title}" marked as completed.`
                : `Interview "${interview.title}" status updated to ${data.status}.`;
      await notifyCandidate(
        supabaseAdmin,
        otherId,
        context.userId,
        interview.id,
        interview.application_id,
        "Interview Update",
        `interview_${data.status}`,
        msg,
      );
    }

    return { ok: true };
  });

export const rescheduleInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { interviewId: string; proposedTimeISO: string; reason?: string }) =>
      z.object({
        interviewId: z.string().uuid(),
        proposedTimeISO: z.string(),
        reason: z.string().optional(),
      }).parse(input),
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

    const { error } = await supabaseAdmin
      .from("interviews")
      .update({
        status: "reschedule_requested",
        notes: `Reschedule requested for ${new Date(data.proposedTimeISO).toLocaleString()}. Reason: ${data.reason || "N/A"}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.interviewId);
    if (error) throw error;

    // Notify the other party
    const otherId =
      interview.candidate_id === context.userId ? interview.employer_id : interview.candidate_id;
    if (otherId) {
      await notifyCandidate(
        supabaseAdmin,
        otherId,
        context.userId,
        interview.id,
        interview.application_id,
        "Reschedule Request",
        "interview_reschedule",
        `Reschedule requested for "${interview.title}" to ${new Date(data.proposedTimeISO).toLocaleString()}.`,
      );
    }

    return { ok: true };
  });
