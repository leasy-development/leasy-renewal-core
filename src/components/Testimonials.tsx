import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";
const testimonials = [{
  name: "Sarah Mitchell",
  role: "Property Manager",
  company: "Prime Properties",
  image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400",
  rating: 5,
  text: "Leasy has revolutionized how we manage our 150+ properties. The AI optimization increased our inquiry rate by 40% and saved us 15 hours per week."
}, {
  name: "Marcus Chen",
  role: "Real Estate Agent",
  company: "Urban Realty",
  image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
  rating: 5,
  text: "The multi-platform sync is incredible. One click and my listings are live on 8 different platforms. My reach has tripled since switching to Leasy."
}, {
  name: "Emma Rodriguez",
  role: "Landlord",
  company: "Independent",
  image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
  rating: 5,
  text: "As a busy landlord with 25 units, Leasy's automation has been a game-changer. The AI writes better descriptions than I ever could!"
}];
const partners = [{
  name: "ImmoScout24",
  logo: "IS24"
}, {
  name: "FARAWAYHOME",
  logo: "FWH"
}, {
  name: "Rightmove",
  logo: "RM"
}, {
  name: "Zoopla",
  logo: "ZP"
}, {
  name: "Airbnb",
  logo: "ABB"
}, {
  name: "Booking.com",
  logo: "BCM"
}];
export const Testimonials = () => {
  return (
    <section className="py-20 lg:py-28 bg-secondary/30">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">
              Trusted by property professionals
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of property managers who save time with Leasy
            </p>
          </div>

          {/* Testimonials */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-gradient-card border border-border/50 shadow-soft hover:shadow-medium transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  
                  <Quote className="w-8 h-8 text-primary/20 mb-4" />
                  
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    {testimonial.text}
                  </p>
                  
                  <div className="flex items-center gap-4">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.role} at {testimonial.company}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Partners */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-8">
              Sync with 50+ platforms including:
            </h3>
            <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-12">
              {partners.map((partner, index) => (
                <div key={index} className="flex items-center justify-center w-24 h-12 bg-gradient-card border border-border/50 rounded-lg shadow-soft">
                  <span className="text-sm font-medium text-muted-foreground">
                    {partner.logo}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};