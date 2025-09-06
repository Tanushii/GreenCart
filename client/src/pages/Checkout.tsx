import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navbar from "@/components/Navbar";
import { CartItemWithProduct } from "@shared/schema";
import { useEffect } from "react";
import { useLocation } from "wouter";

const checkoutSchema = z.object({
  paymentMethod: z.enum(["card", "upi", "cod"]),
  cardNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  cvv: z.string().optional(),
  cardholderName: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  pinCode: z.string().min(6, "PIN code must be at least 6 characters"),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi" | "cod">("card");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: "card",
      firstName: "",
      lastName: "",
      address: "",
      city: "",
      pinCode: "",
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      cardholderName: "",
    },
  });

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

  const { data: cartItems = [], isLoading } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart"],
    enabled: isAuthenticated,
  });

  const createOrderMutation = useMutation({
    mutationFn: async (formData: CheckoutForm) => {
      const subtotal = cartItems.reduce(
        (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
        0
      );
      const tax = subtotal * 0.01;
      const totalAmount = subtotal + tax;

      const shippingAddress = `${formData.firstName} ${formData.lastName}\n${formData.address}\n${formData.city}, ${formData.pinCode}`;

      const orderData = {
        totalAmount: totalAmount.toString(),
        paymentMethod: formData.paymentMethod,
        shippingAddress,
      };

      const orderItems = cartItems.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      }));

      await apiRequest("POST", "/api/orders", { orderData, orderItems });
    },
    onSuccess: () => {
      toast({
        title: "Order placed successfully!",
        description: "Your order has been placed and you will receive a confirmation email soon.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      navigate("/orders");
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
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CheckoutForm) => {
    createOrderMutation.mutate(data);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading checkout...</p>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <i className="fas fa-shopping-cart text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground mb-4">
                Add some products to your cart before checkout.
              </p>
              <Button onClick={() => navigate("/")}>
                <i className="fas fa-shopping-bag mr-2"></i>Continue Shopping
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const subtotal = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
    0
  );
  const tax = subtotal * 0.01;
  const total = subtotal + tax;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Payment and Shipping */}
            <div className="space-y-6">
              {/* Payment Methods */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Payment Method</h3>
                  
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value: "card" | "upi" | "cod") => {
                      setPaymentMethod(value);
                      form.setValue("paymentMethod", value);
                    }}
                    className="space-y-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex items-center cursor-pointer">
                        <i className="fas fa-credit-card text-blue-600 mr-3"></i>
                        Credit/Debit Card
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="upi" id="upi" />
                      <Label htmlFor="upi" className="flex items-center cursor-pointer">
                        <i className="fas fa-mobile-alt text-purple-600 mr-3"></i>
                        UPI Payment
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex items-center cursor-pointer">
                        <i className="fas fa-money-bill-wave text-green-600 mr-3"></i>
                        Cash on Delivery
                      </Label>
                    </div>
                  </RadioGroup>

                  {/* Card Details Form */}
                  {paymentMethod === "card" && (
                    <div className="mt-6 space-y-4">
                      <div>
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input
                          id="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          {...form.register("cardNumber")}
                          data-testid="input-card-number"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="expiryDate">Expiry Date</Label>
                          <Input
                            id="expiryDate"
                            placeholder="MM/YY"
                            {...form.register("expiryDate")}
                            data-testid="input-expiry"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            placeholder="123"
                            {...form.register("cvv")}
                            data-testid="input-cvv"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="cardholderName">Cardholder Name</Label>
                        <Input
                          id="cardholderName"
                          placeholder="John Doe"
                          {...form.register("cardholderName")}
                          data-testid="input-cardholder"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Shipping Address</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          {...form.register("firstName")}
                          data-testid="input-first-name"
                        />
                        {form.formState.errors.firstName && (
                          <p className="text-red-500 text-sm mt-1">
                            {form.formState.errors.firstName.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          {...form.register("lastName")}
                          data-testid="input-last-name"
                        />
                        {form.formState.errors.lastName && (
                          <p className="text-red-500 text-sm mt-1">
                            {form.formState.errors.lastName.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="address">Address *</Label>
                      <Input
                        id="address"
                        {...form.register("address")}
                        data-testid="input-address"
                      />
                      {form.formState.errors.address && (
                        <p className="text-red-500 text-sm mt-1">
                          {form.formState.errors.address.message}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          {...form.register("city")}
                          data-testid="input-city"
                        />
                        {form.formState.errors.city && (
                          <p className="text-red-500 text-sm mt-1">
                            {form.formState.errors.city.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="pinCode">PIN Code *</Label>
                        <Input
                          id="pinCode"
                          {...form.register("pinCode")}
                          data-testid="input-pin-code"
                        />
                        {form.formState.errors.pinCode && (
                          <p className="text-red-500 text-sm mt-1">
                            {form.formState.errors.pinCode.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Order Summary</h3>
                  
                  {/* Order Items */}
                  <div className="space-y-3 mb-4">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.product.title} × {item.quantity}</span>
                        <span className="font-medium">
                          ₹{(parseFloat(item.product.price) * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <hr className="border-border mb-4" />
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span data-testid="text-checkout-subtotal">
                        ₹{subtotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span className="text-green-600">Free</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span data-testid="text-checkout-tax">
                        ₹{tax.toLocaleString()}
                      </span>
                    </div>
                    <hr className="border-border" />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary" data-testid="text-checkout-total">
                        ₹{total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createOrderMutation.isPending}
                    data-testid="button-place-order"
                  >
                    {createOrderMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      "Place Order"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
