import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";

type UnprotectedRouteProps = {
  children?: ReactNode;
};

export function UnprotectedRoute({ children }: UnprotectedRouteProps) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={ROUTES.home} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
