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
  ChevronDown,
  X,
  type LucideIcon,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { EMPLOYER_AI_GROUPS } from "@/lib/employer-ai-features";
import { JOBSEEKER_AI_GROUPS } from "@/lib/jobseeker-ai-features";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  description?: string;
};

const SEEKER_NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/applications", label: "Applications", icon: Target },
  { to: "/interviews", label: "Interviews", icon: Video },
  { to: "/career-coach", label: "AI Career Coach", icon: BrainCircuit },
  { to: "/ai-assistant", label: "AI Assistant", icon: Sparkles },
  { to: "/resume-builder", label: "Resume Builder", icon: FileText },
  { to: "/feed", label: "Community Feed", icon: Rss },
  { to: "/learn", label: "Learning Center", icon: BookOpen },
];

const ADMIN_NAV: NavItem[] = [
  { to: "/admin", label: "Admin Panel", icon: Shield },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/applications", label: "Applications", icon: Target },
  { to: "/interviews", label: "Interviews", icon: Video },
  { to: "/career-coach", label: "AI Career Coach", icon: BrainCircuit },
  { to: "/ai-assistant", label: "AI Assistant", icon: Sparkles },
  { to: "/resume-builder", label: "Resume Builder", icon: FileText },
  { to: "/feed", label: "Community Feed", icon: Rss },
  { to: "/learn", label: "Learning Center", icon: BookOpen },
];

const EMPLOYER_NAV: NavItem[] = [
  { to: "/employer", label: "Dashboard", icon: LayoutDashboard },
  { to: "/employer/jobs/new", label: "Job Posts", icon: Briefcase },
  { to: "/employer/interviews", label: "Interviews", icon: Video },
  { to: "/employer/company", label: "Company", icon: Building2 },
  { to: "/employer/knowledge-base", label: "Knowledge Base", icon: BookOpen },
  { to: "/enterprise", label: "Enterprise", icon: Shield },
  { to: "/applications", label: "Applications", icon: Target },
  { to: "/feed", label: "Community Feed", icon: Rss },
];

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = pathname === item.to || pathname.startsWith(item.to + "/");
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
  const { role } = useAuth();
  const { isOpen, close } = useSidebar();
  const isEmployer = role === "employer";
  const nav = role === "admin" ? ADMIN_NAV : isEmployer ? EMPLOYER_NAV : SEEKER_NAV;

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Backdrop Overlay (< lg) */}
      <div
        className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden transition-opacity"
        onClick={close}
        aria-hidden="true"
      />

      {/* Sidebar Container */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border/40 shadow-2xl flex flex-col pt-16 lg:pt-0 lg:static lg:w-60 lg:shrink-0 lg:shadow-none lg:bg-card/30 lg:backdrop-blur-sm lg:h-[calc(100vh-4rem)] lg:sticky lg:top-16 overflow-y-auto animate-fade-in-right lg:animate-none">
        {/* Mobile Header with Close Button */}
        <div className="flex items-center justify-between p-3 border-b border-border/40 lg:hidden">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Navigation Menu
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={close}
            aria-label="Close sidebar"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 px-3 py-6 sm:py-8 space-y-1 pb-10">
          {nav.map((item) => (
            <NavLink key={item.to} item={item} onNavigate={close} />
          ))}

          {isEmployer ? (
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
          )}
        </nav>
      </aside>
    </>
  );
}
