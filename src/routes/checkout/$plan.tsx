import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkle, ShieldCheck, Lock, Loader as Loader2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { getPlan } from "@/lib/plans";
import { createEsewaPayment } from "@/lib/esewa.server";

export const Route = createFileRoute("/checkout/$plan")({
  head: () => ({
    meta: [
      { title: "Checkout — Jagire" },
      { name: "description", content: "Complete your purchase with eSewa." },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const { plan: planSlug } = Route.useParams();
  const plan = getPlan(planSlug);
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const txnId = useMemo(() => `JAG-${planSlug}-${Date.now()}`, [planSlug]);

  if (!plan || plan.contactSales) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container mx-auto px-4 py-16 max-w-lg text-center">
          <h1 className="text-3xl font-bold mb-4">Plan not found</h1>
          <Button asChild>
            <Link to="/pricing">Back to pricing</Link>
          </Button>
        </div>
        <SiteFooter />
      </div>
    );
  }

  async function pay() {
    setLoading(true);
    setError(null);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const payload = await createEsewaPayment({
        data: { planSlug, origin },
      });

      const form = formRef.current!;
      (form.elements.namedItem("amount") as HTMLInputElement).value = payload.amount;
      (form.elements.namedItem("tax_amount") as HTMLInputElement).value = payload.tax_amount;
      (form.elements.namedItem("total_amount") as HTMLInputElement).value = payload.total_amount;
      (form.elements.namedItem("transaction_uuid") as HTMLInputElement).value =
        payload.transaction_uuid;
      (form.elements.namedItem("product_code") as HTMLInputElement).value = payload.product_code;
      (form.elements.namedItem("product_service_charge") as HTMLInputElement).value =
        payload.product_service_charge;
      (form.elements.namedItem("product_delivery_charge") as HTMLInputElement).value =
        payload.product_delivery_charge;
      (form.elements.namedItem("success_url") as HTMLInputElement).value = payload.success_url;
      (form.elements.namedItem("failure_url") as HTMLInputElement).value = payload.failure_url;
      (form.elements.namedItem("signed_field_names") as HTMLInputElement).value =
        payload.signed_field_names;
      (form.elements.namedItem("signature") as HTMLInputElement).value = payload.signature;
      form.action = payload.esewa_url;
      form.submit();
    } catch (e) {
      setError(String(e));
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-16 max-w-lg">
        <Card className="glass shadow-card-soft">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold">{plan.name}</h1>
              {plan.badge && (
                <Badge className="gradient-brand text-primary-foreground">⭐ {plan.badge}</Badge>
              )}
            </div>
            {plan.tagline && <p className="text-sm text-muted-foreground mb-4">{plan.tagline}</p>}
            <div className="text-4xl font-bold my-4 gradient-text">
              Rs. {plan.price.toLocaleString()}
              <span className="text-base font-normal text-muted-foreground">{plan.period}</span>
            </div>
            <ul className="space-y-2 mb-6 text-sm">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  {f}
                </li>
              ))}
            </ul>

            {plan.ai.length > 0 && (
              <div className="pt-4 border-t mb-6">
                <div className="text-xs font-semibold mb-3 flex items-center gap-1.5">
                  <Sparkle className="h-3.5 w-3.5 text-primary" />
                  AI Benefits
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {plan.ai.map((a) => (
                    <span
                      key={a}
                      className="text-[11px] rounded-md px-2 py-1 bg-primary/10 text-primary"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground mb-4">
              Order ID: <span className="font-mono">{txnId}</span>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              onClick={pay}
              disabled={loading}
              className="w-full gradient-brand text-primary-foreground"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Preparing payment…
                </>
              ) : (
                "Pay with eSewa"
              )}
            </Button>

            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Lock className="h-3 w-3" /> Secure Payment
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Cancel Anytime
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Test mode. Use eSewa test credentials at checkout.
            </p>
            <form ref={formRef} method="POST" className="hidden">
              <input type="hidden" name="amount" />
              <input type="hidden" name="tax_amount" />
              <input type="hidden" name="total_amount" />
              <input type="hidden" name="transaction_uuid" />
              <input type="hidden" name="product_code" />
              <input type="hidden" name="product_service_charge" />
              <input type="hidden" name="product_delivery_charge" />
              <input type="hidden" name="success_url" />
              <input type="hidden" name="failure_url" />
              <input type="hidden" name="signed_field_names" />
              <input type="hidden" name="signature" />
            </form>
          </CardContent>
        </Card>
      </div>
      <SiteFooter />
    </div>
  );
}
