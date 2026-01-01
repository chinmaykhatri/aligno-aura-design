import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Bot, Wand2, Calendar, UserCheck, Lightbulb, Cpu } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import GoalDrivenAgent from "@/components/GoalDrivenAgent";
import SelfHealingSchedule from "@/components/SelfHealingSchedule";
import AISprintAutoPlanner from "@/components/AISprintAutoPlanner";
import SkillAwareAssignment from "@/components/SkillAwareAssignment";
import { AITaskSuggestions } from "@/components/AITaskSuggestions";
import SmartScheduling from "@/components/SmartScheduling";
import { AIPredictiveInsights } from "@/components/AIPredictiveInsights";
import { cn } from "@/lib/utils";

interface TeamMember {
  user_id: string;
  full_name: string | null;
  role: string;
}

interface AIActionsSectionProps {
  projectId: string;
  projectName: string;
  project: any;
  tasks: Array<any>;
  goals: Array<any>;
  teamMembers: TeamMember[];
  currentSprintId?: string;
}

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  accentColor?: string;
}

const ActionCard = ({ title, description, icon, children, accentColor = "copper" }: ActionCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className={cn(
        "rounded-2xl border transition-all duration-300",
        isExpanded ? "border-copper/40 bg-copper/5" : "border-border/40 bg-card hover:border-copper/30"
      )}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-copper/20 shrink-0">
                {icon}
              </div>
              <div className="text-left">
                <h4 className="font-medium text-foreground">{title}</h4>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
            <ChevronDown className={cn(
              "w-5 h-5 text-muted-foreground transition-transform duration-300 shrink-0",
              isExpanded && "rotate-180"
            )} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-5 pb-5 pt-0 animate-fade-in">
            <div className="pt-4 border-t border-border/30">
              {children}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export const AIActionsSection = ({ 
  projectId, 
  projectName, 
  project,
  tasks, 
  goals, 
  teamMembers,
  currentSprintId 
}: AIActionsSectionProps) => {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-1 w-8 rounded-full bg-copper" />
        <h2 className="text-xl font-semibold text-foreground">AI Actions</h2>
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-copper/10 border border-copper/20">
          <Bot className="w-3 h-3 text-copper" />
          <span className="text-xs text-copper font-medium">Suggested</span>
        </div>
      </div>

      <div className="grid gap-3">
        <ActionCard
          title="AI Task Suggestions"
          description="Get intelligent task recommendations based on your goals"
          icon={<Lightbulb className="w-5 h-5 text-copper" />}
        >
          <AITaskSuggestions
            projectId={projectId}
            projectName={projectName}
            goals={goals}
            existingTasks={tasks}
          />
        </ActionCard>

        <ActionCard
          title="Predictive Insights"
          description="AI-powered analysis of project trajectory and risks"
          icon={<Cpu className="w-5 h-5 text-copper" />}
        >
          <AIPredictiveInsights project={project} tasks={tasks} />
        </ActionCard>

        <ActionCard
          title="Goal-Driven Agent"
          description="Autonomous AI that plans and adjusts tasks over time"
          icon={<Bot className="w-5 h-5 text-copper" />}
        >
          <GoalDrivenAgent 
            projectId={projectId}
            projectName={projectName}
            tasks={tasks}
            teamMembers={teamMembers}
          />
        </ActionCard>

        <ActionCard
          title="Self-Healing Schedule"
          description="Auto-update plans after delays or time-off"
          icon={<Wand2 className="w-5 h-5 text-copper" />}
        >
          <SelfHealingSchedule 
            projectId={projectId}
            tasks={tasks}
            teamMembers={teamMembers}
          />
        </ActionCard>

        <ActionCard
          title="Sprint Auto-Planner"
          description="Generate optimal sprint plans based on capacity"
          icon={<Calendar className="w-5 h-5 text-copper" />}
        >
          <AISprintAutoPlanner 
            projectId={projectId}
            tasks={tasks}
            teamMembers={teamMembers}
            currentSprintId={currentSprintId}
          />
        </ActionCard>

        <ActionCard
          title="Skill-Aware Assignment"
          description="Match tasks to team members by skill and availability"
          icon={<UserCheck className="w-5 h-5 text-copper" />}
        >
          <SkillAwareAssignment 
            projectId={projectId}
            tasks={tasks}
            teamMembers={teamMembers}
          />
        </ActionCard>

        <ActionCard
          title="Smart Scheduling"
          description="AI-powered task scheduling and workload optimization"
          icon={<Wand2 className="w-5 h-5 text-copper" />}
        >
          <SmartScheduling 
            projectId={projectId}
            projectName={projectName}
            tasks={tasks}
            teamMembers={teamMembers}
          />
        </ActionCard>
      </div>
    </section>
  );
};
