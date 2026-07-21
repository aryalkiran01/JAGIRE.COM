import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, MapPin, Search, Briefcase } from "lucide-react";

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  job_type: z.string().optional(),
  location: z.string().optional(),
});

export const Route = createFileRoute("/jobs/")({
  validateSearch: searchSchema,
  component: JobsPage,
});

function JobsPage() {
  const search = Route.useSearch();
  const [q, setQ] = useState(search.q ?? "");
  const [jobType, setJobType] = useState(search.job_type ?? "all");

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["jobs", q, jobType, search.category, search.location],
    queryFn: async () => {
      let query = supabase
        .from("jobs")
        .select(
          "id, title, slug, description, location, job_type, experience_level, salary_min, salary_max, salary_currency, required_skills, created_at, company:companies(id, name, slug, logo_url)",
        )
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(50);
      if (q) query = query.ilike("title", `%${q}%`);
      if (jobType && jobType !== "all") query = query.eq("job_type", jobType as any);
      if (search.location) query = query.ilike("location", `%${search.location}%`);
      const { data } = await query;
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Find your next role</h1>
          <p className="text-muted-foreground">
            Browse thousands of opportunities from top companies
          </p>
        </div>

        <Card className="mb-6 shadow-card-soft">
          <CardContent className="p-4">
            <div className="grid md:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={jobType} onValueChange={setJobType}>
                <SelectTrigger>
                  <SelectValue placeholder="Job type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="full_time">Full-time</SelectItem>
                  <SelectItem value="part_time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                  <SelectItem value="freelance">Freelance</SelectItem>
                </SelectContent>
              </Select>
              <Button className="gradient-brand text-primary-foreground">Search</Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="animate-pulse h-32" />
            ))}
          </div>
        ) : jobs?.length ? (
          <div className="grid gap-3">
            {jobs.map((job: any) => (
              <Link key={job.id} to="/jobs/$jobId" params={{ jobId: job.id }}>
                <Card className="hover:shadow-glow transition-all">
                  <CardContent className="p-6 flex gap-4">
                    <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      {job.company?.logo_url ? (
                        <img
                          src={job.company.logo_url}
                          className="h-full w-full object-cover"
                          alt=""
                        />
                      ) : (
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1">{job.title}</h3>
                      <div className="text-sm text-muted-foreground mb-2">{job.company?.name}</div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {job.location && (
                          <Badge variant="secondary">
                            <MapPin className="mr-1 h-3 w-3" />
                            {job.location}
                          </Badge>
                        )}
                        <Badge variant="secondary">
                          <Briefcase className="mr-1 h-3 w-3" />
                          {String(job.job_type).replace("_", " ")}
                        </Badge>
                        <Badge variant="outline">{job.experience_level}</Badge>
                        {job.salary_min && (
                          <Badge>
                            ${Math.round(job.salary_min / 1000)}k - $
                            {Math.round((job.salary_max ?? job.salary_min) / 1000)}k
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              No jobs found matching your filters.
            </CardContent>
          </Card>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
