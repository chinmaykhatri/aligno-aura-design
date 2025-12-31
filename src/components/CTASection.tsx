import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-32 bg-gradient-amber relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-up">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
            Stop chasing status updates. Start seeing what matters.
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Aligno turns complex work signals into clear, actionable insight—so you can act early, not react late.
          </p>
          <Button 
            size="lg" 
            className="bg-gradient-copper hover:opacity-90 transition-smooth text-lg px-10 py-7 glow-copper text-deep-black font-semibold"
          >
            See How Aligno Thinks
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;