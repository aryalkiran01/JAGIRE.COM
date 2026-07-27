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
  const navigate = useNavigate();
  const { user } = useAuth();
  const [state, setState] = useState<VerifyState>({ status: "verifying" });

  useEffect(() => {
    (async () => {
      try {
        console.log("Full URL:", window.location.href);
        console.log("Search:", window.location.search);

        const params = new URLSearchParams(window.location.search);
        let transactionUuid = "";
        let totalAmount = "";
        let paymentStatus = "";

        const encodedData = params.get("data");
        if (encodedData) {
          try {
            const decoded = atob(decodeURIComponent(encodedData));
            console.log("Decoded:", decoded);

            const payload = JSON.parse(decoded);
            console.log("Parsed payload:", payload);

            transactionUuid = payload.transaction_uuid ?? "";
            totalAmount = payload.total_amount ?? "";
            paymentStatus = payload.status ?? "";
          } catch (err) {
            console.error("Failed to parse eSewa callback:", err);
            setState({
              status: "failed",
              error: "Invalid response from eSewa",
            });
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

        console.log({ transactionUuid, totalAmount, paymentStatus });

        if (!transactionUuid || !totalAmount) {
          setState({
            status: "failed",
            error: "Missing payment details in the callback.",
          });
          return;
        }

        // Check payment status from eSewa
        if (paymentStatus !== "COMPLETE") {
          setState({
            status: "failed",
            error: `Payment status: ${paymentStatus || "Unknown"}. Expected COMPLETE.`,
          });
          return;
        }

        if (!user?.id) {
          setState({
            status: "failed",
            error: "You must be signed in to complete this payment.",
          });
          return;
        }

        // Determine plan type based on amount
        const amount = parseFloat(totalAmount);
        let planType = "starter";
        if (amount >= 9900) planType = "pro";
        else if (amount >= 4900) planType = "starter";

        // Calculate expiration (30 days from now)
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setDate(expiresAt.getDate() + 30);

        console.log("Activating plan:", planType, "Expires:", expiresAt);

        // Store transaction in database
        const { error: transactionError } = await supabase.from("payments").upsert(
          {
            user_id: user.id,
            amount,
            currency: "NPR",
            plan_type: planType,
            status: "completed",
            esewa_transaction_id: transactionUuid,
            esewa_ref_id: transactionUuid,
            updated_at: now.toISOString(),
          },
          {
            onConflict: "esewa_transaction_id",
          },
        );

        if (transactionError) {
          console.error("Failed to store transaction:", transactionError);
          // Continue anyway - payment was successful on eSewa
        }

        // Update or create subscription
        const { error: subscriptionError } = await supabase.from("subscriptions").upsert(
          {
            user_id: user.id,
            plan_type: planType,
            status: "active",
            payment_status: "paid",
            transaction_id: transactionUuid,
            amount: amount,
            currency: "NPR",
            started_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
            updated_at: now.toISOString(),
          },
          {
            onConflict: "user_id",
          },
        );

        if (subscriptionError) {
          console.error("Failed to update subscription:", subscriptionError);
          // Try to create if update failed
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

          if (insertError) {
            console.error("Failed to insert subscription:", insertError);
          }
        }

        // Also update user profile if you have one
        const { error: profileError } = await supabase.from("profiles").upsert(
          {
            id: user.id,
            subscription_status: "active",
            subscription_plan: planType,
            subscription_expires_at: expiresAt.toISOString(),
            updated_at: now.toISOString(),
          },
          {
            onConflict: "id",
          },
        );

        if (profileError) {
          console.error("Failed to update profile:", profileError);
          // Non-critical error, continue
        }

        console.log("Payment verified and activated successfully");

        setState({
          status: "verified",
          plan_type: planType,
          expires_at: expiresAt.toISOString(),
        });

        toast.success(
          `${planType.charAt(0).toUpperCase() + planType.slice(1)} plan activated! AI features unlocked.`,
        );
      } catch (err) {
        console.error("Verification error:", err);
        setState({
          status: "failed",
          error: err instanceof Error ? err.message : String(err),
        });
        toast.error("Payment verification failed.");
      }
    })();
  }, [user]);

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
