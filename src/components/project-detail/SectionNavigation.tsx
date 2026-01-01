import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Play, 
  Activity, 
  TrendingUp, 
  Sparkles, 
  History, 
  Users 
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Section {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const sections: Section[] = [
  { id: 'snapshot', label: 'Project Snapshot', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'execution', label: 'Execution Zone', icon: <Play className="w-4 h-4" /> },
  { id: 'insights', label: 'Insights & Health', icon: <Activity className="w-4 h-4" /> },
  { id: 'prediction', label: 'Prediction', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'ai-actions', label: 'AI Actions', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
  { id: 'team', label: 'Team & Settings', icon: <Users className="w-4 h-4" /> },
];

interface SectionNavigationProps {
  showThreshold?: number;
}

export const SectionNavigation = ({ showThreshold = 200 }: SectionNavigationProps) => {
  const [activeSection, setActiveSection] = useState<string>('snapshot');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > showThreshold);

      // Find which section is currently in view
      const sectionElements = sections.map(s => ({
        id: s.id,
        element: document.getElementById(`section-${s.id}`),
      })).filter(s => s.element);

      const viewportHeight = window.innerHeight;
      const viewportCenter = viewportHeight / 3;

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const { id, element } = sectionElements[i];
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= viewportCenter) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showThreshold]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      const offset = 120; // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth',
      });
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <nav
        className={`fixed right-4 top-1/2 -translate-y-1/2 z-50 transition-all duration-300 ${
          isVisible 
            ? 'translate-x-0 opacity-100' 
            : 'translate-x-12 opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-card/90 backdrop-blur-xl border border-border/40 rounded-2xl p-2 shadow-elevated">
          <div className="flex flex-col gap-1">
            {sections.map((section) => (
              <Tooltip key={section.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => scrollToSection(section.id)}
                    className={cn(
                      "relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
                      activeSection === section.id
                        ? "bg-copper/20 text-copper"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    {section.icon}
                    {activeSection === section.id && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-copper rounded-full" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="bg-popover text-popover-foreground">
                  {section.label}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      </nav>
    </TooltipProvider>
  );
};
