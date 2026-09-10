/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
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
  CircleCheck as CheckCircle2,
  Circle as XCircle,
  Loader as Loader2,
  Plus,
  ShieldCheck,
  ScanText,
  History,
  TrendingUp,
  Sparkles,
  Activity,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  FileCheck,
  AlertCircle,
  Award,
  Rocket,
  Lightbulb,
  Github,
  Linkedin,
  GraduationCap,
  FolderGit2,
  ExternalLink,
  Code2,
  DollarSign,
  HeartHandshake,
} from "lucide-react";
import { deleteJobAsAdmin } from "@/lib/application.service";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useServerFn } from "@tanstack/react-start";
import {
  adminDeleteJob,
  adminGrantSubscription,
  adminGetResumeIntelligence,
  adminGetUserResumeHistory,
} from "@/lib/admin.server";
import { adminGetUserCareerIntelligence } from "@/lib/career-intelligence.server";
import { adminGetCompanyIntelligence } from "@/lib/company-intelligence.server";
import { cn } from "@/lib/utils";

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
        .update({ role: newRole as "employer" | "admin" | "job_seeker" })
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

  const toggleVerifyCompany = useMutation({
    mutationFn: async ({ companyId, isVerified }: { companyId: string; isVerified: boolean }) => {
      const { error } = await supabase
        .from("companies")
        .update({
          is_verified: isVerified,
          verification_status: isVerified ? "verified" : "pending",
        })
        .eq("id", companyId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success(vars.isVerified ? "Company verified" : "Company verification revoked");
      qc.invalidateQueries({ queryKey: ["admin-companies"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteJobFn = useServerFn(deleteJobAsAdmin);
  const deleteJob = async (id: string) => {
    try {
      await deleteJobFn({ data: { jobId: id } });
      toast.success("Job post removed");
      await qc.invalidateQueries({ queryKey: ["admin-jobs"] });
      await qc.invalidateQueries({ queryKey: ["admin-stats"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove job post");
    }
  };

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

      {/* Administrator Platform Access & Plan Banner */}
      <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-semibold">Administrator Account Status</h2>
                  <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">
                    Active / Unlimited
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Full unrestricted platform access with all AI and management capabilities
                  permanently enabled.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-background/60 backdrop-blur rounded-lg p-3 border">
              <div>
                <span className="text-muted-foreground block text-[11px]">Current Plan</span>
                <span className="font-semibold text-foreground">Administrator / Unlimited</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Start Date</span>
                <span className="font-medium text-foreground">Not applicable</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-muted-foreground block text-[11px]">Expiry Date</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Never</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
          <TabsTrigger value="resume-intelligence">
            <ScanText className="mr-1 h-4 w-4" />
            Resume Intelligence
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

                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
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

                      {/* User Resume Intelligence */}
                      <UserResumeIntelligenceDialog user={u} />

                      {/* Manage Subscription */}
                      <ManageUserSubscriptionDialog user={u} />

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
                        <div className="mt-1">
                          <UserResumeIntelligenceDialog
                            user={{
                              id: a.applicant_id,
                              full_name: a.applicant?.full_name,
                              email: a.applicant?.email,
                            }}
                          />
                        </div>
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
                {companies?.map((c: any) => {
                  const isVerified = Boolean(c.is_verified || c.verification_status === "verified");
                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/40 gap-3 flex-wrap sm:flex-nowrap"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">{c.name}</span>
                          {isVerified ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] px-1.5 py-0">
                              Verified
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 text-muted-foreground"
                            >
                              Standard
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {c.industry ?? "—"} · {c.headquarters ?? c.location ?? "—"}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Created {new Date(c.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant={isVerified ? "outline" : "secondary"}
                          size="sm"
                          className="h-8 text-xs gap-1"
                          onClick={() =>
                            toggleVerifyCompany.mutate({
                              companyId: c.id,
                              isVerified: !isVerified,
                            })
                          }
                          disabled={toggleVerifyCompany.isPending}
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                          {isVerified ? "Revoke" : "Verify"}
                        </Button>
                        <CompanyIntelligenceDialog company={c} />
                        <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
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
                  );
                })}
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
                    <div className="flex items-center gap-2 shrink-0">
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
                      <ConfirmDelete
                        label="Delete job"
                        description={`Permanently remove “${j.title}” and its applications?`}
                        onConfirm={() => void deleteJob(j.id)}
                      />
                    </div>
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

        {/* ── Resume Intelligence ───────────────────────────────────────── */}
        <TabsContent value="resume-intelligence">
          <ResumeIntelligenceTabContent />
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
  { value: "free", label: "Free (Job Seeker)" },
  { value: "premium", label: "Premium (Job Seeker)" },
  { value: "starter", label: "Starter (Employer)" },
  { value: "professional", label: "Professional (Employer)" },
  { value: "enterprise", label: "Enterprise (Employer)" },
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
  if (status === "trialing") return <Badge variant="default">Trialing</Badge>;
  return <Badge variant="outline">{status ?? "—"}</Badge>;
}

function ManageUserSubscriptionDialog({
  user,
  triggerButton,
}: {
  user: any;
  triggerButton?: React.ReactNode;
}) {
  const qc = useQueryClient();
  const grantSubFn = useServerFn(adminGrantSubscription);
  const [open, setOpen] = useState(false);
  const [planType, setPlanType] = useState<string>("premium");
  const [status, setStatus] = useState<"active" | "trialing" | "cancelled" | "expired">("active");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [expiryOption, setExpiryOption] = useState<"30" | "90" | "365" | "never" | "custom">("30");
  const [customExpiryDate, setCustomExpiryDate] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: currentSub, isLoading: loadingCurrentSub } = useQuery({
    queryKey: ["user-sub-detail", user?.id],
    enabled: open && !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (open) {
      if (currentSub) {
        if (currentSub.plan_type) setPlanType(currentSub.plan_type);
        if (currentSub.status) setStatus(currentSub.status as any);
        if (currentSub.started_at) {
          setStartDate(new Date(currentSub.started_at).toISOString().split("T")[0]);
        }
        if (currentSub.expires_at) {
          setExpiryOption("custom");
          setCustomExpiryDate(new Date(currentSub.expires_at).toISOString().split("T")[0]);
        } else {
          setExpiryOption("never");
        }
      } else {
        setPlanType(user.role === "employer" ? "starter" : "premium");
        setStatus("active");
        setStartDate(new Date().toISOString().split("T")[0]);
        setExpiryOption("30");
      }
    }
  }, [currentSub, open, user.role]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let expiresAt: string | null = null;
      const start = new Date(startDate || Date.now());

      if (expiryOption === "30") {
        const exp = new Date(start);
        exp.setDate(exp.getDate() + 30);
        expiresAt = exp.toISOString();
      } else if (expiryOption === "90") {
        const exp = new Date(start);
        exp.setDate(exp.getDate() + 90);
        expiresAt = exp.toISOString();
      } else if (expiryOption === "365") {
        const exp = new Date(start);
        exp.setDate(exp.getDate() + 365);
        expiresAt = exp.toISOString();
      } else if (expiryOption === "custom") {
        if (!customExpiryDate) {
          toast.error("Please enter a custom expiry date");
          setLoading(false);
          return;
        }
        expiresAt = new Date(customExpiryDate).toISOString();
      } else if (expiryOption === "never") {
        expiresAt = null;
      }

      await grantSubFn({
        data: {
          targetUserId: user.id,
          planType: planType as any,
          status,
          startedAt: start.toISOString(),
          expiresAt,
        },
      });

      toast.success(`Subscription granted for ${user.full_name ?? user.email}`);
      await qc.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      await qc.invalidateQueries({ queryKey: ["user-sub-detail", user.id] });
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to grant subscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {triggerButton ? (
        <div onClick={() => setOpen(true)}>{triggerButton}</div>
      ) : (
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setOpen(true)}>
          <CreditCard className="h-3.5 w-3.5 mr-1" />
          Manage Plan
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Manage Subscription — {user?.full_name ?? user?.email}
            </DialogTitle>
            <DialogDescription>
              Directly grant, modify, or activate a platform plan for this user. This creates an
              administrative grant without simulated external payment records.
            </DialogDescription>
          </DialogHeader>

          {loadingCurrentSub ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Loading current subscription status…
            </div>
          ) : (
            <div className="space-y-4 py-2 text-sm">
              {/* Current Status Box */}
              <div className="p-3.5 rounded-xl border bg-muted/40 space-y-1.5 text-xs">
                <div className="font-semibold text-foreground flex items-center justify-between">
                  <span>Current Subscription Status</span>
                  {currentSub ? (
                    statusBadge(currentSub.status)
                  ) : (
                    <Badge variant="outline">No Active Subscription</Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground pt-1">
                  <div>
                    Plan:{" "}
                    <span className="font-medium text-foreground capitalize">
                      {currentSub?.plan_type ?? "None"}
                    </span>
                  </div>
                  <div>
                    Payment Source:{" "}
                    <span className="font-medium text-foreground">
                      {currentSub?.transaction_id?.startsWith("admin_grant")
                        ? "Admin Grant"
                        : currentSub?.esewa_ref_id
                          ? "eSewa"
                          : "None"}
                    </span>
                  </div>
                  <div>
                    Started:{" "}
                    <span className="font-medium text-foreground">
                      {currentSub?.started_at
                        ? new Date(currentSub.started_at).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>
                  <div>
                    Expires:{" "}
                    <span className="font-medium text-foreground">
                      {currentSub?.expires_at
                        ? new Date(currentSub.expires_at).toLocaleDateString()
                        : "Never / Unlimited"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Controls */}
              <div className="space-y-3 pt-1">
                <div>
                  <Label htmlFor="planSelect" className="text-xs font-medium mb-1.5 block">
                    Select Plan
                  </Label>
                  <Select value={planType} onValueChange={setPlanType}>
                    <SelectTrigger id="planSelect">
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="statusSelect" className="text-xs font-medium mb-1.5 block">
                      Subscription Status
                    </Label>
                    <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                      <SelectTrigger id="statusSelect">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active (Full Access)</SelectItem>
                        <SelectItem value="trialing">Trialing</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="startDate" className="text-xs font-medium mb-1.5 block">
                      Start Date
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium mb-1.5 block">Subscription Expiry</Label>
                  <div className="grid grid-cols-5 gap-1.5 mb-2">
                    {[
                      { id: "30", label: "30 Days" },
                      { id: "90", label: "90 Days" },
                      { id: "365", label: "1 Year" },
                      { id: "never", label: "Unlimited" },
                      { id: "custom", label: "Custom" },
                    ].map((opt) => (
                      <Button
                        key={opt.id}
                        type="button"
                        size="sm"
                        variant={expiryOption === opt.id ? "default" : "outline"}
                        className="text-xs h-8 px-1"
                        onClick={() => setExpiryOption(opt.id as any)}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>

                  {expiryOption === "custom" && (
                    <div className="pt-1">
                      <Input
                        type="date"
                        value={customExpiryDate}
                        onChange={(e) => setCustomExpiryDate(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="gradient-brand text-primary-foreground"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Saving…
                    </>
                  ) : (
                    "Save & Grant Subscription"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function AdminSubscriptions() {
  const qc = useQueryClient();
  const grantSubFn = useServerFn(adminGrantSubscription);
  const [search, setSearch] = useState("");
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [selectedUserForGrant, setSelectedUserForGrant] = useState<string>("");
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

  const { data: allUsers } = useQuery({
    queryKey: ["admin-all-users-for-grant"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name", { ascending: true })
        .limit(300);
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

  function openAction(sub: any, type: typeof actionType) {
    setActionTarget(sub);
    setActionType(type);
    setExtendDays("30");
    setNewPlan(sub.plan_type ?? "starter");
  }

  async function submitAction() {
    if (!actionTarget || !actionType) return;
    const sub = actionTarget;
    const now = new Date();

    try {
      if (actionType === "activate") {
        const expires = new Date(now);
        expires.setDate(expires.getDate() + 30);
        await grantSubFn({
          data: {
            targetUserId: sub.user_id,
            planType: sub.plan_type || "premium",
            status: "active",
            startedAt: now.toISOString(),
            expiresAt: expires.toISOString(),
          },
        });
        toast.success("Subscription activated for 30 days");
      } else if (actionType === "extend") {
        const base = sub.expires_at ? new Date(sub.expires_at) : now;
        if (base < now) base.setTime(now.getTime());
        const days = parseInt(extendDays, 10) || 30;
        base.setDate(base.getDate() + days);
        await grantSubFn({
          data: {
            targetUserId: sub.user_id,
            planType: sub.plan_type || "premium",
            status: "active",
            startedAt: sub.started_at || now.toISOString(),
            expiresAt: base.toISOString(),
          },
        });
        toast.success(`Subscription extended by ${days} days`);
      } else if (actionType === "cancel") {
        await grantSubFn({
          data: {
            targetUserId: sub.user_id,
            planType: sub.plan_type || "free",
            status: "cancelled",
            startedAt: sub.started_at || now.toISOString(),
            expiresAt: sub.expires_at || null,
          },
        });
        toast.success("Subscription cancelled");
      } else if (actionType === "changePlan") {
        await grantSubFn({
          data: {
            targetUserId: sub.user_id,
            planType: newPlan as any,
            status: sub.status === "active" ? "active" : "active",
            startedAt: sub.started_at || now.toISOString(),
            expiresAt: sub.expires_at || null,
          },
        });
        toast.success(`Plan changed to ${newPlan}`);
      }

      await qc.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      setActionTarget(null);
      setActionType(null);
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    }
  }

  const selectedUserObject = allUsers?.find((u) => u.id === selectedUserForGrant);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            User Subscriptions
          </CardTitle>

          <div className="flex items-center gap-2">
            <Input
              placeholder="Search by plan, status, transaction id…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs h-9"
            />
            <Button
              size="sm"
              className="h-9 gradient-brand text-primary-foreground"
              onClick={() => setGrantModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Grant Subscription
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading subscriptions…</div>
        ) : !subscriptions?.length ? (
          <div className="p-8 text-center text-muted-foreground">No subscriptions found.</div>
        ) : (
          <>
            {/* Mobile Cards (sm:hidden) */}
            <div className="space-y-3 sm:hidden p-3">
              {subscriptions.map((s: any) => {
                const profile = profiles?.get(s.user_id) as any;
                const expired = s.expires_at && new Date(s.expires_at) < new Date();
                return (
                  <div key={s.id} className="rounded-xl border p-3.5 space-y-2 bg-card">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-sm">{profile?.full_name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">
                          {profile?.email ?? s.user_id?.slice(0, 8)}
                        </div>
                      </div>
                      {statusBadge(expired && s.status === "active" ? "expired" : s.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground pt-1 border-t">
                      <div>
                        Plan:{" "}
                        <span className="font-medium text-foreground capitalize">
                          {s.plan_type}
                        </span>
                      </div>
                      <div>
                        Amount:{" "}
                        <span className="font-medium text-foreground">
                          {s.amount ? `Rs. ${Number(s.amount).toLocaleString()}` : "Admin Grant"}
                        </span>
                      </div>
                      <div>
                        Start:{" "}
                        <span>
                          {s.started_at ? new Date(s.started_at).toLocaleDateString() : "—"}
                        </span>
                      </div>
                      <div>
                        End:{" "}
                        <span>
                          {s.expires_at ? new Date(s.expires_at).toLocaleDateString() : "Never"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-wrap pt-2 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs flex-1"
                        onClick={() => openAction(s, "activate")}
                      >
                        Activate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs flex-1"
                        onClick={() => openAction(s, "extend")}
                      >
                        Extend
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs flex-1"
                        onClick={() => openAction(s, "changePlan")}
                      >
                        Plan
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (hidden sm:block) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left p-3 font-medium">User</th>
                    <th className="text-left p-3 font-medium">Plan</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Start</th>
                    <th className="text-left p-3 font-medium">End</th>
                    <th className="text-left p-3 font-medium">Source / Tx</th>
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
                        <td className="p-3 capitalize font-medium">{s.plan_type}</td>
                        <td className="p-3">
                          {statusBadge(expired && s.status === "active" ? "expired" : s.status)}
                        </td>
                        <td className="p-3 text-xs">
                          {s.started_at ? new Date(s.started_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="p-3 text-xs">
                          {s.expires_at ? new Date(s.expires_at).toLocaleDateString() : "Never"}
                        </td>
                        <td className="p-3 text-xs font-mono truncate max-w-36">
                          {s.transaction_id?.startsWith("admin_grant")
                            ? "Admin Grant"
                            : (s.transaction_id ?? s.esewa_ref_id ?? "—")}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => openAction(s, "activate")}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
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
                              <Crown className="h-3 w-3 mr-1 text-amber-500" />
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
          </>
        )}
      </CardContent>

      {/* Grant Subscription Dialog from Header */}
      <Dialog open={grantModalOpen} onOpenChange={setGrantModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Grant Subscription to User
            </DialogTitle>
            <DialogDescription>
              Select a user to configure and grant a platform subscription.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Select User</Label>
              <Select value={selectedUserForGrant} onValueChange={setSelectedUserForGrant}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a registered user…" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {(allUsers ?? []).map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name ? `${u.full_name} (${u.email})` : u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedUserObject && (
              <div className="pt-2">
                <ManageUserSubscriptionDialog
                  user={selectedUserObject}
                  triggerButton={
                    <Button className="w-full gradient-brand text-primary-foreground">
                      Configure Plan for {selectedUserObject.full_name || selectedUserObject.email}
                    </Button>
                  }
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
              This will activate a 30-day subscription for this user.
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
              className={
                actionType === "cancel"
                  ? "bg-destructive text-destructive-foreground"
                  : "gradient-brand text-primary-foreground"
              }
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ============================================================
// Admin Resume Intelligence & User Activity Management
// ============================================================

function ResumeIntelligenceTabContent() {
  const fetchResumeIntelligence = useServerFn(adminGetResumeIntelligence);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedScanForDetail, setSelectedScanForDetail] = useState<any>(null);
  const [selectedUserForHistory, setSelectedUserForHistory] = useState<any>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-resume-intelligence"],
    queryFn: async () => {
      const res = await fetchResumeIntelligence();
      return res;
    },
  });

  const stats = (data as any)?.stats || (data as any)?.aggregate || {};
  const aggregate = {
    totalScans: stats.totalScans ?? 0,
    scansToday: stats.scansToday ?? 0,
    uniqueUsers: stats.uniqueUsers ?? 0,
    avgAtsScore: stats.avgAts ?? stats.avgAtsScore ?? 0,
    highestAtsScore: stats.highestAts ?? stats.highestAtsScore ?? 0,
    avgScoreImprovement: stats.avgImprovement ?? stats.avgScoreImprovement ?? 0,
  };

  const allScans = (data?.scans || []) as any[];

  const filteredScans = allScans.filter((s) => {
    const q = search.toLowerCase().trim();
    const matchQuery =
      !q ||
      (s.file_name ?? "").toLowerCase().includes(q) ||
      (s.profiles?.full_name ?? "").toLowerCase().includes(q) ||
      (s.profiles?.email ?? "").toLowerCase().includes(q) ||
      (s.user_id ?? "").toLowerCase().includes(q);

    const matchStatus = statusFilter === "all" || s.scan_status === statusFilter;
    return matchQuery && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Aggregated Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <Card className="border-primary/20 bg-card/60 backdrop-blur">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Total Resume Scans</div>
            <div className="text-2xl font-bold mt-1 text-foreground flex items-center gap-1.5">
              <ScanText className="h-5 w-5 text-primary" />
              {aggregate.totalScans}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60 backdrop-blur">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Unique Users</div>
            <div className="text-2xl font-bold mt-1 text-foreground flex items-center gap-1.5">
              <Users className="h-5 w-5 text-blue-500" />
              {aggregate.uniqueUsers}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60 backdrop-blur">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Scans Today</div>
            <div className="text-2xl font-bold mt-1 text-foreground flex items-center gap-1.5">
              <Clock className="h-5 w-5 text-purple-500" />
              {aggregate.scansToday}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60 backdrop-blur">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Avg ATS Score</div>
            <div className="text-2xl font-bold mt-1 text-foreground flex items-center gap-1.5">
              <Target className="h-5 w-5 text-amber-500" />
              {aggregate.avgAtsScore}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60 backdrop-blur">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Highest ATS</div>
            <div className="text-2xl font-bold mt-1 text-foreground flex items-center gap-1.5">
              <Award className="h-5 w-5 text-emerald-500" />
              {aggregate.highestAtsScore}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60 backdrop-blur">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Avg Improvement</div>
            <div className="text-2xl font-bold mt-1 text-foreground flex items-center gap-1.5">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              {aggregate.avgScoreImprovement > 0
                ? `+${aggregate.avgScoreImprovement}`
                : aggregate.avgScoreImprovement}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Scans Table & Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Recent Resume Scans & ATS Activity
            </CardTitle>

            <div className="flex items-center gap-2 flex-wrap">
              <Input
                placeholder="Search user, email, file…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56 h-9 text-xs"
              />

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Button size="sm" variant="outline" className="h-9 text-xs" onClick={() => refetch()}>
                <Loader2 className="h-3.5 w-3.5 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading Resume Intelligence…
            </div>
          ) : !filteredScans.length ? (
            <div className="p-8 text-center text-muted-foreground">No resume scans found.</div>
          ) : (
            <div className="divide-y">
              {filteredScans.map((scan: any) => {
                const profile = scan.profiles;
                const isCompleted = scan.scan_status === "completed";
                const ats = scan.ats_score ?? scan.overall_score;
                const scoreDiff = scan.score_improvement;

                return (
                  <div
                    key={scan.id}
                    className="p-4 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">
                            {profile?.full_name || "Unknown Candidate"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({profile?.email || scan.user_id?.slice(0, 8)})
                          </span>
                          <Badge
                            variant={isCompleted ? "default" : "destructive"}
                            className="text-[10px] uppercase px-1.5 py-0"
                          >
                            {scan.scan_status}
                          </Badge>
                          {scan.extraction_source && (
                            <Badge variant="outline" className="text-[10px] uppercase px-1.5 py-0">
                              {scan.extraction_source.replace("_", " ")}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                          <span className="font-medium text-foreground">{scan.file_name}</span>
                          <span>·</span>
                          <span>
                            {new Date(scan.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {scan.duration_ms ? (
                            <>
                              <span>·</span>
                              <span>
                                {(scan.duration_ms / 1000).toFixed(1)}s (
                                {scan.ai_provider || "Gemini"})
                              </span>
                            </>
                          ) : null}
                        </div>

                        {scan.failure_reason && (
                          <div className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            <span>{scan.failure_reason}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      {isCompleted && ats != null && (
                        <div className="text-right">
                          <div className="text-sm font-bold flex items-center gap-1 justify-end">
                            <span>ATS: {ats}/100</span>
                          </div>
                          {scoreDiff != null ? (
                            <div
                              className={cn(
                                "text-[11px] font-semibold flex items-center gap-0.5 justify-end",
                                scoreDiff > 0
                                  ? "text-emerald-600"
                                  : scoreDiff < 0
                                    ? "text-red-500"
                                    : "text-muted-foreground",
                              )}
                            >
                              {scoreDiff > 0 ? (
                                <>
                                  <ArrowUpRight className="h-3 w-3" /> +{scoreDiff}
                                </>
                              ) : scoreDiff < 0 ? (
                                <>
                                  <ArrowDownRight className="h-3 w-3" /> {scoreDiff}
                                </>
                              ) : (
                                "No change"
                              )}
                            </div>
                          ) : (
                            <div className="text-[10px] text-muted-foreground">Baseline</div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        {isCompleted && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => setSelectedScanForDetail(scan)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Analysis
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 text-xs"
                          onClick={() =>
                            setSelectedUserForHistory({
                              id: scan.user_id,
                              full_name: profile?.full_name,
                              email: profile?.email,
                            })
                          }
                        >
                          <History className="h-3.5 w-3.5 mr-1" />
                          User History
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Scan Full Analysis Dialog */}
      {selectedScanForDetail && (
        <ScanDetailDialog
          scan={selectedScanForDetail}
          open={!!selectedScanForDetail}
          onClose={() => setSelectedScanForDetail(null)}
        />
      )}

      {/* Selected User Full Resume Profile Dialog */}
      {selectedUserForHistory && (
        <UserResumeIntelligenceDialog
          user={selectedUserForHistory}
          controlledOpen={!!selectedUserForHistory}
          onControlledClose={() => setSelectedUserForHistory(null)}
        />
      )}
    </div>
  );
}

function UserResumeIntelligenceDialog({
  user,
  triggerButton,
  controlledOpen,
  onControlledClose,
}: {
  user: { id: string; full_name?: string; email?: string };
  triggerButton?: React.ReactNode;
  controlledOpen?: boolean;
  onControlledClose?: () => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (val: boolean) => {
    if (controlledOpen !== undefined) {
      if (!val && onControlledClose) onControlledClose();
    } else {
      setInternalOpen(val);
    }
  };

  const fetchCareerIntelligence = useServerFn(adminGetUserCareerIntelligence);
  const [selectedScanDetail, setSelectedScanDetail] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-user-career-intelligence", user.id],
    enabled: isOpen && !!user.id,
    queryFn: async () => {
      return await fetchCareerIntelligence({ data: { userId: user.id } });
    },
  });

  const profile = data?.profile;
  const intelligence = data?.intelligence;
  const scans = (data?.scans || []) as any[];
  const snapshots = (data?.snapshots || []) as any[];
  const activities = (data?.activities || []) as any[];

  const readinessScore = intelligence?.career_readiness_score ?? 0;
  const profileCompleteness = intelligence?.profile_completeness ?? 0;
  const atsScore = intelligence?.ats_score ?? (scans[0]?.ats_score || scans[0]?.overall_score);
  const scoreChange = intelligence?.score_change ?? scans[0]?.score_improvement;

  const githubData = (intelligence?.github_data || {
    username: profile?.github_username,
    profile_url: profile?.github_username ? `https://github.com/${profile.github_username}` : null,
    project_count: Array.isArray(profile?.projects) ? profile.projects.length : 0,
  }) as any;
  const linkedinData = (intelligence?.linkedin_data || {
    profile_url: profile?.linkedin_url,
  }) as any;

  const skills = (intelligence?.skills || profile?.skills || []) as string[];
  const projects = (intelligence?.projects || profile?.projects || []) as any[];
  const experience = (intelligence?.experience || profile?.experience || []) as any[];
  const education = (intelligence?.education || profile?.education || []) as any[];
  const roadmap = intelligence?.ai_career_roadmap as any;
  const recommendations = intelligence?.ai_recommendations as any;

  return (
    <>
      {triggerButton ? (
        <div onClick={() => setOpen(true)}>{triggerButton}</div>
      ) : controlledOpen === undefined ? (
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs gap-1"
          onClick={() => setOpen(true)}
          title="Candidate 360° Career Intelligence"
        >
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
          <span>Intelligence</span>
        </Button>
      ) : null}

      <Dialog open={isOpen} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <TrendingUp className="h-6 w-6 text-primary" />
              Candidate 360° Career Intelligence —{" "}
              {profile?.full_name ||
                intelligence?.candidate_name ||
                user?.full_name ||
                user?.email ||
                "User Profile"}
            </DialogTitle>
            <DialogDescription>
              Authoritative view of candidate profile, work experience, GitHub/LinkedIn sync, resume
              ATS versions, and AI career roadmap.
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="py-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Loading 360° candidate career intelligence…</span>
            </div>
          ) : (
            <div className="space-y-6 pt-2">
              {/* Top Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 rounded-xl border bg-muted/30">
                  <div className="text-[11px] text-muted-foreground">Readiness Index</div>
                  <div className="text-xl font-bold mt-0.5 text-foreground flex items-baseline gap-1">
                    <span>{readinessScore}</span>
                    <span className="text-xs text-muted-foreground font-normal">/100</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border bg-muted/30">
                  <div className="text-[11px] text-muted-foreground">Latest ATS</div>
                  <div className="text-xl font-bold mt-0.5 text-emerald-600 flex items-baseline gap-1">
                    <span>{atsScore != null ? atsScore : "—"}</span>
                    {atsScore != null && (
                      <span className="text-xs text-muted-foreground font-normal">/100</span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl border bg-muted/30">
                  <div className="text-[11px] text-muted-foreground">Completeness</div>
                  <div className="text-xl font-bold mt-0.5 text-primary">
                    {profileCompleteness}%
                  </div>
                </div>

                <div className="p-3 rounded-xl border bg-muted/30">
                  <div className="text-[11px] text-muted-foreground">Resume Scans</div>
                  <div className="text-xl font-bold mt-0.5 text-foreground">{scans.length}</div>
                </div>

                <div className="p-3 rounded-xl border bg-muted/30 col-span-2 sm:col-span-1">
                  <div className="text-[11px] text-muted-foreground">Score Change</div>
                  <div className="text-xl font-bold mt-0.5 flex items-center gap-1">
                    {scoreChange != null ? (
                      <span
                        className={
                          scoreChange > 0
                            ? "text-emerald-600"
                            : scoreChange < 0
                              ? "text-red-500"
                              : "text-foreground"
                        }
                      >
                        {scoreChange > 0 ? `+${scoreChange}` : scoreChange}
                      </span>
                    ) : (
                      "—"
                    )}
                  </div>
                </div>
              </div>

              {/* Sub-tabs */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid grid-cols-5 w-full">
                  <TabsTrigger value="overview" className="text-xs">
                    <Briefcase className="h-3.5 w-3.5 mr-1 text-primary" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger value="scans" className="text-xs">
                    <ScanText className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                    Scans ({scans.length})
                  </TabsTrigger>
                  <TabsTrigger value="projects" className="text-xs">
                    <FolderGit2 className="h-3.5 w-3.5 mr-1 text-blue-500" />
                    Projects ({projects.length})
                  </TabsTrigger>
                  <TabsTrigger value="roadmap" className="text-xs">
                    <Rocket className="h-3.5 w-3.5 mr-1 text-purple-500" />
                    AI Roadmap
                  </TabsTrigger>
                  <TabsTrigger value="timeline" className="text-xs">
                    <History className="h-3.5 w-3.5 mr-1" />
                    Timeline ({activities.length})
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Profile & Background */}
                <TabsContent value="overview" className="pt-3 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Bio & Headline */}
                    <div className="p-4 rounded-xl border bg-muted/20 space-y-2">
                      <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider">
                        Candidate Summary
                      </h4>
                      <div className="text-xs space-y-1">
                        <div>
                          <strong className="text-foreground">Headline:</strong>{" "}
                          {profile?.headline || intelligence?.headline || "Not provided"}
                        </div>
                        <div>
                          <strong className="text-foreground">Location:</strong>{" "}
                          {profile?.location || "Not specified"}
                        </div>
                        <div>
                          <strong className="text-foreground">Experience:</strong>{" "}
                          {profile?.experience_years ?? 0} years
                        </div>
                        <div>
                          <strong className="text-foreground">Current Position:</strong>{" "}
                          {profile?.current_position || "Not specified"}
                        </div>
                        <div>
                          <strong className="text-foreground">Expected Salary:</strong>{" "}
                          {profile?.expected_salary
                            ? `Rs. ${profile.expected_salary}/month`
                            : "Not specified"}
                        </div>
                      </div>
                      {(profile?.bio || profile?.about) && (
                        <div className="pt-2 border-t text-xs text-muted-foreground">
                          {profile.bio || profile.about}
                        </div>
                      )}
                    </div>

                    {/* Connected Accounts */}
                    <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
                      <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider">
                        Connected Integrations
                      </h4>

                      <div className="flex items-center justify-between p-2.5 rounded-lg border bg-background/50 text-xs">
                        <div className="flex items-center gap-2">
                          <Github className="h-4 w-4" />
                          <span>GitHub:</span>
                          <span className="font-medium text-foreground">
                            {githubData?.username ? `@${githubData.username}` : "Not linked"}
                          </span>
                        </div>
                        {githubData?.profile_url && (
                          <a
                            href={githubData.profile_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            <span>Profile</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-lg border bg-background/50 text-xs">
                        <div className="flex items-center gap-2">
                          <Linkedin className="h-4 w-4 text-blue-500" />
                          <span>LinkedIn:</span>
                          <span className="font-medium text-foreground truncate max-w-[160px]">
                            {linkedinData?.profile_url ? "Linked" : "Not linked"}
                          </span>
                        </div>
                        {linkedinData?.profile_url && (
                          <a
                            href={linkedinData.profile_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            <span>Profile</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Work Experience & Education */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border bg-muted/20 space-y-2">
                      <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Briefcase className="h-4 w-4 text-primary" /> Work Experience (
                        {experience.length})
                      </h4>
                      {!experience.length ? (
                        <div className="text-xs text-muted-foreground">No experience records.</div>
                      ) : (
                        <div className="space-y-2">
                          {experience.map((exp: any, i: number) => (
                            <div
                              key={i}
                              className="border-l-2 border-primary pl-2.5 text-xs space-y-0.5"
                            >
                              <div className="font-semibold text-foreground">
                                {exp.title || exp.position || "Role"}
                              </div>
                              <div className="text-muted-foreground">
                                {exp.company} ·{" "}
                                {exp.duration ||
                                  `${exp.start_date || ""} - ${exp.end_date || "Present"}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="p-4 rounded-xl border bg-muted/20 space-y-2">
                      <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <GraduationCap className="h-4 w-4 text-primary" /> Education (
                        {education.length})
                      </h4>
                      {!education.length ? (
                        <div className="text-xs text-muted-foreground">No education records.</div>
                      ) : (
                        <div className="space-y-2">
                          {education.map((edu: any, i: number) => (
                            <div
                              key={i}
                              className="border-l-2 border-primary pl-2.5 text-xs space-y-0.5"
                            >
                              <div className="font-semibold text-foreground">
                                {edu.degree || "Degree"}
                              </div>
                              <div className="text-muted-foreground">
                                {edu.institution || edu.school} ·{" "}
                                {edu.year || edu.graduation_year || ""}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Tab 2: Resume Scans History */}
                <TabsContent value="scans" className="pt-3">
                  {!scans.length ? (
                    <div className="p-8 text-center text-sm text-muted-foreground border rounded-xl">
                      No resume scan versions recorded for this user.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {scans.map((s, idx) => {
                        const versionNumber = scans.length - idx;
                        const isCompleted = s.scan_status === "completed";
                        const ats = s.ats_score ?? s.overall_score;

                        return (
                          <div
                            key={s.id}
                            className="p-3.5 rounded-xl border hover:bg-muted/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                                v{versionNumber}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-sm truncate">
                                    {s.file_name}
                                  </span>
                                  {idx === 0 && (
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                      Active
                                    </Badge>
                                  )}
                                  <Badge
                                    variant={isCompleted ? "outline" : "destructive"}
                                    className="text-[10px] uppercase px-1.5 py-0"
                                  >
                                    {s.scan_status}
                                  </Badge>
                                  {s.extraction_source && (
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] uppercase px-1.5 py-0"
                                    >
                                      {s.extraction_source.replace("_", " ")}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  Scanned:{" "}
                                  {new Date(s.created_at).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                              {isCompleted && (
                                <div className="text-right">
                                  <div className="text-sm font-bold">ATS: {ats}/100</div>
                                  {s.score_improvement != null ? (
                                    <div
                                      className={cn(
                                        "text-[11px] font-semibold flex items-center gap-0.5 justify-end",
                                        s.score_improvement > 0
                                          ? "text-emerald-600"
                                          : s.score_improvement < 0
                                            ? "text-red-500"
                                            : "text-muted-foreground",
                                      )}
                                    >
                                      {s.score_improvement > 0
                                        ? `+${s.score_improvement}`
                                        : s.score_improvement}
                                    </div>
                                  ) : (
                                    <div className="text-[10px] text-muted-foreground">
                                      Baseline
                                    </div>
                                  )}
                                </div>
                              )}

                              {isCompleted && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs"
                                  onClick={() => setSelectedScanDetail(s)}
                                >
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  Inspect Analysis
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                {/* Tab 3: GitHub & Projects */}
                <TabsContent value="projects" className="pt-3 space-y-3">
                  {!projects.length ? (
                    <div className="p-8 text-center text-sm text-muted-foreground border rounded-xl">
                      No projects recorded for this user.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {projects.map((proj: any, i: number) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-xl border bg-muted/20 space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-foreground truncate">
                              {proj.name}
                            </span>
                            {proj.language && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {proj.language}
                              </Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground line-clamp-2">
                            {proj.description || "Portfolio project"}
                          </p>
                          {proj.url && (
                            <div className="pt-1">
                              <a
                                href={proj.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:underline flex items-center gap-1 text-[11px]"
                              >
                                <span>Repository / Link</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Tab 4: AI Career Roadmap & Insights */}
                <TabsContent value="roadmap" className="pt-3 space-y-4">
                  {/* Unified Combined Skills */}
                  <div>
                    <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider mb-2">
                      Unified Skills Cloud ({skills.length})
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map((sk: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {sk}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl border bg-emerald-500/5 border-emerald-500/20">
                      <h4 className="font-semibold text-xs text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" /> Top Strengths
                      </h4>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {(
                          recommendations?.strengths ||
                          roadmap?.strengths || ["Technical versatility", "Document clarity"]
                        ).map((st: string, i: number) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span>•</span> <span>{st}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3.5 rounded-xl border bg-amber-500/5 border-amber-500/20">
                      <h4 className="font-semibold text-xs text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4" /> Skill Gaps & Focus
                      </h4>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {(
                          recommendations?.skill_gaps ||
                          roadmap?.missing_skills || ["Advanced Cloud Arch", "Testing automation"]
                        ).map((wk: string, i: number) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span>•</span> <span>{wk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Career Paths */}
                  {recommendations?.career_paths?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider mb-2">
                        Recommended Career Paths
                      </h4>
                      <div className="space-y-2">
                        {recommendations.career_paths.map((cp: any, i: number) => (
                          <div
                            key={i}
                            className="p-3 rounded-lg border text-xs space-y-1 bg-muted/20"
                          >
                            <div className="font-bold text-foreground">{cp.title}</div>
                            <div className="text-muted-foreground">{cp.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Tab 5: Chronological Activity Timeline */}
                <TabsContent value="timeline" className="pt-3">
                  {!activities.length ? (
                    <div className="p-8 text-center text-sm text-muted-foreground border rounded-xl">
                      No activity logs recorded.
                    </div>
                  ) : (
                    <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                      {activities.map((act) => {
                        const dateFormatted = new Date(act.created_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        });

                        return (
                          <div key={act.id} className="relative">
                            <div className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                            <div className="rounded-xl border p-3 bg-muted/20 space-y-1">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="font-semibold text-xs text-foreground uppercase tracking-wide">
                                  {act.activity_type.replace(/_/g, " ")}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  {dateFormatted}
                                </span>
                              </div>
                              {act.metadata && Object.keys(act.metadata).length > 0 && (
                                <div className="text-xs text-muted-foreground pt-1 border-t border-border/50 flex flex-wrap gap-x-3 gap-y-1">
                                  {Object.entries(act.metadata).map(([k, v]) => (
                                    <span key={k}>
                                      <strong className="text-foreground">{k}:</strong> {String(v)}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Deep Inspection Scan Dialog */}
      {selectedScanDetail && (
        <ScanDetailDialog
          scan={selectedScanDetail}
          open={!!selectedScanDetail}
          onClose={() => setSelectedScanDetail(null)}
        />
      )}
    </>
  );
}

function ScanDetailDialog({
  scan,
  open,
  onClose,
}: {
  scan: any;
  open: boolean;
  onClose: () => void;
}) {
  if (!scan) return null;

  const scoreCategories = [
    { label: "ATS Score", value: scan.ats_score ?? scan.overall_score },
    { label: "Overall Score", value: scan.overall_score },
    { label: "Keywords Match", value: scan.keyword_score },
    { label: "Formatting Score", value: scan.formatting_score },
    { label: "Skills Alignment", value: scan.skills_score },
    { label: "Experience Impact", value: scan.experience_score },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileCheck className="h-5 w-5 text-primary" />
            Scan Analysis — {scan.file_name}
          </DialogTitle>
          <DialogDescription>
            Scanned on {new Date(scan.created_at).toLocaleString()} · Source:{" "}
            {scan.extraction_source || "File"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2 text-sm">
          {/* Score Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {scoreCategories.map((sc) => (
              <div key={sc.label} className="p-3 rounded-xl border bg-muted/20">
                <div className="text-[11px] text-muted-foreground">{sc.label}</div>
                <div className="text-lg font-bold mt-0.5 text-foreground">
                  {sc.value != null ? `${sc.value}/100` : "—"}
                </div>
              </div>
            ))}
          </div>

          {/* Extracted Skills */}
          {scan.extracted_skills?.length > 0 && (
            <div>
              <div className="font-semibold text-xs mb-2">Identified Skills</div>
              <div className="flex flex-wrap gap-1.5">
                {(scan.extracted_skills as string[]).map((sk: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {sk}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Recommendations */}
          {scan.recommendations?.length > 0 && (
            <div>
              <div className="font-semibold text-xs mb-2 flex items-center gap-1.5 text-amber-600">
                <Lightbulb className="h-4 w-4" /> AI Recommendations
              </div>
              <div className="space-y-1.5">
                {scan.recommendations.map((rec: string, i: number) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-2.5 rounded-lg border text-xs bg-muted/20"
                  >
                    <span className="font-bold text-amber-600">{i + 1}.</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {scan.strengths?.length > 0 && (
              <div className="p-3 rounded-xl border bg-emerald-500/5">
                <div className="font-semibold text-xs text-emerald-600 mb-1.5">Strengths</div>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  {scan.strengths.map((s: string, i: number) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>
            )}

            {scan.weaknesses?.length > 0 && (
              <div className="p-3 rounded-xl border bg-red-500/5">
                <div className="font-semibold text-xs text-red-600 mb-1.5">Weaknesses</div>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  {scan.weaknesses.map((w: string, i: number) => (
                    <li key={i}>• {w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CompanyIntelligenceDialog({
  company,
  triggerButton,
}: {
  company: { id: string; name: string; slug?: string };
  triggerButton?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const fetchCI = useServerFn(adminGetCompanyIntelligence);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-company-intelligence", company.id],
    enabled: open && !!company.id,
    queryFn: async () => {
      return await fetchCI({ data: { companyId: company.id } });
    },
  });

  const fullCompany = (data?.company || company) as any;
  const intelligence = data?.intelligence as any;
  const snapshots = (data?.snapshots || []) as any[];
  const jobs = (data?.jobs || []) as any[];
  const activities = (data?.activities || []) as any[];

  const readinessScore = intelligence?.hiring_readiness_score ?? 0;
  const profileCompleteness = intelligence?.profile_completeness ?? 0;
  const technologies = (intelligence?.technologies || fullCompany?.technologies || []) as string[];
  const benefits = (intelligence?.benefits || fullCompany?.benefits || []) as string[];
  const roadmap = intelligence?.ai_hiring_roadmap as any;
  const recommendations = intelligence?.ai_recommendations as any;
  const jobStats = (intelligence?.job_stats || {
    total_jobs: jobs.length,
    active_jobs: jobs.filter((j) => j.status === "active").length,
    total_applicants: jobs.reduce((acc, j) => acc + (j.applications_count || 0), 0),
  }) as any;

  return (
    <>
      {triggerButton ? (
        <div onClick={() => setOpen(true)}>{triggerButton}</div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs gap-1"
          onClick={() => setOpen(true)}
          title="Company 360° Intelligence"
        >
          <Building2 className="h-3.5 w-3.5 text-primary" />
          <span>Intelligence</span>
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Building2 className="h-6 w-6 text-primary" />
              Company 360° Intelligence — {fullCompany?.name || "Company Profile"}
            </DialogTitle>
            <DialogDescription>
              Authoritative view of company profile, tech stack, job openings, applicant pipeline,
              and AI hiring roadmap.
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="py-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Loading 360° company intelligence…</span>
            </div>
          ) : (
            <div className="space-y-6 pt-2">
              {/* Top Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border bg-muted/30">
                  <div className="text-[11px] text-muted-foreground">Hiring Readiness</div>
                  <div className="text-xl font-bold mt-0.5 text-foreground flex items-baseline gap-1">
                    <span>{readinessScore}</span>
                    <span className="text-xs text-muted-foreground font-normal">/100</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border bg-muted/30">
                  <div className="text-[11px] text-muted-foreground">Profile Completeness</div>
                  <div className="text-xl font-bold mt-0.5 text-primary">
                    {profileCompleteness}%
                  </div>
                </div>

                <div className="p-3 rounded-xl border bg-muted/30">
                  <div className="text-[11px] text-muted-foreground">Active Openings</div>
                  <div className="text-xl font-bold mt-0.5 text-foreground">
                    {jobStats.active_jobs ?? jobs.filter((j) => j.status === "active").length}
                  </div>
                </div>

                <div className="p-3 rounded-xl border bg-muted/30">
                  <div className="text-[11px] text-muted-foreground">Total Applicants</div>
                  <div className="text-xl font-bold mt-0.5 text-foreground">
                    {jobStats.total_applicants ?? 0}
                  </div>
                </div>
              </div>

              {/* Sub-tabs */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid grid-cols-5 w-full">
                  <TabsTrigger value="overview" className="text-xs">
                    <Building2 className="h-3.5 w-3.5 mr-1 text-primary" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="tech" className="text-xs">
                    <Code2 className="h-3.5 w-3.5 mr-1 text-blue-500" />
                    Tech & Roles
                  </TabsTrigger>
                  <TabsTrigger value="jobs" className="text-xs">
                    <Briefcase className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                    Jobs ({jobs.length})
                  </TabsTrigger>
                  <TabsTrigger value="strategy" className="text-xs">
                    <Rocket className="h-3.5 w-3.5 mr-1 text-purple-500" />
                    AI Strategy
                  </TabsTrigger>
                  <TabsTrigger value="timeline" className="text-xs">
                    <History className="h-3.5 w-3.5 mr-1" />
                    Timeline ({activities.length})
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Overview & Background */}
                <TabsContent value="overview" className="pt-3 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border bg-muted/20 space-y-2 text-xs">
                      <h4 className="font-semibold text-foreground uppercase tracking-wider">
                        Company Details
                      </h4>
                      <div>
                        <strong className="text-foreground">Industry:</strong>{" "}
                        {fullCompany?.industry || "—"}
                      </div>
                      <div>
                        <strong className="text-foreground">Headquarters:</strong>{" "}
                        {fullCompany?.headquarters || fullCompany?.location || "Kathmandu, Nepal"}
                      </div>
                      <div>
                        <strong className="text-foreground">Size:</strong>{" "}
                        {fullCompany?.size || "—"}
                      </div>
                      <div>
                        <strong className="text-foreground">Website:</strong>{" "}
                        {fullCompany?.website || "—"}
                      </div>
                      <div>
                        <strong className="text-foreground">Work Model:</strong>{" "}
                        {fullCompany?.work_model || "Hybrid"}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border bg-muted/20 space-y-2 text-xs">
                      <h4 className="font-semibold text-foreground uppercase tracking-wider">
                        Culture & Mission
                      </h4>
                      {fullCompany?.mission && (
                        <div>
                          <strong className="text-foreground">Mission:</strong>{" "}
                          {fullCompany.mission}
                        </div>
                      )}
                      {fullCompany?.vision && (
                        <div>
                          <strong className="text-foreground">Vision:</strong> {fullCompany.vision}
                        </div>
                      )}
                      {fullCompany?.description && (
                        <div className="pt-1 text-muted-foreground border-t">
                          {fullCompany.description}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Tab 2: Tech & Roles */}
                <TabsContent value="tech" className="pt-3 space-y-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider mb-2">
                        Technologies Stack ({technologies.length})
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {technologies.map((t: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {benefits.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider mb-2">
                          Benefits & Perks ({benefits.length})
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {benefits.map((b: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {b}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Tab 3: Jobs & Pipeline */}
                <TabsContent value="jobs" className="pt-3 space-y-3">
                  {!jobs.length ? (
                    <div className="p-8 text-center text-sm text-muted-foreground border rounded-xl">
                      No job postings recorded for this company.
                    </div>
                  ) : (
                    <div className="divide-y border rounded-xl">
                      {jobs.map((j: any) => (
                        <div
                          key={j.id}
                          className="p-3.5 flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="font-bold text-foreground text-sm">{j.title}</div>
                            <div className="text-muted-foreground mt-0.5">
                              Status:{" "}
                              <span className="uppercase font-medium text-foreground">
                                {j.status}
                              </span>{" "}
                              · {j.applications_count || 0} applicants
                            </div>
                            {j.required_skills?.length > 0 && (
                              <div className="flex gap-1 mt-1.5 flex-wrap">
                                {j.required_skills.slice(0, 5).map((sk: string, i: number) => (
                                  <Badge key={i} variant="secondary" className="text-[10px]">
                                    {sk}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <Badge
                            variant={j.status === "active" ? "default" : "outline"}
                            className="text-[10px] uppercase"
                          >
                            {j.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Tab 4: AI Strategy */}
                <TabsContent value="strategy" className="pt-3 space-y-4">
                  {roadmap?.hiring_velocity_assessment && (
                    <div className="p-3 rounded-lg border bg-primary/5 text-xs text-muted-foreground leading-relaxed">
                      <strong className="text-foreground block mb-1">Velocity Assessment:</strong>
                      {roadmap.hiring_velocity_assessment}
                    </div>
                  )}

                  {recommendations?.candidate_screening_criteria?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider mb-2">
                        AI Screening Rubric
                      </h4>
                      <div className="space-y-2">
                        {recommendations.candidate_screening_criteria.map((sc: any, i: number) => (
                          <div
                            key={i}
                            className="p-3 rounded-lg border bg-muted/20 text-xs space-y-1"
                          >
                            <div className="font-bold text-foreground">{sc.category}</div>
                            <div className="text-emerald-600">Must Have: {sc.must_have}</div>
                            {sc.good_to_have && (
                              <div className="text-muted-foreground">
                                Good to Have: {sc.good_to_have}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {roadmap?.compensation_benchmarks_npr?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider mb-2">
                        Salary Benchmarks (NPR)
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {roadmap.compensation_benchmarks_npr.map((cb: any, i: number) => (
                          <div key={i} className="p-2.5 rounded-lg border bg-muted/20 text-xs">
                            <span className="font-bold text-foreground">{cb.role}:</span>{" "}
                            <span className="text-primary font-semibold">
                              {cb.min_salary} - {cb.max_salary}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Tab 5: Timeline & Activity */}
                <TabsContent value="timeline" className="pt-3">
                  {!activities.length && !snapshots.length ? (
                    <div className="p-8 text-center text-sm text-muted-foreground border rounded-xl">
                      No employer activity logs recorded.
                    </div>
                  ) : (
                    <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                      {activities.map((act) => (
                        <div key={act.id} className="relative text-xs">
                          <div className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                          <div className="rounded-xl border p-3 bg-muted/20 space-y-1">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="font-semibold text-foreground uppercase">
                                {act.activity_type.replace(/_/g, " ")}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {new Date(act.created_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
