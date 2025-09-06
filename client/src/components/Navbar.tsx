import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { CartItemWithProduct } from "@shared/schema";
import { useLocation } from "wouter";
import AuthModal from "./AuthModal";
import { useToast } from "@/hooks/use-toast";

export default function Navbar() {
  const { isAuthenticated } = useAuth();
  const [location, navigate] = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: cartItems = [] } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart"],
    enabled: isAuthenticated,
  });

  const cartItemCount = cartItems.reduce((sum: number, item: CartItemWithProduct) => sum + item.quantity, 0);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Logout failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Success", description: "Logged out successfully!" });
      navigate("/");
    },
    onError: () => {
      toast({ title: "Error", description: "Logout failed" });
    },
  });

  const navItems = isAuthenticated ? [
    { path: "/", icon: "fas fa-home", label: "Home", testId: "nav-home" },
    { path: "/listings", icon: "fas fa-list", label: "My Listings", testId: "nav-listings" },
    { path: "/cart", icon: "fas fa-shopping-cart", label: "Cart", testId: "nav-cart", badge: cartItemCount },
    { path: "/orders", icon: "fas fa-box", label: "Orders", testId: "nav-orders" },
    { path: "/profile", icon: "fas fa-user", label: "Profile", testId: "nav-profile" },
  ] : [
    { path: "/", icon: "fas fa-home", label: "Home", testId: "nav-home" },
  ];

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center space-x-2"
            data-testid="logo"
          >
            <i className="fas fa-leaf text-primary text-2xl"></i>
            <span className="text-xl font-bold text-primary">EcoFinds</span>
          </button>
          
          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <Input
                type="text"
                placeholder="Search sustainable products..."
                className="pl-10 pr-4"
                data-testid="search-desktop"
              />
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
            </div>
          </div>
          
          {/* Navigation Links */}
          <div className="flex items-center space-x-2 sm:space-x-6">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant={location === item.path ? "default" : "ghost"}
                size="sm"
                onClick={() => navigate(item.path)}
                className="relative"
                data-testid={item.testId}
              >
                <i className={`${item.icon} mr-1 sm:mr-2`}></i>
                <span className="hidden sm:inline">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <Badge 
                    className="absolute -top-2 -right-2 min-w-[20px] h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center"
                    data-testid={`${item.testId}-badge`}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Button>
            ))}
            
            {/* Auth buttons */}
            {isAuthenticated ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                data-testid="logout-btn"
              >
                <i className="fas fa-sign-out-alt mr-1 sm:mr-2"></i>
                <span className="hidden sm:inline">
                  {logoutMutation.isPending ? "Logging out..." : "Logout"}
                </span>
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowAuthModal(true)}
                data-testid="login-btn"
              >
                <i className="fas fa-sign-in-alt mr-1 sm:mr-2"></i>
                <span className="hidden sm:inline">Login</span>
              </Button>
            )}
          </div>
        </div>
        
        {/* Mobile Search */}
        <div className="md:hidden pb-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search sustainable products..."
              className="pl-10 pr-4"
              data-testid="search-mobile"
            />
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
          </div>
        </div>
      </div>
      
      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </nav>
  );
}
