import { supabase } from "@/integrations/supabase/client";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Math.random().toString(36).slice(2, 6);
}

const DEMO_JOBS: Array<{
  title: string;
  description: string;
  requirements: string;
  responsibilities: string;
  benefits: string;
  job_type: "full_time" | "part_time" | "contract" | "internship" | "freelance";
  experience_level: "entry" | "junior" | "mid" | "senior" | "lead" | "executive";
  location: string;
  is_remote: boolean;
  salary_min: number;
  salary_max: number;
  required_skills: string[];
}> = [
  {
    title: "Senior Frontend Engineer",
    description: "Build delightful, high-performance user experiences with React, TypeScript, and modern tooling.",
    requirements: "5+ years React, TypeScript, testing, accessibility",
    responsibilities: "Ship features end-to-end, mentor engineers, drive UX quality",
    benefits: "Remote-first, equity, health, learning stipend",
    job_type: "full_time", experience_level: "senior",
    location: "Remote", is_remote: true, salary_min: 120000, salary_max: 170000,
    required_skills: ["React", "TypeScript", "Tailwind", "Testing"],
  },
  {
    title: "Product Designer",
    description: "Design intuitive workflows, prototypes and a scalable design system.",
    requirements: "4+ years product design, Figma, systems thinking",
    responsibilities: "Own design for a product area, run research, ship polished UI",
    benefits: "Hybrid, equity, wellness budget",
    job_type: "full_time", experience_level: "mid",
    location: "San Francisco, CA", is_remote: false, salary_min: 110000, salary_max: 150000,
    required_skills: ["Figma", "Design Systems", "Prototyping"],
  },
  {
    title: "Backend Engineer (Node.js)",
    description: "Build scalable APIs and data pipelines powering our platform.",
    requirements: "Node.js, Postgres, distributed systems fundamentals",
    responsibilities: "Design APIs, optimize DB, own reliability",
    benefits: "Remote, generous PTO, gear budget",
    job_type: "full_time", experience_level: "mid",
    location: "Remote", is_remote: true, salary_min: 100000, salary_max: 140000,
    required_skills: ["Node.js", "PostgreSQL", "AWS"],
  },
  {
    title: "Marketing Intern",
    description: "Support content, growth, and community initiatives.",
    requirements: "Strong writing, curiosity, familiarity with social platforms",
    responsibilities: "Draft posts, analyze campaigns, coordinate events",
    benefits: "Mentorship, stipend, potential conversion",
    job_type: "internship", experience_level: "entry",
    location: "New York, NY", is_remote: false, salary_min: 30000, salary_max: 45000,
    required_skills: ["Writing", "Social Media", "Analytics"],
  },
];

const DEMO_REVIEWS = [
  { rating: 5, title: "Great engineering culture", content: "Smart peers, clear roadmap, healthy work-life balance." },
  { rating: 4, title: "Solid place to grow", content: "Strong mentorship and clear career paths. Comp is competitive." },
  { rating: 5, title: "Best team I've worked with", content: "Fast-moving, kind, and product-obsessed. Highly recommend." },
];

export async function seedDemoData(userId: string) {
  // Ensure a company owned by this user
  const existing = await supabase.from("companies").select("id").eq("owner_id", userId).maybeSingle();
  let companyId = existing.data?.id;

  if (!companyId) {
    const ins = await supabase.from("companies").insert({
      owner_id: userId,
      name: "Acme Labs",
      slug: slugify("Acme Labs"),
      tagline: "Building the future of work",
      description: "Acme Labs is a small, ambitious team shipping tools people love.",
      industry: "Technology",
      size: "51-200",
      headquarters: "San Francisco, CA",
      website: "https://example.com",
      verified: true,
    }).select("id").single();
    if (ins.error) throw ins.error;
    companyId = ins.data.id;
  }

  // Insert demo jobs
  const jobsPayload = DEMO_JOBS.map((j) => ({
    ...j,
    company_id: companyId!,
    posted_by: userId,
    slug: slugify(j.title),
    status: "active" as const,
  }));
  const jobsRes = await supabase.from("jobs").insert(jobsPayload);
  if (jobsRes.error) throw jobsRes.error;

  // Insert one review by this user (unique per user/company)
  await supabase.from("reviews").upsert({
    company_id: companyId!,
    reviewer_id: userId,
    rating: DEMO_REVIEWS[0].rating,
    title: DEMO_REVIEWS[0].title,
    content: DEMO_REVIEWS[0].content,
  }, { onConflict: "company_id,reviewer_id" });

  return { companyId, jobs: DEMO_JOBS.length };
}