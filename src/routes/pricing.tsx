import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Crown,
  Calendar,
  CalendarClock,
  Sparkles,
  Brain,
  FileText,
  Star,
  Target,
  MessageSquare,
  HelpCircle,
  Rocket,
  Zap,
  Search,
  ScanLine,
  BarChart3,
  Mail,
  Clock,
  FileSignature,
  TrendingUp,
  ClipboardList,
  Users,
  Bot,
  Globe,
  ShieldCheck,
  Lock,
  Sparkle,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription, PLAN_NAMES } from "@/hooks/use-subscription";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Jagire AI Recruitment & HR OS" },
      {
        name: "description",
        content:
          "AI-powered recruitment, hiring, and HR operating system. Career tools for job seekers, enterprise HR software for employers.",
      },
    ],
  }),
  component: PricingPage,
});

type Tab = "seeker" | "employer";

function PricingPage() {
  const { user } = useAuth();
  const { data: sub } = useSubscription();
  const [tab, setTab] = useState<Tab>("seeker");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-8">
        <div className="absolute inset-0 -z-10 gradient-hero opacity-[0.07]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[120px] -z-10" />
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <Badge
            variant="outline"
            className="mb-4 gap-1.5 px-3 py-1 text-xs font-medium glass"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI-Powered Recruitment & HR Operating System
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Pricing built for{" "}
            <span className="gradient-text">career growth</span> and{" "}
            <span className="gradient-text">enterprise hiring</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Job seekers get AI career tools. Employers get a complete AI recruitment and HR
            platform. All prices in NPR.
          </p>
        </div>
      </section>

      {/* Sticky toggle */}
      <div className="sticky top-16 z-30 py-3 backdrop-blur-md bg-background/70 border-y">
        <div className="container mx-auto px-4 flex justify-center">
          <div className="inline-flex rounded-full glass p-1 shadow-card-soft">
            <ToggleBtn active={tab === "seeker"} onClick={() => setTab("seeker")}>
              <Users className="h-4 w-4" />
              Job Seeker
            </ToggleBtn>
            <ToggleBtn active={tab === "employer"} onClick={() => setTab("employer")}>
              <BuildingIcon />
              Employer
            </ToggleBtn>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Current subscription */}
        {user && sub && <CurrentSubscriptionCard sub={sub} />}

        {tab === "seeker" ? <SeekerPricing /> : <EmployerPricing />}

        {tab === "employer" && (
          <>
            <AIRecruitmentSection />
            <AIOfficeSection />
            <EmployerComparisonTable />
          </>
        )}

        <StatsSection />
        <FAQSection tab={tab} />
      </div>

      <SiteFooter />
    </div>
  );
}

/* ── Shared bits ───────────────────────────────────────────── */

function ToggleBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full px-6 py-2 text-sm font-semibold transition-all ${
        active
          ? "gradient-brand text-primary-foreground shadow-glow"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function BuildingIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
    </svg>
  );
}

function TrustBar() {
  const items = [
    { icon: Lock, label: "Secure Payment" },
    { icon: ShieldCheck, label: "Cancel Anytime" },
    { icon: BuildingIcon, label: "Trusted by Nepali Employers" },
    { icon: Users, label: "Trusted by Thousands of Job Seekers" },
  ];
  return (
    <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mb-12">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <it.icon className="h-4 w-4 text-primary" />
          {it.label}
        </div>
      ))}
    </div>
  );
}

function AIBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
      <Sparkle className="h-2.5 w-2.5" />
      {children}
    </span>
  );
}

/* ── Job Seeker pricing ────────────────────────────────────── */

function SeekerPricing() {
  const plans = [
    {
      name: "Free",
      price: "Rs. 0",
      period: "/month",
      features: [
        "Apply to Jobs",
        "Basic Resume Builder",
        "Save Jobs",
        "Track Applications",
        "Job Alerts",
        "5 AI Credits/month",
      ],
      ai: [] as string[],
      cta: "Start Free",
      to: "/auth",
      featured: false,
    },
    {
      name: "Premium",
      price: "Rs. 499",
      period: "/month",
      badge: "Most Popular",
      features: [
        "Unlimited Job Applications",
        "Unlimited AI Resume Builder",
        "AI Resume Optimization",
        "AI Cover Letter Generator",
        "AI Interview Practice",
        "ATS Resume Score",
        "AI Career Coach",
        "AI Career Roadmap",
        "Skills Gap Analysis",
        "Salary Insights",
        "Resume Templates",
        "Portfolio Builder",
        "Application Analytics",
        "Priority Support",
      ],
      ai: [
        "AI Resume Writer",
        "AI Resume Improvement",
        "AI ATS Checker",
        "AI Cover Letter",
        "AI Interview Coach",
        "AI Career Mentor",
        "AI Skill Recommendations",
        "AI Career Roadmap",
        "AI Resume Score",
      ],
      cta: "Upgrade to Premium",
      to: "/checkout/premium",
      featured: true,
    },
  ];

  return (
    <div className="animate-fade-in-up">
      <TrustBar />
      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {plans.map((p) => (
          <PricingCard key={p.name} {...p} />
        ))}
      </div>
    </div>
  );
}

/* ── Employer pricing ──────────────────────────────────────── */

function EmployerPricing() {
  const plans = [
    {
      name: "Starter",
      price: "Rs. 1,999",
      period: "/month",
      tagline: "Perfect for Startups",
      features: [
        "5 Active Job Posts",
        "Candidate Dashboard",
        "Resume Search",
        "Company Profile",
        "Email Notifications",
        "Basic Hiring Analytics",
      ],
      ai: [
        "AI Candidate Match",
        "AI Resume Screening",
        "AI Resume Ranking",
        "AI Job Description Writer",
        "AI Hiring Analytics",
      ],
      cta: "Start Hiring",
      to: "/checkout/starter",
      featured: false,
    },
    {
      name: "Professional",
      price: "Rs. 4,999",
      period: "/month",
      tagline: "Everything in Starter plus",
      badge: "Most Popular",
      features: [
        "Unlimited Job Posts",
        "Unlimited Candidates",
        "Team Collaboration",
        "Google Calendar Integration",
        "Interview Scheduling",
        "Candidate Pipeline",
        "Hiring Dashboard",
        "Resume Database",
        "Company Branding",
        "Advanced Search",
      ],
      ai: [
        "AI Smart Shortlisting",
        "AI Candidate Ranking",
        "AI Candidate Summary",
        "AI Skill Gap Analysis",
        "AI Interview Question Generator",
        "AI Resume Screening",
        "AI Job Description Optimizer",
        "AI Hiring Recommendation",
        "AI Duplicate Candidate Detection",
        "AI Talent Search",
        "AI Email Assistant",
        "AI Meeting Scheduler",
        "AI Onboarding Assistant",
        "AI Office Dashboard",
      ],
      cta: "Upgrade Now",
      to: "/checkout/professional",
      featured: true,
    },
    {
      name: "Enterprise",
      price: "Contact Sales",
      period: "",
      tagline: "Everything in Professional plus",
      features: [
        "Unlimited Recruiters",
        "Unlimited Jobs",
        "Unlimited Candidates",
        "SSO",
        "API Access",
        "White Label",
        "Dedicated Success Manager",
        "Enterprise Security",
        "SLA",
        "Custom Integrations",
      ],
      ai: [
        "Private AI Models",
        "AI Recruitment Automation",
        "AI Workflow Builder",
        "Predictive Hiring Analytics",
        "Workforce Planning AI",
        "Company Knowledge AI",
        "AI Talent Intelligence",
        "AI Candidate Success Prediction",
        "White-label AI Assistant",
        "Dedicated AI Success Manager",
      ],
      cta: "Contact Sales",
      to: "/contact",
      featured: false,
    },
  ];

  return (
    <div className="animate-fade-in-up">
      <TrustBar />
      <div className="grid lg:grid-cols-3 gap-6">
        {plans.map((p) => (
          <PricingCard key={p.name} {...p} />
        ))}
      </div>
    </div>
  );
}

/* ── Reusable pricing card ─────────────────────────────────── */

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  tagline?: string;
  badge?: string;
  features: string[];
  ai: string[];
  cta: string;
  to: string;
  featured: boolean;
}

function PricingCard({
  name,
  price,
  period,
  tagline,
  badge,
  features,
  ai,
  cta,
  to,
  featured,
}: PricingCardProps) {
  return (
    <Card
      className={`relative overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
        featured
          ? "border-primary/40 shadow-glow gradient-brand text-primary-foreground"
          : "glass shadow-card-soft hover:shadow-glow"
      }`}
    >
      {badge && (
        <div className="absolute top-0 right-0 px-3 py-1 text-xs font-bold gradient-brand text-primary-foreground rounded-bl-xl">
          ⭐ {badge}
        </div>
      )}
      <CardContent className="p-7">
        <h3 className={`text-xl font-bold mb-1 ${featured ? "text-primary-foreground" : ""}`}>
          {name}
        </h3>
        {tagline && (
          <p className={`text-sm mb-4 ${featured ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
            {tagline}
          </p>
        )}
        <div className="flex items-baseline gap-1 mb-5">
          <span className={`text-4xl font-bold ${featured ? "text-primary-foreground" : "gradient-text"}`}>
            {price}
          </span>
          {period && (
            <span className={`text-sm ${featured ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
              {period}
            </span>
          )}
        </div>

        <Button
          asChild
          className={`w-full mb-6 ${
            featured
              ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              : "gradient-brand text-primary-foreground"
          }`}
          variant={featured ? "secondary" : "default"}
        >
          <Link to={to}>{cta}</Link>
        </Button>

        <div className="space-y-2.5 mb-5">
          {features.map((f) => (
            <div key={f} className="flex gap-2 text-sm">
              <Check className={`h-4 w-4 flex-shrink-0 ${featured ? "text-primary-foreground" : "text-primary"}`} />
              <span className={featured ? "text-primary-foreground/90" : ""}>{f}</span>
            </div>
          ))}
        </div>

        {ai.length > 0 && (
          <div className={`pt-4 border-t ${featured ? "border-primary-foreground/20" : "border-border"}`}>
            <div className={`text-xs font-semibold mb-3 flex items-center gap-1.5 ${featured ? "text-primary-foreground" : "text-foreground"}`}>
              <Sparkle className="h-3.5 w-3.5" />
              AI Benefits
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ai.map((a) => (
                <span
                  key={a}
                  className={`text-[11px] rounded-md px-2 py-1 ${
                    featured
                      ? "bg-primary-foreground/15 text-primary-foreground"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── AI Recruitment section ────────────────────────────────── */

const RECRUITMENT_FEATURES = [
  { icon: Brain, title: "AI Candidate Match", desc: "Scores every applicant using skills, education, experience, salary, location and job fit." },
  { icon: ScanLine, title: "AI Resume Screening", desc: "Reads hundreds of resumes in seconds." },
  { icon: Star, title: "AI Smart Ranking", desc: "Ranks every applicant from best to worst." },
  { icon: MessageSquare, title: "AI Candidate Summary", desc: "Creates recruiter-ready summaries." },
  { icon: Target, title: "AI Skill Gap Analysis", desc: "Identifies missing skills instantly." },
  { icon: HelpCircle, title: "AI Interview Generator", desc: "Creates technical and behavioral interview questions." },
  { icon: FileText, title: "AI Job Description Writer", desc: "Writes optimized job descriptions." },
  { icon: Sparkles, title: "AI Job Optimizer", desc: "Improves existing job posts." },
  { icon: Rocket, title: "AI Talent Search", desc: "Finds ideal candidates before they apply." },
  { icon: Zap, title: "AI Auto Shortlisting", desc: "Automatically recommends top candidates." },
  { icon: Search, title: "AI Duplicate Detection", desc: "Detects duplicate applicants." },
  { icon: BarChart3, title: "AI Hiring Analytics", desc: "Shows hiring funnel performance." },
];

function AIRecruitmentSection() {
  return (
    <section className="py-16">
      <div className="text-center mb-10">
        <Badge variant="outline" className="mb-3 gap-1 glass">
          <Bot className="h-3.5 w-3.5 text-primary" />
          Jagire AI for Employers
        </Badge>
        <h2 className="text-3xl font-bold mb-2">AI Recruitment Engine</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          The AI-powered HR assistant that helps companies recruit faster, manage employees
          smarter, and automate office work.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {RECRUITMENT_FEATURES.map((f, i) => (
          <FeatureCard key={f.title} {...f} delay={i * 0.05} />
        ))}
      </div>
    </section>
  );
}

/* ── AI Office Assistant section ───────────────────────────── */

const OFFICE_FEATURES = [
  { icon: CalendarClock, title: "AI Meeting Scheduler", desc: "Schedules interviews and meetings automatically." },
  { icon: Mail, title: "AI Email Assistant", desc: "Writes interview invitations, rejection emails, reminders, offer letters and HR emails." },
  { icon: FileSignature, title: "AI Document Generator", desc: "Creates offer letters, appointment letters, contracts, experience letters, promotion letters, warning letters, and HR documents." },
  { icon: Clock, title: "AI Attendance Insights", desc: "Analyzes attendance automatically." },
  { icon: TrendingUp, title: "AI Performance Reports", desc: "Generates employee KPI reports." },
  { icon: Target, title: "AI Goal Tracking", desc: "Tracks employee goals." },
  { icon: ClipboardList, title: "AI Task Assistant", desc: "Assigns and manages office tasks." },
  { icon: Users, title: "AI Onboarding Assistant", desc: "Guides new hires through onboarding." },
  { icon: MessageSquare, title: "AI HR Chatbot", desc: "Answers employee HR questions." },
  { icon: Globe, title: "AI Translator", desc: "Translates HR documents." },
  { icon: BarChart3, title: "AI Workforce Dashboard", desc: "Provides real-time HR insights." },
  { icon: Bot, title: "AI Office Assistant", desc: "Your 24/7 AI-powered office companion." },
];

function AIOfficeSection() {
  return (
    <section className="py-16">
      <div className="text-center mb-10">
        <Badge variant="outline" className="mb-3 gap-1 glass">
          <BuildingIcon />
          AI Office Assistant
        </Badge>
        <h2 className="text-3xl font-bold mb-2">Automate Your Office Work</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          AI tools that help employers with everyday office work — from scheduling to document
          generation to workforce analytics.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {OFFICE_FEATURES.map((f, i) => (
          <FeatureCard key={f.title} {...f} delay={i * 0.05} />
        ))}
      </div>
    </section>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  delay: number;
}) {
  return (
    <div
      className="group glass rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow animate-fade-in-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="h-11 w-11 rounded-xl gradient-brand flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
        <Icon className="h-5 w-5 text-primary-foreground" />
      </div>
      <h3 className="font-semibold mb-1 flex items-center gap-1.5">
        {title}
        <AIBadge>AI</AIBadge>
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

/* ── Employer comparison table ─────────────────────────────── */

const COMPARISON: Record<
  string,
  { label: string; starter: boolean; professional: boolean; enterprise: boolean }
> = {
  "AI Resume Screening": { label: "AI Resume Screening", starter: true, professional: true, enterprise: true },
  "AI Candidate Match": { label: "AI Candidate Match", starter: true, professional: true, enterprise: true },
  "AI Resume Ranking": { label: "AI Resume Ranking", starter: true, professional: true, enterprise: true },
  "AI Job Description Writer": { label: "AI Job Description Writer", starter: true, professional: true, enterprise: true },
  "Basic Hiring Analytics": { label: "Basic Hiring Analytics", starter: true, professional: true, enterprise: true },
  "AI Smart Shortlisting": { label: "AI Smart Shortlisting", starter: false, professional: true, enterprise: true },
  "AI Candidate Summary": { label: "AI Candidate Summary", starter: false, professional: true, enterprise: true },
  "AI Skill Gap Analysis": { label: "AI Skill Gap Analysis", starter: false, professional: true, enterprise: true },
  "AI Interview Generator": { label: "AI Interview Generator", starter: false, professional: true, enterprise: true },
  "AI Email Assistant": { label: "AI Email Assistant", starter: false, professional: true, enterprise: true },
  "AI Meeting Scheduler": { label: "AI Meeting Scheduler", starter: false, professional: true, enterprise: true },
  "AI Office Dashboard": { label: "AI Office Dashboard", starter: false, professional: true, enterprise: true },
  "AI Onboarding Assistant": { label: "AI Onboarding Assistant", starter: false, professional: true, enterprise: true },
  "AI Task Assistant": { label: "AI Task Assistant", starter: false, professional: true, enterprise: true },
  "Private AI Models": { label: "Private AI Models", starter: false, professional: false, enterprise: true },
  "Company Knowledge AI": { label: "Company Knowledge AI", starter: false, professional: false, enterprise: true },
  "AI Recruitment Automation": { label: "AI Recruitment Automation", starter: false, professional: false, enterprise: true },
  "Workflow Automation": { label: "Workflow Automation", starter: false, professional: false, enterprise: true },
  "Predictive Hiring Analytics": { label: "Predictive Hiring Analytics", starter: false, professional: false, enterprise: true },
  "Workforce Planning AI": { label: "Workforce Planning AI", starter: false, professional: false, enterprise: true },
  "White-label AI Assistant": { label: "White-label AI Assistant", starter: false, professional: false, enterprise: true },
  "Custom AI Integrations": { label: "Custom AI Integrations", starter: false, professional: false, enterprise: true },
  "API Access": { label: "API Access", starter: false, professional: false, enterprise: true },
  "Dedicated AI Success Manager": { label: "Dedicated AI Success Manager", starter: false, professional: false, enterprise: true },
};

function EmployerComparisonTable() {
  return (
    <section className="py-16">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">AI Tools by Plan</h2>
        <p className="text-muted-foreground">See exactly which AI tools each employer plan includes.</p>
      </div>
      <div className="overflow-x-auto rounded-2xl glass shadow-card-soft">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4 font-semibold">AI Feature</th>
              <th className="text-center p-4 font-semibold">Starter</th>
              <th className="text-center p-4 font-semibold gradient-brand text-primary-foreground">Professional</th>
              <th className="text-center p-4 font-semibold">Enterprise</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(COMPARISON).map((row, i) => (
              <tr key={row.label} className={i % 2 ? "bg-muted/20" : ""}>
                <td className="p-4 font-medium flex items-center gap-1.5">
                  {row.label}
                  <AIBadge>AI</AIBadge>
                </td>
                <td className="text-center p-4">
                  {row.starter ? <Check className="h-4 w-4 text-primary mx-auto" /> : <span className="text-muted-foreground/40">—</span>}
                </td>
                <td className="text-center p-4 bg-primary/5">
                  {row.professional ? <Check className="h-4 w-4 text-primary mx-auto" /> : <span className="text-muted-foreground/40">—</span>}
                </td>
                <td className="text-center p-4">
                  {row.enterprise ? <Check className="h-4 w-4 text-primary mx-auto" /> : <span className="text-muted-foreground/40">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ── Stats ─────────────────────────────────────────────────── */

const STATS = [
  { value: "70%", label: "Faster Hiring" },
  { value: "90%", label: "Less Resume Screening Time" },
  { value: "3x", label: "Better Candidate Matching" },
  { value: "50+", label: "AI HR Tools" },
  { value: "24/7", label: "AI Office Assistant" },
  { value: "Thousands", label: "Of Successful Hires" },
];

function StatsSection() {
  return (
    <section className="py-16">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className="glass rounded-2xl p-6 text-center animate-scale-in hover:shadow-glow transition-shadow"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <div className="text-3xl font-bold gradient-text mb-1">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── FAQ ───────────────────────────────────────────────────── */

const SEEKER_FAQ = [
  { q: "What are AI Credits?", a: "Free plan includes 5 AI credits/month for resume scanning and career tools. Premium includes unlimited AI access." },
  { q: "Can I cancel anytime?", a: "Yes. You can cancel your Premium subscription anytime and retain access until your billing period ends." },
  { q: "Is my payment secure?", a: "Yes. All payments are processed through eSewa's secure payment gateway with encrypted transactions." },
];

const EMPLOYER_FAQ = [
  { q: "What does 'Active Job Posts' mean?", a: "It's the number of job listings you can have published simultaneously. Professional and Enterprise plans offer unlimited posts." },
  { q: "Do you offer custom AI integrations?", a: "Yes. Enterprise plans include custom AI integrations, private AI models, API access, and a dedicated AI success manager." },
  { q: "Can I upgrade or downgrade my plan?", a: "Yes. You can change plans at any time. Your billing will be prorated based on your current subscription." },
];

function FAQSection({ tab }: { tab: Tab }) {
  const faqs = tab === "seeker" ? SEEKER_FAQ : EMPLOYER_FAQ;
  return (
    <section className="py-16 max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
      <div className="space-y-3">
        {faqs.map((f) => (
          <div key={f.q} className="glass rounded-xl p-5">
            <h3 className="font-semibold mb-1.5 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-primary" />
              {f.q}
            </h3>
            <p className="text-sm text-muted-foreground pl-6">{f.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Current subscription card ─────────────────────────────── */

function CurrentSubscriptionCard({
  sub,
}: {
  sub: ReturnType<typeof useSubscription>["data"];
}) {
  if (!sub) return null;

  if (!sub.isPremium) {
    return (
      <Card className="border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 mb-10 animate-fade-in">
        <CardContent className="p-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-200 dark:bg-amber-900 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-amber-700 dark:text-amber-300" />
            </div>
            <div>
              <div className="font-semibold">Free plan</div>
              <div className="text-sm text-muted-foreground">
                Upgrade to unlock AI-powered career tools, priority matching, and more.
              </div>
            </div>
          </div>
          <Button asChild className="gradient-brand text-primary-foreground">
            <Link to="/checkout/premium">Upgrade now</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const planLabel = PLAN_NAMES[sub.plan_type ?? ""] ?? "Premium";
  const started = sub.started_at ? new Date(sub.started_at).toLocaleDateString() : "—";
  const expires = sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() : "—";
  const days = sub.daysRemaining ?? 0;

  return (
    <Card className="border-primary/30 shadow-glow mb-10 animate-fade-in">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full gradient-brand flex items-center justify-center">
            <Crown className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">{planLabel} plan</span>
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                Active
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {days > 0 ? `${days} days remaining` : "Expired — renew to keep AI access"}
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Start date:</span>
            <span className="font-medium">{started}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Expiry date:</span>
            <span className="font-medium">{expires}</span>
          </div>
        </div>

        {days <= 7 && days >= 0 && (
          <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-950 p-3 text-sm text-amber-800 dark:text-amber-300 flex items-center justify-between gap-2 flex-wrap">
            <span>Your subscription expires soon. Renew to keep your premium benefits.</span>
            <Button asChild size="sm" className="gradient-brand text-primary-foreground">
              <Link to="/checkout/premium">Renew</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
