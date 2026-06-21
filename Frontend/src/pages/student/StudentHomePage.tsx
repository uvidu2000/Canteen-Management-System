import { ClipboardList, LogOut, MessageSquareText, Minus, PackageCheck, Plus, Search, ShoppingCart, Star, Trash2, Vote } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AddReviewModal } from "@/components/AddReviewModal";
import { OrderFoodItemModal } from "@/components/OrderFoodItemModal";
import { PopularDishesSection } from "@/components/PopularDishesSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes";
import { categories } from "@/data/canteenData";
import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "@/lib/queryKeys";
import { canteenService } from "@/services/canteenService";
import type { FoodCategory, FoodItem, ReviewFormValues } from "@/types/canteen";
import { formatPrice, getAverageRating, getFoodStatus, getReviewCountLabel, getStatusClassName } from "@/utils/canteen";
import { cn } from "@/utils/cn";

type CartItem = {
  foodItemId: string;
  foodName: string;
  unitPrice: number;
  quantity: number;
  stock: number;
};

export function StudentHomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<FoodCategory | "All">("All");
  const [reviewFoodItem, setReviewFoodItem] = useState<FoodItem | null>(null);
  const [orderFoodItem, setOrderFoodItem] = useState<FoodItem | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const foodItemsQuery = useQuery({
    queryKey: queryKeys.foodItems,
    queryFn: canteenService.listFoodItems
  });
  const ordersQuery = useQuery({
    queryKey: queryKeys.orders,
    queryFn: canteenService.listOrders
  });
  const foodItems = foodItemsQuery.data ?? [];
  const orders = ordersQuery.data ?? [];
  const activeReviewFoodItem = reviewFoodItem
    ? foodItems.find((item) => item.id === reviewFoodItem.id) ?? reviewFoodItem
    : null;

  const createReviewMutation = useMutation({
    mutationFn: ({ foodItemId, values }: { foodItemId: string; values: ReviewFormValues }) =>
      canteenService.createReview(foodItemId, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.foodItems });
      closeReviewModal();
    }
  });
  const updateReviewMutation = useMutation({
    mutationFn: ({
      foodItemId,
      reviewId,
      values
    }: {
      foodItemId: string;
      reviewId: string;
      values: ReviewFormValues;
    }) => canteenService.updateReview(foodItemId, reviewId, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.foodItems });
    }
  });
  const deleteReviewMutation = useMutation({
    mutationFn: ({ foodItemId, reviewId }: { foodItemId: string; reviewId: string }) =>
      canteenService.deleteReview(foodItemId, reviewId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.foodItems });
    }
  });
  const createOrderMutation = useMutation({
    mutationFn: (items: Array<{ foodItemId: string; quantity: number }>) =>
      canteenService.createOrder(items),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.foodItems });
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      setCartItems([]);
    }
  });

  const filteredFoodItems = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return foodItems.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.description.toLowerCase().includes(normalizedSearch);
      const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [categoryFilter, foodItems, searchQuery]);

  const summary = useMemo(() => {
    const availableItems = foodItems.filter((item) => item.stock > 0).length;
    const lowStockItems = foodItems.filter((item) => item.stock > 0 && item.stock <= 10).length;
    const totalStock = foodItems.reduce((total, item) => total + item.stock, 0);
    const orderedItems = orders.reduce((total, order) => total + order.quantity, 0);

    return { availableItems, lowStockItems, totalStock, orderedItems };
  }, [foodItems, orders]);

  function handleLogout() {
    logout();
    navigate(ROUTES.login, { replace: true });
  }

  function openReviewModal(foodItem: FoodItem) {
    setReviewFoodItem(foodItem);
  }

  function closeReviewModal() {
    setReviewFoodItem(null);
  }

  function openOrderModal(foodItem: FoodItem) {
    const quantityInCart = cartItems.find((item) => item.foodItemId === foodItem.id)?.quantity ?? 0;
    const remainingForCart = foodItem.stock - quantityInCart;

    if (remainingForCart <= 0) {
      return;
    }

    setOrderFoodItem(foodItem);
    setOrderQuantity(1);
  }

  function closeOrderModal() {
    setOrderFoodItem(null);
    setOrderQuantity(1);
  }

  function handleOrderQuantityChange(direction: "increase" | "decrease") {
    if (!orderFoodItem) {
      return;
    }

    setOrderQuantity((currentQuantity) => {
      const quantityInCart =
        cartItems.find((item) => item.foodItemId === orderFoodItem.id)?.quantity ?? 0;
      const maxAdditionalQuantity = Math.max(1, orderFoodItem.stock - quantityInCart);

      if (direction === "increase") {
        return Math.min(maxAdditionalQuantity, currentQuantity + 1);
      }

      return Math.max(1, currentQuantity - 1);
    });
  }

  function handlePlaceOrder() {
    if (!orderFoodItem) {
      return;
    }

    setCartItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.foodItemId === orderFoodItem.id);

      if (existingItem) {
        return currentItems.map((item) =>
          item.foodItemId === orderFoodItem.id
            ? {
                ...item,
                quantity: Math.min(item.stock, item.quantity + orderQuantity)
              }
            : item
        );
      }

      return [
        ...currentItems,
        {
          foodItemId: orderFoodItem.id,
          foodName: orderFoodItem.name,
          unitPrice: orderFoodItem.price,
          quantity: orderQuantity,
          stock: orderFoodItem.stock
        }
      ];
    });
    closeOrderModal();
  }

  function handleCartQuantityChange(foodItemId: string, direction: "increase" | "decrease") {
    setCartItems((currentItems) =>
      currentItems
        .map((item) => {
          if (item.foodItemId !== foodItemId) {
            return item;
          }

          const nextQuantity =
            direction === "increase"
              ? Math.min(item.stock, item.quantity + 1)
              : Math.max(0, item.quantity - 1);

          return {
            ...item,
            quantity: nextQuantity
          };
        })
        .filter((item) => item.quantity > 0)
    );
  }

  function handleRemoveCartItem(foodItemId: string) {
    setCartItems((currentItems) => currentItems.filter((item) => item.foodItemId !== foodItemId));
  }

  function handleSubmitCartOrder() {
    if (!cartItems.length) {
      return;
    }

    createOrderMutation.mutate(
      cartItems.map((item) => ({
        foodItemId: item.foodItemId,
        quantity: item.quantity
      }))
    );
  }

  function handleSaveReview(values: ReviewFormValues) {
    if (!activeReviewFoodItem) {
      return;
    }

    createReviewMutation.mutate({
      foodItemId: activeReviewFoodItem.id,
      values
    });
  }

  const cartTotal = cartItems.reduce(
    (total, item) => total + item.unitPrice * item.quantity,
    0
  );
  const cartQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);

  function handleUpdateReview(reviewId: string, values: ReviewFormValues) {
    if (!activeReviewFoodItem) {
      return;
    }

    updateReviewMutation.mutate({
      foodItemId: activeReviewFoodItem.id,
      reviewId,
      values
    });
  }

  function handleDeleteReview(reviewId: string) {
    if (!activeReviewFoodItem) {
      return;
    }

    deleteReviewMutation.mutate({
      foodItemId: activeReviewFoodItem.id,
      reviewId
    });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Student Portal
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-normal text-foreground">
              Today&apos;s Canteen Menu
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              View available food items, check remaining stock, and share your feedback.
            </p>
            {user.name ? (
              <p className="mt-3 inline-flex rounded-full border bg-card px-3 py-1 text-sm font-semibold text-primary">
                Welcome {user.name}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={() => navigate(ROUTES.studentOrders)}>
              <ClipboardList className="mr-2 h-4 w-4" />
              My Orders
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(ROUTES.studentVotes)}>
              <Vote className="mr-2 h-4 w-4" />
              Food Votes
            </Button>
            <Button type="button" variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </div>
        </header>

        <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Available Items
            </p>
            <p className="mt-2 text-2xl font-bold">{summary.availableItems}</p>
          </div>
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Low Stock
            </p>
            <p className="mt-2 text-2xl font-bold">{summary.lowStockItems}</p>
          </div>
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Total Remaining
            </p>
            <p className="mt-2 text-2xl font-bold">{summary.totalStock}</p>
          </div>
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Ordered Today
            </p>
            <p className="mt-2 text-2xl font-bold">{summary.orderedItems}</p>
          </div>
        </section>

        <PopularDishesSection
          foodItems={foodItems}
          isOrderPending={createOrderMutation.isPending}
          onOrder={openOrderModal}
          onReview={openReviewModal}
        />

        <section className="mb-5 rounded-lg border bg-card p-3 shadow-sm sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Current Order
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-normal">Food cart</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Add multiple food items and place them as one order.
              </p>
            </div>
            <div className="rounded-lg border bg-background p-3 sm:min-w-40">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Total
              </p>
              <p className="mt-1 text-xl font-bold">{formatPrice(cartTotal)}</p>
            </div>
          </div>

          {cartItems.length ? (
            <div className="mt-4 space-y-3">
              {cartItems.map((item) => (
                <div
                  key={item.foodItemId}
                  className="flex flex-col gap-3 rounded-lg border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold">{item.foodName}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(item.unitPrice)} each
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleCartQuantityChange(item.foodItemId, "decrease")}
                      aria-label={`Decrease ${item.foodName} quantity`}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleCartQuantityChange(item.foodItemId, "increase")}
                      aria-label={`Increase ${item.foodName} quantity`}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <span className="min-w-24 text-right font-semibold">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveCartItem(item.foodItemId)}
                      aria-label={`Remove ${item.foodName}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {cartQuantity} {cartQuantity === 1 ? "item" : "items"} in this order
                </p>
                <Button
                  type="button"
                  disabled={createOrderMutation.isPending}
                  onClick={handleSubmitCartOrder}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {createOrderMutation.isPending ? "Placing Order" : "Place Order"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed py-8 text-center">
              <ShoppingCart className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-semibold">No items selected</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose food items from the menu below.
              </p>
            </div>
          )}
        </section>

        <section className="rounded-lg border bg-card p-3 shadow-sm sm:p-4">
          {foodItemsQuery.isLoading ? (
            <div className="rounded-lg border border-dashed py-12 text-center">
              <PackageCheck className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-semibold">Loading food items</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Fetching today&apos;s canteen menu.
              </p>
            </div>
          ) : null}

          <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search food items..."
                className="h-11 pl-10"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value as FoodCategory | "All")}
              className="h-11 rounded-md border border-input bg-background px-3 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Filter by category"
            >
              <option value="All">Category: All</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  Category: {category}
                </option>
              ))}
            </select>
          </div>

          {!foodItemsQuery.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredFoodItems.map((item) => {
              const status = getFoodStatus(item.stock);
              const averageRating = getAverageRating(item.reviews);
              const isSoldOut = item.stock === 0;

              return (
                <article key={item.id} className="overflow-hidden rounded-lg border bg-background shadow-sm">
                  <div className="relative">
                    <img src={item.imageUrl} alt={item.name} className="h-44 w-full object-cover" />
                    <span
                      className={cn(
                        "absolute left-3 top-3 rounded-full border px-2.5 py-1 text-xs font-bold",
                        getStatusClassName(status)
                      )}
                    >
                      {status}
                    </span>
                  </div>
                  <div className="space-y-4 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-semibold">{item.name}</h2>
                        <p className="text-sm text-muted-foreground">{item.category}</p>
                      </div>
                      <p className="shrink-0 font-semibold">{formatPrice(item.price)}</p>
                    </div>

                    <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-md border bg-card p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          Remaining
                        </p>
                        <p className="mt-1 text-xl font-bold">{item.stock}</p>
                      </div>
                      <button
                        type="button"
                        className="rounded-md border bg-card p-3 text-left transition-colors hover:bg-accent"
                        onClick={() => openReviewModal(item)}
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          Reviews
                        </p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <Star className="h-4 w-4 fill-primary text-primary" />
                          <span className="text-xl font-bold">{averageRating || "-"}</span>
                          <span className="text-xs text-muted-foreground">
                            {getReviewCountLabel(item.reviews.length)}
                          </span>
                        </div>
                      </button>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <Button
                        type="button"
                        className="w-full"
                        disabled={isSoldOut || createOrderMutation.isPending}
                        onClick={() => openOrderModal(item)}
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        {isSoldOut ? "Sold out" : "Order"}
                      </Button>
                      <Button
                        type="button"
                        className="w-full"
                        variant="outline"
                        onClick={() => openReviewModal(item)}
                      >
                        <MessageSquareText className="mr-2 h-4 w-4" />
                        Review
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          ) : null}

          {!filteredFoodItems.length ? (
            <div className="rounded-lg border border-dashed py-12 text-center">
              <PackageCheck className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-semibold">No food items found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try another search term or category.
              </p>
            </div>
          ) : null}
        </section>
      </main>

      {orderFoodItem ? (
        <OrderFoodItemModal
          foodItem={orderFoodItem}
          quantity={orderQuantity}
          confirmLabel="Add to Order"
          onClose={closeOrderModal}
          onConfirm={handlePlaceOrder}
          onQuantityChange={handleOrderQuantityChange}
        />
      ) : null}

      {activeReviewFoodItem ? (
        <AddReviewModal
          foodItem={activeReviewFoodItem}
          onClose={closeReviewModal}
          onSubmit={handleSaveReview}
          onUpdate={handleUpdateReview}
          onDelete={handleDeleteReview}
        />
      ) : null}
    </div>
  );
}
