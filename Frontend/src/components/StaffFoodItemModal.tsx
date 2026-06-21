import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Upload, X } from "lucide-react";
import { ChangeEvent, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FoodCategory, FoodFormValues, FoodItem } from "@/types/canteen";

const foodFormSchema = z.object({
  name: z.string().min(2, "Food name is required."),
  category: z.enum(["Breakfast", "Lunch", "Snack", "Drink"]),
  price: z.number().min(1, "Price must be greater than 0."),
  stock: z.number().int().min(0, "Stock cannot be negative."),
  description: z.string().min(5, "Add a short description.")
});

type StaffFoodItemModalProps = {
  categories: FoodCategory[];
  foodItem: FoodItem | null;
  onClose: () => void;
  onSave: (values: FoodFormValues, imageUrl: string) => void;
};

export function StaffFoodItemModal({
  categories,
  foodItem,
  onClose,
  onSave
}: StaffFoodItemModalProps) {
  const [imagePreview, setImagePreview] = useState(foodItem?.imageUrl ?? "");
  const {
    formState: { errors },
    handleSubmit,
    register
  } = useForm<FoodFormValues>({
    resolver: zodResolver(foodFormSchema),
    defaultValues: {
      name: foodItem?.name ?? "",
      category: foodItem?.category ?? "Lunch",
      price: foodItem?.price ?? 0,
      stock: foodItem?.stock ?? 0,
      description: foodItem?.description ?? ""
    }
  });

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImagePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleSave(values: FoodFormValues) {
    onSave(values, imagePreview);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-lg border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">{foodItem ? "Edit Food Item" : "New Food Item"}</h2>
            <p className="text-sm text-muted-foreground">
              Details saved here will be ready for the student menu.
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form className="space-y-4 p-5" onSubmit={handleSubmit(handleSave)}>
          <div className="space-y-2">
            <Label>Food picture</Label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-muted/40 p-4 text-center transition-colors hover:bg-muted">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Food preview"
                  className="h-40 w-full rounded-md object-cover"
                />
              ) : (
                <div className="flex h-40 w-full flex-col items-center justify-center rounded-md">
                  <ImagePlus className="h-9 w-9 text-primary" />
                  <p className="mt-2 text-sm font-semibold">Upload food image</p>
                  <p className="mt-1 text-xs text-muted-foreground">PNG or JPG, up to 5MB</p>
                </div>
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="sr-only"
                onChange={handleImageChange}
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Food name *</Label>
              <Input id="name" placeholder="Chicken rice" {...register("name")} />
              {errors.name?.message ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...register("category")}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category?.message ? (
                <p className="text-sm text-destructive">{errors.category.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                min={0}
                step={1}
                placeholder="250"
                {...register("price", { valueAsNumber: true })}
              />
              {errors.price?.message ? <p className="text-sm text-destructive">{errors.price.message}</p> : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="stock">Remaining stock *</Label>
              <Input
                id="stock"
                type="number"
                min={0}
                step={1}
                placeholder="30"
                {...register("stock", { valueAsNumber: true })}
              />
              {errors.stock?.message ? <p className="text-sm text-destructive">{errors.stock.message}</p> : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                rows={3}
                placeholder="Short details shown to students"
                className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...register("description")}
              />
              {errors.description?.message ? (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button type="submit">
              <Upload className="mr-2 h-4 w-4" />
              {foodItem ? "Save Changes" : "Save Food Item"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
