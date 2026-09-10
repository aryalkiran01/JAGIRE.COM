/**
 * Role Whitelist & Sanitization
 *
 * Enforces strict authorization boundaries for public user registration.
 * Ensures client-supplied metadata can never grant privileged roles (admin, super_admin, etc.).
 */

export const ALLOWED_SIGNUP_ROLES = ["job_seeker", "seeker", "employer"] as const;
export type AllowedSignupRole = (typeof ALLOWED_SIGNUP_ROLES)[number];

export const PRIVILEGED_ROLES = ["admin", "super_admin", "moderator", "staff"] as const;

/**
 * Sanitizes role input from signup metadata or external client inputs.
 * If the role is not explicitly in the safe signup allowlist, it defaults safely to 'job_seeker'.
 */
export function sanitizeSignupRole(rawRole?: unknown): "job_seeker" | "employer" {
  if (typeof rawRole !== "string") {
    return "job_seeker";
  }

  const normalized = rawRole.trim().toLowerCase();

  // Privileged roles are strictly forbidden from public registration
  if (PRIVILEGED_ROLES.some((priv) => normalized === priv || normalized.includes(priv))) {
    return "job_seeker";
  }

  if (normalized === "employer") {
    return "employer";
  }

  if (normalized === "job_seeker" || normalized === "seeker") {
    return "job_seeker";
  }

  // Safe fallback for any unknown strings or injection attempts
  return "job_seeker";
}
