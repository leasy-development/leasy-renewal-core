import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Download, Wand2, Share2 } from "lucide-react";
import { useState } from "react";
import { EarlyAccessModal } from "@/components/EarlyAccessModal";

const steps = [
  {
    number: "01",
    icon: Download,
    title: "Import",
    subtitle: "Bring in your listings",
    description: "Upload manually, connect via API, or let our smart scraper automatically import from your existing website.",
    features: ["Bulk CSV upload", "API integration", "Website scraping", "Data validation"]
  },
  {
    number: "02", 
    icon: Wand2,
    title: "Optimize",
    subtitle: "AI-powered enhancement",
    description: "Our AI analyzes and optimizes your content for better SEO, readability, and conversion rates.",
    features: ["SEO optimization", "Content rewriting", "Image optimization", "Performance scoring"]
  },
  {
    number: "03",
    icon: Share2,
    title: "Distribute",
    subtitle: "Multi-channel publishing",
    description: "Automatically sync and publish your optimized listings across all major property platforms.",
    features: ["Real-time sync", "Multi-platform export", "Custom scheduling", "Performance tracking"]
  }
];

export const HowItWorks = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return (
    <section id="how-it-works" className="py-20 lg:py-28">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">
            How it works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get started in minutes with our simple three-step process
          </p>
        </div>

        {/* Steps */}
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-full w-12 h-0.5 bg-gradient-to-r from-primary to-primary/30 z-0 transform translate-x-4"></div>
              )}
              
              <Card className="relative bg-gradient-card border-border/50 shadow-soft hover:shadow-medium transition-all duration-300 group">
                <CardContent className="p-8">
                  {/* Step Number */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <step.icon className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <div className="text-6xl font-bold text-primary/20 group-hover:text-primary/30 transition-colors">
                      {step.number}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold text-foreground mb-1">
                        {step.title}
                      </h3>
                      <p className="text-primary font-medium">
                        {step.subtitle}
                      </p>
                    </div>
                    
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                    
                    {/* Features */}
                    <ul className="space-y-2">
                      {step.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-card border border-border rounded-2xl p-8 lg:p-12 shadow-medium">
            <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
              Ready to be part of the beta?
            </h3>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join our exclusive beta program and help shape the future of property listing management.
            </p>
            <Button 
              variant="hero" 
              size="xl" 
              className="group"
              onClick={() => setIsModalOpen(true)}
            >
              Join Beta Waitlist
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>

      <EarlyAccessModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </section>
  );
};