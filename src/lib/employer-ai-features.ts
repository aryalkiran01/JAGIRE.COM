import {
  Users,
  UserCheck,
  ListChecks,
  ClipboardCheck,
  BarChart3,
  FileSearch,
  Sparkles,
  Trophy,
  Target,
  Search,
  CopyCheck,
  GraduationCap,
  HelpCircle,
  PenLine,
  FileEdit,
  LineChart,
  Mail,
  CalendarClock,
  UserPlus,
  LayoutGrid,
  Bot,
  Workflow,
  Brain,
  Network,
  Lock,
  BookOpen,
  Globe,
  Palette,
  Headset,
  type LucideIcon,
} from "lucide-react";

export interface AiFeatureItem {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
  to: string;
}

export interface AiFeatureGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  items: AiFeatureItem[];
}

const r = (slug: string) => `/employer/ai/${slug}`;

export const EMPLOYER_AI_GROUPS: AiFeatureGroup[] = [
  {
    id: "recruitment",
    label: "Recruitment AI",
    icon: Users,
    items: [
      {
        slug: "candidate-match",
        title: "AI Candidate Match",
        description: "Match candidates to roles automatically",
        icon: UserCheck,
        to: r("candidate-match"),
      },
      {
        slug: "resume-screening",
        title: "AI Resume Screening",
        description: "Screen resumes at scale with AI",
        icon: FileSearch,
        to: r("resume-screening"),
      },
      {
        slug: "resume-ranking",
        title: "AI Resume Ranking",
        description: "Rank applicants by fit score",
        icon: ListChecks,
        to: r("resume-ranking"),
      },
      {
        slug: "smart-shortlisting",
        title: "AI Smart Shortlisting",
        description: "Auto-shortlist the best candidates",
        icon: ClipboardCheck,
        to: r("smart-shortlisting"),
      },
      {
        slug: "candidate-ranking",
        title: "AI Candidate Ranking",
        description: "Compare and rank candidates side-by-side",
        icon: BarChart3,
        to: r("candidate-ranking"),
      },
      {
        slug: "candidate-summary",
        title: "AI Candidate Summary",
        description: "Instant profile summaries per applicant",
        icon: Sparkles,
        to: r("candidate-summary"),
      },
      {
        slug: "hiring-recommendation",
        title: "AI Hiring Recommendation",
        description: "Data-backed hire/no-hire suggestions",
        icon: Trophy,
        to: r("hiring-recommendation"),
      },
      {
        slug: "candidate-success-prediction",
        title: "AI Candidate Success Prediction",
        description: "Predict on-the-job success likelihood",
        icon: Target,
        to: r("candidate-success-prediction"),
      },
      {
        slug: "talent-search",
        title: "AI Talent Search",
        description: "Search talent across the platform with AI",
        icon: Search,
        to: r("talent-search"),
      },
      {
        slug: "duplicate-candidate-detection",
        title: "AI Duplicate Candidate Detection",
        description: "Spot duplicate profiles automatically",
        icon: CopyCheck,
        to: r("duplicate-candidate-detection"),
      },
      {
        slug: "skill-gap-analysis",
        title: "AI Skill Gap Analysis",
        description: "Identify skill gaps in your pipeline",
        icon: GraduationCap,
        to: r("skill-gap-analysis"),
      },
      {
        slug: "interview-question-generator",
        title: "AI Interview Question Generator",
        description: "Generate role-specific interview questions",
        icon: HelpCircle,
        to: r("interview-question-generator"),
      },
    ],
  },
  {
    id: "job",
    label: "Job AI",
    icon: PenLine,
    items: [
      {
        slug: "job-description-writer",
        title: "AI Job Description Writer",
        description: "Draft compelling job posts in seconds",
        icon: PenLine,
        to: r("job-description-writer"),
      },
      {
        slug: "job-description-optimizer",
        title: "AI Job Description Optimizer",
        description: "Tune listings for reach and clarity",
        icon: FileEdit,
        to: r("job-description-optimizer"),
      },
      {
        slug: "hiring-analytics",
        title: "AI Hiring Analytics",
        description: "AI-driven insights on your hiring funnel",
        icon: LineChart,
        to: r("hiring-analytics"),
      },
    ],
  },
  {
    id: "hr-office",
    label: "HR & Office AI",
    icon: Mail,
    items: [
      {
        slug: "email-assistant",
        title: "AI Email Assistant",
        description: "Draft and reply to candidate emails",
        icon: Mail,
        to: r("email-assistant"),
      },
      {
        slug: "meeting-scheduler",
        title: "AI Meeting Scheduler",
        description: "Schedule interviews effortlessly",
        icon: CalendarClock,
        to: r("meeting-scheduler"),
      },
      {
        slug: "onboarding-assistant",
        title: "AI Onboarding Assistant",
        description: "Guide new hires through onboarding",
        icon: UserPlus,
        to: r("onboarding-assistant"),
      },
      {
        slug: "office-dashboard",
        title: "AI Office Dashboard",
        description: "Centralize HR operations with AI",
        icon: LayoutGrid,
        to: r("office-dashboard"),
      },
      {
        slug: "recruitment-automation",
        title: "AI Recruitment Automation",
        description: "Automate repetitive recruiting tasks",
        icon: Bot,
        to: r("recruitment-automation"),
      },
      {
        slug: "workflow-builder",
        title: "AI Workflow Builder",
        description: "Build custom hiring workflows with AI",
        icon: Workflow,
        to: r("workflow-builder"),
      },
      {
        slug: "predictive-hiring-analytics",
        title: "Predictive Hiring Analytics",
        description: "Forecast hiring outcomes with AI",
        icon: Brain,
        to: r("predictive-hiring-analytics"),
      },
      {
        slug: "workforce-planning",
        title: "Workforce Planning AI",
        description: "Plan headcount and roles with AI",
        icon: Network,
        to: r("workforce-planning"),
      },
    ],
  },
  {
    id: "enterprise",
    label: "Enterprise AI",
    icon: Lock,
    items: [
      {
        slug: "private-ai-models",
        title: "Private AI Models",
        description: "Dedicated, private AI models for your org",
        icon: Lock,
        to: r("private-ai-models"),
      },
      {
        slug: "company-knowledge-ai",
        title: "Company Knowledge AI",
        description: "AI trained on your company knowledge",
        icon: BookOpen,
        to: r("company-knowledge-ai"),
      },
      {
        slug: "talent-intelligence",
        title: "AI Talent Intelligence",
        description: "Org-wide talent insights powered by AI",
        icon: Globe,
        to: r("talent-intelligence"),
      },
      {
        slug: "white-label-assistant",
        title: "White-label AI Assistant",
        description: "Brandable AI assistant for your team",
        icon: Palette,
        to: r("white-label-assistant"),
      },
      {
        slug: "dedicated-ai-success-manager",
        title: "Dedicated AI Success Manager",
        description: "A dedicated expert for your AI rollout",
        icon: Headset,
        to: r("dedicated-ai-success-manager"),
      },
    ],
  },
];

export const ALL_EMPLOYER_AI_FEATURES: AiFeatureItem[] = EMPLOYER_AI_GROUPS.flatMap((g) => g.items);

export function getAiFeature(slug: string): AiFeatureItem | undefined {
  return ALL_EMPLOYER_AI_FEATURES.find((f) => f.slug === slug);
}
