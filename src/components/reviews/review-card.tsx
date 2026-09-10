import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Star, MessageSquare, CheckCircle2, Building2, CornerDownRight, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export interface ReviewAuthor {
  id?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  headline?: string | null;
  current_position?: string | null;
  role?: string | null;
}

export interface ReviewReply {
  id: string;
  content: string;
  author_id?: string;
  created_at?: string;
}

export interface ReviewItem {
  id: string;
  rating: number;
  title?: string | null;
  content?: string | null;
  created_at: string;
  reviewer_id?: string | null;
  reviewer?: ReviewAuthor | null;
  replies?: ReviewReply[];
}

interface ReviewCardProps {
  review: ReviewItem;
  isCompanyOwner?: boolean;
  companyName?: string;
  onReply?: (reviewId: string, text: string) => Promise<void>;
}

export function ReviewCard({ review, isCompanyOwner, companyName, onReply }: ReviewCardProps) {
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);

  const reviewerId = review.reviewer_id || review.reviewer?.id;
  const reviewerName = review.reviewer?.full_name?.trim() || "Anonymous Reviewer";
  const reviewerTitle =
    review.reviewer?.headline ||
    review.reviewer?.current_position ||
    (review.reviewer?.role === "employer" ? "Employer" : "Job Seeker / Member");
  const avatarUrl = review.reviewer?.avatar_url || undefined;
  const initials = reviewerName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSendReply = async () => {
    if (!replyText.trim() || !onReply) return;
    setIsSubmittingReply(true);
    try {
      await onReply(review.id, replyText.trim());
      setReplyText("");
      setShowReplyInput(false);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const formattedDate = review.created_at
    ? new Date(review.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <Card className="glass border-border/50 hover:border-primary/30 transition-all duration-200 shadow-card-soft overflow-hidden">
      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* Header: Reviewer identity & Rating */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            {/* Clickable Avatar */}
            {reviewerId ? (
              <Link
                to="/profile/$userId"
                params={{ userId: reviewerId }}
                className="relative group shrink-0"
              >
                <Avatar className="h-11 w-11 border-2 border-background ring-1 ring-border group-hover:ring-primary/60 transition-all shadow-sm">
                  <AvatarImage src={avatarUrl} alt={reviewerName} className="object-cover" />
                  <AvatarFallback className="gradient-brand text-primary-foreground font-semibold text-sm">
                    {initials || "?"}
                  </AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <Avatar className="h-11 w-11 border-2 border-background ring-1 ring-border shrink-0">
                <AvatarImage src={avatarUrl} alt={reviewerName} className="object-cover" />
                <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-sm">
                  {initials || "?"}
                </AvatarFallback>
              </Avatar>
            )}

            {/* Name & Title */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {reviewerId ? (
                  <Link
                    to="/profile/$userId"
                    params={{ userId: reviewerId }}
                    className="font-semibold text-foreground hover:text-primary transition-colors text-sm sm:text-base leading-tight truncate"
                  >
                    {reviewerName}
                  </Link>
                ) : (
                  <span className="font-semibold text-foreground text-sm sm:text-base leading-tight">
                    {reviewerName}
                  </span>
                )}
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 font-normal text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5 flex items-center gap-0.5"
                >
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  Verified Member
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{reviewerTitle}</p>
            </div>
          </div>

          {/* Star Rating & Date */}
          <div className="flex items-center sm:flex-col sm:items-end gap-2 sm:gap-1 shrink-0">
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= (review.rating || 0)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-muted text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-foreground ml-1">
                {Number(review.rating || 0).toFixed(1)}
              </span>
            </div>
            {formattedDate && (
              <span className="text-[11px] text-muted-foreground">{formattedDate}</span>
            )}
          </div>
        </div>

        {/* Review Title & Content */}
        <div className="space-y-1.5 pt-0.5">
          {review.title && review.title !== "Review" && (
            <h4 className="font-semibold text-sm sm:text-base text-foreground tracking-tight">
              {review.title}
            </h4>
          )}
          {review.content && (
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {review.content}
            </p>
          )}
        </div>

        {/* Company Replies */}
        {(review.replies ?? []).length > 0 && (
          <div className="space-y-2 pt-2">
            {review.replies!.map((rep) => (
              <div
                key={rep.id}
                className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-1.5 ml-2 sm:ml-6"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>Response from {companyName || "Company"}</span>
                  </div>
                  {rep.created_at && (
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(rep.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                  {rep.content}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Company Owner Reply Action */}
        {isCompanyOwner && (review.replies ?? []).length === 0 && (
          <div className="pt-2 border-t border-border/40">
            {!showReplyInput ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-primary hover:text-primary hover:bg-primary/10 -ml-2"
                onClick={() => setShowReplyInput(true)}
              >
                <CornerDownRight className="h-3.5 w-3.5 mr-1.5" />
                Reply as Company
              </Button>
            ) : (
              <div className="space-y-2 pt-1">
                <div className="flex gap-2">
                  <Input
                    placeholder={`Reply publicly on behalf of ${companyName || "your company"}…`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="text-xs h-9"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    className="h-9 gradient-brand text-primary-foreground shrink-0"
                    onClick={handleSendReply}
                    disabled={isSubmittingReply || !replyText.trim()}
                  >
                    <Send className="h-3.5 w-3.5 mr-1" />
                    {isSubmittingReply ? "Posting…" : "Reply"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 text-xs"
                    onClick={() => {
                      setShowReplyInput(false);
                      setReplyText("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
