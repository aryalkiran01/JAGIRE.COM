import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/notifications")({ component: Notifications });

function Notifications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["notif", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(100)).data ?? [],
  });

  // Mark all as read on view
  useEffect(() => {
    if (!user) return;
    supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false).then(() => {
      qc.invalidateQueries({ queryKey: ["notif-unread"] });
    });
  }, [user, data, qc]);

  async function markRead(id: string) {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["notif"] });
    qc.invalidateQueries({ queryKey: ["notif-unread"] });
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Notifications</h1>
      <div className="space-y-2">
        {data?.map((n) => (
          <Card key={n.id} className={n.read ? "" : "border-primary"}>
            <CardContent className="p-4 flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="font-medium">{n.title}</div>
                {n.body && <div className="text-sm text-muted-foreground">{n.body}</div>}
                <div className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</div>
              </div>
              {!n.read && (
                <Button size="icon" variant="ghost" onClick={() => markRead(n.id)}>
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
        {!data?.length && <Card><CardContent className="p-12 text-center text-muted-foreground">No notifications yet.</CardContent></Card>}
      </div>
    </div>
  );
}