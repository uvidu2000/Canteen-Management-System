import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { userService } from "@/services/userService";

export function useUsers() {
  const usersQuery = useQuery({
    queryKey: queryKeys.users,
    queryFn: userService.list
  });

  const createUser = useMutation({
    mutationFn: userService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users })
  });

  const updateUser = useMutation({
    mutationFn: ({
      userId,
      payload
    }: {
      userId: string;
      payload: Parameters<typeof userService.update>[1];
    }) => userService.update(userId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users })
  });

  const deleteUser = useMutation({
    mutationFn: userService.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users })
  });

  return {
    users: usersQuery.data ?? [],
    isLoadingUsers: usersQuery.isLoading,
    usersError: usersQuery.error,
    createUser,
    updateUser,
    deleteUser
  };
}
