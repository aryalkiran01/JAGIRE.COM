/* eslint-disable @typescript-eslint/no-explicit-any */
// app/routes/_authenticated/employer/jobs/$jobId.tsx
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ScheduleInterviewDialog } from "@/components/schedule-interview-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin,
  Users,
  Loader as Loader2,
  Check,
  X,
  Star,
  FileText,
  Eye,
  Download,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  Code,
} from "lucide-react";
import { toast } from "sonner";
import { updateApplicationStatus } from "@/lib/application-status.server";

export const Route = createFileRoute("/_authenticated/employer/jobs/$jobId")({
  component: JobDetail,
});

interface Application {
  id: string;
  status: string;
  created_at: string;
  applicant_id: string | null;
  rejection_remark: string | null;
  cover_letter: string | null;
  resume_id: string | null;
  profile: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    headline?: string;
    location?: string;
    phone?: string;
    skills?: any;
    experience?: any;
    education?: any;
  } | null;
  resume: {
    id: string;
    file_name: string;
    file_url: string;
    file_path: string;
    file_type: string;
    mime_type: string;
    ats_score: number;
    overall_score: number;
    parsed_data: any;
  } | null;
}

interface Job {
  id: string;
  title: string;
  job_type: string;
  location: string | null;
  is_remote: boolean | null;
  description: string;
  status: string;
}

const STATUS_BADGE: Record<string, string> = {
  applied: "bg-gray-100 text-gray-700",
  viewed: "bg-blue-100 text-blue-700",
  shortlisted: "bg-amber-100 text-amber-700",
  selected: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  interview: "bg-purple-100 text-purple-700",
  offer: "bg-green-100 text-green-700",
};

function JobDetail() {
  const { jobId } = useParams({ from: "/_authenticated/employer/jobs/$jobId" });
  const { user } = useAuth();
  const qc = useQueryClient();
  const updateStatusFn = useServerFn(updateApplicationStatus);
  const [rejectTarget, setRejectTarget] = useState<Application | null>(null);
  const [rejectRemark, setRejectRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [viewingApplicant, setViewingApplicant] = useState<Application | null>(null);
  const [viewingResume, setViewingResume] = useState<Application | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [loadingResume, setLoadingResume] = useState(false);
  const [activeTab, setActiveTab] = useState("resume");

  const currentApplicant = viewingResume ?? viewingApplicant ?? null;
  const applicantProfile = currentApplicant?.profile ?? null;
  const applicantEducation = Array.isArray(applicantProfile?.education)
    ? applicantProfile.education
    : [];

  const { data: job, isLoading: jobLoading } = useQuery<Job | null>({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const { data } = await supabase
        .from("jobs")
        .select("id, title, job_type, location, is_remote, description, status")
        .eq("id", jobId)
        .single();
      return data as Job | null;
    },
  });

  const { data: applications, isLoading: appsLoading } = useQuery<Application[]>({
    queryKey: ["job-applications", jobId],
    queryFn: async () => {
      const { data: appsData, error: appsError } = await supabase
        .from("applications")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false });

      if (appsError) throw appsError;

      const enrichedApps = await Promise.all(
        (appsData ?? []).map(async (app: any) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select(
              "id, full_name, email, avatar_url, headline, location, phone, skills, experience, education",
            )
            .eq("id", app.applicant_id)
            .single();

          let resumeData = null;
          if (app.resume_id) {
            const { data: resume } = await supabase
              .from("resumes")
              .select(
                "id, file_name, file_url, file_path, file_type, mime_type, ats_score, overall_score, parsed_data",
              )
              .eq("id", app.resume_id)
              .single();
            resumeData = resume;
          }

          return {
            ...app,
            profile: profileData || null,
            resume: resumeData || null,
          };
        }),
      );

      return enrichedApps as Application[];
    },
  });

  const isLoading = jobLoading || appsLoading;

  async function doAction(
    app: Application,
    status: "shortlisted" | "selected" | "offer",
    label: string,
  ) {
    try {
      setSubmitting(true);
      await updateStatusFn({ data: { applicationId: app.id, status } });
      toast.success(label);
      qc.invalidateQueries({ queryKey: ["job-applications", jobId] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmReject() {
    if (!rejectTarget) return;
    if (rejectRemark.trim().length < 3) {
      toast.error("Please provide a remark (minimum 3 characters)");
      return;
    }
    try {
      setSubmitting(true);
      await updateStatusFn({
        data: { applicationId: rejectTarget.id, status: "rejected", remark: rejectRemark.trim() },
      });
      toast.success("Application rejected");
      qc.invalidateQueries({ queryKey: ["job-applications", jobId] });
      setRejectTarget(null);
      setRejectRemark("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Rejection failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function getResumeUrl(resume: Application["resume"]): Promise<string | null> {
    if (!resume) return null;

    if (resume.file_url) return resume.file_url;

    if (resume.file_path) {
      try {
        const { data: publicUrl } = supabase.storage.from("resumes").getPublicUrl(resume.file_path);
        if (publicUrl?.publicUrl) return publicUrl.publicUrl;
      } catch (e) {
        console.log("Public URL failed");
      }

      try {
        const { data, error } = await supabase.storage
          .from("resumes")
          .createSignedUrl(resume.file_path, 60 * 10);
        if (!error && data?.signedUrl) return data.signedUrl;
      } catch (e) {
        console.error("Signed URL failed:", e);
      }
    }

    return null;
  }

  async function openResume(app: Application) {
    if (!app.resume) {
      toast.error("No resume uploaded");
      return;
    }

    setLoadingResume(true);
    setActiveTab("resume");
    try {
      const url = await getResumeUrl(app.resume);
      if (!url) {
        toast.error("Resume file not found");
        return;
      }
      setResumeUrl(url);
      setViewingResume(app);
    } catch (error) {
      console.error("Error getting resume URL:", error);
      toast.error("Failed to load resume");
    } finally {
      setLoadingResume(false);
    }
  }

  async function downloadResume(app: Application) {
    if (!app.resume) {
      toast.error("No resume uploaded");
      return;
    }

    try {
      const url = await getResumeUrl(app.resume);
      if (!url) {
        toast.error("Resume file not found");
        return;
      }
      window.open(url, "_blank");
    } catch (error) {
      console.error("Error downloading resume:", error);
      toast.error("Failed to download resume");
    }
  }

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold mb-2">Job not found</h2>
        <p className="text-muted-foreground">This job may have been removed.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      {/* Job Header */}
      <Card>
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="secondary" className="capitalize">
              {job.job_type.replace("_", " ")}
            </Badge>
            {job.is_remote && <Badge variant="outline">Remote</Badge>}
            {job.location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" /> {job.location}
              </div>
            )}
          </div>
          <p className="mt-4 text-sm whitespace-pre-wrap">{job.description}</p>
        </CardContent>
      </Card>

      {/* Applicants List */}
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" /> Applicants ({applications?.length ?? 0})
        </h2>
        {(!applications || applications.length === 0) && (
          <p className="text-muted-foreground text-sm mt-2">No applications yet.</p>
        )}
        <div className="space-y-3 mt-3">
          {applications?.map((app) => (
            <Card key={app.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarImage src={app.profile?.avatar_url ?? undefined} />
                      <AvatarFallback className="gradient-brand text-primary-foreground text-sm">
                        {getInitials(app.profile?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{app.profile?.full_name ?? "Unknown"}</span>
                        <Badge
                          className={`${STATUS_BADGE[app.status] ?? "bg-gray-100 text-gray-700"}`}
                        >
                          {app.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {app.profile?.email ?? "No email"} · Applied{" "}
                        {new Date(app.created_at).toLocaleDateString()}
                      </div>
                      {app.profile?.headline && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {app.profile.headline}
                        </div>
                      )}

                      {/* Resume Info */}
                      {app.resume && (
                        <div className="flex items-center gap-2 mt-2 text-xs">
                          <FileText className="h-3.5 w-3.5 text-blue-500" />
                          <span className="font-medium">{app.resume.file_name || "Resume"}</span>
                          {app.resume.overall_score != null && (
                            <Badge variant="outline" className="text-green-600">
                              Score: {app.resume.overall_score}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t space-y-2">
                  {/* Primary actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => {
                        setViewingApplicant(app);
                        setActiveTab("profile");
                      }}
                    >
                      <Eye className="h-3.5 w-3.5" /> Profile
                    </Button>

                    {app.resume && (
                      <>
                        <Button
                          size="sm"
                          className="gap-1.5 gradient-brand text-primary-foreground"
                          onClick={() => openResume(app)}
                          disabled={loadingResume}
                        >
                          {loadingResume ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <FileText className="h-3.5 w-3.5" />
                          )}
                          View Resume
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => downloadResume(app)}
                        >
                          <Download className="h-3.5 w-3.5" /> Download
                        </Button>
                      </>
                    )}

                    {app.cover_letter && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => {
                          setViewingApplicant(app);
                          setActiveTab("cover");
                        }}
                      >
                        <Mail className="h-3.5 w-3.5" /> Cover Letter
                      </Button>
                    )}
                  </div>

                  {/* Secondary actions */}
                  {app.status !== "rejected" && app.status !== "selected" && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={submitting}
                        onClick={() => doAction(app, "shortlisted", "Applicant shortlisted")}
                      >
                        <Star className="h-3.5 w-3.5 mr-1" /> Shortlist
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={submitting}
                        onClick={() => doAction(app, "selected", "Applicant approved")}
                      >
                        <Check className="h-3.5 w-3.5 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={submitting}
                        onClick={() => doAction(app, "offer", "Offer sent")}
                      >
                        <FileText className="h-3.5 w-3.5 mr-1" /> Offer
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive/30 hover:bg-destructive/10"
                        disabled={submitting}
                        onClick={() => {
                          setRejectTarget(app);
                          setRejectRemark("");
                        }}
                      >
                        <X className="h-3.5 w-3.5 mr-1" /> Reject
                      </Button>
                      <ScheduleInterviewDialog
                        applicationId={app.id}
                        candidateName={app.profile?.full_name ?? undefined}
                        candidateEmail={app.profile?.email ?? ""}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Combined Applicant + Resume Viewer Dialog */}
      <Dialog
        open={!!viewingResume || !!viewingApplicant}
        onOpenChange={(o) => {
          if (!o) {
            setViewingResume(null);
            setViewingApplicant(null);
            setResumeUrl(null);
          }
        }}
      >
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={(viewingResume || viewingApplicant)?.profile?.avatar_url ?? undefined}
                  />
                  <AvatarFallback className="gradient-brand text-primary-foreground">
                    {getInitials((viewingResume || viewingApplicant)?.profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <span className="font-semibold">
                    {(viewingResume || viewingApplicant)?.profile?.full_name ?? "Applicant"}
                  </span>
                  <span className="text-xs text-muted-foreground block">
                    {(viewingResume || viewingApplicant)?.profile?.headline}
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const app = viewingResume || viewingApplicant;
                  if (app) downloadResume(app);
                }}
              >
                <Download className="h-3.5 w-3.5 mr-1" /> Download
              </Button>
            </DialogTitle>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 min-h-0 flex flex-col"
          >
            <TabsList className="flex-shrink-0">
              <TabsTrigger value="resume">Resume</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              {(viewingResume || viewingApplicant)?.cover_letter && (
                <TabsTrigger value="cover">Cover Letter</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="resume" className="flex-1 min-h-0 mt-2">
              {resumeUrl ? (
                <iframe
                  src={resumeUrl}
                  className="w-full h-full rounded-lg"
                  title="Resume Preview"
                  style={{ border: "none", minHeight: "500px" }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              )}
            </TabsContent>

            <TabsContent value="profile" className="flex-1 min-h-0 mt-2 overflow-y-auto">
              {applicantProfile && (
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{applicantProfile.email}</span>
                    </div>
                    {applicantProfile.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{applicantProfile.phone}</span>
                      </div>
                    )}
                  </div>

                  {applicantProfile.skills && (
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        <Code className="h-4 w-4" /> Skills
                      </h4>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(Array.isArray(applicantProfile.skills)
                          ? applicantProfile.skills
                          : []
                        ).map((skill: any, i: number) => (
                          <Badge key={i} variant="secondary">
                            {typeof skill === "string" ? skill : skill?.name || skill?.title}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {applicantProfile.experience && (
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        <Briefcase className="h-4 w-4" /> Experience
                      </h4>
                      <div className="mt-2 space-y-3">
                        {(Array.isArray(applicantProfile.experience)
                          ? applicantProfile.experience
                          : []
                        ).map((exp: any, i: number) => (
                          <div key={i} className="text-sm border-l-2 border-muted pl-3">
                            <div className="font-medium">{exp.title || exp.role}</div>
                            <div className="text-muted-foreground">{exp.company}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {applicantEducation.length > 0 && (
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" /> Education
                      </h4>
                      <div className="mt-2 space-y-2">
                        {applicantEducation.map((edu: any, i: number) => (
                          <div key={i} className="text-sm border-l-2 border-muted pl-3">
                            <div className="font-medium">{edu.degree || edu.field}</div>
                            <div className="text-muted-foreground">{edu.institution}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="cover" className="flex-1 min-h-0 mt-2 overflow-y-auto">
              {(viewingResume || viewingApplicant)?.cover_letter && (
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {(viewingResume || viewingApplicant)?.cover_letter}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Rejection dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject application</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Provide feedback for {rejectTarget?.profile?.full_name ?? "this applicant"}.
            </p>
            <Textarea
              rows={4}
              placeholder="e.g. We're looking for someone with more experience..."
              value={rejectRemark}
              onChange={(e) => setRejectRemark(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={submitting || rejectRemark.trim().length < 3}
              onClick={confirmReject}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reject application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
