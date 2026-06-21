export const API_ENDPOINTS = {
  auth: {
    login: "/auth/login",
    verifyOtp: "/auth/verify-otp"
  },
  foodItems: {
    base: "/food-items",
    byId: (foodItemId: string) => `/food-items/${foodItemId}`,
    sentiment: (foodItemId: string) => `/food-items/${foodItemId}/sentiment`,
    reviews: (foodItemId: string) => `/food-items/${foodItemId}/reviews`,
    reviewById: (foodItemId: string, reviewId: string) =>
      `/food-items/${foodItemId}/reviews/${reviewId}`
  },
  orders: {
    base: "/orders",
    byId: (orderId: string) => `/orders/${orderId}`
  },
  votes: {
    base: "/votes",
    students: "/votes/students",
    ballot: (voteId: string) => `/votes/${voteId}/ballot`
  }
} as const;
