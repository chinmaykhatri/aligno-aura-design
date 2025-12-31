import { Eye, Brain, Compass, Shield, Users } from "lucide-react";

const FeatureSummary = () => {
  const capabilities = [
    {
      icon: Eye,
      title: "Detect risk before deadlines slip",
      description: "Identify potential delays and bottlenecks days or weeks ahead, when there's still time to act.",
    },
    {
      icon: Brain,
      title: "Connect signals into clarity",
      description: "Health, capacity, sentiment, and execution data come together as one understandable insight.",
    },
    {
      icon: Compass,
      title: "Simulate outcomes safely",
      description: "Explore what happens if you add capacity, shift scope, or change priorities—before committing.",
    },
    {
      icon: Shield,
      title: "Support decisions, not enforce automation",
      description: "AI recommends. Humans decide. Every action is reviewable and reversible.",
    },
    {
      icon: Users,
      title: "Keep everyone aligned",
      description: "From individual contributors to executives, each role sees what matters to them—nothing more, nothing less.",
    },
  ];

  return (
    <section className="py-24 bg-gradient-amber relative overflow-hidden" id="why">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Teams don't need more tools
          </h2>
          <p className="text-xl text-muted-foreground">
            They need better understanding
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {capabilities.map((capability, index) => (
            <div 
              key={capability.title}
              className={`p-8 rounded-2xl bg-card/80 backdrop-blur-sm border border-copper/20 hover:border-copper/40 transition-smooth animate-fade-up ${
                index === 4 ? "lg:col-start-2" : ""
              }`}
              style={{ animationDelay: `${0.1 * index}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-copper flex items-center justify-center mb-5">
                <capability.icon className="w-6 h-6 text-deep-black" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {capability.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {capability.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSummary;