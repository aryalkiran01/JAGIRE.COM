import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/blog/$slug")({ component: BlogPost });

function BlogPost() {
  const { slug } = Route.useParams();
  const { data: post } = useQuery({
    queryKey: ["blog", slug],
    queryFn: async () => (await supabase.from("blogs").select("*").eq("slug", slug).eq("published", true).maybeSingle()).data,
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <article className="container mx-auto px-4 py-12 max-w-3xl">
        <Button variant="ghost" size="sm" asChild className="mb-4"><Link to="/blog"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
        {post ? (
          <>
            {post.cover_url && <img src={post.cover_url} alt="" className="w-full h-64 object-cover rounded-xl mb-6" />}
            <h1 className="text-4xl font-bold mb-3">{post.title}</h1>
            <div className="flex flex-wrap gap-1 mb-6">
              {post.tags?.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
            </div>
            <div className="text-xs text-muted-foreground mb-8">
              {post.published_at && new Date(post.published_at).toLocaleDateString()}
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{post.content}</p>
            </div>
          </>
        ) : (
          <Card><CardContent className="p-12 text-center text-muted-foreground">Post not found.</CardContent></Card>
        )}
      </article>
      <SiteFooter />
    </div>
  );
}