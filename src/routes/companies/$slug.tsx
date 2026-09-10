/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewsSection } from "@/components/reviews/reviews-section";
import {
  Building2,
  MapPin,
  Globe,
  Star,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Share2,
  Calendar,
  Users,
  Briefcase,
  ExternalLink,
  ShieldCheck,
  Heart,
  Bookmark,
  Search,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Mail,
  Sparkles,
  Award,
  Layers,
  Clock,
  Banknote,
  Edit3,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/companies/$slug")({ component: CompanyDetail });

function CompanyDetail() {
  const { slug } = Route.useParams();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState("overview");
  const [jobSearch, setJobSearch] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("all");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isSavingJob, setIsSavingJob] = useState<string | null>(null);

  // 1. Fetch company data (supporting both slug and UUID)
  const { data: company, isLoading: isCompanyLoading } = useQuery({
    queryKey: ["company", slug],
    queryFn: async () => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      if (isUuid) {
        const byId = await supabase.from("companies").select("*").eq("id", slug).maybeSingle();
        if (byId.data) return byId.data;
      }
      const bySlug = await supabase.from("companies").select("*").eq("slug", slug).maybeSingle();
      return bySlug.data;
    },
  });

  // 2. Fetch active jobs for this company
  const { data: jobs, isLoading: isJobsLoading } = useQuery({
    queryKey: ["company-jobs", company?.id],
    enabled: !!company?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("company_id", company!.id)
        .in("status", ["published", "active"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  // 3. Fetch reviews with joined reviewer public profile
  const { data: reviews, isLoading: isReviewsLoading } = useQuery({
    queryKey: ["company-reviews", company?.id],
    enabled: !!company?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select(
          "*, reviewer:profiles!reviews_reviewer_id_fkey(id, full_name, avatar_url, headline, current_position), replies:review_replies(*)" as any,
        )
        .eq("company_id", company!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as any) ?? [];
    },
  });

  // 4. Fetch follow state for current user
  const { data: isFollowing } = useQuery({
    queryKey: ["company-following", company?.id, user?.id],
    enabled: !!company?.id && !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("follows")
        .select("id")
        .eq("company_id", company!.id)
        .eq("follower_id", user!.id)
        .maybeSingle();
      return !!data;
    },
  });

  // 5. Fetch saved jobs for current user
  const { data: savedJobIds } = useQuery({
    queryKey: ["user-saved-jobs", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("saved_jobs").select("job_id").eq("user_id", user!.id);
      return new Set((data || []).map((s) => s.job_id));
    },
  });

  // Follow / Unfollow mutation
  const toggleFollow = useMutation({
    mutationFn: async () => {
      if (!user) {
        navigate({ to: "/auth", search: { mode: "signin", redirect: `/companies/${slug}` } });
        return;
      }
      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("company_id", company!.id)
          .eq("follower_id", user.id);
      } else {
        await supabase.from("follows").insert({
          company_id: company!.id,
          follower_id: user.id,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company-following", company?.id, user?.id] });
      toast.success(isFollowing ? "Unfollowed company" : "Following company!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update follow status");
    },
  });

  // Save Job handler
  const handleSaveJob = async (jobId: string) => {
    if (!user) {
      navigate({ to: "/auth", search: { mode: "signin", redirect: `/companies/${slug}` } });
      return;
    }
    setIsSavingJob(jobId);
    try {
      const isSaved = savedJobIds?.has(jobId);
      if (isSaved) {
        await supabase.from("saved_jobs").delete().eq("job_id", jobId).eq("user_id", user.id);
        toast.success("Job removed from saved");
      } else {
        await supabase.from("saved_jobs").insert({ job_id: jobId, user_id: user.id });
        toast.success("Job saved successfully");
      }
      await qc.invalidateQueries({ queryKey: ["user-saved-jobs", user.id] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update saved job");
    } finally {
      setIsSavingJob(null);
    }
  };

  const isOwner = Boolean(user?.id && company?.owner_id === user.id);
  const isVerified = Boolean(
    company?.is_verified ||
    (company as any)?.verified ||
    company?.verification_status === "verified",
  );

  // Review calculations
  const totalReviews = reviews?.length ?? 0;
  const avgRating = totalReviews
    ? Number(
        (reviews!.reduce((s: number, r: any) => s + (r.rating || 0), 0) / totalReviews).toFixed(1),
      )
    : 0;

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    let list = jobs ?? [];
    if (jobSearch.trim()) {
      const q = jobSearch.toLowerCase();
      list = list.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.location?.toLowerCase().includes(q) ||
          j.skills?.some((s) => s.toLowerCase().includes(q)),
      );
    }
    if (jobTypeFilter !== "all") {
      list = list.filter((j) => j.job_type === jobTypeFilter);
    }
    return list;
  }, [jobs, jobSearch, jobTypeFilter]);

  // Reply submission
  async function submitReply(reviewId: string, text: string) {
    if (!text.trim() || !user) return;
    const { error } = await supabase
      .from("review_replies" as any)
      .insert({ review_id: reviewId, author_id: user.id, content: text.trim() });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Company response posted");
    qc.invalidateQueries({ queryKey: ["company-reviews", company?.id] });
  }

  // Review submission
  async function submitReview(data: { rating: number; title: string; content: string }) {
    if (!user || !company) {
      toast.error("Please sign in to post a review");
      return;
    }
    if (!data.rating) {
      toast.error("Please select a rating");
      return;
    }
    setIsSubmittingReview(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        company_id: company.id,
        reviewer_id: user.id,
        rating: data.rating,
        title: data.title || "Review",
        content: data.content || null,
      });
      if (error) throw error;
      toast.success("Thank you for your authentic review!");
      await qc.invalidateQueries({ queryKey: ["company-reviews", company?.id] });
    } catch (err: any) {
      toast.error(err.message || "Failed to post review");
    } finally {
      setIsSubmittingReview(false);
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `${company?.name} on Jagire`,
          text: `Check out ${company?.name}'s profile and open positions on Jagire!`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Company link copied to clipboard!");
    }
  };

  if (isCompanyLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading company profile…</p>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center p-8 glass border-border/60">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h2 className="text-2xl font-bold mb-2">Company Not Found</h2>
            <p className="text-sm text-muted-foreground mb-6">
              The company profile you are looking for might have been moved, renamed, or is not
              publicly listed.
            </p>
            <Button asChild className="gradient-brand text-primary-foreground">
              <Link to="/companies">Explore All Companies</Link>
            </Button>
          </Card>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const companyInitials =
    company.name
      ?.trim()
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "CO";

  // Parse arrays safely
  const benefitsList = Array.isArray(company.benefits)
    ? (company.benefits as string[])
    : typeof company.benefits === "string"
      ? (company.benefits as string).split(",").map((s) => s.trim())
      : [];

  const techList = Array.isArray(company.technologies)
    ? (company.technologies as string[])
    : typeof company.technologies === "string"
      ? (company.technologies as string).split(",").map((s) => s.trim())
      : [];

  const locationsList = Array.isArray(company.locations)
    ? (company.locations as string[])
    : typeof company.locations === "string"
      ? (company.locations as string).split(",").map((s) => s.trim())
      : [];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />

      <main className="flex-1 pb-16">
        {/* ── 1. Hero / Header Banner ──────────────────────────────────────── */}
        <section className="relative">
          {/* Cover Image Banner */}
          <div className="h-44 sm:h-56 md:h-64 w-full bg-gradient-to-r from-primary/20 via-primary/10 to-card relative overflow-hidden border-b border-border/40">
            {company.banner_url ? (
              <img
                src={company.banner_url}
                alt={`${company.name} cover`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-card/60">
                <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
          </div>

          {/* Company Profile Header Info */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <div className="relative -mt-16 sm:-mt-20 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/40">
              {/* Logo & Identity */}
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-5">
                <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-card border-4 border-background shadow-xl flex items-center justify-center overflow-hidden shrink-0 relative group">
                  {company.logo_url ? (
                    <img
                      src={company.logo_url}
                      alt={company.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="text-3xl font-extrabold gradient-text">{companyInitials}</span>
                  )}
                </div>

                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
                      {company.name}
                    </h1>
                    {isVerified && (
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-0.5 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Verified Employer
                      </Badge>
                    )}
                  </div>

                  {company.tagline && (
                    <p className="text-sm sm:text-base text-muted-foreground line-clamp-2 max-w-2xl">
                      {company.tagline}
                    </p>
                  )}

                  {/* Metadata badges row */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap pt-1 text-xs text-muted-foreground">
                    {company.industry && (
                      <span className="inline-flex items-center gap-1 bg-muted/60 px-2.5 py-1 rounded-md text-foreground font-medium">
                        <Briefcase className="h-3 w-3 text-primary" />
                        {company.industry}
                      </span>
                    )}

                    {(company.headquarters || company.location) && (
                      <span className="inline-flex items-center gap-1 bg-muted/60 px-2.5 py-1 rounded-md text-foreground font-medium">
                        <MapPin className="h-3 w-3 text-primary" />
                        {company.headquarters || company.location}
                      </span>
                    )}

                    {(company.company_size || company.size) && (
                      <span className="inline-flex items-center gap-1 bg-muted/60 px-2.5 py-1 rounded-md text-foreground font-medium">
                        <Users className="h-3 w-3 text-primary" />
                        {company.company_size || company.size} employees
                      </span>
                    )}

                    {company.work_model && (
                      <span className="inline-flex items-center gap-1 bg-muted/60 px-2.5 py-1 rounded-md text-foreground font-medium">
                        <Layers className="h-3 w-3 text-primary" />
                        {company.work_model}
                      </span>
                    )}

                    {totalReviews > 0 && (
                      <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-md font-semibold">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {avgRating.toFixed(1)} ({totalReviews})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                {/* Follow Company */}
                <Button
                  variant={isFollowing ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => toggleFollow.mutate()}
                  disabled={toggleFollow.isPending}
                  className="gap-1.5 h-9"
                >
                  <Heart
                    className={`h-4 w-4 ${
                      isFollowing ? "fill-red-500 text-red-500" : "text-muted-foreground"
                    }`}
                  />
                  {isFollowing ? "Following" : "Follow"}
                </Button>

                {/* Visit Website */}
                {company.website && (
                  <Button asChild variant="outline" size="sm" className="gap-1.5 h-9">
                    <a
                      href={
                        company.website.startsWith("http")
                          ? company.website
                          : `https://${company.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Globe className="h-4 w-4 text-primary" />
                      <span>Website</span>
                      <ExternalLink className="h-3 w-3 opacity-60 ml-0.5" />
                    </a>
                  </Button>
                )}

                {/* Message Company / Contact Employer */}
                {user && company.owner_id && company.owner_id !== user.id && (
                  <Button asChild size="sm" className="gradient-brand text-primary-foreground h-9">
                    <Link to="/messages" search={{ with: company.owner_id }}>
                      <MessageSquare className="h-4 w-4 mr-1.5" />
                      Message Company
                    </Link>
                  </Button>
                )}

                {/* Owner 360 Intelligence & Edit Actions */}
                {(isOwner || role === "admin") && (
                  <>
                    <Button asChild variant="outline" size="sm" className="gap-1.5 h-9 shadow-sm">
                      <Link to="/employer/intelligence" search={{ companyId: company.id }}>
                        <TrendingUp className="h-3.5 w-3.5 text-primary" />
                        <span>360° Intelligence</span>
                      </Link>
                    </Button>
                    <Button asChild variant="secondary" size="sm" className="gap-1.5 h-9">
                      <Link to="/employer/company">
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit Profile</span>
                      </Link>
                    </Button>
                  </>
                )}

                {/* Share Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  className="h-9 w-9 text-muted-foreground hover:text-foreground"
                  aria-label="Share Company Profile"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. Credibility / Quick Facts Strip ───────────────────────────── */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-card border border-border/50 shadow-sm flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Briefcase className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-lg font-bold text-foreground">{jobs?.length ?? 0}</div>
                <div className="text-xs text-muted-foreground truncate">Open Positions</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-card border border-border/50 shadow-sm flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              </div>
              <div className="min-w-0">
                <div className="text-lg font-bold text-foreground">
                  {totalReviews > 0 ? `${avgRating.toFixed(1)} / 5.0` : "No ratings"}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {totalReviews} verified {totalReviews === 1 ? "review" : "reviews"}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-card border border-border/50 shadow-sm flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-lg font-bold text-foreground">
                  {company.founded_year || "Established"}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {company.founded_year ? "Founded Year" : "Organization"}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-card border border-border/50 shadow-sm flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-foreground truncate">
                  {isVerified ? "Verified Employer" : "Registered"}
                </div>
                <div className="text-xs text-muted-foreground truncate">Jagire Trust Checked</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. Tabs Navigation & Main Content ────────────────────────────── */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl pt-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="border-b border-border/50">
              <TabsList className="bg-transparent h-auto p-0 gap-6">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground rounded-none bg-transparent px-2 pb-3 font-semibold text-sm transition-all"
                >
                  About & Overview
                </TabsTrigger>
                <TabsTrigger
                  value="jobs"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground rounded-none bg-transparent px-2 pb-3 font-semibold text-sm transition-all flex items-center gap-1.5"
                >
                  <span>Jobs</span>
                  <Badge variant="secondary" className="text-[11px] px-1.5 py-0 h-4">
                    {jobs?.length ?? 0}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="reviews"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground rounded-none bg-transparent px-2 pb-3 font-semibold text-sm transition-all flex items-center gap-1.5"
                >
                  <span>Reviews</span>
                  {totalReviews > 0 && (
                    <Badge variant="secondary" className="text-[11px] px-1.5 py-0 h-4">
                      {totalReviews}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ── TAB 1: OVERVIEW ──────────────────────────────────────────── */}
            <TabsContent value="overview" className="space-y-6 focus-visible:outline-none">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Description, Mission, Culture, Perks */}
                <div className="lg:col-span-8 space-y-6">
                  {/* About Company Description */}
                  <Card className="glass border-border/50 shadow-card-soft">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <h2 className="text-lg font-bold text-foreground">About {company.name}</h2>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {company.description ||
                          `${company.name} is a leading organization in the ${company.industry || "professional"} sector committed to innovation, quality, and community.`}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Mission & Vision Cards */}
                  {(company.mission || company.vision) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {company.mission && (
                        <Card className="glass border-border/50 shadow-sm">
                          <CardContent className="p-5 space-y-2">
                            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                              <Award className="h-4 w-4" />
                              <span>Our Mission</span>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                              {company.mission}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                      {company.vision && (
                        <Card className="glass border-border/50 shadow-sm">
                          <CardContent className="p-5 space-y-2">
                            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                              <Sparkles className="h-4 w-4" />
                              <span>Our Vision</span>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                              {company.vision}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* Culture & Values */}
                  {(company as any).culture && (
                    <Card className="glass border-border/50 shadow-sm">
                      <CardContent className="p-6 space-y-3">
                        <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          Workplace Culture & Values
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                          {typeof (company as any).culture === "string"
                            ? (company as any).culture
                            : JSON.stringify((company as any).culture)}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Benefits & Perks */}
                  {benefitsList.length > 0 && (
                    <Card className="glass border-border/50 shadow-sm">
                      <CardContent className="p-6 space-y-4">
                        <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          Benefits & Workplace Perks
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {benefitsList.map((benefit, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 text-xs sm:text-sm p-2.5 rounded-lg bg-muted/40 border border-border/40"
                            >
                              <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                              <span className="text-foreground/90">{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Tech Stack */}
                  {techList.length > 0 && (
                    <Card className="glass border-border/50 shadow-sm">
                      <CardContent className="p-6 space-y-3">
                        <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                          <Layers className="h-4 w-4 text-primary" />
                          Technologies & Tools Used
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {techList.map((tech, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs px-2.5 py-1 bg-background/50 border-border/70"
                            >
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Hiring Process */}
                  {(company as any).hiring_process && (
                    <Card className="glass border-border/50 shadow-sm">
                      <CardContent className="p-6 space-y-3">
                        <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          Hiring Process
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                          {typeof (company as any).hiring_process === "string"
                            ? (company as any).hiring_process
                            : JSON.stringify((company as any).hiring_process)}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Right Column: Key Details, Social Links, Locations, Contact */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Company Summary Card */}
                  <Card className="glass border-border/50 shadow-card-soft">
                    <CardContent className="p-5 space-y-4">
                      <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">
                        Company Details
                      </h3>

                      <div className="space-y-3 text-xs sm:text-sm divide-y divide-border/40">
                        {company.industry && (
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-muted-foreground">Industry</span>
                            <span className="font-medium text-foreground text-right">
                              {company.industry}
                            </span>
                          </div>
                        )}

                        {(company.company_size || company.size) && (
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-muted-foreground">Company Size</span>
                            <span className="font-medium text-foreground text-right">
                              {company.company_size || company.size}
                            </span>
                          </div>
                        )}

                        {company.founded_year && (
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-muted-foreground">Founded</span>
                            <span className="font-medium text-foreground text-right">
                              {company.founded_year}
                            </span>
                          </div>
                        )}

                        {(company.headquarters || company.location) && (
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-muted-foreground">Headquarters</span>
                            <span className="font-medium text-foreground text-right">
                              {company.headquarters || company.location}
                            </span>
                          </div>
                        )}

                        {company.work_model && (
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-muted-foreground">Work Model</span>
                            <span className="font-medium text-foreground text-right">
                              {company.work_model}
                            </span>
                          </div>
                        )}

                        {company.website && (
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-muted-foreground">Website</span>
                            <a
                              href={
                                company.website.startsWith("http")
                                  ? company.website
                                  : `https://${company.website}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-primary hover:underline truncate max-w-[160px]"
                            >
                              {company.website.replace(/^https?:\/\//, "")}
                            </a>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Multiple Locations (if present) */}
                  {locationsList.length > 0 && (
                    <Card className="glass border-border/50 shadow-sm">
                      <CardContent className="p-5 space-y-3">
                        <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          Office Locations
                        </h4>
                        <ul className="space-y-1.5 text-xs text-foreground">
                          {locationsList.map((loc, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                              <span>{loc}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Social Media Links */}
                  {(company.linkedin_url ||
                    company.twitter_url ||
                    company.facebook_url ||
                    company.instagram_url) && (
                    <Card className="glass border-border/50 shadow-sm">
                      <CardContent className="p-5 space-y-3">
                        <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                          Social Media
                        </h4>
                        <div className="flex items-center gap-2 flex-wrap">
                          {company.linkedin_url && (
                            <a
                              href={company.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-9 w-9 rounded-lg border border-border/60 bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-blue-500 hover:border-blue-500/40 transition-colors"
                              aria-label="LinkedIn"
                            >
                              <Linkedin className="h-4 w-4" />
                            </a>
                          )}
                          {company.twitter_url && (
                            <a
                              href={company.twitter_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-9 w-9 rounded-lg border border-border/60 bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-sky-500 hover:border-sky-500/40 transition-colors"
                              aria-label="Twitter / X"
                            >
                              <Twitter className="h-4 w-4" />
                            </a>
                          )}
                          {company.facebook_url && (
                            <a
                              href={company.facebook_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-9 w-9 rounded-lg border border-border/60 bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-blue-600 hover:border-blue-600/40 transition-colors"
                              aria-label="Facebook"
                            >
                              <Facebook className="h-4 w-4" />
                            </a>
                          )}
                          {company.instagram_url && (
                            <a
                              href={company.instagram_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-9 w-9 rounded-lg border border-border/60 bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-pink-500 hover:border-pink-500/40 transition-colors"
                              aria-label="Instagram"
                            >
                              <Instagram className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Public HR / Candidate Inquiries (Safe) */}
                  {company.hr_contact_email && (
                    <Card className="glass border-border/50 shadow-sm">
                      <CardContent className="p-5 space-y-2">
                        <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-primary" />
                          Candidate Inquiries
                        </h4>
                        {company.hr_contact_name && (
                          <p className="text-xs font-medium text-foreground">
                            {company.hr_contact_name}
                          </p>
                        )}
                        <a
                          href={`mailto:${company.hr_contact_email}`}
                          className="text-xs text-primary hover:underline block truncate"
                        >
                          {company.hr_contact_email}
                        </a>
                      </CardContent>
                    </Card>
                  )}

                  {/* Credibility Notice */}
                  <div className="p-4 rounded-xl border border-border/50 bg-card/40 text-xs text-muted-foreground space-y-1.5">
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      <span>Jagire Platform Verified</span>
                    </div>
                    <p className="leading-relaxed">
                      This company profile is authenticated by the employer and monitored by Jagire
                      to ensure genuine job opportunities and authentic workplace reviews.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── TAB 2: JOBS ─────────────────────────────────────────────── */}
            <TabsContent value="jobs" className="space-y-6 focus-visible:outline-none">
              {/* Jobs Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl glass border border-border/50">
                <div className="flex items-center gap-2 w-full sm:w-80 bg-background/80 border border-border/60 rounded-lg px-3 py-1.5">
                  <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    placeholder="Search roles at this company…"
                    value={jobSearch}
                    onChange={(e) => setJobSearch(e.target.value)}
                    className="border-0 bg-transparent p-0 h-auto text-xs focus-visible:ring-0 shadow-none"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={jobTypeFilter}
                    onChange={(e) => setJobTypeFilter(e.target.value)}
                    className="rounded-lg border border-border/60 bg-background/80 px-3 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
                  >
                    <option value="all">All Employment Types</option>
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                    <option value="freelance">Freelance</option>
                  </select>
                </div>
              </div>

              {/* Jobs List */}
              {isJobsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse h-28 bg-muted/40" />
                  ))}
                </div>
              ) : filteredJobs.length > 0 ? (
                <div className="space-y-3.5">
                  {filteredJobs.map((job) => {
                    const isSaved = savedJobIds?.has(job.id);
                    const formattedSalary =
                      job.salary_min && job.salary_max
                        ? `Rs. ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
                        : job.salary_min
                          ? `From Rs. ${job.salary_min.toLocaleString()}`
                          : null;

                    const formattedDeadline = job.application_deadline
                      ? new Date(job.application_deadline).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : null;

                    return (
                      <Card
                        key={job.id}
                        className="glass border-border/50 hover:border-primary/40 transition-all duration-200 shadow-card-soft group"
                      >
                        <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-2 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link
                                to="/jobs/$jobId"
                                params={{ jobId: job.id }}
                                className="font-bold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors truncate"
                              >
                                {job.title}
                              </Link>
                              {job.is_featured && (
                                <Badge className="gradient-brand text-primary-foreground text-[10px] px-2 py-0">
                                  Featured
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                              {job.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5 text-primary/70" />
                                  {job.location}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Briefcase className="h-3.5 w-3.5 text-primary/70" />
                                {String(job.job_type).replace("_", " ")}
                              </span>
                              {job.experience_level && (
                                <span className="capitalize">{job.experience_level} Level</span>
                              )}
                              {formattedSalary && (
                                <span className="flex items-center gap-1 text-foreground font-medium">
                                  <Banknote className="h-3.5 w-3.5 text-emerald-500" />
                                  {formattedSalary}
                                </span>
                              )}
                            </div>

                            {/* Skills badges */}
                            {job.skills && job.skills.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                {job.skills.slice(0, 4).map((skill, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className="text-[10px] px-2 py-0 font-normal bg-background/50"
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                                {job.skills.length > 4 && (
                                  <span className="text-[10px] text-muted-foreground">
                                    +{job.skills.length - 4} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                            {formattedDeadline && (
                              <span className="text-[11px] text-muted-foreground">
                                Apply by {formattedDeadline}
                              </span>
                            )}

                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSaveJob(job.id)}
                                disabled={isSavingJob === job.id}
                                className="h-9 w-9 text-muted-foreground hover:text-foreground"
                                aria-label="Save Job"
                              >
                                <Bookmark
                                  className={`h-4 w-4 ${
                                    isSaved ? "fill-primary text-primary" : "text-muted-foreground"
                                  }`}
                                />
                              </Button>

                              <Button
                                asChild
                                size="sm"
                                className="gradient-brand text-primary-foreground h-9 shadow-sm"
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
                  <CardContent className="p-12 text-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                      <Briefcase className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-base text-foreground">
                      {jobSearch || jobTypeFilter !== "all"
                        ? "No matching jobs found"
                        : "No current openings at this time"}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                      {jobSearch || jobTypeFilter !== "all"
                        ? "Try adjusting your search criteria or clearing filters to see all available roles."
                        : "Follow this company to get notified as soon as new career opportunities are posted."}
                    </p>
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleFollow.mutate()}
                        className="gap-1.5"
                      >
                        <Heart className="h-3.5 w-3.5 text-red-500" />
                        {isFollowing ? "Following Company" : "Follow for Job Alerts"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── TAB 3: REVIEWS ──────────────────────────────────────────── */}
            <TabsContent value="reviews" className="focus-visible:outline-none">
              <ReviewsSection
                reviews={reviews as any}
                companyName={company.name}
                isCompanyOwner={isOwner}
                onSubmitReview={submitReview}
                onReplyReview={submitReply}
                isSubmitting={isSubmittingReview}
              />
            </TabsContent>
          </Tabs>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
