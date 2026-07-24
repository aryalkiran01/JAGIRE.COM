/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Clock,
  Video,
  CircleAlert as AlertCircle,
  CircleCheck as CheckCircle2,
  Circle as XCircle,
  Loader as Loader2,
  Camera,
  Mic,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { updateInterviewStatus, rescheduleInterview } from "@/lib/google-calendar.service";

export const Route = createFileRoute("/_authenticated/interviews")({
  component: InterviewsPage,
});

type Interview = {
  id: string;
  application_id: string;
  title: string | null;
  scheduled_at: string | null;
  duration_minutes: number | null;
  meeting_link: string | null;
  meet_link: string | null;
  location: string | null;
  status: string | null;
  notes: string | null;
  employer_id: string | null;
  candidate_id: string | null;
  candidate_email: string | null;
  created_at: string | null;
  updated_at: string | null;
  application?: {
    applicant_id: string | null;
    job?: { id: string; title: string | null; company?: { name: string | null } | null } | null;
  } | null;
};

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  scheduled: { color: "bg-blue-500", icon: Calendar, label: "Scheduled" },
  confirmed: { color: "bg-emerald-500", icon: CheckCircle2, label: "Confirmed" },
  ongoing: { color: "bg-orange-500", icon: Video, label: "Ongoing" },
  completed: { color: "bg-green-600", icon: CheckCircle2, label: "Completed" },
  cancelled: { color: "bg-red-500", icon: XCircle, label: "Cancelled" },
  missed: { color: "bg-gray-500", icon: AlertCircle, label: "Missed" },
  expired: { color: "bg-gray-400", icon: AlertCircle, label: "Expired" },
  reschedule_requested: { color: "bg-amber-500", icon: RefreshCw, label: "Reschedule requested" },
};

function CountdownTimer({ target }: { target: string }) {
  const [remaining, setRemaining] = useState(getRemaining(target));
  useEffect(() => {
    const interval = setInterval(() => setRemaining(getRemaining(target)), 1000);
    return () => clearInterval(interval);
  }, [target]);
  if (remaining.started)
    return <span className="text-xs text-orange-500 font-medium">Starting soon</span>;
  return (
    <span className="text-xs font-mono text-muted-foreground">
      Starts in {remaining.d}d {remaining.h}h {remaining.m}m {remaining.s}s
    </span>
  );
}

function getRemaining(target: string) {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return { started: true, d: 0, h: 0, m: 0, s: 0 };
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { started: false, d, h, m, s };
}

function InterviewsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [joinOpen, setJoinOpen] = useState<string | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState<Interview | null>(null);
  const [proposedTime, setProposedTime] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [busy, setBusy] = useState(false);

  const updateStatusFn = useServerFn(updateInterviewStatus);
  const rescheduleFn = useServerFn(rescheduleInterview);

  const { data: interviews, isLoading } = useQuery<Interview[]>({
    queryKey: ["my-interviews", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Candidate sees interviews where they are the candidate
      const { data, error } = await supabase
        .from("interviews")
        .select(
          "id, application_id, title, scheduled_at, duration_minutes, meeting_link, meet_link, location, status, notes, employer_id, candidate_id, candidate_email, created_at, updated_at, application:applications!interviews_application_id_fkey(applicant_id, job:jobs(id, title, company:companies(name)))",
        )
        .or(`candidate_id.eq.${user!.id},employer_id.eq.${user!.id}`)
        .order("scheduled_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("interviews-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "interviews",
          filter: `candidate_id=eq.${user.id}`,
        },
        () => qc.invalidateQueries({ queryKey: ["my-interviews"] }),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "interviews",
          filter: `employer_id=eq.${user.id}`,
        },
        () => qc.invalidateQueries({ queryKey: ["my-interviews"] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [user, qc]);

  async function confirmInterview(id: string) {
    try {
      await updateStatusFn({ data: { interviewId: id, status: "confirmed" } });
      toast.success("Interview confirmed");
      qc.invalidateQueries({ queryKey: ["my-interviews"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function cancelInterview(id: string) {
    if (!confirm("Cancel this interview? The other party will be notified.")) return;
    try {
      await updateStatusFn({ data: { interviewId: id, status: "cancelled" } });
      toast.success("Interview cancelled");
      qc.invalidateQueries({ queryKey: ["my-interviews"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function markCompleted(id: string) {
    try {
      await updateStatusFn({ data: { interviewId: id, status: "completed" } });
      toast.success("Interview marked as completed");
      qc.invalidateQueries({ queryKey: ["my-interviews"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function submitReschedule() {
    if (!rescheduleOpen || !proposedTime) return;
    setBusy(true);
    try {
      await rescheduleFn({
        data: {
          interviewId: rescheduleOpen.id,
          proposedTimeISO: new Date(proposedTime).toISOString(),
          reason: rescheduleReason || undefined,
        },
      });
      toast.success("Reschedule request sent");
      setRescheduleOpen(null);
      setProposedTime("");
      setRescheduleReason("");
      qc.invalidateQueries({ queryKey: ["my-interviews"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  const interviewList = Array.isArray(interviews) ? interviews : [];
  const isEmployerView = interviewList.some((i) => i.employer_id === user?.id);
  const upcoming = interviewList.filter(
    (i) =>
      i.status === "scheduled" ||
      i.status === "confirmed" ||
      i.status === "ongoing" ||
      i.status === "reschedule_requested",
  );
  const past = interviewList.filter(
    (i) =>
      i.status === "completed" ||
      i.status === "cancelled" ||
      i.status === "missed" ||
      i.status === "expired",
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Interviews</h1>
        <p className="text-muted-foreground">
          {isEmployerView ? "Manage your candidate interviews" : "Your scheduled interviews"}
        </p>
      </div>

      {upcoming.length === 0 && past.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-40" />
            No interviews scheduled.
          </CardContent>
        </Card>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Upcoming</h2>
          {upcoming.map((iv) => {
            const statusCfg = STATUS_CONFIG[iv.status ?? "scheduled"] ?? STATUS_CONFIG.scheduled;
            const StatusIcon = statusCfg.icon;
            const link = iv.meeting_link ?? iv.meet_link;
            const jobTitle = iv.application?.job?.title ?? "Position";
            const companyName = iv.application?.job?.company?.name ?? "";
            const canJoin =
              iv.status === "confirmed" || iv.status === "scheduled" || iv.status === "ongoing";
            const isCandidate = iv.candidate_id === user?.id;
            const isEmployer = iv.employer_id === user?.id;
            return (
              <Card key={iv.id} id={`interview-${iv.id}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-lg">
                        {iv.title ?? `Interview — ${jobTitle}`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {jobTitle}
                        {companyName && ` · ${companyName}`}
                      </div>
                    </div>
                    <Badge className={`${statusCfg.color} text-white`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusCfg.label}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {iv.scheduled_at ? new Date(iv.scheduled_at).toLocaleString() : "TBD"}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {iv.duration_minutes ?? 60} min
                    </div>
                    {iv.location && (
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        {iv.location}
                      </div>
                    )}
                  </div>

                  {iv.status === "scheduled" && iv.scheduled_at && (
                    <CountdownTimer target={iv.scheduled_at} />
                  )}

                  {iv.notes && (
                    <div className="bg-muted rounded-lg p-3 text-sm">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Notes</div>
                      {iv.notes}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    {link && canJoin && (
                      <>
                        <Button
                          className="gradient-brand text-primary-foreground"
                          onClick={() => setJoinOpen(iv.id)}
                        >
                          <Video className="h-4 w-4 mr-1" />
                          Join Interview
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a href={link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Open link
                          </a>
                        </Button>
                      </>
                    )}
                    {iv.status === "scheduled" && isCandidate && (
                      <Button variant="outline" size="sm" onClick={() => confirmInterview(iv.id)}>
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Confirm
                      </Button>
                    )}
                    {isEmployer && iv.status !== "completed" && iv.status !== "cancelled" && (
                      <Button variant="outline" size="sm" onClick={() => markCompleted(iv.id)}>
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Mark completed
                      </Button>
                    )}
                    {(iv.status === "scheduled" || iv.status === "confirmed") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => cancelInterview(iv.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                    {(iv.status === "scheduled" || iv.status === "confirmed") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRescheduleOpen(iv);
                          setProposedTime(
                            iv.scheduled_at
                              ? new Date(iv.scheduled_at).toISOString().slice(0, 16)
                              : "",
                          );
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Request reschedule
                      </Button>
                    )}
                  </div>

                  {joinOpen === iv.id && link && (
                    <JoinInterviewPanel
                      link={link}
                      onClose={() => setJoinOpen(null)}
                      interviewId={iv.id}
                      onStatusUpdate={() => qc.invalidateQueries({ queryKey: ["my-interviews"] })}
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Past</h2>
          {past.map((iv) => {
            const statusCfg = STATUS_CONFIG[iv.status ?? "completed"] ?? STATUS_CONFIG.completed;
            const StatusIcon = statusCfg.icon;
            return (
              <Card key={iv.id} className="opacity-75">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{iv.title ?? "Interview"}</div>
                      <div className="text-xs text-muted-foreground">
                        {iv.scheduled_at ? new Date(iv.scheduled_at).toLocaleString() : ""}
                      </div>
                    </div>
                    <Badge className={`${statusCfg.color} text-white`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusCfg.label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Reschedule dialog */}
      <Dialog open={!!rescheduleOpen} onOpenChange={(o) => !o && setRescheduleOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request reschedule</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Proposed new time</Label>
              <Input
                type="datetime-local"
                value={proposedTime}
                onChange={(e) => setProposedTime(e.target.value)}
              />
            </div>
            <div>
              <Label>Reason (optional)</Label>
              <Textarea
                rows={2}
                placeholder="Reason for rescheduling"
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRescheduleOpen(null)}>
              Cancel
            </Button>
            <Button onClick={submitReschedule} disabled={busy || !proposedTime}>
              {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              Send request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function JoinInterviewPanel({
  link,
  onClose,
  interviewId,
  onStatusUpdate,
}: {
  link: string;
  onClose: () => void;
  interviewId: string;
  onStatusUpdate: () => void;
}) {
  const [cameraOk, setCameraOk] = useState<boolean | null>(null);
  const [micOk, setMicOk] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!active) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        setStream(s);
        setCameraOk(true);
        setMicOk(true);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch {
        setCameraOk(false);
        setMicOk(false);
      }
    })();
    return () => {
      active = false;
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function joinNow() {
    setJoining(true);
    // Mark as ongoing via direct update (candidate can do this)
    await supabase.from("interviews").update({ status: "ongoing" }).eq("id", interviewId);
    onStatusUpdate();
    window.open(link, "_blank", "noopener,noreferrer");
    setJoining(false);
    onClose();
  }

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Video className="h-4 w-4" /> Pre-join check
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          {cameraOk === null && (
            <div className="absolute inset-0 flex items-center justify-center text-white/70 text-sm">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Camera className="h-4 w-4" />
            Camera:
            {cameraOk === true && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            {cameraOk === false && <XCircle className="h-4 w-4 text-red-500" />}
            {cameraOk === null && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mic className="h-4 w-4" />
            Microphone:
            {micOk === true && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            {micOk === false && <XCircle className="h-4 w-4 text-red-500" />}
            {micOk === null && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          {(cameraOk === false || micOk === false) && (
            <p className="text-xs text-amber-600">
              Camera/mic not available. You can still join via the external link.
            </p>
          )}
          <Button
            className="w-full gradient-brand text-primary-foreground"
            onClick={joinNow}
            disabled={joining}
          >
            {joining ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Video className="h-4 w-4 mr-1" />
            )}
            Join now
          </Button>
        </div>
      </div>
    </div>
  );
}
