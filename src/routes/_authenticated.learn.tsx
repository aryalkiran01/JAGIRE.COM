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
import { GraduationCap, ExternalLink, Loader2, Award } from "lucide-react";
import { learningRecommendations } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/learn")({ component: LearnPage });

function LearnPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const recommend = useServerFn(learningRecommendations);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
    try {
      const r = await recommend({});
      setItems(r.items);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function markComplete(item: any) {
    if (!user) return;
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recommended for you</CardTitle>
          <Button
            onClick={generate}
            disabled={loading}
            className="gradient-brand text-primary-foreground"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Click Generate to get AI recommendations based on your skills.
            </p>
          )}
          {items.map((item, i) => (
            <div key={i} className="border rounded-lg p-3 flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="capitalize">
                    {item.kind}
                  </Badge>
                  {item.provider && (
                    <span className="text-xs text-muted-foreground">{item.provider}</span>
                  )}
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium hover:underline flex items-center gap-1"
                >
                  {item.title} <ExternalLink className="h-3 w-3" />
                </a>
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                )}
                <div className="flex flex-wrap gap-1 mt-2">
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
