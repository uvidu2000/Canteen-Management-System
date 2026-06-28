import { Navigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import { StaffHomePage } from "@/pages/staff/StaffHomePage";
import { StudentHomePage } from "@/pages/student/StudentHomePage";

export function HomePage() {
  const { portal, role } = useAuth();

  if (role === "admin") {
    return <Navigate to={ROUTES.adminUsers} replace />;
  }

  if (portal === "student") {
    return <StudentHomePage />;
  }

  return <StaffHomePage />;
}
