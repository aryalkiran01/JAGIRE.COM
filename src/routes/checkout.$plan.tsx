import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useMemo, useRef } from "react";

// eSewa v2 (ePay) test-mode credentials — publicly documented
// See https://developer.esewa.com.np/pages/Epay
const ESEWA_URL = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
const MERCHANT_CODE = "EPAYTEST";
const SECRET = "8gBm/:&EnhH.1/q";

const PLANS: Record<string, { name: string; price: number; features: string[] }> = {
  starter: {
    name: "Employer Starter",
    price: 4900, // NPR
    features: ["3 active job posts", "AI candidate ranking", "Applicant management", "Email support"],
  },
  pro: {
    name: "Pro",
    price: 9900,
    features: ["10 active job posts", "Priority AI matching", "Interview scheduling", "Priority support"],
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

export const Route = createFileRoute("/checkout/$plan")({
  head: () => ({ meta: [{ title: "Checkout — Jagire" }, { name: "description", content: "Complete your purchase with eSewa." }] }),
  component: Checkout,
});

function Checkout() {
  const { plan } = Route.useParams();
  const p = PLANS[plan];
  const formRef = useRef<HTMLFormElement>(null);
  const txnId = useMemo(() => `JAG-${Date.now()}`, []);

  if (!p) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container mx-auto px-4 py-16 max-w-lg text-center">
          <h1 className="text-3xl font-bold mb-4">Plan not found</h1>
          <Button asChild><Link to="/pricing">Back to pricing</Link></Button>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const successUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/payment-success`;
  const failureUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/payment-failure`;

  async function pay() {
    const amount = p.price.toString();
    const tax = "0";
    const totalAmount = amount;
    const productServiceCharge = "0";
    const productDeliveryCharge = "0";
    const signedFieldNames = "total_amount,transaction_uuid,product_code";
    const message = `total_amount=${totalAmount},transaction_uuid=${txnId},product_code=${MERCHANT_CODE}`;
    const signature = await hmacSha256Base64(message, SECRET);

    const form = formRef.current!;
    (form.elements.namedItem("amount") as HTMLInputElement).value = amount;
    (form.elements.namedItem("tax_amount") as HTMLInputElement).value = tax;
    (form.elements.namedItem("total_amount") as HTMLInputElement).value = totalAmount;
    (form.elements.namedItem("transaction_uuid") as HTMLInputElement).value = txnId;
    (form.elements.namedItem("product_code") as HTMLInputElement).value = MERCHANT_CODE;
    (form.elements.namedItem("product_service_charge") as HTMLInputElement).value = productServiceCharge;
    (form.elements.namedItem("product_delivery_charge") as HTMLInputElement).value = productDeliveryCharge;
    (form.elements.namedItem("success_url") as HTMLInputElement).value = successUrl;
    (form.elements.namedItem("failure_url") as HTMLInputElement).value = failureUrl;
    (form.elements.namedItem("signed_field_names") as HTMLInputElement).value = signedFieldNames;
    (form.elements.namedItem("signature") as HTMLInputElement).value = signature;
    form.submit();
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-16 max-w-lg">
        <Card>
          <CardContent className="p-8">
            <h1 className="text-2xl font-bold mb-2">{p.name}</h1>
            <div className="text-4xl font-bold my-4 gradient-text">Rs. {p.price.toLocaleString()}</div>
            <ul className="space-y-2 mb-6 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2"><Check className="h-4 w-4 text-primary" />{f}</li>
              ))}
            </ul>
            <div className="text-xs text-muted-foreground mb-4">
              Order ID: <span className="font-mono">{txnId}</span>
            </div>
            <Button onClick={pay} className="w-full gradient-brand text-primary-foreground">
              Pay with eSewa
            </Button>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Test mode. Use eSewa test credentials at checkout.
            </p>
            <form ref={formRef} action={ESEWA_URL} method="POST" className="hidden">
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