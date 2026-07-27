export type PlanAudience = "seeker" | "employer";

export interface PlanConfig {
  slug: string;
  name: string;
  audience: PlanAudience;
  price: number;
  currency: string;
  period: string;
  durationDays: number;
  tagline?: string;
  badge?: string;
  features: string[];
  ai: string[];
  cta: string;
  to: string;
  featured: boolean;
  contactSales?: boolean;
}

export const PLANS: Record<string, PlanConfig> = {
  premium: {
    slug: "premium",
    name: "Premium",
    audience: "seeker",
    price: 499,
    currency: "NPR",
    period: "/month",
    durationDays: 30,
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
  starter: {
    slug: "starter",
    name: "Starter",
    audience: "employer",
    price: 1999,
    currency: "NPR",
    period: "/month",
    durationDays: 30,
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
  professional: {
    slug: "professional",
    name: "Professional",
    audience: "employer",
    price: 4999,
    currency: "NPR",
    period: "/month",
    durationDays: 30,
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
      "Company Formatting",
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
  enterprise: {
    slug: "enterprise",
    name: "Enterprise",
    audience: "employer",
    price: 0,
    currency: "NPR",
    period: "",
    durationDays: 0,
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
    contactSales: true,
  },
  free: {
    slug: "free",
    name: "Free",
    audience: "seeker",
    price: 0,
    currency: "NPR",
    period: "/month",
    durationDays: 0,
    features: [
      "Apply to Jobs",
      "Basic Resume Builder",
      "Save Jobs",
      "Track Applications",
      "Job Alerts",
      "5 AI Credits/month",
    ],
    ai: [],
    cta: "Start Free",
    to: "/auth",
    featured: false,
  },
};

export const SEEKER_PLANS = ["free", "premium"];
export const EMPLOYER_PLANS = ["starter", "professional", "enterprise"];

export function getPlan(slug: string): PlanConfig | undefined {
  return PLANS[slug];
}

export function getPlanByAmount(amount: number): string | null {
  if (amount === 499) return "premium";
  if (amount === 1999) return "starter";
  if (amount === 4999) return "professional";
  return null;
}
