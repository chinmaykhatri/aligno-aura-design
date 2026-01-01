import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, TrendingUp, Users, FlaskConical, X } from "lucide-react";
import PredictiveDelayDetection from "@/components/PredictiveDelayDetection";
import AICapacityForecaster from "@/components/AICapacityForecaster";
import WhatIfSimulator from "@/components/WhatIfSimulator";

interface TeamMember {
  user_id: string;
  full_name: string | null;
  role: string;
}

interface PredictionSimulationSectionProps {
  projectId: string;
  tasks: Array<any>;
  teamMembers: TeamMember[];
}

export const PredictionSimulationSection = ({ projectId, tasks, teamMembers }: PredictionSimulationSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("delays");

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-1 w-8 rounded-full bg-purple-500" />
        <h2 className="text-xl font-semibold text-foreground">Prediction & Simulation</h2>
      </div>

      <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-500/5 via-card to-card border border-purple-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-foreground">Explore Future Outcomes</h3>
            <p className="text-sm text-muted-foreground max-w-lg">
              Predict potential delays, forecast team capacity, and simulate what-if scenarios to make informed decisions.
            </p>
          </div>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button className="bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 gap-2">
                <Sparkles className="w-4 h-4" />
                Open Simulation Lab
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-2xl bg-card border-border overflow-y-auto">
              <SheetHeader className="pb-6 border-b border-border/40">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-2xl font-bold text-foreground flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-500/20">
                      <FlaskConical className="w-5 h-5 text-purple-400" />
                    </div>
                    Simulation Lab
                  </SheetTitle>
                </div>
              </SheetHeader>

              <div className="py-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full grid grid-cols-3 gap-2 bg-secondary/30 p-1 rounded-xl">
                    <TabsTrigger 
                      value="delays" 
                      className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 gap-2 rounded-lg"
                    >
                      <TrendingUp className="w-4 h-4" />
                      Delays
                    </TabsTrigger>
                    <TabsTrigger 
                      value="capacity" 
                      className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 gap-2 rounded-lg"
                    >
                      <Users className="w-4 h-4" />
                      Capacity
                    </TabsTrigger>
                    <TabsTrigger 
                      value="whatif" 
                      className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 gap-2 rounded-lg"
                    >
                      <FlaskConical className="w-4 h-4" />
                      What-If
                    </TabsTrigger>
                  </TabsList>

                  <div className="mt-6">
                    <TabsContent value="delays" className="mt-0 animate-fade-in">
                      <PredictiveDelayDetection projectId={projectId} tasks={tasks} />
                    </TabsContent>

                    <TabsContent value="capacity" className="mt-0 animate-fade-in">
                      <AICapacityForecaster 
                        projectId={projectId} 
                        tasks={tasks} 
                        teamMembers={teamMembers} 
                      />
                    </TabsContent>

                    <TabsContent value="whatif" className="mt-0 animate-fade-in">
                      <WhatIfSimulator 
                        projectId={projectId} 
                        tasks={tasks} 
                        teamMembers={teamMembers} 
                      />
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Quick Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
          <button 
            onClick={() => { setActiveTab("delays"); setIsOpen(true); }}
            className="p-4 rounded-2xl bg-secondary/30 border border-border/30 hover:border-purple-500/30 transition-all text-left group"
          >
            <TrendingUp className="w-5 h-5 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-foreground text-sm">Delay Detection</p>
            <p className="text-xs text-muted-foreground">Predict potential slips</p>
          </button>
          <button 
            onClick={() => { setActiveTab("capacity"); setIsOpen(true); }}
            className="p-4 rounded-2xl bg-secondary/30 border border-border/30 hover:border-purple-500/30 transition-all text-left group"
          >
            <Users className="w-5 h-5 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-foreground text-sm">Capacity Forecast</p>
            <p className="text-xs text-muted-foreground">Plan team utilization</p>
          </button>
          <button 
            onClick={() => { setActiveTab("whatif"); setIsOpen(true); }}
            className="p-4 rounded-2xl bg-secondary/30 border border-border/30 hover:border-purple-500/30 transition-all text-left group"
          >
            <FlaskConical className="w-5 h-5 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-foreground text-sm">What-If Scenarios</p>
            <p className="text-xs text-muted-foreground">Simulate changes</p>
          </button>
        </div>
      </div>
    </section>
  );
};
