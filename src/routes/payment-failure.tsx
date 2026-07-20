import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export const Route = createFileRoute("/payment-failure")({
  head: () => ({ meta: [{ title: "Payment failed — Jagire" }] }),
  component: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-24 max-w-lg">
        <Card><CardContent className="p-10 text-center">
          <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Payment failed</h1>
          <p className="text-muted-foreground mb-6">Your payment could not be completed. Please try again.</p>
          <Button asChild variant="outline"><Link to="/pricing">Back to pricing</Link></Button>
        </CardContent></Card>
      </div>
      <SiteFooter />
    </div>
  ),
});