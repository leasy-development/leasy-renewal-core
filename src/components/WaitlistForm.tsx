import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowRight, Mail, Users, Star } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const WaitlistForm = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Welcome to the waitlist!",
        description: "We'll notify you as soon as beta access is available.",
      });
      setEmail("");
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-card border-border/50 shadow-large overflow-hidden">
            <CardHeader className="text-center pb-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4 mx-auto">
                <Star className="h-4 w-4" />
                Limited Beta Access
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Be among the first to experience{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Leasy Beta
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join our exclusive waitlist and get early access to the future of property listing management.
                Help us shape the product with your feedback.
              </p>
            </CardHeader>
            
            <CardContent className="px-8 pb-8">
              <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-8">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="flex-1"
                    required
                  />
                  <Button 
                    type="submit" 
                    variant="hero" 
                    disabled={isSubmitting}
                    className="group"
                  >
                    {isSubmitting ? (
                      "Joining..."
                    ) : (
                      <>
                        Join Waitlist
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </div>
              </form>

              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Early Access</h3>
                  <p className="text-sm text-muted-foreground">
                    Be first to test new features before public release
                  </p>
                </div>
                
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Star className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Shape the Product</h3>
                  <p className="text-sm text-muted-foreground">
                    Your feedback directly influences our development roadmap
                  </p>
                </div>
                
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Exclusive Updates</h3>
                  <p className="text-sm text-muted-foreground">
                    Get insider news and beta feature announcements
                  </p>
                </div>
              </div>

              <div className="text-center mt-8 text-sm text-muted-foreground">
                <p>
                  Join <span className="font-semibold text-primary">2,847+</span> property professionals already on the waitlist
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};