/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import {
  Building2,
  Globe,
  MapPin,
  BriefcaseBusiness,
  Users,
  Image as ImageIcon,
  FileText,
  Sparkles,
  Save,
  ArrowLeft,
  CheckCircle2,
  Plus,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/employer/company")({
  component: CompanyForm,
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const emptyForm = {
  name: "",
  tagline: "",
  description: "",
  website: "",
  industry: "",
  size: "",
  headquarters: "",
  logo_url: "",
};

function CompanyForm() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);
  const [deleteJobCount, setDeleteJobCount] = useState(0);

  // Fetch all companies owned by the user
  const { data: companies, isLoading: companiesLoading } = useQuery({
    queryKey: ["my-companies", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Get the selected company
  const selectedCompany = companies?.find((c) => c.id === selectedCompanyId);

  const [form, setForm] = useState<any>(emptyForm);

  useEffect(() => {
    if (selectedCompany) {
      setForm({
        name: selectedCompany.name ?? "",
        tagline: selectedCompany.tagline ?? "",
        description: selectedCompany.description ?? "",
        website: selectedCompany.website ?? "",
        industry: selectedCompany.industry ?? "",
        size: selectedCompany.size ?? "",
        headquarters: selectedCompany.headquarters ?? "",
        logo_url: selectedCompany.logo_url ?? "",
      });
    } else if (companies && companies.length === 0) {
      // No companies yet, start with empty form
      setForm(emptyForm);
    }
  }, [selectedCompany, companies]);

  // Set initial selected company when companies load
  useEffect(() => {
    if (companies && companies.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(companies[0].id);
    }
  }, [companies, selectedCompanyId]);

  const updateField = (field: string, value: string) => {
    setForm((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setSelectedCompanyId(null);
  };

  const upsert = useMutation({
    mutationFn: async () => {
      const roleRes = await supabase.from("user_roles").insert({
        user_id: user!.id,
        role: "employer",
      });

      if (roleRes.error && roleRes.error.code !== "23505") {
        throw roleRes.error;
      }

      const editable = {
        name: form.name.trim(),
        tagline: form.tagline.trim() || null,
        description: form.description.trim() || null,
        website: form.website.trim() || null,
        industry: form.industry.trim() || null,
        size: form.size.trim() || null,
        headquarters: form.headquarters.trim() || null,
        logo_url: form.logo_url.trim() || null,
      };

      if (selectedCompany) {
        // Update existing company
        const nextSlug = slugify(form.name) || selectedCompany.slug;

        const { error } = await supabase
          .from("companies")
          .update({
            ...editable,
            slug: nextSlug,
          })
          .eq("id", selectedCompany.id);

        if (error) throw error;
      } else {
        // Create new company
        const { data: inserted, error } = await supabase
          .from("companies")
          .insert({
            ...editable,
            owner_id: user!.id,
            slug: slugify(form.name) || `co-${Date.now()}`,
          })
          .select("id")
          .single();

        if (error) throw error;

        console.log("Company created with ID:", inserted.id);
        setSelectedCompanyId(inserted.id);
      }
    },

    onSuccess: async () => {
      toast.success(selectedCompany ? "Company profile updated" : "Company created successfully");

      await qc.invalidateQueries({ queryKey: ["my-companies", user?.id] });
    },

    onError: (e: any) => {
      toast.error(e.message);
    },
  });

  // Check job count before showing delete dialog
  const handleDeleteClick = async (companyId: string) => {
    try {
      // Get count of jobs for this company
      const { count, error } = await supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId);

      if (error) throw error;

      setDeleteJobCount(count || 0);
      setCompanyToDelete(companyId);
      setShowDeleteDialog(true);
    } catch (error: any) {
      toast.error("Failed to check company jobs: " + error.message);
    }
  };

  const deleteCompany = useMutation({
    mutationFn: async (companyId: string) => {
      // 1. First, get all job IDs for this company
      const { data: jobs, error: jobsError } = await supabase
        .from("jobs")
        .select("id")
        .eq("company_id", companyId);

      if (jobsError) throw jobsError;

      const jobIds = jobs?.map((job) => job.id) || [];

      // 2. Delete related data for each job
      for (const jobId of jobIds) {
        // Delete applications and their related data
        const { data: applications, error: appFetchError } = await supabase
          .from("applications")
          .select("id")
          .eq("job_id", jobId);

        if (!appFetchError && applications) {
          for (const app of applications) {
            // Delete application events
            const { error: appEventsError } = await supabase
              .from("application_events")
              .delete()
              .eq("application_id", app.id);

            if (appEventsError) {
              console.error(`Failed to delete events for application ${app.id}:`, appEventsError);
            }

            // Delete interviews related to this application
            const { error: interviewsError } = await supabase
              .from("interviews")
              .delete()
              .eq("application_id", app.id);

            if (interviewsError) {
              console.error(
                `Failed to delete interviews for application ${app.id}:`,
                interviewsError,
              );
            }
          }

          // Delete all applications for this job
          const { error: applicationsError } = await supabase
            .from("applications")
            .delete()
            .eq("job_id", jobId);

          if (applicationsError) {
            console.error(`Failed to delete applications for job ${jobId}:`, applicationsError);
          }
        }

        // Delete saved jobs
        const { error: savedJobsError } = await supabase
          .from("saved_jobs")
          .delete()
          .eq("job_id", jobId);

        if (savedJobsError) {
          console.error(`Failed to delete saved jobs for job ${jobId}:`, savedJobsError);
        }

        // Delete job matches
        const { error: jobMatchesError } = await supabase
          .from("job_matches")
          .delete()
          .eq("job_id", jobId);

        if (jobMatchesError) {
          console.error(`Failed to delete job matches for job ${jobId}:`, jobMatchesError);
        }

        // Delete the job itself
        const { error: jobDeleteError } = await supabase.from("jobs").delete().eq("id", jobId);

        if (jobDeleteError) {
          console.error(`Failed to delete job ${jobId}:`, jobDeleteError);
          throw jobDeleteError;
        }
      }

      // 3. Delete company-related data - explicit calls for each table
      const { error: companyReviewsError } = await supabase
        .from("company_reviews")
        .delete()
        .eq("company_id", companyId);

      if (companyReviewsError) {
        console.error("Failed to delete company reviews:", companyReviewsError);
      }

      const { error: departmentsError } = await supabase
        .from("departments")
        .delete()
        .eq("company_id", companyId);

      if (departmentsError) {
        console.error("Failed to delete departments:", departmentsError);
      }

      const { error: followsError } = await supabase
        .from("follows")
        .delete()
        .eq("company_id", companyId);

      if (followsError) {
        console.error("Failed to delete follows:", followsError);
      }

      const { error: knowledgeChunksError } = await supabase
        .from("knowledge_chunks")
        .delete()
        .eq("company_id", companyId);

      if (knowledgeChunksError) {
        console.error("Failed to delete knowledge chunks:", knowledgeChunksError);
      }

      const { error: knowledgeDocumentsError } = await supabase
        .from("knowledge_documents")
        .delete()
        .eq("company_id", companyId);

      if (knowledgeDocumentsError) {
        console.error("Failed to delete knowledge documents:", knowledgeDocumentsError);
      }

      const { error: reviewsError } = await supabase
        .from("reviews")
        .delete()
        .eq("company_id", companyId);

      if (reviewsError) {
        console.error("Failed to delete reviews:", reviewsError);
      }

      const { error: apiKeysError } = await supabase
        .from("api_keys")
        .delete()
        .eq("company_id", companyId);

      if (apiKeysError) {
        console.error("Failed to delete API keys:", apiKeysError);
      }

      const { error: auditLogsError } = await supabase
        .from("audit_logs")
        .delete()
        .eq("company_id", companyId);

      if (auditLogsError) {
        console.error("Failed to delete audit logs:", auditLogsError);
      }

      // 4. Finally, delete the company
      const { error: companyDeleteError } = await supabase
        .from("companies")
        .delete()
        .eq("id", companyId);

      if (companyDeleteError) {
        console.error("Failed to delete company:", companyDeleteError);
        throw companyDeleteError;
      }

      return jobIds.length;
    },
    onSuccess: async (deletedJobsCount) => {
      toast.success(
        `Company deleted successfully${deletedJobsCount > 0 ? ` along with ${deletedJobsCount} job posting(s)` : ""}`,
      );
      setShowDeleteDialog(false);
      setCompanyToDelete(null);
      setDeleteJobCount(0);

      // Reset form if the deleted company was selected
      if (selectedCompanyId === companyToDelete) {
        resetForm();
      }

      await qc.invalidateQueries({ queryKey: ["my-companies", user?.id] });
    },
    onError: (e: any) => {
      toast.error("Failed to delete company: " + e.message);
      setShowDeleteDialog(false);
      setCompanyToDelete(null);
      setDeleteJobCount(0);
    },
  });

  const initials =
    form.name
      ?.trim()
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word: string) => word[0])
      .join("")
      .toUpperCase() || "CO";

  const descriptionLength = form.description?.length ?? 0;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto max-w-5xl px-4 py-6">
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
            <a
              href="/employer"
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Employer dashboard
            </a>
            <span>/</span>
            <span className="text-foreground">Company profile</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>

                <span className="text-sm font-medium text-primary">Company setup</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                {selectedCompany ? "Edit company" : "Create company profile"}
              </h1>

              <p className="mt-2 max-w-2xl text-muted-foreground">
                Manage your company profiles and tell candidates who you are.
              </p>
            </div>

            {companies && companies.length > 0 && (
              <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                {companies.length} {companies.length === 1 ? "company" : "companies"} created
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="container mx-auto max-w-5xl px-4 py-8">
        {/* Company selector */}
        {companies && companies.length > 0 && (
          <Card className="mb-6 border-border/60 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <Label className="text-sm font-medium shrink-0">Select company:</Label>

                <Select
                  value={selectedCompanyId || ""}
                  onValueChange={(value) => {
                    if (value === "new") {
                      resetForm();
                    } else {
                      setSelectedCompanyId(value);
                    }
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[300px]">
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="new">
                      <span className="flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Create new company
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {selectedCompany && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteClick(selectedCompany.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Form */}
          <div className="space-y-6">
            {/* Basic information */}
            <Card className="overflow-hidden border-border/60 shadow-sm">
              <div className="border-b bg-background px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Building2 className="h-4 w-4" />
                  </div>

                  <div>
                    <h2 className="font-semibold">Basic information</h2>
                    <p className="text-sm text-muted-foreground">
                      The essentials candidates see first.
                    </p>
                  </div>
                </div>
              </div>

              <CardContent className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="company-name">
                    Company name <span className="text-destructive">*</span>
                  </Label>

                  <Input
                    id="company-name"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="e.g. JAGIRE Technologies"
                    className="h-11"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>

                  <Input
                    id="tagline"
                    value={form.tagline}
                    onChange={(e) => updateField("tagline", e.target.value)}
                    placeholder="A short statement that describes your company"
                    className="h-11"
                  />

                  <p className="text-xs text-muted-foreground">Keep it short and memorable.</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description">Company description</Label>

                    <span className="text-xs text-muted-foreground">{descriptionLength}/1000</span>
                  </div>

                  <Textarea
                    id="description"
                    rows={6}
                    maxLength={1000}
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Describe your company, products, culture, mission, and what makes your workplace unique..."
                    className="resize-none"
                  />

                  <p className="text-xs text-muted-foreground">
                    A strong description helps candidates understand your company before applying.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Company details */}
            <Card className="overflow-hidden border-border/60 shadow-sm">
              <div className="border-b bg-background px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <BriefcaseBusiness className="h-4 w-4" />
                  </div>

                  <div>
                    <h2 className="font-semibold">Company details</h2>
                    <p className="text-sm text-muted-foreground">
                      Help candidates understand your organization.
                    </p>
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>

                    <div className="relative">
                      <BriefcaseBusiness className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                      <Input
                        id="industry"
                        value={form.industry}
                        onChange={(e) => updateField("industry", e.target.value)}
                        placeholder="e.g. Information Technology"
                        className="h-11 pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="size">Company size</Label>

                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                      <Input
                        id="size"
                        value={form.size}
                        onChange={(e) => updateField("size", e.target.value)}
                        placeholder="e.g. 11-50"
                        className="h-11 pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="headquarters">Headquarters</Label>

                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                      <Input
                        id="headquarters"
                        value={form.headquarters}
                        onChange={(e) => updateField("headquarters", e.target.value)}
                        placeholder="e.g. Kathmandu, Nepal"
                        className="h-11 pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="website">Company website</Label>

                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                      <Input
                        id="website"
                        value={form.website}
                        onChange={(e) => updateField("website", e.target.value)}
                        placeholder="https://yourcompany.com"
                        className="h-11 pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Branding */}
            <Card className="overflow-hidden border-border/60 shadow-sm">
              <div className="border-b bg-background px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ImageIcon className="h-4 w-4" />
                  </div>

                  <div>
                    <h2 className="font-semibold">Branding</h2>
                    <p className="text-sm text-muted-foreground">
                      Add your company logo to build trust.
                    </p>
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-5">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-muted/40">
                    {form.logo_url ? (
                      <img
                        src={form.logo_url}
                        alt={`${form.name || "Company"} logo`}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="text-2xl font-bold text-muted-foreground">{initials}</span>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <Label htmlFor="logo-url">Logo URL</Label>

                    <div className="relative">
                      <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                      <Input
                        id="logo-url"
                        value={form.logo_url}
                        onChange={(e) => updateField("logo_url", e.target.value)}
                        placeholder="https://example.com/logo.png"
                        className="h-11 pl-10"
                      />
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Use a publicly accessible image URL. Square images work best.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save */}
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                      <Save className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="font-medium">
                        {selectedCompany
                          ? "Ready to update this company?"
                          : "Ready to create a new company?"}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        Your changes will be saved to this company profile.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    {selectedCompany && (
                      <Button variant="outline" onClick={resetForm} className="h-11">
                        <Plus className="mr-2 h-4 w-4" />
                        New company
                      </Button>
                    )}

                    <Button
                      onClick={() => upsert.mutate()}
                      disabled={!form.name.trim() || upsert.isPending}
                      className="h-11 min-w-[150px] gradient-brand text-primary-foreground"
                    >
                      {upsert.isPending ? (
                        <>
                          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          {selectedCompany ? "Save changes" : "Create company"}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview / Tips */}
          <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            {/* Preview */}
            <Card className="overflow-hidden border-border/60 shadow-sm">
              <div className="border-b bg-background px-5 py-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">Profile preview</h3>
                </div>
              </div>

              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted/40">
                    {form.logo_url ? (
                      <img src={form.logo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-bold text-muted-foreground">{initials}</span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-semibold truncate">{form.name || "Your company name"}</h4>

                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {form.tagline || "Your company tagline"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3 border-t pt-4">
                  {form.industry && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BriefcaseBusiness className="h-4 w-4" />
                      <span>{form.industry}</span>
                    </div>
                  )}

                  {form.headquarters && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{form.headquarters}</span>
                    </div>
                  )}

                  {form.size && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{form.size} employees</span>
                    </div>
                  )}

                  {form.website && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      <span className="truncate">{form.website}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-4 w-4" />
                  </div>

                  <div>
                    <h3 className="font-semibold">Make your profile stronger</h3>

                    <ul className="mt-3 space-y-3 text-sm text-muted-foreground">
                      <li className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        Use a clear company name and tagline.
                      </li>

                      <li className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        Explain your mission and what your team builds.
                      </li>

                      <li className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        Add your location, industry, size, and website.
                      </li>

                      <li className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        Upload a recognizable company logo.
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete company
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3">
                <p>
                  Are you sure you want to delete{" "}
                  <span className="font-medium text-foreground">
                    {companyToDelete && companies?.find((c) => c.id === companyToDelete)?.name}
                  </span>
                  ?
                </p>

                {deleteJobCount > 0 ? (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                    <p className="font-medium text-destructive">
                      This company has {deleteJobCount} job posting{deleteJobCount !== 1 ? "s" : ""}
                      .
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Deleting this company will also permanently delete all associated jobs,
                      applications, and related data. This action cannot be undone.
                    </p>
                  </div>
                ) : (
                  <p>This action cannot be undone.</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setCompanyToDelete(null);
                setDeleteJobCount(0);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (companyToDelete) {
                  deleteCompany.mutate(companyToDelete);
                }
              }}
              disabled={deleteCompany.isPending}
            >
              {deleteCompany.isPending ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete company
                  {deleteJobCount > 0
                    ? ` and ${deleteJobCount} job${deleteJobCount !== 1 ? "s" : ""}`
                    : ""}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
