import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const ProjectManagement = () => {
  const projects = [
    { name: "Website Redesign", progress: 85, team: ["JD", "SM", "AL"] },
    { name: "Mobile App Launch", progress: 60, team: ["RK", "MN"] },
    { name: "Marketing Campaign", progress: 92, team: ["TC", "BW", "LH"] },
    { name: "Backend Migration", progress: 45, team: ["PR", "FS"] },
  ];

  return (
    <section className="py-24 bg-background" id="features">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6 animate-fade-up">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              Faster, Smarter Project Management
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Experience real-time collaboration with detailed task visibility. 
              Track progress, assign responsibilities, and ensure every team member 
              stays aligned with your project goals.
            </p>
          </div>
          
          <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {projects.map((project, index) => (
              <div 
                key={project.name}
                className="p-5 rounded-2xl bg-card border border-border/40 hover:border-copper/30 transition-smooth"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-foreground">{project.name}</h3>
                  <span className="text-sm text-copper font-semibold">{project.progress}%</span>
                </div>
                <Progress 
                  value={project.progress} 
                  className="h-2 mb-3 bg-secondary"
                />
                <div className="flex items-center gap-2">
                  {project.team.map((member, i) => (
                    <Avatar key={i} className="w-7 h-7 border border-copper/40">
                      <AvatarFallback className="bg-gradient-copper text-deep-black text-xs font-medium">
                        {member}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProjectManagement;
