import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Product Manager at TechFlow",
      content: "Aligno transformed how our team works. We're 40% more productive and finally have visibility into every project. The AI features are game-changing!",
      avatar: "SC",
      engagement: { likes: 234, comments: 45 }
    },
    {
      name: "Michael Rodriguez",
      role: "Engineering Lead at DataWave",
      content: "The best project management tool we've used. Clean interface, powerful features, and the automation saves us hours every week.",
      avatar: "MR",
      engagement: { likes: 189, comments: 32 }
    },
    {
      name: "Emily Thompson",
      role: "Creative Director at InnovateX",
      content: "Finally, a tool that doesn't get in the way. Aligno's intuitive design means our team actually uses it. Highly recommended!",
      avatar: "ET",
      engagement: { likes: 312, comments: 67 }
    },
    {
      name: "David Park",
      role: "Startup Founder",
      content: "As a small team, we needed something powerful but affordable. Aligno delivers enterprise features at a fraction of the cost.",
      avatar: "DP",
      engagement: { likes: 156, comments: 28 }
    },
    {
      name: "Lisa Martinez",
      role: "Operations Manager at CloudSync",
      content: "The real-time collaboration features are incredible. We're coordinating across 3 time zones effortlessly now.",
      avatar: "LM",
      engagement: { likes: 278, comments: 52 }
    },
    {
      name: "James Wilson",
      role: "Marketing Director at NexGen",
      content: "Aligno's analytics gave us insights we never had before. We've optimized our workflows and doubled our output.",
      avatar: "JW",
      engagement: { likes: 201, comments: 38 }
    }
  ];

  return (
    <section className="py-24 bg-charcoal/30" id="testimonials">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            People Can't Stop Talking About Us
          </h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of teams transforming their workflow
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="p-6 rounded-2xl bg-card border border-border/40 hover:border-copper/30 transition-smooth space-y-4 animate-fade-up"
              style={{ animationDelay: `${0.1 * index}s` }}
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border border-copper/40">
                  <AvatarFallback className="bg-gradient-copper text-deep-black font-medium">
                    {testimonial.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-foreground text-sm">{testimonial.name}</h4>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                "{testimonial.content}"
              </p>
              
              <div className="flex items-center gap-4 pt-2 text-muted-foreground">
                <div className="flex items-center gap-1.5 text-xs">
                  <Heart className="w-3.5 h-3.5" />
                  <span>{testimonial.engagement.likes}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{testimonial.engagement.comments}</span>
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
