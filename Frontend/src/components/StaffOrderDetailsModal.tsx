import { ClipboardList, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StudentOrder } from "@/types/canteen";
import { formatDateTime, formatPrice, getOrderStatusClassName } from "@/utils/canteen";
import { cn } from "@/utils/cn";

type StaffOrderDetailsModalProps = {
  order: StudentOrder;
  onClose: () => void;
};

export function StaffOrderDetailsModal({ order, onClose }: StaffOrderDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg border bg-card shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div className="flex min-w-0 gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
              <ClipboardList className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Order Details
              </p>
              <h2 className="mt-1 truncate text-lg font-semibold">{order.orderNumber}</h2>
              <p className="text-sm text-muted-foreground">
                {order.studentName ?? "Student"} - {formatDateTime(order.orderedAt)}
              </p>
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close order details">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-background p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Status
              </p>
              <span
                className={cn(
                  "mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-bold",
                  getOrderStatusClassName(order.status)
                )}
              >
                {order.status}
              </span>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Food Items
              </p>
              <p className="mt-2 text-xl font-bold">{order.itemCount}</p>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Total
              </p>
              <p className="mt-2 text-xl font-bold">{formatPrice(order.totalPrice)}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-bold">Food Item</th>
                  <th className="px-4 py-3 font-bold">Qty</th>
                  <th className="px-4 py-3 font-bold">Unit Price</th>
                  <th className="px-4 py-3 text-right font-bold">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-3 font-semibold">{item.foodName}</td>
                    <td className="px-4 py-3">{item.quantity}</td>
                    <td className="px-4 py-3">{formatPrice(item.unitPrice)}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatPrice(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
