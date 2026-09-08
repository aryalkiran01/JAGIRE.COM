import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { getPlanByAmount, PLANS } from "@/lib/plans";
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
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        let transactionUuid = "";
        let totalAmount = "";
        let paymentStatus = "";

        let signature = "";
        let signedFieldNames = "";

        // Parse eSewa response
        const encodedData = params.get("data");
        if (encodedData) {
          try {
            const decoded = atob(decodeURIComponent(encodedData));
            const payload = JSON.parse(decoded);
            transactionUuid = payload.transaction_uuid ?? "";
            totalAmount = payload.total_amount ?? "";
            paymentStatus = payload.status ?? "";
            signature = payload.signature ?? "";
            signedFieldNames = payload.signed_field_names ?? "";
          } catch (err) {
            console.error("Failed to parse eSewa callback:", err);
            setState({ status: "failed", error: "Invalid response from eSewa" });
            return;
          }
        }

        // Fallback params
        if (!transactionUuid) {
          transactionUuid = params.get("transaction_uuid") ?? params.get("oid") ?? "";
        }
        if (!totalAmount) {
          totalAmount = params.get("total_amount") ?? params.get("amt") ?? "";
        }
        if (!signature) {
          signature = params.get("signature") ?? params.get("esewa_signature") ?? "";
        }
        if (!signedFieldNames) {
          signedFieldNames =
            params.get("signed_field_names") ?? "total_amount,transaction_uuid,product_code";
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

        if (!user?.id) {
          setState({ status: "failed", error: "You must be signed in to complete this payment." });
          return;
        }

        // Invoke server-side verify-esewa-payment Edge Function
        const { data: fnData, error: fnError } = await supabase.functions.invoke(
          "verify-esewa-payment",
          {
            body: {
              transaction_uuid: transactionUuid,
              total_amount: totalAmount,
              esewa_signature: signature,
              signed_field_names: signedFieldNames,
            },
          },
        );

        if (fnError || !fnData?.verified) {
          const errMsg =
            fnError?.message || fnData?.error || "Payment verification failed server-side.";
          console.error("Payment verification failed:", errMsg, fnError, fnData);
          setState({ status: "failed", error: errMsg });
          toast.error("Payment verification failed.");
          return;
        }

        const planType = fnData.plan_type ?? getPlanByAmount(parseFloat(totalAmount)) ?? "premium";
        const planName = PLANS[planType]?.name || planType;

        // Invalidate queries so subscription & profile reflect updated state
        await queryClient.invalidateQueries({ queryKey: ["subscription"] });
        await queryClient.invalidateQueries({ queryKey: ["profile"] });
        await queryClient.refetchQueries({ queryKey: ["subscription", user.id] });

        setState({
          status: "verified",
          plan_type: planType,
          plan_name: planName,
          expires_at: fnData.expires_at,
        });

        toast.success(`${planName} plan activated! AI features unlocked.`);
      } catch (err) {
        console.error("Verification error:", err);
        setState({
          status: "failed",
          error: err instanceof Error ? err.message : String(err),
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
                  Please wait while we process your payment.
                </p>
              </>
            )}
            {state.status === "verified" && (
              <>
                <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-2">Payment successful! 🎉</h1>
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
