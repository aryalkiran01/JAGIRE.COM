import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Lock,
  Eye,
  FileText,
  UserCheck,
  Server,
  Cpu,
  CreditCard,
  Calendar,
  Share2,
  Trash2,
  Mail,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Jagire" },
      {
        name: "description",
        content:
          "Read the Jagire Privacy Policy. Learn how we collect, protect, and handle your career data, resumes, AI interactions, and payments with security and transparency.",
      },
    ],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  const lastUpdated = "September 17, 2026";

  return (
    <>
      <div className="min-h-screen bg-background text-foreground">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 md:py-24 border-b border-border/40 bg-muted/20">
          <div className="absolute inset-0 gradient-hero opacity-10 pointer-events-none" />
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full gradient-brand opacity-15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-accent opacity-15 blur-3xl pointer-events-none" />

          <div className="container relative mx-auto px-4 text-center max-w-3xl space-y-4">
            <Badge variant="secondary" className="glass gap-1.5 px-3 py-1">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Privacy & Data Protection
            </Badge>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              Privacy <span className="gradient-text">Policy</span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              At Jagire, your career aspirations and personal documents are treated with the highest
              level of confidentiality, security, and integrity.
            </p>

            <div className="pt-2 text-xs font-medium text-muted-foreground">
              Last Updated: <span className="text-foreground">{lastUpdated}</span> · Effective Immediately
            </div>
          </div>
        </section>

        {/* Core Commitments Grid */}
        <section className="py-12 border-b border-border/40">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="glass shadow-card-soft border-border/60">
                <CardContent className="p-5 space-y-2.5">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Lock className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-sm">Encrypted Storage</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    OAuth tokens, credentials, and files are encrypted with AES-GCM and strict Row Level Security (RLS).
                  </p>
                </CardContent>
              </Card>

              <Card className="glass shadow-card-soft border-border/60">
                <CardContent className="p-5 space-y-2.5">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-sm">Responsible AI</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your resumes and career context are never sold or used to train public foundation models.
                  </p>
                </CardContent>
              </Card>

              <Card className="glass shadow-card-soft border-border/60">
                <CardContent className="p-5 space-y-2.5">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-sm">Applicant Control</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    You decide which employers view your applications, resumes, and contact credentials.
                  </p>
                </CardContent>
              </Card>

              <Card className="glass shadow-card-soft border-border/60">
                <CardContent className="p-5 space-y-2.5">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-sm">Zero Financial Storage</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Payments are handled securely via eSewa. We never store bank passwords or credit card numbers.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Policy Content Sections */}
        <main className="container mx-auto px-4 py-16 max-w-4xl space-y-12">
          {/* 1. Introduction */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Introduction</h2>
            </div>
            <div className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground text-sm sm:text-base leading-relaxed space-y-3">
              <p>
                Welcome to <strong>Jagire</strong> ("Jagire.com", "we", "our", or "us"). We provide an
                intelligent employment marketplace and AI-assisted career development platform designed
                for job seekers, recruiters, and companies across Nepal and beyond.
              </p>
              <p>
                This Privacy Policy explains how we collect, store, utilize, and protect your personal
                information when you access our web application, tools, and services. By creating an account
                or using Jagire, you agree to the collection and use of information in accordance with this policy.
              </p>
            </div>
          </section>

          {/* 2. Information We Collect */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Information We Collect</h2>
            </div>
            <div className="space-y-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
              <p>We collect information that you directly provide to us, as well as data generated during platform usage:</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="glass border-border/50">
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      <UserCheck className="h-4 w-4 text-primary" />
                      Account & Identity
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Full name, email address, password hash, role selection (job seeker or employer), avatar image, and verification metadata.
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass border-border/50">
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      <FileText className="h-4 w-4 text-primary" />
                      Career & Resume Content
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Work experience, education, skills, portfolio links (GitHub, LinkedIn), uploaded PDF/DOCX files, cover letters, and parsed ATS data.
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass border-border/50">
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      <Server className="h-4 w-4 text-primary" />
                      Employer & Job Postings
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Company name, registration documents, job descriptions, salary ranges, candidate pipeline notes, and recruiter reviews.
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass border-border/50">
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      <Calendar className="h-4 w-4 text-primary" />
                      Integrations & OAuth
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Encrypted tokens for Google Calendar interview scheduling, created only upon your explicit authorization and revocable at will.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* 3. How We Use Your Data */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h2 className="text-2xl font-bold tracking-tight">How We Use Your Data</h2>
            </div>
            <div className="space-y-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              <ul className="space-y-2.5">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-1" />
                  <span><strong>Connecting Applicants & Employers:</strong> Routing applications, sharing resumes with hiring teams, and updating candidate statuses.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-1" />
                  <span><strong>AI Career Tools & Optimization:</strong> Generating ATS scorecards, personalized career roadmaps, interview coaching, and skill gap recommendations.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-1" />
                  <span><strong>Payment Verification & Subscriptions:</strong> Authorizing eSewa payment callbacks and unlocking premium features securely.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-1" />
                  <span><strong>Platform Safety & Abuse Prevention:</strong> Rate limiting, bot mitigation, spam detection in community feeds, and RLS enforcement.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* 4. AI Processing & Model Privacy */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                4
              </div>
              <h2 className="text-2xl font-bold tracking-tight">AI Processing & Model Privacy</h2>
            </div>
            <Card className="glass border-primary/20 bg-primary/5">
              <CardContent className="p-6 space-y-3 text-sm text-foreground leading-relaxed">
                <div className="flex items-center gap-2 font-bold text-primary">
                  <Sparkles className="h-4 w-4" />
                  Enterprise AI Privacy Standard
                </div>
                <p className="text-muted-foreground">
                  Jagire utilizes Google Gemini and high-reliability cloud inference APIs to power resume parsing, ATS scoring, and interview practice.
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-muted-foreground">
                  <li>Your documents and prompt contexts are sent over encrypted TLS connections.</li>
                  <li>Inference requests are stateless; providers do not retain or use your personal resume text to train generic public models.</li>
                  <li>All AI outputs are validated against strict data schemas before display.</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* 5. Data Sharing & Third Parties */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                5
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Data Sharing & Third Parties</h2>
            </div>
            <div className="space-y-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              <p>
                We do not sell, rent, or trade your personal information. We only share data in the following circumstances:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-2" />
                  <span><strong>Hiring Companies:</strong> When you submit a job application, the hiring team of that specific employer receives your profile, resume, and contact details.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-2" />
                  <span><strong>Infrastructure & Payment Processors:</strong> We partner with trusted providers including Supabase (data storage & auth) and eSewa (payment processing).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-2" />
                  <span><strong>Legal Compliance:</strong> If required by Nepali law or valid subpoena, we may disclose necessary records in compliance with applicable regulations.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* 6. Your Rights & Controls */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                6
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Your Rights & Controls</h2>
            </div>
            <div className="space-y-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              <p>You have full ownership of your data on Jagire:</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="p-4 rounded-lg bg-muted/40 border border-border/40 space-y-1">
                  <h4 className="font-semibold text-sm text-foreground">Access & Edit</h4>
                  <p className="text-xs text-muted-foreground">Modify your profile, experience, skills, and resume attachments directly from your profile settings at any time.</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/40 border border-border/40 space-y-1">
                  <h4 className="font-semibold text-sm text-foreground">Revoke Integrations</h4>
                  <p className="text-xs text-muted-foreground">Disconnect third-party accounts (e.g. Google Calendar) with a single click in your account settings.</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/40 border border-border/40 space-y-1">
                  <h4 className="font-semibold text-sm text-foreground">Data Deletion</h4>
                  <p className="text-xs text-muted-foreground">Request permanent account deletion and complete erasure of your resumes, activities, and application history.</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/40 border border-border/40 space-y-1">
                  <h4 className="font-semibold text-sm text-foreground">Communication Preferences</h4>
                  <p className="text-xs text-muted-foreground">Manage your notification settings for job updates, interview requests, and application statuses.</p>
                </div>
              </div>
            </div>
          </section>

          {/* 7. Contact Us */}
          <section className="space-y-4 pt-4 border-t border-border/40">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                7
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Contact & Privacy Inquiries</h2>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, our Data Protection Team is here to help:
            </p>

            <Card className="glass border-border/60">
              <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-bold text-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    Jagire Privacy Team
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Email: <a href="mailto:privacy@jagire.com" className="text-primary hover:underline">privacy@jagire.com</a> · Kathmandu, Nepal
                  </p>
                </div>
                <Button asChild className="gradient-brand text-primary-foreground">
                  <Link to="/contact">
                    Contact Support
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
      <SiteFooter />
    </>
  );
}
