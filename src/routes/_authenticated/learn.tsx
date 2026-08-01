/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { GraduationCap, ExternalLink, Loader as Loader2, Award, CircleAlert as AlertCircle } from "lucide-react";
import { learningRecommendations } from "@/lib/ai.service";

export const Route = createFileRoute("/_authenticated/learn")({ component: LearnPage });

// Sample fallback data in case API fails
const FALLBACK_ITEMS = [
  {
    kind: "course",
    title: "The Complete JavaScript Course 2024",
    provider: "Udemy",
    url: "https://www.udemy.com/course/the-complete-javascript-course/",
    skills: ["javascript", "programming"],
    description: "Master JavaScript with hands-on projects",
  },
  {
    kind: "video",
    title: "React JS Full Course",
    provider: "YouTube",
    url: "https://youtube.com/watch?v=bMknfKXIFA8",
    skills: ["react", "javascript", "frontend"],
    description: "Complete React tutorial by freeCodeCamp",
  },
  {
    kind: "course",
    title: "Node.js Developer Course",
    provider: "Udemy",
    url: "https://www.udemy.com/course/the-complete-nodejs-developer-course-2/",
    skills: ["nodejs", "backend"],
    description: "Build robust Node.js applications",
  },
  {
    kind: "video",
    title: "TypeScript Crash Course",
    provider: "YouTube",
    url: "https://youtube.com/watch?v=BCg4U1FzODs",
    skills: ["typescript", "javascript"],
    description: "Learn TypeScript fundamentals",
  },
];

function LearnPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const recommend = useServerFn(learningRecommendations);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: progress } = useQuery({
    queryKey: ["learn-progress", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (
        await supabase
          .from("learning_progress" as any)
          .select("*")
          .eq("user_id", user!.id)
      ).data ?? [],
  });

  const { data: badges } = useQuery({
    queryKey: ["badges", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (
        await supabase
          .from("badges" as any)
          .select("*")
          .eq("user_id", user!.id)
      ).data ?? [],
  });

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      console.log("Generating recommendations...");
      const r = await recommend({});
      console.log("Received recommendations:", r);

      if (r?.items && r.items.length > 0) {
        setItems(r.items);
        toast.success(`Found ${r.items.length} learning resources!`);
      } else {
        console.warn("No items returned, using fallback");
        setItems(FALLBACK_ITEMS);
        toast.info("Showing curated resources for you");
      }
    } catch (e: any) {
      console.error("Failed to generate recommendations:", e);
      setError(e.message || "Failed to generate recommendations");
      // Use fallback items instead of showing error
      setItems(FALLBACK_ITEMS);
      toast.error("Using curated resources instead");
    } finally {
      setLoading(false);
    }
  }

  async function markComplete(item: any) {
    if (!user) return;
    try {
      const { data: existing } = await supabase
        .from("learning_items" as any)
        .select("id")
        .eq("url", item.url)
        .maybeSingle();
      let itemId = (existing as any)?.id;
      if (!itemId) {
        const { data: ins } = await supabase
          .from("learning_items" as any)
          .insert({
            kind: item.kind,
            title: item.title,
            provider: item.provider,
            url: item.url,
            skills: item.skills ?? [],
            description: item.description,
          })
          .select("id")
          .single();
        itemId = (ins as any)?.id;
      }
      if (!itemId) return;
      await supabase
        .from("learning_progress" as any)
        .upsert({ user_id: user.id, item_id: itemId, status: "completed", progress: 100 });
      await supabase
        .from("badges" as any)
        .insert({ user_id: user.id, kind: item.kind, name: item.title.slice(0, 60) });
      toast.success("Marked complete — badge earned!");
      qc.invalidateQueries({ queryKey: ["learn-progress"] });
      qc.invalidateQueries({ queryKey: ["badges"] });
    } catch (e: any) {
      toast.error("Failed to mark as complete");
    }
  }

  const completed = (progress ?? []).filter((p: any) => p.status === "completed").length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <GraduationCap className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">AI Learning Center</h1>
          <p className="text-sm text-muted-foreground">
            Personalized courses, videos, challenges, and interview prep.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Completed</div>
            <div className="text-2xl font-bold">{completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Badges</div>
            <div className="text-2xl font-bold">{badges?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Progress</div>
            <Progress value={Math.min(100, completed * 10)} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-2 text-yellow-800">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recommended for you</CardTitle>
          <Button
            onClick={generate}
            disabled={loading}
            className="gradient-brand text-primary-foreground"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {loading ? "Generating..." : "Generate"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 && !loading && (
            <div className="text-center py-8">
              <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Click "Generate" to get AI-powered learning recommendations based on your skills.
              </p>
            </div>
          )}
          {loading && items.length === 0 && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Finding the best resources for you...</p>
            </div>
          )}
          {items.map((item, i) => (
            <div
              key={i}
              className="border rounded-lg p-4 flex items-start gap-3 hover:border-primary/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="capitalize">
                    {item.kind}
                  </Badge>
                  {item.provider && (
                    <Badge variant="secondary" className="text-xs">
                      {item.provider}
                    </Badge>
                  )}
                </div>
                <a
                  href={item.url || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium hover:underline flex items-center gap-1 text-primary"
                >
                  {item.title} <ExternalLink className="h-3 w-3" />
                </a>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                )}
                <div className="flex flex-wrap gap-1 mt-3">
                  {(item.skills ?? []).map((s: string) => (
                    <Badge key={s} variant="secondary" className="text-xs">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => markComplete(item)}>
                Complete
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {(badges?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" /> Your badges
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {badges!.map((b: any) => (
              <Badge key={b.id} className="gradient-brand text-primary-foreground">
                {b.name}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
