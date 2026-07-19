import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Bookmark, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/feed")({ component: FeedPage });

function FeedPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});

  const { data: posts, isLoading } = useQuery({
    queryKey: ["feed"],
    queryFn: async () => {
      const { data } = await supabase
        .from("posts" as any)
        .select("*, author:profiles!posts_author_id_fkey(id, full_name, avatar_url, headline)")
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  const { data: likedIds } = useQuery({
    queryKey: ["feed-likes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("post_likes" as any).select("post_id").eq("user_id", user!.id);
      return new Set((data ?? []).map((r: any) => r.post_id));
    },
  });

  useEffect(() => {
    const ch = supabase.channel("feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => qc.invalidateQueries({ queryKey: ["feed"] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "post_likes" }, () => qc.invalidateQueries({ queryKey: ["feed"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const createPost = useMutation({
    mutationFn: async () => {
      if (!content.trim()) throw new Error("Write something first");
      const { error } = await supabase.from("posts" as any).insert({ author_id: user!.id, content: content.trim(), image_url: imageUrl || null });
      if (error) throw error;
    },
    onSuccess: () => { setContent(""); setImageUrl(""); toast.success("Posted"); qc.invalidateQueries({ queryKey: ["feed"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  async function toggleLike(postId: string, liked: boolean) {
    if (liked) await supabase.from("post_likes" as any).delete().eq("post_id", postId).eq("user_id", user!.id);
    else await supabase.from("post_likes" as any).insert({ post_id: postId, user_id: user!.id });
    qc.invalidateQueries({ queryKey: ["feed"] });
    qc.invalidateQueries({ queryKey: ["feed-likes"] });
  }
  async function toggleSave(postId: string) {
    const { data: existing } = await supabase.from("post_saves" as any).select("post_id").eq("post_id", postId).eq("user_id", user!.id).maybeSingle();
    if (existing) await supabase.from("post_saves" as any).delete().eq("post_id", postId).eq("user_id", user!.id);
    else await supabase.from("post_saves" as any).insert({ post_id: postId, user_id: user!.id });
    toast.success(existing ? "Removed from saved" : "Saved");
  }
  async function addComment(postId: string) {
    const text = (commentDraft[postId] ?? "").trim();
    if (!text) return;
    await supabase.from("post_comments" as any).insert({ post_id: postId, author_id: user!.id, content: text });
    setCommentDraft((d) => ({ ...d, [postId]: "" }));
    qc.invalidateQueries({ queryKey: ["feed"] });
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold">Feed</h1>
      <Card>
        <CardContent className="p-4 space-y-3">
          <Textarea rows={3} placeholder="Share an update, insight, or achievement…" value={content} onChange={(e) => setContent(e.target.value)} />
          <Input placeholder="Optional image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          <div className="flex justify-end">
            <Button className="gradient-brand text-primary-foreground" onClick={() => createPost.mutate()} disabled={createPost.isPending}>
              {createPost.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && <div className="text-center text-muted-foreground">Loading…</div>}
      {posts?.map((p: any) => {
        const liked = likedIds?.has(p.id);
        return (
          <Card key={p.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Avatar className="h-10 w-10"><AvatarImage src={p.author?.avatar_url} /><AvatarFallback>{(p.author?.full_name ?? "?").slice(0,1)}</AvatarFallback></Avatar>
                <div>
                  <div className="font-medium text-sm">{p.author?.full_name ?? "Anonymous"}</div>
                  <div className="text-xs text-muted-foreground">{p.author?.headline ?? ""} · {formatDistanceToNow(new Date(p.created_at))} ago</div>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm">{p.content}</p>
              {p.image_url && <img src={p.image_url} alt="" className="w-full rounded-lg" />}
              <div className="flex items-center gap-1 border-t pt-2">
                <Button variant="ghost" size="sm" onClick={() => toggleLike(p.id, !!liked)}>
                  <Heart className={`h-4 w-4 mr-1 ${liked ? "fill-red-500 text-red-500" : ""}`} /> {p.likes_count ?? 0}
                </Button>
                <Button variant="ghost" size="sm"><MessageCircle className="h-4 w-4 mr-1" /> {p.comments_count ?? 0}</Button>
                <Button variant="ghost" size="sm" onClick={() => toggleSave(p.id)}><Bookmark className="h-4 w-4" /></Button>
              </div>
              <div className="flex gap-2">
                <Input placeholder="Write a comment…" value={commentDraft[p.id] ?? ""} onChange={(e) => setCommentDraft((d) => ({ ...d, [p.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addComment(p.id)} />
                <Button size="icon" variant="ghost" onClick={() => addComment(p.id)}><Send className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}