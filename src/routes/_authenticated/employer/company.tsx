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
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/employer/company")({
  component: CompanyForm,
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function CompanyForm() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: company } = useQuery({
    queryKey: ["my-company", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("*")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return data;
    },
  });

  const [form, setForm] = useState<any>({
    name: "",
    tagline: "",
    description: "",
    website: "",
    industry: "",
    size: "",
    headquarters: "",
    logo_url: "",
  });

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name ?? "",
        tagline: company.tagline ?? "",
        description: company.description ?? "",
        website: company.website ?? "",
        industry: company.industry ?? "",
        size: company.size ?? "",
        headquarters: company.headquarters ?? "",
        logo_url: company.logo_url ?? "",
      });
    }
  }, [company]);

  const updateField = (field: string, value: string) => {
    setForm((prev: any) => ({
      ...prev,
      [field]: value,
    }));
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

      if (company) {
        const nextSlug = slugify(form.name) || company.slug;

        const { error } = await supabase
          .from("companies")
          .update({
            ...editable,
            slug: nextSlug,
          })
          .eq("id", company.id);

        if (error) throw error;
      } else {
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
      }
    },

    onSuccess: async () => {
      toast.success("Company profile saved successfully");

      qc.clear();

      window.location.href = "/employer";
    },

    onError: (e: any) => {
      toast.error(e.message);
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
                {company ? "Edit your company" : "Create your company profile"}
              </h1>

              <p className="mt-2 max-w-2xl text-muted-foreground">
                Tell candidates who you are, what you do, and why they should consider joining your
                team.
              </p>
            </div>

            {company && (
              <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Profile created
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="container mx-auto max-w-5xl px-4 py-8">
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
                        {company
                          ? "Ready to update your profile?"
                          : "Ready to publish your company?"}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        Your changes will be saved to your company profile.
                      </p>
                    </div>
                  </div>

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
                        {company ? "Save changes" : "Create company"}
                      </>
                    )}
                  </Button>
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
    </div>
  );
}
