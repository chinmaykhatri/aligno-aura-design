import { useState, useEffect, useCallback } from "react";
import { Brain, Zap, CheckCircle, AlertTriangle, TrendingUp, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface TeaserScene {
  id: number;
  duration: number;
}

const scenes: TeaserScene[] = [
  { id: 1, duration: 4000 },
  { id: 2, duration: 5000 },
  { id: 3, duration: 4000 },
];

const DemoTeaser = () => {
  const [currentScene, setCurrentScene] = useState(0);
  const [progress, setProgress] = useState(0);

  const scene = scenes[currentScene];

  const goToNext = useCallback(() => {
    setCurrentScene((prev) => (prev + 1) % scenes.length);
    setProgress(0);
  }, []);

  useEffect(() => {
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
  }, [scene.duration, goToNext]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-copper/20 shadow-2xl glow-copper bg-secondary/30 backdrop-blur-sm">
      {/* Scene Content */}
      <div className="relative h-[400px] md:h-[500px] overflow-hidden">
        <div key={scene.id} className="absolute inset-0 animate-fade-in">
          {scene.id === 1 && <TeaserScene1 />}
          {scene.id === 2 && <TeaserScene2 />}
          {scene.id === 3 && <TeaserScene3 />}
        </div>
      </div>

      {/* Progress indicators */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/90 to-transparent">
        <div className="flex gap-2 max-w-xs mx-auto">
          {scenes.map((_, index) => (
            <div key={index} className="flex-1 h-1 bg-muted-foreground/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-copper rounded-full transition-all duration-100"
                style={{
                  width: index < currentScene ? "100%" : index === currentScene ? `${progress}%` : "0%",
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Scene 1: The Problem (Quick glimpse)
const TeaserScene1 = () => (
  <div className="w-full h-full flex flex-col items-center justify-center p-6 md:p-10">
    <div className="max-w-2xl w-full space-y-6">
      <div className="text-center space-y-2 mb-8">
        <p className="text-sm text-copper font-medium uppercase tracking-wider">The Challenge</p>
        <h3 className="text-xl md:text-2xl font-semibold text-foreground">
          Too many tasks. Not enough visibility.
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-background/50 border border-destructive/30 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">API Work</span>
            <AlertTriangle className="w-3 h-3 text-destructive" />
          </div>
          <div className="text-[10px] text-destructive">Overdue</div>
          <Progress value={35} className="h-1" />
        </div>

        <div className="bg-background/50 border border-amber-500/30 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">Testing</span>
            <TrendingUp className="w-3 h-3 text-amber-500" />
          </div>
          <div className="text-[10px] text-amber-500">At risk</div>
          <Progress value={60} className="h-1" />
        </div>

        <div className="bg-background/50 border border-muted-foreground/20 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">Docs</span>
            <Users className="w-3 h-3 text-muted-foreground" />
          </div>
          <div className="text-[10px] text-muted-foreground">Pending</div>
          <Progress value={20} className="h-1" />
        </div>
      </div>

      <div className="flex justify-center gap-4 text-xs">
        <span className="flex items-center gap-1 text-destructive">
          <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          3 at risk
        </span>
        <span className="flex items-center gap-1 text-amber-500">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          5 approaching
        </span>
      </div>
    </div>
  </div>
);

// Scene 2: AI Insight (Key value prop)
const TeaserScene2 = () => (
  <div className="w-full h-full flex flex-col items-center justify-center p-6 md:p-10">
    <div className="max-w-md w-full">
      <div className="text-center space-y-2 mb-6">
        <p className="text-sm text-copper font-medium uppercase tracking-wider">AI-Powered Insight</p>
        <h3 className="text-xl md:text-2xl font-semibold text-foreground">
          One clear answer. No guesswork.
        </h3>
      </div>

      <div className="bg-background/60 border-2 border-copper/40 rounded-2xl p-6 glow-copper space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-copper/20">
            <Brain className="w-5 h-5 text-copper" />
          </div>
          <div>
            <div className="font-semibold text-foreground">Project Health</div>
            <div className="text-xs text-muted-foreground">AI-powered summary</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/50 rounded-lg p-3 border border-copper/10">
            <div className="text-[10px] text-muted-foreground mb-1">Score</div>
            <div className="text-2xl font-bold text-emerald-500">78%</div>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 border border-destructive/10">
            <div className="text-[10px] text-muted-foreground mb-1">Risk</div>
            <div className="text-sm font-semibold text-destructive">Bottleneck</div>
          </div>
        </div>

        <div className="bg-copper/10 rounded-lg p-3 border border-copper/20">
          <div className="text-xs text-muted-foreground mb-1">Recommended Action</div>
          <div className="text-sm font-medium text-copper">Reassign 2 tasks to balance load</div>
        </div>
      </div>
    </div>
  </div>
);

// Scene 3: Human in Control (Trust)
const TeaserScene3 = () => (
  <div className="w-full h-full flex flex-col items-center justify-center p-6 md:p-10">
    <div className="max-w-md w-full">
      <div className="text-center space-y-2 mb-6">
        <p className="text-sm text-copper font-medium uppercase tracking-wider">Human in Control</p>
        <h3 className="text-xl md:text-2xl font-semibold text-foreground">
          AI recommends. You decide.
        </h3>
      </div>

      <div className="bg-background/60 border border-copper/20 rounded-2xl p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-copper/20">
            <Zap className="w-4 h-4 text-copper" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-foreground text-sm">AI Suggestion</div>
            <div className="text-xs text-muted-foreground mt-1">
              Move "API Integration" from Alex to Sarah
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-500 mt-2">
              <CheckCircle className="w-3 h-3" />
              <span>Reduces risk by 40%</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="flex-1 px-4 py-2.5 rounded-lg border border-copper/40 text-sm text-foreground hover:bg-copper/10 transition-colors">
            Dismiss
          </button>
          <button className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-copper text-deep-black text-sm font-medium">
            Review & Apply
          </button>
        </div>
      </div>

      <div className="text-center mt-6">
        <p className="text-lg font-semibold text-gradient-copper">
          Work Intelligence Platform
        </p>
      </div>
    </div>
  </div>
);

export default DemoTeaser;
