import { Button } from "@/components/ui/button";
import { Menu, X, User } from "lucide-react";
import { useState } from "react";
import { EarlyAccessModal } from "@/components/EarlyAccessModal";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleUserClick = () => {
    navigate("/dashboard");
  };
  return <header className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-border z-50">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">L</span>
              </div>
              <span className="text-xl font-bold text-foreground">Leasy</span>
            </div>
            <div className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
              BETA
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-primary transition-colors">
              How it Works
            </a>
            
            <a href="#faq" className="text-muted-foreground hover:text-primary transition-colors">
              FAQ
            </a>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <Button 
                variant="ghost" 
                className="flex items-center space-x-2"
                onClick={handleUserClick}
              >
                <User className="h-4 w-4" />
                <span>{user.email?.split('@')[0]}</span>
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setIsAuthModalOpen(true)}>Sign In</Button>
                <Button 
                  variant="hero" 
                  size="lg"
                  onClick={() => setIsModalOpen(true)}
                >
                  Join Waitlist
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && <div className="md:hidden absolute top-16 left-0 w-full bg-background border-b border-border shadow-medium">
            <nav className="flex flex-col space-y-4 p-4">
              <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-primary transition-colors">
                How it Works
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">
                Pricing
              </a>
              <a href="#faq" className="text-muted-foreground hover:text-primary transition-colors">
                FAQ
              </a>
              <div className="flex flex-col space-y-2 pt-4 border-t border-border">
                {user ? (
                  <Button 
                    variant="ghost" 
                    className="justify-start"
                    onClick={handleUserClick}
                  >
                    <User className="h-4 w-4 mr-2" />
                    {user.email?.split('@')[0]}
                  </Button>
                ) : (
                  <>
                    <Button variant="ghost" onClick={() => setIsAuthModalOpen(true)}>Sign In</Button>
                    <Button 
                      variant="hero"
                      onClick={() => setIsModalOpen(true)}
                    >
                      Join Waitlist
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>}
      </div>

      <EarlyAccessModal open={isModalOpen} onOpenChange={setIsModalOpen} />
      <AuthModal open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
    </header>;
};