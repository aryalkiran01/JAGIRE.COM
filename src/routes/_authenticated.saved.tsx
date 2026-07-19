import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Building2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/saved")({ component: Saved });

function Saved() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["saved", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("saved_jobs").select("job:jobs(*, company:companies(name, logo_url))").eq("user_id", user!.id)).data ?? [],
  });
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Saved jobs</h1>
      {data?.length ? (
        <div className="grid gap-3">
          {data.map((s: any) => s.job && (
            <Link key={s.job.id} to="/jobs/$jobId" params={{ jobId: s.job.id }}>
              <Card className="hover:shadow-glow"><CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                  {s.job.company?.logo_url ? <img src={s.job.company.logo_url} className="h-full w-full object-cover" alt="" /> : <Building2 className="h-5 w-5" />}
                </div>
                <div><div className="font-medium">{s.job.title}</div><div className="text-sm text-muted-foreground">{s.job.company?.name}</div></div>
              </CardContent></Card>
            </Link>
          ))}
        </div>
      ) : <Card><CardContent className="p-12 text-center text-muted-foreground">No saved jobs yet.</CardContent></Card>}
    </div>
  );
}