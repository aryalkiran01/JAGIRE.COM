import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { careerRecommendations } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/career")({ component: Career });

type Recs = Awaited<ReturnType<typeof careerRecommendations>>;

function Career() {
  const run = useServerFn(careerRecommendations);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Recs | null>(null);

  async function generate() {
    setLoading(true);
    try {
      const res = await run({ data: undefined });
      setData(res);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TrendingUp className="h-7 w-7 text-primary" /> Career recommendations
        </h1>
        <p className="text-muted-foreground">AI-powered career paths, skill gaps, and certifications.</p>
      </div>

      <Card className="gradient-hero text-primary-foreground">
        <CardContent className="p-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="font-bold text-lg">Generate your personalized plan</div>
            <div className="text-sm opacity-90">Based on your profile and resume skills.</div>
          </div>
          <Button variant="secondary" onClick={generate} disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…</> : <><Sparkles className="mr-2 h-4 w-4" /> Generate</>}
          </Button>
        </CardContent>
      </Card>

      {data && (
        <>
          {data.career_paths.length > 0 && (
            <Card><CardContent className="p-6">
              <h2 className="font-bold text-xl mb-3">Career paths</h2>
              <div className="space-y-4">
                {data.career_paths.map((p, i) => (
                  <div key={i} className="border-l-2 border-primary pl-4">
                    <div className="font-semibold">{p.title}</div>
                    <div className="text-sm text-muted-foreground mb-2">{p.why}</div>
                    <ul className="text-sm list-disc pl-5">
                      {p.next_steps.map((s, j) => <li key={j}>{s}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent></Card>
          )}
          {data.skill_gaps.length > 0 && (
            <Card><CardContent className="p-6">
              <h2 className="font-bold text-xl mb-3">Skill gaps to close</h2>
              <div className="flex flex-wrap gap-2">
                {data.skill_gaps.map((s, i) => <Badge key={i} variant="secondary">{s}</Badge>)}
              </div>
            </CardContent></Card>
          )}
          {data.recommended_certifications.length > 0 && (
            <Card><CardContent className="p-6">
              <h2 className="font-bold text-xl mb-3">Recommended certifications</h2>
              <ul className="space-y-2">
                {data.recommended_certifications.map((c, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground">{c.provider}</span>
                  </li>
                ))}
              </ul>
            </CardContent></Card>
          )}
          {data.suggested_search_keywords.length > 0 && (
            <Card><CardContent className="p-6">
              <h2 className="font-bold text-xl mb-3">Search keywords</h2>
              <div className="flex flex-wrap gap-2">
                {data.suggested_search_keywords.map((k, i) => <Badge key={i}>{k}</Badge>)}
              </div>
            </CardContent></Card>
          )}
        </>
      )}
    </div>
  );
}