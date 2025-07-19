import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface EarlyAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EarlyAccessModal = ({ open, onOpenChange }: EarlyAccessModalProps) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    company: "",
    listings: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log("Submitting waitlist form:", formData);

      // Call the edge function to send email notification and store in database
      const { error } = await supabase.functions.invoke('send-waitlist-notification', {
        body: {
          full_name: formData.fullName,
          email: formData.email,
          company: formData.company,
          listings_count: formData.listings,
          source: "Leasy Beta Waitlist"
        }
      });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Failed to submit waitlist form");
      }

      console.log("Waitlist submission successful");
      setIsSubmitting(false);
      setIsSuccess(true);
      
      toast({
        title: "🎉 Welcome to the waitlist!",
        description: "We'll notify you as soon as your beta invite is ready. Email notification sent to Luca!",
      });

      // Reset form after 3 seconds and close modal
      setTimeout(() => {
        setIsSuccess(false);
        setFormData({ fullName: "", email: "", company: "", listings: "" });
        onOpenChange(false);
      }, 3000);

    } catch (error: any) {
      console.error("Error submitting waitlist form:", error);
      setIsSubmitting(false);
      toast({
        title: "Submission Error",
        description: error.message || "Failed to submit form. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isFormValid = formData.fullName && formData.email && formData.company && formData.listings;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border border-border/50 shadow-elegant">
        <DialogHeader className="text-center space-y-3">
          <DialogTitle className="text-2xl font-bold text-foreground">
            Be the first to sync smarter.
          </DialogTitle>
          <p className="text-muted-foreground">
            Join the waitlist for exclusive beta access to Leasy.
          </p>
        </DialogHeader>

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  className="mt-1 bg-background border-border/50 focus:border-primary"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Work Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="mt-1 bg-background border-border/50 focus:border-primary"
                  placeholder="Enter your work email"
                  required
                />
              </div>

              <div>
                <Label htmlFor="company" className="text-sm font-medium text-foreground">
                  Company Name
                </Label>
                <Input
                  id="company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                  className="mt-1 bg-background border-border/50 focus:border-primary"
                  placeholder="Enter your company name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="listings" className="text-sm font-medium text-foreground">
                  Approx. number of listings
                </Label>
                <Select onValueChange={(value) => handleInputChange("listings", value)} required>
                  <SelectTrigger className="mt-1 bg-background border-border/50 focus:border-primary">
                    <SelectValue placeholder="Select number of listings" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border/50 shadow-medium z-50">
                    <SelectItem value="1-10">1–10</SelectItem>
                    <SelectItem value="10-50">10–50</SelectItem>
                    <SelectItem value="50-200">50–200</SelectItem>
                    <SelectItem value="200+">200+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:opacity-90 text-white"
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Request Early Access"
              )}
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              We'll notify you as soon as your beta invite is ready. No spam, no commitments.
            </p>
          </form>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              You're on the list!
            </h3>
            <p className="text-muted-foreground">
              Thank you for joining our beta waitlist. We'll be in touch soon with your early access invitation.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};