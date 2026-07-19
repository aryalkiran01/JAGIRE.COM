import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Github, Upload, Loader2, Star, ExternalLink, Linkedin } from "lucide-react";
import { importFromGitHub, importFromLinkedInText } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/profile")({ component: ProfilePage });

function ProfilePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const runImport = useServerFn(importFromGitHub);
  const runLiImport = useServerFn(importFromLinkedInText);
  const [ghUser, setGhUser] = useState("");
  const [importing, setImporting] = useState(false);
  const [liText, setLiText] = useState("");
  const [liUrl, setLiUrl] = useState("");
  const [liImporting, setLiImporting] = useState(false);
  const [uploading, setUploading] = useState<null | "avatar" | "banner">(null);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle()).data,
  });
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (profile) { setForm(profile); setGhUser((profile as any).github_username ?? ""); } }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase.from("profiles") as any).update({
        full_name: form.full_name, headline: form.headline, bio: form.bio,
        about: form.about,
        phone: form.phone, location: form.location, website: form.website,
        linkedin_url: form.linkedin_url, github_url: form.github_url,
        experience_years: Number(form.experience_years) || 0,
        current_position: form.current_position,
        expected_salary: form.expected_salary ? Number(form.expected_salary) : null,
        preferred_location: form.preferred_location,
        skills: typeof form.skills === "string"
          ? form.skills.split(",").map((s: string) => s.trim()).filter(Boolean)
          : (form.skills ?? []),
      }).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Profile updated"); qc.invalidateQueries({ queryKey: ["profile"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  async function uploadImage(file: File, kind: "avatar" | "banner") {
    if (!user) return;
    setUploading(kind);
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("Image must be under 5MB");
      const path = `${user.id}/${kind}-${Date.now()}-${file.name}`;
      const up = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (up.error) throw up.error;
      const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365);
      const url = signed?.signedUrl ?? null;
      if (!url) throw new Error("Could not generate URL");
      const col = kind === "avatar" ? "avatar_url" : "banner_url";
      const { error } = await (supabase.from("profiles") as any).update({ [col]: url }).eq("id", user.id);
      if (error) throw error;
      toast.success(`${kind === "avatar" ? "Photo" : "Banner"} updated`);
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(null);
    }
  }

  async function doImport() {
    if (!ghUser.trim()) return toast.error("Enter your GitHub username");
    setImporting(true);
    try {
      const res = await runImport({ data: { username: ghUser.trim() } });
      toast.success(`Imported ${res.imported.projects} projects, ${res.imported.skills} skills`);
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setImporting(false);
    }
  }

  async function doLiImport() {
    if (!liText.trim()) return toast.error("Paste your LinkedIn About / Experience text");
    setLiImporting(true);
    try {
      const res = await runLiImport({ data: { text: liText.trim(), url: liUrl.trim() } });
      toast.success(`Imported ${res.imported.fields} profile fields`);
      setLiText("");
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLiImporting(false);
    }
  }

  const projects = (profile as any)?.projects ?? [];
  const skills = (profile as any)?.skills ?? [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <Card className="overflow-hidden">
        <div className="relative">
          <div
            className="h-40 md:h-56 bg-gradient-to-br from-primary/30 via-primary/10 to-accent/30 bg-cover bg-center"
            style={form.banner_url ? { backgroundImage: `url(${form.banner_url})` } : undefined}
          />
          <label className="absolute top-3 right-3 cursor-pointer">
            <div className="bg-background/80 backdrop-blur border rounded-md px-3 py-1.5 text-xs flex items-center gap-1.5 hover:bg-background">
              {uploading === "banner" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              Change banner
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "banner")} />
          </label>
          <div className="absolute -bottom-12 left-6">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-background">
                <AvatarImage src={form.avatar_url ?? undefined} />
                <AvatarFallback className="text-2xl">{(form.full_name ?? "?").slice(0, 1)}</AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 cursor-pointer bg-primary text-primary-foreground rounded-full p-1.5 shadow">
                {uploading === "avatar" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "avatar")} />
              </label>
            </div>
          </div>
        </div>
        <div className="pt-16 pb-6 px-6">
          <h1 className="text-2xl font-bold">{form.full_name || "Your name"}</h1>
          <p className="text-muted-foreground">{form.headline || "Add a headline"}</p>
          <p className="text-sm text-muted-foreground mt-1">{form.location || "Location"}</p>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {skills.slice(0, 12).map((s: string) => <Badge key={s} variant="secondary">{s}</Badge>)}
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Github className="h-5 w-5" /> Import from GitHub</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          <Input placeholder="your-github-username" value={ghUser} onChange={(e) => setGhUser(e.target.value)} />
          <Button onClick={doImport} disabled={importing} className="gradient-brand text-primary-foreground">
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Import"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Linkedin className="h-5 w-5" /> Import from LinkedIn</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Input placeholder="https://linkedin.com/in/your-handle (optional)" value={liUrl} onChange={(e) => setLiUrl(e.target.value)} />
          <Textarea
            rows={5}
            placeholder="Paste your LinkedIn About + Experience text here. AI will extract your headline, skills, and summary."
            value={liText}
            onChange={(e) => setLiText(e.target.value)}
          />
          <div className="flex justify-end">
            <Button onClick={doLiImport} disabled={liImporting} className="gradient-brand text-primary-foreground">
              {liImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Import with AI"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {projects.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Featured projects</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-3">
            {projects.map((p: any) => (
              <a key={p.url} href={p.url} target="_blank" rel="noreferrer" className="border rounded-lg p-3 hover:bg-muted transition">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium">{p.name}</div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                {p.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}
                <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                  {p.language && <span>{p.language}</span>}
                  {p.stars > 0 && <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {p.stars}</span>}
                </div>
              </a>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Personal info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Full name"><Input value={form.full_name ?? ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Field>
            <Field label="Headline"><Input value={form.headline ?? ""} onChange={(e) => setForm({ ...form, headline: e.target.value })} placeholder="Senior Engineer at ..." /></Field>
            <Field label="Current position"><Input value={form.current_position ?? ""} onChange={(e) => setForm({ ...form, current_position: e.target.value })} /></Field>
            <Field label="Years of experience"><Input type="number" value={form.experience_years ?? 0} onChange={(e) => setForm({ ...form, experience_years: e.target.value })} /></Field>
            <Field label="Location"><Input value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
            <Field label="Preferred location"><Input value={form.preferred_location ?? ""} onChange={(e) => setForm({ ...form, preferred_location: e.target.value })} /></Field>
            <Field label="Expected salary (USD)"><Input type="number" value={form.expected_salary ?? ""} onChange={(e) => setForm({ ...form, expected_salary: e.target.value })} /></Field>
            <Field label="Phone"><Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Website"><Input value={form.website ?? ""} onChange={(e) => setForm({ ...form, website: e.target.value })} /></Field>
            <Field label="LinkedIn"><Input value={form.linkedin_url ?? ""} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} /></Field>
            <Field label="GitHub"><Input value={form.github_url ?? ""} onChange={(e) => setForm({ ...form, github_url: e.target.value })} /></Field>
          </div>
          <Field label="About (LinkedIn-style summary)"><Textarea rows={4} value={form.about ?? ""} onChange={(e) => setForm({ ...form, about: e.target.value })} placeholder="Tell your story…" /></Field>
          <Field label="Bio"><Textarea rows={4} value={form.bio ?? ""} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></Field>
          <Field label="Skills (comma-separated)">
            <Input
              value={Array.isArray(form.skills) ? form.skills.join(", ") : (form.skills ?? "")}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
              placeholder="React, TypeScript, Node.js"
            />
          </Field>
          <Button onClick={() => save.mutate()} disabled={save.isPending} className="gradient-brand text-primary-foreground">Save changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="mb-1 block">{label}</Label>{children}</div>;
}