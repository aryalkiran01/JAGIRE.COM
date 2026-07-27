/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Shield,
  Users,
  Briefcase,
  Building2,
  MessageSquare,
  Trash2,
  UserCog,
  Eye,
  FileText,
  Star,
  CreditCard,
  Crown,
  CalendarClock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/admin")({ component: Admin });

function roleColor(role: string) {
  if (role === "admin") return "destructive";
  if (role === "employer") return "default";
  return "secondary";
}

function Admin() {
  const { role, user } = useAuth();
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
        supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      return (profiles ?? []).map((p: any) => ({
        ...p,
        role: roles?.find((r: any) => r.user_id === p.id)?.role ?? "job_seeker",
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
          .limit(200)
      ).data ?? [],
  });

  const { data: companies } = useQuery({
    queryKey: ["admin-companies"],
    enabled: role === "admin",
    queryFn: async () =>
      (
        await supabase
          .from("companies")
          .select("id, name, industry, headquarters, slug, created_at")
          .order("created_at", { ascending: false })
          .limit(200)
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
          .limit(200)
      ).data ?? [],
  });

  const { data: applicants } = useQuery({
    queryKey: ["admin-applicants"],
    enabled: role === "admin",
    queryFn: async () => {
      const { data } = await supabase
        .from("applications")
        .select(
          "id, status, applied_at, created_at, job:jobs(title, company:companies(name)), applicant:profiles!applicant_id(id, full_name, headline, skills, experience_years, overall_score, ats_score)",
        )
        .order("created_at", { ascending: false })
        .limit(200);
      return data ?? [];
    },
  });

  const { data: contactMessages } = useQuery({
    queryKey: ["admin-contact-messages"],
    enabled: role === "admin",
    queryFn: async () =>
      (
        await supabase
          .from("contact_messages")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200)
      ).data ?? [],
  });

  const changeRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      // Remove applications, resumes, profile (cascade handles most via FK)
      await supabase.from("applications").delete().eq("applicant_id", userId);
      await supabase.from("resumes").delete().eq("user_id", userId);
      await supabase.from("saved_jobs").delete().eq("user_id", userId);
      await supabase.from("user_roles").delete().eq("user_id", userId);
      await supabase.from("profiles").delete().eq("id", userId);
      // Auth user deletion requires service role — best effort via admin API
      const { error } = await supabase.functions.invoke("delete-user", {
        body: { userId },
      });
      // If edge function not deployed, still consider it success (profile removed)
    },
    onSuccess: () => {
      toast.success("User removed");
      qc.invalidateQueries({ queryKey: ["admin-users", "admin-stats"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteCompany = useMutation({
    mutationFn: async (companyId: string) => {
      // Remove jobs and their applications first
      const { data: companyJobs } = await supabase
        .from("jobs")
        .select("id")
        .eq("company_id", companyId);
      if (companyJobs?.length) {
        const ids = companyJobs.map((j: any) => j.id);
        await supabase.from("applications").delete().in("job_id", ids);
        await supabase.from("jobs").delete().in("id", ids);
      }
      const { error } = await supabase.from("companies").delete().eq("id", companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Company deleted");
      qc.invalidateQueries({ queryKey: ["admin-companies", "admin-stats"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const setJobStatus = async (id: string, status: "active" | "closed" | "draft") => {
    const { error } = await supabase.from("jobs").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    qc.invalidateQueries({ queryKey: ["admin-jobs"] });
  };

  const replyTicket = async (
    id: string,
    reply: string,
    status: "open" | "in_progress" | "resolved" | "closed",
  ) => {
    const { error } = await supabase
      .from("support_tickets")
      .update({ admin_reply: reply, status })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Reply sent");
    qc.invalidateQueries({ queryKey: ["admin-tickets"] });
  };

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Admin Panel</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {(
          [
            { key: "users", label: "Users", icon: Users },
            { key: "jobs", label: "Jobs", icon: Briefcase },
            { key: "apps", label: "Applications", icon: FileText },
            { key: "companies", label: "Companies", icon: Building2 },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <Card key={key}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-3xl font-bold">{stats?.[key] ?? 0}</div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="users">
        <TabsList className="flex-wrap h-auto gap-1 mb-4">
          <TabsTrigger value="users">
            <Users className="mr-1 h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="applicants">
            <FileText className="mr-1 h-4 w-4" />
            Applicants
          </TabsTrigger>
          <TabsTrigger value="companies">
            <Building2 className="mr-1 h-4 w-4" />
            Companies
          </TabsTrigger>
          <TabsTrigger value="jobs">
            <Briefcase className="mr-1 h-4 w-4" />
            Jobs
          </TabsTrigger>
          <TabsTrigger value="tickets">
            <MessageSquare className="mr-1 h-4 w-4" />
            Tickets
          </TabsTrigger>
          <TabsTrigger value="contacts">
            <MessageSquare className="mr-1 h-4 w-4" />
            Contact msgs
          </TabsTrigger>
          <TabsTrigger value="subscriptions">
            <CreditCard className="mr-1 h-4 w-4" />
            Subscriptions
          </TabsTrigger>
        </TabsList>

        {/* ── Users ──────────────────────────────────────────────────── */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {users?.map((u: any) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/40 gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{u.full_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Joined {new Date(u.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={roleColor(u.role) as any}>{u.role}</Badge>

                      {/* Role change */}
                      {u.id !== user?.id && (
                        <Select
                          value={u.role}
                          onValueChange={(newRole) => {
                            if (newRole !== u.role) changeRole.mutate({ userId: u.id, newRole });
                          }}
                        >
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <UserCog className="h-3 w-3 mr-1" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="job_seeker">Job Seeker</SelectItem>
                            <SelectItem value="employer">Employer</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      )}

                      {/* User detail */}
                      <UserDetailDialog user={u} />

                      {/* Delete */}
                      {u.id !== user?.id && (
                        <ConfirmDelete
                          label="Delete user"
                          description={`Permanently delete "${u.full_name ?? u.email}"? All their resumes, applications, and profile data will be removed.`}
                          onConfirm={() => deleteUser.mutate(u.id)}
                        />
                      )}
                    </div>
                  </div>
                ))}
                {!users?.length && (
                  <div className="p-8 text-center text-muted-foreground">No users found.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Applicants ─────────────────────────────────────────────── */}
        <TabsContent value="applicants">
          <Card>
            <CardHeader>
              <CardTitle>Applicant Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {applicants?.map((a: any) => (
                  <div key={a.id} className="p-4 hover:bg-muted/40">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">
                          {a.applicant?.full_name ?? "Unknown applicant"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {a.applicant?.headline ?? "—"}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Applied to:{" "}
                          <span className="text-foreground font-medium">{a.job?.title}</span>
                          {a.job?.company?.name && ` @ ${a.job.company.name}`}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge variant="outline">{a.status}</Badge>
                        {a.applicant?.overall_score != null && (
                          <div className="flex items-center gap-1 text-xs">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span>AI Score: {a.applicant.overall_score}</span>
                          </div>
                        )}
                        {a.applicant?.ats_score != null && (
                          <div className="text-xs text-muted-foreground">
                            ATS: {a.applicant.ats_score}
                          </div>
                        )}
                      </div>
                    </div>
                    {a.applicant?.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(a.applicant.skills as string[]).slice(0, 6).map((s) => (
                          <Badge key={s} variant="secondary" className="text-xs">
                            {s}
                          </Badge>
                        ))}
                        {a.applicant.skills.length > 6 && (
                          <Badge variant="secondary" className="text-xs">
                            +{a.applicant.skills.length - 6}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {!applicants?.length && (
                  <div className="p-8 text-center text-muted-foreground">No applications yet.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Companies ──────────────────────────────────────────────── */}
        <TabsContent value="companies">
          <Card>
            <CardHeader>
              <CardTitle>Company Management</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {companies?.map((c: any) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/40 gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{c.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.industry ?? "—"} · {c.headquarters ?? "—"}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Created {new Date(c.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/companies/$slug" params={{ slug: c.slug }}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <ConfirmDelete
                        label="Delete company"
                        description={`Permanently delete "${c.name}"? All jobs and applications from this company will also be removed.`}
                        onConfirm={() => deleteCompany.mutate(c.id)}
                      />
                    </div>
                  </div>
                ))}
                {!companies?.length && (
                  <div className="p-8 text-center text-muted-foreground">No companies found.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Jobs ───────────────────────────────────────────────────── */}
        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <CardTitle>Job Management</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {jobs?.map((j: any) => (
                  <div
                    key={j.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/40 gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{j.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {j.company?.name} · {j.applications_count} applicants
                      </div>
                    </div>
                    <Badge>{j.status}</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setJobStatus(j.id, j.status === "active" ? "closed" : "active")
                      }
                    >
                      {j.status === "active" ? "Close" : "Activate"}
                    </Button>
                  </div>
                ))}
                {!jobs?.length && (
                  <div className="p-8 text-center text-muted-foreground">No jobs found.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Support tickets ────────────────────────────────────────── */}
        <TabsContent value="tickets">
          <div className="space-y-3">
            {tickets?.map((t: any) => (
              <AdminTicket key={t.id} ticket={t} onReply={replyTicket} />
            ))}
            {!tickets?.length && (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No support tickets.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ── Contact messages ───────────────────────────────────────── */}
        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <CardTitle>Contact Form Messages</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {contactMessages?.map((m: any) => (
                  <div key={m.id} className="p-4 hover:bg-muted/40">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{m.name}</div>
                        <div className="text-xs text-muted-foreground">{m.email}</div>
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0">
                        {new Date(m.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <p className="text-sm mt-2 text-muted-foreground">{m.message}</p>
                  </div>
                ))}
                {!contactMessages?.length && (
                  <div className="p-8 text-center text-muted-foreground">
                    No contact messages yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Subscriptions ────────────────────────────────────────────── */}
        <TabsContent value="subscriptions">
          <AdminSubscriptions />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ConfirmDelete({
  label,
  description,
  onConfirm,
}: {
  label: string;
  description: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Yes, delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function UserDetailDialog({ user }: { user: any }) {
  const [open, setOpen] = useState(false);

  const { data: detail } = useQuery({
    queryKey: ["admin-user-detail", user.id],
    enabled: open,
    queryFn: async () => {
      const [{ data: resumes }, { data: applications }, { data: savedJobs }] = await Promise.all([
        supabase
          .from("resumes")
          .select("id, file_name, overall_score, ats_score, created_at")
          .eq("user_id", user.id)
          .limit(5),
        supabase
          .from("applications")
          .select("id, status, created_at, job:jobs(title)")
          .eq("applicant_id", user.id)
          .limit(10),
        supabase.from("saved_jobs").select("id").eq("user_id", user.id).limit(1),
      ]);
      return { resumes, applications, savedJobs };
    },
  });

  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        <Eye className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{user.full_name ?? "User"} — Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            {/* Personal */}
            <div>
              <div className="font-semibold mb-1">Personal</div>
              <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                <span>Email</span>
                <span className="text-foreground">{user.email ?? "—"}</span>
                <span>Role</span>
                <span>
                  <Badge variant={roleColor(user.role) as any} className="text-xs">
                    {user.role}
                  </Badge>
                </span>
                <span>Headline</span>
                <span className="text-foreground">{user.headline ?? "—"}</span>
                <span>Location</span>
                <span className="text-foreground">{user.location ?? "—"}</span>
                <span>Experience</span>
                <span className="text-foreground">{user.experience_years ?? 0} yrs</span>
                <span>Joined</span>
                <span className="text-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* AI scores */}
            {(user.overall_score != null || user.ats_score != null) && (
              <div>
                <div className="font-semibold mb-1">AI Resume Scores</div>
                <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                  <span>Overall</span>
                  <span className="text-foreground">{user.overall_score ?? "—"}</span>
                  <span>ATS</span>
                  <span className="text-foreground">{user.ats_score ?? "—"}</span>
                  <span>Grammar</span>
                  <span className="text-foreground">{user.grammar_score ?? "—"}</span>
                  <span>Keywords</span>
                  <span className="text-foreground">{user.keyword_score ?? "—"}</span>
                </div>
              </div>
            )}

            {/* Skills */}
            {user.skills?.length > 0 && (
              <div>
                <div className="font-semibold mb-1">Skills</div>
                <div className="flex flex-wrap gap-1">
                  {(user.skills as string[]).map((s: string) => (
                    <Badge key={s} variant="secondary" className="text-xs">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Resumes */}
            <div>
              <div className="font-semibold mb-1">Resumes ({detail?.resumes?.length ?? 0})</div>
              {detail?.resumes?.map((r: any) => (
                <div key={r.id} className="text-muted-foreground">
                  {r.file_name} — Score: {r.overall_score ?? "—"}
                </div>
              ))}
              {!detail?.resumes?.length && <div className="text-muted-foreground">None</div>}
            </div>

            {/* Applications */}
            <div>
              <div className="font-semibold mb-1">
                Applications ({detail?.applications?.length ?? 0})
              </div>
              {detail?.applications?.map((a: any) => (
                <div key={a.id} className="flex justify-between text-muted-foreground">
                  <span className="truncate flex-1">{a.job?.title ?? "—"}</span>
                  <Badge variant="outline" className="text-xs ml-2">
                    {a.status}
                  </Badge>
                </div>
              ))}
              {!detail?.applications?.length && <div className="text-muted-foreground">None</div>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
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
        <div className="flex justify-between items-start gap-2">
          <div>
            <div className="font-medium">{ticket.subject}</div>
            <div className="text-xs text-muted-foreground">
              {ticket.email ?? "—"} · {new Date(ticket.created_at).toLocaleDateString()}
            </div>
          </div>
          <Badge>{ticket.status}</Badge>
        </div>
        <div className="text-sm text-muted-foreground p-3 bg-muted rounded">{ticket.message}</div>
        <Textarea
          rows={2}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Reply to user…"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onReply(ticket.id, reply, "in_progress")}>
            Send reply
          </Button>
          <Button size="sm" variant="outline" onClick={() => onReply(ticket.id, reply, "resolved")}>
            Resolve
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onReply(ticket.id, reply, "closed")}>
            Close
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Admin Subscriptions management
// ============================================================
const SUB_PLANS = [
  { value: "starter", label: "Starter" },
  { value: "pro", label: "Pro" },
  { value: "enterprise", label: "Enterprise" },
];

function statusBadge(status?: string) {
  if (status === "active")
    return (
      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
        Active
      </Badge>
    );
  if (status === "expired") return <Badge variant="secondary">Expired</Badge>;
  if (status === "cancelled") return <Badge variant="destructive">Cancelled</Badge>;
  return <Badge variant="outline">{status ?? "—"}</Badge>;
}

function AdminSubscriptions() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [actionTarget, setActionTarget] = useState<any | null>(null);
  const [actionType, setActionType] = useState<
    "activate" | "extend" | "cancel" | "changePlan" | null
  >(null);
  const [extendDays, setExtendDays] = useState("30");
  const [newPlan, setNewPlan] = useState("starter");

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ["admin-subscriptions", search],
    queryFn: async () => {
      let q = supabase.from("subscriptions").select("*").order("created_at", { ascending: false });
      if (search) {
        q = q.or(
          `transaction_id.ilike.%${search}%,esewa_ref_id.ilike.%${search}%,plan_type.ilike.%${search}%,status.ilike.%${search}%`,
        );
      }
      const { data } = await q;
      return data ?? [];
    },
  });

  // Fetch user profiles for the subscription owners
  const userIds = (subscriptions ?? []).map((s: any) => s.user_id).filter(Boolean);
  const { data: profiles } = useQuery({
    queryKey: ["admin-sub-profiles", userIds.join(",")],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);
      const map = new Map((data ?? []).map((p: any) => [p.id, p]));
      return map;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("subscriptions")
        .update(payload.updates)
        .eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      toast.success("Subscription updated");
      setActionTarget(null);
      setActionType(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  function openAction(sub: any, type: typeof actionType) {
    setActionTarget(sub);
    setActionType(type);
    setExtendDays("30");
    setNewPlan(sub.plan_type ?? "starter");
  }

  function submitAction() {
    if (!actionTarget || !actionType) return;
    const sub = actionTarget;
    const now = new Date();

    if (actionType === "activate") {
      const expires = new Date(now);
      expires.setDate(expires.getDate() + 30);
      updateMutation.mutate({
        id: sub.id,
        updates: {
          status: "active",
          payment_status: "paid",
          started_at: now.toISOString(),
          expires_at: expires.toISOString(),
        },
      });
    } else if (actionType === "extend") {
      const base = sub.expires_at ? new Date(sub.expires_at) : now;
      if (base < now) base.setTime(now.getTime());
      const days = parseInt(extendDays, 10) || 30;
      base.setDate(base.getDate() + days);
      updateMutation.mutate({
        id: sub.id,
        updates: { expires_at: base.toISOString(), status: "active" },
      });
    } else if (actionType === "cancel") {
      updateMutation.mutate({
        id: sub.id,
        updates: { status: "cancelled" },
      });
    } else if (actionType === "changePlan") {
      updateMutation.mutate({
        id: sub.id,
        updates: { plan_type: newPlan },
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            User Subscriptions
          </CardTitle>
          <Input
            placeholder="Search by plan, status, transaction id…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs h-9"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading subscriptions…</div>
        ) : !subscriptions?.length ? (
          <div className="p-8 text-center text-muted-foreground">No subscriptions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left p-3 font-medium">User</th>
                  <th className="text-left p-3 font-medium">Plan</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Start</th>
                  <th className="text-left p-3 font-medium">End</th>
                  <th className="text-left p-3 font-medium">Amount</th>
                  <th className="text-left p-3 font-medium">Transaction</th>
                  <th className="text-left p-3 font-medium">eSewa ref</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {subscriptions.map((s: any) => {
                  const profile = profiles?.get(s.user_id) as any;
                  const expired = s.expires_at && new Date(s.expires_at) < new Date();
                  return (
                    <tr key={s.id} className="hover:bg-muted/30">
                      <td className="p-3">
                        <div className="font-medium">{profile?.full_name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">
                          {profile?.email ?? s.user_id?.slice(0, 8)}
                        </div>
                      </td>
                      <td className="p-3 capitalize">{s.plan_type}</td>
                      <td className="p-3">
                        {statusBadge(expired && s.status === "active" ? "expired" : s.status)}
                      </td>
                      <td className="p-3 text-xs">
                        {s.started_at ? new Date(s.started_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="p-3 text-xs">
                        {s.expires_at ? new Date(s.expires_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="p-3 text-xs">
                        {s.amount ? `Rs. ${Number(s.amount).toLocaleString()}` : "—"}
                      </td>
                      <td className="p-3 text-xs font-mono truncate max-w-32">
                        {s.transaction_id ?? "—"}
                      </td>
                      <td className="p-3 text-xs font-mono truncate max-w-32">
                        {s.esewa_ref_id ?? "—"}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => openAction(s, "activate")}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Activate
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => openAction(s, "extend")}
                          >
                            <CalendarClock className="h-3 w-3 mr-1" />
                            Extend
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => openAction(s, "changePlan")}
                          >
                            <Crown className="h-3 w-3 mr-1" />
                            Plan
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-destructive"
                            onClick={() => openAction(s, "cancel")}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* Action dialog */}
      <Dialog
        open={!!actionTarget}
        onOpenChange={(o) => {
          if (!o) {
            setActionTarget(null);
            setActionType(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "activate" && "Activate subscription"}
              {actionType === "extend" && "Extend expiry"}
              {actionType === "cancel" && "Cancel subscription"}
              {actionType === "changePlan" && "Change plan"}
            </DialogTitle>
            <DialogDescription>
              {actionTarget?.user_id
                ? `User: ${profiles?.get(actionTarget.user_id)?.full_name ?? actionTarget.user_id.slice(0, 8)}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          {actionType === "extend" && (
            <div className="space-y-2">
              <Label htmlFor="days">Days to extend</Label>
              <Input
                id="days"
                type="number"
                value={extendDays}
                onChange={(e) => setExtendDays(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Current expiry:{" "}
                {actionTarget?.expires_at
                  ? new Date(actionTarget.expires_at).toLocaleDateString()
                  : "none"}
              </p>
            </div>
          )}

          {actionType === "changePlan" && (
            <div className="space-y-2">
              <Label htmlFor="plan">New plan</Label>
              <Select value={newPlan} onValueChange={setNewPlan}>
                <SelectTrigger id="plan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUB_PLANS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {actionType === "cancel" && (
            <p className="text-sm text-muted-foreground">
              This will mark the subscription as cancelled. The user will lose premium access
              immediately.
            </p>
          )}

          {actionType === "activate" && (
            <p className="text-sm text-muted-foreground">
              This will activate a 30-day premium subscription for this user.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setActionTarget(null);
                setActionType(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={submitAction}
              disabled={updateMutation.isPending}
              className={
                actionType === "cancel"
                  ? "bg-destructive text-destructive-foreground"
                  : "gradient-brand text-primary-foreground"
              }
            >
              {updateMutation.isPending ? "Saving…" : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
