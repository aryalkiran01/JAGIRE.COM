import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/payment-success")({
  head: () => ({ meta: [{ title: "Payment successful — Jagire" }] }),
  component: PaymentSuccess,
});

type VerifyState =
  | { status: "verifying" }
  | { status: "verified"; plan_type?: string; expires_at?: string }
  | { status: "failed"; error: string };

function PaymentSuccess() {
  const search = Route.useSearch() as Record<string, string | undefined>;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [state, setState] = useState<VerifyState>({ status: "verifying" });

  useEffect(() => {
    (async () => {
      // eSewa v2 redirects back with ?data=<base64>&signature=<base64>.
      // The `data` field is a base64-encoded string of "key=value,key=value,..."
      // containing transaction_uuid, total_amount, status, transaction_code, etc.
      // We decode it here, then verify server-side (authoritative).
      const params = new URLSearchParams(window.location.search);
      let transactionUuid = "";
      let totalAmount = "";

      const encodedData = params.get("data");
      const encodedSig = params.get("signature");
      if (encodedData) {
        try {
          const decoded = atob(encodedData);
          const pairs = decoded.split(",");
          const map: Record<string, string> = {};
          for (const p of pairs) {
            const [k, v] = p.split("=");
            if (k) map[k.trim()] = (v ?? "").trim();
          }
          transactionUuid = map.transaction_uuid ?? "";
          totalAmount = map.total_amount ?? "";
        } catch {
          // fall through to legacy params
        }
      }

      // Legacy / fallback params
      if (!transactionUuid) transactionUuid = params.get("transaction_uuid") ?? params.get("oid") ?? "";
      if (!totalAmount) totalAmount = params.get("total_amount") ?? params.get("amt") ?? "";

      if (!transactionUuid || !totalAmount) {
        setState({ status: "failed", error: "Missing payment details in the callback." });
        return;
      }

      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-esewa-payment`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            transaction_uuid: transactionUuid,
            total_amount: totalAmount,
            user_id: user?.id,
          }),
        });

        const data = await res.json();

        if (res.ok && data.verified) {
          setState({
            status: "verified",
            plan_type: data.plan_type,
            expires_at: data.expires_at,
          });
          toast.success("Premium activated! AI features unlocked.");
        } else {
          setState({
            status: "failed",
            error: data?.error ?? "Payment could not be verified by eSewa.",
          });
          toast.error("Payment verification failed.");
        }
      } catch (err) {
        setState({ status: "failed", error: String(err) });
        toast.error("Unable to reach payment verification service.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-24 max-w-lg">
        <Card>
          <CardContent className="p-10 text-center">
            {state.status === "verifying" && (
              <>
                <Loader2 className="h-16 w-16 text-primary mx-auto mb-4 animate-spin" />
                <h1 className="text-2xl font-bold mb-2">Verifying your payment…</h1>
                <p className="text-muted-foreground mb-6">
                  Please wait while we confirm with eSewa.
                </p>
              </>
            )}
            {state.status === "verified" && (
              <>
                <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-2">Payment successful</h1>
                <p className="text-muted-foreground mb-6">
                  Your {state.plan_type ?? "premium"} plan has been activated
                  {state.expires_at
                    ? ` until ${new Date(state.expires_at).toLocaleDateString()}`
                    : ""}
                  . AI features are now unlocked.
                </p>
                <Button asChild className="gradient-brand text-primary-foreground">
                  <Link to="/dashboard">Go to dashboard</Link>
                </Button>
              </>
            )}
            {state.status === "failed" && (
              <>
                <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-2">Payment not verified</h1>
                <p className="text-muted-foreground mb-6">{state.error}</p>
                <Button asChild variant="outline">
                  <Link to="/pricing">Back to pricing</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <SiteFooter />
    </div>
  );
}
