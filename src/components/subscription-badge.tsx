import { Link } from "@tanstack/react-router";
import { Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSubscription, PLAN_NAMES } from "@/hooks/use-subscription";

/**
 * Navbar subscription indicator.
 * - Free users see an "Upgrade" button linking to /pricing.
 * - Premium users see a "Premium Active" badge with expiry tooltip.
 */
export function SubscriptionBadge() {
  const { data: sub, isLoading } = useSubscription();

  if (isLoading) return null;

  if (!sub?.isPremium) {
    return (
      <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
        <Link to="/pricing">
          <Sparkles className="h-3.5 w-3.5" />
          Upgrade
        </Link>
      </Button>
    );
  }

  const planLabel = PLAN_NAMES[sub.plan_type ?? ""] ?? "Premium";
  const expiry = sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() : null;
  const days = sub.daysRemaining;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-400 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300 dark:hover:bg-amber-900"
          >
            <Crown className="h-3.5 w-3.5" />
            {planLabel}
            {days != null && days > 0 ? (
              <Badge
                variant="secondary"
                className="ml-0.5 h-4 px-1 text-[10px] leading-none"
              >
                {days}d
              </Badge>
            ) : null}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1 text-xs">
            <div className="font-semibold">{planLabel} plan active</div>
            {expiry && <div>Expires: {expiry}</div>}
            {days != null && (
              <div className="text-muted-foreground">
                {days > 0 ? `${days} days remaining` : "Expired — renew to keep AI access"}
              </div>
            )}
            <div className="text-muted-foreground">Click to view plan details</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
