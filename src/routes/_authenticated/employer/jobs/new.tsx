/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, useNavigate, Link, useSearch } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useState } from "react";
import { Loader as Loader2, Building2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/employer/jobs/new")({
  component: NewJob,
  validateSearch: (s: Record<string, unknown>) => ({
    companyId: typeof s.companyId === "string" ? s.companyId : undefined,
  }),
});

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    Math.random().toString(36).slice(2, 6)
  );
}

function NewJob() {
  const { user } = useAuth();
  const nav = useNavigate();
  const search = useSearch({ from: "/_authenticated/employer/jobs/new" });

  // Fetch ALL companies for this user
  const { data: companies, isLoading: companiesLoading } = useQuery({
    queryKey: ["my-companies", user?.id],
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  // Selected company from search params or first company
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    search.companyId || null,
  );

  const company = companies?.find((c) => c.id === selectedCompanyId) || companies?.[0];

  const [f, setF] = useState<any>({
    title: "",
    description: "",
    requirements: "",
    responsibilities: "",
    benefits: "",
    job_type: "full_time",
    experience_level: "mid",
    location: "",
    is_remote: false,
    salary_min: "",
    salary_max: "",
    required_skills: "",
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!company?.id) {
        throw new Error("Create your company first");
      }

      const payload = {
        company_id: company.id,
        posted_by: user!.id,
        title: f.title,
        slug: slugify(f.title),
        description: f.description,
        requirements: f.requirements,
        responsibilities: f.responsibilities
          .split("\n")
          .map((x: string) => x.trim())
          .filter(Boolean),
        benefits: f.benefits
          .split(",")
          .map((x: string) => x.trim())
          .filter(Boolean),
        job_type: f.job_type,
        experience_level: f.experience_level,
        location: f.location,
        is_remote: f.is_remote,
        salary_min: f.salary_min ? Number(f.salary_min) : null,
        salary_max: f.salary_max ? Number(f.salary_max) : null,
        required_skills: f.required_skills
          .split(",")
          .map((x: string) => x.trim())
          .filter(Boolean),
        status: "active" as const,
      };

      console.log("Creating job with payload:", payload);

      const { data, error } = await supabase.from("jobs").insert(payload).select("id").single();
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => {
      toast.success("Job posted!");
      nav({ to: "/employer/jobs/$jobId", params: { jobId: d.id } });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Show loading state
  if (companiesLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show "no company" state
  if (!companies || companies.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg">
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">Create your company first</h2>
            <p className="text-muted-foreground mb-4">
              You need a company profile before posting jobs.
            </p>
            <Button asChild className="gradient-brand text-primary-foreground">
              <Link to="/employer/company">Create company</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">Post a job</h1>
      <p className="text-muted-foreground mb-6">
        Posting as <span className="font-medium text-foreground">{company?.name}</span>
      </p>

      {/* Company selector if multiple companies */}
      {companies.length > 1 && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <Label>Select company</Label>
            <Select value={company?.id || ""} onValueChange={(v) => setSelectedCompanyId(v)}>
              <SelectTrigger className="mt-1">
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <Label>Title *</Label>
            <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Job type</Label>
              <Select value={f.job_type} onValueChange={(v) => setF({ ...f, job_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["full_time", "part_time", "contract", "internship", "freelance"].map((v) => (
                    <SelectItem key={v} value={v}>
                      {v.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Experience</Label>
              <Select
                value={f.experience_level}
                onValueChange={(v) => setF({ ...f, experience_level: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["entry", "junior", "mid", "senior", "lead", "executive"].map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={f.location}
                onChange={(e) => setF({ ...f, location: e.target.value })}
              />
            </div>
            <div className="flex items-end gap-2">
              <Switch checked={f.is_remote} onCheckedChange={(v) => setF({ ...f, is_remote: v })} />
              <Label>Remote</Label>
            </div>
            <div>
              <Label>Salary min</Label>
              <Input
                type="number"
                value={f.salary_min}
                onChange={(e) => setF({ ...f, salary_min: e.target.value })}
              />
            </div>
            <div>
              <Label>Salary max</Label>
              <Input
                type="number"
                value={f.salary_max}
                onChange={(e) => setF({ ...f, salary_max: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Required skills (comma-separated)</Label>
            <Input
              value={f.required_skills}
              onChange={(e) => setF({ ...f, required_skills: e.target.value })}
              placeholder="React, TypeScript, Node.js"
            />
          </div>
          <div>
            <Label>Description *</Label>
            <Textarea
              rows={5}
              value={f.description}
              onChange={(e) => setF({ ...f, description: e.target.value })}
            />
          </div>
          <div>
            <Label>Responsibilities</Label>
            <Textarea
              rows={4}
              value={f.responsibilities}
              onChange={(e) => setF({ ...f, responsibilities: e.target.value })}
            />
          </div>
          <div>
            <Label>Requirements</Label>
            <Textarea
              rows={4}
              value={f.requirements}
              onChange={(e) => setF({ ...f, requirements: e.target.value })}
            />
          </div>
          <div>
            <Label>Benefits</Label>
            <Textarea
              rows={3}
              value={f.benefits}
              onChange={(e) => setF({ ...f, benefits: e.target.value })}
            />
          </div>
          <Button
            onClick={() => create.mutate()}
            disabled={!f.title || !f.description || create.isPending}
            className="gradient-brand text-primary-foreground"
          >
            {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Publish job
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
