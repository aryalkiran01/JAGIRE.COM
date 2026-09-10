/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  User,
  MapPin,
  Briefcase,
  Globe,
  Linkedin,
  Github,
  MessageSquare,
  Pencil,
  ExternalLink,
  Star,
  Calendar,
  Heart,
  MessageCircle,
  Loader as Loader2,
  ShieldAlert,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/profile/$userId")({
  component: PublicProfilePage,
});

function PublicProfilePage() {
  const { userId } = Route.useParams();
  const { user } = useAuth();
  const isOwnProfile = user?.id === userId;

  // 1. Fetch public profile information
  const {
    data: profile,
    isLoading: isProfileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ["public-profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, full_name, headline, bio, about, location, website, linkedin_url, github_url, experience_years, current_position, skills, avatar_url, banner_url, projects, profile_visibility, created_at",
        )
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // 2. Fetch user's public feed posts
  const { data: userPosts, isLoading: isPostsLoading } = useQuery({
    queryKey: ["user-public-posts", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id, author_id, content, body, image_url, likes_count, comments_count, created_at")
        .eq("author_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data ?? [];
    },
  });

  if (isProfileLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">Loading profile…</p>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md">
        <Card className="glass shadow-card-soft">
          <CardContent className="p-8 text-center space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Profile Unavailable</h2>
              <p className="text-sm text-muted-foreground mt-1">
                This user profile does not exist or has been made private.
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <Button variant="outline" asChild>
                <Link to="/feed">Back to Feed</Link>
              </Button>
              <Button asChild className="gradient-brand text-primary-foreground">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const skills = Array.isArray(profile.skills) ? (profile.skills as string[]) : [];
  const projects = Array.isArray(profile.projects) ? (profile.projects as any[]) : [];

  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-4xl space-y-6">
      {/* Profile Header Card */}
      <Card className="overflow-hidden glass shadow-card-soft border-border/40">
        <div className="relative">
          <div
            className="h-40 md:h-56 bg-gradient-to-br from-primary/30 via-primary/10 to-accent/30 bg-cover bg-center"
            style={
              profile.banner_url ? { backgroundImage: `url(${profile.banner_url})` } : undefined
            }
          />
          <div className="absolute -bottom-10 sm:-bottom-12 left-4 sm:left-6">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-background shadow-lg">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="gradient-brand text-primary-foreground text-2xl font-bold">
                {(profile.full_name ?? "?").slice(0, 1)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div className="pt-14 sm:pt-16 pb-6 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">
                  {profile.full_name || "Jagire Member"}
                </h1>
                {isOwnProfile && (
                  <Badge variant="secondary" className="text-xs">
                    You
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm sm:text-base font-medium">
                {profile.headline || profile.current_position || "Professional Member"}
              </p>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-muted-foreground pt-1.5">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-primary/70" />
                    {profile.location}
                  </span>
                )}
                {profile.experience_years != null && profile.experience_years > 0 && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5 text-primary/70" />
                    {profile.experience_years} {profile.experience_years === 1 ? "yr" : "yrs"}{" "}
                    experience
                  </span>
                )}
                {profile.created_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-primary/70" />
                    Joined{" "}
                    {new Date(profile.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {isOwnProfile ? (
                <Button asChild className="gradient-brand text-primary-foreground shadow-sm">
                  <Link to="/profile">
                    <Pencil className="h-4 w-4 mr-1.5" />
                    Edit Profile
                  </Link>
                </Button>
              ) : (
                <Button asChild className="gradient-brand text-primary-foreground shadow-sm">
                  <Link to="/messages" search={{ with: userId }}>
                    <MessageSquare className="h-4 w-4 mr-1.5" />
                    Message
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Social Links */}
          {(profile.linkedin_url || profile.github_url || profile.website) && (
            <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border/40 mt-4">
              {profile.linkedin_url && (
                <Button variant="outline" size="sm" asChild className="h-8 text-xs gap-1.5">
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                    <Linkedin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    LinkedIn
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </a>
                </Button>
              )}
              {profile.github_url && (
                <Button variant="outline" size="sm" asChild className="h-8 text-xs gap-1.5">
                  <a href={profile.github_url} target="_blank" rel="noopener noreferrer">
                    <Github className="h-3.5 w-3.5" />
                    GitHub
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </a>
                </Button>
              )}
              {profile.website && (
                <Button variant="outline" size="sm" asChild className="h-8 text-xs gap-1.5">
                  <a href={profile.website} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    Portfolio
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </a>
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* About & Bio */}
      {(profile.about || profile.bio) && (
        <Card className="glass shadow-card-soft border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed">
            {profile.about && <p className="whitespace-pre-wrap">{profile.about}</p>}
            {profile.bio && profile.bio !== profile.about && (
              <p className="text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <Card className="glass shadow-card-soft border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Skills & Expertise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill: string) => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="px-3 py-1 text-xs font-medium bg-muted/70 hover:bg-muted"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Featured Projects */}
      {projects.length > 0 && (
        <Card className="glass shadow-card-soft border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Featured Projects</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-3">
            {projects.map((p: any, idx: number) => (
              <div
                key={p.url || idx}
                className="border rounded-xl p-3.5 hover:bg-muted/30 transition-colors flex flex-col justify-between space-y-2 bg-card/40"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm">{p.name || "Project"}</h3>
                    {p.url && (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                  {p.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {p.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                  {p.language && <span>{p.language}</span>}
                  {p.stars != null && p.stars > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" /> {p.stars}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Community Activity & Posts */}
      <Card className="glass shadow-card-soft border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Community Posts</span>
            <span className="text-xs font-normal text-muted-foreground">
              {userPosts?.length ?? 0} {userPosts?.length === 1 ? "post" : "posts"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPostsLoading ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
              Loading posts…
            </div>
          ) : !userPosts?.length ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No community posts shared yet.
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {userPosts.map((post: any) => (
                <div key={post.id} className="py-4 first:pt-0 last:pb-0 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {post.created_at
                        ? `${formatDistanceToNow(new Date(post.created_at))} ago`
                        : "Recently"}
                    </span>
                    <Link
                      to="/feed"
                      className="hover:underline hover:text-primary transition-colors text-xs"
                    >
                      View in Feed
                    </Link>
                  </div>

                  <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words text-foreground/90">
                    {post.content ?? post.body ?? post.title}
                  </p>

                  {post.image_url && (
                    <div className="rounded-xl overflow-hidden border border-border/60 bg-muted/20 flex items-center justify-center max-h-96">
                      <img
                        src={post.image_url}
                        alt="Post media"
                        loading="lazy"
                        className="w-full h-auto max-h-96 object-contain rounded-lg"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3.5 w-3.5 text-red-500" />
                      {post.likes_count ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3.5 w-3.5" />
                      {post.comments_count ?? 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
