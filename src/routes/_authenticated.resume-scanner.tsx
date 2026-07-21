import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Upload, Loader2, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { scanResumeFromStorage } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/resume-scanner")({
  component: ResumeScanner,
});

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
      toast.success("Analysis complete!");
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
      toast.success("Re-analyzed!");
      qc.invalidateQueries({ queryKey: ["my-resume-full"] });
      qc.invalidateQueries({ queryKey: ["my-resume"] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-primary" /> AI Resume Scanner
        </h1>
        <p className="text-muted-foreground">Upload and analyze your resume with AI.</p>
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
                  ? "Extracting text and scoring with AI…"
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
