import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Building2 } from "lucide-react";

export const Route = createFileRoute("/companies/")({ component: Companies });

function Companies() {
  const { data } = useQuery({
    queryKey: ["companies-list"],
    queryFn: async () => (await supabase.from("companies").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6">Companies hiring</h1>
        {data?.length ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((c) => (
              <Link key={c.id} to="/companies/$slug" params={{ slug: c.slug }}>
                <Card className="hover:shadow-glow transition-all h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                        {c.logo_url ? <img src={c.logo_url} alt="" className="h-full w-full object-cover" /> : <Building2 className="h-6 w-6" />}
                      </div>
                      <div>
                        <div className="font-semibold">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.industry ?? "Company"}</div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{c.tagline ?? c.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : <Card><CardContent className="p-12 text-center text-muted-foreground">No companies yet.</CardContent></Card>}
      </div>
      <SiteFooter />
    </div>
  );
}