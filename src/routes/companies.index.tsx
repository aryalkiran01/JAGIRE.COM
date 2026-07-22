/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SkeletonCard } from "@/components/ui/skeleton-loader";
import { Building2, Search, Star, Users, TrendingUp, MapPin, Briefcase, ArrowRight, ListFilter as Filter, Globe, Heart } from "lucide-react";

export const Route = createFileRoute("/companies/")({ component: Companies });

function Companies() {
  const [q, setQ] = useState("");
  const [industry, setIndustry] = useState("all");
  const [sort, setSort] = useState("recent");

  const { data: companies, isLoading } = useQuery({
    queryKey: ["companies-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: jobCounts } = useQuery({
    queryKey: ["company-job-counts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("jobs")
        .select("company_id")
        .eq("status", "active");
      const counts: Record<string, number> = {};
      for (const j of data ?? []) {
        counts[j.company_id] = (counts[j.company_id] ?? 0) + 1;
      }
      return counts;
    },
  });

  const industries = useMemo(() => {
    const set = new Set<string>();
    companies?.forEach((c) => c.industry && set.add(c.industry));
    return ["all", ...Array.from(set).sort()];
  }, [companies]);

  const filtered = useMemo(() => {
    let list = companies ?? [];
    if (q) {
      const ql = q.toLowerCase();
      list = list.filter(
        (c) =>
          c.name?.toLowerCase().includes(ql) ||
          c.description?.toLowerCase().includes(ql) ||
          c.industry?.toLowerCase().includes(ql) ||
          c.tagline?.toLowerCase().includes(ql),
      );
    }
    if (industry !== "all") {
      list = list.filter((c) => c.industry === industry);
    }
    if (sort === "name") {
      list = [...list].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
    } else if (sort === "jobs") {
      list = [...list].sort(
        (a, b) => (jobCounts?.[b.id] ?? 0) - (jobCounts?.[a.id] ?? 0),
      );
    }
    return list;
  }, [companies, q, industry, sort, jobCounts]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero header */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full gradient-brand opacity-15 blur-3xl" />
        <div className="container relative mx-auto px-4 py-16">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="mb-4 glass">
              <Building2 className="mr-1.5 h-3 w-3" /> Companies
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              Discover <span className="gradient-text">companies hiring</span> now
            </h1>
            <p className="text-muted-foreground text-lg">
              Browse top employers, see open roles, and find your next team.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Search & filters */}
        <div className="glass rounded-2xl p-4 mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex items-center gap-2 flex-1 rounded-lg border bg-background px-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies by name, industry, or keyword…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="border-0 bg-transparent focus-visible:ring-0 shadow-none"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="rounded-lg border bg-background px-3 py-2 text-sm"
              >
                {industries.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind === "all" ? "All industries" : ind}
                  </option>
                ))}
              </select>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="recent">Most recent</option>
                <option value="name">Name (A-Z)</option>
                <option value="jobs">Most jobs</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            Showing {filtered.length} {filtered.length === 1 ? "company" : "companies"}
          </div>
        </div>

        {/* Company grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((c: any, i: number) => (
              <Link key={c.id} to="/companies/$slug" params={{ slug: c.slug }}>
                <Card
                  className="h-full hover:shadow-glow hover:-translate-y-1 transition-all cursor-pointer animate-fade-in-up group overflow-hidden"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {/* Banner */}
                  <div className="h-24 gradient-hero relative overflow-hidden">
                    <div className="absolute inset-0 gradient-brand opacity-30" />
                    {c.banner_url && (
                      <img
                        src={c.banner_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <CardContent className="p-6 pt-0">
                    {/* Logo */}
                    <div className="h-14 w-14 rounded-xl bg-background border-4 border-background flex items-center justify-center overflow-hidden -mt-8 mb-3 shadow-card-soft relative">
                      {c.logo_url ? (
                        <img src={c.logo_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Building2 className="h-7 w-7 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-lg group-hover:gradient-text transition-all">
                        {c.name}
                      </h3>
                      {c.rating && (
                        <div className="flex items-center gap-0.5 text-sm">
                          <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                          <span className="font-medium">{c.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {c.industry && <Badge variant="secondary">{c.industry}</Badge>}
                      {c.size && <Badge variant="outline">{c.size}</Badge>}
                      {c.location && (
                        <Badge variant="outline">
                          <MapPin className="mr-1 h-3 w-3" />
                          {c.location}
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {c.tagline ?? c.description ?? "Innovating in their space."}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5" />
                          {jobCounts?.[c.id] ?? 0} jobs
                        </span>
                        {c.employee_count && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {c.employee_count}
                          </span>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-16 text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-semibold text-lg mb-1">No companies found</h3>
              <p className="text-muted-foreground text-sm">
                {q || industry !== "all"
                  ? "Try adjusting your search or filters."
                  : "No companies have been added yet."}
              </p>
              {(q || industry !== "all") && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setQ("");
                    setIndustry("all");
                  }}
                >
                  Clear filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
