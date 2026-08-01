import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Briefcase,
  Bookmark,
  Building2,
  Rss,
  Video,
  FileText,
  ScanText,
  Target,
  GraduationCap,
  Gift,
  BookOpen,
  Shield,
  MessageSquare,
  Bell,
  User,
  BrainCircuit,
  Sparkles,
  ChevronDown,
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
  { to: "/jobs", label: "Browse Jobs", icon: Briefcase },
  { to: "/applications", label: "Applications", icon: Target },
  { to: "/saved", label: "Saved Jobs", icon: Bookmark },
  { to: "/interviews", label: "Interviews", icon: Video },
  { to: "/resume-scanner", label: "Resume Scanner", icon: ScanText },
  { to: "/career-coach", label: "AI Career Coach", icon: BrainCircuit },
  { to: "/ai-assistant", label: "AI Assistant", icon: Sparkles },
  { to: "/resume-builder", label: "Resume Builder", icon: FileText },
  { to: "/assessments", label: "Assessments", icon: GraduationCap },
  { to: "/companies", label: "Companies", icon: Building2 },
  { to: "/feed", label: "Community Feed", icon: Rss },
  { to: "/learn", label: "Learning Center", icon: BookOpen },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/referrals", label: "Refer & Earn", icon: Gift },
  { to: "/profile", label: "Profile", icon: User },
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
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/profile", label: "Profile", icon: User },
];

function NavLink({ item }: { item: NavItem }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = pathname === item.to || pathname.startsWith(item.to + "/");
  return (
    <Link
      to={item.to}
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
>({ group, defaultOpen }: { group: T; defaultOpen: boolean }) {
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
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { role } = useAuth();
  const isEmployer = role === "employer";
  const nav = isEmployer ? EMPLOYER_NAV : SEEKER_NAV;

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-border/40 bg-card/30 backdrop-blur-sm sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
      <nav className="flex-1 p-3 space-y-0.5">
        {nav.map((item) => (
          <NavLink key={item.to} item={item} />
        ))}

        {isEmployer ? (
          <>
            <div className="px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-primary/70 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              AI Features
            </div>
            {EMPLOYER_AI_GROUPS.map((group, idx) => (
              <AiGroupCollapsible key={group.id} group={group} defaultOpen={idx === 0} />
            ))}
          </>
        ) : (
          <>
            <div className="px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-primary/70 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              AI Tools
            </div>
            {JOBSEEKER_AI_GROUPS.map((group, idx) => (
              <AiGroupCollapsible key={group.id} group={group} defaultOpen={idx === 0} />
            ))}
          </>
        )}
      </nav>
      <div className="p-3 border-t border-border/40">
        <Link
          to="/referrals"
          className="block rounded-xl border border-border/40 bg-gradient-to-br from-primary/5 to-accent/5 p-4 hover:shadow-card-soft transition-all"
        >
          <div className="flex items-center gap-2 mb-1">
            <Gift className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Refer & Earn</span>
          </div>
          <p className="text-xs text-muted-foreground">Invite friends, earn rewards</p>
        </Link>
      </div>
    </aside>
  );
}
