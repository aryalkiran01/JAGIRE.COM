/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { Trash2, Plus, FileText, Download, Sparkles } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { pdf } from "@react-pdf/renderer";

import { scanResumeFromStorage } from "@/lib/ai.service";
import { ResumePDF } from "./ResumePdf"; // We'll create this component

export const Route = createFileRoute("/_authenticated/resume-builder")({
  component: ResumeBuilder,
});

/* ---------- data types ---------- */
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

/* ---------- parsing helpers ---------- */
function parseExperience(item: string) {
  const lines = item
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l);
  const title = lines[0] || "";
  const subtitle =
    lines[1] && !lines[1].startsWith("•") && !lines[1].startsWith("-") && !lines[1].startsWith("*")
      ? lines[1]
      : "";
  const bulletStart = subtitle ? 2 : 1;
  let bullets = lines
    .slice(bulletStart)
    .map((l) => l.replace(/^[•\-*]\s*/, "").trim())
    .filter((l) => l);
  bullets = bullets.slice(0, 4);
  return { title, subtitle, bullets };
}

function parseProject(item: string) {
  const lines = item
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l);
  const title = lines[0] || "";
  const subtitle =
    lines[1] && !lines[1].startsWith("•") && !lines[1].startsWith("-") && !lines[1].startsWith("*")
      ? lines[1]
      : "";
  const bulletStart = subtitle ? 2 : 1;
  let bullets = lines
    .slice(bulletStart)
    .map((l) => l.replace(/^[•\-*]\s*/, "").trim())
    .filter((l) => l);
  bullets = bullets.slice(0, 3);
  return { title, subtitle, bullets };
}

function parseEducation(item: string) {
  const lines = item
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l);
  const title = lines[0] || "";
  const subtitle = lines[1] || "";
  const details = lines.slice(2).join(" ");
  return { title, subtitle, details };
}

function truncateWords(text: string, max: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= max) return text;
  return words.slice(0, max).join(" ") + "…";
}

function ResumeBuilder() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const runScan = useServerFn(scanResumeFromStorage);

  const [title, setTitle] = useState("My Resume");
  const [data, setData] = useState<ResumeData>(empty);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [template, setTemplate] = useState<"classic" | "modern" | "minimal">("modern");
  const [isExporting, setIsExporting] = useState(false);

  async function scanResume() {
    if (!currentId) {
      toast.error("Save the resume first before scanning");
      return;
    }
    console.log("Scanning currentId:", currentId);
    try {
      toast.info("Scanning resume with AI...");
      const result = await runScan({ data: { resumeId: currentId } });
      toast.success(
        "Resume scanned successfully! Check the Resume Scanner page for detailed results.",
      );
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  /* ---------- PDF export with @react-pdf/renderer ---------- */
  async function exportPdf() {
    if (!data) return;

    setIsExporting(true);
    try {
      // Create a PDF document using @react-pdf/renderer
      const pdfDoc = <ResumePDF data={data} title={title} template={template} />;

      // Generate the PDF as a blob
      const blob = await pdf(pdfDoc).toBlob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title || "resume"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  /* ---------- load saved resumes ---------- */
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

  /* ---------- save / load ---------- */
  async function save() {
    if (!user) return;

    const plainText = [
      data.full_name,
      data.headline,
      data.email,
      data.phone,
      data.summary,
      ...data.experience.items.filter(Boolean),
      ...data.education.items.filter(Boolean),
      ...data.projects.items.filter(Boolean),
      ...data.skills.items.filter(Boolean),
    ].join("\n\n");

    const payload = {
      user_id: user.id,
      title,
      resume_data: data as any,
      parsed_data: {
        summary: data.summary,
        skills: data.skills.items.filter(Boolean),
        raw_text: plainText,
      },
    };

    let savedId: string | null = currentId ?? null;

    const { error: defaultError } = await supabase
      .from("resumes")
      .update({ is_default: false })
      .eq("user_id", user.id);

    if (defaultError) {
      return toast.error(defaultError.message);
    }

    if (currentId) {
      const { error } = await supabase
        .from("resumes")
        .update({
          ...payload,
          is_default: true,
        })
        .eq("id", currentId);

      if (error) return toast.error(error.message);
    } else {
      const { data: row, error } = await supabase
        .from("resumes")
        .insert({
          ...payload,
          is_default: true,
        })
        .select("id")
        .single();

      if (error) return toast.error(error.message);

      setCurrentId(row.id);
      savedId = row.id;
    }

    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["builder-resumes"] });
  }

  function load(r: any) {
    setCurrentId(r.id);
    setTitle(r.title ?? "My Resume");
    setData({ ...empty, ...(r.resume_data ?? {}) });
  }

  /* ---------- section helpers ---------- */
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

  /* ---------- word / bullet counters ---------- */
  const summaryWordCount = data.summary.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="container mx-auto px-4 py-8 grid lg:grid-cols-[280px_1fr] gap-6">
      {/* ---------- sidebar ---------- */}
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

      {/* ---------- main area ---------- */}
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
          <Button variant="outline" onClick={exportPdf} disabled={isExporting}>
            <Download className="h-4 w-4 mr-1" />
            {isExporting ? "Exporting..." : "PDF"}
          </Button>
          <Button onClick={save} className="gradient-brand text-primary-foreground">
            Save
          </Button>
          <Button
            variant="outline"
            onClick={scanResume}
            disabled={!currentId}
            className="border-amber-500 text-amber-600 hover:bg-amber-50"
          >
            <Sparkles className="h-4 w-4 mr-1" />
            AI Scan
          </Button>
        </div>

        {/* ---------- basic info ---------- */}
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
              <p className="text-xs text-muted-foreground mt-1">
                Words: {summaryWordCount}/60{" "}
                {summaryWordCount > 60 && (
                  <span className="text-red-500">(will be truncated in preview & PDF)</span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ---------- sections ---------- */}
        {(["experience", "education", "skills", "projects"] as const).map((k) => (
          <Card key={k}>
            <CardHeader>
              <CardTitle className="capitalize">{k}</CardTitle>
              {k === "experience" && (
                <p className="text-xs text-muted-foreground">
                  Format: Job Title → Company | Date → bullet points (max 4)
                </p>
              )}
              {k === "projects" && (
                <p className="text-xs text-muted-foreground">
                  Format: Project Name → Tech Stack → bullet points (max 3)
                </p>
              )}
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

        {/* ---------- ATS‑friendly live preview ---------- */}
        <Card>
          <CardHeader>
            <CardTitle>Live preview</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-auto max-h-[600px]">
            <div
              style={{
                width: "210mm",
                minHeight: "auto",
                margin: "0 auto",
                padding: "15mm 15mm 20mm 15mm",
                fontFamily: "'Inter', Arial, Helvetica, sans-serif",
                fontSize: "10pt",
                lineHeight: 1.4,
                color: "#000",
                background: "#fff",
                boxSizing: "border-box",
              }}
            >
              {/* ---------- header ---------- */}
              <div style={{ textAlign: "center", marginBottom: "6mm" }}>
                <h1
                  style={{
                    fontSize: "24pt",
                    fontWeight: "bold",
                    margin: 0,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {data.full_name || "Your Name"}
                </h1>
                <p style={{ fontSize: "14pt", margin: "1mm 0", color: "#333" }}>{data.headline}</p>
                <p style={{ fontSize: "10pt", margin: 0, color: "#555" }}>
                  {[data.email, data.phone].filter(Boolean).join(" | ")}
                </p>
              </div>

              {/* ---------- summary ---------- */}
              {data.summary && (
                <div style={{ marginBottom: "5mm" }}>
                  <h2
                    style={{
                      fontSize: "12pt",
                      fontWeight: "bold",
                      borderBottom: "1px solid #333",
                      paddingBottom: "1mm",
                      marginBottom: "2mm",
                      textTransform: "uppercase",
                    }}
                  >
                    Professional Summary
                  </h2>
                  <p style={{ margin: 0, fontSize: "10pt" }}>{truncateWords(data.summary, 60)}</p>
                </div>
              )}

              {/* ---------- experience ---------- */}
              {data.experience.items.some((i) => i.trim()) && (
                <div style={{ marginBottom: "5mm" }}>
                  <h2
                    style={{
                      fontSize: "12pt",
                      fontWeight: "bold",
                      borderBottom: "1px solid #333",
                      paddingBottom: "1mm",
                      marginBottom: "2mm",
                      textTransform: "uppercase",
                    }}
                  >
                    Experience
                  </h2>
                  {data.experience.items
                    .filter((i) => i.trim())
                    .map((item, idx) => {
                      const { title, subtitle, bullets } = parseExperience(item);
                      return (
                        <div key={idx} style={{ marginBottom: "3mm", pageBreakInside: "avoid" }}>
                          {title && <p style={{ fontWeight: "bold", margin: 0 }}>{title}</p>}
                          {subtitle && (
                            <p style={{ fontStyle: "italic", margin: 0, color: "#555" }}>
                              {subtitle}
                            </p>
                          )}
                          {bullets.length > 0 && (
                            <ul
                              style={{ margin: "1mm 0 0 4mm", padding: 0, listStyleType: "disc" }}
                            >
                              {bullets.map((b, i) => (
                                <li key={i} style={{ fontSize: "10pt" }}>
                                  {b}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}

              {/* ---------- education ---------- */}
              {data.education.items.some((i) => i.trim()) && (
                <div style={{ marginBottom: "5mm" }}>
                  <h2
                    style={{
                      fontSize: "12pt",
                      fontWeight: "bold",
                      borderBottom: "1px solid #333",
                      paddingBottom: "1mm",
                      marginBottom: "2mm",
                      textTransform: "uppercase",
                    }}
                  >
                    Education
                  </h2>
                  {data.education.items
                    .filter((i) => i.trim())
                    .map((item, idx) => {
                      const { title, subtitle, details } = parseEducation(item);
                      return (
                        <div key={idx} style={{ marginBottom: "2mm", pageBreakInside: "avoid" }}>
                          <p style={{ fontWeight: "bold", margin: 0 }}>{title}</p>
                          {subtitle && <p style={{ margin: 0, color: "#555" }}>{subtitle}</p>}
                          {details && <p style={{ margin: 0, fontSize: "9pt" }}>{details}</p>}
                        </div>
                      );
                    })}
                </div>
              )}

              {/* ---------- projects ---------- */}
              {data.projects.items.some((i) => i.trim()) && (
                <div style={{ marginBottom: "5mm" }}>
                  <h2
                    style={{
                      fontSize: "12pt",
                      fontWeight: "bold",
                      borderBottom: "1px solid #333",
                      paddingBottom: "1mm",
                      marginBottom: "2mm",
                      textTransform: "uppercase",
                    }}
                  >
                    Projects
                  </h2>
                  {data.projects.items
                    .filter((i) => i.trim())
                    .map((item, idx) => {
                      const { title, subtitle, bullets } = parseProject(item);
                      return (
                        <div key={idx} style={{ marginBottom: "3mm", pageBreakInside: "avoid" }}>
                          <p style={{ fontWeight: "bold", margin: 0 }}>{title}</p>
                          {subtitle && (
                            <p style={{ fontStyle: "italic", margin: 0, color: "#555" }}>
                              {subtitle}
                            </p>
                          )}
                          {bullets.length > 0 && (
                            <ul
                              style={{ margin: "1mm 0 0 4mm", padding: 0, listStyleType: "disc" }}
                            >
                              {bullets.map((b, i) => (
                                <li key={i} style={{ fontSize: "10pt" }}>
                                  {b}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}

              {/* ---------- skills ---------- */}
              {data.skills.items.some((i) => i.trim()) && (
                <div style={{ marginBottom: "5mm" }}>
                  <h2
                    style={{
                      fontSize: "12pt",
                      fontWeight: "bold",
                      borderBottom: "1px solid #333",
                      paddingBottom: "1mm",
                      marginBottom: "2mm",
                      textTransform: "uppercase",
                    }}
                  >
                    Skills
                  </h2>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "2mm" }}>
                    {data.skills.items
                      .flatMap((item) => item.split(",").map((s) => s.trim()))
                      .filter(Boolean)
                      .map((skill, i) => (
                        <span
                          key={i}
                          style={{
                            background: "#f0f0f0",
                            padding: "1mm 2mm",
                            borderRadius: "2mm",
                            fontSize: "9pt",
                            border: "0.5px solid #ccc",
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
