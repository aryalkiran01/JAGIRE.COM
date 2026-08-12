// app/routes/_authenticated/employer/jobs/$jobId.tsx
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ScheduleInterviewDialog } from "@/components/schedule-interview-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Users, Loader as Loader2, Check, X, Star, FileText } from "lucide-react";
import { toast } from "sonner";
import { updateApplicationStatus } from "@/lib/application-status.server";

export const Route = createFileRoute("/_authenticated/employer/jobs/$jobId")({
  component: JobDetail,
});

interface Application {
  id: string;
  status: string;
  created_at: string;
  applicant_id: string | null;
  rejection_remark: string | null;
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
  location: string | null;
  is_remote: boolean | null;
  description: string;
  status: string;
}

const STATUS_BADGE: Record<string, string> = {
  applied: "bg-gray-100 text-gray-700",
  viewed: "bg-blue-100 text-blue-700",
  shortlisted: "bg-amber-100 text-amber-700",
  selected: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  interview: "bg-purple-100 text-purple-700",
  offer: "bg-green-100 text-green-700",
};

function JobDetail() {
  const { jobId } = useParams({ from: "/_authenticated/employer/jobs/$jobId" });
  const { user } = useAuth();
  const qc = useQueryClient();
  const updateStatusFn = useServerFn(updateApplicationStatus);
  const [rejectTarget, setRejectTarget] = useState<Application | null>(null);
  const [rejectRemark, setRejectRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: job, isLoading: jobLoading } = useQuery<Job | null>({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const { data } = await supabase
        .from("jobs")
        .select("id, title, job_type, location, is_remote, description, status")
        .eq("id", jobId)
        .single();
      return data as Job | null;
    },
  });

  const { data: applications, isLoading: appsLoading } = useQuery<Application[]>({
    queryKey: ["job-applications", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select(
          `
          id,
          status,
          created_at,
          applicant_id,
          rejection_remark,
          profile:profiles!applications_applicant_id_fkey (
            id,
            full_name,
            email,
            avatar_url
          )
        `,
        )
        .eq("job_id", jobId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Application[];
    },
  });

  const isLoading = jobLoading || appsLoading;

  async function doAction(app: Application, status: "shortlisted" | "selected" | "offer", label: string) {
    try {
      setSubmitting(true);
      await updateStatusFn({ data: { applicationId: app.id, status } });
      toast.success(label);
      qc.invalidateQueries({ queryKey: ["job-applications", jobId] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmReject() {
    if (!rejectTarget) return;
    if (rejectRemark.trim().length < 3) {
      toast.error("Please provide a remark (minimum 3 characters)");
      return;
    }
    try {
      setSubmitting(true);
      await updateStatusFn({
        data: { applicationId: rejectTarget.id, status: "rejected", remark: rejectRemark.trim() },
      });
      toast.success("Application rejected");
      qc.invalidateQueries({ queryKey: ["job-applications", jobId] });
      setRejectTarget(null);
      setRejectRemark("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Rejection failed");
    } finally {
      setSubmitting(false);
    }
  }

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
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium">{app.profile?.full_name ?? "Unknown"}</div>
                    <div className="text-xs text-muted-foreground">
                      {app.profile?.email ?? "No email"} · Applied{" "}
                      {new Date(app.created_at).toLocaleDateString()}
                    </div>
                    <Badge className={`mt-1 ${STATUS_BADGE[app.status] ?? "bg-gray-100 text-gray-700"}`}>
                      {app.status}
                    </Badge>
                    {app.rejection_remark && (
                      <div className="mt-1 text-xs text-muted-foreground italic">
                        "{app.rejection_remark}"
                      </div>
                    )}
                  </div>
                </div>

                {app.status !== "rejected" && app.status !== "selected" && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={submitting}
                      onClick={() => doAction(app, "shortlisted", "Applicant shortlisted")}
                    >
                      <Star className="h-4 w-4 mr-1" /> Shortlist
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={submitting}
                      onClick={() => doAction(app, "selected", "Applicant approved")}
                    >
                      <Check className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={submitting}
                      onClick={() => doAction(app, "offer", "Offer sent")}
                    >
                      <FileText className="h-4 w-4 mr-1" /> Offer
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      disabled={submitting}
                      onClick={() => {
                        setRejectTarget(app);
                        setRejectRemark("");
                      }}
                    >
                      <X className="h-4 w-4 mr-1" /> Reject
                    </Button>
                    <ScheduleInterviewDialog
                      applicationId={app.id}
                      candidateName={app.profile?.full_name ?? undefined}
                      candidateEmail={app.profile?.email ?? ""}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Rejection dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject application</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Provide feedback for {rejectTarget?.profile?.full_name ?? "this applicant"}. This will be
              visible to them in their application status.
            </p>
            <Textarea
              rows={4}
              placeholder="e.g. We're looking for someone with more experience in React..."
              value={rejectRemark}
              onChange={(e) => setRejectRemark(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={submitting || rejectRemark.trim().length < 3}
              onClick={confirmReject}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reject application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
