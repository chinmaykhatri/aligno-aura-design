import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Rachel Kim",
      role: "Engineering Lead, SaaS Team",
      content: "We stopped discovering problems at the deadline. Aligno helped us see risk early and adjust before it became expensive.",
      avatar: "RK",
    },
    {
      name: "Marcus Chen",
      role: "Product Manager",
      content: "Instead of asking for status updates, I finally had one place that told me what mattered and why.",
      avatar: "MC",
    },
    {
      name: "David Okonkwo",
      role: "Startup Founder",
      content: "The real value wasn't tracking work—it was understanding which decision would change the outcome.",
      avatar: "DO",
    },
    {
      name: "Sarah Mitchell",
      role: "Delivery Manager",
      content: "Aligno didn't overwhelm us with dashboards. It gave us one clear insight and let us explore deeper only when needed.",
      avatar: "SM",
    },
    {
      name: "James Torres",
      role: "VP of Engineering",
      content: "We moved from reactive firefighting to proactive planning. The difference in team confidence alone was worth it.",
      avatar: "JT",
    },
  ];

  return (
    <section className="py-24 bg-charcoal/30" id="testimonials">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Teams that understand their work differently
          </h2>
          <p className="text-lg text-muted-foreground">
            Leaders share how early insight changed their outcomes
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className={`p-8 rounded-2xl bg-card border border-border/40 hover:border-copper/30 transition-smooth space-y-6 animate-fade-up ${
                index === 4 ? "lg:col-span-1 md:col-span-2 lg:col-start-2" : ""
              }`}
              style={{ animationDelay: `${0.1 * index}s` }}
            >
              <p className="text-foreground leading-relaxed text-lg">
                "{testimonial.content}"
              </p>
              
              <div className="flex items-center gap-3 pt-2">
                <Avatar className="w-10 h-10 border border-copper/40">
                  <AvatarFallback className="bg-gradient-copper text-deep-black font-medium text-sm">
                    {testimonial.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{testimonial.name}</h3>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;