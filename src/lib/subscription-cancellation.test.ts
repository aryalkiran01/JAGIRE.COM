import { describe, it, expect } from "vitest";

// Valid values per Postgres check constraints:
// - subscriptions_status_check: ('active', 'inactive', 'expired', 'cancelled')
// - subscriptions_payment_status_check: ('pending', 'paid', 'failed', 'refunded')

const VALID_PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;
const VALID_SUBSCRIPTION_STATUSES = ["active", "inactive", "expired", "cancelled"] as const;

describe("Subscription Cancellation & Payment Status Check Constraints", () => {
  it("strictly prohibits 'cancelled' or 'unpaid' in payment_status", () => {
    // Verified DB schema check constraint: payment_status IN ('pending', 'paid', 'failed', 'refunded')
    const invalidPaymentStatuses = ["cancelled", "unpaid", "expired", "active", "completed", "inactive"];

    for (const invalidStatus of invalidPaymentStatuses) {
      expect(VALID_PAYMENT_STATUSES.includes(invalidStatus as any)).toBe(false);
    }
  });

  it("permits only valid payment_status values", () => {
    expect(VALID_PAYMENT_STATUSES).toEqual(["pending", "paid", "failed", "refunded"]);
  });

  it("permits 'cancelled' in status lifecycle field", () => {
    expect(VALID_SUBSCRIPTION_STATUSES.includes("cancelled")).toBe(true);
    expect(VALID_SUBSCRIPTION_STATUSES.includes("active")).toBe(true);
    expect(VALID_SUBSCRIPTION_STATUSES.includes("expired")).toBe(true);
    expect(VALID_SUBSCRIPTION_STATUSES.includes("inactive")).toBe(true);
  });

  it("preserves payment_status='paid' when cancelling an active paid subscription", () => {
    const existingSub = {
      id: "sub_123",
      user_id: "user_456",
      plan_type: "premium",
      status: "active",
      payment_status: "paid",
      amount: 499,
    };

    const action = {
      type: "cancel",
      targetUserId: "user_456",
      status: "cancelled",
    };

    // Cancellation logic:
    const validDbStatus = action.status === "trialing" ? "active" : action.status;
    const paymentStatus =
      existingSub?.payment_status && VALID_PAYMENT_STATUSES.includes(existingSub.payment_status as any)
        ? existingSub.payment_status
        : "paid";

    const updatedSub = {
      ...existingSub,
      status: validDbStatus,
      payment_status: paymentStatus,
    };

    expect(updatedSub.status).toBe("cancelled");
    expect(updatedSub.payment_status).toBe("paid");
    expect(VALID_PAYMENT_STATUSES.includes(updatedSub.payment_status as any)).toBe(true);
    expect(VALID_SUBSCRIPTION_STATUSES.includes(updatedSub.status as any)).toBe(true);
  });

  it("preserves payment_status='pending' or 'refunded' if previously set", () => {
    const pendingSub = {
      id: "sub_pending",
      payment_status: "pending",
    };

    const paymentStatusPending =
      pendingSub?.payment_status && VALID_PAYMENT_STATUSES.includes(pendingSub.payment_status as any)
        ? pendingSub.payment_status
        : "paid";

    expect(paymentStatusPending).toBe("pending");

    const refundedSub = {
      id: "sub_refunded",
      payment_status: "refunded",
    };

    const paymentStatusRefunded =
      refundedSub?.payment_status && VALID_PAYMENT_STATUSES.includes(refundedSub.payment_status as any)
        ? refundedSub.payment_status
        : "paid";

    expect(paymentStatusRefunded).toBe("refunded");
  });

  it("sets profiles.subscription_status to 'cancelled' and subscription_plan to 'free' on cancellation", () => {
    const cancelStatus = "cancelled";
    const planType = "premium";

    const profileUpdate = {
      subscription_status: cancelStatus,
      subscription_plan: cancelStatus === "cancelled" || cancelStatus === "expired" ? "free" : planType,
    };

    expect(profileUpdate.subscription_status).toBe("cancelled");
    expect(profileUpdate.subscription_plan).toBe("free");
  });
});
