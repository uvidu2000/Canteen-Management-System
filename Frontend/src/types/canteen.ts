export type FoodCategory = "Breakfast" | "Lunch" | "Snack" | "Drink";

export type FoodStatus = "Available" | "Low stock" | "Sold out";

export type FoodReview = {
  id: string;
  studentName: string;
  rating: number;
  comment: string;
  createdAt: string;
  canManage?: boolean;
};

export type FoodItem = {
  id: string;
  name: string;
  category: FoodCategory;
  price: number;
  stock: number;
  description: string;
  imageUrl: string;
  updatedAt: string;
  reviews: FoodReview[];
};

export type OrderLineItem = {
  id: string;
  foodItemId: string;
  foodName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type StudentOrder = {
  id: string;
  orderNumber: string;
  foodItemId: string;
  foodName: string;
  quantity: number;
  itemCount: number;
  items: OrderLineItem[];
  totalPrice: number;
  orderedAt: string;
  studentName?: string;
  status: OrderStatus;
};

export type OrderStatus = "Pending" | "Ready" | "Collected" | "Cancelled";

export type FoodFormValues = {
  name: string;
  category: FoodCategory;
  price: number;
  stock: number;
  description: string;
};

export type ReviewFormValues = {
  rating: number;
  comment: string;
};

export type SentimentLabel = "Positive" | "Neutral" | "Negative" | "No Reviews";

export type AspectSentiment = {
  score: number;
  sentiment: SentimentLabel;
};

export type FoodReviewSentiment = {
  rating: number;
  comment: string;
  sentiment: SentimentLabel;
  sentiment_score: number;
  rating_confidence?: number;
  aspect_sentiment: Record<string, AspectSentiment>;
};

export type FoodSentimentAnalysis = {
  average_rating: number;
  overall_sentiment: SentimentLabel;
  sentiment_summary: {
    Positive?: number;
    Neutral?: number;
    Negative?: number;
  };
  reviews: FoodReviewSentiment[];
};

export type RegisteredStudent = {
  identifier: string;
  name: string;
};

export type VoteOption = {
  foodItemId: string;
  foodName: string;
  imageUrl: string;
  category: FoodCategory;
  price: number;
  stock: number;
  voteCount: number;
};

export type FoodVote = {
  id: string;
  title: string;
  creatorName: string;
  createdAt: string;
  status: "Active" | "Ended";
  endedAt: string | null;
  canEnd: boolean;
  currentUserVoteFoodItemId: string | null;
  participants: RegisteredStudent[];
  options: VoteOption[];
};

export type CreateVotePayload = {
  title: string;
  participantIdentifiers: string[];
  foodItemIds: string[];
};
