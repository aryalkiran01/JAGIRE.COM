import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Jagire" },
      { name: "description", content: "Get in touch with the Jagire team." },
    ],
  }),
  component: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-16 max-w-xl">
        <h1 className="text-4xl font-bold mb-6">Get in touch</h1>
        <Card>
          <CardContent className="p-6 space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                toast.success("Message received — we'll be in touch!");
                (e.target as HTMLFormElement).reset();
              }}
              className="space-y-4"
            >
              <div>
                <Label>Name</Label>
                <Input required maxLength={100} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" required maxLength={255} />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea rows={5} required maxLength={1000} />
              </div>
              <Button type="submit" className="gradient-brand text-primary-foreground">
                Send message
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <SiteFooter />
    </div>
  ),
});
