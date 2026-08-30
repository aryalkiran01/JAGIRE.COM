import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CircleCheck as CheckCircle2, Circle as XCircle, Loader as Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { PLANS } from "@/lib/plans";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/payment-success")({
  head: () => ({ meta: [{ title: "Payment successful — Jagire" }] }),
  component: PaymentSuccess,
});

type VerifyState =
  | { status: "verifying" }
  | { status: "verified"; plan_type?: string; plan_name?: string; expires_at?: string }
  | { status: "failed"; error: string };

function PaymentSuccess() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [state, setState] = useState<VerifyState>({ status: "verifying" });

  useEffect(() => {
    if (!user?.id) {
      setState({ status: "failed", error: "You must be signed in to complete this payment." });
      return;
    }

    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        let transactionUuid = "";
        let totalAmount = "";
        let paymentStatus = "";
        let esewaSignature = "";
        let signedFieldNames = "";

        // Parse eSewa response from the "data" param (base64-encoded JSON)
        const encodedData = params.get("data");
        if (encodedData) {
          try {
            const decoded = atob(decodeURIComponent(encodedData));
            const payload = JSON.parse(decoded);
            transactionUuid = payload.transaction_uuid ?? "";
            totalAmount = payload.total_amount ?? "";
            paymentStatus = payload.status ?? "";
            esewaSignature = payload.signature ?? "";
            signedFieldNames = payload.signed_field_names ?? "";
          } catch (err) {
            console.error("Failed to parse eSewa callback:", err);
            setState({ status: "failed", error: "Invalid response from eSewa" });
            return;
          }
        }

        // Fallback to individual params
        if (!transactionUuid) {
          transactionUuid = params.get("transaction_uuid") ?? params.get("oid") ?? "";
        }
        if (!totalAmount) {
          totalAmount = params.get("total_amount") ?? params.get("amt") ?? "";
        }
        if (!esewaSignature) {
          esewaSignature = params.get("signature") ?? "";
        }
        if (!signedFieldNames) {
          signedFieldNames = params.get("signed_field_names") ?? "";
        }

        if (!transactionUuid || !totalAmount) {
          setState({ status: "failed", error: "Missing payment details in the callback." });
          return;
        }

        if (paymentStatus && paymentStatus !== "COMPLETE") {
          setState({
            status: "failed",
            error: `Payment status: ${paymentStatus}. Expected COMPLETE.`,
          });
          return;
        }

        // Call the edge function for server-side verification
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const response = await fetch(`${supabaseUrl}/functions/v1/verify-esewa-payment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseKey}`,
            apikey: supabaseKey,
          },
          body: JSON.stringify({
            transaction_uuid: transactionUuid,
            total_amount: totalAmount,
            user_id: user.id,
            esewa_signature: esewaSignature || undefined,
            signed_field_names: signedFieldNames || undefined,
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.verified) {
          setState({
            status: "failed",
            error: result.error || "Payment verification failed. Please contact support.",
          });
          return;
        }

        if (result.already_activated) {
          const planName = result.plan_type ? PLANS[result.plan_type]?.name || result.plan_type : "your plan";
          setState({
            status: "verified",
            plan_type: result.plan_type,
            plan_name: planName,
            expires_at: result.expires_at,
          });
          toast.success(`${planName} plan is already active!`);
          return;
        }

        // Invalidate subscription query so UI updates
        await queryClient.invalidateQueries({ queryKey: ["subscription", user.id] });
        await queryClient.refetchQueries({ queryKey: ["subscription", user.id] });

        const planName = result.plan_type ? PLANS[result.plan_type]?.name || result.plan_type : "your plan";
        setState({
          status: "verified",
          plan_type: result.plan_type,
          plan_name: planName,
          expires_at: result.expires_at,
        });

        toast.success(`${planName} plan activated! AI features unlocked.`);
      } catch (err) {
        console.error("Verification error:", err);
        setState({
          status: "failed",
          error: err instanceof Error ? err.message : "Payment verification failed.",
        });
        toast.error("Payment verification failed.");
      }
    })();
  }, [user, queryClient]);

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
                  Please wait while we confirm your payment with eSewa.
                </p>
              </>
            )}
            {state.status === "verified" && (
              <>
                <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-2">Payment successful!</h1>
                <p className="text-muted-foreground mb-6">
                  Your {state.plan_name ?? state.plan_type ?? "premium"} plan has been activated
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
                <div className="flex gap-4 justify-center">
                  <Button asChild variant="outline">
                    <Link to="/pricing">Try again</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/dashboard">Go to dashboard</Link>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <SiteFooter />
    </div>
  );
}
