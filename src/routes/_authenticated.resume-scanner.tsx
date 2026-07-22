import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { toast } from "sonner";
import { scanResumeFromStorage } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/resume-scanner")({
  component: ResumeScanner,
});

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

function ResumeScanner() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const runScan = useServerFn(scanResumeFromStorage);
  const [busy, setBusy] = useState(false);
  const [matches, setMatches] = useState<
    Array<{ id: string; title: string; company: string | null; score: number }>
  >([]);

  const { data: resume } = useQuery({
    queryKey: ["my-resume-full", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (
        await supabase
          .from("resumes")
          .select("*")
          .eq("user_id", user!.id)
          .eq("is_default", true)
          .maybeSingle()
      ).data,
  });

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setBusy(true);
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
      toast.success("Resume uploaded — analyzing…");
      const result = await runScan({ data: { resumeId: ins.data.id } });
      setMatches(result.matches ?? []);
      toast.success("Analysis complete! Career roadmap generated.");
      qc.invalidateQueries({ queryKey: ["my-resume-full"] });
      qc.invalidateQueries({ queryKey: ["my-resume"] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function reAnalyze() {
    if (!resume) return toast.error("Upload a resume first");
    setBusy(true);
    try {
      const result = await runScan({ data: { resumeId: resume.id } });
      setMatches(result.matches ?? []);
      toast.success("Re-analyzed! Career roadmap updated.");
      qc.invalidateQueries({ queryKey: ["my-resume-full"] });
      qc.invalidateQueries({ queryKey: ["my-resume"] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function exportRoadmapPDF() {
    if (!roadmap) return;
    import("jspdf").then(({ jsPDF }) => {
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

      if (roadmap.career_paths?.length) {
        addSection(
          "Career Paths",
          roadmap.career_paths.map((c) => `${c.title}: ${c.why}`),
        );
      }
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
      if (roadmap.salary_prediction) {
        addSection("Salary Prediction", [
          `Low: ${roadmap.salary_prediction.low} ${roadmap.salary_prediction.currency}`,
          `Mid: ${roadmap.salary_prediction.mid} ${roadmap.salary_prediction.currency}`,
          `High: ${roadmap.salary_prediction.high} ${roadmap.salary_prediction.currency}`,
        ]);
      }
      if (roadmap.resume_improvements?.length)
        addSection("Resume Improvements", roadmap.resume_improvements);
      if (roadmap.interview_prep_plan) {
        addSection("30-Day Plan", roadmap.interview_prep_plan.thirty_days ?? []);
        addSection("60-Day Plan", roadmap.interview_prep_plan.sixty_days ?? []);
        addSection("90-Day Plan", roadmap.interview_prep_plan.ninety_days ?? []);
        addSection("180-Day Plan", roadmap.interview_prep_plan.one_eighty_days ?? []);
      }

      doc.save("career-roadmap.pdf");
      toast.success("Roadmap exported");
    });
  }

  const scores = resume
    ? [
        { label: "Overall", value: resume.overall_score },
        { label: "ATS", value: resume.ats_score },
        { label: "Grammar", value: resume.grammar_score },
        { label: "Formatting", value: resume.formatting_score },
        { label: "Keywords", value: resume.keyword_score },
        { label: "Professionalism", value: resume.professionalism_score },
      ]
    : [];

  const suggestions = (resume?.suggestions as string[] | null) ?? [];
  const roadmap = (resume?.career_roadmap as Roadmap | null) ?? null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-primary" /> AI Resume Scanner
        </h1>
        <p className="text-muted-foreground">
          Upload and analyze your resume with AI. Get a personalized career roadmap.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <label className="flex items-center gap-3 cursor-pointer border-2 border-dashed rounded-lg p-6 hover:bg-muted transition">
            {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
            <div>
              <div className="font-medium">
                {resume ? resume.file_name : "Upload resume (PDF or DOCX)"}
              </div>
              <div className="text-xs text-muted-foreground">
                {busy
                  ? "Extracting text, scoring, and generating your career roadmap…"
                  : `Click to ${resume ? "replace and re-scan" : "upload — we'll auto-scan it"}`}
              </div>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.docx"
              onChange={handleFile}
              disabled={busy}
            />
          </label>
          {resume && (
            <div className="mt-3 flex justify-end">
              <Button size="sm" variant="outline" onClick={reAnalyze} disabled={busy}>
                {busy ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Re-analyze
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {resume?.overall_score != null && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-bold">Your scores</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {scores.map((s) => (
                <div key={s.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{s.label}</span>
                    <span className="font-semibold">{s.value ?? 0}/100</span>
                  </div>
                  <Progress value={s.value ?? 0} />
                </div>
              ))}
            </div>
            {suggestions.length > 0 && (
              <div>
                <h3 className="font-semibold mt-4 mb-2">Suggestions</h3>
                <ul className="space-y-1 text-sm list-disc pl-5">
                  {suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
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
            <Button variant="outline" size="sm" onClick={exportRoadmapPDF}>
              <FileDown className="h-4 w-4 mr-1" /> Export PDF
            </Button>
          </div>

          {roadmap.career_paths?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" /> Career Paths
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {roadmap.career_paths.map((c, i) => (
                  <div key={i} className="border-l-2 border-primary pl-3">
                    <div className="font-medium">{c.title}</div>
                    <p className="text-sm text-muted-foreground">{c.why}</p>
                    {c.next_steps?.length > 0 && (
                      <ul className="mt-1 text-sm list-disc pl-5">
                        {c.next_steps.map((s, j) => (
                          <li key={j}>{s}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {roadmap.skill_gaps?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5" /> Skill Gaps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {roadmap.skill_gaps.map((s, i) => (
                      <Badge key={i} variant="secondary">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {roadmap.missing_skills?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-5 w-5" /> Missing Skills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {roadmap.missing_skills.map((s, i) => (
                      <Badge key={i} variant="outline">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {roadmap.recommended_certifications?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" /> Recommended Certifications
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-3">
                {roadmap.recommended_certifications.map((c, i) => (
                  <div key={i} className="border rounded-lg p-3">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-sm text-muted-foreground">{c.provider}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {roadmap.suggested_projects?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5" /> Suggested Projects
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {roadmap.suggested_projects.map((p, i) => (
                  <div key={i} className="border rounded-lg p-3">
                    <div className="font-medium">{p.title}</div>
                    <p className="text-sm text-muted-foreground">{p.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {roadmap.salary_prediction && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" /> Salary Prediction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-muted-foreground">
                      {roadmap.salary_prediction.low}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Low ({roadmap.salary_prediction.currency})
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {roadmap.salary_prediction.mid}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Mid ({roadmap.salary_prediction.currency})
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {roadmap.salary_prediction.high}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      High ({roadmap.salary_prediction.currency})
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {roadmap.recommended_jobs?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" /> Recommended Jobs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {roadmap.recommended_jobs.map((j, i) => (
                    <div key={i}>
                      <div className="font-medium">{j.title}</div>
                      <p className="text-sm text-muted-foreground">{j.why}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {roadmap.companies_hiring?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" /> Companies Hiring
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {roadmap.companies_hiring.map((c, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="font-medium">{c.name}</span>
                      <Badge variant="secondary">{c.sector}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {roadmap.resume_improvements?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" /> Resume Improvements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm list-disc pl-5">
                  {roadmap.resume_improvements.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {roadmap.interview_prep_plan && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" /> Interview Preparation Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                {[
                  { label: "30 Days", items: roadmap.interview_prep_plan.thirty_days },
                  { label: "60 Days", items: roadmap.interview_prep_plan.sixty_days },
                  { label: "90 Days", items: roadmap.interview_prep_plan.ninety_days },
                  { label: "180 Days", items: roadmap.interview_prep_plan.one_eighty_days },
                ].map((phase) => (
                  <div key={phase.label} className="border rounded-lg p-3">
                    <div className="font-semibold mb-2">{phase.label}</div>
                    <ul className="space-y-1 text-sm list-disc pl-5">
                      {phase.items?.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {matches.length > 0 && (
        <Card>
          <CardContent className="p-6 space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Briefcase className="h-5 w-5" /> Top job matches
            </h2>
            <p className="text-sm text-muted-foreground">Based on your resume skills.</p>
            <div className="space-y-2">
              {matches.map((m) => (
                <Link
                  key={m.id}
                  to="/jobs/$jobId"
                  params={{ jobId: m.id }}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition"
                >
                  <div>
                    <div className="font-medium">{m.title}</div>
                    <div className="text-xs text-muted-foreground">{m.company ?? "—"}</div>
                  </div>
                  <div className="text-sm font-semibold text-primary">{m.score}% match</div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
