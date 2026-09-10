import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Star, MessageSquarePlus, Sparkles, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ReviewCard, type ReviewItem } from "./review-card";
import { useAuth } from "@/hooks/use-auth";

interface ReviewsSectionProps {
  reviews: ReviewItem[];
  companyName?: string;
  isCompanyOwner?: boolean;
  onSubmitReview: (data: { rating: number; title: string; content: string }) => Promise<void>;
  onReplyReview?: (reviewId: string, text: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function ReviewsSection({
  reviews = [],
  companyName = "Company",
  isCompanyOwner,
  onSubmitReview,
  onReplyReview,
  isSubmitting,
}: ReviewsSectionProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<number | null>(null);

  // Aggregate statistics
  const totalCount = reviews.length;
  const avgRating = totalCount
    ? Number((reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / totalCount).toFixed(1))
    : 0;

  // Rating distribution
  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => Math.round(r.rating || 0) === stars).length;
    const percentage = totalCount ? Math.round((count / totalCount) * 100) : 0;
    return { stars, count, percentage };
  });

  const filteredReviews = selectedFilter
    ? reviews.filter((r) => Math.round(r.rating || 0) === selectedFilter)
    : reviews;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return;
    await onSubmitReview({
      rating,
      title: title.trim(),
      content: content.trim(),
    });
    setTitle("");
    setContent("");
    setShowForm(false);
  };

  return (
    <section className="space-y-6 pt-4">
      {/* Section Header & Summary Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Reviews & Ratings
            </h2>
            {totalCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm font-semibold">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span>{avgRating.toFixed(1)}</span>
                <span className="text-muted-foreground font-normal">
                  · {totalCount} {totalCount === 1 ? "review" : "reviews"}
                </span>
              </div>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Authentic feedback and workplace insights from team members and candidates.
          </p>
        </div>

        {user ? (
          <Button
            onClick={() => setShowForm((prev) => !prev)}
            className="gradient-brand text-primary-foreground shrink-0 shadow-sm"
          >
            <MessageSquarePlus className="h-4 w-4 mr-1.5" />
            {showForm ? "Cancel Review" : "Write a Review"}
          </Button>
        ) : (
          <Button asChild variant="outline" className="shrink-0">
            <Link to="/auth">Sign in to Review</Link>
          </Button>
        )}
      </div>

      {/* Aggregate Rating Breakdown & Distribution (Shown if reviews exist) */}
      {totalCount > 0 && (
        <Card className="glass border-border/50 shadow-card-soft">
          <CardContent className="p-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Overall Score Box */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-4 rounded-xl bg-muted/40 border border-border/40 text-center space-y-1">
                <div className="text-4xl sm:text-5xl font-extrabold tracking-tight gradient-text">
                  {avgRating.toFixed(1)}
                </div>
                <div className="flex items-center gap-1 my-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(avgRating)
                          ? "fill-amber-400 text-amber-400"
                          : "fill-muted text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Based on {totalCount} verified {totalCount === 1 ? "rating" : "ratings"}
                </p>
              </div>

              {/* Breakdown Bars */}
              <div className="md:col-span-8 space-y-2">
                {distribution.map(({ stars, count, percentage }) => (
                  <button
                    key={stars}
                    type="button"
                    onClick={() => setSelectedFilter((curr) => (curr === stars ? null : stars))}
                    className={`w-full flex items-center gap-3 text-xs group hover:bg-muted/40 p-1 rounded-lg transition-colors ${
                      selectedFilter === stars ? "bg-muted/60 font-medium" : ""
                    }`}
                  >
                    <span className="w-12 text-left font-medium text-foreground flex items-center gap-1 shrink-0">
                      {stars} <Star className="h-3 w-3 fill-amber-400 text-amber-400 inline" />
                    </span>
                    <div className="flex-1">
                      <Progress value={percentage} className="h-2 rounded-full" />
                    </div>
                    <span className="w-10 text-right text-muted-foreground shrink-0 font-mono">
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {selectedFilter && (
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/40 text-xs">
                <span className="text-muted-foreground">
                  Filtered by:{" "}
                  <strong className="text-foreground">{selectedFilter} Star Reviews</strong> (
                  {filteredReviews.length})
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setSelectedFilter(null)}
                >
                  Clear filter
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Review Submission Form */}
      {showForm && user && (
        <Card className="border-primary/30 bg-card shadow-card-soft overflow-hidden transition-all animate-in fade-in-50 duration-200">
          <CardHeader className="bg-primary/5 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Write your Review for {companyName}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star Picker */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">
                  Overall Rating
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverRating ?? rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 rounded-md hover:bg-muted transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-7 w-7 transition-colors ${
                            active
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/40 hover:text-amber-300"
                          }`}
                        />
                      </button>
                    );
                  })}
                  <span className="text-xs text-muted-foreground ml-2 font-medium">
                    {rating === 5 && "Excellent (5/5)"}
                    {rating === 4 && "Great (4/5)"}
                    {rating === 3 && "Average (3/5)"}
                    {rating === 2 && "Poor (2/5)"}
                    {rating === 1 && "Terrible (1/5)"}
                  </span>
                </div>
              </div>

              {/* Review Headline / Title */}
              <div>
                <label
                  htmlFor="reviewTitle"
                  className="text-xs font-semibold text-foreground mb-1 block"
                >
                  Review Headline (Optional)
                </label>
                <Input
                  id="reviewTitle"
                  placeholder="e.g. Great culture and supportive leadership team"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-sm"
                />
              </div>

              {/* Review Content */}
              <div>
                <label
                  htmlFor="reviewContent"
                  className="text-xs font-semibold text-foreground mb-1 block"
                >
                  Your Review
                </label>
                <Textarea
                  id="reviewContent"
                  rows={4}
                  placeholder="Share details about your work experience, company benefits, management, and growth opportunities…"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="text-sm leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !content.trim()}
                  className="gradient-brand text-primary-foreground"
                >
                  {isSubmitting ? "Submitting…" : "Post Review"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length > 0 ? (
          filteredReviews.map((rev) => (
            <ReviewCard
              key={rev.id}
              review={rev}
              isCompanyOwner={isCompanyOwner}
              companyName={companyName}
              onReply={onReplyReview}
            />
          ))
        ) : (
          <Card className="border-dashed border-border/60 bg-muted/20">
            <CardContent className="p-8 text-center space-y-2">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <Star className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground text-sm sm:text-base">
                {selectedFilter ? "No reviews matching this rating" : "No reviews yet"}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {selectedFilter
                  ? "Try clearing your star rating filter to see all reviews."
                  : "Be the first to share your experience and help job seekers make informed career decisions."}
              </p>
              {user && !showForm && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowForm(true)}
                  className="mt-2"
                >
                  Write the First Review
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
