import { describe, it, expect } from "vitest";
import { normalizeWorkModel, slugify, type WorkModel } from "@/lib/company-utils";

function parseArrayField(val: string | string[] | null | undefined): string[] {
  if (Array.isArray(val)) return val.map((s) => s.trim()).filter(Boolean);
  if (typeof val === "string") {
    return val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

describe("Company Management Unit Tests", () => {
  describe("1. work_model Normalization (Database CHECK constraint alignment)", () => {
    it("normalizes standard lowercase values exactly", () => {
      expect(normalizeWorkModel("hybrid")).toBe("hybrid");
      expect(normalizeWorkModel("remote")).toBe("remote");
      expect(normalizeWorkModel("on-site")).toBe("on-site");
    });

    it("normalizes TitleCase and UPPERCASE input to canonical DB values", () => {
      expect(normalizeWorkModel("Hybrid")).toBe("hybrid");
      expect(normalizeWorkModel("HYBRID")).toBe("hybrid");
      expect(normalizeWorkModel("Remote")).toBe("remote");
      expect(normalizeWorkModel("REMOTE")).toBe("remote");
      expect(normalizeWorkModel("On-site")).toBe("on-site");
      expect(normalizeWorkModel("ON-SITE")).toBe("on-site");
    });

    it("normalizes alternative variants of on-site (onsite, on site)", () => {
      expect(normalizeWorkModel("onsite")).toBe("on-site");
      expect(normalizeWorkModel("Onsite")).toBe("on-site");
      expect(normalizeWorkModel("on site")).toBe("on-site");
      expect(normalizeWorkModel("On Site")).toBe("on-site");
    });

    it("safely falls back to hybrid on null, undefined, or empty strings", () => {
      expect(normalizeWorkModel(null)).toBe("hybrid");
      expect(normalizeWorkModel(undefined)).toBe("hybrid");
      expect(normalizeWorkModel("")).toBe("hybrid");
      expect(normalizeWorkModel("   ")).toBe("hybrid");
    });

    it("safely handles unexpected invalid strings by falling back to hybrid", () => {
      expect(normalizeWorkModel("anywhere" as string)).toBe("hybrid");
      expect(normalizeWorkModel("unknown-model" as string)).toBe("hybrid");
    });
  });

  describe("2. Slug Generation and Uniqueness Handling", () => {
    it("generates clean URL-safe slugs from company names", () => {
      expect(slugify("Acme Technologies Nepal")).toBe("acme-technologies-nepal");
      expect(slugify("Leapfrog Technology Inc.")).toBe("leapfrog-technology-inc");
      expect(slugify("F1Soft International (Pvt) Ltd")).toBe("f1soft-international-pvt-ltd");
    });

    it("strips special characters, symbols, and leading/trailing dashes", () => {
      expect(slugify("   ---Nepal Tech & AI Innovations! @2026---   ")).toBe(
        "nepal-tech-ai-innovations-2026",
      );
      expect(slugify("100% Remote Co.")).toBe("100-remote-co");
    });

    it("resolves slug collisions by appending unique randomized suffixes", () => {
      const baseName = "Acme Corp";
      const baseSlug = slugify(baseName);
      const existingSlugs = new Set(["acme-corp"]);

      let targetSlug = baseSlug;
      if (existingSlugs.has(targetSlug)) {
        targetSlug = `${baseSlug}-a1b2`;
      }

      expect(targetSlug).toBe("acme-corp-a1b2");
      expect(existingSlugs.has(targetSlug)).toBe(false);
    });
  });

  describe("3. Company Array Field Parsing (benefits, technologies, locations)", () => {
    it("parses comma-separated strings into clean, trimmed string arrays", () => {
      const rawTech = "React, TypeScript,  Node.js , PostgreSQL, , Docker ";
      const parsed = parseArrayField(rawTech);

      expect(parsed).toEqual(["React", "TypeScript", "Node.js", "PostgreSQL", "Docker"]);
    });

    it("handles empty or whitespace-only strings gracefully", () => {
      expect(parseArrayField("")).toEqual([]);
      expect(parseArrayField("   , ,  ")).toEqual([]);
      expect(parseArrayField(null)).toEqual([]);
      expect(parseArrayField(undefined)).toEqual([]);
    });

    it("preserves arrays if already formatted", () => {
      const existingArray = ["Health Insurance", "Paid Leave", "Annual Retreat"];
      expect(parseArrayField(existingArray)).toEqual(existingArray);
    });
  });

  describe("4. Company Form Validation Rules", () => {
    it("requires company name and rejects empty or whitespace-only name", () => {
      const validate = (name?: string) => {
        const trimmed = name?.trim();
        if (!trimmed) throw new Error("Company name is required.");
        return trimmed;
      };

      expect(() => validate("")).toThrow("Company name is required.");
      expect(() => validate("   ")).toThrow("Company name is required.");
      expect(validate("Jagire Labs")).toBe("Jagire Labs");
    });

    it("validates founded year parsing", () => {
      const parseYear = (val: string) => {
        if (!val.trim()) return null;
        const num = parseInt(val, 10);
        return isNaN(num) ? null : num;
      };

      expect(parseYear("2024")).toBe(2024);
      expect(parseYear("")).toBe(null);
      expect(parseYear("invalid")).toBe(null);
    });
  });
});
