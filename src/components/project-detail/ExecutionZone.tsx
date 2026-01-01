import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskList } from "@/components/TaskList";
import OKRManager from "@/components/OKRManager";
import { GoalList } from "@/components/GoalList";
import TeamCollaboration from "@/components/TeamCollaboration";
import MeetingTranscription from "@/components/MeetingTranscription";
import RoadmapView from "@/components/RoadmapView";
import { ListTodo, Target, MessageSquare, Map, Mic } from "lucide-react";

interface ExecutionZoneProps {
  projectId: string;
  projectName: string;
  isOwner: boolean;
}

export const ExecutionZone = ({ projectId, projectName, isOwner }: ExecutionZoneProps) => {
  const [activeTab, setActiveTab] = useState("tasks");

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-1 w-8 rounded-full bg-copper" />
        <h2 className="text-xl font-semibold text-foreground">Execution</h2>
      </div>

      <div className="rounded-3xl bg-card border border-border/40 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border/40">
            <TabsList className="w-full justify-start gap-1 p-2 bg-transparent h-auto flex-wrap">
              <TabsTrigger 
                value="tasks" 
                className="data-[state=active]:bg-copper/20 data-[state=active]:text-copper gap-2 px-4 py-2.5 rounded-xl"
              >
                <ListTodo className="w-4 h-4" />
                Tasks
              </TabsTrigger>
              <TabsTrigger 
                value="okrs" 
                className="data-[state=active]:bg-copper/20 data-[state=active]:text-copper gap-2 px-4 py-2.5 rounded-xl"
              >
                <Target className="w-4 h-4" />
                OKRs & Goals
              </TabsTrigger>
              <TabsTrigger 
                value="roadmap" 
                className="data-[state=active]:bg-copper/20 data-[state=active]:text-copper gap-2 px-4 py-2.5 rounded-xl"
              >
                <Map className="w-4 h-4" />
                Roadmap
              </TabsTrigger>
              <TabsTrigger 
                value="collaboration" 
                className="data-[state=active]:bg-copper/20 data-[state=active]:text-copper gap-2 px-4 py-2.5 rounded-xl"
              >
                <MessageSquare className="w-4 h-4" />
                Team Chat
              </TabsTrigger>
              <TabsTrigger 
                value="meetings" 
                className="data-[state=active]:bg-copper/20 data-[state=active]:text-copper gap-2 px-4 py-2.5 rounded-xl"
              >
                <Mic className="w-4 h-4" />
                Meetings
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="tasks" className="mt-0 animate-fade-in">
              <TaskList projectId={projectId} isOwner={isOwner} />
            </TabsContent>

            <TabsContent value="okrs" className="mt-0 space-y-6 animate-fade-in">
              <GoalList projectId={projectId} />
              <OKRManager projectId={projectId} />
            </TabsContent>

            <TabsContent value="roadmap" className="mt-0 animate-fade-in">
              <RoadmapView projectId={projectId} />
            </TabsContent>

            <TabsContent value="collaboration" className="mt-0 animate-fade-in">
              <TeamCollaboration projectId={projectId} projectName={projectName} />
            </TabsContent>

            <TabsContent value="meetings" className="mt-0 animate-fade-in">
              <MeetingTranscription projectId={projectId} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </section>
  );
};
