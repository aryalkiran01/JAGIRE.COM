import { Link } from "@tanstack/react-router";
import { Twitter, Linkedin, Github, Mail, ArrowRight, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const JOB_SEEKER_SECTIONS = [
  {
    title: "AI Career Suite",
    links: [
      { label: "AI Career Hub", to: "/career" },
      { label: "AI Career Coach", to: "/career-coach" },
      { label: "Resume Scanner & ATS", to: "/resume-scanner" },
      { label: "Resume Builder", to: "/resume-builder" },
    ],
  },
  {
    title: "Explore",
    links: [
      { label: "Find Jobs", to: "/jobs" },
      { label: "Companies", to: "/companies" },
      { label: "Community Feed", to: "/feed" },
      { label: "Learning Center", to: "/learn" },
    ],
  },
  {
    title: "Support & Legal",
    links: [
      { label: "Help & Support", to: "/support" },
      { label: "Contact Us", to: "/contact" },
      { label: "Privacy Policy", to: "/privacy-policy" },
      { label: "Terms of Service", to: "/support" },
    ],
  },
];

const EMPLOYER_SECTIONS = [
  {
    title: "Recruitment Suite",
    links: [
      { label: "Post a Job", to: "/employer/jobs/new" },
      { label: "Employer Dashboard", to: "/employer" },
      { label: "Company Profile", to: "/employer/company" },
      { label: "AI Recruitment Suite", to: "/employer/intelligence" },
    ],
  },
  {
    title: "Solutions & Pricing",
    links: [
      { label: "Pricing Plans", to: "/pricing" },
      { label: "Enterprise Solutions", to: "/enterprise" },
      { label: "Learning Center", to: "/learn" },
    ],
  },
  {
    title: "Support & Legal",
    links: [
      { label: "Help & Support", to: "/support" },
      { label: "Contact Us", to: "/contact" },
      { label: "Privacy Policy", to: "/privacy-policy" },
      { label: "Terms of Service", to: "/support" },
    ],
  },
];

const ADMIN_SECTIONS = [
  {
    title: "Administration",
    links: [
      { label: "Admin Console", to: "/admin" },
      { label: "User Management", to: "/admin" },
      { label: "Manage Jobs", to: "/jobs" },
      { label: "Manage Companies", to: "/companies" },
    ],
  },
  {
    title: "AI Tools",
    links: [
      { label: "AI Career Hub", to: "/career" },
      { label: "Resume Scanner", to: "/resume-scanner" },
      { label: "Resume Builder", to: "/resume-builder" },
    ],
  },
  {
    title: "Support & Legal",
    links: [
      { label: "Help & Support", to: "/support" },
      { label: "Contact Us", to: "/contact" },
      { label: "Privacy Policy", to: "/privacy-policy" },
    ],
  },
];

const PUBLIC_SECTIONS = [
  {
    title: "AI Career Tools",
    links: [
      { label: "AI Career Hub", to: "/career" },
      { label: "AI Career Coach", to: "/career-coach" },
      { label: "Resume Scanner & ATS", to: "/resume-scanner" },
      { label: "Resume Builder", to: "/resume-builder" },
    ],
  },
  {
    title: "For Employers",
    links: [
      { label: "Post a Job", to: "/employer/jobs/new" },
      { label: "Employer Dashboard", to: "/employer" },
      { label: "Pricing Plans", to: "/pricing" },
      { label: "Enterprise Solutions", to: "/enterprise" },
    ],
  },
  {
    title: "Company & Support",
    links: [
      { label: "About Us", to: "/about" },
      { label: "Help & Support", to: "/support" },
      { label: "Contact Us", to: "/contact" },
      { label: "Privacy Policy", to: "/privacy-policy" },
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
  const { role } = useAuth();

  const isAdmin = role === "admin";
  const isEmployer = role === "employer";
  const isJobSeeker = role === "job_seeker";

  // Select navigation links based on user role
  let sections = PUBLIC_SECTIONS;
  let brandDescription =
    "Nepal's next-generation AI job portal. Match with top employers, optimize your resume, and accelerate your career with smart career tools.";
  let logoLink = "/";

  if (isAdmin) {
    sections = ADMIN_SECTIONS;
    brandDescription =
      "Administrator control hub for Jagire.com. Oversee users, companies, listings, and platform operations.";
    logoLink = "/admin";
  } else if (isEmployer) {
    sections = EMPLOYER_SECTIONS;
    brandDescription =
      "Enterprise & SMB talent acquisition suite. Post jobs, screen candidates with AI, and scale your hiring across Nepal.";
    logoLink = "/employer";
  } else if (isJobSeeker) {
    sections = JOB_SEEKER_SECTIONS;
    brandDescription =
      "AI-powered job portal connecting talent with opportunity. Find your next role, build your resume, and ace your interviews.";
    logoLink = "/";
  }

  return (
    <footer className="mt-20 border-t border-border/50 bg-card/30 backdrop-blur-sm text-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12">
          {/* Brand and Description Column */}
          <div className="md:col-span-4 lg:col-span-4 space-y-4">
            <Link to={logoLink} className="inline-flex items-center gap-2.5 group">
              <img
                src="/Jagire-logo.png"
                alt="Jagire"
                className="h-9 w-auto transition-transform duration-200 group-hover:scale-105"
              />
              <span className="text-xl font-bold gradient-text tracking-tight">Jagire</span>
            </Link>

            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              {brandDescription}
            </p>

            {/* Location */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-0.5">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <MapPin className="h-3.5 w-3.5" />
              </div>
              <span className="font-medium text-foreground/80">Kathmandu, Nepal</span>
            </div>

            {/* Social Media Links */}
            <div className="flex items-center gap-2 pt-1">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="h-8 w-8 rounded-lg border border-border/60 bg-background/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted hover:border-primary/40 transition-all duration-200"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Links Columns */}
          <div
            className={`md:col-span-8 lg:col-span-8 grid gap-8 ${
              sections.length === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3"
            }`}
          >
            {sections.map((section) => (
              <div key={section.title} className="space-y-3.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  {section.title}
                </h4>
                <ul className="space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center group"
                      >
                        <span className="opacity-0 group-hover:opacity-100 -ml-3 group-hover:ml-0 group-hover:mr-1.5 transition-all duration-200 text-primary">
                          <ArrowRight className="h-3 w-3" />
                        </span>
                        <span>{link.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Subtle Container-Aligned Separator */}
        <div className="mt-12 mb-8 border-t border-border/40" />

        {/* Bottom Bar: Copyright & Legal */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Jagire. All rights reserved.</p>
          <div className="flex items-center gap-6 flex-wrap justify-center">
            <Link to="/privacy-policy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/support" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link to="/support" className="hover:text-foreground transition-colors">
              Support & FAQ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
