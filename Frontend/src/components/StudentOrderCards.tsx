import { ShoppingCart, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StudentOrder } from "@/types/canteen";
import { formatDateTime, formatPrice, getOrderStatusClassName } from "@/utils/canteen";
import { cn } from "@/utils/cn";

type StudentOrderCardsProps = {
  orders: StudentOrder[];
  cancellingOrderId?: string;
  onCancel: (order: StudentOrder) => void;
};

export function StudentOrderCards({
  orders,
  cancellingOrderId,
  onCancel
}: StudentOrderCardsProps) {
  if (!orders.length) {
    return (
      <div className="rounded-lg border border-dashed py-10 text-center">
        <ShoppingCart className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-3 font-semibold">No orders placed</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Order available canteen items and they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {orders.map((order) => (
        <article key={order.id} className="rounded-lg border bg-background p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate font-semibold">{order.orderNumber}</h3>
              <p className="mt-1 whitespace-nowrap text-xs text-muted-foreground">
                {formatDateTime(order.orderedAt)}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold",
                getOrderStatusClassName(order.status)
              )}
            >
              {order.status}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-md border bg-card p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Items
              </p>
              <p className="mt-1 text-lg font-bold">{order.itemCount}</p>
            </div>
            <div className="rounded-md border bg-card p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Total
              </p>
              <p className="mt-1 text-lg font-bold">{formatPrice(order.totalPrice)}</p>
            </div>
          </div>
          <div className="mt-4 space-y-2 border-t pt-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-muted-foreground">
                  {item.foodName} x {item.quantity}
                </span>
                <span className="font-semibold">{formatPrice(item.totalPrice)}</span>
              </div>
            ))}
          </div>
          {order.status === "Pending" ? (
            <Button
              type="button"
              variant="outline"
              className="mt-4 w-full text-destructive hover:text-destructive"
              disabled={cancellingOrderId === order.id}
              onClick={() => onCancel(order)}
            >
              <XCircle className="mr-2 h-4 w-4" />
              {cancellingOrderId === order.id ? "Cancelling" : "Cancel Order"}
            </Button>
          ) : null}
        </article>
      ))}
    </div>
  );
}
