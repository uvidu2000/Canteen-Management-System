import { Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";

export function StudentPortalRoute() {
  const { role } = useAuth();

  if (role !== "student" && role !== "lecturer") {
    return <Navigate to={ROUTES.home} replace />;
  }

  return <Outlet />;
}
