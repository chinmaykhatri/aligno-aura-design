import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Navigation = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/60 border-b border-border/40">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-copper flex items-center justify-center">
            <span className="text-deep-black font-bold text-lg">A</span>
          </div>
          <span className="text-xl font-semibold text-gradient-copper">Aligno</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-muted-foreground hover:text-copper transition-smooth">
            Features
          </a>
          <a href="#testimonials" className="text-sm text-muted-foreground hover:text-copper transition-smooth">
            Testimonials
          </a>
          <a href="#why" className="text-sm text-muted-foreground hover:text-copper transition-smooth">
            Why Aligno?
          </a>
          <a href="#pricing" className="text-sm text-muted-foreground hover:text-copper transition-smooth">
            Pricing
          </a>
        </div>
        
        <Link to="/auth">
          <Button variant="default" className="bg-gradient-copper hover:opacity-90 transition-smooth">
            Get Started
          </Button>
        </Link>
      </div>
    </nav>
  );
};

export default Navigation;
