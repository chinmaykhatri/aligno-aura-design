import { Button } from "@/components/ui/button";
import { Monitor, Smartphone, Tablet } from "lucide-react";

const FinalCTA = () => {
  return (
    <section className="py-32 bg-gradient-hero relative overflow-hidden">
      <div className="spotlight-glow absolute inset-0 pointer-events-none" />
      <div className="absolute inset-0 grid-pattern opacity-30" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <p className="text-sm text-copper uppercase tracking-wider font-semibold">
            Aligno is now available for all platforms
          </p>
          <h2 className="text-3xl md:text-4xl text-muted-foreground">
            Download now to experience seamless work
          </h2>
          
          <div className="flex justify-center gap-6 py-6">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Monitor className="w-8 h-8" />
              <span className="text-xs">Desktop</span>
            </div>
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Tablet className="w-8 h-8" />
              <span className="text-xs">Tablet</span>
            </div>
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Smartphone className="w-8 h-8" />
              <span className="text-xs">Mobile</span>
            </div>
          </div>
          
          <div className="p-12 rounded-3xl bg-card/60 backdrop-blur-sm border border-copper/30 glow-copper space-y-6 animate-fade-up">
            <h3 className="text-4xl md:text-5xl font-bold text-foreground">
              Ready to manage your team like a pro?
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of successful teams who've transformed their workflow
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-copper hover:opacity-90 transition-smooth text-lg px-12 py-7 text-deep-black font-semibold glow-copper"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
