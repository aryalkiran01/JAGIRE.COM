import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Bell,
  Video,
  Calendar,
  MessageSquare,
  Gift,
  FileText,
  Heart,
  ThumbsUp,
  MessageCircle,
  UserPlus,
  Star,
  Briefcase,
  Users,
  CheckCheck,
  LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: Notifications,
});

const ICONS: Record<string, LucideIcon> = {
  interview_scheduled: Video,
  interview_confirmed: Check,
  interview_cancelled: Calendar,
  interview_reschedule: Calendar,
  interview_completed: Check,
  interview_updated: Calendar,
  message: MessageSquare,
  referral: Gift,
  application: FileText,
  comment: MessageCircle,
  like: Heart,
  post_like: ThumbsUp,
  comment_like: Heart,
  connection: UserPlus,
  follow: Users,
  endorsement: Star,
  job: Briefcase,
  mention: Bell,
};

type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
  link: string | null;
  metadata: Record<string, unknown> | null;
};

function Notifications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notif", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data ?? []) as Notification[];
    },
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notif-unread", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("is_read", false);

      return count ?? 0;
    },
  });

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("New notification:", payload.new);

          qc.invalidateQueries({ queryKey: ["notif", user.id] });
          qc.invalidateQueries({ queryKey: ["notif-unread", user.id] });

          const notification = payload.new as Notification;
          toast(notification.title, {
            description: notification.message || "You have a new notification",
            action: notification.link
              ? {
                  label: "View",
                  onClick: () => {
                    handleNotificationClick(notification);
                  },
                }
              : undefined,
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, qc]);

  const scrollToPost = (postId: string) => {
    // Wait for feed to load
    setTimeout(() => {
      const element = document.getElementById(`post-${postId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        // Highlight the post
        element.classList.add("ring-2", "ring-primary", "ring-offset-2");
        setTimeout(() => {
          element.classList.remove("ring-2", "ring-primary", "ring-offset-2");
        }, 3000);
      }
    }, 500);
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      await markRead(notification.id);
    }

    // Navigate based on notification type and link
    if (notification.link) {
      if (notification.link.startsWith("/messages")) {
        // Extract chat ID from query params
        const url = new URL(notification.link, window.location.origin);
        const chatId = url.searchParams.get("chat");
        navigate({
          to: "/messages",
          search: chatId ? { chat: chatId } : {},
        });
      } else if (notification.link.startsWith("/feed#post-")) {
        // Navigate to feed and scroll to specific post
        const postId = notification.link.split("#post-")[1];

        // Navigate to feed
        navigate({ to: "/feed" });

        // Scroll to the specific post after navigation
        if (postId) {
          scrollToPost(postId);
        }
      } else if (notification.link.startsWith("/blog/")) {
        const slug = notification.link.split("/").pop();
        if (slug) {
          navigate({
            to: "/blog/$slug",
            params: { slug },
          });
        }
      } else if (notification.link.startsWith("/jobs")) {
        navigate({ to: "/jobs" });
      } else if (notification.link.startsWith("/applications")) {
        navigate({ to: "/applications" });
      } else if (notification.link.startsWith("/interviews")) {
        navigate({ to: "/interviews" });
      } else if (notification.link.startsWith("/companies/")) {
        const slug = notification.link.split("/").pop();
        if (slug) {
          navigate({
            to: "/companies/$slug",
            params: { slug },
          });
        }
      } else if (notification.link.startsWith("/referrals")) {
        navigate({ to: "/referrals" });
      } else if (notification.link.startsWith("/resume")) {
        navigate({ to: "/resume-builder" });
      } else {
        window.location.href = notification.link;
      }
    }
  };

  const markAllAsRead = async () => {
    if (!user || isMarkingAll) return;

    setIsMarkingAll(true);
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;

      qc.invalidateQueries({ queryKey: ["notif", user.id] });
      qc.invalidateQueries({ queryKey: ["notif-unread", user.id] });
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark notifications as read");
    } finally {
      setIsMarkingAll(false);
    }
  };

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["notif", user?.id] });
    qc.invalidateQueries({ queryKey: ["notif-unread", user?.id] });
  };

  const formatTimeAgo = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <Badge variant="default" className="h-6 px-2">
              {unreadCount} new
            </Badge>
          )}
        </div>

        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={isMarkingAll}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : notifications?.length ? (
          notifications.map((n) => {
            const Icon = ICONS[n.type] ?? Bell;
            const content = (
              <CardContent className="p-4 flex items-start gap-3">
                <div
                  className={`mt-0.5 rounded-lg p-2 ${n.is_read ? "bg-muted" : "bg-primary/10"}`}
                >
                  <Icon
                    className={`h-4 w-4 ${n.is_read ? "text-muted-foreground" : "text-primary"}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium ${n.is_read ? "" : "font-semibold"}`}>{n.title}</div>
                  {n.message && (
                    <div className="text-sm text-muted-foreground line-clamp-2">{n.message}</div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {n.created_at ? formatTimeAgo(n.created_at) : ""}
                  </div>
                </div>
                {!n.is_read && (
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-primary"></span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        markRead(n.id);
                      }}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            );

            return (
              <Card
                key={n.id}
                className={`transition-all cursor-pointer ${n.is_read ? "" : "border-primary shadow-sm"}`}
                onClick={() => handleNotificationClick(n)}
              >
                {content}
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No notifications yet</p>
              <p className="text-sm mt-1">
                You'll see notifications about comments, likes, and messages here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
