import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, Plus, FileText, Download } from "lucide-react";
import { useRef } from "react";

export const Route = createFileRoute("/_authenticated/resume-builder")({
  component: ResumeBuilder,
});

type Section = { title: string; items: string[] };
type ResumeData = {
  full_name: string;
  headline: string;
  email: string;
  phone: string;
  summary: string;
  experience: Section;
  education: Section;
  skills: Section;
  projects: Section;
};

const empty: ResumeData = {
  full_name: "",
  headline: "",
  email: "",
  phone: "",
  summary: "",
  experience: { title: "Experience", items: [""] },
  education: { title: "Education", items: [""] },
  skills: { title: "Skills", items: [""] },
  projects: { title: "Projects", items: [""] },
};

function ResumeBuilder() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState("My Resume");
  const [data, setData] = useState<ResumeData>(empty);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [template, setTemplate] = useState<"classic" | "modern" | "minimal">("modern");
  const previewRef = useRef<HTMLDivElement>(null);

  async function exportPdf() {
    if (!previewRef.current) return;
    const html2pdf = (await import("html2pdf.js")).default;
    html2pdf()
      .set({
        margin: 10,
        filename: `${title || "resume"}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4" },
      })
      .from(previewRef.current)
      .save();
  }

  const { data: resumes } = useQuery({
    queryKey: ["builder-resumes", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (
        await supabase
          .from("resumes")
          .select("id, title, updated_at, resume_data")
          .eq("user_id", user!.id)
          .not("resume_data", "is", null)
          .order("updated_at", { ascending: false })
      ).data ?? [],
  });

  useEffect(() => {
    if (user)
      setData((d) => ({
        ...d,
        full_name: d.full_name || (user.user_metadata?.full_name ?? ""),
        email: d.email || (user.email ?? ""),
      }));
  }, [user]);

  async function save() {
    if (!user) return;
    const payload = { user_id: user.id, title, resume_data: data as any };
    if (currentId) {
      const { error } = await supabase.from("resumes").update(payload).eq("id", currentId);
      if (error) return toast.error(error.message);
    } else {
      const { data: row, error } = await supabase
        .from("resumes")
        .insert(payload)
        .select("id")
        .single();
      if (error) return toast.error(error.message);
      setCurrentId(row.id);
    }
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["builder-resumes"] });
  }

  function load(r: any) {
    setCurrentId(r.id);
    setTitle(r.title ?? "My Resume");
    setData({ ...empty, ...(r.resume_data ?? {}) });
  }

  function updateSection(
    key: "experience" | "education" | "skills" | "projects",
    idx: number,
    val: string,
  ) {
    setData((d) => {
      const items = [...d[key].items];
      items[idx] = val;
      return { ...d, [key]: { ...d[key], items } };
    });
  }
  function addItem(key: "experience" | "education" | "skills" | "projects") {
    setData((d) => ({ ...d, [key]: { ...d[key], items: [...d[key].items, ""] } }));
  }
  function removeItem(key: "experience" | "education" | "skills" | "projects", idx: number) {
    setData((d) => ({
      ...d,
      [key]: { ...d[key], items: d[key].items.filter((_, i) => i !== idx) },
    }));
  }

  return (
    <div className="container mx-auto px-4 py-8 grid lg:grid-cols-[280px_1fr] gap-6">
      <aside>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your resumes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full mb-2"
              onClick={() => {
                setCurrentId(null);
                setTitle("My Resume");
                setData(empty);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
            {resumes?.map((r: any) => (
              <button
                key={r.id}
                onClick={() => load(r)}
                className={`w-full text-left p-2 rounded text-sm hover:bg-muted ${currentId === r.id ? "bg-muted" : ""}`}
              >
                <FileText className="h-3.5 w-3.5 inline mr-1.5" />
                {r.title ?? "Untitled"}
              </button>
            ))}
          </CardContent>
        </Card>
      </aside>

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold flex-1">Resume Builder</h1>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value as any)}
            className="border rounded-md h-9 px-2 text-sm bg-background"
          >
            <option value="modern">Modern</option>
            <option value="classic">Classic</option>
            <option value="minimal">Minimal</option>
          </select>
          <Button variant="outline" onClick={exportPdf}>
            <Download className="h-4 w-4 mr-1" />
            PDF
          </Button>
          <Button onClick={save} className="gradient-brand text-primary-foreground">
            Save
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label>Resume title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Full name</Label>
                <Input
                  value={data.full_name}
                  onChange={(e) => setData({ ...data, full_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Headline</Label>
                <Input
                  value={data.headline}
                  onChange={(e) => setData({ ...data, headline: e.target.value })}
                  placeholder="Senior Software Engineer"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={data.phone}
                  onChange={(e) => setData({ ...data, phone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Professional summary</Label>
              <Textarea
                rows={3}
                value={data.summary}
                onChange={(e) => setData({ ...data, summary: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {(["experience", "education", "skills", "projects"] as const).map((k) => (
          <Card key={k}>
            <CardHeader>
              <CardTitle className="capitalize">{k}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data[k].items.map((v, i) => (
                <div key={i} className="flex gap-2">
                  <Textarea
                    rows={k === "skills" ? 1 : 2}
                    value={v}
                    onChange={(e) => updateSection(k, i, e.target.value)}
                    placeholder={
                      k === "skills"
                        ? "e.g. React, TypeScript, Node.js"
                        : "Role · Company · Dates\nDescription"
                    }
                  />
                  <Button size="icon" variant="ghost" onClick={() => removeItem(k, i)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => addItem(k)}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <CardTitle>Live preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              ref={previewRef}
              className={`bg-white text-black p-8 rounded ${template === "modern" ? "border-l-4 border-primary" : template === "minimal" ? "" : "border"}`}
            >
              <h1
                className={`${template === "modern" ? "text-3xl font-bold text-primary" : "text-3xl font-bold"}`}
              >
                {data.full_name || "Your Name"}
              </h1>
              <p className="text-sm text-gray-600">{data.headline}</p>
              <p className="text-xs text-gray-500 mt-1">
                {[data.email, data.phone].filter(Boolean).join(" · ")}
              </p>
              {data.summary && (
                <>
                  <h2 className="mt-4 font-semibold border-b">Summary</h2>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{data.summary}</p>
                </>
              )}
              {(["experience", "education", "projects", "skills"] as const).map(
                (k) =>
                  data[k].items.filter(Boolean).length > 0 && (
                    <div key={k}>
                      <h2 className="mt-4 font-semibold border-b capitalize">{k}</h2>
                      <ul className="text-sm mt-1 space-y-1">
                        {data[k].items.filter(Boolean).map((it, i) => (
                          <li key={i} className="whitespace-pre-wrap">
                            {k === "skills" ? it : `• ${it}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ),
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
