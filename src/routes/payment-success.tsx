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

        // Parse eSewa response
        const encodedData = params.get("data");
        if (encodedData) {
          try {
            const decoded = atob(decodeURIComponent(encodedData));
            const payload = JSON.parse(decoded);
            transactionUuid = payload.transaction_uuid ?? "";
            totalAmount = payload.total_amount ?? "";
            paymentStatus = payload.status ?? "";
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

        if (!transactionUuid || !totalAmount) {
          setState({ status: "failed", error: "Missing payment details in the callback." });
          return;
        }

        if (paymentStatus !== "COMPLETE") {
          setState({
            status: "failed",
            error: `Payment status: ${paymentStatus || "Unknown"}. Expected COMPLETE.`,
          });
          return;
        }

        if (!user?.id) {
          setState({ status: "failed", error: "You must be signed in to complete this payment." });
          return;
        }

        // Determine plan type from transaction UUID or amount
        const amount = parseFloat(totalAmount);
        let planType = getPlanByAmount(amount);

        // Fallback: try to extract from transaction UUID
        if (!planType) {
          const uuidParts = transactionUuid.split("-");
          if (uuidParts.length >= 2) {
            const possiblePlan = uuidParts[1];
            if (PLANS[possiblePlan]) {
              planType = possiblePlan;
            }
          }
        }

        if (!planType) {
          console.error("Unknown plan amount:", amount);
          setState({
            status: "failed",
            error: `Cannot determine plan for amount Rs. ${amount}`,
          });
          return;
        }

        const planName = PLANS[planType]?.name || planType;
        const durationDays = PLANS[planType]?.durationDays || 30;

        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setDate(expiresAt.getDate() + durationDays);

        console.log("Activating plan:", planType, "Plan name:", planName, "Expires:", expiresAt);

        // Store transaction
        const { error: transactionError } = await supabase.from("payments").upsert(
          {
            user_id: user.id,
            amount: amount,
            currency: "NPR",
            plan_type: planType,
            status: "completed",
            esewa_transaction_id: transactionUuid,
            esewa_ref_id: transactionUuid,
            updated_at: now.toISOString(),
          },
          { onConflict: "esewa_transaction_id" },
        );

        if (transactionError) {
          console.error("Failed to store transaction:", transactionError);
        }

        // CRITICAL FIX: Use update first, then insert if no row exists
        const { data: existingSub, error: checkError } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (checkError) {
          console.error("Failed to check existing subscription:", checkError);
        }

        let subscriptionError = null;

        if (existingSub?.id) {
          // Update existing subscription with new plan
          const { error: updateError } = await supabase
            .from("subscriptions")
            .update({
              plan_type: planType,
              status: "active",
              payment_status: "paid",
              transaction_id: transactionUuid,
              amount: amount,
              currency: "NPR",
              started_at: now.toISOString(),
              expires_at: expiresAt.toISOString(),
              updated_at: now.toISOString(),
            })
            .eq("user_id", user.id);

          subscriptionError = updateError;
        } else {
          // Insert new subscription
          const { error: insertError } = await supabase.from("subscriptions").insert({
            user_id: user.id,
            plan_type: planType,
            status: "active",
            payment_status: "paid",
            transaction_id: transactionUuid,
            amount: amount,
            currency: "NPR",
            started_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
          });

          subscriptionError = insertError;
        }

        if (subscriptionError) {
          console.error("Failed to update subscription:", subscriptionError);
        }

        // Update profile
        const { error: profileError } = await supabase.from("profiles").upsert(
          {
            id: user.id,
            subscription_status: "active",
            subscription_plan: planType,
            subscription_expires_at: expiresAt.toISOString(),
            updated_at: now.toISOString(),
          },
          { onConflict: "id" },
        );

        if (profileError) {
          console.error("Failed to update profile:", profileError);
        }

        // CRITICAL: Invalidate and refetch subscription query
        await queryClient.invalidateQueries({ queryKey: ["subscription", user.id] });
        await queryClient.refetchQueries({ queryKey: ["subscription", user.id] });

        setState({
          status: "verified",
          plan_type: planType,
          plan_name: planName,
          expires_at: expiresAt.toISOString(),
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
