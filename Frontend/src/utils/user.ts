import type { AdminManagedUserRole, ManagedUserRole } from "@/types/user";

export const USER_ROLE_OPTIONS: Array<{
  value: AdminManagedUserRole;
  label: string;
}> = [
  { value: "student", label: "Student" },
  { value: "canteen_staff", label: "Canteen Staff" },
  { value: "admin", label: "Administrator" }
];

export function getUserRoleLabel(role: ManagedUserRole): string {
  return USER_ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
}

export function formatUserIdentifier(identifier: string, role: ManagedUserRole): string {
  if (role === "student") {
    return identifier;
  }

  if (/^947\d{8}$/.test(identifier)) {
    return `0${identifier.slice(2)}`;
  }

  return identifier;
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
