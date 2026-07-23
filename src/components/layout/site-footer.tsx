import { Link } from "@tanstack/react-router";
import { Briefcase, Twitter, Linkedin, Github, Mail } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t bg-card/50 backdrop-blur-sm mt-24">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand">
                <Briefcase className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg gradient-text">Jagire</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              AI-powered job portal connecting talent with opportunity.
            </p>
            <div className="flex gap-2">
              <SocialIcon icon={Twitter} href="#" />
              <SocialIcon icon={Linkedin} href="#" />
              <SocialIcon icon={Github} href="#" />
              <SocialIcon icon={Mail} href="/contact" />
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">For Job Seekers</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/jobs" className="hover:text-foreground transition-colors">
                  Browse Jobs
                </Link>
              </li>
              <li>
                <Link to="/companies" className="hover:text-foreground transition-colors">
                  Companies
                </Link>
              </li>
              <li>
                <Link to="/resume-scanner" className="hover:text-foreground transition-colors">
                  AI Resume Scanner
                </Link>
              </li>
              <li>
                <Link to="/resume-builder" className="hover:text-foreground transition-colors">
                  Resume Builder
                </Link>
              </li>
              <li>
                <Link to="/career" className="hover:text-foreground transition-colors">
                  Career Advice
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">For Employers</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/employer" className="hover:text-foreground transition-colors">
                  Post a Job
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-foreground transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/contact" className="hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/support" className="hover:text-foreground transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-sm text-muted-foreground text-center">
          © {new Date().getFullYear()} Jagire. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ icon: Icon, href }: { icon: any; href: string }) {
  return (
    <a
      href={href}
      className="h-8 w-8 rounded-lg border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-all"
    >
      <Icon className="h-4 w-4" />
    </a>
  );
}
