import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export function ApplyJobDialog({
  jobId,
  disabled,
  applied,
  deadlinePassed,
  jobClosed,
}: {
  jobId: string;
  disabled?: boolean;
  applied?: boolean;
  deadlinePassed?: boolean;
  jobClosed?: boolean;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [resumeId, setResumeId] = useState<string>("");
  const [coverLetter, setCoverLetter] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const { data: resumes } = useQuery({
    queryKey: ["my-resumes", user?.id],
    enabled: !!user && open,
    queryFn: async () =>
      (
        await supabase
          .from("resumes")
          .select("id, file_name, title, is_default")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
      ).data ?? [],
  });

  function friendlyError(e: any): string {
    const msg = String(e?.message ?? e ?? "");
    const code = e?.code;
    if (code === "23505" || /duplicate key/i.test(msg))
      return "You've already applied to this job.";
    if (/cannot apply to a job posted by your own company/i.test(msg))
      return "You can't apply to a job posted by your own company.";
    if (/row-level security|permission denied/i.test(msg))
      return "You don't have permission to apply. Try signing out and back in.";
    if (/violates check constraint|null value in column/i.test(msg))
      return "Some required application details are missing.";
    if (/Object not found|not_found/i.test(msg))
      return "Resume upload failed. Please try a different file.";
    return msg || "Failed to submit application. Please try again.";
  }

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
        const ins = await supabase
          .from("resumes")
          .insert({
            user_id: user.id,
            file_path: path,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type,
          })
          .select("id")
          .single();
        if (ins.error) throw ins.error;
        finalResumeId = ins.data.id;
      } else if (!finalResumeId && resumes?.length) {
        finalResumeId = resumes.find((r) => r.is_default)?.id ?? resumes[0].id;
      }

      if (!finalResumeId) throw new Error("Please attach a resume before applying");

      const { error } = await supabase.from("applications").insert({
        job_id: jobId,
        applicant_id: user.id,
        resume_id: finalResumeId,
        cover_letter: coverLetter.trim() || null,
      });
      if (error) throw error;
      toast.success("Application submitted!");
      setSuccess(true);
      qc.invalidateQueries({ queryKey: ["applied", jobId] });
      qc.invalidateQueries({ queryKey: ["apps"] });
    } catch (e: any) {
      toast.error(friendlyError(e));
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setSuccess(false);
      setCoverLetter("");
      setFile(null);
      setResumeId("");
    }
  }

  const blockedLabel = applied
    ? "Already applied"
    : jobClosed
      ? "Job closed"
      : deadlinePassed
        ? "Deadline passed"
        : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          disabled={disabled || !!blockedLabel}
          className="w-full gradient-brand text-primary-foreground"
        >
          {blockedLabel ?? "Apply now"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{success ? "Application submitted" : "Apply to this job"}</DialogTitle>
        </DialogHeader>
        {success ? (
          <div className="py-6 flex flex-col items-center text-center gap-3">
            <CheckCircle2 className="h-14 w-14 text-green-500" />
            <p className="text-sm text-muted-foreground">
              Your application is on its way to the employer. You can track its status any time.
            </p>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Close
              </Button>
              <Button asChild className="gradient-brand text-primary-foreground">
                <Link to="/applications">View my applications</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <Label>Resume</Label>
                {resumes?.length ? (
                  <Select value={resumeId} onValueChange={setResumeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Use default resume" />
                    </SelectTrigger>
                    <SelectContent>
                      {resumes.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.title ?? r.file_name ?? "Untitled"}
                          {r.is_default ? " (default)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    No saved resumes — upload one below.
                  </p>
                )}
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Upload className="h-3 w-3" />
                  Or upload a new resume (PDF/DOC)
                </Label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                {file && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Selected: {file.name} ({Math.round(file.size / 1024)} KB)
                  </p>
                )}
              </div>
              <div>
                <Label>Cover letter (optional)</Label>
                <Textarea
                  rows={6}
                  placeholder="Why are you a great fit?"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  maxLength={2000}
                />
                <div className="text-xs text-muted-foreground text-right">
                  {coverLetter.length}/2000
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={submit}
                disabled={submitting || (!file && !resumes?.length)}
                className="gradient-brand text-primary-foreground"
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit application
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
