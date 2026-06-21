import { ArrowLeft, LogOut } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { StaffOrdersPanel } from "@/components/StaffOrdersPanel";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import { useStaffOrders } from "@/hooks/useStaffOrders";

export function StaffOrdersPage() {
  const navigate = useNavigate();
  const { logout, portal } = useAuth();
  const { orders, updateOrderStatus } = useStaffOrders();

  if (portal === "student") {
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
              Staff Portal
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-normal text-foreground">
              Student Orders
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track incoming food orders and let students know when they are ready to collect.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={() => navigate(ROUTES.home)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Food Items
            </Button>
            <Button type="button" variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </div>
        </header>

        <StaffOrdersPanel orders={orders} onStatusChange={updateOrderStatus} />
      </main>
    </div>
  );
}
