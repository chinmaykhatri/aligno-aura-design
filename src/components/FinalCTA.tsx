import { Button } from "@/components/ui/button";
import { ArrowRight, Eye, Brain } from "lucide-react";

const FinalCTA = () => {
  return (
    <section className="py-32 bg-gradient-hero relative overflow-hidden">
      <div className="spotlight-glow absolute inset-0 pointer-events-none" />
      <div className="absolute inset-0 grid-pattern opacity-30" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="flex justify-center gap-4 py-4">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="w-12 h-12 rounded-xl bg-secondary/50 border border-copper/20 flex items-center justify-center">
                <Eye className="w-6 h-6 text-copper" />
              </div>
              <span className="text-xs">Foresight</span>
            </div>
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="w-12 h-12 rounded-xl bg-secondary/50 border border-copper/20 flex items-center justify-center">
                <Brain className="w-6 h-6 text-copper" />
              </div>
              <span className="text-xs">Intelligence</span>
            </div>
          </div>
          
          <div className="p-12 rounded-3xl bg-card/60 backdrop-blur-sm border border-copper/30 glow-copper space-y-6 animate-fade-up">
            <h3 className="text-4xl md:text-5xl font-bold text-foreground">
              Understand your work better
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See what's about to go wrong. Know why it matters. Decide what to do next.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                className="bg-gradient-copper hover:opacity-90 transition-smooth text-lg px-10 py-7 text-deep-black font-semibold glow-copper"
              >
                See How Aligno Thinks
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-copper/40 hover:bg-copper/10 text-lg px-10 py-7"
              >
                Watch the Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;