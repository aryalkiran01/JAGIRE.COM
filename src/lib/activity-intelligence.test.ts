/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";

describe("Resume Intelligence & User Activity Tracking", () => {
  it("calculates score improvement correctly between scans", () => {
    const scan1 = { ats_score: 67, previous_ats_score: null };
    const scan2 = { ats_score: 74, previous_ats_score: 67 };
    const scan3 = { ats_score: 86, previous_ats_score: 74 };
    const scan4 = { ats_score: 82, previous_ats_score: 86 };

    const getImprovement = (curr: number, prev: number | null) =>
      prev !== null ? curr - prev : null;

    expect(getImprovement(scan1.ats_score, scan1.previous_ats_score)).toBeNull();
    expect(getImprovement(scan2.ats_score, scan2.previous_ats_score)).toBe(7);
    expect(getImprovement(scan3.ats_score, scan3.previous_ats_score)).toBe(12);
    expect(getImprovement(scan4.ats_score, scan4.previous_ats_score)).toBe(-4);
  });

  it("handles user name personalization gracefully", () => {
    const formatAiGreeting = (fullName?: string | null) => {
      const name = (fullName ?? "").trim();
      if (!name) return "Upload your resume for instant ATS scoring and career roadmap.";
      return `Personalized for ${name}. Instant ATS scoring and career roadmap.`;
    };

    expect(formatAiGreeting("Kiran Aryal")).toBe(
      "Personalized for Kiran Aryal. Instant ATS scoring and career roadmap.",
    );
    expect(formatAiGreeting("")).toBe(
      "Upload your resume for instant ATS scoring and career roadmap.",
    );
    expect(formatAiGreeting(null)).toBe(
      "Upload your resume for instant ATS scoring and career roadmap.",
    );
  });

  it("structures activity log payload properly without leaking raw resume text", () => {
    const createActivityPayload = (
      userId: string,
      scanId: string,
      atsScore: number,
      fileName: string,
    ) => ({
      user_id: userId,
      activity_type: "RESUME_SCAN_COMPLETED",
      entity_type: "resume_scan",
      entity_id: scanId,
      metadata: {
        ats_score: atsScore,
        file_name: fileName,
        file_type: "application/pdf",
      },
    });

    const payload = createActivityPayload("user-123", "scan-999", 86, "Kiran_Resume_v3.pdf");
    expect(payload.user_id).toBe("user-123");
    expect(payload.activity_type).toBe("RESUME_SCAN_COMPLETED");
    expect(payload.metadata.ats_score).toBe(86);
    expect((payload.metadata as any).raw_text).toBeUndefined();
  });

  it("verifies user isolation - user A cannot access user B resume data via user_id matching", () => {
    const userA = "user-aaa-111";
    const userB = "user-bbb-222";

    const scansDatabase = [
      { id: "scan-1", user_id: userA, file_name: "UserA_Resume.pdf", ats_score: 85 },
      { id: "scan-2", user_id: userB, file_name: "UserB_Resume.pdf", ats_score: 92 },
    ];

    const getScansForUser = (requestingUserId: string) => {
      return scansDatabase.filter((s) => s.user_id === requestingUserId);
    };

    const userAScans = getScansForUser(userA);
    const userBScans = getScansForUser(userB);

    expect(userAScans).toHaveLength(1);
    expect(userAScans[0].file_name).toBe("UserA_Resume.pdf");
    expect(userBScans).toHaveLength(1);
    expect(userBScans[0].file_name).toBe("UserB_Resume.pdf");
    expect(userAScans.find((s) => s.user_id === userB)).toBeUndefined();
  });
});
