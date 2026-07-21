import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MessageSquare, FileText, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { ScheduleInterviewDialog } from "@/components/schedule-interview-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/employer/jobs/$jobId")({
  component: JobApplicants,
});

const STATUSES = ["applied", "viewed", "shortlisted", "interview", "selected", "rejected"] as const;

function JobApplicants() {
  const { jobId } = Route.useParams();
  const qc = useQueryClient();
  const { data: job } = useQuery({
    queryKey: ["employer-job", jobId],
    queryFn: async () =>
      (await supabase.from("jobs").select("*").eq("id", jobId).maybeSingle()).data,
  });
  const { data: apps } = useQuery({
    queryKey: ["job-apps", jobId],
    queryFn: async () =>
      (
        await supabase
          .from("applications")
          .select(
            "*, profile:profiles!applications_applicant_id_fkey(id, full_name, email, headline, avatar_url), resume:resumes(id, file_name, file_path)",
          )
          .eq("job_id", jobId)
          .order("applied_at", { ascending: false })
      ).data ?? [],
  });
  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: any }) => {
      const { error } = await supabase.from("applications").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["job-apps"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-1">{job?.title}</h1>
      <p className="text-muted-foreground mb-6">{apps?.length ?? 0} applicants</p>
      <div className="grid gap-3">
        {apps?.map((a: any) => (
          <ApplicantCard
            key={a.id}
            a={a}
            onStatus={(v) => update.mutate({ id: a.id, status: v })}
          />
        ))}
        {!apps?.length && (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              No applications yet.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function ApplicantCard({ a, onStatus }: { a: any; onStatus: (v: string) => void }) {
  const [open, setOpen] = useState(false);

  async function openResume() {
    if (!a.resume?.file_path) return;
    const { data, error } = await supabase.storage
      .from("resumes")
      .createSignedUrl(a.resume.file_path, 60);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, "_blank", "noopener");
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="font-semibold truncate">{a.profile?.full_name ?? a.profile?.email}</div>
            <div className="text-sm text-muted-foreground truncate">{a.profile?.headline}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Applied {new Date(a.applied_at).toLocaleDateString()}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Badge
              className={a.status === "shortlisted" ? "gradient-brand text-primary-foreground" : ""}
            >
              {a.status}
            </Badge>
            <Select value={a.status} onValueChange={onStatus}>
              <SelectTrigger className="w-40">
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
            {a.resume?.file_path && (
              <Button variant="outline" size="sm" onClick={openResume}>
                <FileText className="mr-1 h-4 w-4" />
                Resume
              </Button>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link to="/messages" search={{ with: a.profile?.id }}>
                <MessageSquare className="h-4 w-4" />
              </Link>
            </Button>
            {a.profile?.email && (
              <ScheduleInterviewDialog
                applicationId={a.id}
                candidateName={a.profile?.full_name}
                candidateEmail={a.profile.email}
              />
            )}
          </div>
        </div>
        {a.cover_letter && (
          <Collapsible open={open} onOpenChange={setOpen} className="mt-3">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs">
                <ChevronDown
                  className={`mr-1 h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
                />
                {open ? "Hide" : "View"} cover letter
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 rounded-md bg-muted p-3 text-sm whitespace-pre-wrap">
              {a.cover_letter}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
