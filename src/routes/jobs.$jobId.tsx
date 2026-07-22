import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Bookmark,
  Loader as Loader2,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { ApplyJobDialog } from "@/components/apply-job-dialog";

export const Route = createFileRoute("/jobs/$jobId")({
  component: JobDetail,
});

function JobDetail() {
  const { jobId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const { data } = await supabase
        .from("jobs")
        .select("*, company:companies(*)")
        .eq("id", jobId)
        .maybeSingle();
      return data;
    },
  });

  const { data: hasApplied } = useQuery({
    queryKey: ["applied", jobId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("applications")
        .select("id")
        .eq("job_id", jobId)
        .eq("applicant_id", user!.id)
        .maybeSingle();
      return !!data;
    },
  });

  async function save() {
    if (!user)
      return navigate({ to: "/auth", search: { mode: "signin", redirect: `/jobs/${jobId}` } });
    setSaving(true);
    const { error } = await supabase.from("saved_jobs").insert({ job_id: jobId, user_id: user.id });
    setSaving(false);
    if (error && error.code !== "23505") toast.error(error.message);
    else toast.success("Saved!");
  }

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  if (!job)
    return <div className="min-h-screen flex items-center justify-center">Job not found</div>;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-8 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                  {(job as any).company?.logo_url ? (
                    <img
                      src={(job as any).company.logo_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Building2 className="h-8 w-8" />
                  )}
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-1">{job.title}</h1>
                  <div className="text-muted-foreground">{(job as any).company?.name}</div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {job.location && (
                      <Badge variant="secondary">
                        <MapPin className="mr-1 h-3 w-3" />
                        {job.location}
                      </Badge>
                    )}
                    <Badge variant="secondary">
                      <Briefcase className="mr-1 h-3 w-3" />
                      {String(job.job_type).replace("_", " ")}
                    </Badge>
                    <Badge variant="outline">{job.experience_level}</Badge>
                    {job.salary_min && (
                      <Badge className="gradient-brand text-primary-foreground">
                        <DollarSign className="mr-1 h-3 w-3" />
                        {Math.round(job.salary_min / 1000)}k -{" "}
                        {Math.round((job.salary_max ?? job.salary_min) / 1000)}k
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <h3>Description</h3>
                <p className="whitespace-pre-wrap">{job.description}</p>
                {job.responsibilities && (
                  <>
                    <h3>Responsibilities</h3>
                    <p className="whitespace-pre-wrap">
                      {Array.isArray(job.responsibilities)
                        ? (job.responsibilities as string[]).join("\n")
                        : String(job.responsibilities)}
                    </p>
                  </>
                )}
                {job.requirements && (
                  <>
                    <h3>Requirements</h3>
                    <p className="whitespace-pre-wrap">{job.requirements}</p>
                  </>
                )}
                {job.benefits && (
                  <>
                    <h3>Benefits</h3>
                    <p className="whitespace-pre-wrap">{job.benefits}</p>
                  </>
                )}
                {job.required_skills && job.required_skills.length > 0 && (
                  <>
                    <h3>Skills</h3>
                    <div className="flex flex-wrap gap-2 not-prose">
                      {job.required_skills.map((s) => (
                        <Badge key={s} variant="outline">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card className="sticky top-24">
            <CardContent className="p-6 space-y-3">
              {user ? (
                <ApplyJobDialog
                  jobId={jobId}
                  applied={hasApplied}
                  jobClosed={!["active", "published"].includes(job.status)}
                  deadlinePassed={
                    !!job.application_deadline && new Date(job.application_deadline) < new Date()
                  }
                />
              ) : (
                <Button
                  onClick={() =>
                    navigate({
                      to: "/auth",
                      search: { mode: "signin", redirect: `/jobs/${jobId}` },
                    })
                  }
                  className="w-full gradient-brand text-primary-foreground"
                >
                  Sign in to apply
                </Button>
              )}
              {job.application_deadline && (
                <p className="text-xs text-muted-foreground text-center">
                  Apply by {new Date(job.application_deadline).toLocaleDateString()}
                </p>
              )}
              <Button onClick={save} disabled={saving} variant="outline" className="w-full">
                <Bookmark className="mr-2 h-4 w-4" />
                Save job
              </Button>
              {user &&
                (job as any).company?.owner_id &&
                (job as any).company.owner_id !== user.id && (
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/messages" search={{ with: (job as any).company.owner_id }}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Message employer
                    </Link>
                  </Button>
                )}
              <div className="text-xs text-muted-foreground pt-3 border-t">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Posted{" "}
                  {new Date(job.created_at).toLocaleDateString()}
                </div>
                <div className="mt-1">
                  {job.applications_count} applicants · {job.views_count} views
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
