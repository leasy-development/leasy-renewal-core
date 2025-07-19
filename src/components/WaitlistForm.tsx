import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowRight, Mail, Users, Star } from "lucide-react";
import { EarlyAccessModal } from "@/components/EarlyAccessModal";
export const WaitlistForm = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return <section className="section-spacing bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-card border-border/50 shadow-elegant overflow-hidden">
            <CardHeader className="text-center pb-12">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 mx-auto">
                <Star className="h-4 w-4" />
                Limited Beta Access
              </div>
              <h2 className="text-display text-foreground element-spacing">
                Be among the first to experience{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Leasy Beta
                </span>
              </h2>
              <p className="text-subtitle text-muted-foreground content-width-wide mx-auto">
                Join our exclusive waitlist and get early access to the future of property listing management.
                Help us shape the product with your feedback.
              </p>
            </CardHeader>
            
            <CardContent className="px-8 pb-12">
              <div className="text-center element-spacing">
                <Button 
                  variant="hero" 
                  size="lg"
                  onClick={() => setIsModalOpen(true)}
                  className="group shadow-large hover:shadow-elegant transition-all duration-300"
                >
                  Join Beta Waitlist
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>

              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-background/50 hover:bg-background/80 transition-colors duration-300">
                  <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-title text-foreground">Early Access</h3>
                  <p className="text-sm text-muted-foreground content-width">
                    Be first to test new features before public release
                  </p>
                </div>
                
                <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-background/50 hover:bg-background/80 transition-colors duration-300">
                  <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Star className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-title text-foreground">Shape the Product</h3>
                  <p className="text-sm text-muted-foreground content-width">
                    Your feedback directly influences our development roadmap
                  </p>
                </div>
                
                <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-background/50 hover:bg-background/80 transition-colors duration-300">
                  <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-title text-foreground">Exclusive Updates</h3>
                  <p className="text-sm text-muted-foreground content-width">
                    Get insider news and beta feature announcements
                  </p>
                </div>
              </div>

              <div className="text-center mt-8 text-sm text-muted-foreground">
                
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <EarlyAccessModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </section>;
};