import { Link } from "@tanstack/react-router";
import { Twitter, Linkedin, Github, Mail, ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const FOOTER_SECTIONS = [
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
    title: "For Employers",
    links: [
      { label: "Post a Job", to: "/employer" },
      { label: "Employer Dashboard", to: "/employer" },
      { label: "Pricing", to: "/pricing" },
      { label: "Enterprise", to: "/enterprise" },
      { label: "Knowledge Base", to: "/employer/knowledge-base" },
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

const SOCIAL_LINKS = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Github, href: "#", label: "GitHub" },
  { icon: Mail, href: "/contact", label: "Email" },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-24 border-t border-border/60 bg-gradient-to-b from-card/30 to-muted/30">
      {/* Top accent line */}
      <div className="h-1 gradient-brand" />

      <div className="container mx-auto px-4 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand column */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2 group">
              <img
                src="/Jagire-logo.png"
                alt="Jagire"
                className="h-10 w-auto transition-transform group-hover:scale-105"
              />
              <span className="text-xl font-bold gradient-text tracking-tight">Jagire</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              AI-powered job portal connecting talent with opportunity. Find your next role, build
              your resume, and ace your interviews — all in one place.
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

          {/* Link columns */}
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
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
          ))}
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
