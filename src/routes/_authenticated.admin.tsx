import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Shield } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({ component: Admin });

function Admin() {
  const { role } = useAuth();
  const qc = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    enabled: role === "admin",
    queryFn: async () => {
      const [{ count: users }, { count: jobs }, { count: apps }, { count: companies }] =
        await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("jobs").select("*", { count: "exact", head: true }),
          supabase.from("applications").select("*", { count: "exact", head: true }),
          supabase.from("companies").select("*", { count: "exact", head: true }),
        ]);
      return { users, jobs, apps, companies };
    },
  });

  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    enabled: role === "admin",
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100),

        supabase.from("user_roles").select("user_id, role"),
      ]);

      return (profiles ?? []).map((profile: any) => ({
        ...profile,
        role: roles?.find((r) => r.user_id === profile.id)?.role ?? "job_seeker",
      }));
    },
  });
  const { data: jobs } = useQuery({
    queryKey: ["admin-jobs"],
    enabled: role === "admin",
    queryFn: async () =>
      (
        await supabase
          .from("jobs")
          .select("id, title, status, applications_count, created_at, company:companies(name)")
          .order("created_at", { ascending: false })
          .limit(100)
      ).data ?? [],
  });
  const { data: companies } = useQuery({
    queryKey: ["admin-companies"],
    enabled: role === "admin",
    queryFn: async () =>
      (
        await supabase
          .from("companies")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100)
      ).data ?? [],
  });
  const { data: tickets } = useQuery({
    queryKey: ["admin-tickets"],
    enabled: role === "admin",
    queryFn: async () =>
      (
        await supabase
          .from("support_tickets")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100)
      ).data ?? [],
  });

  if (role !== "admin")
    return (
      <div className="container mx-auto px-4 py-16 max-w-md">
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">Admin only</h2>
            <p className="text-sm text-muted-foreground mb-4">You need administrator privileges.</p>
            <Button asChild>
              <Link to="/">Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );

  async function replyTicket(
    id: string,
    reply: string,
    status: "open" | "in_progress" | "resolved" | "closed",
  ) {
    const { error } = await supabase
      .from("support_tickets")
      .update({ admin_reply: reply, status })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Reply sent");
    qc.invalidateQueries({ queryKey: ["admin-tickets"] });
  }

  async function setJobStatus(id: string, status: "active" | "closed" | "draft") {
    const { error } = await supabase.from("jobs").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    qc.invalidateQueries({ queryKey: ["admin-jobs"] });
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin panel</h1>
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        {(["users", "jobs", "apps", "companies"] as const).map((k) => (
          <Card key={k}>
            <CardContent className="p-6">
              <div className="text-3xl font-bold">{stats?.[k] ?? 0}</div>
              <div className="text-sm text-muted-foreground capitalize">
                {k === "apps" ? "applications" : k}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardContent className="p-4 space-y-2">
              {users?.map((u: any) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-2 hover:bg-muted rounded"
                >
                  <div>
                    <div className="font-medium">{u.full_name ?? u.email}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </div>
                  <Badge variant="secondary">{u.roles?.[0]?.role ?? "job_seeker"}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs">
          <Card>
            <CardContent className="p-4 space-y-2">
              {jobs?.map((j: any) => (
                <div
                  key={j.id}
                  className="flex items-center justify-between p-2 hover:bg-muted rounded gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{j.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {j.company?.name} · {j.applications_count} apps
                    </div>
                  </div>
                  <Badge>{j.status}</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setJobStatus(j.id, j.status === "active" ? "closed" : "active")}
                  >
                    {j.status === "active" ? "Close" : "Activate"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="companies">
          <Card>
            <CardContent className="p-4 space-y-2">
              {companies?.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2 hover:bg-muted rounded"
                >
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.industry ?? "—"} · {c.headquarters ?? "—"}
                    </div>
                  </div>
                  <Link
                    to="/companies/$slug"
                    params={{ slug: c.slug }}
                    className="text-xs text-primary"
                  >
                    View
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets">
          <div className="space-y-2">
            {tickets?.map((t) => (
              <AdminTicket key={t.id} ticket={t} onReply={replyTicket} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AdminTicket({
  ticket,
  onReply,
}: {
  ticket: any;
  onReply: (id: string, reply: string, status: any) => void;
}) {
  const [reply, setReply] = useState(ticket.admin_reply ?? "");
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex justify-between">
          <div className="font-medium">{ticket.subject}</div>
          <Badge>{ticket.status}</Badge>
        </div>
        <div className="text-sm text-muted-foreground">{ticket.message}</div>
        <Textarea
          rows={2}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Reply…"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onReply(ticket.id, reply, "in_progress")}>
            Reply
          </Button>
          <Button size="sm" variant="outline" onClick={() => onReply(ticket.id, reply, "resolved")}>
            Resolve
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
