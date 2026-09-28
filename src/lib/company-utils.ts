export type WorkModel = "hybrid" | "remote" | "on-site";

/**
 * Normalizes any work model string to the canonical database check constraint values:
 * 'hybrid' | 'remote' | 'on-site'
 *
 * PostgreSQL Constraint:
 * CONSTRAINT companies_work_model_check CHECK (work_model = ANY (ARRAY['remote'::text, 'hybrid'::text, 'on-site'::text]))
 */
export function normalizeWorkModel(val?: string | null): WorkModel {
  if (!val) return "hybrid";
  const lower = String(val).toLowerCase().trim();
  if (lower === "remote") return "remote";
  if (lower === "hybrid") return "hybrid";
  if (lower === "on-site" || lower === "onsite" || lower === "on site") return "on-site";
  return "hybrid";
}

/**
 * Generates URL-safe slugs from company names
 */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Parses comma or newline separated text lists into clean string arrays
 */
export function parseCommaList(val?: string | null): string[] | null {
  if (!val) return null;
  const list = val
    .split(/[\r\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length > 0 ? list : null;
}
