import { Navigate, Route, Routes } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { OtpPage } from "@/pages/OtpPage";
import { AdminUsersPage } from "@/pages/admin/AdminUsersPage";
import { StaffOrdersPage } from "@/pages/staff/StaffOrdersPage";
import { StudentOrdersPage } from "@/pages/student/StudentOrdersPage";
import { StudentVotesPage } from "@/pages/student/StudentVotesPage";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { AdminRoute } from "@/routes/AdminRoute";
import { CanteenStaffRoute } from "@/routes/CanteenStaffRoute";
import { StudentPortalRoute } from "@/routes/StudentPortalRoute";
import { UnprotectedRoute } from "@/routes/UnprotectedRoute";

export function AppRouter() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path={ROUTES.root}
        element={<Navigate to={isAuthenticated ? ROUTES.home : ROUTES.login} replace />}
      />
      <Route element={<UnprotectedRoute />}>
        <Route path={ROUTES.login} element={<LoginPage />} />
        <Route path={ROUTES.otp} element={<OtpPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path={ROUTES.home} element={<HomePage />} />
        <Route element={<AdminRoute />}>
          <Route path={ROUTES.adminUsers} element={<AdminUsersPage />} />
        </Route>
        <Route element={<CanteenStaffRoute />}>
          <Route path={ROUTES.staffOrders} element={<StaffOrdersPage />} />
        </Route>
        <Route element={<StudentPortalRoute />}>
          <Route path={ROUTES.studentOrders} element={<StudentOrdersPage />} />
          <Route path={ROUTES.studentVotes} element={<StudentVotesPage />} />
        </Route>
      </Route>
      <Route path={ROUTES.notFound} element={<NotFoundPage />} />
    </Routes>
  );
}
