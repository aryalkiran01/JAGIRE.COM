import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sparkles,
  Target,
  Eye,
  Rocket,
  Users,
  Building2,
  Zap,
  ShieldCheck,
  Globe,
  Heart,
  TrendingUp,
  Award,
  ArrowRight,
  Quote,
  Star,
  Briefcase,
  ScanText,
  Video,
  FileText,
} from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Jagire" },
      {
        name: "description",
        content: "Jagire is an AI-powered job portal built to make hiring human again.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 gradient-hero opacity-10" />
        <div className="absolute -top-20 -left-20 h-96 w-96 rounded-full gradient-brand opacity-20 blur-3xl animate-float" />
        <div
          className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-accent opacity-20 blur-3xl animate-float"
          style={{ animationDelay: "1s" }}
        />
        <div className="container relative mx-auto px-4 text-center max-w-4xl">
          <Badge variant="secondary" className="mb-6 glass animate-fade-in">
            <Sparkles className="mr-1.5 h-3 w-3" /> Our story
          </Badge>
          <h1 className="text-5xl font-extrabold tracking-tight md:text-6xl mb-6 animate-fade-in-up">
            Making hiring <span className="gradient-text">human again</span>
          </h1>
          <p className="text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto animate-fade-in-up stagger-1">
            Jagire is an AI-first job portal built to make finding great work — and great people —
            feel effortless. We combine intelligent resume analysis, smart job matching, and
            real-time collaboration to shorten the gap between talent and opportunity.
          </p>
          <div className="mt-8 flex justify-center gap-3 animate-fade-in-up stagger-2">
            <Button className="gradient-brand text-primary-foreground" asChild>
              <Link to="/auth" search={{ mode: "signup" }}>
                Join Jagire <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/jobs">Browse jobs</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatBox icon={Briefcase} value="5,000+" label="Active jobs" />
          <StatBox icon={Building2} value="500+" label="Companies" />
          <StatBox icon={Users} value="10,000+" label="Candidates" />
          <StatBox icon={Award} value="98%" label="Match accuracy" />
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="glass hover:shadow-card-soft transition-all animate-fade-in-up">
            <CardContent className="p-8">
              <div className="h-14 w-14 rounded-2xl gradient-brand mb-5 flex items-center justify-center shadow-glow">
                <Target className="h-7 w-7 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Our mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                Empower every candidate and employer with tools that used to require expensive
                recruiters and enterprise ATS systems. We believe great talent deserves great
                opportunities — regardless of background, location, or connections.
              </p>
            </CardContent>
          </Card>
          <Card className="glass hover:shadow-card-soft transition-all animate-fade-in-up stagger-1">
            <CardContent className="p-8">
              <div className="h-14 w-14 rounded-2xl bg-accent mb-5 flex items-center justify-center shadow-glow">
                <Eye className="h-7 w-7 text-accent-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Our vision</h2>
              <p className="text-muted-foreground leading-relaxed">
                A world where finding the right job or the right hire takes hours, not months. Where
                AI handles the matching so humans can focus on what matters — building
                relationships, growing careers, and creating value together.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Platform overview */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-4">
            <Rocket className="mr-1 h-3 w-3" /> Platform
          </Badge>
          <h2 className="text-4xl font-bold mb-3">One platform, endless possibilities</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Everything you need to find, apply, and land your next role
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <PlatformCard
            icon={ScanText}
            title="AI Resume Scanner"
            desc="Instant ATS scoring, keyword analysis, and actionable recommendations."
          />
          <PlatformCard
            icon={FileText}
            title="Resume Builder"
            desc="Professional templates with drag-and-drop simplicity and ATS-friendly formatting."
          />
          <PlatformCard
            icon={Video}
            title="Interview Hub"
            desc="AI-generated practice questions, scheduling, and Google Meet integration."
          />
          <PlatformCard
            icon={TrendingUp}
            title="Career Roadmap"
            desc="Personalized paths with certifications, projects, and salary predictions."
          />
          <PlatformCard
            icon={Building2}
            title="Company Directory"
            desc="Browse hiring companies with ratings, salary info, and culture insights."
          />
          <PlatformCard
            icon={Users}
            title="Community Feed"
            desc="Share insights, network with peers, and stay updated on industry trends."
          />
          <PlatformCard
            icon={Award}
            title="Skill Assessments"
            desc="Verify your skills with AI-graded tests and showcase badges on your profile."
          />
          <PlatformCard
            icon={Heart}
            title="Referral Program"
            desc="Refer friends to jobs and earn rewards while helping your network grow."
          />
        </div>
      </section>

      {/* Feature highlights with illustration */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <Badge variant="secondary" className="glass">
              <Zap className="mr-1.5 h-3 w-3" /> AI Engine
            </Badge>
            <h2 className="text-4xl font-bold">Intelligent matching that actually works</h2>
            <p className="text-muted-foreground text-lg">
              Our AI doesn't just keyword-match. It understands context — your career trajectory,
              skill depth, and ambitions — to recommend roles you'll actually love.
            </p>
            <div className="space-y-4">
              {[
                {
                  icon: ScanText,
                  title: "Deep resume analysis",
                  desc: "ATS, grammar, formatting, keywords, and professionalism scoring",
                },
                {
                  icon: Target,
                  title: "Contextual job matching",
                  desc: "Skills, experience, location, salary, and culture fit",
                },
                {
                  icon: TrendingUp,
                  title: "Career path predictions",
                  desc: "AI-generated roadmaps with certifications and projects",
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 animate-fade-in-up">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-brand">
                    <item.icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="font-semibold">{item.title}</div>
                    <div className="text-sm text-muted-foreground">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 gradient-brand opacity-10 rounded-3xl blur-3xl" />
            <Card className="glass relative">
              <CardContent className="p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-lg gradient-brand flex items-center justify-center">
                      <ScanText className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="font-semibold">Resume Analysis</span>
                  </div>
                  <Badge className="gradient-brand text-primary-foreground">98/100</Badge>
                </div>
                {[
                  { label: "ATS Compatibility", value: 95, color: "bg-green-500" },
                  { label: "Keyword Match", value: 88, color: "bg-blue-500" },
                  { label: "Formatting", value: 92, color: "bg-accent" },
                  { label: "Grammar", value: 96, color: "bg-green-600" },
                ].map((s, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{s.label}</span>
                      <span className="font-medium">{s.value}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${s.color} transition-all duration-1000`}
                        style={{ width: `${s.value}%` }}
                      />
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t">
                  <div className="text-sm font-medium mb-2">AI Recommendations</div>
                  <div className="space-y-1.5">
                    {[
                      "Add cloud infrastructure keywords",
                      "Quantify achievements with metrics",
                      "Include a summary section",
                    ].map((rec, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold mb-3">Our values</h2>
          <p className="text-muted-foreground text-lg">
            The principles that guide everything we build
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <ValueCard
            icon={ShieldCheck}
            title="Trust & Privacy"
            desc="Your data is encrypted, never sold, and always yours to control."
          />
          <ValueCard
            icon={Globe}
            title="Accessibility"
            desc="Great opportunities shouldn't depend on geography or connections."
          />
          <ValueCard
            icon={Heart}
            title="Human-first"
            desc="AI assists, but people decide. We design for meaningful connections."
          />
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-4">
            <Star className="mr-1 h-3 w-3 fill-accent text-accent" /> Testimonials
          </Badge>
          <h2 className="text-4xl font-bold mb-3">What people say about Jagire</h2>
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

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="glass rounded-3xl p-12 md:p-16 text-center gradient-hero shadow-glow relative overflow-hidden">
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full gradient-brand opacity-30 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-accent opacity-30 blur-3xl" />
          <div className="relative">
            <h2 className="text-4xl font-bold mb-4 text-primary-foreground">
              Join the future of hiring
            </h2>
            <p className="text-primary-foreground/90 mb-8 text-lg max-w-xl mx-auto">
              Whether you're hiring or job-hunting, Jagire makes it effortless.
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/auth" search={{ mode: "signup" }}>
                  Get started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="bg-transparent border-white text-white hover:bg-white/10"
              >
                <Link to="/contact">Contact us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function StatBox({ icon: Icon, value, label }: { icon: any; value: string; label: string }) {
  return (
    <Card className="glass text-center hover:shadow-card-soft transition-all">
      <CardContent className="p-6">
        <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
        <div className="text-3xl font-bold gradient-text">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </CardContent>
    </Card>
  );
}

function PlatformCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <Card className="glass hover:shadow-glow hover:-translate-y-1 transition-all group">
      <CardContent className="p-6">
        <div className="h-12 w-12 rounded-xl gradient-brand mb-4 flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
          <Icon className="h-6 w-6 text-primary-foreground" />
        </div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </CardContent>
    </Card>
  );
}

function ValueCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <Card className="glass hover:shadow-card-soft transition-all text-center">
      <CardContent className="p-8">
        <div className="h-14 w-14 rounded-2xl gradient-brand mx-auto mb-4 flex items-center justify-center shadow-glow">
          <Icon className="h-7 w-7 text-primary-foreground" />
        </div>
        <h3 className="font-bold text-lg mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </CardContent>
    </Card>
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
