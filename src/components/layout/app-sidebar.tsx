import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  Rss,
  Video,
  FileText,
  Target,
  BookOpen,
  Shield,
  BrainCircuit,
  Sparkles,
  TrendingUp,
  ChevronDown,
  Bookmark,
  X,
  User,
  type LucideIcon,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useEffect } from "react";
import { EMPLOYER_AI_GROUPS } from "@/lib/employer-ai-features";
import { JOBSEEKER_AI_GROUPS } from "@/lib/jobseeker-ai-features";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  description?: string;
};

const GUEST_NAV: NavItem[] = [
  { to: "/jobs", label: "Browse Jobs", icon: Briefcase },
  { to: "/companies", label: "Companies", icon: Building2 },
  { to: "/feed", label: "Community Feed", icon: Rss },
  { to: "/learn", label: "Learning Center", icon: BookOpen },
  { to: "/about", label: "About Us", icon: BookOpen },
  { to: "/pricing", label: "Pricing", icon: TrendingUp },
];

const SEEKER_NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/jobs", label: "Browse Jobs", icon: Briefcase },
  { to: "/companies", label: "Companies", icon: Building2 },
  { to: "/applications", label: "Applications", icon: Target },
  { to: "/saved", label: "Saved", icon: Bookmark },
  { to: "/interviews", label: "Interviews", icon: Video },
  { to: "/career-coach", label: "AI Career Coach", icon: BrainCircuit },
  { to: "/ai-assistant", label: "AI Assistant", icon: Sparkles },
  { to: "/resume-builder", label: "Resume Builder", icon: FileText },
  { to: "/feed", label: "Community Feed", icon: Rss },
  { to: "/learn", label: "Learning Center", icon: BookOpen },
  { to: "/pricing", label: "Pricing", icon: TrendingUp },
];

const ADMIN_NAV: NavItem[] = [
  { to: "/admin", label: "Admin Panel", icon: Shield },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/jobs", label: "Browse Jobs", icon: Briefcase },
  { to: "/companies", label: "Companies", icon: Building2 },
  { to: "/applications", label: "Applications", icon: Target },
  { to: "/saved", label: "Saved", icon: Bookmark },
  { to: "/interviews", label: "Interviews", icon: Video },
  { to: "/career-coach", label: "AI Career Coach", icon: BrainCircuit },
  { to: "/ai-assistant", label: "AI Assistant", icon: Sparkles },
  { to: "/resume-builder", label: "Resume Builder", icon: FileText },
  { to: "/feed", label: "Community Feed", icon: Rss },
  { to: "/learn", label: "Learning Center", icon: BookOpen },
  { to: "/pricing", label: "Pricing", icon: TrendingUp },
];

const EMPLOYER_NAV: NavItem[] = [
  { to: "/employer", label: "Dashboard", icon: LayoutDashboard },
  { to: "/jobs", label: "Browse Jobs", icon: Briefcase },
  { to: "/companies", label: "Companies", icon: Building2 },
  { to: "/employer/intelligence", label: "Intelligence", icon: TrendingUp },
  { to: "/employer/jobs/new", label: "Job Posts", icon: Briefcase },
  { to: "/saved", label: "Saved", icon: Bookmark },
  { to: "/employer/interviews", label: "Interviews", icon: Video },
  { to: "/employer/company", label: "Company", icon: Building2 },
  { to: "/employer/knowledge-base", label: "Knowledge Base", icon: BookOpen },
  { to: "/enterprise", label: "Enterprise", icon: Shield },
  { to: "/applications", label: "Applications", icon: Target },
  { to: "/feed", label: "Community Feed", icon: Rss },
  { to: "/pricing", label: "Pricing", icon: TrendingUp },
];

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to + "/"));
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        active
          ? "gradient-brand text-primary-foreground shadow-glow"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function AiGroupCollapsible<
  T extends {
    id: string;
    label: string;
    icon: LucideIcon;
    items: { slug: string; title: string; description: string; to: string; icon: LucideIcon }[];
  },
>({ group, defaultOpen, onNavigate }: { group: T; defaultOpen: boolean; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(defaultOpen);
  const hasActive = group.items.some((i) => pathname === i.to || pathname.startsWith(i.to + "/"));

  return (
    <Collapsible open={open || hasActive} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
        aria-expanded={open || hasActive}
      >
        <group.icon className="h-4 w-4 shrink-0 text-primary" />
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform", (open || hasActive) && "rotate-180")}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-1 pl-2 space-y-0.5 data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden">
        {group.items.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.slug}
              to={item.to}
              onClick={onNavigate}
              title={item.description}
              className={cn(
                "group flex items-start gap-2.5 rounded-lg px-3 py-2 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 shrink-0 mt-0.5 transition-transform group-hover:scale-110",
                  active ? "text-primary" : "text-muted-foreground group-hover:text-primary",
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="font-medium leading-tight truncate">{item.title}</div>
                <div className="text-[11px] text-muted-foreground/80 leading-tight truncate">
                  {item.description}
                </div>
              </div>
            </Link>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function AppSidebar() {
  const { user, role } = useAuth();
  const { isOpen, close } = useSidebar();
  const isEmployer = role === "employer";
  const nav = !user
    ? GUEST_NAV
    : role === "admin"
      ? ADMIN_NAV
      : isEmployer
        ? EMPLOYER_NAV
        : SEEKER_NAV;

  // Handle ESC key to close sidebar
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <>
      {/* ── Mobile/Tablet Drawer (< lg) ────────────────────────── */}
      <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation Menu">
        {/* Soft overlay backdrop */}
        <div
          className="fixed inset-0 bg-black/40 transition-opacity animate-fade-in"
          onClick={close}
          aria-hidden="true"
        />

        {/* Slide-out Drawer Panel */}
        <aside
          className="fixed inset-y-0 left-0 z-50 w-[260px] max-w-[85vw] bg-card border-r border-border shadow-2xl flex flex-col pt-3 overflow-y-auto animate-fade-in-right"
        >
          <div className="flex items-center justify-between px-4 pb-3 border-b border-border/50">
            <Link to="/" onClick={close} className="flex items-center gap-2">
              <span className="text-xl font-bold gradient-text tracking-tight">JAGIRE</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={close}
              aria-label="Close menu"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 pb-10">
            {nav.map((item) => (
              <NavLink key={item.to} item={item} onNavigate={close} />
            ))}

            {user ? (
              isEmployer ? (
                <>
                  <div className="px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-primary/70 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    AI Features
                  </div>
                  {EMPLOYER_AI_GROUPS.map((group, idx) => (
                    <AiGroupCollapsible
                      key={group.id}
                      group={group}
                      defaultOpen={idx === 0}
                      onNavigate={close}
                    />
                  ))}
                </>
              ) : (
                <>
                  <div className="px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-primary/70 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    AI Tools
                  </div>
                  {JOBSEEKER_AI_GROUPS.map((group, idx) => (
                    <AiGroupCollapsible
                      key={group.id}
                      group={group}
                      defaultOpen={idx === 0}
                      onNavigate={close}
                    />
                  ))}
                </>
              )
            ) : (
              <div className="pt-4 px-2 space-y-2 border-t mt-4">
                <Button variant="outline" className="w-full" asChild onClick={close}>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button
                  className="w-full gradient-brand text-primary-foreground"
                  asChild
                  onClick={close}
                >
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Get Started
                  </Link>
                </Button>
              </div>
            )}
          </nav>
        </aside>
      </div>

      {/* ── Desktop Inline Sidebar (lg: screens) ──────────────────── */}
      {/* Participates directly in flex layout (w-[260px] shrink-0), never overlaps main content */}
      <aside
        className="hidden lg:flex lg:w-[260px] lg:shrink-0 lg:flex-col lg:bg-card/40 lg:border-r lg:border-border/40 lg:h-[calc(100vh-4rem)] lg:sticky lg:top-16 overflow-y-auto z-30"
        aria-label="Sidebar Navigation"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Navigation</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={close}
            aria-label="Collapse sidebar"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-1 pb-10">
          {nav.map((item) => (
            <NavLink key={item.to} item={item} />
          ))}

          {user ? (
            isEmployer ? (
              <>
                <div className="px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-primary/70 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Features
                </div>
                {EMPLOYER_AI_GROUPS.map((group, idx) => (
                  <AiGroupCollapsible
                    key={group.id}
                    group={group}
                    defaultOpen={idx === 0}
                  />
                ))}
              </>
            ) : (
              <>
                <div className="px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-primary/70 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Tools
                </div>
                {JOBSEEKER_AI_GROUPS.map((group, idx) => (
                  <AiGroupCollapsible
                    key={group.id}
                    group={group}
                    defaultOpen={idx === 0}
                  />
                ))}
              </>
            )
          ) : (
            <div className="pt-4 px-2 space-y-2 border-t mt-4">
              <Button variant="outline" className="w-full" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button
                className="w-full gradient-brand text-primary-foreground"
                asChild
              >
                <Link to="/auth" search={{ mode: "signup" }}>
                  Get Started
                </Link>
              </Button>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}
