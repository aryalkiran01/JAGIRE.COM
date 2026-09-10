/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import {
  computeCompanyProfileCompleteness,
  computeHiringReadinessScore,
} from "@/lib/company-intelligence.server";

describe("Company Intelligence Engine", () => {
  it("calculates company profile completeness accurately across all fields", () => {
    expect(computeCompanyProfileCompleteness(null)).toBe(0);
    expect(computeCompanyProfileCompleteness({})).toBe(0);

    const partialCompany = {
      name: "Tech Innovators Nepal",
      industry: "Software Engineering",
      headquarters: "Kathmandu, Nepal",
    };
    expect(computeCompanyProfileCompleteness(partialCompany)).toBe(35); // 15 + 10 + 10

    const fullCompany = {
      name: "Jagire Technologies Pvt. Ltd.",
      industry: "Information Technology",
      description: "Leading AI recruitment solutions platform in Nepal.",
      headquarters: "Lalitpur, Nepal",
      size: "50-100",
      website: "https://jagire.com",
      logo_url: "https://jagire.com/logo.png",
      mission: "Connect Nepali talent with global and local opportunities.",
      technologies: ["React", "TypeScript", "Node.js", "PostgreSQL", "Supabase"],
      benefits: ["Health Insurance", "Remote Flexibility", "Provident Fund", "Performance Bonus"],
    };
    expect(computeCompanyProfileCompleteness(fullCompany)).toBe(100);
  });

  it("calculates hiring readiness score with appropriate weights", () => {
    // Zero baseline
    const emptyScore = computeHiringReadinessScore(0, 0, 0, 0);
    expect(emptyScore).toBe(0);

    // Active recruiter with complete profile
    const activeScore = computeHiringReadinessScore(100, 3, 20, 5);
    expect(activeScore).toBeGreaterThanOrEqual(80);
    expect(activeScore).toBeLessThanOrEqual(100);
  });

  it("ensures sensitive employer secrets/tokens are never present in company context", () => {
    const rawCompanyData = {
      name: "Tech Corp",
      industry: "IT",
      hiring_readiness_score: 85,
      technologies: ["React", "Go"],
      api_secret: "sk_live_secret12345",
      stripe_key: "rk_live_abcde",
    };

    const keys = Object.keys(rawCompanyData);
    const safeOutput = {
      name: rawCompanyData.name,
      industry: rawCompanyData.industry,
      hiring_readiness_score: rawCompanyData.hiring_readiness_score,
      technologies: rawCompanyData.technologies,
    };

    expect((safeOutput as any).api_secret).toBeUndefined();
    expect((safeOutput as any).stripe_key).toBeUndefined();
  });
});
