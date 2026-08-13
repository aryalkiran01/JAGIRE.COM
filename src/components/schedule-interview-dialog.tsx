/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Video,
  Link2,
  MapPin,
  Loader as Loader2,
  CircleCheck as CheckCircle2,
  CircleAlert as AlertCircle,
  Unlink,
} from "lucide-react";
import {
  scheduleInterview,
  getGoogleCalendarStatus,
  startGoogleCalendarConnect,
  saveGoogleCalendarConnection,
  disconnectGoogleCalendar,
} from "@/lib/google-calendar.service";

type MeetingType = "google_meet" | "custom" | "in_person";

export function ScheduleInterviewDialog({
  applicationId,
  candidateName,
  candidateEmail,
}: {
  applicationId: string;
  candidateName?: string;
  candidateEmail: string;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(`Interview with ${candidateName ?? "candidate"}`);
  const [start, setStart] = useState("");
  const [duration, setDuration] = useState(30);
  const [meetingType, setMeetingType] = useState<MeetingType>("google_meet");
  const [customLink, setCustomLink] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const qc = useQueryClient();

  const statusFn = useServerFn(getGoogleCalendarStatus);
  const startFn = useServerFn(startGoogleCalendarConnect);
  const saveFn = useServerFn(saveGoogleCalendarConnection);
  const disconnectFn = useServerFn(disconnectGoogleCalendar);
  const scheduleFn = useServerFn(scheduleInterview);

  const status = useQuery({
    queryKey: ["gcal-status"],
    queryFn: () => statusFn(),
    enabled: open,
  });

  const connect = useMutation({
    mutationFn: async () => {
      const targetOrigin = window.location.origin;
      const { authorizationUrl } = await startFn({ data: targetOrigin });
      const popup = window.open(authorizationUrl, "google-oauth", "width=600,height=720");
      if (!popup) throw new Error("Popup blocked. Allow popups and try again.");

      const code = await new Promise<string>((resolve, reject) => {
        const timer = setInterval(() => {
          if (popup.closed) {
            clearInterval(timer);
            reject(new Error("Sign in was cancelled"));
          }
        }, 500);

        const onMessage = (event: MessageEvent) => {
          if (event.origin !== targetOrigin) return;
          const data = event.data;
          if (data?.type !== "google-calendar-oauth") return;
          window.removeEventListener("message", onMessage);
          clearInterval(timer);
          popup.close();
          if (data.code) resolve(data.code as string);
          else reject(new Error(data.error ?? "OAuth failed"));
        };
        window.addEventListener("message", onMessage);
      });

      await saveFn({ data: { code, redirectOrigin: window.location.origin } });
    },
    onSuccess: () => {
      toast.success("Google Calendar connected successfully.");
      qc.invalidateQueries({ queryKey: ["gcal-status"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const disconnect = useMutation({
    mutationFn: async () => {
      await disconnectFn();
    },
    onSuccess: () => {
      toast.success("Google Calendar disconnected.");
      qc.invalidateQueries({ queryKey: ["gcal-status"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const now = new Date();
  const minDateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const schedule = useMutation({
    mutationFn: async () => {
      if (!start) throw new Error("Pick a start time");
      const startDate = new Date(start);
      if (isNaN(startDate.getTime())) throw new Error("Invalid date/time");
      if (startDate.getTime() < Date.now()) throw new Error("Start time must be in the future");
      if (meetingType === "custom" && !customLink) {
        throw new Error("Enter a meeting link or switch to Google Meet / In-person.");
      }
      if (meetingType === "custom" && customLink) {
        try {
          new URL(customLink);
        } catch {
          throw new Error("Enter a valid meeting link URL.");
        }
      }
      if (meetingType === "in_person" && !location) {
        throw new Error("Enter a location for the in-person interview.");
      }
      if (meetingType === "google_meet" && !gcalConnected) {
        throw new Error(
          "Google Calendar isn't connected. Connect it to generate a Meet link, or switch to a custom link / in-person.",
        );
      }
      return scheduleFn({
        data: {
          applicationId,
          candidateEmail,
          candidateName,
          title,
          startISO: new Date(start).toISOString(),
          durationMinutes: duration,
          meetingLink: meetingType === "custom" ? customLink : undefined,
          location: location || undefined,
          notes: notes || undefined,
          interviewType: meetingType,
          useGoogleCalendar: meetingType === "google_meet",
        },
      });
    },
    onSuccess: (r) => {
      toast.success("Interview scheduled! Candidate has been notified.");
      if (r.meetLink) {
        navigator.clipboard?.writeText(r.meetLink).catch(() => {});
        toast.success(`Meeting link copied: ${r.meetLink}`);
      }
      setOpen(false);
      setStart("");
      setCustomLink("");
      setLocation("");
      setNotes("");
      qc.invalidateQueries({ queryKey: ["employer-interviews"] });
      qc.invalidateQueries({ queryKey: ["my-interviews"] });
      qc.invalidateQueries({ queryKey: ["job-apps"] });
    },
    onError: (e: any) => {
      const msg = e.message ?? "";
      if (msg.includes("GOOGLE_CALENDAR_RECONNECT_REQUIRED")) {
        toast.error("Your Google Calendar connection has expired. Please reconnect Google Calendar.");
        qc.invalidateQueries({ queryKey: ["gcal-status"] });
      } else {
        toast.error(msg);
      }
    },
  });

  const gcalConnected = status.data?.connected ?? false;
  const gcalExpired = status.data?.expired ?? false;
  const gcalConfigured = status.data?.configured ?? false;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Calendar className="h-4 w-4 mr-1" /> Schedule
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule interview</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Meeting type selector */}
          <div>
            <Label>Meeting type</Label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              <button
                type="button"
                onClick={() => setMeetingType("google_meet")}
                className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition ${
                  meetingType === "google_meet"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted"
                }`}
              >
                <Video className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Google Meet</div>
                  <div className="text-xs text-muted-foreground">Auto link</div>
                </div>
                {meetingType === "google_meet" && (
                  <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setMeetingType("custom")}
                className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition ${
                  meetingType === "custom"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted"
                }`}
              >
                <Link2 className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Custom link</div>
                  <div className="text-xs text-muted-foreground">Zoom, Teams</div>
                </div>
                {meetingType === "custom" && (
                  <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setMeetingType("in_person")}
                className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition ${
                  meetingType === "in_person"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted"
                }`}
              >
                <MapPin className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">In-person</div>
                  <div className="text-xs text-muted-foreground">On-site</div>
                </div>
                {meetingType === "in_person" && (
                  <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />
                )}
              </button>
            </div>
          </div>

          {/* Google Calendar: not configured on server */}
          {meetingType === "google_meet" && !gcalConfigured && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950 p-3">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Google Calendar isn't configured on this server. You can still schedule with a
                custom link or in-person.
              </p>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={() => setMeetingType("custom")}>
                  Use custom link
                </Button>
                <Button size="sm" variant="outline" onClick={() => setMeetingType("in_person")}>
                  In-person
                </Button>
              </div>
            </div>
          )}

          {/* Google Calendar: expired */}
          {meetingType === "google_meet" && gcalConfigured && gcalExpired && (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950 p-3 space-y-2">
              <p className="text-sm text-red-700 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Your Google Calendar connection has expired. Please reconnect to continue using
                automatic Google Meet links.
              </p>
              <Button
                size="sm"
                onClick={() => connect.mutate()}
                disabled={connect.isPending}
              >
                {connect.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Video className="h-4 w-4 mr-1" />
                )}
                Reconnect Google Calendar
              </Button>
            </div>
          )}

          {/* Google Calendar: not connected */}
          {meetingType === "google_meet" && gcalConfigured && !gcalConnected && !gcalExpired && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950 p-3 space-y-2">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Connect Google Calendar to auto-generate Meet links and send calendar invites.
              </p>
              <Button size="sm" onClick={() => connect.mutate()} disabled={connect.isPending}>
                {connect.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Video className="h-4 w-4 mr-1" />
                )}
                Connect Google Calendar
              </Button>
            </div>
          )}

          {/* Google Calendar: connected */}
          {meetingType === "google_meet" && gcalConnected && (
            <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950 p-3 space-y-2">
              <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Google Calendar connected — Meet link will be
                auto-generated.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => connect.mutate()}
                  disabled={connect.isPending}
                >
                  {connect.isPending ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Video className="h-4 w-4 mr-1" />
                  )}
                  Reconnect Google Calendar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => disconnect.mutate()}
                  disabled={disconnect.isPending}
                >
                  {disconnect.isPending ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Unlink className="h-4 w-4 mr-1" />
                  )}
                  Disconnect
                </Button>
              </div>
            </div>
          )}

          {/* Custom link input */}
          {meetingType === "custom" && (
            <div>
              <Label>Meeting link</Label>
              <Input
                placeholder="https://zoom.us/j/… or https://teams.microsoft.com/…"
                value={customLink}
                onChange={(e) => setCustomLink(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Paste any video call link (Zoom, Teams, Meet, etc.)
              </p>
            </div>
          )}

          {/* Title */}
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          {/* Start time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start time</Label>
              <Input
                type="datetime-local"
                value={start}
                min={minDateTime}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div>
              <Label>Duration (min)</Label>
              <Input
                type="number"
                min={15}
                max={480}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <Label>
              {meetingType === "in_person" ? "Location (required)" : "Location (optional)"}
            </Label>
            <Input
              placeholder={
                meetingType === "in_person"
                  ? "Office address or building name"
                  : "Office address or leave blank for online"
              }
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Notes (optional) */}
          <div>
            <Label>Notes (optional)</Label>
            <Textarea
              rows={2}
              placeholder="Interview agenda, preparation tips, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Invite goes to <span className="font-medium">{candidateEmail}</span>. A notification is
            sent automatically.
          </p>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => schedule.mutate()}
              disabled={
                schedule.isPending ||
                (meetingType === "google_meet" && !gcalConnected)
              }
            >
              {schedule.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4 mr-1" />
              )}
              Schedule interview
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
