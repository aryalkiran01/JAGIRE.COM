import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
<<<<<<< HEAD
import { Check, AlertCircle } from "lucide-react";
import { useMemo, useState } from "react";

// eSewa ePay v2 Test Credentials
const ESEWA_URL = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
const MERCHANT_CODE = "EPAYTEST";
const SECRET = "8gBm/:&EnhH.1/q";

const PLANS: Record<string, { name: string; price: number; features: string[] }> = {
  starter: {
    name: "Employer Starter",
    price: 4900,
    features: [
      "3 active job posts",
      "AI candidate ranking",
      "Applicant management",
      "Email support",
    ],
  },
  pro: {
    name: "Pro",
    price: 9900,
    features: [
      "10 active job posts",
      "Priority AI matching",
      "Interview scheduling",
      "Priority support",
    ],
  },
};

async function hmacSha256Base64(message: string, secret: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  const bytes = new Uint8Array(sig);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}
=======
import { Badge } from "@/components/ui/badge";
import { Check, Sparkle, ShieldCheck, Lock, Loader as Loader2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { getPlan } from "@/lib/plans";
import { createEsewaPayment } from "@/lib/esewa.server";
>>>>>>> c0f9c442f318ac15005f01dace25c948375ffc2c

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
<<<<<<< HEAD
  const { plan } = Route.useParams();
  const p = PLANS[plan];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const txnId = useMemo(() => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `JAG-${timestamp}-${random}`;
  }, []);
=======
  const { plan: planSlug } = Route.useParams();
  const plan = getPlan(planSlug);
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const txnId = useMemo(() => `JAG-${planSlug}-${Date.now()}`, [planSlug]);
>>>>>>> c0f9c442f318ac15005f01dace25c948375ffc2c

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

<<<<<<< HEAD
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  // ✅ FIX: Clean URLs without query parameters
  // eSewa will add ?data=<base64> when redirecting back
  const successUrl = `${origin}/payment-success`;
  const failureUrl = `${origin}/payment-failure`;

  async function handlePayment() {
    try {
      setLoading(true);
      setError(null);

      const amount = p.price.toString();
      const totalAmount = amount;

      // Generate signature
      const signedFieldNames = "total_amount,transaction_uuid,product_code";
      const message = `total_amount=${totalAmount},transaction_uuid=${txnId},product_code=${MERCHANT_CODE}`;
      const signature = await hmacSha256Base64(message, SECRET);

      // Create and submit form
      const form = document.createElement("form");
      form.method = "POST";
      form.action = ESEWA_URL;
      form.acceptCharset = "UTF-8";

      const fields: Record<string, string> = {
        amount,
        tax_amount: "0",
        total_amount: totalAmount,
        transaction_uuid: txnId,
        product_code: MERCHANT_CODE,
        product_service_charge: "0",
        product_delivery_charge: "0",
        success_url: successUrl,
        failure_url: failureUrl,
        signed_field_names: signedFieldNames,
        signature,
      };

      // Add all fields as hidden inputs
      Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();

      // Clean up
      setTimeout(() => {
        if (document.body.contains(form)) {
          document.body.removeChild(form);
        }
      }, 2000);
    } catch (error) {
      console.error("Payment initiation failed:", error);
      setError("Failed to initiate payment. Please try again.");
=======
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
>>>>>>> c0f9c442f318ac15005f01dace25c948375ffc2c
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
<<<<<<< HEAD
              <div className="flex items-center gap-2 p-3 mb-4 text-sm text-red-600 bg-red-50 rounded-md">
                <AlertCircle className="h-4 w-4" />
=======
              <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
>>>>>>> c0f9c442f318ac15005f01dace25c948375ffc2c
                {error}
              </div>
            )}

            <Button
<<<<<<< HEAD
              onClick={handlePayment}
=======
              onClick={pay}
>>>>>>> c0f9c442f318ac15005f01dace25c948375ffc2c
              disabled={loading}
              className="w-full gradient-brand text-primary-foreground"
            >
              {loading ? (
<<<<<<< HEAD
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span> Processing...
                </span>
=======
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Preparing payment…
                </>
>>>>>>> c0f9c442f318ac15005f01dace25c948375ffc2c
              ) : (
                "Pay with eSewa"
              )}
            </Button>

<<<<<<< HEAD
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-xs font-medium text-amber-800 mb-2">Test Credentials:</p>
              <div className="text-xs text-amber-700 space-y-1">
                <p>
                  <strong>eSewa ID:</strong> 9806800001 (or 0002, 0003, 0004, 0005)
                </p>
                <p>
                  <strong>Password (MPIN):</strong> Nepal@123
                </p>
                <p>
                  <strong>Token (OTP):</strong> 123456
                </p>
              </div>
              <p className="text-xs text-amber-600 mt-2">
                Note: If the above password doesn't work, try: Test@123 or esewa@123
              </p>
            </div>

            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs text-blue-700">
                <strong>Testing Steps:</strong>
              </p>
              <ol className="text-xs text-blue-600 mt-1 space-y-1 list-decimal list-inside">
                <li>Click "Pay with eSewa" button</li>
                <li>Enter test eSewa ID: 9806800001</li>
                <li>Enter password and token</li>
                <li>Complete payment on eSewa test page</li>
                <li>You'll be redirected back to our site</li>
              </ol>
            </div>
=======
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
>>>>>>> c0f9c442f318ac15005f01dace25c948375ffc2c
          </CardContent>
        </Card>
      </div>
      <SiteFooter />
    </div>
  );
}
