import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({ meta: [{ title: "Pricing — Jagire" }, { name: "description", content: "Simple pricing. Free for job seekers, flexible plans for employers." }] }),
  component: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="text-center mb-12"><h1 className="text-4xl font-bold mb-2">Simple, fair pricing</h1><p className="text-muted-foreground">Free forever for job seekers. Employers pay only for results.</p></div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: "Free", price: "$0", features: ["Unlimited job search", "AI resume scan", "5 applications/day", "Basic career tips"], cta: "Get started", to: "/auth", featured: false },
            { name: "Employer Starter", price: "$49/mo", features: ["3 active job posts", "AI candidate ranking", "Applicant management", "Email support"], cta: "Start hiring", to: "/auth", featured: true },
            { name: "Enterprise", price: "Custom", features: ["Unlimited job posts", "Priority AI matching", "Google Meet integration", "Dedicated support"], cta: "Contact sales", to: "/contact", featured: false },
          ].map((p) => (
            <Card key={p.name} className={p.featured ? "border-primary shadow-glow" : ""}><CardContent className="p-6">
              <h3 className="font-bold text-lg">{p.name}</h3>
              <div className="text-4xl font-bold my-4 gradient-text">{p.price}</div>
              <ul className="space-y-2 mb-6 text-sm">{p.features.map((f) => <li key={f} className="flex gap-2"><Check className="h-4 w-4 text-primary flex-shrink-0" />{f}</li>)}</ul>
              <Button asChild className={`w-full ${p.featured ? "gradient-brand text-primary-foreground" : ""}`} variant={p.featured ? "default" : "outline"}><Link to={p.to}>{p.cta}</Link></Button>
            </CardContent></Card>
          ))}
        </div>
      </div>
      <SiteFooter />
    </div>
  ),
});