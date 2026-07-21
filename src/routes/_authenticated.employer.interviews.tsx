import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Calendar, Clock, Video, Loader as Loader2, Pencil, X, CircleCheck as CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { updateInterviewStatus } from "@/lib/google-calendar.functions";

export const Route = createFileRoute("/_authenticated/employer/interviews")({
  component: EmployerInterviews,
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
  candidate_id: string | null;
  candidate_email: string | null;
  created_at: string | null;
  updated_at: string | null;
  application?: {
    applicant_id: string | null;
    job?: { id: string; title: string | null } | null;
    profile?: { id: string; full_name: string | null; email: string | null } | null;
  } | null;
};

const STATUSES = [
  "scheduled",
  "confirmed",
  "ongoing",
  "completed",
  "cancelled",
  "missed",
  "expired",
] as const;

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-500",
  confirmed: "bg-emerald-500",
  ongoing: "bg-orange-500",
  completed: "bg-green-600",
  cancelled: "bg-red-500",
  missed: "bg-gray-500",
  expired: "bg-gray-400",
  reschedule_requested: "bg-amber-500",
};

function EmployerInterviews() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const updateStatusFn = useServerFn(updateInterviewStatus);
  const [editInterview, setEditInterview] = useState<Interview | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editDuration, setEditDuration] = useState(30);
  const [editNotes, setEditNotes] = useState("");
  const [editLink, setEditLink] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: interviews, isLoading } = useQuery<Interview[]>({
    queryKey: ["employer-interviews", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interviews")
        .select(
          "id, application_id, title, scheduled_at, duration_minutes, meeting_link, meet_link, location, status, notes, candidate_id, candidate_email, created_at, updated_at, application:applications!interviews_application_id_fkey(applicant_id, job:jobs(id, title), profile:profiles!applications_applicant_id_fkey(id, full_name, email))",
        )
        .eq("employer_id", user!.id)
        .order("scheduled_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Realtime
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("employer-interviews-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "interviews",
          filter: `employer_id=eq.${user.id}`,
        },
        () => qc.invalidateQueries({ queryKey: ["employer-interviews"] }),
      )
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [user, qc]);

  async function updateStatus(id: string, status: string) {
    try {
      await updateStatusFn({ data: { interviewId: id, status } });
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["employer-interviews"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  function openEdit(iv: Interview) {
    setEditInterview(iv);
    setEditTitle(iv.title ?? "Interview");
    setEditStart(iv.scheduled_at ? new Date(iv.scheduled_at).toISOString().slice(0, 16) : "");
    setEditDuration(iv.duration_minutes ?? 30);
    setEditNotes(iv.notes ?? "");
    setEditLink(iv.meeting_link ?? iv.meet_link ?? "");
  }

  async function saveEdit() {
    if (!editInterview) return;
    setSaving(true);
    const { error } = await supabase
      .from("interviews")
      .update({
        title: editTitle,
        scheduled_at: editStart ? new Date(editStart).toISOString() : undefined,
        duration_minutes: editDuration,
        notes: editNotes || null,
        meeting_link: editLink || null,
        meet_link: editLink || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editInterview.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Interview updated");
    setEditInterview(null);
    qc.invalidateQueries({ queryKey: ["employer-interviews"] });
  }

  async function cancelInterview(id: string) {
    if (!confirm("Cancel this interview? The candidate will be notified.")) return;
    await updateStatus(id, "cancelled");
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const upcoming = interviews?.filter(
    (i) =>
      i.status === "scheduled" ||
      i.status === "confirmed" ||
      i.status === "ongoing" ||
      i.status === "reschedule_requested",
  ) ?? [];
  const past = interviews?.filter(
    (i) =>
      i.status === "completed" ||
      i.status === "cancelled" ||
      i.status === "missed" ||
      i.status === "expired",
  ) ?? [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Interviews</h1>
        <p className="text-muted-foreground">Schedule, reschedule, and manage candidate interviews.</p>
      </div>

      {interviews?.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-40" />
            No interviews yet. Schedule one from a job's applicant list.
          </CardContent>
        </Card>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Upcoming ({upcoming.length})</h2>
          {upcoming.map((iv) => (
            <Card key={iv.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-lg">{iv.title ?? "Interview"}</div>
                    <div className="text-sm text-muted-foreground">
                      {iv.application?.profile?.full_name ?? iv.candidate_email ?? "Candidate"}
                      {iv.application?.job && ` · ${iv.application.job.title}`}
                    </div>
                  </div>
                  <Badge className={`${STATUS_COLORS[iv.status ?? "scheduled"] ?? "bg-gray-500"} text-white`}>
                    {iv.status === "reschedule_requested" ? "Reschedule requested" : iv.status}
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
                  {(iv.meeting_link || iv.meet_link) && (
                    <div className="flex items-center gap-1.5">
                      <Video className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={iv.meeting_link ?? iv.meet_link ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Meeting link
                      </a>
                    </div>
                  )}
                </div>

                {iv.status === "reschedule_requested" && iv.notes && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950 p-3 text-sm">
                    <div className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">
                      Reschedule request
                    </div>
                    {iv.notes}
                  </div>
                )}

                {iv.notes && iv.status !== "reschedule_requested" && (
                  <div className="bg-muted rounded-lg p-3 text-sm">
                    <div className="text-xs font-medium text-muted-foreground mb-1">Notes</div>
                    {iv.notes}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  <Select
                    value={iv.status ?? "scheduled"}
                    onValueChange={(v) => updateStatus(iv.id, v)}
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => openEdit(iv)}>
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  {iv.status !== "completed" && iv.status !== "cancelled" && (
                    <Button variant="outline" size="sm" onClick={() => updateStatus(iv.id, "completed")}>
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Complete
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => cancelInterview(iv.id)}
                  >
                    <X className="h-4 w-4 mr-1" /> Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Past ({past.length})</h2>
          {past.map((iv) => (
            <Card key={iv.id} className="opacity-75">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{iv.title ?? "Interview"}</div>
                    <div className="text-xs text-muted-foreground">
                      {iv.application?.profile?.full_name ?? iv.candidate_email}
                      {iv.scheduled_at && ` · ${new Date(iv.scheduled_at).toLocaleString()}`}
                    </div>
                  </div>
                  <Badge className={`${STATUS_COLORS[iv.status ?? "completed"] ?? "bg-gray-500"} text-white`}>
                    {iv.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editInterview} onOpenChange={(o) => !o && setEditInterview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit interview</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div>
              <Label>Start time</Label>
              <Input
                type="datetime-local"
                value={editStart}
                onChange={(e) => setEditStart(e.target.value)}
              />
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                min={15}
                max={480}
                value={editDuration}
                onChange={(e) => setEditDuration(Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Meeting link</Label>
              <Input
                placeholder="https://meet.google.com/…"
                value={editLink}
                onChange={(e) => setEditLink(e.target.value)}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea rows={3} value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditInterview(null)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
