import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";
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
  | { status: "verifying"; attempt: number; message?: string }
  | { status: "verified"; plan_type?: string; plan_name?: string; expires_at?: string | null }
  | { status: "failed"; error: string };

const MAX_RETRIES = 4;
const RETRY_DELAY_MS = 1500;

function PaymentSuccess() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [state, setState] = useState<VerifyState>({
    status: "verifying",
    attempt: 1,
    message: "Verifying your payment with eSewa…",
  });
  const verificationInProgress = useRef(false);

  useEffect(() => {
    if (verificationInProgress.current) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    let transactionUuid = "";
    let totalAmount = "";
    let paymentStatus = "";
    let signature = "";
    let signedFieldNames = "";
    let decodedPayload: Record<string, unknown> = {};

    // Parse eSewa v2 callback data (base64 encoded JSON)
    const encodedData = params.get("data");
    if (encodedData) {
      try {
        const decoded = atob(decodeURIComponent(encodedData));
        decodedPayload = JSON.parse(decoded);
        transactionUuid = String(decodedPayload.transaction_uuid ?? "");
        totalAmount = String(decodedPayload.total_amount ?? "");
        paymentStatus = String(decodedPayload.status ?? "");
        signature = String(decodedPayload.signature ?? "");
        signedFieldNames = String(decodedPayload.signed_field_names ?? "");
      } catch (err) {
        console.error("[PAYMENT_VERIFICATION_FAILED] Failed to parse eSewa callback data:", err);
        setState({ status: "failed", error: "Invalid payment callback payload from eSewa." });
        return;
      }
    }

    // Fallback URL query parameters
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
      setState({
        status: "failed",
        error: "Missing required transaction information in payment response.",
      });
      return;
    }

    if (paymentStatus && paymentStatus !== "COMPLETE") {
      setState({
        status: "failed",
        error: `Payment status returned as ${paymentStatus}. Expected COMPLETE.`,
      });
      return;
    }

    verificationInProgress.current = true;

    // Execute verification state machine with session recovery
    async function executeVerification() {
      let lastErrorMessage = "Payment verification could not be completed.";

      // 1. Actively resolve authenticated user session with graceful polling
      let activeUserId = user?.id;
      let activeToken: string | undefined;

      if (!activeUserId) {
        setState({
          status: "verifying",
          attempt: 1,
          message: "Authenticating your session…",
        });

        for (let i = 0; i < 6; i++) {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session?.user) {
            activeUserId = sessionData.session.user.id;
            activeToken = sessionData.session.access_token;
            break;
          }
          await new Promise((r) => setTimeout(r, 400));
        }
      }

      if (!activeUserId) {
        setState({
          status: "failed",
          error: "You must be signed in with your Jagire account to complete and activate this payment.",
        });
        return;
      }

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          setState({
            status: "verifying",
            attempt,
            message:
              attempt === 1
                ? "Connecting to eSewa to verify transaction…"
                : `Confirming payment status with eSewa (attempt ${attempt} of ${MAX_RETRIES})…`,
          });

          // Ensure session access token is fresh
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData.session?.access_token || activeToken;

          const requestBody = {
            transaction_uuid: transactionUuid,
            total_amount: totalAmount,
            esewa_signature: signature,
            signed_field_names: signedFieldNames,
            product_code: String(decodedPayload.product_code ?? params.get("product_code") ?? "EPAYTEST"),
            transaction_code: String(decodedPayload.transaction_code ?? params.get("transaction_code") ?? params.get("refId") ?? ""),
            status: paymentStatus || String(decodedPayload.status ?? "COMPLETE"),
            raw_data: encodedData ?? undefined,
            ...decodedPayload,
          };

          const { data: fnData, error: fnError } = await supabase.functions.invoke(
            "verify-esewa-payment",
            {
              headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
              body: requestBody,
            },
          );

          // If eSewa reported pending/processing, wait and retry
          if (fnData?.pending || fnData?.retryable) {
            console.log(
              `[PAYMENT_VERIFICATION_RETRY] Attempt ${attempt} returned pending, retrying in ${RETRY_DELAY_MS}ms…`,
            );
            if (attempt < MAX_RETRIES) {
              await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
              continue;
            }
          }

          // If function succeeded or was already verified
          if (!fnError && fnData?.verified) {
            const planType =
              fnData.plan_type ?? getPlanByAmount(parseFloat(totalAmount)) ?? "premium";
            const planName = PLANS[planType]?.name || planType;

            // Direct optimistic cache update to update all components immediately
            const activeStatus = {
              isPremium: true,
              plan_type: planType,
              plan_name: planName,
              status: "active",
              payment_status: "paid",
              expires_at: fnData.expires_at,
              daysRemaining: 30,
              isActive: true,
              isExpired: false,
              isTrialing: false,
            };

            queryClient.setQueryData(["subscription", activeUserId], activeStatus);
            queryClient.setQueryData(["subscription"], activeStatus);

            // Invalidate and refetch across the entire app
            await queryClient.invalidateQueries({ queryKey: ["subscription"] });
            await queryClient.invalidateQueries({ queryKey: ["profile"] });
            await queryClient.refetchQueries({ queryKey: ["subscription"] });
            await queryClient.refetchQueries({ queryKey: ["profile"] });

            setState({
              status: "verified",
              plan_type: planType,
              plan_name: planName,
              expires_at: fnData.expires_at,
            });

            toast.success(`${planName} plan activated! AI features unlocked.`);
            return;
          }

          // Handle hard non-retryable failure (e.g. 401, 403, missing plan)
          if (fnError || fnData?.error) {
            const errorMsg = fnData?.error || fnError?.message || "Payment verification failed.";
            lastErrorMessage = errorMsg;

            // Stop retrying immediately if it's a non-transient status or explicit non-retryable error
            const isNonRetryable =
              !fnData?.retryable && !fnData?.pending;

            if (isNonRetryable) {
              console.warn("[PAYMENT_VERIFICATION_FAILED] Non-retryable error, stopping attempts:", errorMsg);
              break;
            }

            if (attempt < MAX_RETRIES) {
              await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
              continue;
            }
          }
        } catch (err: unknown) {
          lastErrorMessage = err instanceof Error ? err.message : String(err);
          console.warn(
            `[PAYMENT_VERIFICATION_RETRY] Attempt ${attempt} exception:`,
            lastErrorMessage,
          );

          if (attempt < MAX_RETRIES) {
            await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
            continue;
          }
        }
      }

      // Safety check directly on database
      try {
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("status, plan_type, expires_at")
          .eq("user_id", activeUserId)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (sub?.status === "active") {
          const planName = PLANS[sub.plan_type]?.name || sub.plan_type || "Premium";
          const activeStatus = {
            isPremium: true,
            plan_type: sub.plan_type,
            plan_name: planName,
            status: "active",
            payment_status: "paid",
            expires_at: sub.expires_at,
            daysRemaining: 30,
            isActive: true,
            isExpired: false,
            isTrialing: false,
          };

          queryClient.setQueryData(["subscription", activeUserId], activeStatus);
          queryClient.setQueryData(["subscription"], activeStatus);
          await queryClient.invalidateQueries({ queryKey: ["subscription"] });
          await queryClient.refetchQueries({ queryKey: ["subscription"] });

          setState({
            status: "verified",
            plan_type: sub.plan_type,
            plan_name: planName,
            expires_at: sub.expires_at,
          });
          toast.success(`${planName} plan active!`);
          return;
        }
      } catch (checkErr) {
        console.warn("Safety fallback subscription check failed:", checkErr);
      }

      setState({
        status: "failed",
        error: lastErrorMessage,
      });
      toast.error("Payment verification taking longer than expected.");
    }

    executeVerification();
  }, [user, queryClient]);

  const handleManualRetry = () => {
    verificationInProgress.current = false;
    setState({
      status: "verifying",
      attempt: 1,
      message: "Retrying payment verification…",
    });
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center container mx-auto px-4 py-16 max-w-lg">
        <Card className="w-full glass shadow-card-soft border-border/60">
          <CardContent className="p-8 sm:p-10 text-center">
            {state.status === "verifying" && (
              <div className="space-y-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
                <div className="space-y-1.5">
                  <h1 className="text-2xl font-bold text-foreground">Confirming Payment…</h1>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {state.message || "Please wait while we confirm your payment with eSewa."}
                  </p>
                </div>
                <div className="pt-2">
                  <span className="text-xs text-muted-foreground/80 font-medium">
                    Do not close or refresh this page.
                  </span>
                </div>
              </div>
            )}

            {state.status === "verified" && (
              <div className="space-y-4 animate-in fade-in-50 duration-300">
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-500">
                  <CheckCircle2 className="h-9 w-9" />
                </div>
                <div className="space-y-1.5">
                  <h1 className="text-2xl font-bold text-foreground">Payment Successful! 🎉</h1>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Your {state.plan_name ?? state.plan_type ?? "Premium"} plan has been activated
                    {state.expires_at
                      ? ` until ${new Date(state.expires_at).toLocaleDateString()}`
                      : ""}
                    . AI career tools and premium features are now unlocked.
                  </p>
                </div>
                <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild className="gradient-brand text-primary-foreground font-semibold">
                    <Link to="/dashboard">Go to Dashboard</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/ai-assistant">Explore AI Tools</Link>
                  </Button>
                </div>
              </div>
            )}

            {state.status === "failed" && (
              <div className="space-y-4 animate-in fade-in-50 duration-300">
                <div className="h-16 w-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto text-destructive">
                  <XCircle className="h-9 w-9" />
                </div>
                <div className="space-y-1.5">
                  <h1 className="text-2xl font-bold text-foreground">Verification Needed</h1>
                  <p className="text-sm text-muted-foreground leading-relaxed">{state.error}</p>
                </div>
                <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={handleManualRetry} variant="default" className="gap-1.5">
                    <RefreshCw className="h-4 w-4" />
                    Retry Verification
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/pricing">Return to Pricing</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
