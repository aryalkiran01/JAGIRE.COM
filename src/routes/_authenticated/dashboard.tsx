/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton-loader";
import {
  Briefcase,
  FileText,
  Bookmark,
  Sparkles,
  TrendingUp,
  Video,
  ArrowRight,
  CheckCircle2,
  Clock,
  Target,
  Award,
  Calendar,
  Building2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { JOBSEEKER_AI_GROUPS } from "@/lib/jobseeker-ai-features";

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

const STATUS_ORDER = ["applied", "viewed", "shortlisted", "interview", "selected", "rejected"];

function Dashboard() {
  const { user } = useAuth();

  const { data: apps, isLoading: appsLoading } = useQuery({
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

  const { data: saved, isLoading: savedLoading } = useQuery({
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

  const { data: resume, isLoading: resumeLoading } = useQuery({
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

  const { data: interviews } = useQuery({
    queryKey: ["my-interviews", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (
        await supabase
          .from("interviews")
          .select("*, job:jobs(title, company:companies(name))")
          .eq("candidate_id", user!.id)
          .eq("status", "scheduled")
          .order("scheduled_at", { ascending: true })
          .limit(5)
      ).data ?? [],
  });

  const { data: notifications } = useQuery({
    queryKey: ["recent-notifs", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (
        await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(5)
      ).data ?? [],
  });

  const stats = {
    applications: apps?.length ?? 0,
    saved: saved?.length ?? 0,
    interviews: apps?.filter((a) => a.status === "interview").length ?? 0,
    offers: apps?.filter((a) => a.status === "selected").length ?? 0,
  };

  const statusBreakdown = STATUS_ORDER.map((s) => ({
    status: s,
    count: apps?.filter((a) => a.status === s).length ?? 0,
  })).filter((s) => s.count > 0);

  const isLoading = appsLoading || savedLoading || resumeLoading;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground">Here's your career at a glance</p>
        </div>
        <Button className="gradient-brand text-primary-foreground" asChild>
          <Link to="/jobs">
            <Briefcase className="mr-2 h-4 w-4" /> Browse Jobs
          </Link>
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-8 rounded-lg mb-3" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard
              icon={FileText}
              label="Applications"
              value={stats.applications}
              color="text-blue-500"
              bg="bg-blue-500/10"
              to="/applications"
            />
            <StatCard
              icon={Bookmark}
              label="Saved Jobs"
              value={stats.saved}
              color="text-amber-500"
              bg="bg-amber-500/10"
              to="/saved"
            />
            <StatCard
              icon={Video}
              label="Interviews"
              value={stats.interviews}
              color="text-orange-500"
              bg="bg-orange-500/10"
              to="/interviews"
            />
            <StatCard
              icon={Award}
              label="Offers"
              value={stats.offers}
              color="text-green-500"
              bg="bg-green-500/10"
              to="/applications"
            />
          </>
        )}
      </div>

      {/* Resume score widget */}
      {resumeLoading ? (
        <SkeletonCard />
      ) : resume ? (
        <Card className="glass hover:shadow-card-soft transition-all animate-fade-in-up">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl gradient-brand flex items-center justify-center shadow-glow">
                  <Sparkles className="h-8 w-8 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Resume Score</h3>
                  <p className="text-sm text-muted-foreground">{resume.file_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div
                    className={`text-4xl font-bold ${
                      (resume.overall_score ?? 0) >= 80
                        ? "text-green-500"
                        : (resume.overall_score ?? 0) >= 60
                          ? "text-amber-500"
                          : "text-red-500"
                    }`}
                  >
                    {resume.overall_score ?? "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">out of 100</div>
                </div>
                <Button variant="outline" asChild>
                  <Link to="/resume-scanner">
                    Improve <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
            {resume.overall_score != null && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t">
                {[
                  { label: "ATS", value: resume.ats_score },
                  { label: "Keywords", value: resume.keyword_score },
                  { label: "Grammar", value: resume.grammar_score },
                  { label: "Format", value: resume.formatting_score },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{s.label}</span>
                      <span className="font-medium">{s.value ?? 0}</span>
                    </div>
                    <Progress value={s.value ?? 0} className="h-1.5" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="glass hover:shadow-card-soft transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Upload your resume</h3>
                  <p className="text-sm text-muted-foreground">
                    Get instant AI scoring and career roadmap
                  </p>
                </div>
              </div>
              <Button className="gradient-brand text-primary-foreground" asChild>
                <Link to="/resume-scanner">
                  <Sparkles className="mr-2 h-4 w-4" /> Scan Resume
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent applications */}
        <Card className="lg:col-span-2 glass hover:shadow-card-soft transition-all">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" /> Recent Applications
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/applications">
                View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {appsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : apps?.length ? (
              <div className="space-y-2">
                {apps.slice(0, 5).map((a: any) => (
                  <Link
                    key={a.id}
                    to="/jobs/$jobId"
                    params={{ jobId: a.job?.id ?? "" }}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                        {a.job?.company?.logo_url ? (
                          <img
                            src={a.job.company.logo_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate group-hover:gradient-text transition-all">
                          {a.job?.title}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {a.job?.company?.name}
                        </div>
                      </div>
                    </div>
                    <Badge className={`${STATUS_COLORS[a.status]} text-white shrink-0`}>
                      {a.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Briefcase className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground mb-3">No applications yet</p>
                <Button variant="outline" asChild>
                  <Link to="/jobs">Browse jobs</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Application funnel */}
        <Card className="glass hover:shadow-card-soft transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" /> Application Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusBreakdown.length > 0 ? (
              <div className="space-y-3">
                {statusBreakdown.map((s) => {
                  const pct = stats.applications > 0 ? (s.count / stats.applications) * 100 : 0;
                  return (
                    <div key={s.status}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize">{s.status}</span>
                        <span className="font-medium">{s.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${STATUS_COLORS[s.status]} transition-all duration-700`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No applications to analyze yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming interviews */}
        <Card className="glass hover:shadow-card-soft transition-all">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" /> Upcoming Interviews
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/interviews">
                View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {interviews?.length ? (
              <div className="space-y-3">
                {interviews.map((iv: any) => (
                  <div
                    key={iv.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-lg gradient-brand flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{iv.title}</div>
                      <div className="text-sm text-muted-foreground">{iv.job?.company?.name}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(iv.scheduled_at).toLocaleString()}
                      </div>
                    </div>
                    {iv.meet_link && (
                      <Badge variant="secondary" className="shrink-0">
                        <Video className="mr-1 h-3 w-3" /> Meet
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Video className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">No upcoming interviews</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="glass hover:shadow-card-soft transition-all">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" /> Recent Activity
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/notifications">
                View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {notifications?.length ? (
              <div className="space-y-3">
                {notifications.map((n: any) => (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                        n.is_read ? "bg-muted" : "gradient-brand"
                      }`}
                    >
                      <CheckCircle2
                        className={`h-4 w-4 ${n.is_read ? "text-muted-foreground" : "text-primary-foreground"}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{n.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2">{n.message}</div>
                      <div className="text-xs text-muted-foreground/70 mt-0.5">
                        {formatDistanceToNow(new Date(n.created_at))} ago
                      </div>
                    </div>
                    {!n.is_read && (
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Zap className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Tools */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">AI Tools</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {JOBSEEKER_AI_GROUPS.flatMap((g) => g.items)
            .slice(0, 10)
            .map((f) => (
              <Link key={f.slug} to="/ai/$featureSlug" params={{ featureSlug: f.slug }}>
                <Card className="glass hover:shadow-card-soft hover:-translate-y-0.5 transition-all group cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <f.icon className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <div className="text-sm font-semibold leading-tight">{f.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {f.description}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickAction icon={Sparkles} label="Scan Resume" to="/resume-scanner" />
        <QuickAction icon={FileText} label="Build Resume" to="/resume-builder" />
        <QuickAction icon={Video} label="Interview Prep" to="/interviews" />
        <QuickAction icon={TrendingUp} label="Community Feed" to="/feed" />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
  to,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  color: string;
  bg: string;
  to: string;
}) {
  return (
    <Link to={to}>
      <Card className="glass hover:shadow-glow hover:-translate-y-1 transition-all group cursor-pointer">
        <CardContent className="p-5">
          <div
            className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
          >
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div className="text-3xl font-bold">{value}</div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </CardContent>
      </Card>
    </Link>
  );
}

function QuickAction({ icon: Icon, label, to }: { icon: LucideIcon; label: string; to: string }) {
  return (
    <Link to={to}>
      <Card className="glass hover:shadow-card-soft hover:-translate-y-0.5 transition-all group cursor-pointer">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center group-hover:scale-110 transition-transform">
            <Icon className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-sm font-medium">{label}</span>
        </CardContent>
      </Card>
    </Link>
  );
}
