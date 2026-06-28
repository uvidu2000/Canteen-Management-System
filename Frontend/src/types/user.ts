export type ManagedUserRole = "student" | "lecturer" | "canteen_staff" | "admin";
export type AdminManagedUserRole = "student" | "canteen_staff" | "admin";
export type UserStatus = "Active" | "Inactive";

export type ManagedUser = {
  id: string;
  name: string;
  identifier: string;
  portal: "student" | "staff";
  role: ManagedUserRole;
  status: UserStatus;
  createdAt: string;
};

export type UserFormValues = {
  name: string;
  identifier: string;
  role: AdminManagedUserRole;
};

export type UpdateUserPayload = Partial<UserFormValues> & {
  status?: UserStatus;
};
