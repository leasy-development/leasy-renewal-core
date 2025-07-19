import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star } from "lucide-react";
const plans = [{
  name: "Starter",
  price: "29",
  period: "month",
  description: "Perfect for small landlords",
  listings: "Up to 10 listings",
  features: ["Manual upload", "Basic AI optimization", "2 platform exports", "Email support", "Basic analytics"],
  popular: false
}, {
  name: "Pro",
  price: "79",
  period: "month",
  description: "For growing property businesses",
  listings: "Up to 50 listings",
  features: ["All Starter features", "API integration", "Advanced AI optimization", "5 platform exports", "Priority support", "Advanced analytics", "Custom branding"],
  popular: true
}, {
  name: "Business",
  price: "149",
  period: "month",
  description: "For property management companies",
  listings: "Up to 200 listings",
  features: ["All Pro features", "Website scraping", "Unlimited platform exports", "Phone & chat support", "White-label solution", "Team collaboration", "Custom integrations"],
  popular: false
}, {
  name: "Enterprise",
  price: "Custom",
  period: "",
  description: "For large-scale operations",
  listings: "Unlimited listings",
  features: ["All Business features", "Dedicated account manager", "Custom development", "SLA guarantee", "On-premise deployment", "Advanced security", "24/7 phone support"],
  popular: false
}];
export const Pricing = () => {
  return (
    <section id="pricing" className="py-20 lg:py-28 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-muted-foreground">
              Choose the perfect plan for your property portfolio
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative bg-gradient-card border border-border/50 shadow-soft hover:shadow-medium transition-all duration-300 ${plan.popular ? 'ring-2 ring-primary/20 scale-105' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-primary text-white border-0">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center">
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm">{plan.description}</p>
                  <div className="mt-4">
                    {plan.price === "Custom" ? (
                      <div className="text-3xl font-bold text-foreground">Custom</div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <span className="text-3xl font-bold text-foreground">${plan.price}</span>
                        <span className="text-muted-foreground ml-1">/{plan.period}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{plan.listings}</p>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className={`w-full mt-6 ${plan.popular ? 'bg-gradient-primary hover:opacity-90' : ''}`}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    Join Beta Waitlist
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional Info */}
          <div className="text-center mt-12">
            <p className="text-muted-foreground">
              All plans include our core features. Upgrade or downgrade anytime.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};