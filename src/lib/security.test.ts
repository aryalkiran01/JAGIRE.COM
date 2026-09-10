import { describe, it, expect } from "vitest";
import { sanitizeSignupRole } from "./role-sanitizer";
import {
  computeHmacSha256,
  verifyEsewaSignature,
  verifyPlanFromAmount,
  validatePaymentCallbackParams,
  EsewaCallbackPayload,
} from "./payment-security";

describe("P0-3: Signup Role Sanitization & Allowlist Enforcement", () => {
  it("allows legitimate job_seeker and seeker roles", () => {
    expect(sanitizeSignupRole("job_seeker")).toBe("job_seeker");
    expect(sanitizeSignupRole("seeker")).toBe("job_seeker");
    expect(sanitizeSignupRole("JOB_SEEKER")).toBe("job_seeker");
    expect(sanitizeSignupRole(" seeker ")).toBe("job_seeker");
  });

  it("allows legitimate employer role", () => {
    expect(sanitizeSignupRole("employer")).toBe("employer");
    expect(sanitizeSignupRole("EMPLOYER")).toBe("employer");
    expect(sanitizeSignupRole(" employer ")).toBe("employer");
  });

  it("strictly prevents self-assignment of 'admin' role through signup metadata", () => {
    expect(sanitizeSignupRole("admin")).toBe("job_seeker");
    expect(sanitizeSignupRole("ADMIN")).toBe("job_seeker");
    expect(sanitizeSignupRole(" admin ")).toBe("job_seeker");
    expect(sanitizeSignupRole("super_admin")).toBe("job_seeker");
    expect(sanitizeSignupRole("moderator")).toBe("job_seeker");
    expect(sanitizeSignupRole("staff")).toBe("job_seeker");
  });

  it("safely falls back to 'job_seeker' for invalid, empty, or malicious inputs", () => {
    expect(sanitizeSignupRole(undefined)).toBe("job_seeker");
    expect(sanitizeSignupRole(null)).toBe("job_seeker");
    expect(sanitizeSignupRole("")).toBe("job_seeker");
    expect(sanitizeSignupRole("   ")).toBe("job_seeker");
    expect(sanitizeSignupRole("hacker")).toBe("job_seeker");
    expect(sanitizeSignupRole("admin' OR '1'='1")).toBe("job_seeker");
    expect(sanitizeSignupRole("<script>alert('admin')</script>")).toBe("job_seeker");
    expect(sanitizeSignupRole(12345)).toBe("job_seeker");
    expect(sanitizeSignupRole({})).toBe("job_seeker");
  });
});

describe("P0-1: eSewa Payment Signature & Tamper Detection", () => {
  const secretKey = "test_merchant_secret_key_12345";
  const validTxnUuid = "JAG-premium-1725900000000";
  const validAmount = "499";
  const merchantCode = "EPAYTEST";

  it("verifies valid HMAC-SHA256 Base64 signatures correctly", async () => {
    const message = `total_amount=${validAmount},transaction_uuid=${validTxnUuid},product_code=${merchantCode}`;
    const { base64 } = await computeHmacSha256(message, secretKey);

    const payload: EsewaCallbackPayload = {
      transaction_uuid: validTxnUuid,
      total_amount: validAmount,
      product_code: merchantCode,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature: base64,
    };

    const isValid = await verifyEsewaSignature(payload, secretKey);
    expect(isValid).toBe(true);
  });

  it("verifies valid HMAC-SHA256 Hex signatures correctly", async () => {
    const message = `total_amount=${validAmount},transaction_uuid=${validTxnUuid},product_code=${merchantCode}`;
    const { hex } = await computeHmacSha256(message, secretKey);

    const payload: EsewaCallbackPayload = {
      transaction_uuid: validTxnUuid,
      total_amount: validAmount,
      product_code: merchantCode,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature: hex,
    };

    const isValid = await verifyEsewaSignature(payload, secretKey);
    expect(isValid).toBe(true);
  });

  it("rejects signatures when total_amount has been tampered with (price tampering attack)", async () => {
    // Legitimate signature generated for Rs. 499
    const originalMessage = `total_amount=499,transaction_uuid=${validTxnUuid},product_code=${merchantCode}`;
    const { base64 } = await computeHmacSha256(originalMessage, secretKey);

    // Attacker modifies total_amount to Rs. 1
    const tamperedPayload: EsewaCallbackPayload = {
      transaction_uuid: validTxnUuid,
      total_amount: "1",
      product_code: merchantCode,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature: base64,
    };

    const isValid = await verifyEsewaSignature(tamperedPayload, secretKey);
    expect(isValid).toBe(false);
  });

  it("rejects signatures when transaction_uuid has been tampered with", async () => {
    const originalMessage = `total_amount=${validAmount},transaction_uuid=${validTxnUuid},product_code=${merchantCode}`;
    const { base64 } = await computeHmacSha256(originalMessage, secretKey);

    const tamperedPayload: EsewaCallbackPayload = {
      transaction_uuid: "JAG-premium-different-uuid",
      total_amount: validAmount,
      product_code: merchantCode,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature: base64,
    };

    const isValid = await verifyEsewaSignature(tamperedPayload, secretKey);
    expect(isValid).toBe(false);
  });

  it("rejects signatures signed with an incorrect secret key", async () => {
    const message = `total_amount=${validAmount},transaction_uuid=${validTxnUuid},product_code=${merchantCode}`;
    const { base64 } = await computeHmacSha256(message, "wrong_secret_key");

    const payload: EsewaCallbackPayload = {
      transaction_uuid: validTxnUuid,
      total_amount: validAmount,
      product_code: merchantCode,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature: base64,
    };

    const isValid = await verifyEsewaSignature(payload, secretKey);
    expect(isValid).toBe(false);
  });

  it("rejects payloads missing signatures or signed field names", async () => {
    const payloadNoSig: EsewaCallbackPayload = {
      transaction_uuid: validTxnUuid,
      total_amount: validAmount,
      product_code: merchantCode,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature: "",
    };
    expect(await verifyEsewaSignature(payloadNoSig, secretKey)).toBe(false);

    const payloadNoFields: EsewaCallbackPayload = {
      transaction_uuid: validTxnUuid,
      total_amount: validAmount,
      product_code: merchantCode,
      signed_field_names: "",
      signature: "some-signature",
    };
    expect(await verifyEsewaSignature(payloadNoFields, secretKey)).toBe(false);
  });
});

describe("P0-1: Server-Side Plan & Price Verification", () => {
  it("correctly resolves official plans from exact prices", () => {
    const premiumPlan = verifyPlanFromAmount(499);
    expect(premiumPlan).not.toBeNull();
    expect(premiumPlan?.slug).toBe("premium");
    expect(premiumPlan?.price).toBe(499);

    const starterPlan = verifyPlanFromAmount(1999);
    expect(starterPlan).not.toBeNull();
    expect(starterPlan?.slug).toBe("starter");
    expect(starterPlan?.price).toBe(1999);

    const proPlan = verifyPlanFromAmount(4999);
    expect(proPlan).not.toBeNull();
    expect(proPlan?.slug).toBe("professional");
    expect(proPlan?.price).toBe(4999);
  });

  it("rejects unauthorized, arbitrary, or zero amounts", () => {
    expect(verifyPlanFromAmount(0)).toBeNull();
    expect(verifyPlanFromAmount(1)).toBeNull();
    expect(verifyPlanFromAmount(100)).toBeNull();
    expect(verifyPlanFromAmount(500)).toBeNull();
    expect(verifyPlanFromAmount(999)).toBeNull();
    expect(verifyPlanFromAmount(-499)).toBeNull();
  });

  it("validates callback parameters and rejects non-COMPLETE status", () => {
    const valid = validatePaymentCallbackParams({
      transaction_uuid: "JAG-premium-123",
      total_amount: "499",
      status: "COMPLETE",
      signature: "valid-sig",
      signed_field_names: "total_amount,transaction_uuid",
    });
    expect(valid.isValid).toBe(true);

    const failedStatus = validatePaymentCallbackParams({
      transaction_uuid: "JAG-premium-123",
      total_amount: "499",
      status: "FAILED",
      signature: "valid-sig",
      signed_field_names: "total_amount,transaction_uuid",
    });
    expect(failedStatus.isValid).toBe(false);
    expect(failedStatus.error).toContain("Invalid payment status");

    const missingTxn = validatePaymentCallbackParams({
      transaction_uuid: "",
      total_amount: "499",
      status: "COMPLETE",
      signature: "valid-sig",
      signed_field_names: "total_amount,transaction_uuid",
    });
    expect(missingTxn.isValid).toBe(false);
    expect(missingTxn.error).toContain("Missing transaction_uuid");

    const unrecognizedAmount = validatePaymentCallbackParams({
      transaction_uuid: "JAG-premium-123",
      total_amount: "150",
      status: "COMPLETE",
      signature: "valid-sig",
      signed_field_names: "total_amount,transaction_uuid",
    });
    expect(unrecognizedAmount.isValid).toBe(false);
    expect(unrecognizedAmount.error).toContain("No recognized plan for amount");
  });
});

describe("P0-1 & P0-2: Idempotency & User Binding Security Model", () => {
  interface PaymentVerificationRecord {
    transaction_uuid: string;
    user_id: string;
    verified: boolean;
    total_amount: number;
    plan_type: string;
  }

  // Simulated server-side verification handler mimicking verify-esewa-payment Edge Function
  function processPaymentVerification(
    callerUserId: string,
    payload: { transaction_uuid: string; total_amount: string },
    dbStore: Map<string, PaymentVerificationRecord>,
  ): { status: number; verified: boolean; already_activated?: boolean; error?: string } {
    const amount = Number(payload.total_amount);
    const plan = verifyPlanFromAmount(amount);

    if (!plan) {
      return { status: 400, verified: false, error: `No plan matches amount Rs. ${amount}` };
    }

    const existing = dbStore.get(payload.transaction_uuid);
    if (existing?.verified) {
      if (existing.user_id !== callerUserId) {
        return {
          status: 403,
          verified: false,
          error: "Transaction was already claimed by another user.",
        };
      }
      return {
        status: 200,
        verified: true,
        already_activated: true,
      };
    }

    // Record verified transaction
    dbStore.set(payload.transaction_uuid, {
      transaction_uuid: payload.transaction_uuid,
      user_id: callerUserId,
      verified: true,
      total_amount: amount,
      plan_type: plan.slug,
    });

    return {
      status: 200,
      verified: true,
      already_activated: false,
    };
  }

  it("activates subscription on first valid verification and safely detects replays (idempotency)", () => {
    const db = new Map<string, PaymentVerificationRecord>();
    const userId = "user-1111-aaaa";
    const txnUuid = "JAG-premium-9999";

    // First attempt -> Activates
    const firstResult = processPaymentVerification(
      userId,
      { transaction_uuid: txnUuid, total_amount: "499" },
      db,
    );
    expect(firstResult.status).toBe(200);
    expect(firstResult.verified).toBe(true);
    expect(firstResult.already_activated).toBe(false);
    expect(db.size).toBe(1);

    // Second attempt (replay callback) -> Returns already_activated without creating duplicate
    const secondResult = processPaymentVerification(
      userId,
      { transaction_uuid: txnUuid, total_amount: "499" },
      db,
    );
    expect(secondResult.status).toBe(200);
    expect(secondResult.verified).toBe(true);
    expect(secondResult.already_activated).toBe(true);
    expect(db.size).toBe(1);
  });

  it("blocks cross-user transaction replay attacks", () => {
    const db = new Map<string, PaymentVerificationRecord>();
    const legitimateUser = "user-legit-123";
    const attackerUser = "user-attacker-666";
    const txnUuid = "JAG-pro-7777";

    // Legitimate user completes payment
    processPaymentVerification(
      legitimateUser,
      { transaction_uuid: txnUuid, total_amount: "4999" },
      db,
    );

    // Attacker attempts to claim legitimate user's transaction
    const attackResult = processPaymentVerification(
      attackerUser,
      { transaction_uuid: txnUuid, total_amount: "4999" },
      db,
    );

    expect(attackResult.status).toBe(403);
    expect(attackResult.verified).toBe(false);
    expect(attackResult.error).toContain("already claimed by another user");
  });
});
