import { zodResolver } from "@hookform/resolvers/zod";
import { Hash, Phone, Save, UserRound, X } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ManagedUser, UserFormValues } from "@/types/user";
import { formatUserIdentifier, USER_ROLE_OPTIONS } from "@/utils/user";

const userFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must contain at least 2 characters.")
      .max(100, "Name cannot exceed 100 characters."),
    identifier: z.string().trim().min(1, "An identifier is required."),
    role: z.enum(["student", "canteen_staff", "admin"])
  })
  .superRefine((values, context) => {
    const identifier = values.identifier.replace(/\D/g, "");

    if (values.role === "student" && !/^\d{8}$/.test(identifier)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["identifier"],
        message: "Student ID must contain exactly 8 digits."
      });
    }

    if (
      values.role !== "student" &&
      !/^(?:0?7\d{8}|947\d{8})$/.test(identifier)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["identifier"],
        message: "Enter a valid Sri Lankan mobile number."
      });
    }
  });

type AdminUserModalProps = {
  user: ManagedUser | null;
  isSaving: boolean;
  serverError: string | null;
  onClose: () => void;
  onSave: (values: UserFormValues) => void;
};

export function AdminUserModal({
  user,
  isSaving,
  serverError,
  onClose,
  onSave
}: AdminUserModalProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    watch
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: user?.name ?? "",
      identifier: user ? formatUserIdentifier(user.identifier, user.role) : "",
      role:
        user?.role === "canteen_staff" || user?.role === "admin"
          ? user.role
          : "student"
    }
  });
  const selectedRole = watch("role");

  useEffect(() => {
    reset({
      name: user?.name ?? "",
      identifier: user ? formatUserIdentifier(user.identifier, user.role) : "",
      role:
        user?.role === "canteen_staff" || user?.role === "admin"
          ? user.role
          : "student"
    });
  }, [reset, user]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-modal-title"
    >
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-lg border bg-card shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div>
            <h2 id="user-modal-title" className="text-lg font-semibold">
              {user ? "Edit User" : "New User"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {user
                ? "Update this user's account details."
                : "Create access for a student, canteen staff member, or administrator."}
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form className="space-y-5 p-5" onSubmit={handleSubmit(onSave)}>
          <div className="space-y-2">
            <Label htmlFor="user-name">Full Name *</Label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="user-name"
                className="pl-10"
                placeholder="Enter full name"
                autoComplete="name"
                {...register("name")}
              />
            </div>
            {errors.name?.message ? (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-role">Role *</Label>
            <select
              id="user-role"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              {...register("role")}
            >
              {USER_ROLE_OPTIONS.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-identifier">
              {selectedRole === "student" ? "Student ID *" : "Mobile Number *"}
            </Label>
            <div className="relative">
              {selectedRole === "student" ? (
                <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              ) : (
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              )}
              <Input
                id="user-identifier"
                className="pl-10"
                inputMode={selectedRole === "student" ? "numeric" : "tel"}
                placeholder={selectedRole === "student" ? "20211188" : "07X XXX XXXX"}
                autoComplete="off"
                {...register("identifier")}
              />
            </div>
            {errors.identifier?.message ? (
              <p className="text-sm text-destructive">{errors.identifier.message}</p>
            ) : null}
          </div>

          {serverError ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Close
            </Button>
            <Button type="submit" disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving" : user ? "Save Changes" : "Add User"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
