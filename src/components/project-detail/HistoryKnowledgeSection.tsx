import { useState } from "react";
import { ChevronDown, History, BookOpen, FileText, Activity } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import AIProjectHistorian from "@/components/AIProjectHistorian";
import DocumentIngestion from "@/components/DocumentIngestion";
import { ActivityFeed } from "@/components/ActivityFeed";
import { cn } from "@/lib/utils";

interface HistoryKnowledgeSectionProps {
  projectId: string;
  projectName: string;
}

interface TimelineItemProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const TimelineItem = ({ title, icon, children, defaultOpen = false }: TimelineItemProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="relative pl-8 pb-6 last:pb-0">
        {/* Timeline line */}
        <div className="absolute left-3 top-6 bottom-0 w-px bg-border/50" />
        
        {/* Timeline dot */}
        <div className="absolute left-0 top-1 p-1.5 rounded-full bg-charcoal border-2 border-border">
          {icon}
        </div>

        <CollapsibleTrigger className="w-full">
          <div className={cn(
            "flex items-center justify-between p-4 rounded-2xl transition-all",
            "bg-secondary/30 border border-border/40 hover:border-copper/30",
            isOpen && "bg-copper/5 border-copper/30"
          )}>
            <span className="font-medium text-foreground">{title}</span>
            <ChevronDown className={cn(
              "w-5 h-5 text-muted-foreground transition-transform duration-300",
              isOpen && "rotate-180"
            )} />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="mt-3 p-4 rounded-2xl bg-card border border-border/40 animate-fade-in">
            {children}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export const HistoryKnowledgeSection = ({ projectId, projectName }: HistoryKnowledgeSectionProps) => {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-1 w-8 rounded-full bg-blue-500" />
        <h2 className="text-xl font-semibold text-foreground">History & Knowledge</h2>
      </div>

      <div className="rounded-3xl bg-card border border-border/40 p-6">
        <TimelineItem
          title="Project Historian"
          icon={<History className="w-4 h-4 text-blue-400" />}
        >
          <AIProjectHistorian projectId={projectId} projectName={projectName} />
        </TimelineItem>

        <TimelineItem
          title="Document Library"
          icon={<FileText className="w-4 h-4 text-blue-400" />}
        >
          <DocumentIngestion projectId={projectId} />
        </TimelineItem>

        <TimelineItem
          title="Activity Timeline"
          icon={<Activity className="w-4 h-4 text-blue-400" />}
          defaultOpen={true}
        >
          <ActivityFeed projectId={projectId} compact />
        </TimelineItem>
      </div>
    </section>
  );
};
