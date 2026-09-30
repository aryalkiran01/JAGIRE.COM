import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useSidebar } from "@/hooks/use-sidebar";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SubscriptionBadge } from "@/components/subscription-badge";
import {
  LogOut,
  User,
  Bookmark,
  MessageSquare,
  Bell,
  FileText,
  GraduationCap,
  Gift,
  Rss,
  BookOpen,
  Video,
  Sun,
  Moon,
  Menu,
  ScanText,
  Building2,
  Target,
  ChevronDown,
  Shield,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

type FeatureLink = {
  to: string;
  label: string;
  icon: LucideIcon;
  desc: string;
};

const FEATURE_LINKS: FeatureLink[] = [
  {
    to: "/career",
    label: "AI Career Hub",
    icon: Sparkles,
    desc: "AI tools & career roadmap",
  },
  {
    to: "/resume-scanner",
    label: "Resume Scanner",
    icon: ScanText,
    desc: "AI-powered ATS scoring",
  },
  {
    to: "/resume-builder",
    label: "Resume Builder",
    icon: FileText,
    desc: "Build polished resumes",
  },
  { to: "/interviews", label: "Interview Prep", icon: Video, desc: "Practice & schedule" },
  { to: "/applications", label: "Job Tracker", icon: Target, desc: "Track applications" },
  { to: "/saved", label: "Saved Jobs", icon: Bookmark, desc: "Your bookmarked roles" },
  { to: "/companies", label: "Companies Hiring", icon: Building2, desc: "Browse employers" },
  { to: "/feed", label: "Community Feed", icon: Rss, desc: "Posts & networking" },
  { to: "/learn", label: "Learning Center", icon: BookOpen, desc: "Courses & guides" },
];

const NAV_LINKS = [
  { to: "/jobs", label: "Browse Jobs" },
  { to: "/interviews", label: "Interview Prep", authOnly: true },
  { to: "/career", label: "AI Career Hub", authOnly: true },
  { to: "/companies", label: "Companies" },
  { to: "/about", label: "About" },
  { to: "/pricing", label: "Pricing" },
];

export function SiteHeader() {
  const { user, role, signOut } = useAuth();
  const { displayName, avatarUrl } = useProfile();
  const { isOpen, toggle: toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [featuresMenuOpen, setFeaturesMenuOpen] = useState(false);
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  // Handle scroll state for sticky header glass effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cleanly close any open dropdown menus and restore body scroll/pointer-events on route transitions
  useEffect(() => {
    setProfileMenuOpen(false);
    setFeaturesMenuOpen(false);
    if (typeof document !== "undefined") {
      document.body.style.pointerEvents = "";
      document.body.style.overflow = "";
    }
  }, [currentPath]);

  const { data: unread } = useQuery({
    queryKey: ["notif-unread", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (
        await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user!.id)
          .eq("is_read", false)
      ).count ?? 0,
  });

  useEffect(() => {
    if (!user?.id) return;
    const topic = `notif:${user.id}`;
    supabase
      .getChannels()
      .filter((c) => c.topic === `realtime:${topic}`)
      .forEach((c) => void supabase.removeChannel(c));

    const channel = supabase
      .channel(topic)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["notif-unread"] });
          qc.invalidateQueries({ queryKey: ["notif"] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, qc]);

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const isActive = (to: string) => currentPath === to || (to !== "/" && currentPath.startsWith(to));

  const fallbackInitial = ((displayName || user?.email)?.[0] ?? "U").toUpperCase();

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "glass shadow-card-soft border-b border-border/60"
          : "bg-background/80 backdrop-blur-md border-b border-border/30"
      }`}
    >
      <div className="w-full px-3 sm:px-6 lg:px-8 flex h-16 items-center justify-between gap-2 sm:gap-4">
        {/* Left side: Menu trigger (☰) + Logo */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            aria-label={isOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={isOpen}
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Divider between menu button and logo */}
          <span className="hidden sm:block h-5 w-px bg-border/60" aria-hidden />

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group ml-0.5 sm:ml-1">
            <span className="text-xl font-bold gradient-text tracking-tight">JAGIRE</span>
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 lg:flex">
          {NAV_LINKS.filter((l) => !l.authOnly || user).map((link) => (
            <NavLink key={link.to} to={link.to} active={isActive(link.to)}>
              {link.label}
            </NavLink>
          ))}

          {/* Features dropdown for guests */}
          {!user && (
            <DropdownMenu modal={false} open={featuresMenuOpen} onOpenChange={setFeaturesMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-0.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50">
                  Features
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-[min(28rem,calc(100vw-2rem))] p-2">
                <div className="grid grid-cols-2 gap-1">
                  {FEATURE_LINKS.map((f) => (
                    <DropdownMenuItem
                      key={f.to}
                      asChild
                      className="p-3 rounded-lg"
                      onClick={() => setFeaturesMenuOpen(false)}
                    >
                      <Link to={f.to}>
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <f.icon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">{f.label}</div>
                            <div className="text-xs text-muted-foreground">{f.desc}</div>
                          </div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="h-8 w-8 sm:h-9 sm:w-9 shrink-0"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {user ? (
            <>
              <div className="hidden sm:inline-flex">
                <SubscriptionBadge />
              </div>
              <Button
                variant="ghost"
                size="icon"
                asChild
                aria-label="View messages"
                className="h-8 w-8 sm:h-9 sm:w-9 shrink-0"
              >
                <Link to="/messages">
                  <MessageSquare className="h-4 w-4" />
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                asChild
                aria-label="View notifications"
                className="relative h-8 w-8 sm:h-9 sm:w-9 shrink-0"
              >
                <Link to="/notifications">
                  <Bell className="h-4 w-4" />
                  {unread ? (
                    <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full gradient-brand text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  ) : null}
                </Link>
              </Button>

              <DropdownMenu modal={false} open={profileMenuOpen} onOpenChange={setProfileMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    aria-label="User profile and settings"
                    className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full p-0 ml-0.5 shrink-0"
                  >
                    <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                      <AvatarImage src={avatarUrl ?? undefined} key={avatarUrl ?? "no-avatar"} />
                      <AvatarFallback className="gradient-brand text-primary-foreground text-xs sm:text-sm font-semibold">
                        {fallbackInitial}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium truncate max-w-48">{displayName}</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {role?.replace("_", " ")}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild onClick={() => setProfileMenuOpen(false)}>
                    <Link to="/profile">
                      <User className="mr-2 h-4 w-4" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild onClick={() => setProfileMenuOpen(false)}>
                    <Link to="/career">
                      <Sparkles className="mr-2 h-4 w-4 text-primary" />
                      AI Career Hub
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild onClick={() => setProfileMenuOpen(false)}>
                    <Link to="/resume-scanner">
                      <ScanText className="mr-2 h-4 w-4" />
                      Resume Scanner
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild onClick={() => setProfileMenuOpen(false)}>
                    <Link to="/resume-builder">
                      <FileText className="mr-2 h-4 w-4" />
                      Resume Builder
                    </Link>
                  </DropdownMenuItem>
                  {role === "admin" && (
                    <DropdownMenuItem asChild onClick={() => setProfileMenuOpen(false)}>
                      <Link to="/admin">
                        <Shield className="mr-2 h-4 w-4 text-primary" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleSignOut();
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8 sm:h-9 px-2.5 sm:px-3 text-xs sm:text-sm"
              >
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button
                size="sm"
                asChild
                className="h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm gradient-brand text-primary-foreground hover:opacity-90 shadow-sm"
              >
                <Link to="/auth" search={{ mode: "signup" }}>
                  Get started
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({
  to,
  children,
  active,
}: {
  to: string;
  children: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:text-foreground hover:bg-muted/50 ${
        active ? "text-foreground" : "text-muted-foreground"
      }`}
    >
      {children}
      {active && (
        <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full gradient-brand" />
      )}
    </Link>
  );
}
