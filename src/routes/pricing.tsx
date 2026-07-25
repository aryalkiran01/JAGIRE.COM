import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Calendar, CalendarClock, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription, PLAN_NAMES, PLAN_BENEFITS } from "@/hooks/use-subscription";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Jagire" },
      {
        name: "description",
        content: "Simple pricing. Free for job seekers, flexible plans for employers.",
      },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  const { user } = useAuth();
  const { data: sub } = useSubscription();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">Simple, fair pricing</h1>
          <p className="text-muted-foreground">
            Free forever for job seekers. Employers pay only for results.
          </p>
        </div>

        {/* Current subscription status for logged-in users */}
        {user && sub && (
          <CurrentSubscriptionCard sub={sub} />
        )}

        <div className="grid md:grid-cols-3 gap-6 mt-8">
          {[
            {
              name: "Free",
              price: "$0",
              features: PLAN_BENEFITS.free,
              cta: "Get started",
              to: "/auth",
              featured: false,
            },
            {
              name: "Employer Starter",
              price: "Rs. 4,900/mo",
              features: PLAN_BENEFITS.starter,
              cta: "Start hiring",
              to: "/checkout/starter",
              featured: true,
            },
            {
              name: "Enterprise",
              price: "Custom",
              features: PLAN_BENEFITS.enterprise,
              cta: "Contact sales",
              to: "/contact",
              featured: false,
            },
          ].map((p) => (
            <Card key={p.name} className={p.featured ? "border-primary shadow-glow" : ""}>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg">{p.name}</h3>
                <div className="text-4xl font-bold my-4 gradient-text">{p.price}</div>
                <ul className="space-y-2 mb-6 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className={`w-full ${p.featured ? "gradient-brand text-primary-foreground" : ""}`}
                  variant={p.featured ? "default" : "outline"}
                >
                  <Link to={p.to}>{p.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

function CurrentSubscriptionCard({ sub }: { sub: ReturnType<typeof useSubscription>["data"] }) {
  if (!sub) return null;

  if (!sub.isPremium) {
    return (
      <Card className="border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
        <CardContent className="p-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-200 dark:bg-amber-900 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-amber-700 dark:text-amber-300" />
            </div>
            <div>
              <div className="font-semibold">Free plan</div>
              <div className="text-sm text-muted-foreground">
                Upgrade to unlock AI-powered career tools, priority matching, and more.
              </div>
            </div>
          </div>
          <Button asChild className="gradient-brand text-primary-foreground">
            <Link to="/checkout/starter">Upgrade now</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const planLabel = PLAN_NAMES[sub.plan_type ?? ""] ?? "Premium";
  const benefits = PLAN_BENEFITS[sub.plan_type ?? ""] ?? [];
  const started = sub.started_at ? new Date(sub.started_at).toLocaleDateString() : "—";
  const expires = sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() : "—";
  const days = sub.daysRemaining ?? 0;

  return (
    <Card className="border-primary/30 shadow-glow">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full gradient-brand flex items-center justify-center">
            <Crown className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">{planLabel} plan</span>
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                Active
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {days > 0 ? `${days} days remaining` : "Expired — renew to keep AI access"}
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Start date:</span>
            <span className="font-medium">{started}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Expiry date:</span>
            <span className="font-medium">{expires}</span>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="text-sm font-medium mb-2">Your premium benefits:</div>
          <ul className="grid sm:grid-cols-2 gap-1.5 text-sm">
            {benefits.map((b) => (
              <li key={b} className="flex gap-2">
                <Check className="h-4 w-4 text-primary flex-shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        </div>

        {days <= 7 && days >= 0 && (
          <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-950 p-3 text-sm text-amber-800 dark:text-amber-300 flex items-center justify-between gap-2 flex-wrap">
            <span>Your subscription expires soon. Renew to keep your premium benefits.</span>
            <Button asChild size="sm" className="gradient-brand text-primary-foreground">
              <Link to="/checkout/starter">Renew</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
