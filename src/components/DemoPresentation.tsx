import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  Brain, 
  TrendingUp, 
  Users, 
  FileText, 
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  X,
  BarChart3,
  Shield,
  Lightbulb,
  Zap,
  Target,
  Calendar
} from "lucide-react";

interface DemoPresentationProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Scene {
  id: number;
  title: string;
  narration: string;
  duration: number;
}

const scenes: Scene[] = [
  {
    id: 1,
    title: "The Problem",
    narration: "Teams don't struggle because they can't track tasks. They struggle because they don't see what's about to go wrong.",
    duration: 20000,
  },
  {
    id: 2,
    title: "Single Insight Summary",
    narration: "Instead of dozens of dashboards, the platform starts with one clear answer.",
    duration: 25000,
  },
  {
    id: 3,
    title: "Explain the 'Why'",
    narration: "Every insight is explainable—so teams know why it matters.",
    duration: 20000,
  },
  {
    id: 4,
    title: "Prediction & Scenarios",
    narration: "Teams can safely explore outcomes before making decisions.",
    duration: 22000,
  },
  {
    id: 5,
    title: "AI-Supported Action",
    narration: "AI recommends. Humans decide.",
    duration: 18000,
  },
  {
    id: 6,
    title: "Communication",
    narration: "When decisions are made, insights are shared clearly.",
    duration: 18000,
  },
  {
    id: 7,
    title: "Closing",
    narration: "Not a project management tool. A work intelligence platform.",
    duration: 20000,
  },
];

const DemoPresentation = ({ isOpen, onClose }: DemoPresentationProps) => {
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  const totalScenes = scenes.length;
  const scene = scenes[currentScene];

  const goToNext = useCallback(() => {
    if (currentScene < totalScenes - 1) {
      setCurrentScene((prev) => prev + 1);
      setProgress(0);
    } else {
      setIsPlaying(false);
    }
  }, [currentScene, totalScenes]);

  const goToPrev = useCallback(() => {
    if (currentScene > 0) {
      setCurrentScene((prev) => prev - 1);
      setProgress(0);
    }
  }, [currentScene]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentScene(0);
      setProgress(0);
      setIsPlaying(true);
      return;
    }

    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const increment = (100 / scene.duration) * 100;
        if (prev >= 100) {
          goToNext();
          return 0;
        }
        return prev + increment;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, isPlaying, scene.duration, goToNext]);

  const renderSceneContent = () => {
    switch (scene.id) {
      case 1:
        return <Scene1Content />;
      case 2:
        return <Scene2Content />;
      case 3:
        return <Scene3Content />;
      case 4:
        return <Scene4Content />;
      case 5:
        return <Scene5Content />;
      case 6:
        return <Scene6Content />;
      case 7:
        return <Scene7Content />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl w-[95vw] h-[85vh] p-0 bg-background border-copper/20 overflow-hidden">
        <div className="relative w-full h-full flex flex-col">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>

          {/* Scene content */}
          <div className="flex-1 relative overflow-hidden">
            <div 
              key={scene.id} 
              className="absolute inset-0 animate-fade-in"
            >
              {renderSceneContent()}
            </div>
          </div>

          {/* Narration bar */}
          <div className="bg-secondary/80 backdrop-blur-sm border-t border-copper/10 p-6">
            <p className="text-lg md:text-xl text-center text-foreground font-light leading-relaxed max-w-3xl mx-auto">
              "{scene.narration}"
            </p>
          </div>

          {/* Controls */}
          <div className="bg-background border-t border-copper/10 p-4">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPrev}
                  disabled={currentScene === 0}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNext}
                  disabled={currentScene === totalScenes - 1}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex-1 mx-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-muted-foreground">
                    {currentScene + 1} / {totalScenes}
                  </span>
                  <span className="text-sm text-foreground font-medium">
                    {scene.title}
                  </span>
                </div>
                <Progress value={progress} className="h-1" />
              </div>

              <div className="flex gap-1">
                {scenes.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentScene(index);
                      setProgress(0);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentScene 
                        ? "bg-copper w-4" 
                        : index < currentScene 
                          ? "bg-copper/60" 
                          : "bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Scene 1: The Problem
const Scene1Content = () => (
  <div className="w-full h-full bg-gradient-to-br from-background via-secondary/30 to-background p-8 flex items-center justify-center">
    <div className="max-w-4xl w-full space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Task cards with deadlines */}
        <div className="bg-secondary/50 border border-destructive/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">API Integration</span>
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </div>
          <div className="text-xs text-destructive">Due: Tomorrow</div>
          <Progress value={35} className="h-1.5" />
        </div>
        
        <div className="bg-secondary/50 border border-amber-500/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">User Testing</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xs text-amber-500">Due: 3 days</div>
          <Progress value={60} className="h-1.5" />
        </div>
        
        <div className="bg-secondary/50 border border-copper/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Documentation</span>
            <Target className="w-4 h-4 text-copper" />
          </div>
          <div className="text-xs text-muted-foreground">Due: 1 week</div>
          <Progress value={20} className="h-1.5" />
        </div>
      </div>

      <div className="flex justify-center gap-6">
        <div className="flex items-center gap-2 text-destructive">
          <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
          <span className="text-sm">3 at risk</span>
        </div>
        <div className="flex items-center gap-2 text-amber-500">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-sm">5 approaching</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-3 h-3 rounded-full bg-muted-foreground/50" />
          <span className="text-sm">12 tasks total</span>
        </div>
      </div>
    </div>
  </div>
);

// Scene 2: Single Insight Summary
const Scene2Content = () => (
  <div className="w-full h-full bg-gradient-to-br from-background via-secondary/20 to-background p-8 flex items-center justify-center">
    <div className="max-w-2xl w-full animate-fade-in">
      <div className="bg-secondary/60 border-2 border-copper/40 rounded-2xl p-8 glow-copper space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-copper/20">
            <Brain className="w-6 h-6 text-copper" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">Project Health Summary</h3>
            <p className="text-sm text-muted-foreground">AI-powered insight</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-background/50 rounded-xl p-4 border border-copper/20">
            <div className="text-sm text-muted-foreground mb-1">Health Score</div>
            <div className="text-3xl font-bold text-emerald-500">78%</div>
          </div>
          <div className="bg-background/50 rounded-xl p-4 border border-destructive/20">
            <div className="text-sm text-muted-foreground mb-1">Primary Risk</div>
            <div className="text-lg font-semibold text-destructive">Resource Bottleneck</div>
          </div>
          <div className="bg-background/50 rounded-xl p-4 border border-amber-500/20">
            <div className="text-sm text-muted-foreground mb-1">Predicted Impact</div>
            <div className="text-lg font-semibold text-amber-500">+3 days delay</div>
          </div>
          <div className="bg-background/50 rounded-xl p-4 border border-copper/20">
            <div className="text-sm text-muted-foreground mb-1">Recommended Action</div>
            <div className="text-lg font-semibold text-copper">Reassign 2 tasks</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Scene 3: Explain the Why
const Scene3Content = () => (
  <div className="w-full h-full bg-gradient-to-br from-background via-secondary/20 to-background p-8 flex items-center justify-center">
    <div className="max-w-3xl w-full animate-fade-in space-y-6">
      <div className="bg-secondary/40 border border-copper/20 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-copper" />
          <span className="font-medium text-foreground">Why this insight exists</span>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-background/30 rounded-lg border-l-2 border-destructive/50">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
            <div>
              <div className="font-medium text-foreground">High-Risk Dependencies</div>
              <div className="text-sm text-muted-foreground">3 critical tasks depend on blocked API work</div>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 bg-background/30 rounded-lg border-l-2 border-amber-500/50">
            <Users className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <div className="font-medium text-foreground">Capacity Imbalance</div>
              <div className="text-sm text-muted-foreground">2 team members at 140% utilization</div>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 bg-background/30 rounded-lg border-l-2 border-copper/50">
            <TrendingUp className="w-5 h-5 text-copper mt-0.5" />
            <div>
              <div className="font-medium text-foreground">Velocity Trend</div>
              <div className="text-sm text-muted-foreground">15% decrease in last 2 sprints</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Scene 4: Prediction & Scenarios
const Scene4Content = () => (
  <div className="w-full h-full bg-gradient-to-br from-background via-secondary/20 to-background p-8 flex items-center justify-center">
    <div className="max-w-3xl w-full animate-fade-in space-y-6">
      <div className="bg-secondary/40 border border-copper/20 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="w-5 h-5 text-copper" />
          <span className="font-medium text-foreground">What-If Simulator</span>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Team Capacity</span>
              <span className="text-foreground font-medium">+1 developer</span>
            </div>
            <div className="h-2 bg-background/50 rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-gradient-to-r from-copper to-amber-glow rounded-full transition-all duration-1000" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background/30 rounded-lg p-4 border border-muted-foreground/20">
              <div className="text-sm text-muted-foreground mb-1">Current Projection</div>
              <div className="text-xl font-semibold text-destructive">Jan 15</div>
              <div className="text-xs text-destructive">3 days late</div>
            </div>
            <div className="bg-background/30 rounded-lg p-4 border border-emerald-500/30">
              <div className="text-sm text-muted-foreground mb-1">With Change</div>
              <div className="text-xl font-semibold text-emerald-500">Jan 12</div>
              <div className="text-xs text-emerald-500">On time</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BarChart3 className="w-4 h-4" />
            <span>Confidence: 85%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Scene 5: AI-Supported Action
const Scene5Content = () => (
  <div className="w-full h-full bg-gradient-to-br from-background via-secondary/20 to-background p-8 flex items-center justify-center">
    <div className="max-w-2xl w-full animate-fade-in space-y-6">
      <div className="bg-secondary/40 border border-copper/20 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Brain className="w-5 h-5 text-copper" />
          <span className="font-medium text-foreground">AI Recommendation</span>
        </div>

        <div className="bg-background/30 rounded-lg p-5 border border-copper/30 mb-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-copper/20">
              <Users className="w-5 h-5 text-copper" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-foreground mb-1">Reassign API Integration</div>
              <div className="text-sm text-muted-foreground mb-3">
                Move from Alex (overloaded) to Sarah (available capacity)
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-500">
                <Shield className="w-3 h-3" />
                <span>Reduces risk by 40%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 border-copper/40 hover:bg-copper/10">
            Dismiss
          </Button>
          <Button className="flex-1 bg-gradient-copper hover:opacity-90">
            Review & Apply
          </Button>
        </div>
      </div>
    </div>
  </div>
);

// Scene 6: Communication
const Scene6Content = () => (
  <div className="w-full h-full bg-gradient-to-br from-background via-secondary/20 to-background p-8 flex items-center justify-center">
    <div className="max-w-2xl w-full animate-fade-in space-y-6">
      <div className="bg-secondary/40 border border-copper/20 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="w-5 h-5 text-copper" />
          <span className="font-medium text-foreground">Executive Summary</span>
        </div>

        <div className="bg-background/50 rounded-lg p-5 border border-muted-foreground/20 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-muted-foreground/10">
            <span className="text-sm text-muted-foreground">Week of Jan 8, 2025</span>
            <div className="flex items-center gap-1 text-emerald-500 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>On Track</span>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2" />
              <span className="text-foreground">Completed 12 story points (vs 10 planned)</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2" />
              <span className="text-foreground">1 blocker resolved, 1 pending review</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-copper mt-2" />
              <span className="text-foreground">Next week: Focus on API stabilization</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <Button variant="outline" className="flex-1 border-copper/40 hover:bg-copper/10">
            Export PDF
          </Button>
          <Button className="flex-1 bg-gradient-copper hover:opacity-90">
            Share via Email
          </Button>
        </div>
      </div>
    </div>
  </div>
);

// Scene 7: Closing
const Scene7Content = () => (
  <div className="w-full h-full bg-gradient-to-br from-background via-secondary/30 to-background flex items-center justify-center">
    <div className="text-center space-y-8 animate-fade-in">
      <div className="inline-flex items-center justify-center p-6 rounded-full bg-copper/10 border border-copper/30 glow-copper">
        <Brain className="w-12 h-12 text-copper" />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-4xl md:text-5xl font-bold text-gradient-copper">
          Aligno
        </h2>
        <div className="space-y-2">
          <p className="text-xl text-muted-foreground">Not a project management tool.</p>
          <p className="text-2xl font-semibold text-foreground">A work intelligence platform.</p>
        </div>
      </div>

      <div className="flex justify-center gap-4 pt-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>Predictive Insights</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>AI-Powered</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>Human-in-Control</span>
        </div>
      </div>
    </div>
  </div>
);

export default DemoPresentation;
