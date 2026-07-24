import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Sparkles, Clock, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Blog — Jagire" },
      { name: "description", content: "Career advice, hiring insights, and AI in recruitment." },
    ],
  }),
  component: Blog,
});

const PAGE_SIZE = 6;

function Blog() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [page, setPage] = useState(0);

  const { data: posts } = useQuery({
    queryKey: ["blogs"],
    queryFn: async () =>
      (
        await supabase
          .from("blogs")
          .select(
            "id, title, slug, excerpt, cover_url, cover_image, category, tags, published_at, views_count, author_id",
          )
          .eq("published", true)
          .order("published_at", { ascending: false })
      ).data ?? [],
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
    posts?.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["all", ...Array.from(set)];
  }, [posts]);

  const filtered = useMemo(() => {
    return (posts ?? []).filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.title?.toLowerCase().includes(q) ||
          p.excerpt?.toLowerCase().includes(q) ||
          p.tags?.some((t: string) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [posts, search, category]);

  const featured = filtered[0];
  const recent = filtered.slice(1);
  const paged = recent.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const totalPages = Math.ceil(recent.length / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Blog</h1>
          <p className="text-muted-foreground">
            Career advice, hiring insights, and AI in recruitment.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((c) => (
              <Button
                key={c}
                variant={category === c ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setCategory(c);
                  setPage(0);
                }}
              >
                {c === "all" ? "All" : c}
              </Button>
            ))}
          </div>
        </div>

        {filtered.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              No posts found. Try a different search or category.
            </CardContent>
          </Card>
        )}

        {featured && page === 0 && !search && category === "all" && (
          <Link to="/blog/$slug" params={{ slug: featured.slug }} className="block mb-8">
            <Card className="hover:shadow-glow transition overflow-hidden">
              {featured.cover_url && (
                <img src={featured.cover_url} alt="" className="w-full h-64 object-cover" />
              )}
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="gradient-brand text-primary-foreground">
                    <Sparkles className="h-3 w-3 mr-1" /> Featured
                  </Badge>
                  {featured.category && <Badge variant="secondary">{featured.category}</Badge>}
                </div>
                <h2 className="font-bold text-2xl mb-2">{featured.title}</h2>
                {featured.excerpt && (
                  <p className="text-muted-foreground mb-3">{featured.excerpt}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {featured.published_at
                      ? formatDistanceToNow(new Date(featured.published_at)) + " ago"
                      : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {featured.views_count ?? 0} views
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {paged.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            {paged.map((p) => (
              <Link key={p.id} to="/blog/$slug" params={{ slug: p.slug }}>
                <Card className="hover:shadow-glow transition h-full overflow-hidden">
                  {p.cover_url && (
                    <img src={p.cover_url} alt="" className="w-full h-40 object-cover" />
                  )}
                  <CardContent className="p-6">
                    {p.category && (
                      <Badge variant="secondary" className="mb-2">
                        {p.category}
                      </Badge>
                    )}
                    <h2 className="font-bold text-xl mb-2">{p.title}</h2>
                    {p.excerpt && <p className="text-sm text-muted-foreground mb-3">{p.excerpt}</p>}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {p.tags?.slice(0, 3).map((t: string) => (
                        <Badge key={t} variant="outline" className="text-xs">
                          {t}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {p.published_at
                          ? formatDistanceToNow(new Date(p.published_at)) + " ago"
                          : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {p.views_count ?? 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <span className="text-sm self-center">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
