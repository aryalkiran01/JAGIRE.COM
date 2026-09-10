/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Mail,
  Award,
  TrendingUp,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { syncCompanyIntelligence } from "@/lib/company-intelligence.server";
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
  banner_url: "",
  founded_year: "",
  work_model: "Hybrid",
  linkedin_url: "",
  twitter_url: "",
  facebook_url: "",
  instagram_url: "",
  hr_contact_name: "",
  hr_contact_email: "",
  mission: "",
  vision: "",
  benefits: "",
  technologies: "",
  locations: "",
};

function CompanyForm() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const syncCI = useServerFn(syncCompanyIntelligence);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);
  const [deleteJobCount, setDeleteJobCount] = useState(0);

  // Fetch all companies owned by the user
  const { data: companies } = useQuery({
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
      // Format array fields as comma-separated strings
      const benStr = Array.isArray(selectedCompany.benefits)
        ? (selectedCompany.benefits as string[]).join(", ")
        : typeof selectedCompany.benefits === "string"
          ? selectedCompany.benefits
          : "";

      const techStr = Array.isArray(selectedCompany.technologies)
        ? (selectedCompany.technologies as string[]).join(", ")
        : typeof selectedCompany.technologies === "string"
          ? selectedCompany.technologies
          : "";

      const locStr = Array.isArray(selectedCompany.locations)
        ? (selectedCompany.locations as string[]).join(", ")
        : typeof selectedCompany.locations === "string"
          ? selectedCompany.locations
          : "";

      setForm({
        name: selectedCompany.name ?? "",
        tagline: selectedCompany.tagline ?? "",
        description: selectedCompany.description ?? "",
        website: selectedCompany.website ?? "",
        industry: selectedCompany.industry ?? "",
        size: selectedCompany.size ?? selectedCompany.company_size ?? "",
        headquarters: selectedCompany.headquarters ?? selectedCompany.location ?? "",
        logo_url: selectedCompany.logo_url ?? "",
        banner_url: selectedCompany.banner_url ?? "",
        founded_year: selectedCompany.founded_year ? String(selectedCompany.founded_year) : "",
        work_model: selectedCompany.work_model ?? "Hybrid",
        linkedin_url: selectedCompany.linkedin_url ?? "",
        twitter_url: selectedCompany.twitter_url ?? "",
        facebook_url: selectedCompany.facebook_url ?? "",
        instagram_url: selectedCompany.instagram_url ?? "",
        hr_contact_name: selectedCompany.hr_contact_name ?? "",
        hr_contact_email: selectedCompany.hr_contact_email ?? "",
        mission: selectedCompany.mission ?? "",
        vision: selectedCompany.vision ?? "",
        benefits: benStr,
        technologies: techStr,
        locations: locStr,
      });
    } else if (companies && companies.length === 0) {
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
      if (!user) {
        throw new Error("You must be signed in");
      }

      const parsedBenefits = form.benefits
        ? form.benefits
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        : null;

      const parsedTech = form.technologies
        ? form.technologies
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        : null;

      const parsedLocations = form.locations
        ? form.locations
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        : null;

      const editable: any = {
        name: form.name.trim(),
        tagline: form.tagline.trim() || null,
        description: form.description.trim() || null,
        website: form.website.trim() || null,
        industry: form.industry.trim() || null,
        size: form.size.trim() || null,
        company_size: form.size.trim() || null,
        headquarters: form.headquarters.trim() || null,
        location: form.headquarters.trim() || null,
        logo_url: form.logo_url.trim() || null,
        banner_url: form.banner_url.trim() || null,
        founded_year: form.founded_year ? parseInt(form.founded_year, 10) || null : null,
        work_model: form.work_model || "Hybrid",
        linkedin_url: form.linkedin_url.trim() || null,
        twitter_url: form.twitter_url.trim() || null,
        facebook_url: form.facebook_url.trim() || null,
        instagram_url: form.instagram_url.trim() || null,
        hr_contact_name: form.hr_contact_name.trim() || null,
        hr_contact_email: form.hr_contact_email.trim() || null,
        mission: form.mission.trim() || null,
        vision: form.vision.trim() || null,
        benefits: parsedBenefits,
        technologies: parsedTech,
        locations: parsedLocations,
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
            owner_id: user.id,
            slug: slugify(form.name) || `co-${Date.now()}`,
          })
          .select("id")
          .single();

        if (error) throw error;

        setSelectedCompanyId(inserted.id);
      }
    },

    onSuccess: async () => {
      toast.success(selectedCompany ? "Company profile updated" : "Company created successfully");

      await qc.invalidateQueries({
        queryKey: ["my-companies", user?.id],
      });

      const cid = selectedCompany?.id || selectedCompanyId;
      if (cid) {
        try {
          await syncCI({ data: { companyId: cid } });
          await qc.invalidateQueries({ queryKey: ["employer-company-intelligence"] });
        } catch (syncErr) {
          console.warn("Background intelligence sync notice:", syncErr);
        }
      }
    },

    onError: (e: any) => {
      toast.error(e.message || "Failed to save company");
    },
  });

  // Check job count before showing delete dialog
  const handleDeleteClick = async (companyId: string) => {
    try {
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
      const { data: jobs, error: jobsError } = await supabase
        .from("jobs")
        .select("id")
        .eq("company_id", companyId);

      if (jobsError) throw jobsError;

      const jobIds = jobs?.map((job) => job.id) || [];

      for (const jobId of jobIds) {
        const { data: applications } = await supabase
          .from("applications")
          .select("id")
          .eq("job_id", jobId);

        if (applications) {
          for (const app of applications) {
            await supabase.from("application_events").delete().eq("application_id", app.id);
            await supabase.from("interviews").delete().eq("application_id", app.id);
          }
          await supabase.from("applications").delete().eq("job_id", jobId);
        }

        await supabase.from("saved_jobs").delete().eq("job_id", jobId);
        await supabase.from("job_matches").delete().eq("job_id", jobId);
        await supabase.from("jobs").delete().eq("id", jobId);
      }

      await supabase.from("company_reviews").delete().eq("company_id", companyId);
      await supabase.from("departments").delete().eq("company_id", companyId);
      await supabase.from("follows").delete().eq("company_id", companyId);
      await supabase.from("knowledge_chunks").delete().eq("company_id", companyId);
      await supabase.from("knowledge_documents").delete().eq("company_id", companyId);
      await supabase.from("reviews").delete().eq("company_id", companyId);
      await supabase.from("api_keys").delete().eq("company_id", companyId);
      await supabase.from("audit_logs").delete().eq("company_id", companyId);

      const { error: companyDeleteError } = await supabase
        .from("companies")
        .delete()
        .eq("id", companyId);

      if (companyDeleteError) throw companyDeleteError;

      return jobIds.length;
    },
    onSuccess: async (deletedJobsCount) => {
      toast.success(
        `Company deleted successfully${deletedJobsCount > 0 ? ` along with ${deletedJobsCount} job posting(s)` : ""}`,
      );
      setShowDeleteDialog(false);
      setCompanyToDelete(null);
      setDeleteJobCount(0);

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

  const isVerified = Boolean(
    selectedCompany?.is_verified ||
    (selectedCompany as any)?.verified ||
    selectedCompany?.verification_status === "verified",
  );

  return (
    <div className="min-h-screen bg-muted/30 pb-16">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto max-w-5xl px-4 py-6">
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
            <Link
              to="/employer"
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Employer Dashboard
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Company Profile</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-primary">Company Setup & Management</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                {selectedCompany ? "Edit Company Profile" : "Create Company Profile"}
              </h1>

              <p className="mt-1.5 max-w-2xl text-muted-foreground text-sm">
                Manage your public employer brand, company details, workplace perks, and contact
                information.
              </p>
            </div>

            {selectedCompany && (
              <div className="flex items-center gap-2.5 flex-wrap">
                <Button asChild variant="outline" size="sm" className="h-9 gap-1.5 shadow-sm">
                  <Link to="/employer/intelligence" search={{ companyId: selectedCompany.id }}>
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    <span>360° Intelligence</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="h-9 gap-1.5 shadow-sm">
                  <Link to="/companies/$slug" params={{ slug: selectedCompany.slug }}>
                    <span>View Public Profile</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="container mx-auto max-w-5xl px-4 py-8">
        {/* Company selector & verification banner */}
        {companies && companies.length > 0 && (
          <Card className="mb-6 border-border/60 shadow-sm glass">
            <CardContent className="p-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <Label className="text-sm font-medium shrink-0">Select Company:</Label>

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
                  <SelectTrigger className="w-full sm:w-[280px]">
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
              </div>

              {selectedCompany && (
                <div className="flex items-center gap-3">
                  {isVerified ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1 text-xs">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Verified Employer
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Verification: Pending Review
                    </Badge>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive h-8 px-2"
                    onClick={() => handleDeleteClick(selectedCompany.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Delete
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Form Fields */}
          <div className="space-y-6">
            {/* 1. Basic information */}
            <Card className="overflow-hidden border-border/60 shadow-sm glass">
              <div className="border-b bg-card/60 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm sm:text-base">Basic Information</h2>
                    <p className="text-xs text-muted-foreground">
                      The core identity candidates see on job cards and listings.
                    </p>
                  </div>
                </div>
              </div>

              <CardContent className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="company-name" className="text-xs font-semibold">
                    Company Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="company-name"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="e.g. Acme Technologies Nepal"
                    className="h-10 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tagline" className="text-xs font-semibold">
                    Tagline
                  </Label>
                  <Input
                    id="tagline"
                    value={form.tagline}
                    onChange={(e) => updateField("tagline", e.target.value)}
                    placeholder="e.g. Building the future of digital finance in Nepal"
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-xs font-semibold">
                    Company Description
                  </Label>
                  <Textarea
                    id="description"
                    rows={5}
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Describe your company, products, culture, team, and what makes your workplace unique…"
                    className="text-sm leading-relaxed"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 2. Company Details & Logistics */}
            <Card className="overflow-hidden border-border/60 shadow-sm glass">
              <div className="border-b bg-card/60 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <BriefcaseBusiness className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm sm:text-base">
                      Company Details & Location
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Help candidates understand size, headquarters, and work structure.
                    </p>
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="industry" className="text-xs font-semibold">
                      Industry
                    </Label>
                    <Input
                      id="industry"
                      value={form.industry}
                      onChange={(e) => updateField("industry", e.target.value)}
                      placeholder="e.g. Information Technology & Software"
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="size" className="text-xs font-semibold">
                      Company Size
                    </Label>
                    <Input
                      id="size"
                      value={form.size}
                      onChange={(e) => updateField("size", e.target.value)}
                      placeholder="e.g. 50-100"
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="founded_year" className="text-xs font-semibold">
                      Founded Year
                    </Label>
                    <Input
                      id="founded_year"
                      type="number"
                      value={form.founded_year}
                      onChange={(e) => updateField("founded_year", e.target.value)}
                      placeholder="e.g. 2018"
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="work_model" className="text-xs font-semibold">
                      Work Model
                    </Label>
                    <select
                      id="work_model"
                      value={form.work_model}
                      onChange={(e) => updateField("work_model", e.target.value)}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="Hybrid">Hybrid</option>
                      <option value="Remote">Remote</option>
                      <option value="On-site">On-site</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="headquarters" className="text-xs font-semibold">
                      Headquarters
                    </Label>
                    <Input
                      id="headquarters"
                      value={form.headquarters}
                      onChange={(e) => updateField("headquarters", e.target.value)}
                      placeholder="e.g. Kathmandu, Nepal"
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="locations" className="text-xs font-semibold">
                      Additional Branch Locations (Comma separated)
                    </Label>
                    <Input
                      id="locations"
                      value={form.locations}
                      onChange={(e) => updateField("locations", e.target.value)}
                      placeholder="e.g. Pokhara, Lalitpur, Butwal"
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="website" className="text-xs font-semibold">
                      Company Website
                    </Label>
                    <Input
                      id="website"
                      value={form.website}
                      onChange={(e) => updateField("website", e.target.value)}
                      placeholder="https://yourcompany.com"
                      className="h-10 text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3. Social Media & Candidate Contact */}
            <Card className="overflow-hidden border-border/60 shadow-sm glass">
              <div className="border-b bg-card/60 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm sm:text-base">
                      Social Media & Public Contact
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Public links displayed on your company profile.
                    </p>
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="linkedin" className="text-xs font-semibold">
                      LinkedIn URL
                    </Label>
                    <Input
                      id="linkedin"
                      value={form.linkedin_url}
                      onChange={(e) => updateField("linkedin_url", e.target.value)}
                      placeholder="https://linkedin.com/company/yourcompany"
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="twitter" className="text-xs font-semibold">
                      Twitter / X URL
                    </Label>
                    <Input
                      id="twitter"
                      value={form.twitter_url}
                      onChange={(e) => updateField("twitter_url", e.target.value)}
                      placeholder="https://x.com/yourcompany"
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="facebook" className="text-xs font-semibold">
                      Facebook URL
                    </Label>
                    <Input
                      id="facebook"
                      value={form.facebook_url}
                      onChange={(e) => updateField("facebook_url", e.target.value)}
                      placeholder="https://facebook.com/yourcompany"
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="instagram" className="text-xs font-semibold">
                      Instagram URL
                    </Label>
                    <Input
                      id="instagram"
                      value={form.instagram_url}
                      onChange={(e) => updateField("instagram_url", e.target.value)}
                      placeholder="https://instagram.com/yourcompany"
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2 pt-2 border-t border-border/40">
                    <Label htmlFor="hr_contact_email" className="text-xs font-semibold">
                      Candidate Inquiries Email (Public)
                    </Label>
                    <Input
                      id="hr_contact_email"
                      type="email"
                      value={form.hr_contact_email}
                      onChange={(e) => updateField("hr_contact_email", e.target.value)}
                      placeholder="careers@yourcompany.com"
                      className="h-10 text-sm"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Only provide an email you wish candidates to publicly see for job inquiries.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 4. Culture, Perks & Tech */}
            <Card className="overflow-hidden border-border/60 shadow-sm glass">
              <div className="border-b bg-card/60 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm sm:text-base">
                      Culture, Benefits & Technologies
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Stand out to top tech & professional talent in Nepal.
                    </p>
                  </div>
                </div>
              </div>

              <CardContent className="p-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="mission" className="text-xs font-semibold">
                      Mission Statement
                    </Label>
                    <Textarea
                      id="mission"
                      rows={3}
                      value={form.mission}
                      onChange={(e) => updateField("mission", e.target.value)}
                      placeholder="What is your company's core mission?"
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="vision" className="text-xs font-semibold">
                      Vision Statement
                    </Label>
                    <Textarea
                      id="vision"
                      rows={3}
                      value={form.vision}
                      onChange={(e) => updateField("vision", e.target.value)}
                      placeholder="Where do you see your organization in 5 years?"
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="benefits" className="text-xs font-semibold">
                    Benefits & Perks (Comma separated)
                  </Label>
                  <Input
                    id="benefits"
                    value={form.benefits}
                    onChange={(e) => updateField("benefits", e.target.value)}
                    placeholder="e.g. Health Insurance, Flexible Hours, Annual Retreat, Paid Leave, Lunch Provided"
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="technologies" className="text-xs font-semibold">
                    Technologies / Tools Used (Comma separated)
                  </Label>
                  <Input
                    id="technologies"
                    value={form.technologies}
                    onChange={(e) => updateField("technologies", e.target.value)}
                    placeholder="e.g. React, TypeScript, Node.js, PostgreSQL, Docker, AWS"
                    className="h-10 text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 5. Branding / Images */}
            <Card className="overflow-hidden border-border/60 shadow-sm glass">
              <div className="border-b bg-card/60 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm sm:text-base">Branding & Media</h2>
                    <p className="text-xs text-muted-foreground">
                      Company logo and cover banner image URLs.
                    </p>
                  </div>
                </div>
              </div>

              <CardContent className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="logo_url" className="text-xs font-semibold">
                    Logo Image URL
                  </Label>
                  <Input
                    id="logo_url"
                    value={form.logo_url}
                    onChange={(e) => updateField("logo_url", e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="banner_url" className="text-xs font-semibold">
                    Cover Banner Image URL
                  </Label>
                  <Input
                    id="banner_url"
                    value={form.banner_url}
                    onChange={(e) => updateField("banner_url", e.target.value)}
                    placeholder="https://example.com/banner.jpg"
                    className="h-10 text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Button Bar */}
            <Card className="border-border/60 shadow-sm glass">
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                    <Save className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Save Company Profile</h4>
                    <p className="text-xs text-muted-foreground">
                      Changes will immediately reflect on your public company page.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {selectedCompany && (
                    <Button variant="outline" onClick={resetForm} className="h-10">
                      <Plus className="mr-1.5 h-4 w-4" />
                      New Company
                    </Button>
                  )}
                  <Button
                    onClick={() => upsert.mutate()}
                    disabled={!form.name.trim() || upsert.isPending}
                    className="h-10 gradient-brand text-primary-foreground font-semibold px-6 shadow-sm"
                  >
                    {upsert.isPending
                      ? "Saving…"
                      : selectedCompany
                        ? "Update Profile"
                        : "Create Company"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Preview & Verification Box */}
          <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            {/* Live Preview Card */}
            <Card className="overflow-hidden border-border/60 shadow-sm glass">
              <div className="border-b bg-card/60 px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Live Preview</h3>
                </div>
              </div>

              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="h-14 w-14 rounded-xl border bg-muted/40 flex items-center justify-center overflow-hidden shrink-0">
                    {form.logo_url ? (
                      <img
                        src={form.logo_url}
                        alt=""
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="font-bold text-lg gradient-text">{initials}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-base text-foreground truncate">
                      {form.name || "Company Name"}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {form.tagline || "Your company tagline will appear here"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/40 text-xs text-muted-foreground">
                  {form.industry && (
                    <div className="flex items-center gap-2">
                      <BriefcaseBusiness className="h-3.5 w-3.5 text-primary" />
                      <span>{form.industry}</span>
                    </div>
                  )}
                  {form.headquarters && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      <span>{form.headquarters}</span>
                    </div>
                  )}
                  {form.size && (
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      <span>{form.size} employees</span>
                    </div>
                  )}
                  {form.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 text-primary" />
                      <span className="truncate">{form.website}</span>
                    </div>
                  )}
                </div>

                {selectedCompany?.slug && (
                  <Button asChild variant="outline" size="sm" className="w-full text-xs h-8 mt-2">
                    <Link to="/companies/$slug" params={{ slug: selectedCompany.slug }}>
                      <span>View Live Public Page</span>
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Verification Status Card */}
            <Card className="border-border/60 shadow-sm glass">
              <CardContent className="p-5 space-y-2.5">
                <div className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider text-foreground">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>Employer Verification</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Verified status is awarded to employers who complete identity and business
                  registration checks with the Jagire administration team.
                </p>
                <div className="pt-1">
                  {isVerified ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs">
                      ✓ Verified Employer on Jagire
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Status: Standard Registration
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Company
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this company?
              {deleteJobCount > 0 && (
                <span className="block mt-2 font-medium text-destructive">
                  This will also permanently remove {deleteJobCount} active job posting(s) and
                  associated applications.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => companyToDelete && deleteCompany.mutate(companyToDelete)}
            >
              Delete Company
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
