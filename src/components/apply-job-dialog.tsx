import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

export function ApplyJobDialog({ jobId, disabled, applied }: { jobId: string; disabled?: boolean; applied?: boolean }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [resumeId, setResumeId] = useState<string>("");
  const [coverLetter, setCoverLetter] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: resumes } = useQuery({
    queryKey: ["my-resumes", user?.id],
    enabled: !!user && open,
    queryFn: async () =>
      (await supabase.from("resumes").select("id, file_name, title, is_default").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  async function submit() {
    if (!user) return;
    setSubmitting(true);
    try {
      let finalResumeId: string | null = resumeId || null;

      if (file) {
        if (file.size > 10 * 1024 * 1024) throw new Error("Resume must be under 10MB");
        const path = `${user.id}/${Date.now()}-${file.name}`;
        const up = await supabase.storage.from("resumes").upload(path, file, { upsert: false });
        if (up.error) throw up.error;
        const ins = await supabase.from("resumes").insert({
          user_id: user.id, file_path: path, file_name: file.name, file_size: file.size, mime_type: file.type,
        }).select("id").single();
        if (ins.error) throw ins.error;
        finalResumeId = ins.data.id;
      } else if (!finalResumeId && resumes?.length) {
        finalResumeId = resumes.find((r) => r.is_default)?.id ?? resumes[0].id;
      }

      const { error } = await supabase.from("applications").insert({
        job_id: jobId,
        applicant_id: user.id,
        resume_id: finalResumeId,
        cover_letter: coverLetter.trim() || null,
      });
      if (error) throw error;
      toast.success("Application submitted!");
      qc.invalidateQueries({ queryKey: ["applied", jobId] });
      qc.invalidateQueries({ queryKey: ["apps"] });
      setOpen(false);
      setCoverLetter(""); setFile(null); setResumeId("");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to apply");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled || applied} className="w-full gradient-brand text-primary-foreground">
          {applied ? "Already applied" : "Apply now"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Apply to this job</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Resume</Label>
            {resumes?.length ? (
              <Select value={resumeId} onValueChange={setResumeId}>
                <SelectTrigger><SelectValue placeholder="Use default resume" /></SelectTrigger>
                <SelectContent>
                  {resumes.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.title ?? r.file_name ?? "Untitled"}{r.is_default ? " (default)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">No saved resumes — upload one below.</p>
            )}
          </div>
          <div>
            <Label className="flex items-center gap-2"><Upload className="h-3 w-3" />Or upload a new resume (PDF/DOC)</Label>
            <Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div>
            <Label>Cover letter (optional)</Label>
            <Textarea rows={6} placeholder="Why are you a great fit?" value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} maxLength={2000} />
            <div className="text-xs text-muted-foreground text-right">{coverLetter.length}/2000</div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting} className="gradient-brand text-primary-foreground">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}