import { Link } from "@tanstack/react-router";
import { Briefcase } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t bg-card mt-24">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand">
                <Briefcase className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg gradient-text">Jagire</span>
            </div>
            <p className="text-sm text-muted-foreground">
              AI-powered job portal connecting talent with opportunity.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">For Job Seekers</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/jobs" className="hover:text-foreground">
                  Browse Jobs
                </Link>
              </li>
              <li>
                <Link to="/companies" className="hover:text-foreground">
                  Companies
                </Link>
              </li>
              <li>
                <Link to="/resume-scanner" className="hover:text-foreground">
                  AI Resume Scanner
                </Link>
              </li>
              <li>
                <Link to="/career" className="hover:text-foreground">
                  Career Advice
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">For Employers</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/employer" className="hover:text-foreground">
                  Post a Job
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-foreground">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-foreground">
                  About Us
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/contact" className="hover:text-foreground">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/support" className="hover:text-foreground">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-foreground">
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
