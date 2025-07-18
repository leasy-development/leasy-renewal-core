import { Card, CardContent } from "@/components/ui/card";
import { 
  Upload, 
  Wand2, 
  Image as ImageIcon, 
  Share2, 
  BarChart3, 
  Shield,
  Clock,
  Globe
} from "lucide-react";

const features = [
  {
    icon: Upload,
    title: "Smart Import System",
    description: "Upload listings manually, via API, or automatically scrape from your existing website with our intelligent crawler."
  },
  {
    icon: Wand2,
    title: "AI Content Optimization",
    description: "Optimize or completely rewrite property descriptions for better SEO performance and increased visibility."
  },
  {
    icon: ImageIcon,
    title: "CDN Image Storage",
    description: "Images stored and optimized through Cloudflare CDN for lightning-fast loading worldwide."
  },
  {
    icon: Share2,
    title: "Multi-Platform Export",
    description: "Distribute to your website, ImmoScout24, FARAWAYHOME, and other major property platforms instantly."
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track performance across all channels with detailed insights and actionable recommendations."
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-grade security with encrypted data storage and SOC 2 compliance for peace of mind."
  },
  {
    icon: Clock,
    title: "Real-time Sync",
    description: "Automatic synchronization ensures your listings are always up-to-date across all platforms."
  },
  {
    icon: Globe,
    title: "Global Reach",
    description: "Expand your market reach with support for international property platforms and languages."
  }
];

export const Features = () => {
  return (
    <section id="features" className="py-20 lg:py-28 bg-secondary/30">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">
            Everything you need to{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              scale your listings
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From smart import to AI optimization, we provide all the tools 
            to streamline your property management workflow.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group bg-gradient-card border-border/50 shadow-soft hover:shadow-medium transition-all duration-300 hover:scale-105"
            >
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-16 pt-16 border-t border-border">
          <div className="text-center">
            <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">10K+</div>
            <div className="text-muted-foreground">Properties Managed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">50+</div>
            <div className="text-muted-foreground">Platform Integrations</div>
          </div>
          <div className="text-center">
            <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">99.9%</div>
            <div className="text-muted-foreground">Uptime SLA</div>
          </div>
          <div className="text-center">
            <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">24/7</div>
            <div className="text-muted-foreground">Support Available</div>
          </div>
        </div>
      </div>
    </section>
  );
};