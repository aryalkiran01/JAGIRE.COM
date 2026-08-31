import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL ?? "admin@jagire.com";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Jagire" },
      { name: "description", content: "Get in touch with the Jagire team." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from("contact_messages").insert({ name, email, message });
      if (error) throw error;

      // Fire-and-forget admin email notification
      supabase.functions
        .invoke("send-email", {
          body: {
            to: ADMIN_EMAIL,
            subject: `New contact message from ${name}`,
            html: `
              <h2>New contact message — Jagire</h2>
              <table style="border-collapse:collapse;width:100%">
                <tr><td style="padding:6px;font-weight:bold;width:100px">Name</td><td style="padding:6px">${name}</td></tr>
                <tr><td style="padding:6px;font-weight:bold">Email</td><td style="padding:6px"><a href="mailto:${email}">${email}</a></td></tr>
                <tr><td style="padding:6px;font-weight:bold">Time</td><td style="padding:6px">${new Date().toLocaleString()}</td></tr>
              </table>
              <h3 style="margin-top:16px">Message</h3>
              <p style="white-space:pre-wrap">${message}</p>
            `,
          },
        })
        .catch(() => {
          /* silent — notification best-effort */
        });

      toast.success("Message sent — we'll be in touch!");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-16 max-w-xl">
        <h1 className="text-4xl font-bold mb-2">Get in touch</h1>
        <p className="text-muted-foreground mb-8">
          Have a question or feedback? We typically respond within 24 hours.
        </p>
        <Card>
          <CardContent className="p-6">
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input
                  required
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  required
                  maxLength={255}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label>Message *</Label>
                <Textarea
                  rows={5}
                  required
                  maxLength={2000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                disabled={saving}
                className="gradient-brand text-primary-foreground w-full"
              >
                {saving ? "Sending…" : "Send message"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <SiteFooter />
    </div>
  );
}
