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
  return;
};