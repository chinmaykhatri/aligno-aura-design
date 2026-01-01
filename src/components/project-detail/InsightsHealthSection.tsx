import { useState } from "react";
import { ChevronDown, Activity, Shield, AlertTriangle, Heart } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ProjectHealthScore from "@/components/ProjectHealthScore";
import VisualRiskRadarChart from "@/components/VisualRiskRadarChart";
import AutomaticRiskRegister from "@/components/AutomaticRiskRegister";
import TeamMoodScanner from "@/components/TeamMoodScanner";
import RiskRadar from "@/components/RiskRadar";
import { cn } from "@/lib/utils";

interface InsightsHealthSectionProps {
  projectId: string;
  tasks: Array<any>;
  sprints: Array<any>;
}

interface AccordionItemProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  accentColor?: string;
}

const AccordionItem = ({ title, icon, children, defaultOpen = false, accentColor = "copper" }: AccordionItemProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className={cn(
          "flex items-center justify-between p-4 rounded-2xl transition-all duration-300",
          "bg-secondary/30 border border-border/40 hover:border-copper/30 hover:bg-secondary/50",
          isOpen && "rounded-b-none border-b-0"
        )}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-${accentColor}/20`}>
              {icon}
            </div>
            <span className="font-medium text-foreground">{title}</span>
          </div>
          <ChevronDown className={cn(
            "w-5 h-5 text-muted-foreground transition-transform duration-300",
            isOpen && "rotate-180"
          )} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-4 pt-0 rounded-b-2xl bg-secondary/30 border border-t-0 border-border/40 animate-fade-in">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export const InsightsHealthSection = ({ projectId, tasks, sprints }: InsightsHealthSectionProps) => {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-1 w-8 rounded-full bg-emerald-500" />
        <h2 className="text-xl font-semibold text-foreground">Insights & Health</h2>
        <span className="text-xs text-muted-foreground px-2 py-1 rounded-full bg-secondary/50">Expand to explore</span>
      </div>

      <div className="space-y-3">
        <AccordionItem 
          title="Project Health Score" 
          icon={<Activity className="w-4 h-4 text-emerald-400" />}
          defaultOpen={true}
        >
          <div className="pt-4">
            <ProjectHealthScore projectId={projectId} tasks={tasks} sprints={sprints} />
          </div>
        </AccordionItem>

        <AccordionItem 
          title="Visual Risk Radar" 
          icon={<Shield className="w-4 h-4 text-amber-400" />}
        >
          <div className="pt-4">
            <VisualRiskRadarChart projectId={projectId} tasks={tasks} sprints={sprints} />
          </div>
        </AccordionItem>

        <AccordionItem 
          title="Risk Register" 
          icon={<AlertTriangle className="w-4 h-4 text-orange-400" />}
        >
          <div className="pt-4 space-y-4">
            <AutomaticRiskRegister projectId={projectId} tasks={tasks} />
            <RiskRadar projectId={projectId} />
          </div>
        </AccordionItem>

        <AccordionItem 
          title="Team Mood" 
          icon={<Heart className="w-4 h-4 text-pink-400" />}
        >
          <div className="pt-4">
            <TeamMoodScanner projectId={projectId} />
          </div>
        </AccordionItem>
      </div>
    </section>
  );
};
