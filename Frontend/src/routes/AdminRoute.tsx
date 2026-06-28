import { Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";

export function AdminRoute() {
  const { role } = useAuth();

  if (role !== "admin") {
    return <Navigate to={ROUTES.home} replace />;
  }

  return <Outlet />;
}
