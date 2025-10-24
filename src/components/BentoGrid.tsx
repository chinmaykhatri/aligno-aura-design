import { Calendar, Clock, MessageSquare, Users, Zap, Target } from "lucide-react";

const BentoGrid = () => {
  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Optimized performance for seamless workflow",
      className: "md:col-span-2"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Real-time updates across your team",
      className: ""
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "AI-powered task prioritization",
      className: ""
    },
    {
      icon: Target,
      title: "Goal Tracking",
      description: "Monitor progress with precision",
      className: "md:col-span-2"
    },
    {
      icon: MessageSquare,
      title: "Instant Communication",
      description: "Built-in chat and notifications",
      className: ""
    },
    {
      icon: Clock,
      title: "Time Management",
      description: "Track time and boost productivity",
      className: ""
    },
  ];

  return (
    <section className="py-24 bg-charcoal/30">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Everything You Need in One Place
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful features designed to streamline your workflow
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`p-8 rounded-2xl bg-card border border-border/40 hover:border-copper/40 transition-smooth group ${feature.className} animate-fade-up`}
              style={{ animationDelay: `${0.1 * index}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-copper flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth">
                <feature.icon className="w-6 h-6 text-deep-black" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BentoGrid;
