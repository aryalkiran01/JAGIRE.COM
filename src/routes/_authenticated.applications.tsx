import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/applications")({ component: Applications });

function Applications() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["apps", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (
        await supabase
          .from("applications")
          .select(
            "*, job:jobs(id, title, company:companies(name)), events:application_events(status, created_at, note)",
          )
          .eq("applicant_id", user!.id)
          .order("applied_at", { ascending: false })
      ).data ?? [],
  });
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My applications</h1>
      <div className="grid gap-4">
        {data?.map((a: any) => (
          <Card key={a.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold text-lg">{a.job?.title}</div>
                  <div className="text-sm text-muted-foreground">{a.job?.company?.name}</div>
                </div>
                <Badge>{a.status}</Badge>
              </div>
              {a.events?.length > 0 && (
                <div className="border-l-2 border-muted ml-2 pl-4 space-y-2 mt-4">
                  {a.events
                    .sort(
                      (x: any, y: any) =>
                        new Date(x.created_at).getTime() - new Date(y.created_at).getTime(),
                    )
                    .map((e: any, i: number) => (
                      <div key={i} className="text-xs relative">
                        <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full gradient-brand" />
                        <span className="font-medium capitalize">{e.status}</span>{" "}
                        <span className="text-muted-foreground">
                          — {new Date(e.created_at).toLocaleDateString()}
                        </span>
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
