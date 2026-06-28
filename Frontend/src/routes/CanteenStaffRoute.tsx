import { Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";

export function CanteenStaffRoute() {
  const { role } = useAuth();

  if (role !== "canteen_staff") {
    return <Navigate to={ROUTES.home} replace />;
  }

  return <Outlet />;
}
