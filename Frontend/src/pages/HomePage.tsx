import { useAuth } from "@/hooks/useAuth";
import { StaffHomePage } from "@/pages/staff/StaffHomePage";
import { StudentHomePage } from "@/pages/student/StudentHomePage";

export function HomePage() {
  const { portal } = useAuth();

  if (portal === "student") {
    return <StudentHomePage />;
  }

  return <StaffHomePage />;
}
