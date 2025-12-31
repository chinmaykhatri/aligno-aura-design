import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, Clock, TrendingUp } from "lucide-react";

const ProjectManagement = () => {
  const insights = [
    { 
      name: "Website Redesign", 
      health: 85, 
      status: "on-track",
      insight: "On track for Friday delivery",
      icon: CheckCircle 
    },
    { 
      name: "Mobile App Launch", 
      health: 60, 
      status: "at-risk",
      insight: "2 tasks blocked by API dependency",
      icon: AlertTriangle 
    },
    { 
      name: "Marketing Campaign", 
      health: 92, 
      status: "ahead",
      insight: "Ahead of schedule by 3 days",
      icon: TrendingUp 
    },
    { 
      name: "Backend Migration", 
      health: 45, 
      status: "delayed",
      insight: "Capacity gap detected—reassignment suggested",
      icon: Clock 
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on-track": return "text-emerald-500";
      case "ahead": return "text-copper";
      case "at-risk": return "text-amber-500";
      case "delayed": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case "on-track": return "bg-emerald-500";
      case "ahead": return "bg-copper";
      case "at-risk": return "bg-amber-500";
      case "delayed": return "bg-destructive";
      default: return "bg-muted-foreground";
    }
  };

  return (
    <section className="py-24 bg-background" id="features">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6 animate-fade-up">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              See health at a glance. Understand risk in context.
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Each project shows one clear insight—not a wall of metrics. 
              Know what needs attention now, why it matters, and what you can do about it.
            </p>
          </div>
          
          <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {insights.map((project, index) => (
              <div 
                key={project.name}
                className="p-5 rounded-2xl bg-card border border-border/40 hover:border-copper/30 transition-smooth"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <project.icon className={`w-5 h-5 ${getStatusColor(project.status)}`} />
                    <h3 className="font-medium text-foreground">{project.name}</h3>
                  </div>
                  <span className={`text-sm font-semibold ${getStatusColor(project.status)}`}>
                    {project.health}%
                  </span>
                </div>
                <div className="h-1.5 mb-3 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${getProgressColor(project.status)}`}
                    style={{ width: `${project.health}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {project.insight}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProjectManagement;