import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  canUseAI,
  requirePremium,
  requirePlan,
  requireEmployerPlan,
  requireSeekerPremium,
  getAITrialStatusForUser,
  activateAITrialForUser,
  PremiumRequiredError,
  TRIAL_DURATION_MS,
} from "./premium.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

vi.mock("@/integrations/supabase/client.server", () => {
  return {
    supabaseAdmin: {
      from: vi.fn(),
    },
  };
});

describe("3-Day Free AI Trial System", () => {
  const mockNow = new Date("2026-09-30T12:00:00.000Z");

  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(mockNow);
  });

  /* ─────────────────────────────────────────────────────────────
     1. TRIAL DURATION & CONFIGURATION
     ───────────────────────────────────────────────────────────── */
  describe("Trial Duration & Properties", () => {
    it("configures trial duration to exactly 72 hours (3 calendar days)", () => {
      const expectedDurationMs = 3 * 24 * 60 * 60 * 1000; // 72 hours
      expect(TRIAL_DURATION_MS).toBe(expectedDurationMs);
      expect(TRIAL_DURATION_MS / (1000 * 60 * 60)).toBe(72);
    });
  });

  /* ─────────────────────────────────────────────────────────────
     2. JOB SEEKER TRIAL LIFECYCLE
     ───────────────────────────────────────────────────────────── */
  describe("Job Seeker Trial", () => {
    it("activates 3-day trial on first AI usage for a new Job Seeker", async () => {
      const userId = "seeker_user_1";
      const profile = {
        id: userId,
        user_role: "job_seeker",
        subscription_plan: "free",
        subscription_status: "inactive",
        ai_trial_used: false,
        ai_trial_status: "not_started",
        ai_trial_started_at: null,
        ai_trial_expires_at: null,
      };

      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      (supabaseAdmin.from as any).mockImplementation((table: string) => {
        if (table === "user_roles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { role: "job_seeker" }, error: null }),
              }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: profile, error: null }),
              }),
            }),
            update: updateMock,
          };
        }
        if (table === "subscriptions") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const entitlement = await canUseAI(userId, { autoStartTrial: true });

      expect(entitlement.allowed).toBe(true);
      expect(entitlement.accessType).toBe("trial");
      expect(entitlement.role).toBe("job_seeker");
      expect(entitlement.trialActive).toBe(true);

      const expectedExpiresAt = new Date(mockNow.getTime() + TRIAL_DURATION_MS).toISOString();
      expect(entitlement.expiresAt).toBe(expectedExpiresAt);

      // Verify DB update payload
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          ai_trial_status: "active",
          ai_trial_used: true,
          ai_trial_started_at: mockNow.toISOString(),
          ai_trial_expires_at: expectedExpiresAt,
        })
      );
    });

    it("allows Job Seeker with active trial to access AI features", async () => {
      const userId = "seeker_user_active_trial";
      const startedAt = new Date(mockNow.getTime() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours ago
      const expiresAt = new Date(mockNow.getTime() + 48 * 60 * 60 * 1000).toISOString(); // 48 hours remaining

      const profile = {
        id: userId,
        user_role: "job_seeker",
        subscription_plan: "free",
        subscription_status: "inactive",
        ai_trial_used: true,
        ai_trial_status: "active",
        ai_trial_started_at: startedAt,
        ai_trial_expires_at: expiresAt,
      };

      (supabaseAdmin.from as any).mockImplementation((table: string) => {
        if (table === "user_roles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { role: "job_seeker" }, error: null }),
              }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: profile, error: null }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === "subscriptions") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const entitlement = await canUseAI(userId);
      expect(entitlement.allowed).toBe(true);
      expect(entitlement.accessType).toBe("trial");
      expect(entitlement.trialActive).toBe(true);
      expect(entitlement.trialExpired).toBe(false);

      // requireSeekerPremium should pass without throwing
      await expect(requireSeekerPremium(userId)).resolves.not.toThrow();
    });

    it("rejects Job Seeker when 3-day trial has expired and updates status to 'expired'", async () => {
      const userId = "seeker_user_expired";
      const startedAt = new Date(mockNow.getTime() - 80 * 60 * 60 * 1000).toISOString(); // 80 hours ago
      const expiresAt = new Date(mockNow.getTime() - 8 * 60 * 60 * 1000).toISOString(); // expired 8h ago

      const profile = {
        id: userId,
        user_role: "job_seeker",
        subscription_plan: "free",
        subscription_status: "inactive",
        ai_trial_used: true,
        ai_trial_status: "active",
        ai_trial_started_at: startedAt,
        ai_trial_expires_at: expiresAt,
      };

      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      (supabaseAdmin.from as any).mockImplementation((table: string) => {
        if (table === "user_roles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { role: "job_seeker" }, error: null }),
              }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: profile, error: null }),
              }),
            }),
            update: updateMock,
          };
        }
        if (table === "subscriptions") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const entitlement = await canUseAI(userId);
      expect(entitlement.allowed).toBe(false);
      expect(entitlement.reason).toBe("TRIAL_EXPIRED");
      expect(entitlement.trialExpired).toBe(true);

      // Verify trial_status was transitioned to 'expired'
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          ai_trial_status: "expired",
        })
      );

      // requirePremium must throw PremiumRequiredError with TRIAL_EXPIRED reason
      await expect(requirePremium(userId)).rejects.toThrow(PremiumRequiredError);
      await expect(requirePremium(userId)).rejects.toMatchObject({
        reason: "TRIAL_EXPIRED",
      });
    });

    it("allows Job Seeker with active paid subscription to use AI even after trial expired", async () => {
      const userId = "seeker_user_paid_after_trial";
      const profile = {
        id: userId,
        user_role: "job_seeker",
        subscription_plan: "premium",
        subscription_status: "active",
        ai_trial_used: true,
        ai_trial_status: "expired",
        ai_trial_started_at: "2026-09-01T00:00:00.000Z",
        ai_trial_expires_at: "2026-09-04T00:00:00.000Z",
      };

      const paidSub = {
        id: "sub_paid_seeker",
        user_id: userId,
        plan_type: "premium",
        status: "active",
        payment_status: "paid",
        expires_at: "2026-10-30T00:00:00.000Z",
      };

      (supabaseAdmin.from as any).mockImplementation((table: string) => {
        if (table === "user_roles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { role: "job_seeker" }, error: null }),
              }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: profile, error: null }),
              }),
            }),
          };
        }
        if (table === "subscriptions") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({ data: paidSub, error: null }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const entitlement = await canUseAI(userId);
      expect(entitlement.allowed).toBe(true);
      expect(entitlement.accessType).toBe("paid");
      expect(entitlement.planType).toBe("premium");

      await expect(requireSeekerPremium(userId)).resolves.not.toThrow();
    });
  });

  /* ─────────────────────────────────────────────────────────────
     3. EMPLOYER TRIAL LIFECYCLE
     ───────────────────────────────────────────────────────────── */
  describe("Employer Trial", () => {
    it("activates 3-day trial on first AI usage for an Employer", async () => {
      const userId = "employer_user_1";
      const profile = {
        id: userId,
        user_role: "employer",
        subscription_plan: "free",
        subscription_status: "inactive",
        ai_trial_used: false,
        ai_trial_status: "not_started",
        ai_trial_started_at: null,
        ai_trial_expires_at: null,
      };

      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      (supabaseAdmin.from as any).mockImplementation((table: string) => {
        if (table === "user_roles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { role: "employer" }, error: null }),
              }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: profile, error: null }),
              }),
            }),
            update: updateMock,
          };
        }
        if (table === "subscriptions") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const entitlement = await canUseAI(userId, { autoStartTrial: true });

      expect(entitlement.allowed).toBe(true);
      expect(entitlement.accessType).toBe("trial");
      expect(entitlement.role).toBe("employer");
      expect(entitlement.trialActive).toBe(true);

      // Employer should pass requireEmployerPlan
      await expect(requireEmployerPlan(userId, "starter")).resolves.not.toThrow();
      await expect(requirePlan(userId, ["starter", "professional", "enterprise"])).resolves.not.toThrow();
    });

    it("rejects Employer AI feature usage when trial expires without paid plan", async () => {
      const userId = "employer_user_expired";
      const profile = {
        id: userId,
        user_role: "employer",
        subscription_plan: "free",
        subscription_status: "inactive",
        ai_trial_used: true,
        ai_trial_status: "expired",
        ai_trial_started_at: "2026-09-01T00:00:00.000Z",
        ai_trial_expires_at: "2026-09-04T00:00:00.000Z",
      };

      (supabaseAdmin.from as any).mockImplementation((table: string) => {
        if (table === "user_roles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { role: "employer" }, error: null }),
              }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: profile, error: null }),
              }),
            }),
          };
        }
        if (table === "subscriptions") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const entitlement = await canUseAI(userId);
      expect(entitlement.allowed).toBe(false);
      expect(entitlement.reason).toBe("TRIAL_EXPIRED");

      await expect(requireEmployerPlan(userId, "starter")).rejects.toThrow(PremiumRequiredError);
      await expect(requireEmployerPlan(userId, "starter")).rejects.toMatchObject({
        reason: "TRIAL_EXPIRED",
        requiredPlan: "starter",
      });
    });

    it("allows Employer with professional/starter plan to access AI after trial", async () => {
      const userId = "employer_user_pro";
      const profile = {
        id: userId,
        user_role: "employer",
        subscription_plan: "professional",
        subscription_status: "active",
        ai_trial_used: true,
        ai_trial_status: "expired",
      };

      const paidSub = {
        id: "sub_paid_employer",
        user_id: userId,
        plan_type: "professional",
        status: "active",
        payment_status: "paid",
        expires_at: "2026-12-31T00:00:00.000Z",
      };

      (supabaseAdmin.from as any).mockImplementation((table: string) => {
        if (table === "user_roles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { role: "employer" }, error: null }),
              }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: profile, error: null }),
              }),
            }),
          };
        }
        if (table === "subscriptions") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({ data: paidSub, error: null }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const entitlement = await canUseAI(userId);
      expect(entitlement.allowed).toBe(true);
      expect(entitlement.accessType).toBe("paid");
      expect(entitlement.planType).toBe("professional");

      await expect(requireEmployerPlan(userId, "professional")).resolves.not.toThrow();
    });
  });

  /* ─────────────────────────────────────────────────────────────
     4. SECURITY & ABUSE PREVENTION
     ───────────────────────────────────────────────────────────── */
  describe("Security & Abuse Prevention", () => {
    it("rejects unauthenticated requests immediately", async () => {
      const entitlement = await canUseAI(undefined);
      expect(entitlement.allowed).toBe(false);
      expect(entitlement.reason).toBe("UNAUTHENTICATED");

      await expect(requirePremium(undefined)).rejects.toThrow(PremiumRequiredError);
      await expect(requirePremium("")).rejects.toThrow(PremiumRequiredError);
    });

    it("prevents multiple trial activations for the same account (trial_used=true)", async () => {
      const userId = "abuser_user";
      const profile = {
        id: userId,
        user_role: "job_seeker",
        subscription_plan: "free",
        subscription_status: "inactive",
        ai_trial_used: true, // Already used!
        ai_trial_status: "expired",
        ai_trial_started_at: "2026-08-01T00:00:00.000Z",
        ai_trial_expires_at: "2026-08-04T00:00:00.000Z",
      };

      const updateMock = vi.fn();

      (supabaseAdmin.from as any).mockImplementation((table: string) => {
        if (table === "user_roles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { role: "job_seeker" }, error: null }),
              }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: profile, error: null }),
              }),
            }),
            update: updateMock,
          };
        }
        if (table === "subscriptions") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      // Attempt to activate trial again
      const trialResult = await activateAITrialForUser(userId);
      expect(trialResult.activated).toBe(false);
      expect(updateMock).not.toHaveBeenCalled();

      // Access check should still deny AI
      const entitlement = await canUseAI(userId, { autoStartTrial: true });
      expect(entitlement.allowed).toBe(false);
      expect(entitlement.reason).toBe("TRIAL_EXPIRED");
    });

    it("prevents trial reset when user switches role from job_seeker to employer", async () => {
      const userId = "role_switcher_user";
      // User created trial as seeker, now has employer role in profile
      const profile = {
        id: userId,
        user_role: "employer", // Switched to employer
        subscription_plan: "free",
        subscription_status: "inactive",
        ai_trial_used: true, // Account already used trial
        ai_trial_status: "expired",
        ai_trial_started_at: "2026-08-10T00:00:00.000Z",
        ai_trial_expires_at: "2026-08-13T00:00:00.000Z",
      };

      (supabaseAdmin.from as any).mockImplementation((table: string) => {
        if (table === "user_roles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { role: "employer" }, error: null }),
              }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: profile, error: null }),
              }),
            }),
          };
        }
        if (table === "subscriptions") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const trialResult = await activateAITrialForUser(userId);
      expect(trialResult.activated).toBe(false);

      const entitlement = await canUseAI(userId, { autoStartTrial: true });
      expect(entitlement.allowed).toBe(false);
      expect(entitlement.reason).toBe("TRIAL_EXPIRED");
    });

    it("uses authoritative server-side timestamps, impervious to client clock skew", async () => {
      const userId = "clock_tampering_user";
      const serverNow = new Date("2026-09-30T12:00:00.000Z");
      vi.setSystemTime(serverNow);

      const profile = {
        id: userId,
        user_role: "job_seeker",
        subscription_plan: "free",
        subscription_status: "inactive",
        ai_trial_used: true,
        ai_trial_status: "active",
        ai_trial_started_at: "2026-09-20T00:00:00.000Z",
        ai_trial_expires_at: "2026-09-23T00:00:00.000Z", // Expired 7 days ago on server
      };

      (supabaseAdmin.from as any).mockImplementation((table: string) => {
        if (table === "user_roles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { role: "job_seeker" }, error: null }),
              }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: profile, error: null }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === "subscriptions") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const entitlement = await canUseAI(userId);
      expect(entitlement.allowed).toBe(false);
      expect(entitlement.reason).toBe("TRIAL_EXPIRED");
    });

    it("getAITrialStatusForUser correctly computes remaining time and formatted status", async () => {
      const userId = "status_check_user";
      const startedAt = new Date(mockNow.getTime() - 20 * 60 * 60 * 1000).toISOString(); // 20h ago
      const expiresAt = new Date(mockNow.getTime() + 52 * 60 * 60 * 1000).toISOString(); // 52h remaining

      const profile = {
        id: userId,
        user_role: "job_seeker",
        subscription_plan: "free",
        subscription_status: "inactive",
        ai_trial_used: true,
        ai_trial_status: "active",
        ai_trial_started_at: startedAt,
        ai_trial_expires_at: expiresAt,
      };

      (supabaseAdmin.from as any).mockImplementation((table: string) => {
        if (table === "user_roles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { role: "job_seeker" }, error: null }),
              }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: profile, error: null }),
              }),
            }),
          };
        }
        if (table === "subscriptions") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const trialStatus = await getAITrialStatusForUser(userId);
      expect(trialStatus.status).toBe("active");
      expect(trialStatus.isActive).toBe(true);
      expect(trialStatus.isExpired).toBe(false);
      expect(trialStatus.hoursRemaining).toBe(52);
      expect(trialStatus.daysRemaining).toBe(3); // Math.ceil(52/24) = 3
    });
  });
});
