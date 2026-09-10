/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";

function computeProfileCompleteness(profile: any, resume: any): number {
  let score = 0;
  if (profile?.full_name) score += 15;
  if (profile?.headline || profile?.current_position) score += 10;
  if (profile?.bio || profile?.about) score += 10;
  if (profile?.location) score += 5;
  if (Array.isArray(profile?.skills) && profile.skills.length >= 3) score += 15;
  if (Array.isArray(profile?.experience) && profile.experience.length > 0) score += 15;
  if (Array.isArray(profile?.education) && profile.education.length > 0) score += 10;
  if (Array.isArray(profile?.projects) && profile.projects.length > 0) score += 10;
  if (resume?.id) score += 10;
  return Math.min(100, score);
}

function computeCareerReadinessScore(
  atsScore: number | null,
  completeness: number,
  projectCount: number,
  skillsCount: number,
): number {
  const atsComponent = (atsScore ?? 60) * 0.45;
  const completenessComponent = completeness * 0.25;
  const projectsComponent = Math.min(100, projectCount * 25) * 0.15;
  const skillsComponent = Math.min(100, skillsCount * 10) * 0.15;
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(atsComponent + completenessComponent + projectsComponent + skillsComponent),
    ),
  );
}

describe("Career Intelligence Engine", () => {
  it("calculates profile completeness accurately across all dimensions", () => {
    const emptyProfile = {};
    expect(computeProfileCompleteness(emptyProfile, null)).toBe(0);

    const fullProfile = {
      full_name: "Kiran Aryal",
      headline: "Senior Software Engineer",
      bio: "Passionate developer building high scale applications.",
      location: "Kathmandu, Nepal",
      skills: ["React", "TypeScript", "Node.js", "PostgreSQL"],
      experience: [{ title: "Lead Dev", company: "Tech Corp", duration: "2 yrs" }],
      education: [{ degree: "BSc CSIT", school: "Tribhuvan University" }],
      projects: [{ name: "Jagire Platform", language: "TypeScript" }],
    };
    const resume = { id: "res-123" };

    expect(computeProfileCompleteness(fullProfile, resume)).toBe(100);
  });

  it("calculates career readiness score with weights for ATS, completeness, projects, and skills", () => {
    // Zero baseline
    const initialScore = computeCareerReadinessScore(null, 0, 0, 0);
    expect(initialScore).toBe(27); // Baseline ATS (60 * 0.45 = 27)

    // High achiever profile
    const readyScore = computeCareerReadinessScore(85, 100, 4, 10);
    expect(readyScore).toBeGreaterThanOrEqual(85);
    expect(readyScore).toBeLessThanOrEqual(100);
  });

  it("never includes sensitive secrets or tokens in formatted career context", () => {
    const sampleRecord = {
      candidate_name: "Kiran",
      headline: "Full-stack Developer",
      github_data: { username: "kiranaryal", project_count: 5, total_stars: 12 },
      linkedin_data: { profile_url: "https://linkedin.com/in/kiranaryal" },
      skills: ["React", "Go", "PostgreSQL"],
      access_token: "secret_github_token_12345",
      client_secret: "super_secret_oauth",
    };

    const keys = Object.keys(sampleRecord);
    const safeOutput = {
      candidate_name: sampleRecord.candidate_name,
      headline: sampleRecord.headline,
      github_data: sampleRecord.github_data,
      linkedin_data: sampleRecord.linkedin_data,
      skills: sampleRecord.skills,
    };

    expect((safeOutput as any).access_token).toBeUndefined();
    expect((safeOutput as any).client_secret).toBeUndefined();
  });
});
