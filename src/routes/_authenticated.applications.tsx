import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/applications")({
  component: Applications,
});

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
    return <div className="container mx-auto px-4 py-8">Loading applications...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My applications</h1>

      <div className="grid gap-4">
        {data?.map((application: any) => (
          <Card key={application.id}>
            <CardContent className="p-6">
              {/* Job Information */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-lg">{application.job?.title}</h2>

                  <p className="text-sm text-muted-foreground">{application.job?.company?.name}</p>
                </div>

                <Badge>{application.status}</Badge>
              </div>

              {/* Interview Section */}
              {application.interview?.length > 0 && (
                <div className="space-y-3 mb-5">
                  {application.interview.map((interview: any) => (
                    <div key={interview.id} className="rounded-lg border p-4 bg-muted/30">
                      <h3 className="font-semibold mb-2">🎤 Interview Scheduled</h3>

                      <p className="text-sm">{interview.title}</p>

                      <p className="text-sm text-muted-foreground">
                        {new Date(interview.start_time).toLocaleString()}
                      </p>

                      {interview.meet_link && (
                        <Button className="mt-3" asChild>
                          <a href={interview.meet_link} target="_blank" rel="noopener noreferrer">
                            Join Interview
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Application Timeline */}
              {application.events?.length > 0 && (
                <div className="border-l-2 border-muted ml-2 pl-4 space-y-3">
                  {application.events
                    .sort(
                      (a: any, b: any) =>
                        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
                    )
                    .map((event: any, index: number) => (
                      <div key={index} className="text-xs relative">
                        <div
                          className="
                          absolute 
                          -left-[21px]
                          top-1
                          h-3
                          w-3
                          rounded-full
                          gradient-brand
                          "
                        />

                        <span className="font-medium capitalize">{event.event_type}</span>

                        <span className="text-muted-foreground">
                          {" "}
                          — {new Date(event.created_at).toLocaleDateString()}
                        </span>

                        {event.message && (
                          <p className="text-muted-foreground mt-1">{event.message}</p>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {!data?.length && (
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
