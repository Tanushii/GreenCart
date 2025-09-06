import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { OrderWithItems } from "@shared/schema";
import { useEffect } from "react";

export default function Orders() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

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

  const { data: orders = [], isLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ordered": return "bg-blue-100 text-blue-700";
      case "shipped": return "bg-yellow-100 text-yellow-700";
      case "out_for_delivery": return "bg-orange-100 text-orange-700";
      case "delivered": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ordered": return "Ordered";
      case "shipped": return "Shipped";
      case "out_for_delivery": return "Out for Delivery";
      case "delivered": return "Delivered";
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ordered": return "fas fa-receipt";
      case "shipped": return "fas fa-truck";
      case "out_for_delivery": return "fas fa-shipping-fast";
      case "delivered": return "fas fa-check-circle";
      default: return "fas fa-box";
    }
  };

  const getProgressSteps = (status: string) => {
    const steps = ["ordered", "shipped", "out_for_delivery", "delivered"];
    const currentIndex = steps.indexOf(status);
    
    return steps.map((step, index) => ({
      step,
      completed: index <= currentIndex,
      active: index === currentIndex,
    }));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>
        
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <i className="fas fa-box-open text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-4">
                When you place your first order, it will appear here.
              </p>
              <Button onClick={() => window.location.href = "/"}>
                <i className="fas fa-shopping-bag mr-2"></i>Start Shopping
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold" data-testid={`text-order-id-${order.id}`}>
                        Order #{order.id.slice(-8).toUpperCase()}
                      </h3>
                      <p className="text-muted-foreground">
                        Placed on {new Date(order.createdAt!).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="mt-2 lg:mt-0">
                      <Badge className={getStatusColor(order.deliveryStatus)} data-testid={`status-${order.id}`}>
                        <i className={`${getStatusIcon(order.deliveryStatus)} mr-1`}></i>
                        {getStatusText(order.deliveryStatus)}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Delivery Progress */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Delivery Progress</span>
                      {order.deliveryDate && (
                        <span className="text-sm text-muted-foreground">
                          Expected: {new Date(order.deliveryDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <div className="flex items-center justify-between">
                        {getProgressSteps(order.deliveryStatus).map((stepInfo, index) => (
                          <div key={stepInfo.step} className="flex flex-col items-center">
                            <div
                              className={`w-4 h-4 rounded-full ${
                                stepInfo.completed ? 'bg-primary' : 'bg-muted'
                              } ${stepInfo.active ? 'animate-pulse' : ''}`}
                            ></div>
                            <span className="text-xs mt-1 capitalize">
                              {getStatusText(stepInfo.step)}
                            </span>
                            {index < 3 && (
                              <div
                                className={`absolute top-2 h-1 ${
                                  stepInfo.completed ? 'bg-primary' : 'bg-muted'
                                }`}
                                style={{
                                  left: `${(index + 1) * 25 - 12.5}%`,
                                  width: '25%',
                                  transform: 'translateX(-50%)',
                                }}
                              ></div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Order Items */}
                  <div className="space-y-3 mb-4">
                    {order.orderItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                          {item.product.imageUrl ? (
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.title}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <i className="fas fa-image text-muted-foreground"></i>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate" data-testid={`text-order-item-${item.id}`}>
                            {item.product.title}
                          </h4>
                          <p className="text-muted-foreground text-sm">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <span className="font-bold" data-testid={`text-item-total-${item.id}`}>
                          ₹{(parseFloat(item.price) * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-border">
                    <span className="font-semibold text-lg" data-testid={`text-order-total-${order.id}`}>
                      Total: ₹{parseFloat(order.totalAmount).toLocaleString()}
                    </span>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm">
                        Track Order
                      </Button>
                      {order.deliveryStatus === "delivered" && (
                        <Button variant="outline" size="sm">
                          Reorder Items
                        </Button>
                      )}
                    </div>
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
