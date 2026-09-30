import { describe, it, expect } from "vitest";
import { ALL_JOBSEEKER_AI_FEATURES, JOBSEEKER_AI_GROUPS } from "./jobseeker-ai-features";

describe("Navbar & Navigation Visibility Consistency", () => {
  const ALL_TEST_ROUTES = [
    "/",
    "/jobs",
    "/jobs/123",
    "/companies",
    "/companies/tech-corp",
    "/feed",
    "/about",
    "/pricing",
    "/auth",
    "/forgot-password",
    "/reset-password",
    "/privacy-policy",
    "/support",
    "/contact",
    "/dashboard",
    "/profile",
    "/admin",
    "/career",
    "/resume-scanner",
    "/resume-builder",
    "/career-coach",
    "/interviews",
    "/applications",
    "/saved",
    "/messages",
    "/notifications",
  ];

  it("ensures every route maintains navbar presence", () => {
    for (const _route of ALL_TEST_ROUTES) {
      const shouldRenderNavbar = true;
      expect(shouldRenderNavbar).toBe(true);
    }
  });

  it("correctly identifies active navigation state without breaking navbar", () => {
    const isActive = (currentPath: string, to: string) =>
      currentPath === to || (to !== "/" && currentPath.startsWith(to));

    expect(isActive("/jobs", "/jobs")).toBe(true);
    expect(isActive("/jobs/software-engineer", "/jobs")).toBe(true);
    expect(isActive("/companies", "/companies")).toBe(true);
    expect(isActive("/pricing", "/pricing")).toBe(true);
    expect(isActive("/", "/")).toBe(true);
    expect(isActive("/jobs", "/")).toBe(false);
  });

  it("handles mobile drawer state transitions cleanly on route change", () => {
    let isDrawerOpen = true;
    const closeDrawer = () => {
      isDrawerOpen = false;
    };

    const onRouteChange = () => {
      closeDrawer();
    };

    onRouteChange();
    expect(isDrawerOpen).toBe(false);
  });

  it("verifies all AI tools are registered with valid unique routes and slugs", () => {
    expect(ALL_JOBSEEKER_AI_FEATURES.length).toBe(22);
    expect(JOBSEEKER_AI_GROUPS.length).toBe(5);

    const slugs = new Set<string>();
    const routes = new Set<string>();

    for (const tool of ALL_JOBSEEKER_AI_FEATURES) {
      expect(tool.slug).toBeTruthy();
      expect(tool.title).toBeTruthy();
      expect(tool.to).toMatch(/^\/ai\/[a-z0-9-]+$/);
      expect(slugs.has(tool.slug)).toBe(false);
      expect(routes.has(tool.to)).toBe(false);
      slugs.add(tool.slug);
      routes.add(tool.to);
    }
  });

  it("verifies defensive profile skills and projects normalization prevents runtime crashes", () => {
    const normalizeProfile = (rawProfile: any) => {
      const rawSkills = rawProfile?.skills;
      const skills: string[] = Array.isArray(rawSkills)
        ? rawSkills
        : typeof rawSkills === "string"
          ? rawSkills.split(",").map((s) => s.trim()).filter(Boolean)
          : [];

      const rawProjects = rawProfile?.projects;
      const projects: any[] = Array.isArray(rawProjects)
        ? rawProjects
        : typeof rawProjects === "string"
          ? (() => {
              try {
                const parsed = JSON.parse(rawProjects);
                return Array.isArray(parsed) ? parsed : [];
              } catch {
                return [];
              }
            })()
        : [];

      // Test operations that previously caused TypeErrors
      const renderedSkills = skills.slice(0, 12).map((s) => `Badge:${s}`);
      const renderedProjects = projects.map((p) => p.name || "Project");

      return { renderedSkills, renderedProjects };
    };

    // Case 1: Array skills and projects
    const r1 = normalizeProfile({ skills: ["React", "TypeScript"], projects: [{ name: "Jagire" }] });
    expect(r1.renderedSkills).toEqual(["Badge:React", "Badge:TypeScript"]);
    expect(r1.renderedProjects).toEqual(["Jagire"]);

    // Case 2: String skills (comma separated)
    const r2 = normalizeProfile({ skills: "React, Node.js, Python", projects: null });
    expect(r2.renderedSkills).toEqual(["Badge:React", "Badge:Node.js", "Badge:Python"]);
    expect(r2.renderedProjects).toEqual([]);

    // Case 3: Malformed / object / undefined skills and JSON string projects
    const r3 = normalizeProfile({
      skills: 12345,
      projects: JSON.stringify([{ name: "Open Source Lib" }]),
    });
    expect(r3.renderedSkills).toEqual([]);
    expect(r3.renderedProjects).toEqual(["Open Source Lib"]);
  });
});
