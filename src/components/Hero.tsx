import { useState } from "react";
import { ArrowRight, Sparkles, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import DemoPresentation from "@/components/DemoPresentation";
import DemoTeaser from "@/components/DemoTeaser";

const Hero = () => {
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero grid-pattern">
      <div className="spotlight-glow absolute inset-0 pointer-events-none" />
      
      <div className="container mx-auto px-6 pt-24 pb-12 relative z-10">
        <div className="max-w-5xl mx-auto text-center space-y-8 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-copper/20 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-amber-glow" />
            <span className="text-sm font-medium text-foreground">New AI Features</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold leading-tight">
            <span className="text-gradient-copper">Aligno</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-light">
            Prioritize What Matters — Streamline Your Workflow and Focus on What Drives Success!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button 
              size="lg" 
              className="bg-gradient-copper hover:opacity-90 transition-smooth text-lg px-8 py-6 glow-copper"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-copper/40 hover:bg-copper/10 text-lg px-8 py-6"
              onClick={() => setIsDemoOpen(true)}
            >
              <Play className="mr-2 w-5 h-5" />
              Watch Full Demo
            </Button>
          </div>
        </div>
        
        {/* Auto-playing teaser */}
        <div className="mt-16 max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}>
          <DemoTeaser />
        </div>
      </div>

      {/* Demo Presentation Modal */}
      <DemoPresentation isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
    </section>
  );
};

export default Hero;
