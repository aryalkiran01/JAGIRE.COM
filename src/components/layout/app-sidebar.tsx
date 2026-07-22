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
  MessageSquare,
  Bell,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

const SEEKER_NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/jobs", label: "Browse Jobs", icon: Briefcase },
  { to: "/applications", label: "Applications", icon: Target },
  { to: "/saved", label: "Saved Jobs", icon: Bookmark },
  { to: "/interviews", label: "Interviews", icon: Video },
  { to: "/resume-scanner", label: "Resume Scanner", icon: ScanText },
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
  { to: "/employer/jobs", label: "Job Posts", icon: Briefcase },
  { to: "/employer/interviews", label: "Interviews", icon: Video },
  { to: "/employer/company", label: "Company", icon: Building2 },
  { to: "/applications", label: "Applications", icon: Target },
  { to: "/feed", label: "Community Feed", icon: Rss },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/profile", label: "Profile", icon: User },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { role } = useAuth();

  const nav = role === "employer" ? EMPLOYER_NAV : SEEKER_NAV;

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-border/40 bg-card/30 backdrop-blur-sm sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
      <nav className="flex-1 p-3 space-y-0.5">
        {nav.map((item) => {
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                active
                  ? "gradient-brand text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
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
