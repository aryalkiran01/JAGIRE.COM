/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback, useRef, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { SkeletonCard } from "@/components/ui/skeleton-loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Sparkles,
  Upload,
  Loader2,
  Briefcase,
  TrendingUp,
  Award,
  Building2,
  DollarSign,
  Target,
  Rocket,
  FileDown,
  Lightbulb,
  ScanText,
  FileText,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileUp,
  RefreshCw,
  Download,
  ChevronRight,
  Wallet,
  MapPin,
  ExternalLink,
  Send,
  Flag,
  Globe,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { scanResumeFromStorage } from "@/lib/ai.service";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/resume-scanner")({
  component: ResumeScanner,
  head: () => ({ meta: [{ title: "AI Resume Scanner — Jagire" }] }),
});

// ── Types ───────────────────────────────────────────────────────────────────

type Roadmap = {
  career_paths?: Array<{ title: string; why: string; next_steps: string[] }>;
  skill_gaps?: string[];
  missing_skills?: string[];
  recommended_certifications?: Array<{ name: string; provider: string }>;
  suggested_projects?: Array<{ title: string; description: string }>;
  recommended_jobs?: Array<{ title: string; why: string }>;
  companies_hiring?: Array<{ name: string; sector: string }>;
  salary_prediction?: { low: number; mid: number; high: number; currency: string } | null;
  resume_improvements?: string[];
  interview_prep_plan?: {
    thirty_days: string[];
    sixty_days: string[];
    ninety_days: string[];
    one_eighty_days: string[];
  } | null;
};

type ResumeData = {
  id: string;
  file_name?: string;
  file_size?: number;
  overall_score?: number;
  ats_score?: number;
  grammar_score?: number;
  formatting_score?: number;
  keyword_score?: number;
  professionalism_score?: number;
  suggestions?: string[];
  parsed_data?: Record<string, any>;
  resume_data?: any;
  career_roadmap?: Roadmap;
};

type JobMatch = {
  id: string;
  title: string;
  company: string | null;
  score: number;
  location?: string | null;
  salaryMin?: number;
  salaryMax?: number;
  companyLocation?: string;
  isNepalBased?: boolean;
  jobType?: string;
  requiredSkills?: string[];
};

type CompanyHiring = {
  name: string;
  sector: string;
  location?: string;
  isNepalBased?: boolean;
  activeJobs?: number;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const VALID_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// ── Helper Functions ────────────────────────────────────────────────────────

function formatNPR(value: number): string {
  return `Rs. ${value.toLocaleString("en-IN")}`;
}

function formatNPRShort(value: number): string {
  if (value >= 100000) {
    return `Rs. ${(value / 100000).toFixed(1)}L`;
  }
  if (value >= 1000) {
    return `Rs. ${(value / 1000).toFixed(0)}K`;
  }
  return `Rs. ${value}`;
}

function getScoreColor(value: number | null | undefined): string {
  if (value == null) return "text-muted-foreground";
  if (value >= 80) return "text-green-500";
  if (value >= 60) return "text-amber-500";
  return "text-red-500";
}

function getScoreIcon(value: number | null | undefined): LucideIcon {
  if (value == null) return AlertCircle;
  if (value >= 80) return CheckCircle2;
  if (value >= 60) return AlertCircle;
  return XCircle;
}

function getScoreMessage(value: number): string {
  if (value >= 80) return "Excellent! Your resume is well-optimized for ATS systems.";
  if (value >= 60) return "Good foundation. A few improvements could boost your visibility.";
  return "Needs work. Focus on the recommendations below to improve.";
}

function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return "File must be under 10MB";
  }
  if (!VALID_FILE_TYPES.includes(file.type) && !file.name.match(/\.(pdf|docx)$/i)) {
    return "Only PDF or DOCX files are supported";
  }
  return null;
}

// ── Score Ring Component ────────────────────────────────────────────────────

function ScoreRing({ value }: { value: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 80 ? "text-green-500" : value >= 60 ? "text-amber-500" : "text-red-500";

  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${color} transition-all duration-1000`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-2xl font-bold ${color}`}>{value}</span>
      </div>
    </div>
  );
}

// ── Salary Card Component ───────────────────────────────────────────────────

function SalaryPredictionCard({
  salary,
}: {
  salary: { low: number; mid: number; high: number; currency: string };
}) {
  const ranges = [
    {
      label: "Entry Level",
      value: salary.low,
      color: "text-muted-foreground",
      borderColor: "border-border",
    },
    { label: "Average", value: salary.mid, color: "gradient-text", borderColor: "border-primary" },
    {
      label: "Experienced",
      value: salary.high,
      color: "text-green-600",
      borderColor: "border-border",
    },
  ];

  return (
    <Card className="glass animate-fade-in-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" /> Salary Prediction (Nepal)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {ranges.map((range) => (
            <div
              key={range.label}
              className={`text-center rounded-xl border-2 ${range.borderColor} p-4 hover:shadow-card-soft transition-all`}
            >
              <div className={`text-lg font-bold ${range.color}`}>
                {formatNPRShort(range.value)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{range.label}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">per month</div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
          <div className="text-sm font-medium mb-2">Detailed Breakdown</div>
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Entry Level:</span>
              <span className="font-medium">{formatNPR(salary.low)}/month</span>
            </div>
            <div className="flex justify-between">
              <span>Average:</span>
              <span className="font-medium">{formatNPR(salary.mid)}/month</span>
            </div>
            <div className="flex justify-between">
              <span>Experienced:</span>
              <span className="font-medium">{formatNPR(salary.high)}/month</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Section Card Component ──────────────────────────────────────────────────

function SectionCard({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("glass animate-fade-in-up", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// ── Job Match Card Component ────────────────────────────────────────────────

function JobMatchCard({ match, onApply }: { match: JobMatch; onApply: (match: JobMatch) => void }) {
  const isHighMatch = match.score >= 80;
  const isNepalBased = match.isNepalBased ?? false;

  return (
    <div className="rounded-xl border p-4 hover:bg-muted/30 hover:shadow-card-soft transition-all group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
              {match.title}
            </h3>
            {isNepalBased ? (
              <Badge variant="secondary" className="text-[10px]">
                <Flag className="h-3 w-3 mr-1" />
                Nepal
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px]">
                <Globe className="h-3 w-3 mr-1" />
                International
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">{match.company ?? "—"}</div>

          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            {match.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {match.location}
              </span>
            )}
            {match.salaryMin && match.salaryMax && (
              <span className="flex items-center gap-1">
                <Wallet className="h-3 w-3" />
                {formatNPRShort(match.salaryMin)} - {formatNPRShort(match.salaryMax)}
              </span>
            )}
            {match.jobType && (
              <span className="flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                {match.jobType}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Badge
            className={cn(
              "text-primary-foreground",
              isHighMatch ? "gradient-brand" : "bg-secondary",
            )}
          >
            {match.score}% match
          </Badge>
          <Button
            size="sm"
            variant={isHighMatch ? "default" : "outline"}
            onClick={() => onApply(match)}
            className="text-xs"
          >
            <Send className="h-3 w-3 mr-1" />
            Apply Now
          </Button>
        </div>
      </div>

      {/* Required Skills */}
      {match.requiredSkills && match.requiredSkills.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {match.requiredSkills.slice(0, 5).map((skill, i) => (
            <Badge key={i} variant="outline" className="text-[10px]">
              {skill}
            </Badge>
          ))}
          {match.requiredSkills.length > 5 && (
            <span className="text-[10px] text-muted-foreground">
              +{match.requiredSkills.length - 5} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

function ResumeScanner() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const runScan = useServerFn(scanResumeFromStorage);

  const [dragActive, setDragActive] = useState(false);
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: resume, isLoading } = useQuery({
    queryKey: ["my-resume-full", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resumes")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_default", true)
        .maybeSingle();

      if (error) throw error;
      return data as ResumeData | null;
    },
  });

  const scanMutation = useMutation({
    mutationFn: async (resumeId: string) => {
      return runScan({ data: { resumeId } });
    },
    onSuccess: (result) => {
      setMatches(result.matches ?? []);
      toast.success("Analysis complete! Career roadmap generated.");
      qc.invalidateQueries({ queryKey: ["my-resume-full"] });
      qc.invalidateQueries({ queryKey: ["my-resume"] });
    },
    onError: (error) => {
      toast.error((error as Error).message);
    },
  });

  const handleFile = useCallback(
    async (file: File) => {
      if (!user || !file) return;

      const validationError = validateFile(file);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      const uploadToast = toast.loading("Uploading resume...");

      try {
        const path = `${user.id}/${Date.now()}-${file.name}`;
        const up = await supabase.storage.from("resumes").upload(path, file, { upsert: true });
        if (up.error) throw up.error;

        await supabase.from("resumes").update({ is_default: false }).eq("user_id", user.id);

        const ins = await supabase
          .from("resumes")
          .insert({
            user_id: user.id,
            file_name: file.name,
            file_path: path,
            file_size: file.size,
            mime_type: file.type,
            is_default: true,
          })
          .select()
          .single();

        if (ins.error) throw ins.error;

        toast.success("Resume uploaded — analyzing...", { id: uploadToast });
        await scanMutation.mutateAsync(ins.data.id);
      } catch (err) {
        toast.error((err as Error).message, { id: uploadToast });
      }
    },
    [user, scanMutation],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const reAnalyze = useCallback(async () => {
    if (!resume) {
      toast.error("Upload a resume first");
      return;
    }

    try {
      let scanId = resume.id;

      const parsedData = resume.parsed_data as Record<string, any> | null;
      const hasStoredText = parsedData?.raw_text || resume.resume_data;

      if (!hasStoredText) {
        const { data: builderResume } = await supabase
          .from("resumes")
          .select("id, resume_data, parsed_data")
          .eq("user_id", user!.id)
          .not("resume_data", "is", null)
          .order("updated_at", { ascending: false })
          .limit(1)
          .single();

        if (builderResume) {
          toast.info("Using builder-saved resume data...");
          scanId = builderResume.id;
        }
      }

      await scanMutation.mutateAsync(scanId);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }, [resume, user, scanMutation]);

  const handleApply = useCallback(
    async (match: JobMatch) => {
      if (!user || !resume) {
        toast.error("Please upload a resume first");
        return;
      }

      try {
        // Check if already applied
        const { data: existingApplication } = await supabase
          .from("applications")
          .select("id")
          .eq("job_id", match.id)
          .eq("applicant_id", user.id)
          .maybeSingle();

        if (existingApplication) {
          toast.info("You've already applied to this job");
          return;
        }

        // Create application
        const { error: applicationError } = await supabase.from("applications").insert({
          job_id: match.id,
          applicant_id: user.id,
          resume_id: resume.id,
          status: "applied",
        });

        if (applicationError) throw applicationError;

        toast.success(`Applied to ${match.title} at ${match.company}!`);

        // Invalidate applications query
        qc.invalidateQueries({ queryKey: ["applications"] });
      } catch (error) {
        toast.error(`Failed to apply: ${(error as Error).message}`);
      }
    },
    [user, resume, qc],
  );

  const exportRoadmapPDF = useCallback(async () => {
    const roadmap = resume?.career_roadmap;
    if (!roadmap) return;

    setIsExporting(true);

    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      let y = 20;

      doc.setFontSize(20);
      doc.text("Career Roadmap", 20, y);
      y += 10;

      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, y);
      y += 10;

      const addSection = (title: string, lines: string[]) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(14);
        doc.text(title, 20, y);
        y += 7;
        doc.setFontSize(10);
        for (const line of lines) {
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
          const split = doc.splitTextToSize(`• ${line}`, 170);
          doc.text(split, 25, y);
          y += split.length * 5 + 2;
        }
        y += 5;
      };

      if (roadmap.career_paths?.length)
        addSection(
          "Career Paths",
          roadmap.career_paths.map((c) => `${c.title}: ${c.why}`),
        );
      if (roadmap.skill_gaps?.length) addSection("Skill Gaps", roadmap.skill_gaps);
      if (roadmap.missing_skills?.length) addSection("Missing Skills", roadmap.missing_skills);
      if (roadmap.recommended_certifications?.length)
        addSection(
          "Recommended Certifications",
          roadmap.recommended_certifications.map((c) => `${c.name} (${c.provider})`),
        );
      if (roadmap.suggested_projects?.length)
        addSection(
          "Suggested Projects",
          roadmap.suggested_projects.map((p) => `${p.title}: ${p.description}`),
        );
      if (roadmap.recommended_jobs?.length)
        addSection(
          "Recommended Jobs",
          roadmap.recommended_jobs.map((j) => `${j.title}: ${j.why}`),
        );
      if (roadmap.companies_hiring?.length)
        addSection(
          "Companies Hiring",
          roadmap.companies_hiring.map((c) => `${c.name} (${c.sector})`),
        );
      if (roadmap.salary_prediction)
        addSection("Salary Prediction (Nepal)", [
          `Entry Level: ${formatNPR(roadmap.salary_prediction.low)}/month`,
          `Average: ${formatNPR(roadmap.salary_prediction.mid)}/month`,
          `Experienced: ${formatNPR(roadmap.salary_prediction.high)}/month`,
        ]);
      if (roadmap.resume_improvements?.length)
        addSection("Resume Improvements", roadmap.resume_improvements);
      if (roadmap.interview_prep_plan) {
        addSection("30-Day Plan", roadmap.interview_prep_plan.thirty_days ?? []);
        addSection("60-Day Plan", roadmap.interview_prep_plan.sixty_days ?? []);
        addSection("90-Day Plan", roadmap.interview_prep_plan.ninety_days ?? []);
        addSection("180-Day Plan", roadmap.interview_prep_plan.one_eighty_days ?? []);
      }

      doc.save("career-roadmap.pdf");
      toast.success("Roadmap exported successfully");
    } catch (error) {
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  }, [resume]);

  const scores = useMemo(() => {
    if (!resume) return [];

    return [
      { label: "Overall", value: resume.overall_score, icon: Sparkles, color: "text-primary" },
      { label: "ATS", value: resume.ats_score, icon: ScanText, color: "text-blue-500" },
      {
        label: "Grammar",
        value: resume.grammar_score,
        icon: CheckCircle2,
        color: "text-green-500",
      },
      { label: "Formatting", value: resume.formatting_score, icon: FileText, color: "text-accent" },
      { label: "Keywords", value: resume.keyword_score, icon: Target, color: "text-orange-500" },
      {
        label: "Professionalism",
        value: resume.professionalism_score,
        icon: Award,
        color: "text-purple-500",
      },
    ];
  }, [resume]);

  const suggestions = resume?.suggestions ?? [];
  const roadmap = resume?.career_roadmap ?? null;
  const isBusy = scanMutation.isPending;

  // Sort matches: Nepal-based first, then by score
  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => {
      if (a.isNepalBased !== b.isNepalBased) {
        return a.isNepalBased ? -1 : 1;
      }
      return b.score - a.score;
    });
  }, [matches]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center shadow-glow">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            AI Resume Scanner
          </h1>
          <p className="text-muted-foreground mt-1">
            Upload your resume for instant ATS scoring, keyword analysis, and a personalized career
            roadmap.
          </p>
        </div>
        {resume && (
          <Button variant="outline" onClick={reAnalyze} disabled={isBusy}>
            {isBusy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Re-analyze
          </Button>
        )}
      </div>

      {/* Drag & drop upload */}
      <Card className="glass hover:shadow-card-soft transition-all">
        <CardContent className="p-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => !isBusy && fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
              dragActive
                ? "border-primary bg-primary/5 scale-[1.02]"
                : "border-border hover:border-primary/50 hover:bg-muted/30"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
              disabled={isBusy}
            />

            {isBusy ? (
              <>
                <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
                <div className="font-semibold text-lg">Analyzing your resume…</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Extracting text, scoring, and generating your career roadmap
                </p>
              </>
            ) : resume ? (
              <>
                <div className="h-14 w-14 rounded-2xl gradient-brand mx-auto mb-4 flex items-center justify-center shadow-glow">
                  <FileText className="h-7 w-7 text-primary-foreground" />
                </div>
                <div className="font-semibold text-lg">{resume.file_name}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Click to upload a new resume or drag & drop to replace
                </p>
                <div className="flex justify-center gap-2 mt-3">
                  <Badge variant="secondary">
                    {((resume.file_size ?? 0) / 1024).toFixed(0)} KB
                  </Badge>
                  {resume.overall_score != null && (
                    <Badge className="gradient-brand text-primary-foreground">
                      Score: {resume.overall_score}/100
                    </Badge>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="h-14 w-14 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
                  <FileUp className="h-7 w-7 text-muted-foreground" />
                </div>
                <div className="font-semibold text-lg">Drop your resume here</div>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse — PDF or DOCX, max 10MB
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading skeleton */}
      {isLoading && <SkeletonCard />}

      {/* Scores */}
      {resume?.overall_score != null && (
        <Card className="glass animate-fade-in-up">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" /> Your Scores
              </h2>
              <Badge
                className={`text-lg font-bold ${getScoreColor(resume.overall_score)}`}
                variant="outline"
              >
                {resume.overall_score}/100
              </Badge>
            </div>

            {/* Overall score ring */}
            <div className="flex items-center gap-6">
              <ScoreRing value={resume.overall_score ?? 0} />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  {getScoreMessage(resume.overall_score)}
                </p>
              </div>
            </div>

            {/* Score breakdown */}
            <div className="grid md:grid-cols-2 gap-4">
              {scores.map((s) => {
                const ScoreIcon = getScoreIcon(s.value);
                return (
                  <div key={s.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5">
                        <s.icon className={`h-4 w-4 ${s.color}`} />
                        {s.label}
                      </span>
                      <span className={`font-semibold ${getScoreColor(s.value)}`}>
                        {s.value ?? 0}/100
                      </span>
                    </div>
                    <Progress value={s.value ?? 0} className="h-2" />
                  </div>
                );
              })}
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="pt-3 border-t">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" /> Actionable Recommendations
                </h3>
                <div className="grid md:grid-cols-2 gap-2">
                  {suggestions.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 rounded-lg border p-3 hover:bg-muted/30 transition-colors animate-fade-in"
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <div className="h-6 w-6 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-amber-600">{i + 1}</span>
                      </div>
                      <span className="text-sm">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Career Roadmap */}
      {roadmap && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Rocket className="h-6 w-6 text-primary" /> Career Roadmap
            </h2>
            <Button variant="outline" size="sm" onClick={exportRoadmapPDF} disabled={isExporting}>
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-1" />
              )}
              Export PDF
            </Button>
          </div>

          {roadmap.career_paths && roadmap.career_paths.length > 0 && (
            <SectionCard icon={Target} title="Career Paths">
              <div className="space-y-3">
                {roadmap.career_paths.map((c, i) => (
                  <div
                    key={i}
                    className="border-l-2 border-primary pl-4 hover:bg-muted/30 rounded-r-lg py-2 transition-colors"
                  >
                    <div className="font-semibold">{c.title}</div>
                    <p className="text-sm text-muted-foreground mt-0.5">{c.why}</p>
                    {c.next_steps?.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {c.next_steps.map((s, j) => (
                          <li key={j} className="text-sm flex items-start gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {roadmap.skill_gaps && roadmap.skill_gaps.length > 0 && (
              <SectionCard icon={TrendingUp} title="Skill Gaps">
                <div className="flex flex-wrap gap-2">
                  {roadmap.skill_gaps.map((s, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="hover:scale-105 transition-transform"
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </SectionCard>
            )}

            {roadmap.missing_skills && roadmap.missing_skills.length > 0 && (
              <SectionCard icon={Target} title="Missing Skills">
                <div className="flex flex-wrap gap-2">
                  {roadmap.missing_skills.map((s, i) => (
                    <Badge key={i} variant="outline">
                      {s}
                    </Badge>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>

          {roadmap.recommended_certifications && roadmap.recommended_certifications.length > 0 && (
            <SectionCard icon={Award} title="Recommended Certifications">
              <div className="grid md:grid-cols-2 gap-3">
                {roadmap.recommended_certifications.map((c, i) => (
                  <div
                    key={i}
                    className="rounded-xl border p-4 hover:shadow-card-soft hover:-translate-y-0.5 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="h-4 w-4 text-primary" />
                      <div className="font-medium">{c.name}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">{c.provider}</div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {roadmap.suggested_projects && roadmap.suggested_projects.length > 0 && (
            <SectionCard icon={Rocket} title="Suggested Projects">
              <div className="space-y-2">
                {roadmap.suggested_projects.map((p, i) => (
                  <div
                    key={i}
                    className="rounded-xl border p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="font-medium">{p.title}</div>
                    <p className="text-sm text-muted-foreground mt-0.5">{p.description}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {roadmap.salary_prediction && <SalaryPredictionCard salary={roadmap.salary_prediction} />}

          <div className="grid md:grid-cols-2 gap-4">
            {roadmap.recommended_jobs && roadmap.recommended_jobs.length > 0 && (
              <SectionCard icon={Briefcase} title="Recommended Jobs">
                <div className="space-y-2">
                  {roadmap.recommended_jobs.map((j, i) => (
                    <div
                      key={i}
                      className="rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="font-medium">{j.title}</div>
                      <p className="text-sm text-muted-foreground">{j.why}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {roadmap.companies_hiring && roadmap.companies_hiring.length > 0 && (
              <SectionCard icon={Building2} title="Companies Hiring">
                <div className="space-y-2">
                  {roadmap.companies_hiring.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                    >
                      <div>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.sector}</div>
                      </div>
                      <Badge variant="secondary">{c.sector}</Badge>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>

          {roadmap.resume_improvements && roadmap.resume_improvements.length > 0 && (
            <SectionCard icon={Lightbulb} title="Resume Improvements">
              <ul className="space-y-2">
                {roadmap.resume_improvements.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {roadmap.interview_prep_plan && (
            <SectionCard icon={Target} title="Interview Preparation Plan">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: "30 Days",
                    items: roadmap.interview_prep_plan.thirty_days,
                    color: "border-green-500",
                  },
                  {
                    label: "60 Days",
                    items: roadmap.interview_prep_plan.sixty_days,
                    color: "border-blue-500",
                  },
                  {
                    label: "90 Days",
                    items: roadmap.interview_prep_plan.ninety_days,
                    color: "border-amber-500",
                  },
                  {
                    label: "180 Days",
                    items: roadmap.interview_prep_plan.one_eighty_days,
                    color: "border-purple-500",
                  },
                ].map((phase) => (
                  <div
                    key={phase.label}
                    className={`rounded-xl border-l-4 ${phase.color} bg-muted/20 p-4`}
                  >
                    <div className="font-semibold mb-2">{phase.label}</div>
                    <ul className="space-y-1.5">
                      {phase.items?.map((s, i) => (
                        <li key={i} className="text-sm flex items-start gap-1.5">
                          <CheckCircle2 className="h-3 w-3 text-primary mt-1 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      )}

      {/* Job matches */}
      {sortedMatches.length > 0 && (
        <Card className="glass animate-fade-in-up">
          <CardContent className="p-6 space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Briefcase className="h-5 w-5" /> Top Job Matches
            </h2>
            <p className="text-sm text-muted-foreground">
              Based on your resume skills. Nepal-based jobs shown first.
            </p>
            <div className="space-y-2">
              {sortedMatches.map((match) => (
                <JobMatchCard key={match.id} match={match} onApply={handleApply} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
