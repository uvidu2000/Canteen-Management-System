import { Minus, Plus, ShoppingCart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FoodItem } from "@/types/canteen";
import { formatPrice } from "@/utils/canteen";

type OrderFoodItemModalProps = {
  foodItem: FoodItem;
  quantity: number;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
  onQuantityChange: (direction: "increase" | "decrease") => void;
};

export function OrderFoodItemModal({
  foodItem,
  quantity,
  confirmLabel = "Confirm Order",
  onClose,
  onConfirm,
  onQuantityChange
}: OrderFoodItemModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-lg border bg-card shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div className="flex min-w-0 gap-3">
            <img
              src={foodItem.imageUrl}
              alt={foodItem.name}
              className="h-14 w-14 shrink-0 rounded-md object-cover"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Place Order
              </p>
              <h2 className="mt-1 truncate text-lg font-semibold">{foodItem.name}</h2>
              <p className="text-sm text-muted-foreground">
                {foodItem.stock} remaining - {formatPrice(foodItem.price)} each
              </p>
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close order form">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-5 p-5">
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-sm leading-6 text-muted-foreground">{foodItem.description}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Quantity
              </p>
              <div className="mt-3 inline-flex items-center rounded-md border bg-card">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => onQuantityChange("decrease")}
                  aria-label="Decrease order quantity"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center text-base font-bold">{quantity}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => onQuantityChange("increase")}
                  aria-label="Increase order quantity"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-lg border bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Order Total
              </p>
              <p className="mt-3 text-2xl font-bold">{formatPrice(foodItem.price * quantity)}</p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button type="button" onClick={onConfirm}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
