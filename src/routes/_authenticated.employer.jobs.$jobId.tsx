// app/routes/_authenticated/employer/jobs/$jobId.tsx
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { scheduleInterview } from "@/lib/google-calendar.functions"; // ★ NEW import
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar, MapPin, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/employer/jobs/$jobId")({
  component: JobDetail,
});

interface Application {
  id: string;
  status: string;
  created_at: string;
  applicant_id: string;
  profile: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  } | null;
}

interface Job {
  id: string;
  title: string;
  job_type: string;
  location: string;
  is_remote: boolean;
  description: string;
  status: string;
}

function JobDetail() {
  const { jobId } = useParams({ from: "/_authenticated/employer/jobs/$jobId" });
  const { user } = useAuth();
  const qc = useQueryClient();

  // --------------- Fetch job ---------------
  const { data: job, isLoading: jobLoading } = useQuery<Job | null>({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const { data } = await supabase
        .from("jobs")
        .select("id, title, job_type, location, is_remote, description, status")
        .eq("id", jobId)
        .single();
      return data;
    },
  });

  // --------------- Fetch applications ---------------
  const { data: applications, isLoading: appsLoading } = useQuery<Application[]>({
    queryKey: ["job-applications", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select(
          "id, status, created_at, applicant_id, profile:profiles!applications_applicant_id_fkey(id, full_name, email)",
        )
        .eq("job_id", jobId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // --------------- Interview creation dialog state ---------------
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [interviewTitle, setInterviewTitle] = useState("Interview");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState(30);
  const [meetingLink, setMeetingLink] = useState("");
  const [notes, setNotes] = useState("");

  // ★★★ Updated mutation: uses scheduleInterview server function ★★★
  const createInterview = useMutation({
    mutationFn: async () => {
      if (!selectedApp || !user) throw new Error("Missing data");
      if (!scheduledAt) throw new Error("Date & time is required");

      const result = await scheduleInterview({
        data: {
          applicationId: selectedApp.id,
          candidateEmail: selectedApp.profile?.email ?? "",
          candidateName: selectedApp.profile?.full_name ?? undefined,
          title: interviewTitle || "Interview",
          startISO: new Date(scheduledAt).toISOString(),
          durationMinutes: duration,
          meetingLink: meetingLink || undefined, // fallback if Google fails
          notes: notes || undefined,
          useGoogleCalendar: true, // tries to create calendar event + Meet
        },
      });

      return result; // { interviewId, eventId, meetLink }
    },
    onSuccess: async (result) => {
      toast.success("Interview scheduled!");

      // Show Google Meet link if generated
      if (result.meetLink) {
        toast.info("Google Meet link created");
      }

      // --- Also send email via Resend function ---
      if (selectedApp?.profile?.email) {
        supabase.functions
          .invoke("email", {
            body: {
              to: selectedApp.profile.email,
              subject: `Interview invitation: ${job?.title ?? "Job"}`,
              html: `
                <p>Hello ${selectedApp.profile.full_name ?? "Candidate"},</p>
                <p>You've been invited to an interview.</p>
                <p><strong>Date:</strong> ${new Date(scheduledAt).toLocaleString()}</p>
                <p><strong>Duration:</strong> ${duration} minutes</p>
                ${
                  result.meetLink
                    ? `<p><strong>Google Meet:</strong> <a href="${result.meetLink}">${result.meetLink}</a></p>`
                    : ""
                }
                <p>Please confirm your availability.</p>
              `,
            },
          })
          .catch(() => {
            // Silently ignore email errors – they're non-critical
          });
      }

      // Reset form & refresh data
      setSelectedApp(null);
      setInterviewTitle("Interview");
      setScheduledAt("");
      setDuration(30);
      setMeetingLink("");
      setNotes("");
      qc.invalidateQueries({ queryKey: ["employer-interviews"] });
      qc.invalidateQueries({ queryKey: ["job-applications", jobId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const isLoading = jobLoading || appsLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold mb-2">Job not found</h2>
        <p className="text-muted-foreground">This job may have been removed.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
      {/* Job header */}
      <Card>
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="secondary" className="capitalize">
              {job.job_type.replace("_", " ")}
            </Badge>
            {job.is_remote && <Badge variant="outline">Remote</Badge>}
            {job.location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" /> {job.location}
              </div>
            )}
          </div>
          <p className="mt-4 text-sm whitespace-pre-wrap">{job.description}</p>
        </CardContent>
      </Card>

      {/* Applicants list */}
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" /> Applicants ({applications?.length ?? 0})
        </h2>
        {(!applications || applications.length === 0) && (
          <p className="text-muted-foreground text-sm mt-2">No applications yet.</p>
        )}
        <div className="space-y-3 mt-3">
          {applications?.map((app) => (
            <Card key={app.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{app.profile?.full_name ?? "Unknown"}</div>
                  <div className="text-xs text-muted-foreground">
                    {app.profile?.email ?? "No email"} · Applied{" "}
                    {new Date(app.created_at).toLocaleDateString()}
                  </div>
                  <Badge variant="outline" className="mt-1">
                    {app.status}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedApp(app);
                    setInterviewTitle(
                      `Interview: ${job.title} - ${app.profile?.full_name ?? "Candidate"}`,
                    );
                    setScheduledAt("");
                    setDuration(30);
                    setMeetingLink("");
                    setNotes("");
                  }}
                >
                  Schedule Interview
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Schedule dialog */}
      <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={interviewTitle} onChange={(e) => setInterviewTitle(e.target.value)} />
            </div>
            <div>
              <Label>Date & Time *</Label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                min={15}
                max={480}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Meeting Link (optional)</Label>
              <Input
                placeholder="https://meet.google.com/…"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
              />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelectedApp(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => createInterview.mutate()}
              disabled={!scheduledAt || createInterview.isPending}
            >
              {createInterview.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
