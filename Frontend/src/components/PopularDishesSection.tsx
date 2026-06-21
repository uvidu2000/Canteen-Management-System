import { MessageSquareText, ShoppingCart, Star, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FoodItem } from "@/types/canteen";
import {
  formatPrice,
  getAverageRating,
  getFoodStatus,
  getReviewCountLabel,
  getStatusClassName
} from "@/utils/canteen";
import { cn } from "@/utils/cn";

type PopularDishesSectionProps = {
  foodItems: FoodItem[];
  isOrderPending: boolean;
  onOrder: (foodItem: FoodItem) => void;
  onReview: (foodItem: FoodItem) => void;
};

export function PopularDishesSection({
  foodItems,
  isOrderPending,
  onOrder,
  onReview
}: PopularDishesSectionProps) {
  const popularDishes = foodItems
    .filter((item) => item.reviews.length > 0)
    .map((item) => ({
      item,
      averageRating: getAverageRating(item.reviews),
      reviewCount: item.reviews.length
    }))
    .sort((first, second) => {
      if (second.averageRating !== first.averageRating) {
        return second.averageRating - first.averageRating;
      }

      return second.reviewCount - first.reviewCount;
    })
    .slice(0, 3);

  if (!popularDishes.length) {
    return null;
  }

  return (
    <section className="mb-5 rounded-lg border bg-card p-3 shadow-sm sm:p-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Popular Dishes
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-normal">Student favourites</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ranked using student reviews and average ratings.
          </p>
        </div>
        <div className="hidden rounded-full border bg-background px-3 py-2 text-sm font-semibold text-primary sm:inline-flex sm:items-center sm:gap-2">
          <TrendingUp className="h-4 w-4" />
          Top rated
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {popularDishes.map(({ item, averageRating, reviewCount }, index) => {
          const status = getFoodStatus(item.stock);
          const isSoldOut = item.stock === 0;

          return (
            <article key={item.id} className="overflow-hidden rounded-lg border bg-background shadow-sm">
              <div className="flex gap-3 p-3">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md">
                  <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                  <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                    #{index + 1}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.category}</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold">{formatPrice(item.price)}</p>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-sm font-bold">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      {averageRating}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {getReviewCountLabel(reviewCount)}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-bold",
                        getStatusClassName(status)
                      )}
                    >
                      {status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-2 border-t p-3 sm:grid-cols-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={isSoldOut || isOrderPending}
                  onClick={() => onOrder(item)}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {isSoldOut ? "Sold out" : "Order"}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => onReview(item)}>
                  <MessageSquareText className="mr-2 h-4 w-4" />
                  Reviews
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
