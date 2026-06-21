import { ClipboardList, LogOut, MessageSquareText, Minus, PackageCheck, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StaffFoodItemModal } from "@/components/StaffFoodItemModal";
import { StaffReviewsModal } from "@/components/StaffReviewsModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes";
import { categories } from "@/data/canteenData";
import { useAuth } from "@/hooks/useAuth";
import { useFoodItems } from "@/hooks/useFoodItems";
import { useStaffOrders } from "@/hooks/useStaffOrders";
import type { FoodCategory, FoodFormValues, FoodItem } from "@/types/canteen";
import { formatDateTime, formatPrice, getAverageRating, getFoodStatus, getReviewCountLabel, getStatusClassName } from "@/utils/canteen";
import { cn } from "@/utils/cn";

export function StaffHomePage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const {
    foodItems,
    isLoadingFoodItems,
    createFoodItem,
    updateFoodItem,
    deleteFoodItem
  } = useFoodItems();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<FoodCategory | "All">("All");
  const [editingFoodItem, setEditingFoodItem] = useState<FoodItem | null>(null);
  const [reviewFoodItem, setReviewFoodItem] = useState<FoodItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { orders } = useStaffOrders();

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
    const totalItems = foodItems.length;
    const availableItems = foodItems.filter((item) => item.stock > 0).length;
    const lowStockItems = foodItems.filter((item) => item.stock > 0 && item.stock <= 10).length;
    const totalStock = foodItems.reduce((total, item) => total + item.stock, 0);
    const totalReviews = foodItems.reduce((total, item) => total + item.reviews.length, 0);
    const activeOrders = orders.filter(
      (order) => order.status !== "Collected" && order.status !== "Cancelled"
    ).length;

    return { totalItems, availableItems, lowStockItems, totalStock, totalReviews, activeOrders };
  }, [foodItems, orders]);

  function handleLogout() {
    logout();
    navigate(ROUTES.login, { replace: true });
  }

  function openCreateModal() {
    setEditingFoodItem(null);
    setIsModalOpen(true);
  }

  function openEditModal(foodItem: FoodItem) {
    setEditingFoodItem(foodItem);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingFoodItem(null);
  }

  function handleStockChange(foodItemId: string, direction: "increase" | "decrease") {
    const foodItem = foodItems.find((item) => item.id === foodItemId);

    if (!foodItem) {
      return;
    }

    const nextStock = direction === "increase" ? foodItem.stock + 1 : Math.max(0, foodItem.stock - 1);
    updateFoodItem.mutate({ foodItemId, payload: { stock: nextStock } });
  }

  function handleDeleteFoodItem(foodItemId: string) {
    deleteFoodItem.mutate(foodItemId);
  }

  function handleSaveFoodItem(values: FoodFormValues, imageUrl: string) {
    const nextImageUrl =
      imageUrl ||
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=320&q=80";

    if (editingFoodItem) {
      updateFoodItem.mutate(
        {
          foodItemId: editingFoodItem.id,
          payload: {
            ...values,
            imageUrl: nextImageUrl
          }
        },
        { onSuccess: closeModal }
      );
    } else {
      createFoodItem.mutate(
        {
          ...values,
          imageUrl: nextImageUrl
        },
        { onSuccess: closeModal }
      );
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Staff Portal
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-normal text-foreground">
              Canteen Food Items
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload daily food items, update stock, and keep the student portal menu current.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              Add Food Item
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(ROUTES.staffOrders)}>
              <ClipboardList className="mr-2 h-4 w-4" />
              View Orders
            </Button>
            <Button type="button" variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </div>
        </header>

        <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Food Items
            </p>
            <p className="mt-2 text-2xl font-bold">{summary.totalItems}</p>
          </div>
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Available
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
              Remaining Stock
            </p>
            <p className="mt-2 text-2xl font-bold">{summary.totalStock}</p>
          </div>
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Student Reviews
            </p>
            <p className="mt-2 text-2xl font-bold">{summary.totalReviews}</p>
          </div>
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Active Orders
            </p>
            <p className="mt-2 text-2xl font-bold">{summary.activeOrders}</p>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-3 shadow-sm sm:p-4">
          {isLoadingFoodItems ? (
            <div className="rounded-lg border border-dashed py-12 text-center">
              <PackageCheck className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-semibold">Loading food items</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Fetching the latest canteen records.
              </p>
            </div>
          ) : null}

          <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by food name or description..."
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

          <div className="hidden rounded-lg border lg:block">
            <div className="overflow-x-auto">
              <table className="min-w-[1320px] border-collapse text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <tr>
                  <th className="w-[360px] px-4 py-4 font-bold">Food Item</th>
                  <th className="w-[120px] px-4 py-4 font-bold">Category</th>
                  <th className="w-[110px] px-4 py-4 font-bold">Price</th>
                  <th className="w-[150px] px-4 py-4 font-bold">Stock</th>
                  <th className="w-[140px] px-4 py-4 font-bold">Status</th>
                  <th className="w-[150px] px-4 py-4 font-bold">Reviews</th>
                  <th className="w-[130px] px-4 py-4 font-bold">Updated</th>
                  <th className="w-[260px] px-4 py-4 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFoodItems.map((item) => {
                  const status = getFoodStatus(item.stock);
                  const averageRating = getAverageRating(item.reviews);

                  return (
                    <tr key={item.id} className="border-t">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-12 w-12 rounded-md object-cover"
                          />
                          <div>
                            <p className="font-semibold text-foreground">{item.name}</p>
                            <p className="max-w-xs truncate text-xs text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{item.category}</td>
                      <td className="px-4 py-3 font-medium">{formatPrice(item.price)}</td>
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center rounded-md border bg-background">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-r-none"
                            onClick={() => handleStockChange(item.id, "decrease")}
                            aria-label={`Decrease ${item.name} stock`}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </Button>
                          <span className="w-10 text-center text-sm font-semibold">{item.stock}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-l-none"
                            onClick={() => handleStockChange(item.id, "increase")}
                            aria-label={`Increase ${item.name} stock`}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2.5 py-1 text-xs font-bold",
                            getStatusClassName(status)
                          )}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="grid min-w-[118px] grid-cols-[18px_1fr] items-center gap-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                          onClick={() => setReviewFoodItem(item)}
                        >
                          <Star className="row-span-2 h-4 w-4 fill-primary text-primary" />
                          <span className="leading-4 font-semibold">{averageRating || "-"}</span>
                          <span className="leading-4 text-xs text-muted-foreground">
                            {getReviewCountLabel(item.reviews.length)}
                          </span>
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {formatDateTime(item.updatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setReviewFoodItem(item)}
                          >
                            <MessageSquareText className="mr-1.5 h-3.5 w-3.5" />
                            Reviews
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => openEditModal(item)}>
                            <Pencil className="mr-1.5 h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteFoodItem(item.id)}
                          >
                            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-3 lg:hidden">
            {filteredFoodItems.map((item) => {
              const status = getFoodStatus(item.stock);
              const averageRating = getAverageRating(item.reviews);

              return (
                <article key={item.id} className="rounded-lg border bg-background p-3">
                  <div className="flex gap-3">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-20 w-20 shrink-0 rounded-md object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h2 className="truncate font-semibold">{item.name}</h2>
                          <p className="text-xs text-muted-foreground">{item.category}</p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-full border px-2 py-1 text-xs font-bold",
                            getStatusClassName(status)
                          )}
                        >
                          {status}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {item.description}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold">{formatPrice(item.price)}</p>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-xs font-semibold"
                          onClick={() => setReviewFoodItem(item)}
                        >
                          <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                          {averageRating || "-"} - {getReviewCountLabel(item.reviews.length)}
                        </button>
                        <div className="inline-flex items-center rounded-md border bg-card">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleStockChange(item.id, "decrease")}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </Button>
                          <span className="w-9 text-center text-sm font-semibold">{item.stock}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleStockChange(item.id, "increase")}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2 border-t pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setReviewFoodItem(item)}
                    >
                      <MessageSquareText className="mr-1.5 h-3.5 w-3.5" />
                      Reviews
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditModal(item)}
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteFoodItem(item.id)}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>

          {!filteredFoodItems.length ? (
            <div className="rounded-lg border border-dashed py-12 text-center">
              <PackageCheck className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-semibold">No food items found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add a new item or adjust your search filters.
              </p>
            </div>
          ) : null}
        </section>

      </main>

      {isModalOpen ? (
        <StaffFoodItemModal
          categories={categories}
          foodItem={editingFoodItem}
          onClose={closeModal}
          onSave={handleSaveFoodItem}
        />
      ) : null}

      {reviewFoodItem ? (
        <StaffReviewsModal foodItem={reviewFoodItem} onClose={() => setReviewFoodItem(null)} />
      ) : null}
    </div>
  );
}
