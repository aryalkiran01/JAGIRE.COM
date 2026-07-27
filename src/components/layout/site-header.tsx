import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
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
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SubscriptionBadge } from "@/components/subscription-badge";
import {
  LayoutDashboard,
  LogOut,
  User,
  Bookmark,
  MessageSquare,
  Bell,
  FileText,
  GraduationCap,
  Gift,
  Pencil,
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
  { to: "/assessments", label: "Assessments", icon: GraduationCap, desc: "Skill tests" },
  { to: "/learn", label: "Learning Center", icon: BookOpen, desc: "Courses & guides" },
  { to: "/referrals", label: "Refer & Earn", icon: Gift, desc: "Invite friends" },
];

export function SiteHeader() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

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

    // Remove any existing channel with the same topic
    supabase
      .getChannels()
      .filter((c) => c.topic === `realtime:${topic}`)
      .forEach((c) => {
        void supabase.removeChannel(c);
      });

    const channel = supabase
      .channel(topic)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["notif-unread"] });
          qc.invalidateQueries({ queryKey: ["notif"] });
        },
      )
      .subscribe((status) => {
        console.log("Notification channel:", status);
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, qc]);

  const dashPath = role === "admin" ? "/admin" : role === "employer" ? "/employer" : "/dashboard";

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-border/40">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src="/Jagire-logo.png" alt="Jagire" className="h-10 w-auto" />
          <span className="text-xl font-bold gradient-text">Jagire</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          <NavLink to="/jobs">Browse Jobs</NavLink>
          <NavLink to="/companies">Companies</NavLink>
          {user && <NavLink to="/feed">Feed</NavLink>}
          <NavLink to="/about">About</NavLink>
          <NavLink to="/pricing">Pricing</NavLink>

          {/* Features dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-0.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50">
                Features
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-105 p-2">
              <div className="grid grid-cols-2 gap-1">
                {FEATURE_LINKS.map((f) => (
                  <DropdownMenuItem key={f.to} asChild className="p-3 rounded-lg">
                    <Link to={f.to}>
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg gradient-brand/10 bg-primary/10">
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
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-1.5">
          {/* Theme toggle */}
          <Button variant="ghost" size="icon" onClick={toggle} className="h-9 w-9">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {user ? (
            <>
              <SubscriptionBadge />
              <Button variant="ghost" size="icon" asChild className="relative h-9 w-9">
                <Link to="/notifications">
                  <Bell className="h-4 w-4" />
                  {unread ? (
                    <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full gradient-brand text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  ) : null}
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 ml-1">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback className="gradient-brand text-primary-foreground text-sm font-semibold">
                        {(user.email?.[0] ?? "U").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium truncate max-w-50">
                        {user.user_metadata?.full_name ?? user.email}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {role?.replace("_", " ")}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={dashPath}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/resume-scanner">
                      <ScanText className="mr-2 h-4 w-4" />
                      Resume Scanner
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/resume-builder">
                      <FileText className="mr-2 h-4 w-4" />
                      Resume Builder
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/interviews">
                      <Video className="mr-2 h-4 w-4" />
                      Interviews
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/saved">
                      <Bookmark className="mr-2 h-4 w-4" />
                      Saved Jobs
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/messages">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Messages
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/assessments">
                      <GraduationCap className="mr-2 h-4 w-4" />
                      Assessments
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/learn">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Learning Center
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/feed">
                      <Rss className="mr-2 h-4 w-4" />
                      Feed
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/referrals">
                      <Gift className="mr-2 h-4 w-4" />
                      Refer & Earn
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/blog-editor">
                      <Pencil className="mr-2 h-4 w-4" />
                      Write Blog
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild className="gradient-brand text-primary-foreground hover:opacity-90">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Get started
                </Link>
              </Button>
            </div>
          )}

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>
                  <img src="/Jagire-logo.png" alt="Jagire" className="h-10 w-auto" />
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-1">
                <MobileLink
                  to="/jobs"
                  image="/Jagire-logo.png"
                  label="Browse Jobs"
                  onClick={() => setMobileOpen(false)}
                />
                <MobileLink
                  to="/companies"
                  icon={Building2}
                  label="Companies"
                  onClick={() => setMobileOpen(false)}
                />
                {user && (
                  <MobileLink
                    to="/feed"
                    icon={Rss}
                    label="Community Feed"
                    onClick={() => setMobileOpen(false)}
                  />
                )}
                <MobileLink
                  to="/about"
                  icon={Sparkles}
                  label="About"
                  onClick={() => setMobileOpen(false)}
                />
                <MobileLink
                  to="/pricing"
                  icon={Target}
                  label="Pricing"
                  onClick={() => setMobileOpen(false)}
                />
                <div className="my-2 border-t" />
                {FEATURE_LINKS.map((f) => (
                  <MobileLink
                    key={f.to}
                    to={f.to}
                    icon={f.icon}
                    label={f.label}
                    onClick={() => setMobileOpen(false)}
                  />
                ))}
                {!user && (
                  <div className="pt-4 space-y-2">
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/auth" onClick={() => setMobileOpen(false)}>
                        Sign in
                      </Link>
                    </Button>
                    <Button className="w-full gradient-brand text-primary-foreground" asChild>
                      <Link
                        to="/auth"
                        search={{ mode: "signup" }}
                        onClick={() => setMobileOpen(false)}
                      >
                        Get started
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50"
    >
      {children}
    </Link>
  );
}

function MobileLink({
  to,
  icon: Icon,
  image,
  label,
  onClick,
}: {
  to: string;
  icon?: LucideIcon;
  image?: string;

  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50"
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {label}
    </Link>
  );
}
