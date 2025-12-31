import { ArrowRight } from "lucide-react";

const Comparison = () => {
  const contrasts = [
    {
      traditional: "Tools that track what happened",
      aligno: "Intelligence that predicts what's likely to happen next",
    },
    {
      traditional: "Dashboards full of charts and metrics",
      aligno: "A single insight summary that explains what matters",
    },
    {
      traditional: "Reactive updates after problems surface",
      aligno: "Proactive alerts before deadlines slip",
    },
    {
      traditional: "Guesswork and gut-feeling decisions",
      aligno: "Scenario simulation with projected outcomes",
    },
    {
      traditional: "Black-box AI that automates without explanation",
      aligno: "Explainable intelligence you can review and override",
    },
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Why Aligno is fundamentally different
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Most platforms tell you what already happened. Aligno helps you understand what's likely to happen next—and what to do now.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto space-y-4">
          {contrasts.map((contrast, index) => (
            <div
              key={index}
              className="flex flex-col md:flex-row items-stretch gap-4 animate-fade-up"
              style={{ animationDelay: `${0.1 * index}s` }}
            >
              <div className="flex-1 p-6 rounded-xl bg-muted/30 border border-border/40">
                <p className="text-muted-foreground">
                  {contrast.traditional}
                </p>
              </div>
              
              <div className="flex items-center justify-center px-4">
                <ArrowRight className="w-5 h-5 text-copper rotate-90 md:rotate-0" />
              </div>
              
              <div className="flex-1 p-6 rounded-xl bg-card border border-copper/30 glow-copper">
                <p className="text-foreground font-medium">
                  {contrast.aligno}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Comparison;