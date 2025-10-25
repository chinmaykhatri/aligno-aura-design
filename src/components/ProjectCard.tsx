import { Project } from "@/hooks/useProjects";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

export const ProjectCard = ({ project, onClick }: ProjectCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'completed':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'archived':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div
      onClick={onClick}
      className="p-6 rounded-2xl bg-card border border-border/40 hover:border-copper/30 transition-smooth cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-foreground text-lg group-hover:text-copper transition-smooth">
          {project.name}
        </h3>
        <Badge variant="outline" className={getStatusColor(project.status)}>
          {project.status}
        </Badge>
      </div>

      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
        {project.description || "No description"}
      </p>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Progress</span>
            <span className="text-sm font-semibold text-copper">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {project.members?.slice(0, 3).map((member, i) => (
              <Avatar key={member.id} className="w-8 h-8 border border-copper/40">
                <AvatarFallback className="bg-gradient-copper text-deep-black text-xs font-medium">
                  {member.profiles?.full_name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            ))}
            {(project.memberCount || 0) > 3 && (
              <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center">
                <span className="text-xs font-medium text-muted-foreground">
                  +{(project.memberCount || 0) - 3}
                </span>
              </div>
            )}
          </div>

          <span className="text-xs text-muted-foreground">
            {project.memberCount} {project.memberCount === 1 ? 'member' : 'members'}
          </span>
        </div>
      </div>
    </div>
  );
};
