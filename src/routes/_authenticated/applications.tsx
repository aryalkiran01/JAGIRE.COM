/* eslint-disable @typescript-eslint/no-explicit-any */

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { SkeletonCard } from "@/components/ui/skeleton-loader";
import {
  Briefcase,
  Calendar,
  Video,
  ArrowRight,
  ExternalLink,
  Clock,
  CircleCheck as CheckCircle2,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/applications")({
  component: Applications,
});

function getStatusBadge(status: string) {
  const s = status?.toLowerCase() ?? "";
  if (s.includes("offer") || s.includes("selected") || s.includes("hired")) {
    return (
      <Badge variant="success" className="capitalize">
        {status.replace("_", " ")}
      </Badge>
    );
  }
  if (s.includes("interview")) {
    return (
      <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 capitalize">
        {status.replace("_", " ")}
      </Badge>
    );
  }
  if (s.includes("shortlisted") || s.includes("review")) {
    return (
      <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 capitalize">
        {status.replace("_", " ")}
      </Badge>
    );
  }
  if (s.includes("reject")) {
    return (
      <Badge variant="outline" className="text-muted-foreground capitalize">
        {status.replace("_", " ")}
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="capitalize">
      {status.replace("_", " ")}
    </Badge>
  );
}

function Applications() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["apps", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select(
          `
          *,
          job:jobs(
            id,
            title,
            company:companies(name)
          ),
          events:application_events(
            event_type,
            created_at,
            message
          ),
          interview:interview_events(
            id,
            title,
            start_time,
            end_time,
            meet_link
          )
          `,
        )
        .eq("applicant_id", user!.id)
        .order("applied_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      return data ?? [];
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6 max-w-5xl">
        <h1 className="text-3xl font-bold tracking-tight">My Job Applications</h1>
        <div className="grid gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Job Applications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your job application status, interview schedules, and updates.
          </p>
        </div>
        <Button asChild className="gradient-brand text-primary-foreground">
          <Link to="/jobs">
            Explore Jobs <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {data?.map((application: any) => (
          <Card
            key={application.id}
            className="hover:border-primary/40 transition-colors shadow-card-soft"
          >
            <CardContent className="p-6">
              {/* Job Information */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="font-semibold text-lg hover:text-primary transition-colors">
                    {application.job?.id ? (
                      <Link to="/jobs/$jobId" params={{ jobId: application.job.id }}>
                        {application.job?.title}
                      </Link>
                    ) : (
                      application.job?.title
                    )}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {application.job?.company?.name}
                  </p>
                </div>
                {getStatusBadge(application.status)}
              </div>

              {/* Interview Section */}
              {application.interview?.length > 0 && (
                <div className="space-y-3 mb-5">
                  {application.interview.map((interview: any) => {
                    const startTimeRaw = interview.start_time || interview.scheduled_at;
                    const startTimeMs = startTimeRaw ? new Date(startTimeRaw).getTime() : null;
                    const durationMinutes = interview.duration_minutes ?? 60;
                    const endTimeMs = startTimeMs ? startTimeMs + durationMinutes * 60_000 : null;
                    const nowMs = Date.now();
                    const isConcluded =
                      interview.status === "completed" ||
                      interview.status === "cancelled" ||
                      (endTimeMs !== null && nowMs > endTimeMs);
                    const isUpcoming = startTimeMs !== null && nowMs < startTimeMs - 15 * 60_000;
                    const isJoinable = !isConcluded && !!interview.meet_link;

                    return (
                      <div
                        key={interview.id}
                        className="rounded-xl border border-purple-500/20 p-4 bg-purple-500/5"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 font-semibold text-purple-700 dark:text-purple-300">
                            <Video className="h-4 w-4" />
                            <span>Interview Scheduled</span>
                          </div>
                          {isConcluded ? (
                            <Badge
                              variant="outline"
                              className="text-xs text-muted-foreground bg-muted/40"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" />
                              Interview Concluded
                            </Badge>
                          ) : isUpcoming ? (
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Upcoming
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-600 text-white text-xs">
                              <span className="h-1.5 w-1.5 rounded-full bg-white mr-1.5 animate-pulse" />
                              Live / Ready
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium">{interview.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {startTimeRaw ? new Date(startTimeRaw).toLocaleString() : "Date TBD"}
                        </p>
                        {isJoinable && (
                          <Button
                            size="sm"
                            className="mt-3 gradient-brand text-primary-foreground gap-1.5"
                            asChild
                          >
                            <a href={interview.meet_link} target="_blank" rel="noopener noreferrer">
                              Join Google Meet <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Application Timeline */}
              {application.events?.length > 0 && (
                <div className="border-l-2 border-primary/30 ml-2 pl-4 space-y-3 mt-4">
                  {application.events
                    .sort(
                      (a: any, b: any) =>
                        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
                    )
                    .map((event: any, index: number) => (
                      <div key={index} className="text-xs relative">
                        <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full gradient-brand" />
                        <span className="font-semibold capitalize text-foreground">
                          {event.event_type}
                        </span>
                        <span className="text-muted-foreground ml-1">
                          — {new Date(event.created_at).toLocaleDateString()}
                        </span>
                        {event.message && (
                          <p className="text-muted-foreground mt-0.5 text-xs">{event.message}</p>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {!data?.length && (
          <Card className="glass">
            <CardContent className="p-12 text-center space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Briefcase className="h-7 w-7" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">No job applications yet</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                  Start applying for open roles matched to your profile and track every stage of
                  your hiring process here.
                </p>
              </div>
              <Button asChild className="gradient-brand text-primary-foreground">
                <Link to="/jobs">
                  Browse Active Jobs <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
