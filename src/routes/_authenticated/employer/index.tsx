/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Briefcase,
  Users,
  TrendingUp,
  Sparkles,
  Loader as Loader2,
  Video,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { seedDemoData } from "@/lib/demo-seed";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/employer/")({ component: EmployerDashboard });

function EmployerDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [seeding, setSeeding] = useState(false);

  async function runSeed() {
    if (!user) return;
    setSeeding(true);
    try {
      const res = await seedDemoData(user.id);
      toast.success(`Added ${res.jobs} demo jobs`);
      qc.invalidateQueries({ queryKey: ["my-company"] });
      qc.invalidateQueries({ queryKey: ["my-jobs"] });
    } catch (e: any) {
      toast.error(e.message ?? "Seed failed");
    } finally {
      setSeeding(false);
    }
  }

  const { data: company } = useQuery({
    queryKey: ["my-company", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("companies").select("*").eq("owner_id", user!.id).maybeSingle()).data,
  });
  const { data: jobs } = useQuery({
    queryKey: ["my-jobs", company?.id],
    enabled: !!company?.id,
    queryFn: async () =>
      (
        await supabase
          .from("jobs")
          .select("*")
          .eq("company_id", company!.id)
          .order("created_at", { ascending: false })
      ).data ?? [],
  });

  const jobIds = (jobs ?? []).map((j) => j.id);
  const { data: appCounts } = useQuery({
    queryKey: ["employer-app-counts", jobIds.join(",")],
    enabled: jobIds.length > 0,
    queryFn: async () => {
      const { count } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .in("job_id", jobIds);
      return count ?? 0;
    },
  });

  if (!company) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Set up your company</h2>
            <p className="text-muted-foreground mb-4">
              Create your company profile to start posting jobs.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild className="gradient-brand text-primary-foreground">
                <Link to="/employer/company">Create company</Link>
              </Button>
              <Button variant="outline" onClick={runSeed} disabled={seeding}>
                {seeding ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Load demo company & jobs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  const totalApps = appCounts ?? 0;
  const totalViews = jobs?.reduce((sum, j) => sum + (j.views_count ?? 0), 0) ?? 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{company.name}</h1>
          <p className="text-muted-foreground">Employer dashboard</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/employer/interviews">
              <Video className="mr-2 h-4 w-4" />
              Interviews
            </Link>
          </Button>
          <Button variant="outline" onClick={runSeed} disabled={seeding}>
            {seeding ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Seed demo jobs
          </Button>
          <Button asChild className="gradient-brand text-primary-foreground">
            <Link to="/employer/jobs/new">
              <Plus className="mr-2 h-4 w-4" />
              Post a job
            </Link>
          </Button>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={Briefcase}
          label="Active jobs"
          value={jobs?.filter((j) => j.status === "active").length ?? 0}
        />
        <StatCard icon={Users} label="Total applicants" value={totalApps} />
        <StatCard icon={TrendingUp} label="Total views" value={totalViews} />
      </div>
      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold mb-4">Your jobs</h2>
          {jobs?.length ? (
            <div className="space-y-2">
              {jobs.map((j) => (
                <Link
                  key={j.id}
                  to="/employer/jobs/$jobId"
                  params={{ jobId: j.id }}
                  className="block"
                >
                  <div className="flex items-center justify-between p-3 rounded hover:bg-muted">
                    <div>
                      <div className="font-medium">{j.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {j.applications_count ?? 0} applicants · {j.status}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(j.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No jobs yet. Post your first!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: any) {
  return (
    <Card>
      <CardContent className="p-6">
        <Icon className="h-6 w-6 text-primary mb-2" />
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
