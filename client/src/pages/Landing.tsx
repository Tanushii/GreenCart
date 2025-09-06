import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
      {/* Header */}
      <nav className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <i className="fas fa-leaf text-primary text-2xl"></i>
              <span className="text-xl font-bold text-primary">EcoFinds</span>
            </div>
            <Button onClick={handleLogin} data-testid="button-login">
              <i className="fas fa-sign-in-alt mr-2"></i>
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Discover <span className="text-primary">Sustainable</span> Treasures
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Find quality second-hand items while reducing environmental impact. Shop conscious, live sustainable.
          </p>
          <Button onClick={handleLogin} size="lg" className="text-lg px-8 py-6" data-testid="button-start-shopping">
            <i className="fas fa-shopping-bag mr-2"></i>
            Start Shopping
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-recycle text-primary text-xl"></i>
              </div>
              <h3 className="text-lg font-semibold mb-2">Eco-Friendly</h3>
              <p className="text-muted-foreground">
                Reduce waste by giving products a second life through our sustainable marketplace.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-shield-alt text-secondary text-xl"></i>
              </div>
              <h3 className="text-lg font-semibold mb-2">Trusted Community</h3>
              <p className="text-muted-foreground">
                Shop with confidence in our verified community of conscious buyers and sellers.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-heart text-primary text-xl"></i>
              </div>
              <h3 className="text-lg font-semibold mb-2">Great Deals</h3>
              <p className="text-muted-foreground">
                Find amazing products at unbeatable prices while supporting sustainable living.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
