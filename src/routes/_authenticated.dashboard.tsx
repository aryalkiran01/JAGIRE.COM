import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, FileText, Bookmark, Sparkles, TrendingUp, Video } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

const STATUS_COLORS: Record<string, string> = {
  applied: "bg-blue-500",
  viewed: "bg-purple-500",
  shortlisted: "bg-amber-500",
  interview: "bg-orange-500",
  selected: "bg-green-500",
  rejected: "bg-red-500",
  withdrawn: "bg-gray-500",
};

function Dashboard() {
  const { user } = useAuth();
  const { data: apps } = useQuery({
    queryKey: ["my-apps", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (
        await supabase
          .from("applications")
          .select("*, job:jobs(id, title, company:companies(name, logo_url))")
          .eq("applicant_id", user!.id)
          .order("applied_at", { ascending: false })
      ).data ?? [],
  });
  const { data: saved } = useQuery({
    queryKey: ["my-saved", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (
        await supabase
          .from("saved_jobs")
          .select("job:jobs(*, company:companies(name, logo_url))")
          .eq("user_id", user!.id)
      ).data ?? [],
  });
  const { data: resume } = useQuery({
    queryKey: ["my-resume", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (
        await supabase
          .from("resumes")
          .select("*")
          .eq("user_id", user!.id)
          .eq("is_default", true)
          .maybeSingle()
      ).data,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground">Here's your career at a glance</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <StatBox
          icon={FileText}
          label="Applications"
          value={apps?.length ?? 0}
          color="text-blue-500"
        />
        <StatBox
          icon={Bookmark}
          label="Saved jobs"
          value={saved?.length ?? 0}
          color="text-amber-500"
        />
        <StatBox
          icon={Sparkles}
          label="Resume score"
          value={resume?.overall_score ?? "—"}
          color="text-purple-500"
        />
        <StatBox
          icon={TrendingUp}
          label="Interviews"
          value={apps?.filter((a) => a.status === "interview").length ?? 0}
          color="text-green-500"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent applications</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/applications">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {apps?.length ? (
              <div className="space-y-3">
                {apps.slice(0, 5).map((a: any) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted"
                  >
                    <div>
                      <div className="font-medium">{a.job?.title}</div>
                      <div className="text-sm text-muted-foreground">{a.job?.company?.name}</div>
                    </div>
                    <Badge className={`${STATUS_COLORS[a.status]} text-white`}>{a.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No applications yet.{" "}
                <Link to="/jobs" className="text-primary font-medium">
                  Browse jobs
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="gradient-hero text-primary-foreground">
          <CardContent className="p-6">
            <Video className="h-8 w-8 mb-3" />
            <h3 className="text-xl font-bold mb-2">Upcoming interviews</h3>
            <p className="text-sm text-primary-foreground/90 mb-4">
              View your scheduled interviews and join with one click.
            </p>
            <Button variant="secondary" asChild>
              <Link to="/interviews">View interviews</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatBox({ icon: Icon, label, value, color }: any) {
  return (
    <Card>
      <CardContent className="p-6">
        <Icon className={`h-8 w-8 mb-2 ${color}`} />
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
