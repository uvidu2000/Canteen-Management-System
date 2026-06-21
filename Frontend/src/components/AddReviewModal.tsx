import { zodResolver } from "@hookform/resolvers/zod";
import { MessageSquareText, Pencil, Star, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { FoodItem, FoodReview, ReviewFormValues } from "@/types/canteen";
import { formatDateTime, formatPrice } from "@/utils/canteen";
import { cn } from "@/utils/cn";

const reviewFormSchema = z.object({
  rating: z.number().min(1, "Select a rating.").max(5, "Select a rating."),
  comment: z.string().min(5, "Add a short review.")
});

type AddReviewModalProps = {
  foodItem: FoodItem;
  onClose: () => void;
  onSubmit: (values: ReviewFormValues) => void;
  onUpdate?: (reviewId: string, values: ReviewFormValues) => void;
  onDelete?: (reviewId: string) => void;
};

export function AddReviewModal({
  foodItem,
  onClose,
  onSubmit,
  onUpdate,
  onDelete
}: AddReviewModalProps) {
  const [selectedRating, setSelectedRating] = useState(0);
  const [editingReview, setEditingReview] = useState<FoodReview | null>(null);
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: 0,
      comment: ""
    }
  });

  function handleRatingChange(rating: number) {
    setSelectedRating(rating);
    setValue("rating", rating, { shouldValidate: true });
  }

  function handleEditReview(review: FoodReview) {
    setEditingReview(review);
    setSelectedRating(review.rating);
    reset({
      rating: review.rating,
      comment: review.comment
    });
  }

  function handleCancelEdit() {
    setEditingReview(null);
    setSelectedRating(0);
    reset({
      rating: 0,
      comment: ""
    });
  }

  function handleSave(values: ReviewFormValues) {
    if (editingReview) {
      onUpdate?.(editingReview.id, values);
      handleCancelEdit();
      return;
    }

    onSubmit(values);
    handleCancelEdit();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg border bg-card shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div className="flex min-w-0 gap-3">
            <img
              src={foodItem.imageUrl}
              alt={foodItem.name}
              className="h-14 w-14 shrink-0 rounded-md object-cover"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Add Review
              </p>
              <h2 className="mt-1 truncate text-lg font-semibold">{foodItem.name}</h2>
              <p className="text-sm text-muted-foreground">
                {foodItem.stock} remaining - {formatPrice(foodItem.price)}
              </p>
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close review form">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form className="space-y-5 border-b p-5" onSubmit={handleSubmit(handleSave)}>
          <input type="hidden" {...register("rating", { valueAsNumber: true })} />

          <div className="space-y-2">
            <Label>Rating *</Label>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }, (_, index) => {
                const rating = index + 1;

                return (
                  <button
                    key={rating}
                    type="button"
                    className="rounded-md border bg-background p-2 transition-colors hover:bg-accent"
                    onClick={() => handleRatingChange(rating)}
                    aria-label={`Rate ${rating} out of 5`}
                  >
                    <Star
                      className={cn(
                        "h-6 w-6",
                        rating <= selectedRating
                          ? "fill-primary text-primary"
                          : "fill-muted text-muted-foreground"
                      )}
                    />
                  </button>
                );
              })}
            </div>
            {errors.rating?.message ? <p className="text-sm text-destructive">{errors.rating.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="studentReview">Your review *</Label>
            <textarea
              id="studentReview"
              rows={4}
              placeholder="Share your feedback about this food item"
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              {...register("comment")}
            />
            {errors.comment?.message ? (
              <p className="text-sm text-destructive">{errors.comment.message}</p>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            {editingReview ? (
              <Button type="button" variant="outline" onClick={handleCancelEdit}>
                Cancel Edit
              </Button>
            ) : null}
            <Button type="submit">
              <MessageSquareText className="mr-2 h-4 w-4" />
              {editingReview ? "Save Review" : "Submit Review"}
            </Button>
          </div>
        </form>

        <div className="space-y-3 p-5">
          <h3 className="font-semibold">Recent reviews</h3>
          {foodItem.reviews.length ? (
            foodItem.reviews.map((review) => (
              <article key={review.id} className="rounded-lg border bg-background p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h4 className="font-semibold">{review.studentName}</h4>
                    <p className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDateTime(review.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
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
                    {review.canManage ? (
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditReview(review)}
                        >
                          <Pencil className="mr-1.5 h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => onDelete?.(review.id)}
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{review.comment}</p>
              </article>
            ))
          ) : (
            <div className="rounded-lg border border-dashed py-8 text-center">
              <MessageSquareText className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-semibold">No reviews yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Be the first to review this item.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
