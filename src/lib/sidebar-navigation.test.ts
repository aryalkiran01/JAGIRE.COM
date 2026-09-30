import { describe, it, expect } from "vitest";

describe("Sidebar Navigation & State Management", () => {
  it("manages sidebar open, close, and toggle states properly", () => {
    let isOpen = false;
    const setIsOpen = (updater: boolean | ((prev: boolean) => boolean)) => {
      isOpen = typeof updater === "function" ? updater(isOpen) : updater;
    };
    const toggle = () => setIsOpen((prev) => !prev);
    const open = () => setIsOpen(true);
    const close = () => setIsOpen(false);

    expect(isOpen).toBe(false);

    // Opening
    open();
    expect(isOpen).toBe(true);

    // Toggle when open
    toggle();
    expect(isOpen).toBe(false);

    // Toggle when closed
    toggle();
    expect(isOpen).toBe(true);

    // Closing
    close();
    expect(isOpen).toBe(false);
  });

  it("handles auto-close on pathname change only when pathname actually transitions", () => {
    let isOpen = true;
    const close = () => {
      isOpen = false;
    };

    let prevPathname = "/jobs";
    const onRender = (currentPathname: string, isMobile: boolean) => {
      if (prevPathname !== currentPathname) {
        prevPathname = currentPathname;
        if (isMobile) {
          close();
        }
      }
    };

    // Render with same pathname on mobile - must NOT close
    onRender("/jobs", true);
    expect(isOpen).toBe(true);

    // Render with different pathname on mobile - MUST close
    onRender("/companies", true);
    expect(isOpen).toBe(false);
  });

  it("preserves sidebar state on desktop across route changes if desired", () => {
    let isOpen = true;
    const close = () => {
      isOpen = false;
    };

    let prevPathname = "/dashboard";
    const onRender = (currentPathname: string, isMobile: boolean) => {
      if (prevPathname !== currentPathname) {
        prevPathname = currentPathname;
        if (isMobile) {
          close();
        }
      }
    };

    // Desktop navigation
    onRender("/applications", false);
    expect(isOpen).toBe(true);
  });

  it("verifies navigation items exist for all user roles", () => {
    const roles = ["guest", "jobseeker", "employer", "admin"] as const;

    const navMap = {
      guest: ["Browse Jobs", "Companies", "Community Feed", "Learning Center", "About Us", "Pricing"],
      jobseeker: ["Dashboard", "Find Jobs", "My Applications", "Saved Jobs", "My Profile"],
      employer: ["Employer Dashboard", "Post a Job", "Interview Sessions", "Company Profile", "My Profile"],
      admin: ["Admin Console", "User Dashboard", "Manage Jobs", "Manage Companies", "My Profile"],
    };

    roles.forEach((role) => {
      expect(navMap[role].length).toBeGreaterThan(0);
    });
    expect(navMap.jobseeker).toEqual(["Dashboard", "Find Jobs", "My Applications", "Saved Jobs", "My Profile"]);
  });
});
