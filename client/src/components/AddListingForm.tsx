import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ProductWithSeller } from "@shared/schema";

const listingSchema = z.object({
  title: z.string().min(1, "Product title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.enum(["Electronics", "Clothes", "Books", "Furniture"]),
  price: z.string().min(1, "Price is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Price must be a positive number"),
  imageUrl: z.string().optional(),
});

type ListingForm = z.infer<typeof listingSchema>;

interface AddListingFormProps {
  product?: ProductWithSeller | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddListingForm({ product, onClose, onSuccess }: AddListingFormProps) {
  const { toast } = useToast();
  const isEditing = !!product;

  const form = useForm<ListingForm>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: product?.title || "",
      description: product?.description || "",
      category: (product?.category as "Electronics" | "Clothes" | "Books" | "Furniture") || "Electronics",
      price: product?.price || "",
      imageUrl: product?.imageUrl || "",
    },
  });

  const createListingMutation = useMutation({
    mutationFn: async (formData: ListingForm) => {
      const data = {
        ...formData,
        price: parseFloat(formData.price).toString(),
      };
      
      if (isEditing) {
        await apiRequest("PUT", `/api/products/${product.id}`, data);
      } else {
        await apiRequest("POST", "/api/products", data);
      }
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Listing updated" : "Listing created",
        description: isEditing 
          ? "Your listing has been updated successfully."
          : "Your listing has been created successfully.",
      });
      onSuccess();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You need to be logged in. Redirecting...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: isEditing 
          ? "Failed to update listing. Please try again."
          : "Failed to create listing. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ListingForm) => {
    createListingMutation.mutate(data);
  };

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          {isEditing ? "Edit Listing" : "Add New Listing"}
        </h2>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Product Title *</Label>
            <Input
              id="title"
              {...form.register("title")}
              placeholder="Enter product title"
              data-testid="input-listing-title"
            />
            {form.formState.errors.title && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Describe your product"
              rows={3}
              data-testid="textarea-listing-description"
            />
            {form.formState.errors.description && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={form.watch("category")}
                onValueChange={(value) => form.setValue("category", value as any)}
              >
                <SelectTrigger data-testid="select-listing-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Clothes">Clothes</SelectItem>
                  <SelectItem value="Books">Books</SelectItem>
                  <SelectItem value="Furniture">Furniture</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.category && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.category.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="price">Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...form.register("price")}
                placeholder="0"
                data-testid="input-listing-price"
              />
              {form.formState.errors.price && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.price.message}
                </p>
              )}
            </div>
          </div>
          
          <div>
            <Label htmlFor="imageUrl">Product Image URL</Label>
            <Input
              id="imageUrl"
              type="url"
              {...form.register("imageUrl")}
              placeholder="https://example.com/image.jpg"
              data-testid="input-listing-image"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Paste a URL to an image of your product
            </p>
          </div>
          
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={createListingMutation.isPending}
              data-testid="button-save-listing"
            >
              {createListingMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                isEditing ? "Update Listing" : "Save Listing"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="button-cancel-listing"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
