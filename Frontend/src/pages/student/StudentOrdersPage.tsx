import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, LogOut, PackageCheck } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { StudentOrderCards } from "@/components/StudentOrderCards";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "@/lib/queryKeys";
import { canteenService } from "@/services/canteenService";

export function StudentOrdersPage() {
  const navigate = useNavigate();
  const { logout, portal, user } = useAuth();
  const ordersQuery = useQuery({
    queryKey: queryKeys.orders,
    queryFn: canteenService.listOrders
  });
  const orders = ordersQuery.data ?? [];

  if (portal === "staff") {
    return <Navigate to={ROUTES.home} replace />;
  }

  function handleLogout() {
    logout();
    navigate(ROUTES.login, { replace: true });
  }

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
            <StudentOrderCards orders={orders} />
          )}
        </section>
      </main>
    </div>
  );
}
