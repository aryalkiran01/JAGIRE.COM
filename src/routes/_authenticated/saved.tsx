/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bookmark,
  Building2,
  MapPin,
  Briefcase,
  Banknote,
  ArrowRight,
  BookmarkX,
  Rss,
  Clock,
  Heart,
  MessageCircle,
  Compass,
  Loader2,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/saved")({ component: SavedContentPage });

function SavedContentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"jobs" | "posts">("jobs");

  // 1. Fetch Saved Jobs
  const {
    data: savedJobs,
    isLoading: isJobsLoading,
    error: jobsError,
  } = useQuery({
    queryKey: ["saved-jobs", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_jobs")
        .select("id, created_at, job:jobs(*, company:companies(id, name, logo_url, slug, location))")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as any[]) ?? [];
    },
  });

  // 2. Fetch Saved Feed Posts
  const {
    data: savedPosts,
    isLoading: isPostsLoading,
    error: postsError,
  } = useQuery({
    queryKey: ["saved-posts", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_saves")
        .select(
          "id, created_at, post:posts(*, author:profiles(id, full_name, avatar_url, headline, current_position))",
        )
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as any[]) ?? [];
    },
  });

  // 3. Unsave Job Mutation
  const unsaveJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      if (!user) return;
      const { error } = await supabase
        .from("saved_jobs")
        .delete()
        .eq("user_id", user.id)
        .eq("job_id", jobId);
      if (error) throw error;
    },
    onMutate: async (jobId) => {
      await qc.cancelQueries({ queryKey: ["saved-jobs", user?.id] });
      const prev = qc.getQueryData(["saved-jobs", user?.id]);
      qc.setQueryData(["saved-jobs", user?.id], (old: any[] | undefined) =>
        (old || []).filter((item) => item.job?.id !== jobId),
      );
      return { prev };
    },
    onError: (_err, _jobId, context) => {
      if (context?.prev) {
        qc.setQueryData(["saved-jobs", user?.id], context.prev);
      }
      toast.error("Failed to remove saved job");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saved-jobs", user?.id] });
      qc.invalidateQueries({ queryKey: ["user-saved-jobs", user?.id] });
      qc.invalidateQueries({ queryKey: ["saved", user?.id] });
      toast.success("Job removed from saved");
    },
  });

  // 4. Unsave Post Mutation
  const unsavePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!user) return;
      const { error } = await supabase
        .from("post_saves")
        .delete()
        .eq("user_id", user.id)
        .eq("post_id", postId);
      if (error) throw error;
    },
    onMutate: async (postId) => {
      await qc.cancelQueries({ queryKey: ["saved-posts", user?.id] });
      const prev = qc.getQueryData(["saved-posts", user?.id]);
      qc.setQueryData(["saved-posts", user?.id], (old: any[] | undefined) =>
        (old || []).filter((item) => item.post?.id !== postId),
      );
      return { prev };
    },
    onError: (_err, _postId, context) => {
      if (context?.prev) {
        qc.setQueryData(["saved-posts", user?.id], context.prev);
      }
      toast.error("Failed to remove saved post");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saved-posts", user?.id] });
      qc.invalidateQueries({ queryKey: ["feed-posts"] });
      toast.success("Post removed from saved");
    },
  });

  const validSavedJobs = (savedJobs ?? []).filter((s) => s.job);
  const validSavedPosts = (savedPosts ?? []).filter((s) => s.post);

  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <Bookmark className="h-7 w-7 text-primary fill-primary/20" />
            Saved Content
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Access your bookmarked job opportunities and saved community discussions in one place.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/jobs" })}
            className="text-xs gap-1.5 h-9"
          >
            <Compass className="h-3.5 w-3.5" />
            Find Jobs
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/feed" })}
            className="text-xs gap-1.5 h-9"
          >
            <Rss className="h-3.5 w-3.5" />
            Explore Feed
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "jobs" | "posts")}
        className="space-y-6"
      >
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger
            value="jobs"
            className="rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
          >
            <Briefcase className="h-4 w-4 text-primary" />
            <span>Saved Jobs</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
              {validSavedJobs.length}
            </Badge>
          </TabsTrigger>

          <TabsTrigger
            value="posts"
            className="rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
          >
            <Rss className="h-4 w-4 text-primary" />
            <span>Saved Posts</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
              {validSavedPosts.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: SAVED JOBS ───────────────────────────────────────── */}
        <TabsContent value="jobs" className="space-y-4 focus-visible:outline-none">
          {isJobsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse h-28 bg-muted/40" />
              ))}
            </div>
          ) : jobsError ? (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="p-8 text-center space-y-3">
                <p className="text-sm font-medium text-destructive">
                  Failed to load your saved jobs.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => qc.invalidateQueries({ queryKey: ["saved-jobs", user?.id] })}
                >
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : validSavedJobs.length > 0 ? (
            <div className="grid gap-3 sm:gap-4">
              {validSavedJobs.map((item) => {
                const job = item.job;
                const company = job.company;
                const formattedSalary =
                  job.salary_min && job.salary_max
                    ? `Rs. ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
                    : job.salary_min
                      ? `From Rs. ${job.salary_min.toLocaleString()}`
                      : null;

                return (
                  <Card
                    key={job.id}
                    className="glass border-border/50 hover:border-primary/40 transition-all duration-200 shadow-card-soft group"
                  >
                    <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Company Logo & Job Metadata */}
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <div className="h-12 w-12 rounded-xl bg-card border border-border/60 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                          {company?.logo_url ? (
                            <img
                              src={company.logo_url}
                              alt={company.name || "Company"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Building2 className="h-6 w-6 text-muted-foreground/60" />
                          )}
                        </div>

                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              to="/jobs/$jobId"
                              params={{ jobId: job.id }}
                              className="font-bold text-base sm:text-lg text-foreground hover:text-primary transition-colors truncate"
                            >
                              {job.title}
                            </Link>
                            {job.is_featured && (
                              <Badge className="gradient-brand text-primary-foreground text-[10px] px-1.5 py-0">
                                Featured
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            {company?.slug ? (
                              <Link
                                to="/companies/$slug"
                                params={{ slug: company.slug }}
                                className="font-medium text-foreground hover:underline truncate"
                              >
                                {company.name || "Company"}
                              </Link>
                            ) : (
                              <span className="font-medium text-foreground">
                                {company?.name || "Company"}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground pt-1">
                            {job.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5 text-primary/70" />
                                {job.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3.5 w-3.5 text-primary/70" />
                              {String(job.job_type || "Full Time").replace("_", " ")}
                            </span>
                            {formattedSalary && (
                              <span className="flex items-center gap-1 text-foreground font-medium">
                                <Banknote className="h-3.5 w-3.5 text-emerald-500" />
                                {formattedSalary}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                        <span className="text-[11px] text-muted-foreground">
                          Saved{" "}
                          {item.created_at
                            ? `${formatDistanceToNow(new Date(item.created_at))} ago`
                            : "recently"}
                        </span>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => unsaveJobMutation.mutate(job.id)}
                            disabled={unsaveJobMutation.isPending}
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Remove from saved"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Unsave
                          </Button>

                          <Button
                            asChild
                            size="sm"
                            className="gradient-brand text-primary-foreground h-8 text-xs shadow-sm"
                          >
                            <Link to="/jobs/$jobId" params={{ jobId: job.id }}>
                              View Job <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-dashed border-border/60 bg-muted/20">
              <CardContent className="p-12 text-center space-y-4">
                <div className="h-14 w-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
                  <BookmarkX className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">No saved jobs yet</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mt-1">
                    Save jobs while browsing Search or Feed to review and apply to them later at
                    your convenience.
                  </p>
                </div>
                <div className="pt-2 flex justify-center gap-2">
                  <Button asChild className="gradient-brand text-primary-foreground">
                    <Link to="/jobs">Explore Open Jobs</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── TAB 2: SAVED POSTS ──────────────────────────────────────── */}
        <TabsContent value="posts" className="space-y-4 focus-visible:outline-none">
          {isPostsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse h-28 bg-muted/40" />
              ))}
            </div>
          ) : postsError ? (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="p-8 text-center space-y-3">
                <p className="text-sm font-medium text-destructive">
                  Failed to load your saved posts.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => qc.invalidateQueries({ queryKey: ["saved-posts", user?.id] })}
                >
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : validSavedPosts.length > 0 ? (
            <div className="grid gap-3 sm:gap-4 max-w-2xl mx-auto">
              {validSavedPosts.map((item) => {
                const post = item.post;
                const author = post.author;

                return (
                  <Card
                    key={post.id}
                    className="glass border-border/50 hover:border-primary/40 transition-all duration-200 shadow-card-soft"
                  >
                    <CardContent className="p-4 sm:p-5 space-y-3">
                      {/* Author Header & Unsave Action */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar className="h-9 w-9 border border-border/40">
                            <AvatarImage src={author?.avatar_url ?? undefined} />
                            <AvatarFallback className="gradient-brand text-primary-foreground text-xs font-bold">
                              {(author?.full_name ?? "?").slice(0, 1)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-semibold text-foreground truncate">
                              {author?.full_name || "Community Member"}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              {author?.headline || author?.current_position || "Professional"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-muted-foreground hidden sm:inline">
                            {post.created_at
                              ? `${formatDistanceToNow(new Date(post.created_at))} ago`
                              : "Recently"}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => unsavePostMutation.mutate(post.id)}
                            disabled={unsavePostMutation.isPending}
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Remove from saved"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Unsave
                          </Button>
                        </div>
                      </div>

                      {/* Post Content */}
                      <p className="text-xs sm:text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap break-words line-clamp-4">
                        {post.content ?? post.body ?? post.title}
                      </p>

                      {/* Post Image (if any) */}
                      {post.image_url && (
                        <div className="rounded-xl overflow-hidden border border-border/40">
                          <img
                            src={post.image_url}
                            alt="Post visual"
                            loading="lazy"
                            className="w-full h-auto block rounded-xl"
                          />
                        </div>
                      )}

                      {/* Footer Info & View in Feed link */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/30 text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5 text-red-500" />
                            {post.likes_count ?? 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3.5 w-3.5" />
                            {post.comments_count ?? 0}
                          </span>
                        </div>

                        <Button
                          asChild
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs text-primary font-medium"
                        >
                          <Link to="/feed">
                            View in Feed <ArrowRight className="h-3 w-3 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-dashed border-border/60 bg-muted/20">
              <CardContent className="p-12 text-center space-y-4">
                <div className="h-14 w-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
                  <Rss className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">No saved posts yet</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mt-1">
                    Bookmark interesting discussions, industry insights, and career tips from the
                    Community Feed to read anytime.
                  </p>
                </div>
                <div className="pt-2 flex justify-center gap-2">
                  <Button asChild className="gradient-brand text-primary-foreground">
                    <Link to="/feed">Explore Community Feed</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
