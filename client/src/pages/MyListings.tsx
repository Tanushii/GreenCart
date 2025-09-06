import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navbar from "@/components/Navbar";
import AddListingForm from "@/components/AddListingForm";
import { ProductWithSeller } from "@shared/schema";
import { useEffect } from "react";

export default function MyListings() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithSeller | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: products = [], isLoading } = useQuery<ProductWithSeller[]>({
    queryKey: ["/api/my-products"],
    enabled: isAuthenticated,
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiRequest("DELETE", `/api/products/${productId}`);
    },
    onSuccess: () => {
      toast({
        title: "Product deleted",
        description: "Your product has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/my-products"] });
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
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (productId: string, productTitle: string) => {
    if (confirm(`Are you sure you want to delete "${productTitle}"?`)) {
      deleteProductMutation.mutate(productId);
    }
  };

  const handleEdit = (product: ProductWithSeller) => {
    setEditingProduct(product);
    setShowAddForm(true);
  };

  const handleFormClose = () => {
    setShowAddForm(false);
    setEditingProduct(null);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Electronics": return "bg-blue-100 text-blue-700";
      case "Clothes": return "bg-green-100 text-green-700";
      case "Books": return "bg-purple-100 text-purple-700";
      case "Furniture": return "bg-orange-100 text-orange-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Listings</h1>
          <Button
            onClick={() => setShowAddForm(true)}
            data-testid="button-add-listing"
          >
            <i className="fas fa-plus mr-2"></i>Add New Listing
          </Button>
        </div>

        {/* Add/Edit Listing Form */}
        {showAddForm && (
          <AddListingForm
            product={editingProduct}
            onClose={handleFormClose}
            onSuccess={() => {
              handleFormClose();
              queryClient.invalidateQueries({ queryKey: ["/api/my-products"] });
            }}
          />
        )}

        {/* Listings Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading your listings...</p>
          </div>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <i className="fas fa-box-open text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">No listings yet</h3>
              <p className="text-muted-foreground mb-4">
                Start selling by creating your first product listing.
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <i className="fas fa-plus mr-2"></i>Create First Listing
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-muted flex items-center justify-center">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <i className="fas fa-image text-2xl text-muted-foreground mb-2"></i>
                      <p className="text-sm text-muted-foreground">No image</p>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2" data-testid={`text-listing-title-${product.id}`}>
                    {product.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-primary font-bold text-xl" data-testid={`text-listing-price-${product.id}`}>
                      ₹{parseFloat(product.price).toLocaleString()}
                    </span>
                    <Badge className={getCategoryColor(product.category)}>
                      {product.category}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(product)}
                      data-testid={`button-edit-${product.id}`}
                    >
                      <i className="fas fa-edit mr-1"></i>Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDelete(product.id, product.title)}
                      disabled={deleteProductMutation.isPending}
                      data-testid={`button-delete-${product.id}`}
                    >
                      {deleteProductMutation.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <i className="fas fa-trash mr-1"></i>Delete
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
