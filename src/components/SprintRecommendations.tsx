import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sprint } from '@/hooks/useSprints';
import { Task } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Loader2, 
  Plus, 
  Minus, 
  Target, 
  AlertTriangle,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SprintRecommendationsProps {
  sprint: Sprint;
  tasks: Task[];
  velocity?: { averagePoints: number; averageHours: number } | null;
  capacity?: number;
}

interface Recommendation {
  type: 'add_task' | 'remove_task' | 'adjust_scope' | 'capacity_warning' | 'goal_suggestion';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  taskTitle?: string;
}

interface SprintHealth {
  score: 'good' | 'warning' | 'at_risk';
  commitmentLevel: 'under' | 'optimal' | 'over';
  suggestedPoints: number;
  summary: string;
}

export const SprintRecommendations = ({ 
  sprint, 
  tasks, 
  velocity,
  capacity 
}: SprintRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [sprintHealth, setSprintHealth] = useState<SprintHealth | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateRecommendations = async () => {
    setIsLoading(true);
    setRecommendations([]);
    setSprintHealth(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-insights', {
        body: {
          type: 'sprint-recommendations',
          data: {
            sprint,
            tasks,
            velocity,
            capacity,
          },
        },
      });

      if (error) throw error;

      if (data.result?.recommendations) {
        setRecommendations(data.result.recommendations);
      }
      if (data.result?.sprintHealth) {
        setSprintHealth(data.result.sprintHealth);
      }
      if (data.result?.error) {
        throw new Error(data.result.error);
      }
    } catch (err) {
      console.error('Failed to generate recommendations:', err);
      toast.error('Failed to generate sprint recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'add_task': return <Plus className="w-4 h-4 text-emerald-400" />;
      case 'remove_task': return <Minus className="w-4 h-4 text-red-400" />;
      case 'adjust_scope': return <Target className="w-4 h-4 text-blue-400" />;
      case 'capacity_warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'goal_suggestion': return <TrendingUp className="w-4 h-4 text-purple-400" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getHealthColor = (score: string) => {
    switch (score) {
      case 'good': return 'text-emerald-400';
      case 'warning': return 'text-yellow-400';
      case 'at_risk': return 'text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  const getHealthIcon = (score: string) => {
    switch (score) {
      case 'good': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'at_risk': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default: return null;
    }
  };

  const getCommitmentProgress = (level: string) => {
    switch (level) {
      case 'under': return 40;
      case 'optimal': return 75;
      case 'over': return 100;
      default: return 50;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-copper" />
            Sprint Planning AI
          </span>
          <Button
            size="sm"
            onClick={generateRecommendations}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Brain className="w-4 h-4" />
            )}
            {isLoading ? 'Analyzing...' : 'Analyze'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!sprintHealth && recommendations.length === 0 && !isLoading ? (
          <div className="text-center py-6 text-muted-foreground">
            <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Get AI-powered sprint planning advice</p>
            <p className="text-xs mt-1">Based on your backlog and team velocity</p>
          </div>
        ) : (
          <>
            {/* Sprint Health Card */}
            {sprintHealth && (
              <div className="p-4 rounded-lg bg-muted/30 border border-border/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Sprint Health</span>
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs capitalize", getHealthColor(sprintHealth.score))}
                  >
                    {getHealthIcon(sprintHealth.score)}
                    <span className="ml-1">{sprintHealth.score.replace('_', ' ')}</span>
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Commitment Level</span>
                    <span className="capitalize">{sprintHealth.commitmentLevel}</span>
                  </div>
                  <Progress 
                    value={getCommitmentProgress(sprintHealth.commitmentLevel)} 
                    className={cn(
                      "h-2",
                      sprintHealth.commitmentLevel === 'under' && "[&>div]:bg-blue-500",
                      sprintHealth.commitmentLevel === 'optimal' && "[&>div]:bg-emerald-500",
                      sprintHealth.commitmentLevel === 'over' && "[&>div]:bg-red-500"
                    )}
                  />
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Suggested Points</span>
                  <span className="font-medium">{sprintHealth.suggestedPoints} SP</span>
                </div>

                <p className="text-xs text-muted-foreground italic">
                  {sprintHealth.summary}
                </p>
              </div>
            )}

            {/* Recommendations List */}
            {recommendations.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Recommendations</span>
                {recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-muted/20 border border-border/20 space-y-1"
                  >
                    <div className="flex items-start gap-2">
                      {getTypeIcon(rec.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{rec.title}</span>
                          <Badge variant="outline" className={cn("text-xs", getPriorityColor(rec.priority))}>
                            {rec.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {rec.description}
                        </p>
                        {rec.taskTitle && (
                          <p className="text-xs text-copper mt-1">
                            Task: {rec.taskTitle}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
