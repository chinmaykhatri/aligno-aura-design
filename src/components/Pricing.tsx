import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const Pricing = () => {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "/month",
      description: "Perfect for trying out Aligno",
      features: [
        "Up to 3 projects",
        "5 team members",
        "Basic task management",
        "Mobile app access",
        "Community support"
      ],
      cta: "Get Started",
      variant: "outline" as const,
      popular: false
    },
    {
      name: "Pro",
      price: "$12",
      period: "/month",
      description: "For teams ready to scale",
      features: [
        "Unlimited projects",
        "Unlimited team members",
        "AI-powered features",
        "Advanced analytics",
        "Custom workflows",
        "Priority support",
        "API access"
      ],
      cta: "Start Pro Trial",
      variant: "default" as const,
      popular: true
    }
  ];

  return (
    <section className="py-24 bg-gradient-amber relative overflow-hidden" id="pricing">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            Choose the plan that fits your team's needs
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`p-8 rounded-2xl bg-card/80 backdrop-blur-sm border transition-smooth animate-fade-up ${
                plan.popular 
                  ? 'border-copper/60 glow-copper' 
                  : 'border-border/40 hover:border-copper/30'
              }`}
              style={{ animationDelay: `${0.1 * index}s` }}
            >
              {plan.popular && (
                <div className="inline-block px-3 py-1 rounded-full bg-gradient-copper text-deep-black text-xs font-semibold mb-4">
                  Most Popular
                </div>
              )}
              
              <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
              <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>
              
              <div className="mb-6">
                <span className="text-5xl font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              
              <Button 
                className={`w-full mb-8 ${
                  plan.variant === 'default' 
                    ? 'bg-gradient-copper hover:opacity-90 text-deep-black font-semibold' 
                    : ''
                }`}
                variant={plan.variant}
                size="lg"
              >
                {plan.cta}
              </Button>
              
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-copper mt-0.5 flex-shrink-0" />
                    <span className="text-foreground text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
