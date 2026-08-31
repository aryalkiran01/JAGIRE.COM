import { Link } from "@tanstack/react-router";
import { Crown, Sparkles, Zap, Building2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSubscription, PLAN_NAMES, isEmployerPlan } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";

export function SubscriptionBadge() {
  const { role } = useAuth();
  const { data: sub, isLoading } = useSubscription();

  // Don't show subscription badge for admins
  if (role === "admin") return null;

  if (isLoading) return null;

  if (!sub?.isPremium) {
    return (
      <Button
        asChild
        size="sm"
        className="h-8 gap-1.5 text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-300 group"
      >
        <Link to="/pricing">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          Upgrade
          <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </Button>
    );
  }

  const planLabel = PLAN_NAMES[sub.plan_type ?? ""] ?? "Premium";
  const expiry = sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() : null;
  const days = sub.daysRemaining;
  const isEmployer = isEmployerPlan(sub.plan_type);

  const getBadgeStyles = () => {
    if (sub.plan_type === "enterprise") {
      return "border-purple-400 bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700 hover:from-purple-100 hover:to-violet-100 dark:border-purple-700 dark:from-purple-950 dark:to-violet-950 dark:text-purple-300 dark:hover:from-purple-900 dark:hover:to-violet-900 shadow-lg shadow-purple-500/20";
    }
    if (sub.plan_type === "professional") {
      return "border-blue-400 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 hover:from-blue-100 hover:to-cyan-100 dark:border-blue-700 dark:from-blue-950 dark:to-cyan-950 dark:text-blue-300 dark:hover:from-blue-900 dark:hover:to-cyan-900 shadow-lg shadow-blue-500/20";
    }
    if (sub.plan_type === "starter") {
      return "border-emerald-400 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 hover:from-emerald-100 hover:to-teal-100 dark:border-emerald-700 dark:from-emerald-950 dark:to-teal-950 dark:text-emerald-300 dark:hover:from-emerald-900 dark:hover:to-teal-900 shadow-lg shadow-emerald-500/20";
    }
    return "border-amber-400 bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 hover:from-amber-100 hover:to-yellow-100 dark:border-amber-700 dark:from-amber-950 dark:to-yellow-950 dark:text-amber-300 dark:hover:from-amber-900 dark:hover:to-yellow-900 shadow-lg shadow-amber-500/20";
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to="/pricing"
            className={`group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-300 hover:scale-105 ${getBadgeStyles()}`}
          >
            {isEmployer ? <Building2 className="h-3.5 w-3.5" /> : <Crown className="h-3.5 w-3.5" />}
            <span className="relative">
              {planLabel}
              {days != null && days > 0 && days <= 7 && (
                <span className="absolute -top-1 -right-2 h-2 w-2 rounded-full bg-red-500 animate-ping" />
              )}
            </span>
            {days != null && days > 0 ? (
              <Badge
                variant="secondary"
                className={`ml-0.5 h-5 px-1.5 text-[10px] leading-none font-bold ${
                  days <= 7
                    ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                    : "bg-white/50 text-inherit dark:bg-black/30"
                }`}
              >
                {days}d
              </Badge>
            ) : null}
            <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0.5" />
          </Link>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="max-w-xs bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 border border-gray-200 dark:border-gray-800 shadow-xl p-4"
        >
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 font-semibold text-base">
              {isEmployer ? (
                <Building2 className="h-4 w-4 text-blue-500" />
              ) : (
                <Crown className="h-4 w-4 text-amber-500" />
              )}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {planLabel} Plan
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-yellow-500" />
              <span className="font-medium">Active Subscription</span>
            </div>

            {expiry && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span>📅</span>
                <span>Expires: {expiry}</span>
              </div>
            )}

            {days != null && (
              <div
                className={`flex items-center gap-1.5 ${
                  days <= 7 ? "text-red-500 font-medium" : "text-muted-foreground"
                }`}
              >
                <span>⏳</span>
                <span>
                  {days > 0
                    ? `${days} day${days !== 1 ? "s" : ""} remaining`
                    : "Expired — renew to keep AI access"}
                </span>
              </div>
            )}

            {days != null && days <= 7 && days > 0 && (
              <div className="mt-2 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 p-2">
                <p className="text-amber-700 dark:text-amber-300 font-medium">
                  Renew now to avoid interruption
                </p>
              </div>
            )}

            <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              <Link
                to="/pricing"
                className="flex items-center justify-center gap-1 text-primary hover:text-primary/80 font-medium transition-colors"
              >
                View Pricing Plans
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
