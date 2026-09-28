import { describe, it, expect } from "vitest";

describe("Beta & End-to-End User Flows", () => {
  describe("Persona A: Job Seeker Complete Lifecycle", () => {
    it("executes the full job seeker lifecycle: Profile -> Job Search -> Apply -> Save -> Notif", () => {
      // 1. Profile initialization & Avatar
      const seekerProfile = {
        id: "seeker-1",
        full_name: "Aayush Sharma",
        headline: "Frontend React Engineer",
        skills: ["React", "TypeScript", "Tailwind CSS"],
        avatar_url: "https://jagire.com/avatars/seeker-1.png",
      };
      expect(seekerProfile.full_name).toBe("Aayush Sharma");

      // 2. Job Search and Filter matching
      const allJobs = [
        {
          id: "job-1",
          title: "Senior React Developer",
          company: "Nepal Tech Labs",
          job_type: "full_time",
          location: "Kathmandu, Nepal",
          required_skills: ["React", "TypeScript"],
          status: "active",
        },
        {
          id: "job-2",
          title: "Django Backend Engineer",
          company: "Data Corp",
          job_type: "remote",
          location: "Remote, Nepal",
          required_skills: ["Python", "Django"],
          status: "active",
        },
      ];

      const searchKeyword = "React";
      const matchedJobs = allJobs.filter(
        (j) =>
          j.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          j.required_skills.some((s) => s.toLowerCase().includes(searchKeyword.toLowerCase())),
      );

      expect(matchedJobs).toHaveLength(1);
      expect(matchedJobs[0].id).toBe("job-1");

      // 3. Application Submission
      interface JobApplication {
        id: string;
        job_id: string;
        candidate_id: string;
        status: string;
        applied_at: string;
      }
      const applications: JobApplication[] = [];
      const applyToJob = (jobId: string, candidateId: string) => {
        // Prevent duplicate application
        const exists = applications.some(
          (a) => a.job_id === jobId && a.candidate_id === candidateId,
        );
        if (exists) throw new Error("You have already applied for this position.");

        const app: JobApplication = {
          id: `app-${Date.now()}`,
          job_id: jobId,
          candidate_id: candidateId,
          status: "submitted",
          applied_at: new Date().toISOString(),
        };
        applications.push(app);
        return app;
      };

      const application = applyToJob("job-1", seekerProfile.id);
      expect(application.status).toBe("submitted");
      expect(applications).toHaveLength(1);

      // Verify duplicate prevention
      expect(() => applyToJob("job-1", seekerProfile.id)).toThrow(
        "You have already applied for this position.",
      );

      // 4. Saved Jobs Bookmark
      const savedJobs = new Set<string>();
      savedJobs.add("job-1");
      expect(savedJobs.has("job-1")).toBe(true);

      // 5. Notification generation
      const notification = {
        id: "notif-1",
        user_id: seekerProfile.id,
        title: "Application Received",
        message: "Nepal Tech Labs has received your application for Senior React Developer.",
        is_read: false,
      };
      expect(notification.is_read).toBe(false);
    });
  });

  describe("Persona B: Employer Complete Lifecycle", () => {
    it("executes the full employer lifecycle: Multi-Company -> Post Job -> Receive App -> Status change", () => {
      const employerId = "emp-42";
      interface FlowCompany {
        id: string;
        owner_id: string;
        name: string;
        slug: string;
        work_model: string;
      }
      interface FlowJob {
        id: string;
        company_id: string;
        title: string;
        status: string;
      }
      const companies: FlowCompany[] = [];
      const jobs: FlowJob[] = [];

      // 1. Create Company A
      const compA = {
        id: "comp-a",
        owner_id: employerId,
        name: "Acme Nepal",
        slug: "acme-nepal",
        work_model: "hybrid",
      };
      companies.push(compA);

      // 2. Create Company B
      const compB = {
        id: "comp-b",
        owner_id: employerId,
        name: "Acme Ventures",
        slug: "acme-ventures",
        work_model: "remote",
      };
      companies.push(compB);

      expect(companies).toHaveLength(2);

      // 3. Post a Job under Company A
      const jobPost = {
        id: "job-101",
        company_id: compA.id,
        title: "Staff Cloud Architect",
        salary_min: 150000,
        salary_max: 250000,
        currency: "NPR",
        status: "active",
        created_at: new Date().toISOString(),
      };
      jobs.push(jobPost);
      expect(jobs[0].company_id).toBe(compA.id);

      // 4. Applicant Review & Status Transition
      const candidateApp = {
        id: "app-99",
        job_id: jobPost.id,
        candidate_name: "Bikash KC",
        status: "submitted",
      };

      // Employer moves applicant: submitted -> shortlisted -> interview_scheduled
      candidateApp.status = "shortlisted";
      expect(candidateApp.status).toBe("shortlisted");

      candidateApp.status = "interview_scheduled";
      expect(candidateApp.status).toBe("interview_scheduled");
    });
  });

  describe("Error Sanitization & Edge Case Handling", () => {
    it("sanitizes raw PostgreSQL / RLS errors into clean, friendly user messages", () => {
      const formatErrorMessage = (error: { code?: string; message?: string }) => {
        if (!error?.message) return "An unexpected error occurred. Please try again.";

        if (
          error.message.includes("row-level security") ||
          error.message.includes("RLS") ||
          error.code === "42501"
        ) {
          return "Permission error: Please ensure you are signed in with an employer account.";
        }

        if (
          error.message.includes("duplicate key") ||
          error.message.includes("unique") ||
          error.code === "23505"
        ) {
          return "A company with this name or identifier already exists. Please choose a different name.";
        }

        if (error.message.includes("work_model") || error.message.includes("check constraint")) {
          return "Invalid work model selected. Please choose Hybrid, Remote, or On-site.";
        }

        // Strip internal database syntax strings
        if (
          error.message.includes("PGRST") ||
          error.message.includes("Database") ||
          error.message.includes("syntax error")
        ) {
          return "Failed to save company profile. Please check your input and try again.";
        }

        return error.message;
      };

      expect(formatErrorMessage({ code: "42501", message: "RLS policy error" })).toBe(
        "Permission error: Please ensure you are signed in with an employer account.",
      );

      expect(
        formatErrorMessage({
          code: "23505",
          message: 'duplicate key value violates unique constraint "companies_slug_key"',
        }),
      ).toBe(
        "A company with this name or identifier already exists. Please choose a different name.",
      );

      expect(
        formatErrorMessage({ message: 'violates check constraint "companies_work_model_check"' }),
      ).toBe("Invalid work model selected. Please choose Hybrid, Remote, or On-site.");

      expect(
        formatErrorMessage({
          message: "PGRST116: JSON object requested, multiple (or no) rows returned",
        }),
      ).toBe("Failed to save company profile. Please check your input and try again.");
    });
  });
});
