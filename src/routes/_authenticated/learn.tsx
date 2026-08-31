/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  GraduationCap,
  ExternalLink,
  Loader as Loader2,
  Award,
  CircleAlert as AlertCircle,
  CircleCheck as CheckCircle,
  Sparkles,
} from "lucide-react";
import { learningRecommendations } from "@/lib/ai.service";

export const Route = createFileRoute("/_authenticated/learn")({ component: LearnPage });

const FALLBACK_ITEMS = [
  {
    id: "fallback-1",
    kind: "course",
    title: "The Complete JavaScript Course 2024",
    provider: "Udemy",
    url: "https://www.udemy.com/courses/search/?q=javascript",
    skills: ["javascript", "programming"],
    description: "Master JavaScript with hands-on projects",
  },
  {
    id: "fallback-2",
    kind: "video",
    title: "React JS Full Course",
    provider: "YouTube",
    url: "https://www.youtube.com/results?search_query=react+js+full+course",
    skills: ["react", "javascript", "frontend"],
    description: "Complete React tutorial by freeCodeCamp",
  },
  {
    id: "fallback-3",
    kind: "course",
    title: "Node.js Developer Course",
    provider: "Udemy",
    url: "https://www.udemy.com/courses/search/?q=nodejs",
    skills: ["nodejs", "backend"],
    description: "Build robust Node.js applications",
  },
  {
    id: "fallback-4",
    kind: "video",
    title: "TypeScript Crash Course",
    provider: "YouTube",
    url: "https://www.youtube.com/results?search_query=typescript+crash+course",
    skills: ["typescript", "javascript"],
    description: "Learn TypeScript fundamentals",
  },
];

function LearnPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const recommend = useServerFn(learningRecommendations);
  const [newItems, setNewItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  const [hasGenerated, setHasGenerated] = useState(false);

  // Fetch learning progress
  const { data: progress } = useQuery({
    queryKey: ["learn-progress", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learning_progress")
        .select("item_id, status, progress, completed_at")
        .eq("user_id", user!.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false });

      if (error) {
        console.error("Error fetching progress:", error);
        return [];
      }
      return data || [];
    },
  });

  // Fetch completed learning items details
  const { data: completedItemsDetails } = useQuery({
    queryKey: ["completed-items", user?.id, progress],
    enabled: !!user && !!progress?.length,
    queryFn: async () => {
      if (!progress?.length) return [];

      const completedIds = progress.map((p: any) => p.item_id);
      const { data, error } = await supabase
        .from("learning_items")
        .select("*")
        .in("id", completedIds);

      if (error) {
        console.error("Error fetching completed items:", error);
        return [];
      }

      return (data || []).map((item: any) => {
        const prog = progress.find((p: any) => p.item_id === item.id);
        return {
          ...item,
          completed_at: prog?.completed_at,
        };
      });
    },
  });

  // Fetch badges
  const { data: badges } = useQuery({
    queryKey: ["badges", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badges")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching badges:", error);
        return [];
      }
      return data || [];
    },
  });

  // Create a Set of completed item IDs for quick lookup
  const completedItemIds = useMemo(() => {
    return new Set((progress || []).map((p: any) => p.item_id));
  }, [progress]);

  // Filter new items (not completed) from all generated items
  const filteredNewItems = useMemo(() => {
    return newItems.filter((item) => !completedItemIds.has(item.id));
  }, [newItems, completedItemIds]);

  // Auto-generate on first load if user is logged in and hasn't generated yet
  useEffect(() => {
    if (user && !hasGenerated && !loading) {
      generateRecommendations();
    }
  }, [user]);

  async function generateRecommendations() {
    setLoading(true);
    setError(null);
    try {
      console.log("Generating recommendations...");
      const r = await recommend({});
      console.log("Received recommendations:", r);

      if (r?.items && r.items.length > 0) {
        // Get existing IDs
        const existingIds = new Set(newItems.map((item) => item.id));

        // Filter out duplicates
        const newUniqueItems = r.items.filter((item: any) => !existingIds.has(item.id));

        console.log(`New unique items: ${newUniqueItems.length}, Existing: ${newItems.length}`);

        if (newUniqueItems.length > 0) {
          // Add new items to the TOP of the list
          setNewItems((prev) => [...newUniqueItems, ...prev].slice(0, 30)); // Keep max 30
          setHasGenerated(true);
          toast.success(`Found ${newUniqueItems.length} new resources!`);
        } else if (newItems.length === 0) {
          // No existing items and no new ones (shouldn't happen)
          setNewItems(r.items);
          setHasGenerated(true);
          toast.success(`Found ${r.items.length} resources!`);
        } else {
          // All duplicates - force add with modified IDs
          const forcedNew = r.items.map((item: any, i: number) => ({
            ...item,
            id: `${item.id}-${Date.now()}-${i}`, // Make unique
          }));
          setNewItems((prev) => [...forcedNew, ...prev].slice(0, 30));
          setHasGenerated(true);
          toast.success(`Refreshed with ${forcedNew.length} resources!`);
        }
      } else {
        console.warn("No items returned");
        toast.info("No new recommendations available. Try again later.");
      }
    } catch (e: any) {
      console.error("Failed to generate recommendations:", e);
      setError(e.message || "Failed to generate recommendations");
      toast.error("Failed to generate. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function markComplete(item: any) {
    if (!user) return;

    if (completedItemIds.has(item.id) || completingIds.has(item.id)) {
      return;
    }

    setCompletingIds((prev) => new Set(prev).add(item.id));

    try {
      let itemId = item.id;

      // Check if learning item exists in database
      const { data: existing, error: fetchError } = await supabase
        .from("learning_items")
        .select("id")
        .eq("id", item.id)
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching item:", fetchError);
      }

      // If item doesn't exist in DB, try to insert it
      if (!existing) {
        const { data: ins, error: insertError } = await supabase
          .from("learning_items")
          .insert({
            id: item.id,
            kind: item.kind,
            title: item.title,
            provider: item.provider,
            url: item.url,
            skills: item.skills ?? [],
            description: item.description,
          })
          .select("id")
          .single();

        if (insertError) {
          console.error("Insert error:", insertError);
          if (insertError.code === "42501") {
            console.log("RLS prevents insert, using original ID");
          } else {
            throw insertError;
          }
        } else if (ins) {
          itemId = ins.id;
        }
      }

      // Record progress
      const { error: progressError } = await supabase.from("learning_progress").upsert({
        user_id: user.id,
        item_id: itemId,
        status: "completed",
        progress: 100,
        completed_at: new Date().toISOString(),
      });

      if (progressError) {
        console.error("Progress insert error:", progressError);
        throw progressError;
      }

      // Try to award badge
      try {
        await supabase.from("badges").insert({
          user_id: user.id,
          kind: item.kind,
          name: item.title.slice(0, 60),
        });
      } catch (badgeError) {
        console.warn("Badge insert failed:", badgeError);
      }

      toast.success("Marked complete! 🎉");

      // Invalidate queries to refresh
      qc.invalidateQueries({ queryKey: ["learn-progress", user.id] });
      qc.invalidateQueries({ queryKey: ["completed-items", user.id] });
      qc.invalidateQueries({ queryKey: ["badges", user.id] });
    } catch (e: any) {
      console.error("Error marking complete:", e);
      toast.error("Failed to mark as complete. Please try again.");
    } finally {
      setCompletingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  }

  const completedCount = progress?.length || 0;

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
            <div className="text-2xl font-bold">{completedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Available</div>
            <div className="text-2xl font-bold">{filteredNewItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Badges</div>
            <div className="text-2xl font-bold">{badges?.length ?? 0}</div>
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
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Recommended for you
          </CardTitle>
          <Button
            onClick={generateRecommendations}
            disabled={loading}
            className="gradient-brand text-primary-foreground"
            variant="outline"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate More
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Loading State */}
          {loading && newItems.length === 0 && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Finding the best resources for you...</p>
            </div>
          )}

          {/* New Recommendations */}
          {!loading && filteredNewItems.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Available Courses ({filteredNewItems.length})
              </h3>
              <div className="space-y-3">
                {filteredNewItems.map((item, i) => {
                  const isCompleting = completingIds.has(item.id);

                  return (
                    <div
                      key={item.id || `new-${i}`}
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markComplete(item)}
                        disabled={isCompleting}
                        className="shrink-0"
                      >
                        {isCompleting ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            Saving...
                          </>
                        ) : (
                          "Complete"
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completed Items */}
          {completedItemsDetails && completedItemsDetails.length > 0 && (
            <div className={filteredNewItems.length > 0 ? "mt-6 pt-6 border-t" : ""}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Completed ({completedItemsDetails.length})
              </h3>
              <div className="space-y-3">
                {completedItemsDetails.map((item: any) => (
                  <div
                    key={item.id}
                    className="border border-green-200 rounded-lg p-4 flex items-start gap-3 bg-green-50/50 dark:bg-green-950/10"
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
                        <Badge variant="default" className="bg-green-500 text-white text-xs gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Completed
                        </Badge>
                      </div>
                      <a
                        href={item.url || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium hover:underline flex items-center gap-1 text-green-700 dark:text-green-400"
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
                      {item.completed_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Completed {new Date(item.completed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State - No items at all */}
          {!loading &&
            newItems.length === 0 &&
            (!completedItemsDetails || completedItemsDetails.length === 0) && (
              <div className="text-center py-8">
                <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-2">
                  Click "Generate More" to get AI-powered learning recommendations.
                </p>
                <Button onClick={generateRecommendations} disabled={loading}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Recommendations
                </Button>
              </div>
            )}

          {/* All completed, no new items */}
          {!loading &&
            filteredNewItems.length === 0 &&
            completedItemsDetails &&
            completedItemsDetails.length > 0 && (
              <div className="text-center py-8 border-t">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-2">
                  Amazing! You've completed all recommendations! 🎉
                </p>
                <Button onClick={generateRecommendations} disabled={loading} variant="outline">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate More
                </Button>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Badges Section */}
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
