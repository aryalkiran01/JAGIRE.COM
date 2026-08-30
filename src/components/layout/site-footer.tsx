import { Link } from "@tanstack/react-router";
import { Twitter, Linkedin, Github, Mail, ArrowRight, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const JOB_SEEKER_SECTIONS = [
  {
    title: "For Job Seekers",
    links: [
      { label: "Browse Jobs", to: "/jobs" },
      { label: "Companies", to: "/companies" },
      { label: "AI Resume Scanner", to: "/resume-scanner" },
      { label: "Resume Builder", to: "/resume-builder" },
      { label: "Career Advice", to: "/career" },
      { label: "Interview Prep", to: "/interviews" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", to: "/blog" },
      { label: "Learning Center", to: "/learn" },
      { label: "Community Feed", to: "/feed" },
      { label: "Assessments", to: "/assessments" },
      { label: "Refer & Earn", to: "/referrals" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", to: "/about" },
      { label: "Contact", to: "/contact" },
      { label: "Help Center", to: "/support" },
      { label: "Pricing", to: "/pricing" },
    ],
  },
];

const EMPLOYER_SECTIONS = [
  {
    title: "For Employers",
    links: [
      { label: "Post a Job", to: "/employer" },
      { label: "Employer Dashboard", to: "/employer" },
      { label: "Company Profile", to: "/employer/company" },
      { label: "Manage Jobs", to: "/employer/jobs" },
      { label: "Applications", to: "/employer/applications" },
      { label: "Analytics", to: "/employer/analytics" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Pricing", to: "/pricing" },
      { label: "Enterprise", to: "/enterprise" },
      { label: "Knowledge Base", to: "/employer/knowledge-base" },
      { label: "Hiring Tips", to: "/blog" },
      { label: "Success Stories", to: "/blog" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", to: "/about" },
      { label: "Contact", to: "/contact" },
      { label: "Help Center", to: "/support" },
      { label: "Terms of Service", to: "/support" },
    ],
  },
];

const ADMIN_SECTIONS = [
  {
    title: "Admin",
    links: [
      { label: "Dashboard", to: "/admin" },
      { label: "User Management", to: "/admin/users" },
      { label: "Companies", to: "/admin/companies" },
      { label: "Jobs", to: "/admin/jobs" },
      { label: "Reports", to: "/admin/reports" },
      { label: "Settings", to: "/admin/settings" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", to: "/blog" },
      { label: "Learning Center", to: "/learn" },
      { label: "Community Feed", to: "/feed" },
      { label: "Assessments", to: "/assessments" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", to: "/about" },
      { label: "Contact", to: "/contact" },
      { label: "Help Center", to: "/support" },
    ],
  },
];

const PUBLIC_SECTIONS = [
  {
    title: "For Job Seekers",
    links: [
      { label: "Browse Jobs", to: "/jobs" },
      { label: "Companies", to: "/companies" },
      { label: "Resume Builder", to: "/resume-builder" },
      { label: "Career Advice", to: "/career" },
    ],
  },
  {
    title: "For Employers",
    links: [
      { label: "Post a Job", to: "/employer" },
      { label: "Pricing", to: "/pricing" },
      { label: "Enterprise", to: "/enterprise" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", to: "/blog" },
      { label: "Learning Center", to: "/learn" },
      { label: "Community Feed", to: "/feed" },
      { label: "Assessments", to: "/assessments" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", to: "/about" },
      { label: "Contact", to: "/contact" },
      { label: "Help Center", to: "/support" },
    ],
  },
];

const SOCIAL_LINKS = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Github, href: "#", label: "GitHub" },
  { icon: Mail, href: "/contact", label: "Email" },
];

export function SiteFooter() {
  const { user } = useAuth();

  // Fetch user roles
  const { data: userRoles } = useQuery({
    queryKey: ["user-roles", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);

      if (error) {
        console.error("Error fetching user roles:", error);
        return [];
      }
      return data || [];
    },
  });

  const roles = userRoles?.map((r) => r.role) || [];
  const isAdmin = roles.includes("admin");
  const isEmployer = roles.includes("employer");
  const isJobSeeker = roles.includes("job_seeker");

  // Determine which sections to show based on role priority
  let sections = PUBLIC_SECTIONS;
  let brandDescription =
    "AI-powered job portal connecting talent with opportunity. Find your next role, build your resume, and ace your interviews — all in one place.";
  let logoLink = "/";

  if (isAdmin) {
    sections = ADMIN_SECTIONS;
    brandDescription =
      "Admin dashboard for managing the Jagire platform. Monitor users, companies, and jobs.";
    logoLink = "/admin";
  } else if (isEmployer) {
    sections = EMPLOYER_SECTIONS;
    brandDescription =
      "AI-powered hiring platform. Post jobs, manage applications, and find the best talent for your company.";
    logoLink = "/employer";
  } else if (isJobSeeker) {
    sections = JOB_SEEKER_SECTIONS;
    brandDescription =
      "AI-powered job portal connecting talent with opportunity. Find your next role, build your resume, and ace your interviews — all in one place.";
    logoLink = "/";
  }

  return (
    <footer className="relative mt-24 border-t border-border/60 bg-gradient-to-b from-card/30 to-muted/30">
      {/* Top accent line */}
      <div className="h-1 gradient-brand" />

      <div className="container mx-auto px-4 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12">
          {/* Brand column - takes 4 columns */}
          <div className="space-y-4 lg:col-span-4">
            <Link to={logoLink} className="flex items-center gap-2 group">
              <img
                src="/Jagire-logo.png"
                alt="Jagire"
                className="h-10 w-auto transition-transform group-hover:scale-105"
              />
              <span className="text-xl font-bold gradient-text tracking-tight">Jagire</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              {brandDescription}
            </p>
            <div className="flex gap-2 pt-1">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="h-9 w-9 rounded-lg border border-border/60 flex items-center justify-center text-muted-foreground hover:text-primary-foreground hover:gradient-brand hover:border-transparent transition-all duration-200"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>Kathmandu, Nepal</span>
            </div>
          </div>

          {/* Link columns - dynamically calculate span */}
          {sections.map((section) => {
            const sectionSpan =
              sections.length === 3
                ? "lg:col-span-2"
                : sections.length === 4
                  ? "lg:col-span-2"
                  : "lg:col-span-2";

            return (
              <div key={section.title} className={sectionSpan}>
                <h4 className="font-semibold text-sm mb-3 text-foreground">{section.title}</h4>
                <ul className="space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center group"
                      >
                        <span className="opacity-0 group-hover:opacity-100 group-hover:mr-1 transition-all duration-200">
                          <ArrowRight className="h-3 w-3" />
                        </span>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Jagire. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/support" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link to="/support" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link to="/support" className="hover:text-foreground transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
