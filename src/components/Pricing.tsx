import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "29",
    period: "month",
    description: "Perfect for small landlords",
    listings: "Up to 10 listings",
    features: [
      "Manual upload",
      "Basic AI optimization",
      "2 platform exports",
      "Email support",
      "Basic analytics"
    ],
    popular: false
  },
  {
    name: "Pro",
    price: "79",
    period: "month", 
    description: "For growing property businesses",
    listings: "Up to 50 listings",
    features: [
      "All Starter features",
      "API integration",
      "Advanced AI optimization",
      "5 platform exports",
      "Priority support",
      "Advanced analytics",
      "Custom branding"
    ],
    popular: true
  },
  {
    name: "Business",
    price: "149",
    period: "month",
    description: "For property management companies",
    listings: "Up to 200 listings", 
    features: [
      "All Pro features",
      "Website scraping",
      "Unlimited platform exports",
      "Phone & chat support",
      "White-label solution",
      "Team collaboration",
      "Custom integrations"
    ],
    popular: false
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large-scale operations",
    listings: "Unlimited listings",
    features: [
      "All Business features",
      "Dedicated account manager",
      "Custom development",
      "SLA guarantee",
      "On-premise deployment",
      "Advanced security",
      "24/7 phone support"
    ],
    popular: false
  }
];

export const Pricing = () => {
  return (
    <section id="pricing" className="py-20 lg:py-28 bg-secondary/30">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose the perfect plan for your business. Scale up or down anytime. 
            All plans include a 14-day free trial.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {plans.map((plan, index) => (
            <Card 
              key={index}
              className={`relative bg-gradient-card border-border/50 shadow-soft hover:shadow-medium transition-all duration-300 hover:scale-105 ${
                plan.popular ? 'ring-2 ring-primary/20 shadow-large' : ''
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-primary text-primary-foreground">
                  <Star className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-4">
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {plan.name}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {plan.description}
                </p>
                <div className="flex items-end justify-center gap-1">
                  {plan.price !== "Custom" ? (
                    <>
                      <span className="text-4xl font-bold text-foreground">
                        ${plan.price}
                      </span>
                      <span className="text-muted-foreground mb-1">
                        /{plan.period}
                      </span>
                    </>
                  ) : (
                    <span className="text-4xl font-bold text-foreground">
                      {plan.price}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-primary">
                  {plan.listings}
                </p>
              </CardHeader>
              
              <CardContent>
                <Button 
                  variant={plan.popular ? "hero" : "outline"} 
                  className="w-full mb-6"
                  size="lg"
                >
                  {plan.price === "Custom" ? "Contact Sales" : "Start Free Trial"}
                </Button>
                
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            All plans include core features, SSL encryption, and regular backups
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              14-day free trial
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              Cancel anytime
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              No setup fees
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              24/7 support
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};