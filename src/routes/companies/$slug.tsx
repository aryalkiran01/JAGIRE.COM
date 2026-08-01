/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Building2, MapPin, Globe, Star, MessageSquare, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/companies/$slug")({ component: CompanyDetail });

function CompanyDetail() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: company } = useQuery({
    queryKey: ["company", slug],
    queryFn: async () =>
      (await supabase.from("companies").select("*").eq("slug", slug).maybeSingle()).data,
  });
  const { data: jobs } = useQuery({
    queryKey: ["company-jobs", company?.id],
    enabled: !!company?.id,
    queryFn: async () =>
      (
        await supabase
          .from("jobs")
          .select("*")
          .eq("company_id", company!.id)
          .in("status", ["published", "active"])
          .order("created_at", { ascending: false })
      ).data ?? [],
  });
  const { data: reviews } = useQuery({
    queryKey: ["company-reviews", company?.id],
    enabled: !!company?.id,
    queryFn: async () =>
      (
        await supabase
          .from("reviews")
          .select(
            "*, reviewer:profiles!reviews_reviewer_id_fkey(full_name, avatar_url), replies:review_replies(*)" as any,
          )
          .eq("company_id", company!.id)
          .order("created_at", { ascending: false })
      ).data ?? [],
  });
  const isOwner = user?.id && (company as any)?.owner_id === user.id;
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  async function submitReply(reviewId: string) {
    const text = (replyDrafts[reviewId] ?? "").trim();
    if (!text) return;
    const { error } = await supabase
      .from("review_replies" as any)
      .insert({ review_id: reviewId, author_id: user!.id, content: text });
    if (error) return toast.error(error.message);
    setReplyDrafts((d) => ({ ...d, [reviewId]: "" }));
    qc.invalidateQueries({ queryKey: ["company-reviews"] });
  }

  const avg = reviews?.length
    ? (reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  async function submitReview() {
    if (!user || !company) return toast.error("Sign in to review");
    if (!rating) return;
    const { error } = await supabase.from("reviews").insert({
      company_id: company.id,
      reviewer_id: user.id,
      rating,
      title: title || "Review",
      content: content || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Review posted");
    setTitle("");
    setContent("");
    qc.invalidateQueries({ queryKey: ["company-reviews"] });
  }

  if (!company)
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card className="mb-6">
          <CardContent className="p-8">
            <div className="flex items-start gap-6">
              <div className="h-24 w-24 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                {company.logo_url ? (
                  <img src={company.logo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-12 w-12" />
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold">{company.name}</h1>
                <p className="text-muted-foreground">{company.tagline}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {company.industry && <Badge variant="secondary">{company.industry}</Badge>}
                  {company.headquarters && (
                    <Badge variant="secondary">
                      <MapPin className="mr-1 h-3 w-3" />
                      {company.headquarters}
                    </Badge>
                  )}
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener"
                      className="text-xs text-primary flex items-center gap-1"
                    >
                      <Globe className="h-3 w-3" />
                      Website
                    </a>
                  )}
                  {avg && (
                    <Badge className="gradient-brand text-primary-foreground">
                      <Star className="mr-1 h-3 w-3" />
                      {avg} ({reviews!.length})
                    </Badge>
                  )}
                </div>
                {user && (company as any).owner_id && (company as any).owner_id !== user.id && (
                  <Button asChild size="sm" variant="outline" className="mt-3">
                    <Link to="/messages" search={{ with: (company as any).owner_id }}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Message company
                    </Link>
                  </Button>
                )}
              </div>
            </div>
            {company.description && <p className="mt-6 text-sm">{company.description}</p>}
            {(company as any).verified && (
              <Badge className="mt-3 gradient-brand text-primary-foreground">✓ Verified</Badge>
            )}
            <div className="grid md:grid-cols-2 gap-4 mt-4 text-sm">
              {(company as any).mission && (
                <div>
                  <div className="font-semibold">Mission</div>
                  <p className="text-muted-foreground">{(company as any).mission}</p>
                </div>
              )}
              {(company as any).vision && (
                <div>
                  <div className="font-semibold">Vision</div>
                  <p className="text-muted-foreground">{(company as any).vision}</p>
                </div>
              )}
              {(company as any).culture && (
                <div>
                  <div className="font-semibold">Culture</div>
                  <p className="text-muted-foreground">{(company as any).culture}</p>
                </div>
              )}
              {(company as any).hiring_process && (
                <div>
                  <div className="font-semibold">Hiring process</div>
                  <p className="text-muted-foreground">{(company as any).hiring_process}</p>
                </div>
              )}
            </div>
            {((company as any).benefits?.length ?? 0) > 0 && (
              <div className="mt-4">
                <div className="font-semibold text-sm mb-1">Benefits</div>
                <div className="flex flex-wrap gap-1">
                  {(company as any).benefits.map((b: string) => (
                    <Badge key={b} variant="secondary">
                      {b}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {((company as any).technologies?.length ?? 0) > 0 && (
              <div className="mt-3">
                <div className="font-semibold text-sm mb-1">Technologies</div>
                <div className="flex flex-wrap gap-1">
                  {(company as any).technologies.map((b: string) => (
                    <Badge key={b} variant="outline">
                      {b}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <h2 className="text-2xl font-bold mb-4">Open positions ({jobs?.length ?? 0})</h2>
        <div className="grid gap-3">
          {jobs?.map((j) => (
            <Card key={j.id} className="hover:shadow-glow transition">
              <CardContent className="p-4 flex items-center gap-4">
                <Link to="/jobs/$jobId" params={{ jobId: j.id }} className="flex-1 min-w-0">
                  <div className="font-semibold">{j.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {j.location} · {String(j.job_type).replace("_", " ")}
                  </div>
                </Link>
                <Button
                  asChild
                  size="sm"
                  className="gradient-brand text-primary-foreground shrink-0"
                >
                  <Link to="/jobs/$jobId" params={{ jobId: j.id }}>
                    Apply <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
          {jobs && jobs.length === 0 && (
            <p className="text-sm text-muted-foreground">No open positions right now.</p>
          )}
        </div>

        <h2 className="text-2xl font-bold mt-10 mb-4">Reviews</h2>
        {user && (
          <Card className="mb-4">
            <CardContent className="p-6 space-y-3">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setRating(n)} type="button">
                    <Star
                      className={`h-6 w-6 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
                    />
                  </button>
                ))}
              </div>
              <Input
                placeholder="Title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Textarea
                rows={3}
                placeholder="Share your experience…"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <Button onClick={submitReview} className="gradient-brand text-primary-foreground">
                Post review
              </Button>
            </CardContent>
          </Card>
        )}
        <div className="space-y-3">
          {reviews?.map((r: any) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-medium text-sm">{r.reviewer?.full_name ?? "Anonymous"}</div>
                  <div className="flex">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                {r.title && <div className="font-semibold">{r.title}</div>}
                {r.content && <div className="text-sm text-muted-foreground">{r.content}</div>}
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(r.created_at).toLocaleDateString()}
                </div>
                {(r.replies ?? []).map((rep: any) => (
                  <div key={rep.id} className="mt-3 ml-4 border-l-2 border-primary pl-3">
                    <div className="text-xs font-semibold text-primary">Company response</div>
                    <div className="text-sm">{rep.content}</div>
                  </div>
                ))}
                {isOwner && !r.replies?.length && (
                  <div className="mt-3 flex gap-2">
                    <Input
                      placeholder="Reply as company…"
                      value={replyDrafts[r.id] ?? ""}
                      onChange={(e) => setReplyDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                    />
                    <Button size="sm" onClick={() => submitReply(r.id)}>
                      Reply
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {!reviews?.length && <p className="text-sm text-muted-foreground">No reviews yet.</p>}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
