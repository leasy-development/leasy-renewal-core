import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "Property Manager",
    company: "Prime Properties",
    image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400",
    rating: 5,
    text: "Home Scraper has revolutionized how we manage our 150+ properties. The AI optimization increased our inquiry rate by 40% and saved us 15 hours per week."
  },
  {
    name: "Marcus Chen",
    role: "Real Estate Agent",
    company: "Urban Realty",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
    rating: 5,
    text: "The multi-platform sync is incredible. One click and my listings are live on 8 different platforms. My reach has tripled since switching to Home Scraper."
  },
  {
    name: "Emma Rodriguez",
    role: "Landlord",
    company: "Independent",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
    rating: 5,
    text: "As a busy landlord with 25 units, Home Scraper's automation has been a game-changer. The AI writes better descriptions than I ever could!"
  }
];

const partners = [
  { name: "ImmoScout24", logo: "IS24" },
  { name: "FARAWAYHOME", logo: "FWH" },
  { name: "Rightmove", logo: "RM" },
  { name: "Zoopla", logo: "ZP" },
  { name: "Airbnb", logo: "ABB" },
  { name: "Booking.com", logo: "BCM" }
];

export const Testimonials = () => {
  return (
    <section className="py-20 lg:py-28">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">
            Trusted by thousands of{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              property professionals
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            See how Home Scraper is helping property managers, landlords, and agents 
            scale their business and reach more customers.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-gradient-card border-border/50 shadow-soft hover:shadow-medium transition-all duration-300 group">
              <CardContent className="p-6">
                {/* Quote Icon */}
                <Quote className="h-8 w-8 text-primary/30 mb-4" />
                
                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                
                {/* Text */}
                <p className="text-muted-foreground leading-relaxed mb-6">
                  "{testimonial.text}"
                </p>
                
                {/* Author */}
                <div className="flex items-center gap-3">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-foreground">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role} • {testimonial.company}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Partner Logos */}
        <div className="border-t border-border pt-16">
          <div className="text-center mb-12">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Integrated with leading platforms
            </h3>
            <p className="text-muted-foreground">
              Connect to 50+ property platforms and marketplaces
            </p>
          </div>
          
          <div className="grid grid-cols-3 md:grid-cols-6 gap-8 items-center justify-items-center">
            {partners.map((partner, index) => (
              <div 
                key={index}
                className="w-16 h-16 bg-gradient-card border border-border rounded-lg flex items-center justify-center shadow-soft hover:shadow-medium transition-all duration-300 group"
              >
                <span className="text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors">
                  {partner.logo}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};