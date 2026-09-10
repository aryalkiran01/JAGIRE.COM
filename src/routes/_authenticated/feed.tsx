import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Heart,
  MessageCircle,
  Bookmark,
  Send,
  Loader as Loader2,
  Share2,
  Pencil,
  Trash2,
  TrendingUp,
  Flame,
  ImagePlus,
  ChevronDown,
  ChevronUp,
  Reply,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { adminDeletePost, adminDeleteComment } from "@/lib/admin.server";

export const Route = createFileRoute("/_authenticated/feed")({ component: FeedPage });

type CommentRow = {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_id: string;
  content: string | null;
  body: string | null;
  created_at: string | null;
  likes_count: number | null;
  author: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    headline?: string | null;
  } | null;
};

type PostRow = {
  id: string;
  author_id: string;
  content: string | null;
  body: string | null;
  title?: string | null;
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
  const { user, role } = useAuth();
  const isAdmin = role === "admin";
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(10);
  const [pendingLikePostIds, setPendingLikePostIds] = useState<Set<string>>(new Set());
  const [pendingLikeCommentIds, setPendingLikeCommentIds] = useState<Set<string>>(new Set());
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data: posts, isLoading } = useQuery<PostRow[]>({
    queryKey: ["feed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(
          "id, author_id, content, body, title, image_url, likes_count, comments_count, created_at, updated_at, author:profiles!posts_author_id_fkey(id, full_name, avatar_url, headline)",
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
          "id, post_id, parent_id, author_id, content, body, created_at, likes_count, author:profiles!post_comments_author_id_fkey(id, full_name, avatar_url, headline)",
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

  async function toggleLike(postId: string, currentlyLiked: boolean) {
    if (!user) {
      toast.error("Please log in to like posts");
      return;
    }
    if (pendingLikePostIds.has(postId)) return;

    setPendingLikePostIds((prev) => new Set(prev).add(postId));
    const willBeLiked = !currentlyLiked;

    // Optimistic cache update
    qc.setQueryData<Set<string>>(["feed-likes", user.id], (old) => {
      const next = new Set(old ?? []);
      if (willBeLiked) next.add(postId);
      else next.delete(postId);
      return next;
    });

    qc.setQueryData<PostRow[]>(["feed"], (old) => {
      if (!old) return old;
      return old.map((post) => {
        if (post.id !== postId) return post;
        const currentCount = post.likes_count ?? 0;
        const newCount = willBeLiked ? currentCount + 1 : Math.max(0, currentCount - 1);
        return { ...post, likes_count: newCount };
      });
    });

    try {
      if (currentlyLiked) {
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("post_likes")
          .insert({ post_id: postId, user_id: user.id });
        if (error) throw error;
      }
    } catch (err) {
      toast.error((err as Error).message || "Failed to update like");
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["feed-likes", user.id] });
    } finally {
      setPendingLikePostIds((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
      qc.invalidateQueries({ queryKey: ["feed-likes", user.id] });
    }
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
    if (!text || !user) return;
    const { error } = await supabase
      .from("post_comments")
      .insert({ post_id: postId, author_id: user.id, content: text });
    if (error) {
      toast.error(error.message);
      return;
    }
    setCommentDraft((d) => ({ ...d, [postId]: "" }));
    qc.invalidateQueries({ queryKey: ["feed"] });
  }

  async function addReply(postId: string, parentId: string) {
    const text = (replyDraft[parentId] ?? "").trim();
    if (!text || !user) return;
    const { error } = await supabase
      .from("post_comments")
      .insert({
        post_id: postId,
        parent_id: parentId,
        author_id: user.id,
        content: text,
      });
    if (error) {
      toast.error(error.message);
      return;
    }
    setReplyDraft((d) => ({ ...d, [parentId]: "" }));
    setActiveReplyId(null);
    toast.success("Reply added");
    qc.invalidateQueries({ queryKey: ["feed"] });
  }

  async function toggleCommentLike(commentId: string, currentlyLiked: boolean) {
    if (!user) {
      toast.error("Please log in to like comments");
      return;
    }
    if (pendingLikeCommentIds.has(commentId)) return;

    setPendingLikeCommentIds((prev) => new Set(prev).add(commentId));
    const willBeLiked = !currentlyLiked;

    // Optimistic update of likedCommentIds set
    qc.setQueryData<Set<string>>(["feed-comment-likes", user.id], (old) => {
      const next = new Set(old ?? []);
      if (willBeLiked) next.add(commentId);
      else next.delete(commentId);
      return next;
    });

    // Optimistic update of comment likes count in feed query data
    qc.setQueryData<PostRow[]>(["feed"], (old) => {
      if (!old) return old;
      return old.map((post) => {
        const hasComment = post.comments?.some((c) => c.id === commentId);
        if (!hasComment) return post;
        return {
          ...post,
          comments: post.comments.map((c) => {
            if (c.id !== commentId) return c;
            const currentCount = c.likes_count ?? 0;
            const newCount = willBeLiked ? currentCount + 1 : Math.max(0, currentCount - 1);
            return { ...c, likes_count: newCount };
          }),
        };
      });
    });

    try {
      if (currentlyLiked) {
        const { error } = await supabase
          .from("comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("comment_likes")
          .insert({ comment_id: commentId, user_id: user.id });
        if (error) throw error;
      }
    } catch (err) {
      toast.error((err as Error).message || "Failed to update like");
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["feed-comment-likes", user.id] });
    } finally {
      setPendingLikeCommentIds((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
      qc.invalidateQueries({ queryKey: ["feed-comment-likes", user.id] });
    }
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
    const isAuthor = user?.id === post?.author_id;
    try {
      if (isAuthor) {
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
        if (error) throw error;
      } else {
        const res = await adminDeletePost({ data: { postId } });
        if (!res.success) throw new Error(res.message);
      }
      toast.success("Post deleted");
      setDeletePostId(null);
      qc.invalidateQueries({ queryKey: ["feed"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function saveEditComment(commentId: string) {
    if (!editCommentText.trim()) return;
    const { error } = await supabase
      .from("post_comments")
      .update({ content: editCommentText.trim() })
      .eq("id", commentId);
    if (error) {
      toast.error(error.message);
      return;
    }
    setEditingCommentId(null);
    setEditCommentText("");
    toast.success("Comment updated");
    qc.invalidateQueries({ queryKey: ["feed"] });
  }

  function toggleExpandPost(postId: string) {
    setExpandedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  }

  async function deleteComment(commentId: string) {
    if (!window.confirm("Delete this comment?")) return;
    try {
      const { error } = await supabase.from("post_comments").delete().eq("id", commentId);
      if (error) throw error;
      toast.success("Comment deleted");
      qc.invalidateQueries({ queryKey: ["feed"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function adminDeleteCommentFn(commentId: string) {
    if (!window.confirm("Delete this comment as admin?")) return;
    try {
      const res = await adminDeleteComment({ data: { commentId } });
      if (!res.success) throw new Error(res.message);
      toast.success("Comment deleted by admin");
      qc.invalidateQueries({ queryKey: ["feed"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
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
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-6xl">
      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        {/* Main feed */}
        <div className="space-y-4 min-w-0">
          <div className="mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold">Community Feed</h1>
            <p className="text-muted-foreground text-sm">
              Share insights, network, and stay updated
            </p>
          </div>

          {/* Compose box */}
          <Card className="glass hover:shadow-card-soft transition-all">
            <CardContent className="p-3 sm:p-4 space-y-3">
              <div className="flex gap-2 sm:gap-3">
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
                  <img src={imageUrl} alt="" className="w-full h-auto object-cover" />
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

          {/* Posts List */}
          {visiblePosts.map((p, idx) => {
            const liked = likedIds?.has(p.id);
            const saved = savedIds?.has(p.id);
            const isAuthor = user?.id === p.author_id;
            const isLast = idx === visiblePosts.length - 1;

            const postRawText = (p.content ?? p.body ?? p.title ?? "").trim();
            const isLongText =
              postRawText.length > 300 || (postRawText.match(/\n/g) || []).length >= 4;
            const isTextExpanded = expandedPosts.has(p.id);
            const isShortTextOnly =
              !p.image_url && postRawText.length > 0 && postRawText.length <= 140;
            const displayText =
              isLongText && !isTextExpanded
                ? postRawText.slice(0, 280).trim() + "…"
                : postRawText;

            const postComments = p.comments ?? [];
            const rootComments = postComments.filter((c) => !c.parent_id);
            const repliesByParent = new Map<string, CommentRow[]>();
            for (const c of postComments) {
              if (c.parent_id) {
                const arr = repliesByParent.get(c.parent_id) ?? [];
                arr.push(c);
                repliesByParent.set(c.parent_id, arr);
              }
            }

            const isCommentsExpanded =
              expandedComments.has(p.id) || rootComments.length <= 2;
            const visibleRootComments = isCommentsExpanded
              ? rootComments
              : rootComments.slice(-2);

            return (
              <Card
                key={p.id}
                id={`post-${p.id}`}
                ref={isLast ? lastPostRef : undefined}
                className="glass hover:shadow-card-soft transition-all animate-fade-in-up overflow-hidden"
              >
                <CardContent className="p-4 sm:p-5 space-y-3.5">
                  {/* Post Header */}
                  <div className="flex items-start gap-3">
                    <Link
                      to="/profile/$userId"
                      params={{ userId: p.author_id }}
                      className="shrink-0 group"
                      title={`View ${p.author?.full_name ?? "User"}'s profile`}
                    >
                      <Avatar className="h-10 w-10 sm:h-11 sm:w-11 ring-2 ring-border transition-transform group-hover:scale-105">
                        <AvatarImage src={p.author?.avatar_url ?? undefined} />
                        <AvatarFallback className="gradient-brand text-primary-foreground font-semibold">
                          {(p.author?.full_name ?? "?").slice(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        to="/profile/$userId"
                        params={{ userId: p.author_id }}
                        className="font-semibold text-sm hover:underline hover:text-primary transition-colors inline-block truncate max-w-full"
                      >
                        {p.author?.full_name ?? "Anonymous"}
                      </Link>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                        {p.author?.headline && (
                          <span className="truncate max-w-[180px] sm:max-w-xs">
                            {p.author.headline}
                          </span>
                        )}
                        {p.author?.headline && <span>·</span>}
                        <span>
                          {p.created_at ? formatDistanceToNow(new Date(p.created_at)) : "recently"}{" "}
                          ago
                        </span>
                        {p.updated_at && p.updated_at !== p.created_at && (
                          <span className="text-[11px] opacity-75">(edited)</span>
                        )}
                      </div>
                    </div>
                    {(isAuthor || isAdmin) && editingPost !== p.id && (
                      <div className="flex gap-1 shrink-0">
                        {isAuthor && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setEditingPost(p.id);
                              setEditContent(postRawText);
                            }}
                            title="Edit post"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeletePostId(p.id)}
                          title="Delete post"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Post Content */}
                  {editingPost === p.id ? (
                    <div className="space-y-2 pt-1">
                      <Textarea
                        rows={4}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="resize-none bg-muted/20 focus-visible:ring-1 text-sm sm:text-base leading-relaxed"
                        placeholder="Edit post content..."
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
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-0.5 space-y-1">
                      {postRawText ? (
                        <p
                          className={`whitespace-pre-wrap leading-relaxed break-words ${
                            isShortTextOnly
                              ? "text-base sm:text-[17px] font-normal text-foreground"
                              : "text-sm sm:text-[15px] font-normal text-foreground/90"
                          }`}
                        >
                          {displayText}
                          {isLongText && (
                            <button
                              type="button"
                              onClick={() => toggleExpandPost(p.id)}
                              className="ml-1.5 font-medium text-xs sm:text-sm text-primary hover:underline inline-flex items-center gap-0.5 transition-colors cursor-pointer"
                            >
                              {isTextExpanded ? "Show less" : "Read more"}
                            </button>
                          )}
                        </p>
                      ) : null}
                    </div>
                  )}

                  {/* Image attachment - rendered only when an image exists */}
                  {p.image_url && (
                    <div className="rounded-xl overflow-hidden border border-border/60 bg-muted/10 flex items-center justify-center">
                      <img
                        src={p.image_url}
                        alt="Post attachment"
                        loading="lazy"
                        className="w-full h-auto max-h-[85vh] object-contain rounded-xl"
                      />
                    </div>
                  )}

                  {/* Post Action Bar */}
                  <div className="flex items-center justify-between border-y border-border/40 py-1 text-muted-foreground text-xs sm:text-sm">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={pendingLikePostIds.has(p.id)}
                        className={`gap-1.5 h-8 px-2 sm:px-3 ${
                          liked ? "text-red-500 font-medium" : "hover:text-foreground"
                        }`}
                        onClick={() => toggleLike(p.id, !!liked)}
                      >
                        <Heart className={`h-4 w-4 ${liked ? "fill-red-500" : ""}`} />
                        <span>{p.likes_count ?? 0}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 h-8 px-2 sm:px-3 hover:text-foreground"
                        onClick={() => toggleComments(p.id)}
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>{postComments.length || p.comments_count || 0}</span>
                      </Button>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 px-2.5 hover:text-foreground ${
                          saved ? "text-primary" : ""
                        }`}
                        onClick={() => toggleSave(p.id)}
                        title={saved ? "Saved" : "Save post"}
                      >
                        <Bookmark className={`h-4 w-4 ${saved ? "fill-primary" : ""}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2.5 hover:text-foreground"
                        onClick={async () => {
                          const url = `${window.location.origin}/feed#post-${p.id}`;
                          try {
                            if (navigator.share)
                              await navigator.share({ title: "Jagire post", url });
                            else {
                              await navigator.clipboard.writeText(url);
                              toast.success("Link copied");
                            }
                          } catch {
                            toast.error("Unable to share");
                          }
                        }}
                        title="Share post"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Comments Thread Section (Subordinate inside Post card) */}
                  <div className="space-y-3 pt-1">
                    {/* Comments Section Header / Toggle */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                        Comments {postComments.length > 0 ? `· ${postComments.length}` : ""}
                      </span>
                      {rootComments.length > 2 && (
                        <button
                          type="button"
                          className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
                          onClick={() => toggleComments(p.id)}
                        >
                          {isCommentsExpanded ? (
                            <>
                              <ChevronUp className="h-3.5 w-3.5" /> Show fewer
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3.5 w-3.5" /> View all ({postComments.length}
                              )
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Conversation Comment Rows */}
                    {visibleRootComments.length > 0 && (
                      <div className="space-y-3 pt-1">
                        {visibleRootComments.map((c) => {
                          const commentLiked = likedCommentIds?.has(c.id);
                          const isCommentAuthor = user?.id === c.author_id;
                          const text = c.content ?? c.body ?? "";
                          const replies = repliesByParent.get(c.id) ?? [];

                          return (
                            <div key={c.id} className="space-y-1.5 group/comment">
                              {/* Root Comment Item */}
                              <div className="flex items-start gap-2.5">
                                <Link
                                  to="/profile/$userId"
                                  params={{ userId: c.author_id }}
                                  className="shrink-0 pt-0.5"
                                  title={`View ${c.author?.full_name ?? "User"}'s profile`}
                                >
                                  <Avatar className="h-7 w-7 ring-1 ring-border/50">
                                    <AvatarImage src={c.author?.avatar_url ?? undefined} />
                                    <AvatarFallback className="text-[11px] bg-primary/10 text-primary font-medium">
                                      {(c.author?.full_name ?? "?").slice(0, 1)}
                                    </AvatarFallback>
                                  </Avatar>
                                </Link>

                                <div className="flex-1 min-w-0">
                                  {/* Author Name + Timestamp + Edit/Delete Menu */}
                                  <div className="flex items-baseline justify-between gap-2">
                                    <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
                                      <Link
                                        to="/profile/$userId"
                                        params={{ userId: c.author_id }}
                                        className="font-semibold text-xs text-foreground hover:text-primary hover:underline transition-colors"
                                      >
                                        {c.author?.full_name ?? "Anonymous"}
                                      </Link>
                                      {c.author?.headline && (
                                        <span className="text-[11px] text-muted-foreground/80 truncate max-w-[140px] sm:max-w-[200px]">
                                          · {c.author.headline}
                                        </span>
                                      )}
                                      <span className="text-[11px] text-muted-foreground">
                                        ·{" "}
                                        {c.created_at
                                          ? formatDistanceToNow(new Date(c.created_at))
                                          : "recently"}{" "}
                                        ago
                                      </span>
                                    </div>

                                    {(isCommentAuthor || isAdmin) && (
                                      <div className="opacity-0 group-hover/comment:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                                        {isCommentAuthor && editingCommentId !== c.id && (
                                          <button
                                            type="button"
                                            className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                                            onClick={() => {
                                              setEditingCommentId(c.id);
                                              setEditCommentText(text);
                                            }}
                                            title="Edit comment"
                                          >
                                            <Pencil className="h-3 w-3" />
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          className="text-muted-foreground hover:text-destructive p-0.5 rounded transition-colors"
                                          onClick={() =>
                                            isAdmin && !isCommentAuthor
                                              ? adminDeleteCommentFn(c.id)
                                              : deleteComment(c.id)
                                          }
                                          title={
                                            isAdmin && !isCommentAuthor
                                              ? "Delete (Admin)"
                                              : "Delete comment"
                                          }
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {/* Comment Text or Inline Edit */}
                                  {editingCommentId === c.id ? (
                                    <div className="mt-1 space-y-1.5">
                                      <Input
                                        value={editCommentText}
                                        onChange={(e) => setEditCommentText(e.target.value)}
                                        className="h-8 text-xs bg-muted/40"
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" && !e.shiftKey)
                                            saveEditComment(c.id);
                                          if (e.key === "Escape") setEditingCommentId(null);
                                        }}
                                        autoFocus
                                      />
                                      <div className="flex justify-end gap-1.5">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 text-xs px-2"
                                          onClick={() => setEditingCommentId(null)}
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          size="sm"
                                          className="h-6 text-xs px-2"
                                          onClick={() => saveEditComment(c.id)}
                                          disabled={!editCommentText.trim()}
                                        >
                                          Save
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words mt-0.5">
                                      {text}
                                    </p>
                                  )}

                                  {/* Compact Comment Actions */}
                                  <div className="flex items-center gap-3 mt-1 text-xs">
                                    <button
                                      type="button"
                                      disabled={pendingLikeCommentIds.has(c.id)}
                                      onClick={() => toggleCommentLike(c.id, !!commentLiked)}
                                      className={`inline-flex items-center gap-1 font-medium transition-colors ${
                                        commentLiked
                                          ? "text-red-500"
                                          : "text-muted-foreground hover:text-foreground"
                                      }`}
                                    >
                                      <Heart
                                        className={`h-3.5 w-3.5 ${
                                          commentLiked ? "fill-red-500 text-red-500" : ""
                                        }`}
                                      />
                                      <span>{c.likes_count ?? 0}</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setActiveReplyId((prev) => (prev === c.id ? null : c.id))
                                      }
                                      className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                      <Reply className="h-3 w-3" />
                                      <span>Reply</span>
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Nested Replies */}
                              {replies.length > 0 && (
                                <div className="ml-5 sm:ml-7 pl-3 border-l-2 border-border/50 space-y-2 mt-2">
                                  {replies.map((r) => {
                                    const replyLiked = likedCommentIds?.has(r.id);
                                    const isReplyAuthor = user?.id === r.author_id;
                                    const replyText = r.content ?? r.body ?? "";

                                    return (
                                      <div key={r.id} className="flex items-start gap-2 group/reply">
                                        <Link
                                          to="/profile/$userId"
                                          params={{ userId: r.author_id }}
                                          className="shrink-0 pt-0.5"
                                          title={`View ${r.author?.full_name ?? "User"}'s profile`}
                                        >
                                          <Avatar className="h-5 w-5 ring-1 ring-border/40">
                                            <AvatarImage src={r.author?.avatar_url ?? undefined} />
                                            <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                                              {(r.author?.full_name ?? "?").slice(0, 1)}
                                            </AvatarFallback>
                                          </Avatar>
                                        </Link>

                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-baseline justify-between gap-1.5">
                                            <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
                                              <Link
                                                to="/profile/$userId"
                                                params={{ userId: r.author_id }}
                                                className="font-semibold text-xs text-foreground hover:text-primary hover:underline transition-colors"
                                              >
                                                {r.author?.full_name ?? "Anonymous"}
                                              </Link>
                                              <span className="text-[10px] text-muted-foreground">
                                                ·{" "}
                                                {r.created_at
                                                  ? formatDistanceToNow(new Date(r.created_at))
                                                  : "recently"}{" "}
                                                ago
                                              </span>
                                            </div>

                                            {(isReplyAuthor || isAdmin) && (
                                              <div className="opacity-0 group-hover/reply:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                                                {isReplyAuthor && editingCommentId !== r.id && (
                                                  <button
                                                    type="button"
                                                    className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                                                    onClick={() => {
                                                      setEditingCommentId(r.id);
                                                      setEditCommentText(replyText);
                                                    }}
                                                    title="Edit reply"
                                                  >
                                                    <Pencil className="h-2.5 w-2.5" />
                                                  </button>
                                                )}
                                                <button
                                                  type="button"
                                                  className="text-muted-foreground hover:text-destructive p-0.5 rounded transition-colors"
                                                  onClick={() =>
                                                    isAdmin && !isReplyAuthor
                                                      ? adminDeleteCommentFn(r.id)
                                                      : deleteComment(r.id)
                                                  }
                                                  title={
                                                    isAdmin && !isReplyAuthor
                                                      ? "Delete (Admin)"
                                                      : "Delete reply"
                                                  }
                                                >
                                                  <Trash2 className="h-2.5 w-2.5" />
                                                </button>
                                              </div>
                                            )}
                                          </div>

                                          {editingCommentId === r.id ? (
                                            <div className="mt-1 space-y-1">
                                              <Input
                                                value={editCommentText}
                                                onChange={(e) => setEditCommentText(e.target.value)}
                                                className="h-7 text-xs bg-muted/40"
                                                onKeyDown={(e) => {
                                                  if (e.key === "Enter" && !e.shiftKey)
                                                    saveEditComment(r.id);
                                                  if (e.key === "Escape") setEditingCommentId(null);
                                                }}
                                                autoFocus
                                              />
                                              <div className="flex justify-end gap-1">
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-5 text-[11px] px-1.5"
                                                  onClick={() => setEditingCommentId(null)}
                                                >
                                                  Cancel
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  className="h-5 text-[11px] px-1.5"
                                                  onClick={() => saveEditComment(r.id)}
                                                  disabled={!editCommentText.trim()}
                                                >
                                                  Save
                                                </Button>
                                              </div>
                                            </div>
                                          ) : (
                                            <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap break-words mt-0.5">
                                              {replyText}
                                            </p>
                                          )}

                                          <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                                            <button
                                              type="button"
                                              disabled={pendingLikeCommentIds.has(r.id)}
                                              onClick={() => toggleCommentLike(r.id, !replyLiked)}
                                              className={`inline-flex items-center gap-1 font-medium transition-colors ${
                                                replyLiked
                                                  ? "text-red-500"
                                                  : "text-muted-foreground hover:text-foreground"
                                              }`}
                                            >
                                              <Heart
                                                className={`h-3 w-3 ${
                                                  replyLiked ? "fill-red-500 text-red-500" : ""
                                                }`}
                                              />
                                              <span>{r.likes_count ?? 0}</span>
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Inline Reply Composer */}
                              {activeReplyId === c.id && (
                                <div className="ml-5 sm:ml-7 pl-3 border-l-2 border-primary/40 flex items-center gap-2 pt-1.5">
                                  <Input
                                    placeholder={`Reply to ${c.author?.full_name ?? "comment"}…`}
                                    value={replyDraft[c.id] ?? ""}
                                    onChange={(e) =>
                                      setReplyDraft((d) => ({ ...d, [c.id]: e.target.value }))
                                    }
                                    onKeyDown={(e) => e.key === "Enter" && addReply(p.id, c.id)}
                                    className="h-7 text-xs bg-muted/30 flex-1"
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    className="h-7 px-2.5 text-xs gradient-brand text-primary-foreground"
                                    onClick={() => addReply(p.id, c.id)}
                                    disabled={!(replyDraft[c.id] ?? "").trim()}
                                  >
                                    <Send className="h-3 w-3 mr-1" /> Reply
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-1.5 text-xs text-muted-foreground"
                                    onClick={() => setActiveReplyId(null)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Post-level Comment Input */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                      <Avatar className="h-7 w-7 shrink-0 hidden sm:flex">
                        <AvatarImage src={user?.user_metadata?.avatar_url} />
                        <AvatarFallback className="text-[10px] bg-muted">
                          {(user?.email?.[0] ?? "U").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <Input
                        placeholder="Write a comment…"
                        value={commentDraft[p.id] ?? ""}
                        onChange={(e) =>
                          setCommentDraft((d) => ({ ...d, [p.id]: e.target.value }))
                        }
                        onKeyDown={(e) => e.key === "Enter" && addComment(p.id)}
                        className="h-8 text-xs sm:text-sm bg-muted/20 border-border/40 flex-1"
                      />
                      <Button
                        size="sm"
                        className="h-8 px-3 text-xs gradient-brand text-primary-foreground"
                        onClick={() => addComment(p.id)}
                        disabled={!(commentDraft[p.id] ?? "").trim()}
                      >
                        <Send className="h-3 w-3 mr-1" /> Comment
                      </Button>
                    </div>
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
