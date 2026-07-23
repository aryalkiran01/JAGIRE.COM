/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  MapPin,
  Briefcase,
  Sparkles,
  Target,
  Users,
  TrendingUp,
  Building2,
  ArrowRight,
  Star,
  ScanText,
  FileText,
  Video,
  Rocket,
  ShieldCheck,
  Zap,
  Globe,
  CircleCheck as CheckCircle2,
  Quote,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const [q, setQ] = useState("");

  const { data: featuredJobs } = useQuery({
    queryKey: ["featured-jobs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("jobs")
        .select(
          "id, title, slug, location, job_type, salary_min, salary_max, company:companies(id, name, slug, logo_url)",
        )
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["home-categories"],
    queryFn: async () => (await supabase.from("categories").select("*").limit(10)).data ?? [],
  });

  const { data: stats } = useQuery({
    queryKey: ["home-stats"],
    queryFn: async () => {
      const [{ count: jobs }, { count: companies }, { count: users }] = await Promise.all([
        supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("companies").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
      ]);
      return { jobs: jobs ?? 0, companies: companies ?? 0, users: users ?? 0 };
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10" />
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full gradient-brand opacity-20 blur-3xl animate-float" />
        <div
          className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-accent opacity-20 blur-3xl animate-float"
          style={{ animationDelay: "1.5s" }}
        />

        <div className="container relative mx-auto px-4 py-24 md:py-36">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6 glass animate-fade-in">
              <Sparkles className="mr-1.5 h-3 w-3" /> AI-powered matching engine
            </Badge>
            <h1 className="mb-6 text-5xl font-extrabold tracking-tight md:text-7xl animate-fade-in-up">
              Find your <span className="gradient-text">dream career</span>
              <br />
              with AI precision
            </h1>
            <p className="mb-10 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto animate-fade-in-up stagger-1">
              Upload your resume, get instant AI scoring, and match with jobs tailored to your
              skills, experience, and ambitions.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                window.location.href = `/jobs?q=${encodeURIComponent(q)}`;
              }}
              className="glass mx-auto max-w-2xl rounded-2xl p-2 flex items-center gap-2 shadow-glow animate-scale-in"
            >
              <div className="flex items-center flex-1 gap-2 px-3">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Job title, skill, or company"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="border-0 bg-transparent focus-visible:ring-0 shadow-none text-base"
                />
              </div>
              <Button type="submit" className="gradient-brand text-primary-foreground">
                Search <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 flex flex-wrap justify-center gap-2 animate-fade-in stagger-2">
              {["Remote", "Engineering", "Design", "Marketing", "Product", "Data Science"].map(
                (tag) => (
                  <Link key={tag} to="/jobs" search={{ q: tag }}>
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-muted transition-colors"
                    >
                      {tag}
                    </Badge>
                  </Link>
                ),
              )}
            </div>

            <div className="mt-16 grid grid-cols-3 gap-8 max-w-xl mx-auto">
              <StatCard value={stats?.jobs ?? 0} label="Active jobs" icon={Briefcase} />
              <StatCard value={stats?.companies ?? 0} label="Companies" icon={Building2} />
              <StatCard value={stats?.users ?? 0} label="Candidates" icon={Users} />
            </div>
          </div>
        </div>
      </section>

      {/* AI Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-4">
            <Zap className="mr-1 h-3 w-3" /> Features
          </Badge>
          <h2 className="text-4xl font-bold mb-3">Powered by AI, built for humans</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Every feature designed to accelerate your journey from resume to offer
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={ScanText}
            title="AI Resume Scanner"
            desc="Upload your CV and get instant scoring across ATS compatibility, grammar, formatting, keywords, and professionalism."
            to="/resume-scanner"
          />
          <FeatureCard
            icon={Target}
            title="Smart Job Matching"
            desc="Our AI ranks every job by fit — skills, experience, location, salary — so you focus on opportunities that matter."
            to="/jobs"
          />
          <FeatureCard
            icon={Video}
            title="Interview Prep"
            desc="AI-generated interview questions, scheduling, and Google Meet integration for seamless interviews."
            to="/interviews"
          />
          <FeatureCard
            icon={FileText}
            title="Resume Builder"
            desc="Create polished, ATS-friendly resumes with our drag-and-drop builder and professional templates."
            to="/resume-builder"
          />
          <FeatureCard
            icon={TrendingUp}
            title="Career Roadmap"
            desc="Personalized paths, certifications, and trending skills to help you grow into your next role."
            to="/resume-scanner"
          />
          <FeatureCard
            icon={Rocket}
            title="Referrals & Rewards"
            desc="Refer friends to jobs and earn rewards. Build your network while helping others succeed."
            to="/referrals"
          />
        </div>
      </section>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="container mx-auto px-4 py-20">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold">Explore by category</h2>
              <p className="text-muted-foreground">Discover roles across every industry</p>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/jobs">
                All jobs <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {categories.map((c, i) => (
              <Link key={c.id} to="/jobs" search={{ category: c.slug }}>
                <Card className="hover:shadow-glow hover:-translate-y-1 transition-all cursor-pointer animate-fade-in-up">
                  <CardContent className="p-6 text-center">
                    <div className="h-12 w-12 rounded-xl gradient-brand mx-auto mb-3 flex items-center justify-center shadow-glow">
                      <Briefcase className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="font-semibold text-sm">{c.name}</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured jobs */}
      <section className="container mx-auto px-4 py-20">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold">Featured opportunities</h2>
            <p className="text-muted-foreground">Fresh roles from top companies</p>
          </div>
          <Button variant="ghost" asChild>
            <Link to="/jobs">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        {featuredJobs && featuredJobs.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredJobs.map((job: any, i: number) => (
              <Link key={job.id} to="/jobs/$jobId" params={{ jobId: job.id }}>
                <Card className="h-full hover:shadow-glow hover:-translate-y-1 transition-all cursor-pointer animate-fade-in-up">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                        {job.company?.logo_url ? (
                          <img
                            src={job.company.logo_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{job.title}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {job.company?.name}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {job.location && (
                        <Badge variant="secondary">
                          <MapPin className="mr-1 h-3 w-3" />
                          {job.location}
                        </Badge>
                      )}
                      <Badge variant="secondary">{String(job.job_type).replace("_", " ")}</Badge>
                      {job.salary_min && (
                        <Badge variant="outline">${Math.round(job.salary_min / 1000)}k+</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              No jobs posted yet.{" "}
              <Link to="/auth" className="text-primary font-medium">
                Sign up as an employer
              </Link>{" "}
              to be the first!
            </CardContent>
          </Card>
        )}
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold mb-3">How it works</h2>
          <p className="text-muted-foreground text-lg">Three steps to your next role</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <StepCard
            step={1}
            icon={ScanText}
            title="Upload your resume"
            desc="Drop your CV and our AI instantly scores it across ATS compatibility, keywords, and formatting."
          />
          <StepCard
            step={2}
            icon={Target}
            title="Get matched"
            desc="Our AI ranks every open role by your fit — skills, experience, location, and salary."
          />
          <StepCard
            step={3}
            icon={CheckCircle2}
            title="Apply & interview"
            desc="Apply with one click, schedule interviews, and join via Google Meet — all in one place."
          />
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-4">
            <Star className="mr-1 h-3 w-3 fill-accent text-accent" /> Testimonials
          </Badge>
          <h2 className="text-4xl font-bold mb-3">Loved by professionals worldwide</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <Card
              key={i}
              className="glass hover:shadow-card-soft transition-all animate-fade-in-up"
            >
              <CardContent className="p-6">
                <Quote className="h-8 w-8 text-primary/20 mb-3" />
                <div className="flex mb-3">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-sm mb-4 leading-relaxed">{t.quote}</p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="gradient-brand text-primary-foreground">
                      {t.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Trust badges */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <TrustBadge icon={ShieldCheck} title="Secure & Private" desc="Your data is encrypted" />
          <TrustBadge icon={Globe} title="Global Reach" desc="Jobs from 50+ countries" />
          <TrustBadge icon={Zap} title="AI-Powered" desc="Smart matching engine" />
          <TrustBadge icon={Users} title="10k+ Users" desc="Growing community" />
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="glass rounded-3xl p-12 md:p-16 text-center gradient-hero shadow-glow relative overflow-hidden">
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full gradient-brand opacity-30 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-accent opacity-30 blur-3xl" />
          <div className="relative">
            <h2 className="text-4xl font-bold mb-4 text-primary-foreground">
              Ready to accelerate your career?
            </h2>
            <p className="text-primary-foreground/90 mb-8 text-lg max-w-xl mx-auto">
              Join thousands using AI to land better roles, faster.
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/auth" search={{ mode: "signup" }}>
                  Get started free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="bg-transparent border-white text-white hover:bg-white/10"
              >
                <Link to="/employer">Hire talent</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function StatCard({ value, label, icon: Icon }: { value: number; label: string; icon: any }) {
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold gradient-text">{value.toLocaleString()}+</div>
      <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
  to,
}: {
  icon: any;
  title: string;
  desc: string;
  to: string;
}) {
  return (
    <Link to={to}>
      <Card className="glass hover:shadow-glow hover:-translate-y-1 transition-all h-full group">
        <CardContent className="p-8">
          <div className="h-14 w-14 rounded-2xl gradient-brand mb-5 flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
            <Icon className="h-7 w-7 text-primary-foreground" />
          </div>
          <h3 className="font-bold text-xl mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
          <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            Learn more <ArrowRight className="ml-1 h-3 w-3" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function StepCard({
  step,
  icon: Icon,
  title,
  desc,
}: {
  step: number;
  icon: any;
  title: string;
  desc: string;
}) {
  return (
    <div className="relative">
      <div className="absolute -top-4 -left-4 h-12 w-12 rounded-full gradient-brand flex items-center justify-center text-primary-foreground font-bold text-lg shadow-glow">
        {step}
      </div>
      <Card className="glass h-full">
        <CardContent className="p-8 pt-10">
          <Icon className="h-8 w-8 text-primary mb-4" />
          <h3 className="font-bold text-lg mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function TrustBadge({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}

const TESTIMONIALS = [
  {
    name: "Nabin Pun",
    role: "Senior Engineer at Stripe",
    quote: "The AI resume feedback was uncannily accurate. Landed 3 offers in a month.",
  },
  {
    name: "Kushal Thapa",
    role: "Product Manager",
    quote: "Job matching actually works — every recommendation felt hand-picked for me.",
  },
  {
    name: "Rohit Neupane",
    role: "Talent Lead",
    quote: "As an employer, the candidate ranking cut our hiring time in half.",
  },
];
