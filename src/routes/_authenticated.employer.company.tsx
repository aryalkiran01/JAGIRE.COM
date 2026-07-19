import { createFileRoute, useNavigate } from "@tanstack/react-router";
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

export const Route = createFileRoute("/_authenticated/employer/company")({ component: CompanyForm });

function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

function CompanyForm() {
  const { user } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: company } = useQuery({
    queryKey: ["my-company", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("companies").select("*").eq("owner_id", user!.id).maybeSingle()).data,
  });
  const [form, setForm] = useState<any>({ name: "", tagline: "", description: "", website: "", industry: "", size: "", headquarters: "", logo_url: "" });
  useEffect(() => { if (company) setForm(company); }, [company]);

  const upsert = useMutation({
    mutationFn: async () => {
      // Ensure the user has the employer role (ignore duplicate)
      const roleRes = await supabase.from("user_roles").insert({ user_id: user!.id, role: "employer" });
      if (roleRes.error && roleRes.error.code !== "23505") throw roleRes.error;

      // Only send editable fields; never send id/created_at/updated_at/counter cols
      const editable = {
        name: form.name,
        tagline: form.tagline || null,
        description: form.description || null,
        website: form.website || null,
        industry: form.industry || null,
        size: form.size || null,
        headquarters: form.headquarters || null,
        logo_url: form.logo_url || null,
      };
      if (company) {
        const { error } = await supabase.from("companies").update(editable).eq("id", company.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("companies").insert({
          ...editable,
          owner_id: user!.id,
          slug: slugify(form.name) || `co-${Date.now()}`,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Company saved"); qc.invalidateQueries({ queryKey: ["my-company"] }); nav({ to: "/employer" }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">{company ? "Edit company" : "Create company"}</h1>
      <Card><CardContent className="p-6 space-y-4">
        <div><Label>Company name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
        <div><Label>Tagline</Label><Input value={form.tagline ?? ""} onChange={(e) => setForm({ ...form, tagline: e.target.value })} /></div>
        <div><Label>Description</Label><Textarea rows={4} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="grid md:grid-cols-2 gap-4">
          <div><Label>Website</Label><Input value={form.website ?? ""} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
          <div><Label>Industry</Label><Input value={form.industry ?? ""} onChange={(e) => setForm({ ...form, industry: e.target.value })} /></div>
          <div><Label>Size (e.g. 11-50)</Label><Input value={form.size ?? ""} onChange={(e) => setForm({ ...form, size: e.target.value })} /></div>
          <div><Label>Headquarters</Label><Input value={form.headquarters ?? ""} onChange={(e) => setForm({ ...form, headquarters: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Logo URL</Label><Input value={form.logo_url ?? ""} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." /></div>
        </div>
        <Button onClick={() => upsert.mutate()} disabled={!form.name || upsert.isPending} className="gradient-brand text-primary-foreground">Save company</Button>
      </CardContent></Card>
    </div>
  );
}