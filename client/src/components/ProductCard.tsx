import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ProductWithSeller } from "@shared/schema";
import { useLocation } from "wouter";

interface ProductCardProps {
  product: ProductWithSeller;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/cart", {
        productId: product.id,
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
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 cursor-pointer"
      data-testid={`product-card-${product.id}`}
    >
      <div 
        className="aspect-video bg-muted flex items-center justify-center"
        onClick={() => navigate(`/product/${product.id}`)}
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center">
            <i className="fas fa-image text-4xl text-muted-foreground mb-2"></i>
            <p className="text-sm text-muted-foreground">No image available</p>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div onClick={() => navigate(`/product/${product.id}`)}>
          <h3 className="font-semibold text-lg mb-2 line-clamp-1" data-testid={`product-title-${product.id}`}>
            {product.title}
          </h3>
          <p className="text-muted-foreground text-sm mb-2 line-clamp-2" data-testid={`product-description-${product.id}`}>
            {product.description}
          </p>
          <div className="flex justify-between items-center mb-3">
            <span className="text-primary font-bold text-xl" data-testid={`product-price-${product.id}`}>
              ₹{parseFloat(product.price).toLocaleString()}
            </span>
            <Badge className={getCategoryColor(product.category)} data-testid={`product-category-${product.id}`}>
              {product.category}
            </Badge>
          </div>
        </div>
        <Button
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            addToCartMutation.mutate();
          }}
          disabled={addToCartMutation.isPending}
          data-testid={`add-to-cart-${product.id}`}
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
      </CardContent>
    </Card>
  );
}
