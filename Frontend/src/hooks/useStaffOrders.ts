import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { canteenService } from "@/services/canteenService";
import type { OrderStatus } from "@/types/canteen";

export function useStaffOrders() {
  const queryClient = useQueryClient();

  const ordersQuery = useQuery({
    queryKey: queryKeys.orders,
    queryFn: canteenService.listOrders
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      canteenService.updateOrderStatus(orderId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    }
  });

  function updateOrderStatus(orderId: string, status: OrderStatus) {
    updateStatusMutation.mutate({ orderId, status });
  }

  return {
    orders: ordersQuery.data ?? [],
    isLoadingOrders: ordersQuery.isLoading,
    isOrdersError: ordersQuery.isError,
    updateOrderStatus
  };
}
