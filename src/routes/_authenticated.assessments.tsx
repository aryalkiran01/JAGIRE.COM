import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { GraduationCap, Plus, Award } from "lucide-react";

export const Route = createFileRoute("/_authenticated/assessments")({ component: Assessments });

type Q = { question: string; options: string[]; correct: number };

function Assessments() {
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const [taking, setTaking] = useState<any | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [creating, setCreating] = useState(false);

  const { data: list } = useQuery({
    queryKey: ["assessments"], enabled: !!user,
    queryFn: async () => (await supabase.from("assessments_catalog" as any).select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: attempts } = useQuery({
    queryKey: ["attempts", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("assessment_attempts").select("assessment_id, score, passed, created_at").eq("user_id", user!.id)).data ?? [],
  });

  async function submit() {
    if (!taking || !user) return;
    const { data, error } = await supabase.rpc("submit_assessment" as any, {
      _assessment_id: taking.id,
      _answers: answers as any,
    });
    if (error) return toast.error(error.message);
    const row: any = Array.isArray(data) ? data[0] : data;
    toast.success(`Score: ${row?.score ?? 0}% — ${row?.passed ? "Passed 🎉" : "Try again"}`);
    setTaking(null); setAnswers([]);
    qc.invalidateQueries({ queryKey: ["attempts"] });
  }

  if (taking) {
    const questions = (taking.questions ?? []) as Omit<Q, "correct">[];
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{taking.title}</h1>
          <Button variant="ghost" onClick={() => setTaking(null)}>Exit</Button>
        </div>
        <div className="space-y-4">
          {questions.map((q, i) => (
            <Card key={i}><CardContent className="p-4 space-y-2">
              <div className="font-medium">{i + 1}. {q.question}</div>
              {q.options.map((o, oi) => (
                <label key={oi} className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                  <input type="radio" name={`q-${i}`} checked={answers[i] === oi} onChange={() => { const a = [...answers]; a[i] = oi; setAnswers(a); }} />
                  <span>{o}</span>
                </label>
              ))}
            </CardContent></Card>
          ))}
          <Button onClick={submit} className="w-full gradient-brand text-primary-foreground">Submit</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><GraduationCap className="h-7 w-7" />Assessments</h1>
          <p className="text-muted-foreground">Prove your skills — passed assessments show on your profile.</p>
        </div>
        {role === "admin" && <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4 mr-1" />New</Button>}
      </div>

      {creating && <CreateAssessment onDone={() => { setCreating(false); qc.invalidateQueries({ queryKey: ["assessments"] }); }} />}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list?.map((a: any) => {
          const best = attempts?.filter((x) => x.assessment_id === a.id).sort((x, y) => y.score - x.score)[0];
          return (
            <Card key={a.id} className="hover:shadow-glow transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{a.title}</CardTitle>
                  <Badge variant="outline">{a.difficulty}</Badge>
                </div>
                {a.category && <Badge variant="secondary" className="w-fit">{a.category}</Badge>}
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{a.description}</p>
                <div className="text-xs text-muted-foreground">{a.question_count ?? 0} questions · {a.duration_minutes} min · pass {a.passing_score}%</div>
                {best && <div className="flex items-center gap-1 text-sm"><Award className="h-4 w-4 text-primary" />Best: {best.score}% {best.passed && <Badge className="ml-1">Passed</Badge>}</div>}
                <Button className="w-full" onClick={async () => {
                  const { data, error } = await supabase.rpc("get_assessment_questions" as any, { _assessment_id: a.id });
                  if (error) return toast.error(error.message);
                  const qs = (data ?? []) as any[];
                  setTaking({ ...a, questions: qs });
                  setAnswers(new Array(qs.length).fill(-1));
                }}>Take assessment</Button>
              </CardContent>
            </Card>
          );
        })}
        {list?.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3"><CardContent className="p-12 text-center text-muted-foreground">
            No assessments yet. {role === "admin" ? "Create the first one." : <Link to="/support" className="text-primary underline">Request one</Link>}
          </CardContent></Card>
        )}
      </div>
    </div>
  );
}

function CreateAssessment({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [description, setDescription] = useState("");
  const [raw, setRaw] = useState('[{"question":"?","options":["A","B","C","D"],"correct":0}]');

  async function save() {
    if (!user) return;
    let questions: Q[];
    try { questions = JSON.parse(raw); } catch { return toast.error("Invalid JSON"); }
    const { error } = await supabase.from("assessments").insert({
      title, category: category || null, difficulty, description, questions: questions as any,
      created_by: user.id, passing_score: 70, duration_minutes: 30,
    });
    if (error) return toast.error(error.message);
    toast.success("Created");
    onDone();
  }

  return (
    <Card className="mb-6"><CardHeader><CardTitle>New assessment</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
          <Input placeholder="Difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} />
        </div>
        <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Textarea rows={8} className="font-mono text-xs" value={raw} onChange={(e) => setRaw(e.target.value)} />
        <div className="flex gap-2"><Button onClick={save}>Save</Button><Button variant="outline" onClick={onDone}>Cancel</Button></div>
      </CardContent>
    </Card>
  );
}