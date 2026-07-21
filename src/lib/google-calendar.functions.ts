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
  if (!clientId || !clientSecret) {
    throw new Error(
      "Google OAuth is not configured. Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET.",
    );
  }
  return { clientId, clientSecret };
}

export const startGoogleCalendarConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((targetOrigin: string) => z.string().url().parse(targetOrigin))
  .handler(async ({ data: targetOrigin }) => {
    const { clientId } = clientCreds();
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
    return { connected: Boolean(key) };
  });

export const disconnectGoogleCalendar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { deleteConnectionKeyForUser } = await import("@/lib/connection-key-crypto.server");
    await deleteConnectionKeyForUser(context.userId, "google_calendar");
    return { ok: true };
  });

async function getValidAccessToken(userId: string): Promise<string> {
  const { getConnectionKeyForUser } = await import("@/lib/connection-key-crypto.server");
  const refreshToken = await getConnectionKeyForUser(userId, "google_calendar");
  if (!refreshToken) throw new Error("Google Calendar is not connected");

  const { clientId, clientSecret } = clientCreds();
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
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token refresh failed (${res.status}): ${text}`);
  }
  const tokens = (await res.json()) as { access_token: string };
  return tokens.access_token;
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
    }) =>
      z
        .object({
          applicationId: z.string().uuid(),
          candidateEmail: z.string().email(),
          candidateName: z.string().optional(),
          title: z.string().min(1).max(200),
          startISO: z.string(),
          durationMinutes: z.number().int().min(15).max(480),
        })
        .parse(input),
  )
  .handler(async ({ data, context }) => {
    const accessToken = await getValidAccessToken(context.userId);

    const start = new Date(data.startISO);
    const end = new Date(start.getTime() + data.durationMinutes * 60_000);

    const eventBody = {
      summary: data.title,
      description: `Interview scheduled via Jagire${data.candidateName ? ` with ${data.candidateName}` : ""}.`,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      attendees: [{ email: data.candidateEmail }],
      conferenceData: {
        createRequest: {
          requestId: `jagire-${data.applicationId}-${Date.now()}`,
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

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("interview_events" as any).insert({
      application_id: data.applicationId,
      employer_id: context.userId,
      candidate_email: data.candidateEmail,
      title: data.title,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      google_event_id: event.id,
      meet_link: meetLink,
    });
    if (error) throw error;

    return { eventId: event.id, meetLink };
  });
