import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";
import { getAiFeature } from "@/lib/employer-ai-features";
import { SiteHeader } from "@/components/layout/site-header";

export const Route = createFileRoute("/_authenticated/employer/ai/$featureSlug")({
  head: () => ({ meta: [{ title: "AI Feature — Jagire" }] }),
  component: AiFeaturePage,
});

function AiFeaturePage() {
  const { featureSlug } = Route.useParams();
  const feature = getAiFeature(featureSlug);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-16 max-w-lg">
        <Card className="glass shadow-card-soft">
          <CardContent className="p-10 text-center">
            {feature ? (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">{feature.title}</h1>
                <p className="text-muted-foreground mb-6">{feature.description}</p>
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary mb-6">
                  <Sparkles className="h-4 w-4" />
                  Coming soon
                </div>
                <div>
                  <Button asChild variant="outline">
                    <Link to="/employer">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to dashboard
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold mb-2">Feature not found</h1>
                <p className="text-muted-foreground mb-6">
                  The AI feature you're looking for doesn't exist.
                </p>
                <Button asChild variant="outline">
                  <Link to="/employer">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to dashboard
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
