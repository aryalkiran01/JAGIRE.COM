import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/payment-success")({
  head: () => ({ meta: [{ title: "Payment successful — Jagire" }] }),
  component: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-24 max-w-lg">
        <Card>
          <CardContent className="p-10 text-center">
            <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Payment successful</h1>
            <p className="text-muted-foreground mb-6">Your plan has been activated.</p>
            <Button asChild className="gradient-brand text-primary-foreground">
              <Link to="/dashboard">Go to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      <SiteFooter />
    </div>
  ),
});
