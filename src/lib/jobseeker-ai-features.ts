import {
  FileText,
  PenLine,
  Briefcase,
  Search,
  DollarSign,
  FileCheck,
  MapPin,
  MessageSquare,
  Users,
  Target,
  TrendingUp,
  Repeat,
  HandHeart,
  ListChecks,
  GraduationCap,
  Award,
  Code2,
  LayoutGrid,
  User,
  Sparkles,
  Star,
  type LucideIcon,
} from "lucide-react";

export interface JobSeekerAiFeatureItem {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
  to: string;
}

export interface JobSeekerAiFeatureGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  items: JobSeekerAiFeatureItem[];
}

const r = (slug: string) => `/ai/${slug}`;

export const JOBSEEKER_AI_GROUPS: JobSeekerAiFeatureGroup[] = [
  {
    id: "resume-profile",
    label: "Resume & Profile AI",
    icon: FileText,
    items: [
      {
        slug: "cover-letter-generator",
        title: "AI Cover Letter Generator",
        description: "Generate tailored cover letters for any job",
        icon: PenLine,
        to: r("cover-letter-generator"),
      },
      {
        slug: "resume-optimizer",
        title: "AI Resume Optimizer",
        description: "Optimize resume sections for ATS and impact",
        icon: FileText,
        to: r("resume-optimizer"),
      },
      {
        slug: "linkedin-optimizer",
        title: "AI LinkedIn Optimizer",
        description: "Improve your LinkedIn profile for recruiters",
        icon: Briefcase,
        to: r("linkedin-optimizer"),
      },
      {
        slug: "personal-brand",
        title: "AI Personal Brand Builder",
        description: "Craft your personal brand and elevator pitch",
        icon: Sparkles,
        to: r("personal-brand"),
      },
      {
        slug: "bio-generator",
        title: "AI Bio Generator",
        description: "Generate professional bios in any length",
        icon: User,
        to: r("bio-generator"),
      },
    ],
  },
  {
    id: "job-search",
    label: "Job Search AI",
    icon: Search,
    items: [
      {
        slug: "job-match-analyzer",
        title: "AI Job Match Analyzer",
        description: "Analyze how well you match open roles",
        icon: Target,
        to: r("job-match-analyzer"),
      },
      {
        slug: "job-search-strategy",
        title: "AI Job Search Strategy",
        description: "Build a targeted job search action plan",
        icon: Search,
        to: r("job-search-strategy"),
      },
      {
        slug: "salary-analyzer",
        title: "AI Salary Analyzer",
        description: "Know your market value and negotiate better",
        icon: DollarSign,
        to: r("salary-analyzer"),
      },
      {
        slug: "offer-evaluator",
        title: "AI Offer Evaluator",
        description: "Evaluate job offers with a data-backed score",
        icon: FileCheck,
        to: r("offer-evaluator"),
      },
      {
        slug: "relocation-advisor",
        title: "AI Relocation Advisor",
        description: "Compare cost of living and job markets",
        icon: MapPin,
        to: r("relocation-advisor"),
      },
    ],
  },
  {
    id: "interview",
    label: "Interview AI",
    icon: MessageSquare,
    items: [
      {
        slug: "interview-prep",
        title: "AI Interview Prep",
        description: "Get likely questions and prep checklist",
        icon: MessageSquare,
        to: r("interview-prep"),
      },
      {
        slug: "mock-interview-feedback",
        title: "AI Mock Interview Feedback",
        description: "Practice answers and get AI feedback",
        icon: Users,
        to: r("mock-interview-feedback"),
      },
      {
        slug: "behavioral-question-prep",
        title: "AI Behavioral Question Prep",
        description: "Build STAR stories for common questions",
        icon: Star,
        to: r("behavioral-question-prep"),
      },
      {
        slug: "technical-interview-prep",
        title: "AI Technical Interview Prep",
        description: "Review topics, problems, and key concepts",
        icon: Code2,
        to: r("technical-interview-prep"),
      },
    ],
  },
  {
    id: "career-dev",
    label: "Career Development AI",
    icon: TrendingUp,
    items: [
      {
        slug: "skill-roadmap",
        title: "AI Skill Roadmap",
        description: "Build a personalized skill development plan",
        icon: TrendingUp,
        to: r("skill-roadmap"),
      },
      {
        slug: "career-transition-planner",
        title: "AI Career Transition Planner",
        description: "Plan a smooth career change with transferable skills",
        icon: Repeat,
        to: r("career-transition-planner"),
      },
      {
        slug: "mentorship-matcher",
        title: "AI Mentorship Matcher",
        description: "Find the right mentors and reach out effectively",
        icon: HandHeart,
        to: r("mentorship-matcher"),
      },
      {
        slug: "goal-planner",
        title: "AI Career Goal Planner",
        description: "Set structured career goals with milestones",
        icon: ListChecks,
        to: r("goal-planner"),
      },
    ],
  },
  {
    id: "learning",
    label: "Learning AI",
    icon: GraduationCap,
    items: [
      {
        slug: "course-recommender",
        title: "AI Course Recommender",
        description: "Get course recommendations with a learning path",
        icon: GraduationCap,
        to: r("course-recommender"),
      },
      {
        slug: "certification-advisor",
        title: "AI Certification Advisor",
        description: "Find certifications with the best career impact",
        icon: Award,
        to: r("certification-advisor"),
      },
      {
        slug: "project-idea-generator",
        title: "AI Project Idea Generator",
        description: "Generate portfolio projects that match your skills",
        icon: Code2,
        to: r("project-idea-generator"),
      },
      {
        slug: "portfolio-optimizer",
        title: "AI Portfolio Optimizer",
        description: "Improve your portfolio presentation and projects",
        icon: LayoutGrid,
        to: r("portfolio-optimizer"),
      },
    ],
  },
];

export const ALL_JOBSEEKER_AI_FEATURES: JobSeekerAiFeatureItem[] = JOBSEEKER_AI_GROUPS.flatMap(
  (g) => g.items,
);

export function getJobSeekerAiFeature(slug: string): JobSeekerAiFeatureItem | undefined {
  return ALL_JOBSEEKER_AI_FEATURES.find((f) => f.slug === slug);
}
