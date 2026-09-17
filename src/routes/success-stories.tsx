import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sparkles,
  ArrowRight,
  Clock,
  Target,
  Briefcase,
  Star,
  Quote,
  TrendingUp,
  CheckCircle2,
  Building2,
  Palette,
  Code2,
  Rocket,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/success-stories")({
  head: () => ({
    meta: [
      { title: "Success Stories — Jagire" },
      {
        name: "description",
        content: "Discover how professionals and hiring teams across Nepal use Jagire to accelerate their careers and hiring.",
      },
    ],
  }),
  component: SuccessStoriesPage,
});

interface Story {
  id: string;
  slug: string;
  title: string;
  category: string;
  role: string;
  companyType: string;
  author: string;
  avatarInitial: string;
  image: string;
  stats: { label: string; value: string }[];
  summary: string;
  quote: string;
  tags: string[];
}

const STORIES: Story[] = [
  {
    id: "graphic-designer-story",
    slug: "how-jagire-cut-down-my-job-hunt-as-a-graphic-designer",
    title: "How Jagire Cut Down My Job Hunt as a Graphic Designer",
    category: "Design & Creative",
    role: "Visual & UI Designer",
    companyType: "Creative Tech Agency",
    author: "Prasanna S.",
    avatarInitial: "P",
    image: "https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=800",
    stats: [
      { label: "Search Time", value: "8 Days" },
      { label: "ATS Score", value: "94%" },
      { label: "Offers", value: "2 Direct" },
    ],
    summary:
      "After weeks of generic job board rejections, the AI resume scanner pinpointed portfolio formatting gaps and missing design-system keywords. Matching tailored creative roles landed interview calls within 48 hours.",
    quote:
      "The ATS optimization advice directly targeted what creative directors look for in Nepal's tech and media companies. I felt confident walking into every interview.",
    tags: ["UI/UX", "Portfolio Optimization", "Figma", "Branding"],
  },
  {
    id: "fullstack-dev-story",
    slug: "from-bootcamp-graduate-to-full-stack-engineer",
    title: "Landing a High-Growth Tech Role in Kathmandu",
    category: "Engineering",
    role: "Full-Stack Engineer",
    companyType: "Fintech Startup",
    author: "Bibek R.",
    avatarInitial: "B",
    image: "https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=800",
    stats: [
      { label: "Matching Accuracy", value: "96%" },
      { label: "Mock Interviews", value: "4 Completed" },
      { label: "Time to Offer", value: "12 Days" },
    ],
    summary:
      "Using Jagire's AI interview simulator and skill assessment tools, Bibek sharpened his full-stack problem-solving and matched directly with engineering leads hiring for React and Node.js roles.",
    quote:
      "The AI interview prep gave me realistic questions tailored to Nepal's fintech ecosystem. It eliminated the guesswork completely.",
    tags: ["React", "TypeScript", "Node.js", "Fintech"],
  },
  {
    id: "product-manager-story",
    slug: "scaling-product-management-career",
    title: "Transitioning into Product Leadership with AI Coaching",
    category: "Product & Growth",
    role: "Senior Product Specialist",
    companyType: "SaaS Enterprise",
    author: "Sunita M.",
    avatarInitial: "S",
    image: "https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=800",
    stats: [
      { label: "Role Upgrade", value: "Senior Tier" },
      { label: "Applications", value: "3 Targeted" },
      { label: "Salary Growth", value: "+45%" },
    ],
    summary:
      "The AI Career Coach guided Sunita on how to frame her project metrics, roadmapping achievements, and cross-functional leadership on her CV to attract international remote and hybrid opportunities.",
    quote:
      "Instead of applying to 50 random postings, Jagire ranked the top 3 companies where my leadership background was a 90%+ match.",
    tags: ["Product Strategy", "Agile", "Roadmapping", "Growth"],
  },
  {
    id: "recruiter-spotlight",
    slug: "halving-time-to-hire-at-scale",
    title: "How Tech Innovators Cut Hiring Cycles from Weeks to Days",
    category: "Hiring Teams",
    role: "Head of People Operations",
    companyType: "50+ Team Scaleup",
    author: "Rajan K.",
    avatarInitial: "R",
    image: "https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=800",
    stats: [
      { label: "Screening Time", value: "-60%" },
      { label: "Candidate Quality", value: "Top 5% Fit" },
      { label: "Pipeline Speed", value: "6 Days" },
    ],
    summary:
      "By leveraging automated resume scoring, verified candidate profiles, and integrated Google Meet scheduling, their HR team eliminated manual sorting and hired 5 engineers in one sprint.",
    quote:
      "The candidate intelligence snapshot gave our hiring managers instant visibility into candidates' actual technical strengths.",
    tags: ["Recruitment", "Pipeline Automation", "ATS", "Talent Acquisition"],
  },
];

const CATEGORIES = ["All", "Design & Creative", "Engineering", "Product & Growth", "Hiring Teams"];

function SuccessStoriesPage() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredStories =
    activeCategory === "All"
      ? STORIES
      : STORIES.filter((s) => s.category === activeCategory);

  const featured = STORIES[0];

  return (
    <>
      <div className="container mx-auto px-4 py-16 max-w-6xl flex-1">
        {/* Hero Section */}
        <section className="text-center mb-16 max-w-3xl mx-auto">
          <Badge variant="secondary" className="mb-4 glass animate-fade-in">
            <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" /> Proven Career Growth
          </Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Real Stories, <span className="gradient-text">Measurable Results</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Discover how job seekers and innovative employers in Nepal use Jagire’s AI-powered
            platform to shorten hiring times, unlock better compensation, and match with purpose.
          </p>
        </section>

        {/* Featured Story Hero Card */}
        <div className="mb-16">
          <Card className="glass overflow-hidden border-border/60 hover:shadow-glow transition-all duration-300">
            <div className="grid md:grid-cols-12 gap-0">
              <div className="md:col-span-6 relative min-h-[280px] md:min-h-[380px] overflow-hidden bg-muted">
                <img
                  src={featured.image}
                  alt={featured.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=800";
                  }}
                />
                <div className="absolute top-4 left-4">
                  <Badge className="gradient-brand text-primary-foreground shadow-sm">
                    Featured Spotlight
                  </Badge>
                </div>
              </div>
              <div className="md:col-span-6 p-6 md:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-xs">
                      {featured.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">• {featured.companyType}</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">
                    {featured.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    {featured.summary}
                  </p>

                  <div className="p-4 rounded-xl bg-muted/50 border border-border/40 mb-6 relative">
                    <Quote className="h-5 w-5 text-primary/40 mb-1" />
                    <p className="text-sm italic text-foreground/90">{featured.quote}</p>
                    <div className="mt-3 flex items-center gap-2.5">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-xs gradient-brand text-primary-foreground">
                          {featured.avatarInitial}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-xs">
                        <span className="font-semibold">{featured.author}</span> —{" "}
                        <span className="text-muted-foreground">{featured.role}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40">
                  {featured.stats.map((s) => (
                    <div key={s.label} className="text-center">
                      <div className="text-lg font-bold gradient-text">{s.value}</div>
                      <div className="text-[11px] text-muted-foreground">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Category Filters */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-10">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className="rounded-full px-4"
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Stories Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {filteredStories.map((story) => (
            <Card
              key={story.id}
              className="glass hover:shadow-glow hover:-translate-y-1 transition-all duration-200 flex flex-col overflow-hidden"
            >
              <div className="relative h-48 overflow-hidden bg-muted">
                <img
                  src={story.image}
                  alt={story.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800";
                  }}
                />
                <Badge
                  variant="secondary"
                  className="absolute top-3 left-3 backdrop-blur-md bg-background/80 text-xs"
                >
                  {story.category}
                </Badge>
              </div>

              <CardContent className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-lg mb-2 leading-snug">{story.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    {story.summary}
                  </p>

                  <div className="grid grid-cols-3 gap-1.5 py-3 px-2 rounded-lg bg-muted/40 text-center mb-4">
                    {story.stats.map((stat) => (
                      <div key={stat.label}>
                        <div className="font-bold text-xs text-foreground">{stat.value}</div>
                        <div className="text-[10px] text-muted-foreground">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {story.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[10px] py-0">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/40 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px] gradient-brand text-primary-foreground">
                          {story.avatarInitial}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">{story.author}</span>
                    </div>
                    <span>{story.role}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Impact Highlights */}
        <section className="p-8 md:p-12 rounded-3xl bg-muted/30 border border-border/50 text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Why Professionals & Teams Choose Jagire
          </h2>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto mb-8">
            Empowering the modern workforce with actionable intelligence at every hiring stage.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-4 rounded-xl bg-background/60 border border-border/40">
              <Clock className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">10 Days</div>
              <div className="text-xs text-muted-foreground">Avg. time to interview</div>
            </div>
            <div className="p-4 rounded-xl bg-background/60 border border-border/40">
              <Target className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">92%+</div>
              <div className="text-xs text-muted-foreground">ATS match alignment</div>
            </div>
            <div className="p-4 rounded-xl bg-background/60 border border-border/40">
              <Building2 className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">500+</div>
              <div className="text-xs text-muted-foreground">Verified Employers</div>
            </div>
            <div className="p-4 rounded-xl bg-background/60 border border-border/40">
              <TrendingUp className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">3.5x</div>
              <div className="text-xs text-muted-foreground">Application response rate</div>
            </div>
          </div>
        </section>

        {/* Action CTA */}
        <section className="glass rounded-3xl p-8 md:p-12 text-center gradient-hero relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-3 text-primary-foreground">
              Ready to write your own success story?
            </h2>
            <p className="text-primary-foreground/90 text-sm md:text-base mb-6">
              Create your profile in minutes, test your resume against ATS benchmarks, and connect
              with high-growth teams.
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/auth" search={{ mode: "signup" }}>
                  Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="bg-transparent border-white text-white hover:bg-white/10"
              >
                <Link to="/employer">Hire with Jagire</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>

      <SiteFooter />
    </>
  );
}
