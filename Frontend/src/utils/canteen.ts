import moment from "moment";
import type { FoodReview, FoodStatus, OrderStatus } from "@/types/canteen";

const DATE_TIME_DISPLAY_FORMAT = "YYYY-MM-DD HH:mm";

export function getFoodStatus(stock: number): FoodStatus {
  if (stock === 0) {
    return "Sold out";
  }

  if (stock <= 10) {
    return "Low stock";
  }

  return "Available";
}

export function getStatusClassName(status: FoodStatus): string {
  if (status === "Available") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "Low stock") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-600";
}

export function getOrderStatusClassName(status: OrderStatus): string {
  if (status === "Pending") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "Ready") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  if (status === "Collected") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-red-200 bg-red-50 text-red-700";
}

export function formatPrice(price: number): string {
  return `LKR ${price.toLocaleString("en-LK")}`;
}

export function formatDateTime(value: string): string {
  const dateTime = moment(value, [moment.ISO_8601, DATE_TIME_DISPLAY_FORMAT], true);

  if (!dateTime.isValid()) {
    return value;
  }

  return dateTime.format(DATE_TIME_DISPLAY_FORMAT);
}

export function getAverageRating(reviews: FoodReview[]): number {
  if (!reviews.length) {
    return 0;
  }

  const totalRating = reviews.reduce((total, review) => total + review.rating, 0);
  return Math.round((totalRating / reviews.length) * 10) / 10;
}

export function getReviewCountLabel(count: number): string {
  return count === 1 ? "1 review" : `${count} reviews`;
}

export function getCurrentTimeLabel(): string {
  return new Intl.DateTimeFormat("en-LK", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date());
}
