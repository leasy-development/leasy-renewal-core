import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { EarlyAccessModal } from "@/components/EarlyAccessModal";
import heroImage from "@/assets/hero-image.jpg";
export const Hero = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return <section className="section-spacing bg-gradient-to-br from-background via-accent/30 to-primary/5 relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center max-w-7xl mx-auto">
          {/* Content */}
          <div className="text-center lg:text-left space-y-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              Currently in Beta - Join the waitlist for early access
            </div>
            
            <div className="space-y-6">
              <h1 className="text-hero text-foreground leading-none">
                List once.{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Sync everywhere.
                </span>{" "}
                Effortlessly.
              </h1>
              
              <p className="text-subtitle text-muted-foreground content-width-wide">
                Cloud-based platform for landlords, property managers, and real estate professionals to manage and sync property listings across multiple channels effortlessly.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                variant="hero" 
                size="xl" 
                className="group shadow-large hover:shadow-elegant transition-all duration-300"
                onClick={() => setIsModalOpen(true)}
              >
                Join Beta Waitlist
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button 
                variant="outline" 
                size="xl" 
                className="group border-border/50 hover:bg-accent/50 hover:border-primary/20 transition-all duration-300"
              >
                <Play className="mr-2 h-5 w-5" />
                See Live Sync in Action
              </Button>
            </div>

            {/* Floating Benefit Tags */}
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              <div className="inline-flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-full text-sm font-medium border border-success/20 shadow-soft">
                ✅ +247% Reach
              </div>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium border border-primary/20 shadow-soft">
                ⏱ –12h/week Saved
              </div>
              <div className="inline-flex items-center gap-2 bg-accent/40 text-foreground px-4 py-2 rounded-full text-sm font-medium border border-border/30 shadow-soft">
                🔁 1-Click Sync
              </div>
              <div className="inline-flex items-center gap-2 bg-purple-500/10 text-purple-600 px-4 py-2 rounded-full text-sm font-medium border border-purple-200 shadow-soft">
                🧠 AI Description in 30 sec
              </div>
              <div className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-600 px-4 py-2 rounded-full text-sm font-medium border border-orange-200 shadow-soft">
                📸 Auto-Optimized Images
              </div>
            </div>
          </div>
          
          {/* Live Sync Animation */}
          <div className="relative lg:justify-self-end">
            <div className="relative rounded-2xl overflow-hidden shadow-elegant bg-card border border-border/50 p-8 backdrop-blur-sm">
              {/* Animation Container */}
              <div className="space-y-6">
                {/* Step 1: Importing */}
                <div className="flex items-center gap-4 p-5 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 transition-all duration-300 hover:scale-[1.02]">
                  <div className="flex-shrink-0">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  </div>
                  <span className="text-sm font-medium">Importing from FARAWAYHOME.com</span>
                </div>

                {/* Step 2: AI Optimizing */}
                <div className="flex items-center gap-4 p-5 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800 transition-all duration-300 hover:scale-[1.02]">
                  <div className="flex gap-2 flex-shrink-0">
                    <span className="text-lg">✏️</span>
                    <span className="text-lg">📷</span>
                  </div>
                  <span className="text-sm font-medium">Optimizing content with AI...</span>
                </div>

                {/* Step 3: Syncing */}
                <div className="flex items-center gap-4 p-5 bg-orange-50 dark:bg-orange-950/30 rounded-xl border border-orange-200 dark:border-orange-800 transition-all duration-300 hover:scale-[1.02]">
                  <div className="flex-shrink-0">
                    <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                  </div>
                  <span className="text-sm font-medium">Syncing to 4 platforms...</span>
                </div>

                {/* Step 4: Success */}
                <div className="flex items-center gap-4 p-5 bg-success/10 rounded-xl border border-success/20 transition-all duration-300 hover:scale-[1.02]">
                  <div className="flex-shrink-0">
                    <span className="text-lg">✅</span>
                  </div>
                  <span className="text-sm font-medium text-success">Synced successfully</span>
                </div>
              </div>

              {/* Floating Status Badge */}
              <div className="absolute -top-4 -right-4 bg-card border border-border rounded-xl p-4 shadow-medium backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium whitespace-nowrap">Live Sync Active</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">Last updated 6s ago</div>
              </div>

              {/* Auto-sync overlay */}
              <div className="absolute -bottom-4 -left-4 bg-primary/90 text-primary-foreground rounded-xl p-4 shadow-medium backdrop-blur-sm">
                <div className="text-xs font-medium">Auto-syncing listings</div>
                <div className="text-xs opacity-90">No manual posting</div>
              </div>
            </div>

            {/* Background decoration */}
            <div className="absolute -inset-8 bg-gradient-to-r from-primary/5 to-accent/5 rounded-3xl -z-10 blur-3xl opacity-60"></div>
          </div>
        </div>
      </div>

      <EarlyAccessModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </section>;
};