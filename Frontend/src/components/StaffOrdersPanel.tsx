import { ClipboardList, Eye, PackageCheck, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { StaffOrderDetailsModal } from "@/components/StaffOrderDetailsModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OrderStatus, StudentOrder } from "@/types/canteen";
import { formatDateTime, formatPrice, getOrderStatusClassName } from "@/utils/canteen";
import { cn } from "@/utils/cn";

type StaffOrdersPanelProps = {
  orders: StudentOrder[];
  className?: string;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
};

const orderStatuses: Array<OrderStatus | "All"> = [
  "All",
  "Pending",
  "Ready",
  "Collected",
  "Cancelled"
];

export function StaffOrdersPanel({ orders, className, onStatusChange }: StaffOrdersPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "All">("All");
  const [selectedOrder, setSelectedOrder] = useState<StudentOrder | null>(null);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(normalizedSearch) ||
        order.items.some((item) => item.foodName.toLowerCase().includes(normalizedSearch)) ||
        (order.studentName ?? "").toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === "All" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const summary = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((order) => order.status === "Pending").length,
      ready: orders.filter((order) => order.status === "Ready").length,
      collected: orders.filter((order) => order.status === "Collected").length,
      cancelled: orders.filter((order) => order.status === "Cancelled").length
    };
  }, [orders]);

  const ordersByStudent = useMemo(() => {
    return filteredOrders.reduce<Array<{ studentName: string; orders: StudentOrder[] }>>(
      (groups, order) => {
        const studentName = order.studentName ?? "Student";
        const existingGroup = groups.find((group) => group.studentName === studentName);

        if (existingGroup) {
          existingGroup.orders.push(order);
          return groups;
        }

        return [...groups, { studentName, orders: [order] }];
      },
      []
    );
  }, [filteredOrders]);

  return (
    <section className={cn("rounded-lg border bg-card p-3 shadow-sm sm:p-4", className)}>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Food Orders
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-normal">Student order tracking</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Track pending orders and mark them ready, collected, or cancelled.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-5 lg:min-w-[640px]">
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Total</p>
            <p className="mt-1 text-xl font-bold">{summary.total}</p>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Pending</p>
            <p className="mt-1 text-xl font-bold">{summary.pending}</p>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Ready</p>
            <p className="mt-1 text-xl font-bold">{summary.ready}</p>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Collected</p>
            <p className="mt-1 text-xl font-bold">{summary.collected}</p>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Cancelled</p>
            <p className="mt-1 text-xl font-bold">{summary.cancelled}</p>
          </div>
        </div>
      </div>

      <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by student or food item..."
            className="h-11 pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as OrderStatus | "All")}
          className="h-11 rounded-md border border-input bg-background px-3 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Filter orders by status"
        >
          {orderStatuses.map((status) => (
            <option key={status} value={status}>
              Status: {status}
            </option>
          ))}
        </select>
      </div>

      <div className="hidden overflow-hidden rounded-lg border lg:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            <tr>
              <th className="px-4 py-4 font-bold">Order</th>
              <th className="px-4 py-4 font-bold">Student</th>
              <th className="px-4 py-4 font-bold">Items</th>
              <th className="px-4 py-4 font-bold">Qty</th>
              <th className="px-4 py-4 font-bold">Total</th>
              <th className="px-4 py-4 font-bold">Ordered</th>
              <th className="px-4 py-4 font-bold">Status</th>
              <th className="px-4 py-4 text-right font-bold">Update</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id} className="border-t">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-primary">
                      <ClipboardList className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-semibold">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">Line #{order.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{order.studentName ?? "Student"}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="text-left font-semibold text-foreground hover:text-primary"
                    onClick={() => setSelectedOrder(order)}
                  >
                    {order.itemCount === 1 ? order.items[0]?.foodName : `${order.itemCount} food items`}
                  </button>
                  <p className="mt-1 max-w-48 truncate text-xs text-muted-foreground">
                    {order.items.map((item) => item.foodName).join(", ")}
                  </p>
                </td>
                <td className="px-4 py-3 font-semibold">{order.quantity}</td>
                <td className="px-4 py-3 font-semibold">{formatPrice(order.totalPrice)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {formatDateTime(order.orderedAt)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2.5 py-1 text-xs font-bold",
                      getOrderStatusClassName(order.status)
                    )}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <select
                    value={order.status}
                    onChange={(event) => onStatusChange(order.id, event.target.value as OrderStatus)}
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label={`Update ${order.orderNumber} order status`}
                  >
                    {orderStatuses
                      .filter((status): status is OrderStatus => status !== "All")
                      .map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                  </select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-2"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    Details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 lg:hidden">
        {ordersByStudent.map((group) => (
          <section key={group.studentName} className="rounded-lg border bg-background p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{group.studentName}</p>
                <p className="text-xs text-muted-foreground">
                  {group.orders.length === 1 ? "1 food item" : `${group.orders.length} food items`}
                </p>
              </div>
              <span className="rounded-full border bg-muted px-2.5 py-1 text-xs font-bold">
                {formatPrice(group.orders.reduce((total, order) => total + order.totalPrice, 0))}
              </span>
            </div>

            <div className="space-y-3">
              {group.orders.map((order) => (
                <article key={order.id} className="rounded-md border bg-card p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{order.orderNumber}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {order.orderNumber} - <span className="whitespace-nowrap">{formatDateTime(order.orderedAt)}</span>
                      </p>
                      <button
                        type="button"
                        className="mt-2 text-sm font-semibold text-primary"
                        onClick={() => setSelectedOrder(order)}
                      >
                        View {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                      </button>
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
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-md border bg-background p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Quantity
                      </p>
                      <p className="mt-1 text-lg font-bold">{order.quantity}</p>
                    </div>
                    <div className="rounded-md border bg-background p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Total
                      </p>
                      <p className="mt-1 text-lg font-bold">{formatPrice(order.totalPrice)}</p>
                    </div>
                  </div>
                  <select
                    value={order.status}
                    onChange={(event) => onStatusChange(order.id, event.target.value as OrderStatus)}
                    className="mt-3 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label={`Update ${order.orderNumber} order status`}
                  >
                    {orderStatuses
                      .filter((status): status is OrderStatus => status !== "All")
                      .map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                  </select>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      {!filteredOrders.length ? (
        <div className="rounded-lg border border-dashed py-10 text-center">
          <PackageCheck className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">No orders found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Student orders will appear here once placed.
          </p>
        </div>
      ) : null}

      {selectedOrder ? (
        <StaffOrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      ) : null}
    </section>
  );
}
