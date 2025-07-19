import { Button } from "@/components/ui/button";
import { Check, X, ArrowRight } from "lucide-react";
import { useState } from "react";
import { EarlyAccessModal } from "@/components/EarlyAccessModal";

export const Comparison = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const comparisonData = [
    {
      feature: "🔁 Sync to portals",
      manual: "Manual copy-paste to each platform",
      leasy: "1-click sync to 5+ platforms",
      manualIcon: <X className="h-4 w-4 text-destructive" />,
      leasyIcon: <Check className="h-4 w-4 text-success" />
    },
    {
      feature: "🧠 Description writing",
      manual: "15–30 mins per listing",
      leasy: "AI-written in 30 seconds",
      manualIcon: <X className="h-4 w-4 text-destructive" />,
      leasyIcon: <Check className="h-4 w-4 text-success" />
    },
    {
      feature: "📷 Image handling",
      manual: "Upload + resize manually",
      leasy: "Auto-optimized in Cloudflare",
      manualIcon: <X className="h-4 w-4 text-destructive" />,
      leasyIcon: <Check className="h-4 w-4 text-success" />
    },
    {
      feature: "🕒 Time spent",
      manual: "~12 hours/week",
      leasy: "Near-zero effort",
      manualIcon: <X className="h-4 w-4 text-destructive" />,
      leasyIcon: <Check className="h-4 w-4 text-success" />
    },
    {
      feature: "⚖️ Legal info",
      manual: "Often forgotten",
      leasy: "Auto-attached to every export",
      manualIcon: <X className="h-4 w-4 text-destructive" />,
      leasyIcon: <Check className="h-4 w-4 text-success" />
    },
    {
      feature: "❌ Errors & duplicates",
      manual: "High risk",
      leasy: "Always accurate & unified",
      manualIcon: <X className="h-4 w-4 text-destructive" />,
      leasyIcon: <Check className="h-4 w-4 text-success" />
    },
    {
      feature: "📊 Reach",
      manual: "Limited to 1–2 platforms",
      leasy: "+247% more exposure",
      manualIcon: <X className="h-4 w-4 text-destructive" />,
      leasyIcon: <Check className="h-4 w-4 text-success" />
    }
  ];

  return (
    <section className="section-spacing bg-gradient-to-br from-accent/5 via-background to-primary/5">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center component-spacing">
            <h2 className="text-display text-foreground element-spacing">
              Why Leasy {'>'}  Manual Listing
            </h2>
            <p className="text-subtitle text-muted-foreground content-width-wide mx-auto">
              See how Leasy transforms your property listing workflow from hours of manual work to effortless automation.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="bg-card border border-border/50 rounded-2xl shadow-large overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
              {/* Header Row */}
              <div className="p-6 border-b border-border/50 lg:border-r lg:border-b-0">
                <h3 className="font-semibold text-foreground text-lg">Feature</h3>
              </div>
              <div className="p-6 bg-destructive/5 border-b border-border/50 lg:border-r lg:border-b-0">
                <h3 className="font-semibold text-foreground text-lg flex items-center gap-2">
                  <X className="h-5 w-5 text-destructive" />
                  Manual Workflow
                </h3>
              </div>
              <div className="p-6 bg-success/5 border-b border-border/50">
                <h3 className="font-semibold text-foreground text-lg flex items-center gap-2">
                  <Check className="h-5 w-5 text-success" />
                  With Leasy
                </h3>
              </div>
            </div>

            {/* Comparison Rows */}
            {comparisonData.map((item, index) => (
              <div key={index} className="grid grid-cols-1 lg:grid-cols-3 gap-0 border-b border-border/50 last:border-b-0">
                <div className="p-6 lg:border-r border-border/50">
                  <div className="font-medium text-foreground">{item.feature}</div>
                </div>
                <div className="p-6 bg-destructive/5 lg:border-r border-border/50">
                  <div className="flex items-start gap-3">
                    {item.manualIcon}
                    <span className="text-muted-foreground">{item.manual}</span>
                  </div>
                </div>
                <div className="p-6 bg-success/5">
                  <div className="flex items-start gap-3">
                    {item.leasyIcon}
                    <span className="text-foreground font-medium">{item.leasy}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <p className="text-lg text-muted-foreground mb-6">
              Get started in 5 minutes — no tech skills needed.
            </p>
            <Button 
              variant="hero" 
              size="lg"
              onClick={() => setIsModalOpen(true)}
              className="group"
            >
              Join Beta Waitlist
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>

      <EarlyAccessModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </section>
  );
};