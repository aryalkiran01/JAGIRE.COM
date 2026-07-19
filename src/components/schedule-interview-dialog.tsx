import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";
import { scheduleInterview, getGoogleCalendarStatus, startGoogleCalendarConnect, saveGoogleCalendarConnection } from "@/lib/google-calendar.functions";
import { connectAppUser } from "@/integrations/lovable/appUserConnectorClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const GATEWAY = "https://connector-gateway.lovable.dev";

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
  const qc = useQueryClient();

  const statusFn = useServerFn(getGoogleCalendarStatus);
  const startFn = useServerFn(startGoogleCalendarConnect);
  const saveFn = useServerFn(saveGoogleCalendarConnection);
  const scheduleFn = useServerFn(scheduleInterview);

  const status = useQuery({
    queryKey: ["gcal-status"],
    queryFn: () => statusFn(),
    enabled: open,
  });

  const connect = useMutation({
    mutationFn: async () => {
      const res = await connectAppUser({
        connectorId: "google_calendar",
        gatewayBaseUrl: GATEWAY,
        start: (targetOrigin) => startFn({ data: targetOrigin }),
      });
      if (!res.success) throw new Error(res.error ?? "Failed to connect");
      if (res.connectionAPIKey) {
        await saveFn({ data: { connectionAPIKey: res.connectionAPIKey } });
      }
    },
    onSuccess: () => {
      toast.success("Google Calendar connected");
      qc.invalidateQueries({ queryKey: ["gcal-status"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const schedule = useMutation({
    mutationFn: async () => {
      if (!start) throw new Error("Pick a start time");
      return scheduleFn({
        data: {
          applicationId,
          candidateEmail,
          candidateName,
          title,
          startISO: new Date(start).toISOString(),
          durationMinutes: duration,
        },
      });
    },
    onSuccess: (r) => {
      toast.success("Interview scheduled");
      if (r.meetLink) navigator.clipboard?.writeText(r.meetLink).catch(() => {});
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Calendar className="h-4 w-4 mr-1" /> Schedule
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule interview</DialogTitle>
        </DialogHeader>
        {status.isLoading ? (
          <p className="text-sm text-muted-foreground">Checking Google Calendar…</p>
        ) : !status.data?.connected ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Connect your Google account to create a Calendar event with an auto-generated Meet link.
            </p>
            <Button onClick={() => connect.mutate()} disabled={connect.isPending}>
              {connect.isPending ? "Connecting…" : "Connect Google Calendar"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Start</Label>
              <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input type="number" min={15} max={480} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
            </div>
            <p className="text-xs text-muted-foreground">
              Invite goes to <span className="font-medium">{candidateEmail}</span>. A Google Meet link is created automatically.
            </p>
            <DialogFooter>
              <Button onClick={() => schedule.mutate()} disabled={schedule.isPending}>
                {schedule.isPending ? "Scheduling…" : "Create event"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}