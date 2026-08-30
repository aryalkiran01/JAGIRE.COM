import { supabase } from "@/integrations/supabase/client";

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    Math.random().toString(36).slice(2, 6)
  );
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
    title: "Senior React Developer",
    description:
      "Build modern web applications using React, TypeScript, and cutting-edge tools for international clients.",
    requirements: "4+ years React, TypeScript, REST APIs, Git",
    responsibilities:
      "Develop features, review code, mentor juniors, collaborate with international teams",
    benefits: "Competitive salary, Dashain bonus, flexible hours, learning budget",
    job_type: "full_time",
    experience_level: "senior",
    location: "Kathmandu, Nepal",
    is_remote: false,
    salary_min: 150000,
    salary_max: 250000,
    required_skills: ["React", "TypeScript", "Node.js", "Git"],
  },
  {
    title: "UI/UX Designer",
    description: "Design beautiful interfaces for web and mobile applications used by thousands.",
    requirements: "3+ years UI/UX design, Figma, Adobe XD, portfolio required",
    responsibilities: "Create wireframes, prototypes, user flows, and design systems",
    benefits: "Hybrid work, health insurance, festival allowances",
    job_type: "full_time",
    experience_level: "mid",
    location: "Lalitpur, Nepal",
    is_remote: false,
    salary_min: 80000,
    salary_max: 150000,
    required_skills: ["Figma", "UI Design", "Prototyping", "User Research"],
  },
  {
    title: "Python/Django Backend Engineer",
    description: "Build scalable backend systems and APIs for fintech products.",
    requirements: "Python, Django, PostgreSQL, AWS experience",
    responsibilities: "Design APIs, optimize database queries, ensure system reliability",
    benefits: "Remote work, performance bonuses, paid leaves",
    job_type: "full_time",
    experience_level: "mid",
    location: "Remote",
    is_remote: true,
    salary_min: 120000,
    salary_max: 200000,
    required_skills: ["Python", "Django", "PostgreSQL", "AWS"],
  },
  {
    title: "Digital Marketing Intern",
    description: "Learn digital marketing hands-on with real campaigns and analytics.",
    requirements: "Strong communication, social media knowledge, eager to learn",
    responsibilities: "Manage social media, create content, analyze campaign performance",
    benefits: "Monthly stipend, mentorship, job placement opportunity",
    job_type: "internship",
    experience_level: "entry",
    location: "Kathmandu, Nepal",
    is_remote: false,
    salary_min: 15000,
    salary_max: 25000,
    required_skills: ["Social Media", "Content Writing", "Analytics"],
  },
  {
    title: "Mobile Developer (Flutter)",
    description: "Develop cross-platform mobile applications for e-commerce and service platforms.",
    requirements: "2+ years Flutter, Dart, REST APIs, app deployment experience",
    responsibilities: "Build and maintain mobile apps, integrate APIs, publish to stores",
    benefits: "Flexible timing, project bonuses, skill development",
    job_type: "full_time",
    experience_level: "junior",
    location: "Pokhara, Nepal",
    is_remote: false,
    salary_min: 60000,
    salary_max: 120000,
    required_skills: ["Flutter", "Dart", "Firebase", "REST APIs"],
  },
  {
    title: "QA Engineer",
    description:
      "Ensure quality of web and mobile applications through manual and automated testing.",
    requirements: "2+ years QA experience, Selenium, JIRA, test case writing",
    responsibilities: "Create test plans, execute tests, report bugs, automate regression tests",
    benefits: "Health insurance, annual trips, performance bonus",
    job_type: "full_time",
    experience_level: "junior",
    location: "Kathmandu, Nepal",
    is_remote: false,
    salary_min: 50000,
    salary_max: 100000,
    required_skills: ["Manual Testing", "Selenium", "JIRA", "API Testing"],
  },
];

const DEMO_REVIEWS = [
  {
    rating: 5,
    title: "Great company culture",
    content: "Supportive team, clear goals, and excellent work-life balance.",
  },
  {
    rating: 4,
    title: "Good place to grow",
    content: "Learning opportunities and mentorship programs are excellent.",
  },
  {
    rating: 5,
    title: "Best tech company in Nepal",
    content: "Competitive salary, modern tech stack, and international exposure.",
  },
];

const NEPALI_COMPANIES = [
  {
    name: "Jagire Technologies",
    slug: "jagire-technologies",
    tagline: "Connecting Talent with Opportunity",
    description:
      "Jagire Technologies is Nepal's premier job portal connecting talented professionals with leading companies. We build innovative solutions for recruitment and career development.",
    industry: "Information Technology",
    size: "11-50",
    headquarters: "Kathmandu, Nepal",
    website: "https://jagire.com",
    logo_url: "https://img.icons8.com/color/96/000000/briefcase.png",
  },
  {
    name: "Himalayan Tech Solutions",
    slug: "himalayan-tech-solutions",
    tagline: "Engineering Excellence from the Himalayas",
    description:
      "Himalayan Tech Solutions provides world-class software development services to clients across the globe. We specialize in web, mobile, and cloud solutions.",
    industry: "Software Development",
    size: "51-200",
    headquarters: "Lalitpur, Nepal",
    website: "https://himalayantech.com",
    logo_url: "https://img.icons8.com/color/96/000000/mountain.png",
  },
  {
    name: "Kathmandu Innovations",
    slug: "kathmandu-innovations",
    tagline: "Innovating for Tomorrow",
    description:
      "Kathmandu Innovations is a product-based company building cutting-edge solutions in fintech, e-commerce, and artificial intelligence.",
    industry: "Technology",
    size: "11-50",
    headquarters: "Kathmandu, Nepal",
    website: "https://kathmanduinnovations.com",
    logo_url: "https://img.icons8.com/color/96/000000/innovation.png",
  },
];

export async function seedDemoData(userId: string) {
  console.log("Checking for existing companies for user:", userId);

  // Check if user already has companies
  const { data: existingUserCompanies } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", userId);

  // If user already has companies with jobs, skip
  if (existingUserCompanies && existingUserCompanies.length > 0) {
    const companyIds = existingUserCompanies.map((c) => c.id);
    const { data: existingJobs } = await supabase
      .from("jobs")
      .select("id")
      .in("company_id", companyIds);

    if (existingJobs && existingJobs.length > 0) {
      console.log("User already has companies and jobs. Skipping seed.");
      return {
        skipped: true,
        message: "You already have companies and jobs",
        companies: existingUserCompanies.length,
        jobs: existingJobs.length,
      };
    }
  }

  // Create first company (Jagire Technologies)
  const firstCompany = NEPALI_COMPANIES[0];
  const { data: companyData, error: companyError } = await supabase
    .from("companies")
    .insert({
      owner_id: userId,
      name: firstCompany.name,
      slug: slugify(firstCompany.name),
      tagline: firstCompany.tagline,
      description: firstCompany.description,
      industry: firstCompany.industry,
      size: firstCompany.size,
      headquarters: firstCompany.headquarters,
      website: firstCompany.website,
      logo_url: firstCompany.logo_url,
    })
    .select("id")
    .single();

  if (companyError) throw companyError;
  const companyId = companyData.id;

  // Create additional companies
  const additionalCompanies = NEPALI_COMPANIES.slice(1).map((company) => ({
    owner_id: userId,
    name: company.name,
    slug: slugify(company.name),
    tagline: company.tagline,
    description: company.description,
    industry: company.industry,
    size: company.size,
    headquarters: company.headquarters,
    website: company.website,
    logo_url: company.logo_url,
  }));

  if (additionalCompanies.length > 0) {
    const { error: additionalCompaniesError } = await supabase
      .from("companies")
      .insert(additionalCompanies);

    if (additionalCompaniesError) {
      console.error("Error creating additional companies:", additionalCompaniesError);
    }
  }

  // Insert demo jobs for the first company
  const jobsPayload = DEMO_JOBS.map((j) => ({
    ...j,
    company_id: companyId,
    posted_by: userId,
    slug: slugify(j.title),
    status: "active" as const,
  }));

  const jobsRes = await supabase.from("jobs").insert(jobsPayload);
  if (jobsRes.error) throw jobsRes.error;

  // Insert reviews for the company
  for (const review of DEMO_REVIEWS) {
    await supabase.from("reviews").insert({
      company_id: companyId,
      reviewer_id: userId,
      rating: review.rating,
      title: review.title,
      content: review.content,
    });
  }

  return {
    skipped: false,
    companies: NEPALI_COMPANIES.length,
    jobs: DEMO_JOBS.length,
    message: `Created ${NEPALI_COMPANIES.length} Nepali companies with ${DEMO_JOBS.length} jobs`,
  };
}
