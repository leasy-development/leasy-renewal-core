import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { EarlyAccessModal } from "@/components/EarlyAccessModal";
import heroImage from "@/assets/hero-image.jpg";
export const Hero = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return <section className="pt-20 lg:pt-32 pb-16 lg:pb-20 bg-gradient-to-br from-background via-accent/30 to-primary/5">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              Currently in Beta - Join the waitlist for early access
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              List once.{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Sync everywhere.
              </span>{" "}
              Effortlessly.
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl lg:max-w-none">
              Leasy automates your entire listing workflow — from importing properties via FARAWAYHOME or WordPress 
              to syncing them with AI-optimized descriptions and images across all major platforms like ImmoScout24, 
              Wunderflats, and your own website.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <Button 
                variant="hero" 
                size="xl" 
                className="group"
                onClick={() => setIsModalOpen(true)}
              >
                Join Beta Waitlist
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button 
                variant="outline" 
                size="xl" 
                className="group border-border/50 hover:bg-accent/50"
              >
                <Play className="mr-2 h-5 w-5" />
                See Live Sync in Action
              </Button>
            </div>

            {/* Floating Benefit Tags */}
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              <div className="inline-flex items-center gap-2 bg-success/10 text-success px-3 py-2 rounded-full text-sm font-medium">
                ✅ +247% Reach
              </div>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-2 rounded-full text-sm font-medium">
                ⏱ –12h/week Saved
              </div>
              <div className="inline-flex items-center gap-2 bg-accent/20 text-foreground px-3 py-2 rounded-full text-sm font-medium">
                🔁 1-Click Sync
              </div>
              <div className="inline-flex items-center gap-2 bg-purple-500/10 text-purple-600 px-3 py-2 rounded-full text-sm font-medium">
                🧠 AI Description in 30 sec
              </div>
              <div className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-600 px-3 py-2 rounded-full text-sm font-medium">
                📸 Auto-Optimized Images
              </div>
            </div>
          </div>
          
          {/* Live Sync Animation */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-large bg-card border border-border/50 p-6">
              {/* Animation Container */}
              <div className="space-y-4">
                {/* Step 1: Importing */}
                <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Importing from FARAWAYHOME.com</span>
                </div>

                {/* Step 2: AI Optimizing */}
                <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex gap-1">
                    <span className="text-sm">✏️</span>
                    <span className="text-sm">📷</span>
                  </div>
                  <span className="text-sm font-medium">Optimizing content with AI...</span>
                </div>

                {/* Step 3: Syncing */}
                <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Syncing to 4 platforms...</span>
                </div>

                {/* Step 4: Success */}
                <div className="flex items-center gap-3 p-4 bg-success/10 rounded-lg border border-success/20">
                  <span className="text-sm">✅</span>
                  <span className="text-sm font-medium text-success">Synced successfully</span>
                </div>
              </div>

              {/* Floating Status Badge */}
              <div className="absolute -top-3 -right-3 bg-card border border-border rounded-lg p-3 shadow-medium">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium">Live Sync Active</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">Last updated 6s ago</div>
              </div>

              {/* Auto-sync overlay */}
              <div className="absolute -bottom-3 -left-3 bg-primary/90 text-primary-foreground rounded-lg p-3 shadow-medium">
                <div className="text-xs font-medium">Auto-syncing listings</div>
                <div className="text-xs opacity-90">No manual posting</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EarlyAccessModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </section>;
};