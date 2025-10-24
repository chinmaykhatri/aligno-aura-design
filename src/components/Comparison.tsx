import { Check, X } from "lucide-react";

const Comparison = () => {
  const alignoFeatures = [
    "AI-Powered Task Prioritization",
    "Real-Time Collaboration",
    "Advanced Analytics Dashboard",
    "Unlimited Projects & Users",
    "Custom Workflow Automation",
    "24/7 Premium Support"
  ];

  const othersFeatures = [
    "Basic Task Management",
    "Limited Team Members",
    "Basic Reporting Only",
    "Pay Per User",
    "Manual Processes",
    "Email Support Only"
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Why Choose Aligno?
          </h2>
          <p className="text-lg text-muted-foreground">
            See how we compare to traditional project management tools
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <div className="p-8 rounded-2xl bg-card border border-copper/40 glow-copper animate-fade-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-copper flex items-center justify-center">
                <span className="text-deep-black font-bold">A</span>
              </div>
              <h3 className="text-2xl font-semibold text-gradient-copper">Aligno</h3>
            </div>
            <ul className="space-y-4">
              {alignoFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-copper mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="p-8 rounded-2xl bg-card border border-border/40 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <span className="text-muted-foreground font-bold">•••</span>
              </div>
              <h3 className="text-2xl font-semibold text-muted-foreground">Others</h3>
            </div>
            <ul className="space-y-4">
              {othersFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <X className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Comparison;
