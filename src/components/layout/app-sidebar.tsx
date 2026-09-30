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
  Target,
  BookOpen,
  Shield,
  TrendingUp,
  Bookmark,
  X,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef } from "react";

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
  { to: "/jobs", label: "Find Jobs", icon: Briefcase },
  { to: "/applications", label: "My Applications", icon: Target },
  { to: "/saved", label: "Saved Jobs", icon: Bookmark },
  { to: "/profile", label: "My Profile", icon: User },
];

const EMPLOYER_NAV: NavItem[] = [
  { to: "/employer", label: "Employer Dashboard", icon: LayoutDashboard },
  { to: "/employer/jobs/new", label: "Post a Job", icon: Briefcase },
  { to: "/employer/interviews", label: "Interview Sessions", icon: Video },
  { to: "/employer/company", label: "Company Profile", icon: Building2 },
  { to: "/profile", label: "My Profile", icon: User },
];

const ADMIN_NAV: NavItem[] = [
  { to: "/admin", label: "Admin Console", icon: Shield },
  { to: "/dashboard", label: "User Dashboard", icon: LayoutDashboard },
  { to: "/jobs", label: "Manage Jobs", icon: Briefcase },
  { to: "/companies", label: "Manage Companies", icon: Building2 },
  { to: "/profile", label: "My Profile", icon: User },
];

function NavLink({
  item,
  isCollapsed = false,
  onNavigate,
}: {
  item: NavItem;
  isCollapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to + "/"));
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      title={isCollapsed ? item.label : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        active
          ? "gradient-brand text-primary-foreground shadow-glow"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
        isCollapsed && "justify-center px-2",
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {!isCollapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

export function AppSidebar() {
  const { user, role } = useAuth();
  const { isOpen, closeMobile, isCollapsed, toggleCollapsed } = useSidebar();
  const isEmployer = role === "employer";
  const nav = !user
    ? GUEST_NAV
    : role === "admin"
      ? ADMIN_NAV
      : isEmployer
        ? EMPLOYER_NAV
        : SEEKER_NAV;

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const prevPathnameRef = useRef(pathname);

  // Determine if this is an authenticated/dashboard section where desktop sidebar is displayed
  const isDashboardRoute =
    !!user ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/employer") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/applications") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/saved") ||
    pathname.startsWith("/messages") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/resume-") ||
    pathname.startsWith("/career-coach");

  // Auto-close mobile drawer on route changes
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      closeMobile();
    }
  }, [pathname, closeMobile]);

  // Handle ESC key to close mobile drawer
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMobile();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeMobile]);

  return (
    <>
      {/* Mobile Drawer (< lg screens) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
        >
          {/* Soft backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-fade-in"
            onClick={closeMobile}
            aria-hidden="true"
          />

          {/* Slide-out Drawer Panel */}
          <aside className="fixed inset-y-0 left-0 z-50 w-[260px] max-w-[85vw] bg-card border-r border-border shadow-2xl flex flex-col pt-3 overflow-y-auto animate-slide-in-left">
            <div className="flex items-center justify-between px-4 pb-3 border-b border-border/50">
              <Link to="/" onClick={closeMobile} className="flex items-center gap-2">
                <span className="text-xl font-bold gradient-text tracking-tight">JAGIRE</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeMobile}
                aria-label="Close menu"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 pb-10">
              {nav.map((item) => (
                <NavLink key={item.to} item={item} onNavigate={closeMobile} />
              ))}

              {!user && (
                <div className="pt-4 px-2 space-y-2 border-t mt-4">
                  <Button variant="outline" className="w-full" asChild onClick={closeMobile}>
                    <Link to="/sign-in">Sign In</Link>
                  </Button>
                  <Button
                    className="w-full gradient-brand text-primary-foreground"
                    asChild
                    onClick={closeMobile}
                  >
                    <Link to="/sign-up">Get Started</Link>
                  </Button>
                </div>
              )}
            </nav>
          </aside>
        </div>
      )}

      {/* Desktop Inline Sidebar (lg: screens) - Active on Dashboard/Auth routes */}
      {isDashboardRoute && (
        <aside
          className={cn(
            "hidden lg:flex lg:shrink-0 lg:flex-col lg:bg-card/40 lg:border-r lg:border-border/40 lg:h-[calc(100vh-4rem)] lg:sticky lg:top-16 overflow-y-auto z-30 transition-[width] duration-200 ease-in-out",
            isCollapsed ? "lg:w-[72px]" : "lg:w-[250px]",
          )}
          aria-label="Sidebar Navigation"
        >
          <div
            className={cn(
              "flex items-center justify-between px-3 py-3 border-b border-border/40",
              isCollapsed && "justify-center px-1",
            )}
          >
            {!isCollapsed && (
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Navigation
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapsed}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div>

          <nav className="flex-1 px-3 py-3 space-y-1 pb-10">
            {nav.map((item) => (
              <NavLink key={item.to} item={item} isCollapsed={isCollapsed} />
            ))}

            {!user && (
              <div className="pt-4 px-2 space-y-2 border-t mt-4">
                <Button variant="outline" className={cn("w-full", isCollapsed && "px-0")} asChild>
                  <Link to="/sign-in">{isCollapsed ? "In" : "Sign In"}</Link>
                </Button>
                <Button
                  className={cn("w-full gradient-brand text-primary-foreground", isCollapsed && "px-0")}
                  asChild
                >
                  <Link to="/sign-up">{isCollapsed ? "Up" : "Get Started"}</Link>
                </Button>
              </div>
            )}
          </nav>
        </aside>
      )}
    </>
  );
}
