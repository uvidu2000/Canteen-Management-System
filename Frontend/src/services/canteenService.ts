import { API_ENDPOINTS } from "@/constants/api";
import { http } from "@/services/http";
import type {
  CreateVotePayload,
  FoodFormValues,
  FoodItem,
  FoodSentimentAnalysis,
  FoodVote,
  OrderStatus,
  OrderLineItem,
  RegisteredStudent,
  ReviewFormValues,
  StudentOrder
} from "@/types/canteen";

type ListResponse<TItem> = {
  items: TItem[];
};

export type FoodItemPayload = FoodFormValues & {
  imageUrl: string;
};

export const canteenService = {
  async listFoodItems(): Promise<FoodItem[]> {
    const response = await http.get<ListResponse<FoodItem>>(API_ENDPOINTS.foodItems.base);
    return response.data.items;
  },

  async createFoodItem(payload: FoodItemPayload): Promise<FoodItem> {
    const response = await http.post<FoodItem>(API_ENDPOINTS.foodItems.base, payload);
    return response.data;
  },

  async updateFoodItem(foodItemId: string, payload: Partial<FoodItemPayload>): Promise<FoodItem> {
    const response = await http.patch<FoodItem>(API_ENDPOINTS.foodItems.byId(foodItemId), payload);
    return response.data;
  },

  async deleteFoodItem(foodItemId: string): Promise<void> {
    await http.delete(API_ENDPOINTS.foodItems.byId(foodItemId));
  },

  async createReview(foodItemId: string, payload: ReviewFormValues): Promise<FoodItem> {
    const response = await http.post<FoodItem>(API_ENDPOINTS.foodItems.reviews(foodItemId), payload);
    return response.data;
  },

  async updateReview(
    foodItemId: string,
    reviewId: string,
    payload: ReviewFormValues
  ): Promise<FoodItem> {
    const response = await http.patch<FoodItem>(
      API_ENDPOINTS.foodItems.reviewById(foodItemId, reviewId),
      payload
    );
    return response.data;
  },

  async deleteReview(foodItemId: string, reviewId: string): Promise<FoodItem> {
    const response = await http.delete<FoodItem>(
      API_ENDPOINTS.foodItems.reviewById(foodItemId, reviewId)
    );
    return response.data;
  },

  async analyzeFoodItemSentiment(foodItemId: string): Promise<FoodSentimentAnalysis> {
    const response = await http.get<FoodSentimentAnalysis>(
      API_ENDPOINTS.foodItems.sentiment(foodItemId)
    );
    return response.data;
  },

  async listOrders(): Promise<StudentOrder[]> {
    const response = await http.get<ListResponse<StudentOrder>>(API_ENDPOINTS.orders.base);
    return response.data.items;
  },

  async createOrder(items: Array<Pick<OrderLineItem, "foodItemId" | "quantity">>): Promise<StudentOrder> {
    const response = await http.post<StudentOrder>(API_ENDPOINTS.orders.base, {
      items
    });
    return response.data;
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<StudentOrder> {
    const response = await http.patch<StudentOrder>(API_ENDPOINTS.orders.byId(orderId), {
      status
    });
    return response.data;
  },

  async cancelOrder(orderId: string): Promise<StudentOrder> {
    const response = await http.post<StudentOrder>(API_ENDPOINTS.orders.cancel(orderId));
    return response.data;
  },

  async deleteOrder(orderId: string): Promise<void> {
    await http.delete(API_ENDPOINTS.orders.byId(orderId));
  },

  async listRegisteredStudents(): Promise<RegisteredStudent[]> {
    const response = await http.get<ListResponse<RegisteredStudent>>(API_ENDPOINTS.votes.students);
    return response.data.items;
  },

  async listVotes(): Promise<FoodVote[]> {
    const response = await http.get<ListResponse<FoodVote>>(API_ENDPOINTS.votes.base);
    return response.data.items;
  },

  async createVote(payload: CreateVotePayload): Promise<FoodVote> {
    const response = await http.post<FoodVote>(API_ENDPOINTS.votes.base, payload);
    return response.data;
  },

  async submitVote(voteId: string, foodItemId: string): Promise<FoodVote> {
    const response = await http.post<FoodVote>(API_ENDPOINTS.votes.ballot(voteId), {
      foodItemId
    });
    return response.data;
  },

  async endVote(voteId: string): Promise<FoodVote> {
    const response = await http.post<FoodVote>(API_ENDPOINTS.votes.end(voteId));
    return response.data;
  }
};
