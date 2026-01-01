import { useEffect, useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Edit, Trash2, Calendar, Users, Zap } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProjectSnapshotProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    progress: number;
    created_at: string;
    members?: Array<{ user_id: string; role: string; profiles?: { full_name: string | null } }>;
  };
  sprints?: Array<{ id: string; name: string; status: string }>;
  tasks?: Array<{ id: string; status: string }>;
  isOwner: boolean;
  onEditClick: () => void;
  onDeleteClick: () => void;
  onProgressChange: (value: number[]) => void;
  onStatusChange: (status: 'active' | 'completed' | 'archived') => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'completed':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    case 'archived':
      return 'bg-muted text-muted-foreground border-border';
    default:
      return 'bg-secondary text-secondary-foreground';
  }
};

export const ProjectSnapshot = ({
  project,
  sprints,
  tasks,
  isOwner,
  onEditClick,
  onDeleteClick,
  onProgressChange,
  onStatusChange,
}: ProjectSnapshotProps) => {
  const [scrollY, setScrollY] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        const scrollProgress = Math.max(0, -rect.top);
        setScrollY(scrollProgress);
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const activeSprint = sprints?.find(s => s.status === 'active');
  const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
  const totalTasks = tasks?.length || 0;
  const teamSize = project.members?.length || 0;

  // Parallax values
  const backgroundY = scrollY * 0.3;
  const contentY = scrollY * 0.1;
  const statsY = scrollY * 0.15;
  const opacity = Math.max(0, 1 - scrollY / 400);

  return (
    <section ref={sectionRef} className="relative overflow-hidden">
      {/* Parallax Background Layer */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-copper/5 via-transparent to-primary/5 rounded-3xl"
        style={{ 
          transform: `translateY(${backgroundY}px) scale(${1 + scrollY * 0.0005})`,
          opacity: Math.max(0.3, opacity)
        }}
      />
      
      {/* Floating Orbs for Depth */}
      <div 
        className="absolute -top-20 -right-20 w-64 h-64 bg-copper/10 rounded-full blur-3xl"
        style={{ transform: `translateY(${scrollY * 0.4}px) translateX(${-scrollY * 0.1}px)` }}
      />
      <div 
        className="absolute -bottom-20 -left-20 w-48 h-48 bg-primary/10 rounded-full blur-3xl"
        style={{ transform: `translateY(${-scrollY * 0.2}px) translateX(${scrollY * 0.1}px)` }}
      />
      
      {/* Main Snapshot Card */}
      <div 
        className="p-8 rounded-3xl bg-gradient-to-br from-card via-card to-copper/5 border border-border/40 shadow-elevated relative z-10"
        style={{ transform: `translateY(${contentY}px)` }}
      >
        {/* Header Row */}
        <div 
          className="flex items-start justify-between gap-6 mb-8"
          style={{ opacity }}
        >
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-4 flex-wrap">
              <h1 className="text-4xl font-bold text-foreground tracking-tight">{project.name}</h1>
              <Badge variant="outline" className={`${getStatusColor(project.status)} px-4 py-1.5 text-sm font-medium`}>
                {project.status}
              </Badge>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl">
              {project.description || "No description provided"}
            </p>
          </div>
          
          {isOwner && (
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="icon" onClick={onEditClick} className="border-border/60 hover:border-copper/40 hover:bg-copper/10">
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={onDeleteClick} className="border-border/60 hover:border-destructive/40 hover:bg-destructive/10">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Quick Stats Row */}
        <div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          style={{ transform: `translateY(${statsY}px)` }}
        >
          <div className="p-4 rounded-2xl bg-secondary/30 border border-border/30">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Zap className="w-4 h-4 text-copper" />
              Progress
            </div>
            <p className="text-2xl font-bold text-foreground">{project.progress}%</p>
          </div>
          <div className="p-4 rounded-2xl bg-secondary/30 border border-border/30">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Calendar className="w-4 h-4 text-copper" />
              Active Sprint
            </div>
            <p className="text-lg font-semibold text-foreground truncate">
              {activeSprint?.name || "None"}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-secondary/30 border border-border/30">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Users className="w-4 h-4 text-copper" />
              Team
            </div>
            <p className="text-2xl font-bold text-foreground">{teamSize}</p>
          </div>
          <div className="p-4 rounded-2xl bg-secondary/30 border border-border/30">
            <div className="text-muted-foreground text-sm mb-1">Tasks Done</div>
            <p className="text-2xl font-bold text-foreground">
              {completedTasks}<span className="text-muted-foreground text-lg font-normal">/{totalTasks}</span>
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Overall Progress</span>
            <span className="text-sm font-medium text-copper">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-3" />
          
          {isOwner && (
            <div className="pt-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex-1 w-full">
                <label className="text-xs text-muted-foreground mb-2 block">Adjust Progress</label>
                <Slider
                  value={[project.progress]}
                  onValueChange={onProgressChange}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
              <div className="w-full sm:w-48">
                <label className="text-xs text-muted-foreground mb-2 block">Status</label>
                <Select value={project.status} onValueChange={onStatusChange}>
                  <SelectTrigger className="bg-secondary/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
