import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SkeletonCard } from "@/components/ui/skeleton-loader";
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
import { Heart, MessageCircle, Bookmark, Send, Loader as Loader2, Share2, Pencil, Trash2, TrendingUp, Flame, ImagePlus, MoveHorizontal as MoreHorizontal } from "lucide-react";
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
  author: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    headline: string | null;
  } | null;
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
  const [visibleCount, setVisibleCount] = useState(10);
  const sentinelRef = useRef<HTMLDivElement>(null);

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
      const { data } = await supabase.from("post_likes").select("post_id").eq("user_id", user!.id);
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
      const { data } = await supabase.from("post_saves").select("post_id").eq("user_id", user!.id);
      return new Set((data ?? []).map((r) => r.post_id));
    },
  });

  // Infinite scroll
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMore = useCallback(() => {
    if (posts && visibleCount < posts.length) {
      setVisibleCount((prev) => Math.min(prev + 10, posts.length));
    }
  }, [posts, visibleCount]);

  const lastPostRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && posts && visibleCount < posts.length) {
          loadMore();
        }
      });
      if (node) observer.current.observe(node);
    },
    [isLoading, loadMore, posts, visibleCount],
  );

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
    await supabase.from("notifications").delete().eq("data->>post_id", postId);
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
      toast.success("Posted to your feed");
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
      await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user!.id);
    else await supabase.from("post_likes").insert({ post_id: postId, user_id: user!.id });
    qc.invalidateQueries({ queryKey: ["feed"] });
    qc.invalidateQueries({ queryKey: ["feed-likes"] });
  }

  async function toggleSave(postId: string) {
    const isSaved = savedIds?.has(postId);
    if (isSaved)
      await supabase.from("post_saves").delete().eq("post_id", postId).eq("user_id", user!.id);
    else await supabase.from("post_saves").insert({ post_id: postId, user_id: user!.id });
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
    else await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: user!.id });
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
    const post = posts?.find((p) => p.id === postId);
    if (post?.image_url) {
      try {
        const url = new URL(post.image_url);
        const pathStart = url.pathname.indexOf("/posts/");
        if (pathStart !== -1) {
          const storagePath = url.pathname.slice(pathStart + 7);
          await supabase.storage.from("posts").remove([storagePath]);
        }
      } catch (error) {
        console.error("Failed to delete post image from storage:", error);
      }
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

  const visiblePosts = posts?.slice(0, visibleCount) ?? [];
  const trendingPosts =
    posts
      ?.slice()
      .sort(
        (a, b) =>
          (b.likes_count ?? 0) +
          (b.comments_count ?? 0) * 2 -
          ((a.likes_count ?? 0) + (a.comments_count ?? 0) * 2),
      )
      .slice(0, 5) ?? [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        {/* Main feed */}
        <div className="space-y-4 min-w-0">
          <div className="mb-2">
            <h1 className="text-3xl font-bold">Community Feed</h1>
            <p className="text-muted-foreground text-sm">
              Share insights, network, and stay updated
            </p>
          </div>

          {/* Compose box */}
          <Card className="glass hover:shadow-card-soft transition-all">
            <CardContent className="p-4 space-y-3">
              <div className="flex gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="gradient-brand text-primary-foreground">
                    {(user?.email?.[0] ?? "U").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Textarea
                  rows={3}
                  placeholder="Share an update, insight, or achievement…"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="resize-none border-0 bg-muted/30 focus-visible:ring-1"
                />
              </div>
              {imageUrl && (
                <div className="relative rounded-lg overflow-hidden border">
                  <img src={imageUrl} alt="" className="w-full max-h-64 object-cover" />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={() => setImageUrl("")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImagePlus className="h-4 w-4" />
                  )}
                  <span>{imageUrl ? "Change image" : "Add image"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
                <Button
                  className="gradient-brand text-primary-foreground"
                  onClick={() => createPost.mutate()}
                  disabled={createPost.isPending || !content.trim()}
                >
                  {createPost.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Send className="h-4 w-4 mr-1" />
                  )}
                  Post
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Loading skeleton */}
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && posts?.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Flame className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  No posts yet. Be the first to share something!
                </p>
              </CardContent>
            </Card>
          )}

          {/* Posts */}
          {visiblePosts.map((p, idx) => {
            const liked = likedIds?.has(p.id);
            const saved = savedIds?.has(p.id);
            const isAuthor = user?.id === p.author_id;
            const showComments = expandedComments.has(p.id) || (p.comments?.length ?? 0) <= 2;
            const visibleComments = showComments ? p.comments : p.comments.slice(-2);
            const isLast = idx === visiblePosts.length - 1;

            return (
              <Card
                key={p.id}
                id={`post-${p.id}`}
                ref={isLast ? lastPostRef : undefined}
                className="glass hover:shadow-card-soft transition-all animate-fade-in-up"
              >
                <CardContent className="p-5 space-y-3">
                  {/* Author header */}
                  <div className="flex items-start gap-3">
                    <Avatar className="h-11 w-11 ring-2 ring-border">
                      <AvatarImage src={p.author?.avatar_url ?? undefined} />
                      <AvatarFallback className="gradient-brand text-primary-foreground">
                        {(p.author?.full_name ?? "?").slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">
                        {p.author?.full_name ?? "Anonymous"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {p.author?.headline ?? ""}
                        {p.author?.headline && " · "}
                        {formatDistanceToNow(new Date(p.created_at!))} ago
                        {p.updated_at && p.updated_at !== p.created_at && " · edited"}
                      </div>
                    </div>
                    {isAuthor && editingPost !== p.id && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
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
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeletePostId(p.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  {editingPost === p.id ? (
                    <div className="space-y-2">
                      <Textarea
                        rows={3}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="resize-none"
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
                    <p className="whitespace-pre-wrap text-sm leading-relaxed pl-14 -mt-1">
                      {p.content ?? p.body}
                    </p>
                  )}

                  {/* Image */}
                  {p.image_url && (
                    <div className="rounded-xl overflow-hidden border -mx-1">
                      <img src={p.image_url} alt="" className="w-full max-h-[500px] object-cover" />
                    </div>
                  )}

                  {/* Engagement bar */}
                  <div className="flex items-center gap-1 pl-14 -mt-1 border-t pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`gap-1.5 ${liked ? "text-red-500" : "text-muted-foreground"}`}
                      onClick={() => toggleLike(p.id, !!liked)}
                    >
                      <Heart className={`h-4 w-4 ${liked ? "fill-red-500" : ""}`} />
                      <span className="text-xs">{p.likes_count ?? 0}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-muted-foreground"
                      onClick={() => toggleComments(p.id)}
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-xs">{p.comments_count ?? 0}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`text-muted-foreground ${saved ? "text-primary" : ""}`}
                      onClick={() => toggleSave(p.id)}
                    >
                      <Bookmark className={`h-4 w-4 ${saved ? "fill-primary" : ""}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                      onClick={async () => {
                        const url = `${window.location.origin}/feed#post-${p.id}`;
                        try {
                          if (navigator.share) await navigator.share({ title: "Jagire post", url });
                          else {
                            await navigator.clipboard.writeText(url);
                            toast.success("Link copied");
                          }
                        } catch {
                          toast.error("Unable to share");
                        }
                      }}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Comments */}
                  <div className="space-y-2 pl-14">
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
                            <AvatarFallback className="text-xs">
                              {(c.author?.full_name ?? "?").slice(0, 1)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="bg-muted/60 rounded-lg px-3 py-2 inline-block">
                              <div className="font-medium text-xs">
                                {c.author?.full_name ?? "Anonymous"}
                              </div>
                              <div className="text-sm">{text}</div>
                            </div>
                            <div className="flex items-center gap-3 mt-1 ml-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-6 px-2 text-xs ${commentLiked ? "text-red-500" : "text-muted-foreground"}`}
                                onClick={() => toggleCommentLike(c.id, !!commentLiked)}
                              >
                                <Heart
                                  className={`h-3 w-3 mr-1 ${commentLiked ? "fill-red-500" : ""}`}
                                />
                                {c.likes_count ?? 0}
                              </Button>
                              {isCommentAuthor && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs text-muted-foreground"
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
                  <div className="flex gap-2 pl-14">
                    <Input
                      placeholder="Write a comment…"
                      value={commentDraft[p.id] ?? ""}
                      onChange={(e) => setCommentDraft((d) => ({ ...d, [p.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && addComment(p.id)}
                      className="bg-muted/30 border-0"
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

          {/* Load more sentinel */}
          {posts && visibleCount < posts.length && (
            <div ref={sentinelRef} className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Sidebar: Trending */}
        <div className="hidden lg:block space-y-4">
          <div className="sticky top-20">
            <Card className="glass">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Trending Posts</h3>
                </div>
                <div className="space-y-3">
                  {trendingPosts.map((p, i) => (
                    <a key={p.id} href={`#post-${p.id}`} className="block group">
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-bold text-muted-foreground/50 mt-0.5">
                          #{i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground line-clamp-2 group-hover:text-foreground transition-colors">
                            {p.content ?? p.body}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground/70">
                            <span className="flex items-center gap-0.5">
                              <Heart className="h-3 w-3" />
                              {p.likes_count ?? 0}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <MessageCircle className="h-3 w-3" />
                              {p.comments_count ?? 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass mt-4">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="h-4 w-4 text-accent" />
                  <h3 className="font-semibold text-sm">Feed Tips</h3>
                </div>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li>Share career milestones and achievements</li>
                  <li>Post industry insights and articles</li>
                  <li>Engage with comments to build your network</li>
                  <li>Bookmark posts to read later</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete dialog */}
      <AlertDialog open={!!deletePostId} onOpenChange={(open) => !open && setDeletePostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The post, its comments, likes, and associated media will
              be permanently removed.
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
