import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/blog")({
  head: () => ({ meta: [{ title: "Blog — Jagire" }, { name: "description", content: "Career advice, hiring insights, and AI in recruitment." }] }),
  component: Blog,
});

function Blog() {
  const { data: posts } = useQuery({
    queryKey: ["blogs"],
    queryFn: async () => (await supabase.from("blogs").select("*").eq("published", true).order("published_at", { ascending: false })).data ?? [],
  });
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <h1 className="text-4xl font-bold mb-8">Blog</h1>
        {posts?.length ? (
          <div className="grid md:grid-cols-2 gap-6">
            {posts.map((p) => (
              <Link key={p.id} to="/blog/$slug" params={{ slug: p.slug }}>
                <Card className="hover:shadow-glow transition h-full overflow-hidden">
                  {p.cover_url && <img src={p.cover_url} alt="" className="w-full h-40 object-cover" />}
                  <CardContent className="p-6">
                    <h2 className="font-bold text-xl mb-2">{p.title}</h2>
                    {p.excerpt && <p className="text-sm text-muted-foreground mb-3">{p.excerpt}</p>}
                    <div className="flex flex-wrap gap-1">
                      {p.tags?.map((t) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card><CardContent className="p-12 text-center text-muted-foreground">No posts yet. Check back soon!</CardContent></Card>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}