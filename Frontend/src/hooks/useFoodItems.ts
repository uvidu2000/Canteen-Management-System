import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { canteenService, type FoodItemPayload } from "@/services/canteenService";
import type { ReviewFormValues } from "@/types/canteen";

export function useFoodItems() {
  const queryClient = useQueryClient();

  const foodItemsQuery = useQuery({
    queryKey: queryKeys.foodItems,
    queryFn: canteenService.listFoodItems
  });

  const invalidateFoodItems = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.foodItems });
  };

  const createFoodItem = useMutation({
    mutationFn: (payload: FoodItemPayload) => canteenService.createFoodItem(payload),
    onSuccess: invalidateFoodItems
  });

  const updateFoodItem = useMutation({
    mutationFn: ({ foodItemId, payload }: { foodItemId: string; payload: Partial<FoodItemPayload> }) =>
      canteenService.updateFoodItem(foodItemId, payload),
    onSuccess: invalidateFoodItems
  });

  const deleteFoodItem = useMutation({
    mutationFn: canteenService.deleteFoodItem,
    onSuccess: invalidateFoodItems
  });

  const createReview = useMutation({
    mutationFn: ({ foodItemId, payload }: { foodItemId: string; payload: ReviewFormValues }) =>
      canteenService.createReview(foodItemId, payload),
    onSuccess: invalidateFoodItems
  });

  const updateReview = useMutation({
    mutationFn: ({
      foodItemId,
      reviewId,
      payload
    }: {
      foodItemId: string;
      reviewId: string;
      payload: ReviewFormValues;
    }) => canteenService.updateReview(foodItemId, reviewId, payload),
    onSuccess: invalidateFoodItems
  });

  const deleteReview = useMutation({
    mutationFn: ({ foodItemId, reviewId }: { foodItemId: string; reviewId: string }) =>
      canteenService.deleteReview(foodItemId, reviewId),
    onSuccess: invalidateFoodItems
  });

  return {
    foodItems: foodItemsQuery.data ?? [],
    isLoadingFoodItems: foodItemsQuery.isLoading,
    isFoodItemsError: foodItemsQuery.isError,
    createFoodItem,
    updateFoodItem,
    deleteFoodItem,
    createReview,
    updateReview,
    deleteReview
  };
}
