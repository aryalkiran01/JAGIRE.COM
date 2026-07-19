import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/support")({
  head: () => ({ meta: [{ title: "Support — Jagire" }, { name: "description", content: "Help center and support for Jagire users." }] }),
  component: Support,
});

function Support() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: tickets } = useQuery({
    queryKey: ["tickets", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("support_tickets").select("*").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  async function submit() {
    if (!user) return toast.error("Please sign in first.");
    if (!subject.trim() || !message.trim()) return toast.error("Fill in both fields.");
    setSaving(true);
    const { error } = await supabase.from("support_tickets").insert({ user_id: user.id, subject, message });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Ticket submitted!");
    setSubject(""); setMessage("");
    qc.invalidateQueries({ queryKey: ["tickets"] });
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold mb-6">Support</h1>
        <Card className="mb-6"><CardContent className="p-6 space-y-3">
          <h2 className="font-semibold">Open a ticket</h2>
          <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <Textarea rows={5} placeholder="Describe your issue…" value={message} onChange={(e) => setMessage(e.target.value)} />
          <Button onClick={submit} disabled={saving || !user} className="gradient-brand text-primary-foreground">
            {saving ? "Submitting…" : "Submit"}
          </Button>
          {!user && <p className="text-xs text-muted-foreground">Sign in to submit a ticket.</p>}
        </CardContent></Card>

        {user && tickets && tickets.length > 0 && (
          <>
            <h2 className="text-xl font-bold mb-3">Your tickets</h2>
            <div className="space-y-2">
              {tickets.map((t) => (
                <Card key={t.id}><CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{t.subject}</div>
                      <div className="text-sm text-muted-foreground mt-1">{t.message}</div>
                      {t.admin_reply && (
                        <div className="mt-3 p-3 bg-muted rounded text-sm">
                          <div className="font-semibold text-xs mb-1">Support reply</div>
                          {t.admin_reply}
                        </div>
                      )}
                    </div>
                    <Badge>{t.status}</Badge>
                  </div>
                </CardContent></Card>
              ))}
            </div>
          </>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}