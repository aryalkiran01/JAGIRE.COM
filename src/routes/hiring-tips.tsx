import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  Users,
  Target,
  BrainCircuit,
  Video,
  TrendingUp,
  ShieldCheck,
  Zap,
  HelpCircle,
  Lightbulb,
} from "lucide-react";

export const Route = createFileRoute("/hiring-tips")({
  head: () => ({
    meta: [
      { title: "Hiring Tips & Recruiter Guide — Jagire" },
      {
        name: "description",
        content: "Expert recruitment strategies, job description best practices, salary benchmarking, and AI screening workflows for employers in Nepal.",
      },
    ],
  }),
  component: HiringTipsPage,
});

interface TipSection {
  id: string;
  icon: typeof Sparkles;
  title: string;
  subtitle: string;
  summary: string;
  dos: string[];
  donts: string[];
  proTip: string;
}

const HIRING_GUIDES: TipSection[] = [
  {
    id: "jd-optimization",
    icon: Target,
    title: "1. Crafting High-Impact Job Descriptions",
    subtitle: "Attract the top 10% of relevant talent by removing ambiguity",
    summary:
      "Vague job postings with 25 bullet points intimidate qualified applicants and attract generic resumes. A high-converting JD clarifies core deliverables in the first 90 days and explicit technical competencies.",
    dos: [
      "State 3–5 key outcomes expected in the first 3 to 6 months.",
      "Specify must-have tools vs. nice-to-have technologies clearly.",
      "Highlight day-to-day team structure and reporting lines.",
      "List work mode (On-site, Hybrid, or Remote) and Kathmandu/regional office location.",
    ],
    donts: [
      "Don't list 15+ mandatory requirements for junior/mid-tier roles.",
      "Avoid clichés like 'rockstar developer' or 'ninja multitasker'.",
      "Don't hide working hours or flexibility expectations.",
    ],
    proTip:
      "Jobs with 5–8 bullet points of crisp responsibilities receive 40% more qualified submissions than postings with excessive text blocks.",
  },
  {
    id: "salary-transparency",
    icon: TrendingUp,
    title: "2. Salary Transparency & Benchmarking in Nepal",
    subtitle: "Compete for top-tier candidates with clear compensation ranges",
    summary:
      "In the modern Nepali tech and corporate landscape, top performers prioritize transparency. Stating realistic NPR pay bands cuts out mismatched interviews and accelerates candidate buy-in.",
    dos: [
      "Provide a clear minimum and maximum monthly or annual NPR range.",
      "Detail perks such as SSF (Social Security Fund), health insurance, festival allowances, and performance bonuses.",
      "Outline annual appraisal and promotion review rhythms.",
    ],
    donts: [
      "Avoid 'Salary Negotiable' or 'Best in Industry' as sole indicators.",
      "Don't offer below-market rates hoping for senior talent without equity or clear upsides.",
    ],
    proTip:
      "Listings with clear salary bands on Jagire achieve a 3.2x higher application completion rate and 65% faster offer acceptance.",
  },
  {
    id: "ai-screening",
    icon: BrainCircuit,
    title: "3. Automated Screening & Objective Shortlisting",
    subtitle: "Cut resume triage time from 20 hours to 15 minutes",
    summary:
      "Manual resume reviewing is prone to recruiter fatigue and unconscious bias. Utilize Jagire's AI match ranking to score candidates based on verified skills, portfolio relevance, and past project impact.",
    dos: [
      "Use objective scoring rubrics based on core problem-solving competencies.",
      "Evaluate candidate projects and live portfolios alongside resumes.",
      "Leverage automated applicant ranking to filter spam submissions instantly.",
    ],
    donts: [
      "Don't disqualify candidates solely based on non-traditional degrees if their project portfolio demonstrates strong domain mastery.",
      "Don't let candidates wait weeks without status updates; trigger automated timeline updates.",
    ],
    proTip:
      "Shortlist candidates with an 85%+ ATS fit score first, then invite them directly to structured video screenings.",
  },
  {
    id: "structured-interviews",
    icon: Video,
    title: "4. Conducting Structured Video & Technical Interviews",
    subtitle: "Standardize questions to accurately predict on-the-job success",
    summary:
      "Unstructured conversational interviews correlate poorly with real job performance. Use standardized STAR (Situation, Task, Action, Result) questions to evaluate real-world decision making.",
    dos: [
      "Ask all candidates for the same role the same core behavioral & technical scenarios.",
      "Use Jagire's integrated Google Meet scheduling for zero-friction calendar invites.",
      "Give candidates 5–10 minutes at the end to ask their own questions about team culture.",
    ],
    donts: [
      "Avoid trick brain teasers that do not reflect actual work challenges.",
      "Don't assign take-home tests that require more than 3 hours of unpaid candidate time.",
    ],
    proTip:
      "Score answers immediately after the interview using a 1–5 rubric to prevent memory distortion during final selection.",
  },
  {
    id: "fast-track-offers",
    icon: Zap,
    title: "5. Fast-Track Offers & Candidate Retention",
    subtitle: "Shorten hiring cycles to avoid losing candidates to competing offers",
    summary:
      "Top candidates in Nepal receive multiple offers within 7 to 10 days of entering the job market. A sluggish multi-week hiring cycle is the #1 reason top offers get declined.",
    dos: [
      "Aim for a total hiring cycle of under 10–14 days from application to offer.",
      "Send verbal offer confirmation followed by a digital offer letter within 24 hours.",
      "Connect the candidate with their future team lead for an informal welcome call.",
    ],
    donts: [
      "Don't add unexpected extra rounds after telling the candidate it was the final interview.",
      "Don't leave candidate salary counter-offers unresponded for days.",
    ],
    proTip:
      "Companies that complete the interview-to-offer stage in under 7 business days achieve an 88% offer acceptance rate.",
  },
];

function HiringTipsPage() {
  const [selectedGuide, setSelectedGuide] = useState<string>("jd-optimization");

  const active = HIRING_GUIDES.find((g) => g.id === selectedGuide) ?? HIRING_GUIDES[0];
  const Icon = active.icon;

  return (
    <>
      <div className="container mx-auto px-4 py-16 max-w-6xl flex-1">
        {/* Hero Section */}
        <section className="text-center mb-16 max-w-3xl mx-auto">
          <Badge variant="secondary" className="mb-4 glass animate-fade-in">
            <Lightbulb className="mr-1.5 h-3.5 w-3.5 text-primary" /> Recruiter & Employer Handbook
          </Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Proven <span className="gradient-text">Hiring Tips</span> for Modern Teams
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Essential strategies to write better job postings, evaluate talent objectively, shorten
            time-to-hire, and secure top candidates in Nepal.
          </p>
        </section>

        {/* Quick Nav Pills */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-12">
          {HIRING_GUIDES.map((guide) => {
            const GIcon = guide.icon;
            const isCurrent = guide.id === selectedGuide;
            return (
              <Button
                key={guide.id}
                variant={isCurrent ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedGuide(guide.id)}
                className="gap-2 rounded-full"
              >
                <GIcon className="h-3.5 w-3.5" />
                <span>{guide.title.split(". ")[1]}</span>
              </Button>
            );
          })}
        </div>

        {/* Active Guide Detail Card */}
        <div className="mb-16">
          <Card className="glass border-border/60 shadow-glow overflow-hidden">
            <div className="p-6 md:p-10">
              <div className="flex items-start gap-4 mb-6">
                <div className="h-12 w-12 rounded-2xl gradient-brand flex items-center justify-center text-primary-foreground shrink-0 shadow-glow">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">
                    {active.title}
                  </h2>
                  <p className="text-sm font-medium text-primary">{active.subtitle}</p>
                </div>
              </div>

              <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-8">
                {active.summary}
              </p>

              {/* Do's and Don'ts Grid */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-2 font-semibold text-emerald-600 dark:text-emerald-400 text-sm mb-3">
                    <CheckCircle2 className="h-4 w-4" /> Recommended Best Practices (Do's)
                  </div>
                  <ul className="space-y-2.5">
                    {active.dos.map((item, idx) => (
                      <li key={idx} className="text-xs md:text-sm text-foreground/90 flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <div className="flex items-center gap-2 font-semibold text-rose-600 dark:text-rose-400 text-sm mb-3">
                    <HelpCircle className="h-4 w-4" /> Common Pitfalls to Avoid (Don'ts)
                  </div>
                  <ul className="space-y-2.5">
                    {active.donts.map((item, idx) => (
                      <li key={idx} className="text-xs md:text-sm text-foreground/90 flex items-start gap-2">
                        <span className="text-rose-500 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Pro Tip Box */}
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-primary mb-0.5">
                    Jagire Recruiter Insight
                  </div>
                  <p className="text-xs md:text-sm text-foreground/90">{active.proTip}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* All Guide Previews */}
        <section className="mb-16">
          <h3 className="text-xl font-bold mb-6">Complete Recruiter Playbook</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {HIRING_GUIDES.map((guide) => {
              const GIcon = guide.icon;
              return (
                <Card
                  key={guide.id}
                  onClick={() => {
                    setSelectedGuide(guide.id);
                    window.scrollTo({ top: 300, behavior: "smooth" });
                  }}
                  className={`glass hover:shadow-glow transition-all cursor-pointer p-6 flex flex-col justify-between ${
                    guide.id === selectedGuide ? "border-primary ring-1 ring-primary/40" : ""
                  }`}
                >
                  <div>
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                      <GIcon className="h-5 w-5" />
                    </div>
                    <h4 className="font-bold text-base mb-2">{guide.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-4">
                      {guide.summary}
                    </p>
                  </div>
                  <div className="text-xs font-medium text-primary flex items-center gap-1 pt-2 border-t border-border/40">
                    Read guide <ArrowRight className="h-3 w-3" />
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* CTA Section */}
        <section className="glass rounded-3xl p-8 md:p-12 text-center gradient-hero relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-3 text-primary-foreground">
              Put these hiring best practices into action
            </h2>
            <p className="text-primary-foreground/90 text-sm md:text-base mb-6">
              Post your next role on Jagire, leverage AI candidate screening, and build a stellar team
              effortlessly.
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/employer/jobs/new">
                  Post a Job Now <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="bg-transparent border-white text-white hover:bg-white/10"
              >
                <Link to="/employer">Employer Dashboard</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>

      <SiteFooter />
    </>
  );
}
