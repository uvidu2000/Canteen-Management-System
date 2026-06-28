import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { ArrowLeft, LogOut, PackageCheck } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { StudentOrderCards } from "@/components/StudentOrderCards";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "@/lib/queryKeys";
import { canteenService } from "@/services/canteenService";
import type { StudentOrder } from "@/types/canteen";

export function StudentOrdersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout, portal, user } = useAuth();
  const ordersQuery = useQuery({
    queryKey: queryKeys.orders,
    queryFn: canteenService.listOrders
  });
  const orders = ordersQuery.data ?? [];
  const cancelOrderMutation = useMutation({
    mutationFn: canteenService.cancelOrder,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      void queryClient.invalidateQueries({ queryKey: queryKeys.foodItems });
    }
  });

  if (portal === "staff") {
    return <Navigate to={ROUTES.home} replace />;
  }

  function handleLogout() {
    logout();
    navigate(ROUTES.login, { replace: true });
  }

  function handleCancelOrder(order: StudentOrder) {
    const shouldCancel = window.confirm(
      `Cancel ${order.orderNumber}? The food items will be returned to available stock.`
    );

    if (shouldCancel) {
      cancelOrderMutation.mutate(order.id);
    }
  }

  const cancellationError =
    cancelOrderMutation.error instanceof AxiosError
      ? (cancelOrderMutation.error.response?.data as { message?: string } | undefined)?.message ??
        "Unable to cancel the order."
      : "Unable to cancel the order.";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Student Portal
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-normal text-foreground">
              My Orders
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Check whether your order is ready to collect.
            </p>
            {user.name ? (
              <p className="mt-3 inline-flex rounded-full border bg-card px-3 py-1 text-sm font-semibold text-primary">
                Welcome {user.name}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={() => navigate(ROUTES.home)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Menu
            </Button>
            <Button type="button" variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </div>
        </header>

        <section className="rounded-lg border bg-card p-3 shadow-sm sm:p-4">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Placed Orders
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-normal">Order tracking</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {orders.length ? `${orders.length} placed` : "No orders yet"}
            </p>
          </div>

          {ordersQuery.isLoading ? (
            <div className="rounded-lg border border-dashed py-10 text-center">
              <PackageCheck className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-semibold">Loading orders</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Fetching your latest canteen orders.
              </p>
            </div>
          ) : (
            <>
              {cancelOrderMutation.isError ? (
                <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {cancellationError}
                </div>
              ) : null}
              <StudentOrderCards
                orders={orders}
                cancellingOrderId={
                  cancelOrderMutation.isPending ? cancelOrderMutation.variables : undefined
                }
                onCancel={handleCancelOrder}
              />
            </>
          )}
        </section>
      </main>
    </div>
  );
}
