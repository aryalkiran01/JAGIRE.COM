import { describe, it, expect, beforeEach } from "vitest";
import { normalizeWorkModel } from "@/lib/company-utils";

// In-memory simulation of PostgreSQL companies table with RLS & Check constraints
interface DbCompany {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  work_model: "remote" | "hybrid" | "on-site";
  tagline?: string | null;
  description?: string | null;
  industry?: string | null;
  created_at: string;
}

interface AuthContext {
  uid: string;
  role: "employer" | "jobseeker" | "admin";
}

class MockSupabaseCompanyDatabase {
  private companies: Map<string, DbCompany> = new Map();
  private allowedWorkModels = new Set(["remote", "hybrid", "on-site"]);

  clear() {
    this.companies.clear();
  }

  // Simulates:
  // CREATE POLICY "employers_and_admins_insert_companies" ON public.companies
  // FOR INSERT TO authenticated
  // WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'::app_role))
  insert(auth: AuthContext, data: Partial<DbCompany>): DbCompany {
    const ownerId = data.owner_id || auth.uid;

    // 1. RLS Check
    const isOwner = auth.uid === ownerId;
    const isAdmin = auth.role === "admin";
    if (!isOwner && !isAdmin) {
      throw new Error(
        'new row violates row-level security policy for table "companies" (code: 42501)',
      );
    }

    // 2. CHECK constraint "companies_work_model_check"
    const workModel = data.work_model || "hybrid";
    if (!this.allowedWorkModels.has(workModel)) {
      throw new Error(
        'new row for relation "companies" violates check constraint "companies_work_model_check"',
      );
    }

    // 3. Unique slug check
    const slug = data.slug || `company-${Date.now()}`;
    for (const c of this.companies.values()) {
      if (c.slug === slug) {
        throw new Error(
          'duplicate key value violates unique constraint "companies_slug_key" (code: 23505)',
        );
      }
    }

    const newCompany: DbCompany = {
      id: data.id || `co-${Math.random().toString(36).substring(2, 9)}`,
      name: data.name!,
      slug,
      owner_id: ownerId,
      work_model: (workModel || "hybrid") as "remote" | "hybrid" | "on-site",
      tagline: data.tagline ?? null,
      description: data.description ?? null,
      industry: data.industry ?? null,
      created_at: new Date().toISOString(),
    };

    this.companies.set(newCompany.id, newCompany);
    return newCompany;
  }

  // Simulates:
  // CREATE POLICY "select_companies" ON public.companies FOR SELECT USING (true)
  selectByOwner(ownerId: string): DbCompany[] {
    return Array.from(this.companies.values())
      .filter((c) => c.owner_id === ownerId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  // Simulates:
  // CREATE POLICY "owners_and_admins_update_companies" ON public.companies
  // FOR UPDATE USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'))
  // WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'))
  update(auth: AuthContext, companyId: string, updates: Partial<DbCompany>): DbCompany {
    const existing = this.companies.get(companyId);
    if (!existing) {
      throw new Error("Company not found");
    }

    const isOwner = auth.uid === existing.owner_id;
    const isAdmin = auth.role === "admin";
    if (!isOwner && !isAdmin) {
      throw new Error("permission denied for table companies (code: 42501 / RLS policy violation)");
    }

    // Check constraint if work_model is being updated
    if (updates.work_model && !this.allowedWorkModels.has(updates.work_model)) {
      throw new Error(
        'new row for relation "companies" violates check constraint "companies_work_model_check"',
      );
    }

    const updated: DbCompany = {
      ...existing,
      ...updates,
      id: existing.id,
      owner_id: isAdmin ? (updates.owner_id ?? existing.owner_id) : existing.owner_id,
    };

    this.companies.set(companyId, updated);
    return updated;
  }

  // Simulates:
  // CREATE POLICY "owners_and_admins_delete_companies" ON public.companies
  // FOR DELETE USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'))
  delete(auth: AuthContext, companyId: string): boolean {
    const existing = this.companies.get(companyId);
    if (!existing) return false;

    const isOwner = auth.uid === existing.owner_id;
    const isAdmin = auth.role === "admin";
    if (!isOwner && !isAdmin) {
      throw new Error("permission denied for table companies (code: 42501)");
    }

    return this.companies.delete(companyId);
  }
}

describe("Employer -> Company Integration Flow", () => {
  let db: MockSupabaseCompanyDatabase;

  const employerA: AuthContext = { uid: "employer-user-a", role: "employer" };
  const employerB: AuthContext = { uid: "employer-user-b", role: "employer" };
  const adminUser: AuthContext = { uid: "admin-user-z", role: "admin" };

  beforeEach(() => {
    db = new MockSupabaseCompanyDatabase();
  });

  describe("Phase 3.1: Company Creation and Multi-Company Coexistence", () => {
    it("allows Employer A to create Company A successfully with canonical work_model", () => {
      const canonicalWorkModel = normalizeWorkModel("Hybrid"); // Normalized from UI "Hybrid" -> "hybrid"

      const companyA = db.insert(employerA, {
        name: "Company A Technologies",
        slug: "company-a-technologies",
        work_model: canonicalWorkModel,
        industry: "IT & Software",
      });

      expect(companyA.id).toBeDefined();
      expect(companyA.name).toBe("Company A Technologies");
      expect(companyA.owner_id).toBe(employerA.uid);
      expect(companyA.work_model).toBe("hybrid");

      const myCompanies = db.selectByOwner(employerA.uid);
      expect(myCompanies).toHaveLength(1);
      expect(myCompanies[0].id).toBe(companyA.id);
    });

    it("allows Employer A to create Company B without mutating Company A", () => {
      // 1. Create Company A
      const companyA = db.insert(employerA, {
        name: "Company A",
        slug: "company-a",
        work_model: normalizeWorkModel("Remote"),
      });

      // 2. Create Company B
      const companyB = db.insert(employerA, {
        name: "Company B",
        slug: "company-b",
        work_model: normalizeWorkModel("On-site"),
      });

      expect(companyB.id).not.toBe(companyA.id);
      expect(companyB.name).toBe("Company B");
      expect(companyB.work_model).toBe("on-site");

      // Verify both exist independently in Employer A's company list
      const myCompanies = db.selectByOwner(employerA.uid);
      expect(myCompanies).toHaveLength(2);
      expect(myCompanies.map((c) => c.name)).toContain("Company A");
      expect(myCompanies.map((c) => c.name)).toContain("Company B");

      // 3. Edit Company A
      db.update(employerA, companyA.id, {
        name: "Company A (Updated Name)",
      });

      // Verify Company B remains completely unchanged
      const updatedList = db.selectByOwner(employerA.uid);
      const retrievedB = updatedList.find((c) => c.id === companyB.id);
      const retrievedA = updatedList.find((c) => c.id === companyA.id);

      expect(retrievedA?.name).toBe("Company A (Updated Name)");
      expect(retrievedB?.name).toBe("Company B");
      expect(retrievedB?.work_model).toBe("on-site");
    });
  });

  describe("Phase 3.2: RLS Security & Impersonation Prevention", () => {
    it("prevents Employer B from creating a company with Employer A's owner_id", () => {
      expect(() => {
        db.insert(employerB, {
          name: "Spoofed Company",
          slug: "spoofed-company",
          owner_id: employerA.uid, // Employer B tries to assign owner_id = Employer A
          work_model: "hybrid",
        });
      }).toThrow(/row-level security/);
    });

    it("prevents Employer B from updating Employer A's company", () => {
      const companyA = db.insert(employerA, {
        name: "Company A",
        slug: "company-a",
        work_model: "hybrid",
      });

      expect(() => {
        db.update(employerB, companyA.id, {
          name: "Hacked Company A",
        });
      }).toThrow(/permission denied/);

      // Verify Company A was not modified
      const myCompanies = db.selectByOwner(employerA.uid);
      expect(myCompanies[0].name).toBe("Company A");
    });

    it("prevents Employer B from deleting Employer A's company", () => {
      const companyA = db.insert(employerA, {
        name: "Company A",
        slug: "company-a",
        work_model: "hybrid",
      });

      expect(() => {
        db.delete(employerB, companyA.id);
      }).toThrow(/permission denied/);

      expect(db.selectByOwner(employerA.uid)).toHaveLength(1);
    });

    it("allows Admin to manage and update any company", () => {
      const companyA = db.insert(employerA, {
        name: "Company A",
        slug: "company-a",
        work_model: "hybrid",
      });

      const updatedByAdmin = db.update(adminUser, companyA.id, {
        name: "Company A (Verified by Admin)",
      });

      expect(updatedByAdmin.name).toBe("Company A (Verified by Admin)");
    });
  });

  describe("Phase 3.3: Database Check Constraint on work_model", () => {
    it("accepts all three valid canonical values: remote, hybrid, on-site", () => {
      const c1 = db.insert(employerA, { name: "C1", slug: "c1", work_model: "remote" });
      const c2 = db.insert(employerA, { name: "C2", slug: "c2", work_model: "hybrid" });
      const c3 = db.insert(employerA, { name: "C3", slug: "c3", work_model: "on-site" });

      expect(c1.work_model).toBe("remote");
      expect(c2.work_model).toBe("hybrid");
      expect(c3.work_model).toBe("on-site");
    });

    it("throws check constraint violation if raw un-normalized value (e.g. TitleCase 'Remote') bypasses normalization", () => {
      expect(() => {
        db.insert(employerA, {
          name: "C4",
          slug: "c4",
          work_model: "Remote" as unknown as "remote", // Un-normalized TitleCase violates check constraint
        });
      }).toThrow(/violates check constraint "companies_work_model_check"/);
    });
  });
});
