import { useState } from "react";
import { motion } from "framer-motion";
import { Project } from "@/hooks/useProjects";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowRight } from "lucide-react";

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

export const ProjectCard = ({ project, onClick }: ProjectCardProps) => {
  const [isPressed, setIsPressed] = useState(false);

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
    <motion.div
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        y: -6, 
        scale: 1.02,
        boxShadow: "0 20px 40px -12px hsla(28, 85%, 58%, 0.15)",
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 25,
        opacity: { duration: 0.3 }
      }}
      className="relative p-6 rounded-2xl bg-card border border-border/40 cursor-pointer group overflow-hidden"
    >
      {/* Hover Glow Effect */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-copper/5 via-transparent to-copper/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      />
      
      {/* Shimmer Line on Hover */}
      <motion.div 
        className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-copper to-transparent opacity-0 group-hover:opacity-100"
        initial={{ x: "-100%" }}
        whileHover={{ x: "100%" }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <motion.h3 
            className="font-semibold text-foreground text-lg group-hover:text-copper transition-colors duration-300"
          >
            {project.name}
          </motion.h3>
          <Badge variant="outline" className={`${getStatusColor(project.status)} transition-all duration-300 group-hover:scale-105`}>
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
              <motion.span 
                className="text-sm font-semibold text-copper"
                initial={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
              >
                {project.progress}%
              </motion.span>
            </div>
            <div className="relative">
              <Progress value={project.progress} className="h-2" />
              <motion.div 
                className="absolute inset-0 h-2 rounded-full bg-gradient-to-r from-copper/0 via-copper/30 to-copper/0 opacity-0 group-hover:opacity-100"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {project.members?.slice(0, 3).map((member, i) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.15, zIndex: 10 }}
                >
                  <Avatar className="w-8 h-8 border-2 border-card group-hover:border-copper/40 transition-colors duration-300">
                    <AvatarFallback className="bg-gradient-copper text-deep-black text-xs font-medium">
                      {member.profiles?.full_name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
              ))}
              {(project.memberCount || 0) > 3 && (
                <motion.div 
                  className="w-8 h-8 rounded-full bg-secondary border-2 border-card flex items-center justify-center"
                  whileHover={{ scale: 1.15 }}
                >
                  <span className="text-xs font-medium text-muted-foreground">
                    +{(project.memberCount || 0) - 3}
                  </span>
                </motion.div>
              )}
            </div>

            <motion.div 
              className="flex items-center gap-2 text-xs text-muted-foreground group-hover:text-copper transition-colors duration-300"
              initial={{ x: 0 }}
              whileHover={{ x: 4 }}
            >
              <span>{project.memberCount} {project.memberCount === 1 ? 'member' : 'members'}</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
