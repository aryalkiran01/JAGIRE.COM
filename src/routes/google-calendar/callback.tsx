/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/google-calendar/callback")({
  component: GoogleCalendarCallback,
});

function GoogleCalendarCallback() {
  const search = Route.useSearch();
  const code = (search as any).code as string | undefined;
  const error = (search as any).error as string | undefined;

  if (typeof window !== "undefined" && window.opener) {
    window.opener.postMessage(
      { type: "google-calendar-oauth", code, error },
      window.location.origin,
    );
    window.close();
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-muted-foreground">
        {error ? `Google auth failed: ${error}` : "Connecting… you can close this window."}
      </p>
    </div>
  );
}
