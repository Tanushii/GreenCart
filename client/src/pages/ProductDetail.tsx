import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navbar from "@/components/Navbar";
import { ProductWithSeller } from "@shared/schema";

export default function ProductDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useQuery<ProductWithSeller>({
    queryKey: ["/api/products", id],
  });

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/cart", {
        productId: id,
        quantity: 1,
      });
    },
    onSuccess: () => {
      toast({
        title: "Added to cart",
        description: "Product has been added to your cart.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You need to be logged in to add items to cart.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add product to cart. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="grid lg:grid-cols-2 gap-12">
              <div className="bg-muted h-96 rounded-xl"></div>
              <div className="space-y-4">
                <div className="bg-muted h-8 w-3/4 rounded"></div>
                <div className="bg-muted h-4 w-1/2 rounded"></div>
                <div className="bg-muted h-20 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <i className="fas fa-exclamation-circle text-4xl text-muted-foreground mb-4"></i>
              <h2 className="text-xl font-semibold mb-2">Product not found</h2>
              <p className="text-muted-foreground mb-4">
                The product you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => window.history.back()}>
                <i className="fas fa-arrow-left mr-2"></i>Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Electronics": return "bg-blue-100 text-blue-700";
      case "Clothes": return "bg-green-100 text-green-700";
      case "Books": return "bg-purple-100 text-purple-700";
      case "Furniture": return "bg-orange-100 text-orange-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="mb-6"
          data-testid="button-back"
        >
          <i className="fas fa-arrow-left mr-2"></i>Back to Products
        </Button>
        
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div>
            <div className="bg-muted rounded-xl aspect-square flex items-center justify-center">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="text-center">
                  <i className="fas fa-image text-4xl text-muted-foreground mb-2"></i>
                  <p className="text-muted-foreground">No image available</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Product Info */}
          <div>
            <h1 className="text-3xl font-bold mb-4" data-testid="text-product-title">
              {product.title}
            </h1>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-3xl font-bold text-primary" data-testid="text-product-price">
                ₹{parseFloat(product.price).toLocaleString()}
              </span>
              <Badge className={getCategoryColor(product.category)} data-testid="text-product-category">
                {product.category}
              </Badge>
            </div>
            
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground leading-relaxed" data-testid="text-product-description">
                {product.description}
              </p>
            </div>
            
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Seller Information</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  {product.seller.profileImageUrl ? (
                    <img
                      src={product.seller.profileImageUrl}
                      alt="Seller"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <i className="fas fa-user text-primary"></i>
                  )}
                </div>
                <div>
                  <p className="font-medium" data-testid="text-seller-name">
                    {product.seller.firstName} {product.seller.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {product.seller.email}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4">
              <Button
                onClick={() => addToCartMutation.mutate()}
                disabled={addToCartMutation.isPending}
                className="flex-1"
                data-testid="button-add-to-cart"
              >
                {addToCartMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <i className="fas fa-shopping-cart mr-2"></i>Add to Cart
                  </>
                )}
              </Button>
              <Button variant="outline" data-testid="button-wishlist">
                <i className="fas fa-heart mr-2"></i>Wishlist
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
