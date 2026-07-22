import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Eye, Clock, Heart, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/blog/$slug")({
  head: () => ({
    meta: [
      { title: "Blog — Jagire" },
      { name: "description", content: "Read the latest articles on careers and recruitment." },
    ],
  }),
  component: BlogPost,
});

type BlogComment = {
  id: string;
  blog_id: string;
  author_id: string;
  content: string | null;
  created_at: string | null;
  author: { id: string; full_name: string | null; avatar_url: string | null } | null;
};

type RelatedBlog = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_url: string | null;
};

function BlogPost() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [comment, setComment] = useState("");

  const { data: post } = useQuery({
    queryKey: ["blog", slug],
    queryFn: async () =>
      (
        await supabase
          .from("blogs")
          .select("*")
          .eq("slug", slug)
          .eq("published", true)
          .maybeSingle()
      ).data,
  });

  const { data: related = [] } = useQuery<RelatedBlog[]>({
    queryKey: ["blog-related", slug, post?.category],
    enabled: !!post?.category,
    queryFn: async (): Promise<RelatedBlog[]> =>
      (
        await supabase
          .from("blogs")
          .select("id, title, slug, excerpt, cover_url")
          .eq("published", true)
          .eq("category", post!.category!)
          .neq("slug", slug)
          .limit(3)
      ).data ?? [],
  });

  const { data: comments = [] } = useQuery<BlogComment[]>({
    queryKey: ["blog-comments", slug],
    enabled: !!post,
    queryFn: async (): Promise<BlogComment[]> => {
      const { data } = await supabase
        .from("blog_comments")
        .select("id, blog_id, author_id, content, created_at")
        .eq("blog_id", post!.id)
        .order("created_at", { ascending: false });

      return (data ?? []).map((comment: any) => ({ ...comment, author: null }));
    },
  });

  // Increment view count once per mount
  useEffect(() => {
    if (!post) return;
    supabase
      .from("blogs")
      .update({ views_count: (post.views_count ?? 0) + 1 })
      .eq("id", post.id)
      .then(() => qc.invalidateQueries({ queryKey: ["blog", slug] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id]);

  async function addComment() {
    if (!user || !post || !comment.trim()) return;
    const { error } = await supabase
      .from("blog_comments")
      .insert({ blog_id: post.id, author_id: user.id, content: comment.trim() });
    if (error) return toast.error(error.message);
    setComment("");
    toast.success("Comment added");
    qc.invalidateQueries({ queryKey: ["blog-comments", slug] });
  }

  async function deleteComment(id: string) {
    if (!confirm("Delete this comment?")) return;
    const { error } = await supabase.from("blog_comments").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Comment deleted");
    qc.invalidateQueries({ queryKey: ["blog-comments", slug] });
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <article className="container mx-auto px-4 py-12 max-w-3xl">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to blog
          </Link>
        </Button>
        {post ? (
          <>
            {post.cover_url && (
              <img
                src={post.cover_url}
                alt=""
                className="w-full h-64 object-cover rounded-xl mb-6"
              />
            )}
            {post.category && (
              <Badge variant="secondary" className="mb-3">
                {post.category}
              </Badge>
            )}
            <h1 className="text-4xl font-bold mb-3">{post.title}</h1>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-8">
              {post.published_at && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(post.published_at))} ago
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {post.views_count ?? 0} views
              </span>
            </div>
            {post.excerpt && <p className="text-lg text-muted-foreground mb-6">{post.excerpt}</p>}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{post.content}</p>
            </div>
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-6">
                {post.tags.map((t: string) => (
                  <Badge key={t} variant="outline">
                    {t}
                  </Badge>
                ))}
              </div>
            )}

            {/* Comments */}
            <div className="mt-10 space-y-4">
              <h2 className="text-xl font-bold">Comments ({comments?.length ?? 0})</h2>
              {user ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a comment…"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addComment()}
                  />
                  <Button size="icon" onClick={addComment} disabled={!comment.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  <Link to="/auth" search={{ mode: "signin" }} className="text-primary">
                    Sign in
                  </Link>{" "}
                  to comment.
                </p>
              )}
              <div className="space-y-3">
                {comments?.map((c) => (
                  <div key={c.id} className="flex gap-2 items-start">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={c.author?.avatar_url ?? undefined} />
                      <AvatarFallback>{(c.author?.full_name ?? "?").slice(0, 1)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="bg-muted rounded-lg px-3 py-2">
                        <div className="font-medium text-xs">
                          {c.author?.full_name ?? "Anonymous"}
                        </div>
                        <div className="text-sm">{c.content}</div>
                      </div>
                      <div className="flex items-center gap-3 mt-1 ml-2">
                        <span className="text-xs text-muted-foreground">
                          {c.created_at && formatDistanceToNow(new Date(c.created_at))} ago
                        </span>
                        {user?.id === c.author_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-destructive"
                            onClick={() => deleteComment(c.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" /> Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {!comments?.length && (
                  <p className="text-sm text-muted-foreground">No comments yet.</p>
                )}
              </div>
            </div>

            {/* Related */}
            {related && related.length > 0 && (
              <div className="mt-10">
                <h2 className="text-xl font-bold mb-4">Related articles</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  {related.map((r) => (
                    <Link key={r.id} to="/blog/$slug" params={{ slug: r.slug }}>
                      <Card className="hover:shadow-glow transition h-full">
                        {r.cover_url && (
                          <img
                            src={r.cover_url}
                            alt=""
                            className="w-full h-24 object-cover rounded-t-lg"
                          />
                        )}
                        <CardContent className="p-4">
                          <div className="font-medium text-sm">{r.title}</div>
                          {r.excerpt && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {r.excerpt}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              Post not found.
            </CardContent>
          </Card>
        )}
      </article>
      <SiteFooter />
    </div>
  );
}
