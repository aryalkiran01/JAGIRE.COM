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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Heart, MessageCircle, Bookmark, Send, Loader as Loader2, Share2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/feed")({ component: FeedPage });

type CommentRow = {
  id: string;
  post_id: string;
  author_id: string;
  content: string | null;
  body: string | null;
  created_at: string | null;
  likes_count: number | null;
  author: { id: string; full_name: string | null; avatar_url: string | null } | null;
};

type PostRow = {
  id: string;
  author_id: string;
  content: string | null;
  body: string | null;
  image_url: string | null;
  likes_count: number | null;
  comments_count: number | null;
  created_at: string | null;
  updated_at: string | null;
  author: { id: string; full_name: string | null; avatar_url: string | null; headline: string | null } | null;
  comments: CommentRow[];
};

function FeedPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  const { data: posts, isLoading } = useQuery<PostRow[]>({
    queryKey: ["feed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(
          "id, author_id, content, body, image_url, likes_count, comments_count, created_at, updated_at, author:profiles!posts_author_id_fkey(id, full_name, avatar_url, headline)",
        )
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      const postList = data ?? [];
      if (postList.length === 0) return [];

      const postIds = postList.map((p) => p.id);
      const { data: comments } = await supabase
        .from("post_comments")
        .select(
          "id, post_id, author_id, content, body, created_at, likes_count, author:profiles!post_comments_author_id_fkey(id, full_name, avatar_url)",
        )
        .in("post_id", postIds)
        .order("created_at", { ascending: true });

      const commentMap = new Map<string, CommentRow[]>();
      for (const c of comments ?? []) {
        const arr = commentMap.get(c.post_id) ?? [];
        arr.push(c as unknown as CommentRow);
        commentMap.set(c.post_id, arr);
      }
      return postList.map((p) => ({
        ...(p as unknown as PostRow),
        comments: commentMap.get(p.id) ?? [],
      }));
    },
  });

  const { data: likedIds } = useQuery({
    queryKey: ["feed-likes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user!.id);
      return new Set((data ?? []).map((r) => r.post_id));
    },
  });

  const { data: likedCommentIds } = useQuery({
    queryKey: ["feed-comment-likes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("comment_likes")
        .select("comment_id")
        .eq("user_id", user!.id);
      return new Set((data ?? []).map((r) => r.comment_id));
    },
  });

  const { data: savedIds } = useQuery({
    queryKey: ["feed-saves", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("post_saves")
        .select("post_id")
        .eq("user_id", user!.id);
      return new Set((data ?? []).map((r) => r.post_id));
    },
  });

  // Realtime: posts, comments, likes, comment_likes
  useEffect(() => {
    const ch = supabase
      .channel("feed-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, (payload) => {
        qc.invalidateQueries({ queryKey: ["feed"] });
        if (payload.eventType === "DELETE") {
          const deleted = payload.old as { id: string };
          deleteAssociatedMediaAndNotifications(deleted.id).catch(() => {});
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "post_comments" }, () =>
        qc.invalidateQueries({ queryKey: ["feed"] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "post_likes" }, () => {
        qc.invalidateQueries({ queryKey: ["feed"] });
        qc.invalidateQueries({ queryKey: ["feed-likes"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "comment_likes" }, () => {
        qc.invalidateQueries({ queryKey: ["feed"] });
        qc.invalidateQueries({ queryKey: ["feed-comment-likes"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  async function deleteAssociatedMediaAndNotifications(postId: string) {
    // Delete notifications referencing this post
    await supabase
      .from("notifications")
      .delete()
      .eq("data->>post_id", postId);
  }

  const createPost = useMutation({
    mutationFn: async () => {
      if (!content.trim()) throw new Error("Write something first");
      const { error } = await supabase
        .from("posts")
        .insert({ author_id: user!.id, content: content.trim(), image_url: imageUrl || null });
      if (error) throw error;
    },
    onSuccess: () => {
      setContent("");
      setImageUrl("");
      toast.success("Posted");
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (e) => toast.error(e.message),
  });

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5MB");
    setUploading(true);
    try {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const up = await supabase.storage.from("posts").upload(path, file, { upsert: false });
      if (up.error) throw up.error;
      const { data } = await supabase.storage
        .from("posts")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      setImageUrl(data?.signedUrl ?? "");
      toast.success("Image attached");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function toggleLike(postId: string, liked: boolean) {
    if (liked)
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user!.id);
    else
      await supabase
        .from("post_likes")
        .insert({ post_id: postId, user_id: user!.id });
    qc.invalidateQueries({ queryKey: ["feed"] });
    qc.invalidateQueries({ queryKey: ["feed-likes"] });
  }

  async function toggleSave(postId: string) {
    const isSaved = savedIds?.has(postId);
    if (isSaved)
      await supabase
        .from("post_saves")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user!.id);
    else
      await supabase
        .from("post_saves")
        .insert({ post_id: postId, user_id: user!.id });
    toast.success(isSaved ? "Removed from saved" : "Saved");
    qc.invalidateQueries({ queryKey: ["feed-saves"] });
  }

  async function addComment(postId: string) {
    const text = (commentDraft[postId] ?? "").trim();
    if (!text) return;
    const { error } = await supabase
      .from("post_comments")
      .insert({ post_id: postId, author_id: user!.id, content: text });
    if (error) {
      toast.error(error.message);
      return;
    }
    setCommentDraft((d) => ({ ...d, [postId]: "" }));
    qc.invalidateQueries({ queryKey: ["feed"] });
  }

  async function toggleCommentLike(commentId: string, liked: boolean) {
    if (liked)
      await supabase
        .from("comment_likes")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", user!.id);
    else
      await supabase
        .from("comment_likes")
        .insert({ comment_id: commentId, user_id: user!.id });
    qc.invalidateQueries({ queryKey: ["feed"] });
    qc.invalidateQueries({ queryKey: ["feed-comment-likes"] });
  }

  async function saveEditPost(postId: string) {
    if (!editContent.trim()) return;
    const { error } = await supabase
      .from("posts")
      .update({ content: editContent.trim(), updated_at: new Date().toISOString() })
      .eq("id", postId);
    if (error) {
      toast.error(error.message);
      return;
    }
    setEditingPost(null);
    setEditContent("");
    toast.success("Post updated");
    qc.invalidateQueries({ queryKey: ["feed"] });
  }

  async function deletePost(postId: string) {
    // Get image path to delete from storage
    const post = posts?.find((p) => p.id === postId);
    if (post?.image_url) {
      try {
        const url = new URL(post.image_url);
        const pathStart = url.pathname.indexOf("/posts/");
        if (pathStart !== -1) {
          const storagePath = url.pathname.slice(pathStart + 7);
          await supabase.storage.from("posts").remove([storagePath]);
        }
      } catch {}
    }
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Post deleted");
    setDeletePostId(null);
    qc.invalidateQueries({ queryKey: ["feed"] });
  }

  async function editComment(commentId: string, currentText: string) {
    const newText = window.prompt("Edit comment", currentText);
    if (newText === null || newText.trim() === currentText) return;
    const { error } = await supabase
      .from("post_comments")
      .update({ content: newText.trim() })
      .eq("id", commentId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Comment updated");
    qc.invalidateQueries({ queryKey: ["feed"] });
  }

  async function deleteComment(commentId: string) {
    if (!window.confirm("Delete this comment?")) return;
    const { error } = await supabase.from("post_comments").delete().eq("id", commentId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Comment deleted");
    qc.invalidateQueries({ queryKey: ["feed"] });
  }

  function toggleComments(postId: string) {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold">Feed</h1>
      <Card>
        <CardContent className="p-4 space-y-3">
          <Textarea
            rows={3}
            placeholder="Share an update, insight, or achievement…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex gap-2 items-center">
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="text-xs"
            />
            {imageUrl && (
              <span className="text-xs text-muted-foreground truncate">✓ image attached</span>
            )}
          </div>
          <div className="flex justify-end">
            <Button
              className="gradient-brand text-primary-foreground"
              onClick={() => createPost.mutate()}
              disabled={createPost.isPending}
            >
              {createPost.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3 animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="space-y-1">
                    <div className="h-3 w-24 bg-muted rounded" />
                    <div className="h-2 w-16 bg-muted rounded" />
                  </div>
                </div>
                <div className="h-4 w-full bg-muted rounded" />
                <div className="h-4 w-2/3 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && posts?.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            No posts yet. Be the first to share something!
          </CardContent>
        </Card>
      )}

      {posts?.map((p) => {
        const liked = likedIds?.has(p.id);
        const saved = savedIds?.has(p.id);
        const isAuthor = user?.id === p.author_id;
        const showComments = expandedComments.has(p.id) || (p.comments?.length ?? 0) <= 2;
        const visibleComments = showComments ? p.comments : p.comments.slice(-2);
        return (
          <Card key={p.id} id={`post-${p.id}`}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={p.author?.avatar_url ?? undefined} />
                  <AvatarFallback>{(p.author?.full_name ?? "?").slice(0, 1)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{p.author?.full_name ?? "Anonymous"}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.author?.headline ?? ""} · {formatDistanceToNow(new Date(p.created_at!))} ago
                    {p.updated_at && p.updated_at !== p.created_at && " · edited"}
                  </div>
                </div>
                {isAuthor && editingPost !== p.id && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setEditingPost(p.id);
                        setEditContent(p.content ?? p.body ?? "");
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setDeletePostId(p.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              {editingPost === p.id ? (
                <div className="space-y-2">
                  <Textarea
                    rows={3}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingPost(null);
                        setEditContent("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => saveEditPost(p.id)}>
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-sm">{p.content ?? p.body}</p>
              )}

              {p.image_url && (
                <img src={p.image_url} alt="" className="w-full rounded-lg" />
              )}

              <div className="flex items-center gap-1 border-t pt-2">
                <Button variant="ghost" size="sm" onClick={() => toggleLike(p.id, !!liked)}>
                  <Heart
                    className={`h-4 w-4 mr-1 ${liked ? "fill-red-500 text-red-500" : ""}`}
                  />{" "}
                  {p.likes_count ?? 0}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggleComments(p.id)}>
                  <MessageCircle className="h-4 w-4 mr-1" /> {p.comments_count ?? 0}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggleSave(p.id)}>
                  <Bookmark
                    className={`h-4 w-4 ${saved ? "fill-primary text-primary" : ""}`}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    const url = `${window.location.origin}/feed#post-${p.id}`;
                    try {
                      if (navigator.share) await navigator.share({ title: "Jagire post", url });
                      else {
                        await navigator.clipboard.writeText(url);
                        toast.success("Link copied");
                      }
                    } catch {}
                  }}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Comments section */}
              <div className="space-y-2">
                {p.comments.length > 2 && !showComments && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={() => toggleComments(p.id)}
                  >
                    View all {p.comments.length} comments
                  </Button>
                )}
                {visibleComments.map((c) => {
                  const commentLiked = likedCommentIds?.has(c.id);
                  const isCommentAuthor = user?.id === c.author_id;
                  const text = c.content ?? c.body ?? "";
                  return (
                    <div key={c.id} className="flex gap-2 items-start">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage src={c.author?.avatar_url ?? undefined} />
                        <AvatarFallback>
                          {(c.author?.full_name ?? "?").slice(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="bg-muted rounded-lg px-3 py-2">
                          <div className="font-medium text-xs">
                            {c.author?.full_name ?? "Anonymous"}
                          </div>
                          <div className="text-sm">{text}</div>
                        </div>
                        <div className="flex items-center gap-3 mt-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => toggleCommentLike(c.id, !!commentLiked)}
                          >
                            <Heart
                              className={`h-3 w-3 mr-1 ${commentLiked ? "fill-red-500 text-red-500" : ""}`}
                            />
                            {c.likes_count ?? 0}
                          </Button>
                          {isCommentAuthor && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => editComment(c.id, text)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-destructive"
                                onClick={() => deleteComment(c.id)}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {c.created_at && formatDistanceToNow(new Date(c.created_at))} ago
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Comment input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Write a comment…"
                  value={commentDraft[p.id] ?? ""}
                  onChange={(e) => setCommentDraft((d) => ({ ...d, [p.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addComment(p.id)}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => addComment(p.id)}
                  disabled={!(commentDraft[p.id] ?? "").trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <AlertDialog
        open={!!deletePostId}
        onOpenChange={(open) => !open && setDeletePostId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The post, its comments, likes, and associated media
              will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletePostId && deletePost(deletePostId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
