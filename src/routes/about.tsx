import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Jagire" },
      {
        name: "description",
        content: "Jagire is an AI-powered job portal built to make hiring human again.",
      },
    ],
  }),
  component: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-16 max-w-3xl prose dark:prose-invert">
        <h1>About Jagire</h1>
        <p>
          Jagire is an AI-first job portal built to make finding great work — and great people —
          feel effortless. We combine intelligent resume analysis, smart job matching, and real-time
          collaboration to shorten the gap between talent and opportunity.
        </p>
        <h2>Our mission</h2>
        <p>
          Empower every candidate and employer with tools that used to require expensive recruiters
          and enterprise ATS systems.
        </p>
      </div>
      <SiteFooter />
    </div>
  ),
});
