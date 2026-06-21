import { useMemo } from "react";
import { BarChart3, MessageSquareText, Star, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { canteenService } from "@/services/canteenService";
import type { FoodItem, FoodSentimentAnalysis, SentimentLabel } from "@/types/canteen";
import { formatDateTime, formatPrice, getAverageRating } from "@/utils/canteen";
import { cn } from "@/utils/cn";

type StaffReviewsModalProps = {
  foodItem: FoodItem;
  onClose: () => void;
};

type AspectSummary = {
  name: string;
  averageScore: number;
  sentiment: SentimentLabel;
};

function getSentimentClass(sentiment: SentimentLabel) {
  if (sentiment === "Positive") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (sentiment === "Negative") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-border bg-muted text-muted-foreground";
}

function getSentimentFromScore(score: number): SentimentLabel {
  if (score >= 2) {
    return "Positive";
  }

  if (score <= -2) {
    return "Negative";
  }

  return "Neutral";
}

function getAspectSummary(analysis?: FoodSentimentAnalysis): AspectSummary[] {
  if (!analysis) {
    return [];
  }

  const aspectScores: Record<string, { total: number; count: number }> = {};

  analysis.reviews.forEach((review) => {
    Object.entries(review.aspect_sentiment).forEach(([aspect, result]) => {
      aspectScores[aspect] = aspectScores[aspect] ?? { total: 0, count: 0 };
      aspectScores[aspect].total += result.score;
      aspectScores[aspect].count += 1;
    });
  });

  return Object.entries(aspectScores).map(([name, value]) => {
    const averageScore = value.count ? value.total / value.count : 0;

    return {
      name,
      averageScore,
      sentiment: getSentimentFromScore(averageScore)
    };
  });
}

export function StaffReviewsModal({ foodItem, onClose }: StaffReviewsModalProps) {
  const sentimentMutation = useMutation({
    mutationFn: () => canteenService.analyzeFoodItemSentiment(foodItem.id)
  });
  const analysis = sentimentMutation.data;
  const aspectSummary = useMemo(() => getAspectSummary(analysis), [analysis]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg border bg-card shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div className="flex min-w-0 gap-3">
            <img
              src={foodItem.imageUrl}
              alt={foodItem.name}
              className="h-14 w-14 shrink-0 rounded-md object-cover"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Student Reviews
              </p>
              <h2 className="mt-1 truncate text-lg font-semibold">{foodItem.name}</h2>
              <p className="text-sm text-muted-foreground">
                {foodItem.category} - {formatPrice(foodItem.price)}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => sentimentMutation.mutate()}
              disabled={!foodItem.reviews.length || sentimentMutation.isPending}
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              {sentimentMutation.isPending ? "Analyzing" : "Analyze"}
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close reviews">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-3 border-b bg-muted/30 p-5 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Average Rating
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Star className="h-5 w-5 fill-primary text-primary" />
              <p className="text-2xl font-bold">{getAverageRating(foodItem.reviews) || "-"}</p>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Total Reviews
            </p>
            <p className="mt-2 text-2xl font-bold">{foodItem.reviews.length}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Current Stock
            </p>
            <p className="mt-2 text-2xl font-bold">{foodItem.stock}</p>
          </div>
        </div>

        {sentimentMutation.isError ? (
          <div className="border-b px-5 py-4">
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Sentiment analysis could not be completed. Please try again.
            </div>
          </div>
        ) : null}

        {analysis ? (
          <div className="space-y-4 border-b bg-muted/20 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Sentiment Analysis
                </p>
                <h3 className="mt-1 text-lg font-semibold">
                  Overall result:{" "}
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2.5 py-1 text-sm font-semibold",
                      getSentimentClass(analysis.overall_sentiment)
                    )}
                  >
                    {analysis.overall_sentiment}
                  </span>
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {(["Positive", "Neutral", "Negative"] as const).map((sentiment) => (
                  <div key={sentiment} className="rounded-lg border bg-card px-3 py-2">
                    <p className="text-lg font-bold">{analysis.sentiment_summary[sentiment] ?? 0}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {sentiment}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {aspectSummary.length ? (
              <div className="grid gap-2 sm:grid-cols-5">
                {aspectSummary.map((aspect) => (
                  <div key={aspect.name} className="rounded-lg border bg-card p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {aspect.name}
                    </p>
                    <span
                      className={cn(
                        "mt-2 inline-flex rounded-full border px-2 py-1 text-xs font-semibold",
                        getSentimentClass(aspect.sentiment)
                      )}
                    >
                      {aspect.sentiment}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-3 p-5">
          {foodItem.reviews.length ? (
            foodItem.reviews.map((review, index) => {
              const reviewAnalysis = analysis?.reviews[index];

              return (
              <article key={review.id} className="rounded-lg border bg-background p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold">{review.studentName}</h3>
                    <p className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDateTime(review.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star
                        key={index}
                        className={cn(
                          "h-4 w-4",
                          index < review.rating
                            ? "fill-primary text-primary"
                            : "fill-muted text-muted-foreground"
                        )}
                      />
                    ))}
                  </div>
                </div>
                {reviewAnalysis ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                        getSentimentClass(reviewAnalysis.sentiment)
                      )}
                    >
                      {reviewAnalysis.sentiment}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Sentiment score {reviewAnalysis.sentiment_score}
                    </span>
                  </div>
                ) : null}
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{review.comment}</p>
              </article>
              );
            })
          ) : (
            <div className="rounded-lg border border-dashed py-10 text-center">
              <MessageSquareText className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-semibold">No reviews yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Student feedback for this item will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
