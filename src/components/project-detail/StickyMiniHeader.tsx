import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface StickyMiniHeaderProps {
  projectName: string;
  projectStatus: string;
  progress: number;
  showThreshold?: number;
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

export const StickyMiniHeader = ({
  projectName,
  projectStatus,
  progress,
  showThreshold = 300,
}: StickyMiniHeaderProps) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > showThreshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showThreshold]);

  return (
    <div
      className={`fixed top-16 left-0 right-0 z-40 transition-all duration-300 ${
        isVisible 
          ? 'translate-y-0 opacity-100' 
          : '-translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <div className="bg-background/80 backdrop-blur-xl border-b border-border/40 shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Back + Project Info */}
            <div className="flex items-center gap-4 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/projects")}
                className="shrink-0 hover:bg-secondary/50"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex items-center gap-3 min-w-0">
                <h2 className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-[300px]">
                  {projectName}
                </h2>
                <Badge 
                  variant="outline" 
                  className={`${getStatusColor(projectStatus)} shrink-0 text-xs`}
                >
                  {projectStatus}
                </Badge>
              </div>
            </div>

            {/* Right: Progress */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Progress</span>
                <div className="w-24">
                  <Progress value={progress} className="h-1.5" />
                </div>
              </div>
              <span className="text-sm font-medium text-copper">{progress}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
