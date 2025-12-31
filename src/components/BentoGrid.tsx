import { Eye, AlertTriangle, Lightbulb, GitBranch, BarChart3, Shield } from "lucide-react";

const BentoGrid = () => {
  const capabilities = [
    {
      icon: Eye,
      title: "Predictive Insight",
      description: "See potential delays and risks before they become problems",
      className: "md:col-span-2"
    },
    {
      icon: AlertTriangle,
      title: "Early Warning",
      description: "Get alerts when signals suggest something may slip",
      className: ""
    },
    {
      icon: Lightbulb,
      title: "Explainable Intelligence",
      description: "Understand why each insight matters—no black boxes",
      className: ""
    },
    {
      icon: GitBranch,
      title: "Scenario Simulation",
      description: "Explore outcomes before committing to decisions",
      className: "md:col-span-2"
    },
    {
      icon: BarChart3,
      title: "Portfolio Clarity",
      description: "Unified health view across all your initiatives",
      className: ""
    },
    {
      icon: Shield,
      title: "Human-in-Control",
      description: "AI recommends, you decide—always reviewable",
      className: ""
    },
  ];

  return (
    <section className="py-24 bg-charcoal/30">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Intelligence that works with you
          </h2>
          <p className="text-lg text-muted-foreground">
            Capabilities designed to surface what matters—without overwhelming you
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {capabilities.map((capability, index) => (
            <div
              key={capability.title}
              className={`p-8 rounded-2xl bg-card border border-border/40 hover:border-copper/40 transition-smooth group ${capability.className} animate-fade-up`}
              style={{ animationDelay: `${0.1 * index}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-copper flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth">
                <capability.icon className="w-6 h-6 text-deep-black" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {capability.title}
              </h3>
              <p className="text-muted-foreground">
                {capability.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BentoGrid;