import { AxiosError } from "axios";
import {
  CircleOff,
  LogOut,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UsersRound
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminUserModal } from "@/components/AdminUserModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import { useUsers } from "@/hooks/useUsers";
import type {
  AdminManagedUserRole,
  ManagedUser,
  UserFormValues,
  UserStatus
} from "@/types/user";
import { cn } from "@/utils/cn";
import {
  formatUserIdentifier,
  getInitials,
  getUserRoleLabel,
  USER_ROLE_OPTIONS
} from "@/utils/user";

const PAGE_SIZE = 8;

function getApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    const responseData = error.response?.data as { message?: string } | undefined;
    return responseData?.message ?? "Unable to save the user. Please try again.";
  }

  return "Unable to save the user. Please try again.";
}

export function AdminUsersPage() {
  const navigate = useNavigate();
  const { logout, user: authUser } = useAuth();
  const {
    users,
    isLoadingUsers,
    usersError,
    createUser,
    updateUser,
    deleteUser
  } = useUsers();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<AdminManagedUserRole | "All">("All");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "All">("All");
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(normalizedSearch) ||
        user.identifier.includes(normalizedSearch);
      const matchesRole = roleFilter === "All" || user.role === roleFilter;
      const matchesStatus = statusFilter === "All" || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [roleFilter, searchQuery, statusFilter, users]);

  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter, searchQuery, statusFilter]);

  useEffect(() => {
    if (currentPage > pageCount) {
      setCurrentPage(pageCount);
    }
  }, [currentPage, pageCount]);

  function handleLogout() {
    logout();
    navigate(ROUTES.login, { replace: true });
  }

  function openCreateModal() {
    setEditingUser(null);
    setFormError(null);
    setIsUserModalOpen(true);
  }

  function openEditModal(user: ManagedUser) {
    setEditingUser(user);
    setFormError(null);
    setIsUserModalOpen(true);
  }

  function closeUserModal() {
    setEditingUser(null);
    setFormError(null);
    setIsUserModalOpen(false);
  }

  function handleSaveUser(values: UserFormValues) {
    setFormError(null);

    if (editingUser) {
      updateUser.mutate(
        { userId: editingUser.id, payload: values },
        {
          onSuccess: closeUserModal,
          onError: (error) => setFormError(getApiError(error))
        }
      );
      return;
    }

    createUser.mutate(values, {
      onSuccess: closeUserModal,
      onError: (error) => setFormError(getApiError(error))
    });
  }

  function handleStatusChange(user: ManagedUser) {
    setPageError(null);
    const nextStatus: UserStatus = user.status === "Active" ? "Inactive" : "Active";
    updateUser.mutate(
      { userId: user.id, payload: { status: nextStatus } },
      { onError: (error) => setPageError(getApiError(error)) }
    );
  }

  function handleDeleteUser(user: ManagedUser) {
    const shouldDelete = window.confirm(
      `Delete ${user.name}? This removes their system access permanently.`
    );

    if (!shouldDelete) {
      return;
    }

    setPageError(null);
    deleteUser.mutate(user.id, {
      onError: (error) => setPageError(getApiError(error))
    });
  }

  const firstVisible = filteredUsers.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const lastVisible = Math.min(currentPage * PAGE_SIZE, filteredUsers.length);
  const isCurrentAdmin = (user: ManagedUser) =>
    user.role === "admin" && user.identifier === authUser.identifier;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold">Admin Portal</p>
              <p className="hidden text-xs text-muted-foreground sm:block">User access management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{authUser.name ?? "Administrator"}</p>
              <p className="text-xs text-muted-foreground">
                {formatUserIdentifier(authUser.identifier ?? "", "canteen_staff")}
              </p>
            </div>
            <Button type="button" variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Log out</span>
              <span className="sm:hidden">Exit</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Administration
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-normal">System Users</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage student, canteen staff, and administrator access.
            </p>
          </div>
          <Button type="button" onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>

        <section className="mb-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Total Users
            </p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-2xl font-bold">{users.length}</p>
              <UsersRound className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Active
            </p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-2xl font-bold">
                {users.filter((user) => user.status === "Active").length}
              </p>
              <UserCheck className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Inactive
            </p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-2xl font-bold">
                {users.filter((user) => user.status === "Inactive").length}
              </p>
              <CircleOff className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-3 shadow-sm sm:p-4">
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_190px_170px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name, student ID, or mobile number..."
                className="h-11 pl-10"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value as AdminManagedUserRole | "All")
              }
              className="h-11 rounded-md border border-input bg-background px-3 text-sm"
              aria-label="Filter users by role"
            >
              <option value="All">Role: All</option>
              {USER_ROLE_OPTIONS.map((role) => (
                <option key={role.value} value={role.value}>
                  Role: {role.label}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as UserStatus | "All")}
              className="h-11 rounded-md border border-input bg-background px-3 text-sm"
              aria-label="Filter users by status"
            >
              <option value="All">Status: All</option>
              <option value="Active">Status: Active</option>
              <option value="Inactive">Status: Inactive</option>
            </select>
          </div>

          {pageError ? (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {pageError}
            </div>
          ) : null}

          {usersError ? (
            <div className="rounded-lg border border-destructive/30 py-10 text-center">
              <p className="font-semibold text-destructive">Unable to load users</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Check the backend connection and refresh this page.
              </p>
            </div>
          ) : null}

          {isLoadingUsers ? (
            <div className="rounded-lg border border-dashed py-12 text-center">
              <UsersRound className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-semibold">Loading system users</p>
            </div>
          ) : null}

          {!isLoadingUsers && !usersError ? (
            <>
              <div className="hidden overflow-x-auto rounded-lg border lg:block">
                <table className="min-w-[1000px] w-full border-collapse text-left text-sm">
                  <thead className="bg-muted/60 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    <tr>
                      <th className="px-4 py-4 font-bold">Name</th>
                      <th className="px-4 py-4 font-bold">Identifier</th>
                      <th className="px-4 py-4 font-bold">Role</th>
                      <th className="px-4 py-4 font-bold">Portal</th>
                      <th className="px-4 py-4 font-bold">Joined</th>
                      <th className="px-4 py-4 font-bold">Status</th>
                      <th className="px-4 py-4 text-right font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((user) => (
                      <tr key={user.id} className="border-t">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent text-xs font-bold text-accent-foreground">
                              {getInitials(user.name)}
                            </span>
                            <p className="font-semibold">{user.name}</p>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {formatUserIdentifier(user.identifier, user.role)}
                        </td>
                        <td className="px-4 py-3">{getUserRoleLabel(user.role)}</td>
                        <td className="px-4 py-3 capitalize text-muted-foreground">
                          {user.portal}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {user.createdAt}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2.5 py-1 text-xs font-bold",
                              user.status === "Active"
                                ? "border-primary/30 bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={isCurrentAdmin(user)}
                              onClick={() => openEditModal(user)}
                              title={isCurrentAdmin(user) ? "Current administrator account" : "Edit user"}
                            >
                              <Pencil className="mr-1.5 h-3.5 w-3.5" />
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={isCurrentAdmin(user)}
                              onClick={() => handleStatusChange(user)}
                            >
                              {user.status === "Active" ? "Deactivate" : "Activate"}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              disabled={isCurrentAdmin(user)}
                              onClick={() => handleDeleteUser(user)}
                              aria-label={`Delete ${user.name}`}
                              title="Delete user"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 lg:hidden">
                {paginatedUsers.map((user) => (
                  <article key={user.id} className="rounded-lg border bg-background p-4">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent text-xs font-bold text-accent-foreground">
                        {getInitials(user.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h2 className="truncate font-semibold">{user.name}</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {formatUserIdentifier(user.identifier, user.role)}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "shrink-0 rounded-full border px-2 py-1 text-xs font-bold",
                              user.status === "Active"
                                ? "border-primary/30 bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {user.status}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Role</p>
                            <p className="font-medium">{getUserRoleLabel(user.role)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Portal</p>
                            <p className="font-medium capitalize">{user.portal}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isCurrentAdmin(user)}
                        onClick={() => openEditModal(user)}
                      >
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isCurrentAdmin(user)}
                        onClick={() => handleStatusChange(user)}
                      >
                        {user.status === "Active" ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={isCurrentAdmin(user)}
                        onClick={() => handleDeleteUser(user)}
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </article>
                ))}
              </div>

              {!filteredUsers.length ? (
                <div className="rounded-lg border border-dashed py-12 text-center">
                  <UsersRound className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 font-semibold">No users found</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add a user or adjust the search filters.
                  </p>
                </div>
              ) : null}

              {filteredUsers.length ? (
                <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Showing {firstVisible}-{lastVisible} of {filteredUsers.length} users
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((page) => page - 1)}
                    >
                      Previous
                    </Button>
                    <span className="min-w-16 text-center text-sm">
                      {currentPage} / {pageCount}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={currentPage === pageCount}
                      onClick={() => setCurrentPage((page) => page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </section>
      </main>

      {isUserModalOpen ? (
        <AdminUserModal
          user={editingUser}
          isSaving={createUser.isPending || updateUser.isPending}
          serverError={formError}
          onClose={closeUserModal}
          onSave={handleSaveUser}
        />
      ) : null}
    </div>
  );
}
