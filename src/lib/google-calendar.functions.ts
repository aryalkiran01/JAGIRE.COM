import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev";
const CONNECTOR_ID = "google_calendar";

export const startGoogleCalendarConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((targetOrigin: string) => z.string().url().parse(targetOrigin))
  .handler(async ({ data: targetOrigin, context }) => {
    const clientKey = process.env.GOOGLE_CALENDAR_APP_USER_CONNECTOR_CLIENT_API_KEY;
    if (!clientKey) throw new Error("Google Calendar connector client is not configured");
    const { authorizeAppUserOAuth } = await import("@/integrations/lovable/appUserConnector");
    const { authorizationUrl } = await authorizeAppUserOAuth({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectorId: CONNECTOR_ID,
      appUserId: context.userId,
      clientAPIKey: clientKey,
      returnUrl: `${targetOrigin}/auth`,
      responseMode: "web_message",
      webMessageTargetOrigin: targetOrigin,
      credentialsConfiguration: {
        scopes: [
          "https://www.googleapis.com/auth/userinfo.email",
          "https://www.googleapis.com/auth/userinfo.profile",
          "https://www.googleapis.com/auth/calendar.events",
        ],
      },
    });
    return { authorizationUrl };
  });

export const saveGoogleCalendarConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { connectionAPIKey: string }) =>
    z.object({ connectionAPIKey: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { saveConnectionKeyForUser } = await import("@/lib/connection-key-crypto.server");
    await saveConnectionKeyForUser(context.userId, CONNECTOR_ID, data.connectionAPIKey);
    return { ok: true };
  });

export const getGoogleCalendarStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getConnectionKeyForUser } = await import("@/lib/connection-key-crypto.server");
    const key = await getConnectionKeyForUser(context.userId, CONNECTOR_ID);
    return { connected: Boolean(key) };
  });

export const disconnectGoogleCalendar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getConnectionKeyForUser, deleteConnectionKeyForUser } = await import(
      "@/lib/connection-key-crypto.server"
    );
    const key = await getConnectionKeyForUser(context.userId, CONNECTOR_ID);
    if (key) {
      try {
        const { disconnectAppUser } = await import("@/integrations/lovable/appUserConnector");
        await disconnectAppUser({
          gatewayBaseUrl: GATEWAY_BASE_URL,
          connectionAPIKey: key,
          connectorId: CONNECTOR_ID,
        });
      } catch (e) {
        console.error("gateway disconnect failed", e);
      }
    }
    await deleteConnectionKeyForUser(context.userId, CONNECTOR_ID);
    return { ok: true };
  });

export const scheduleInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
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
    const { getConnectionKeyForUser } = await import("@/lib/connection-key-crypto.server");
    const connectionAPIKey = await getConnectionKeyForUser(context.userId, CONNECTOR_ID);
    if (!connectionAPIKey) throw new Error("Google Calendar is not connected");

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

    const { callAsAppUser } = await import("@/integrations/lovable/appUserConnector");
    const res = await callAsAppUser({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectionAPIKey,
      connectorId: CONNECTOR_ID,
      path: "/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all",
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventBody),
      },
    });
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