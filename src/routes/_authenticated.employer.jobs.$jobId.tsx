// app/routes/_authenticated/employer/jobs/$jobId.tsx
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ScheduleInterviewDialog } from "@/components/schedule-interview-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Loader as Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/employer/jobs/$jobId")({
  component: JobDetail,
});

// ★ Fix Application interface: allow nullable fields ★
interface Application {
  id: string;
  status: string;
  created_at: string;
  applicant_id: string | null; // ✅ allow null
  profile: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  } | null; // ✅ profile can be null
}

// ★ Fix Job interface: location and is_remote can be null ★
interface Job {
  id: string;
  title: string;
  job_type: string;
  location: string | null;
  is_remote: boolean | null;
  description: string;
  status: string;
}

function JobDetail() {
  const { jobId } = useParams({ from: "/_authenticated/employer/jobs/$jobId" });
  const { user } = useAuth();

  // --------------- Fetch job ---------------
  const { data: job, isLoading: jobLoading } = useQuery<Job | null>({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const { data } = await supabase
        .from("jobs")
        .select("id, title, job_type, location, is_remote, description, status")
        .eq("id", jobId)
        .single();
      return data as Job | null; // ✅ explicit cast to match interface
    },
  });

  // --------------- Fetch applications ---------------
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
      // ✅ cast to Application[] to satisfy TypeScript
      return (data ?? []) as unknown as Application[];
    },
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
                <ScheduleInterviewDialog
                  applicationId={app.id}
                  candidateName={app.profile?.full_name ?? undefined}
                  candidateEmail={app.profile?.email ?? ""}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
