import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Clock, 
  AlertTriangle, 
  TrendingDown,
  Zap,
  ChevronRight,
  Loader2,
  RefreshCw,
  GitBranch
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TaskDelayPrediction {
  taskId: string;
  taskTitle: string;
  delayProbability: number;
  predictedDelayDays: number;
  reasons: string[];
  criticalPathImpact: boolean;
  confidence: number;
}

interface PredictiveDelayDetectionProps {
  projectId: string;
  tasks: any[];
}

const calculateDelayPredictions = (tasks: any[]): TaskDelayPrediction[] => {
  const now = new Date();
  const predictions: TaskDelayPrediction[] = [];

  const incompleteTasks = tasks.filter(t => t.status !== 'completed');
  
  incompleteTasks.forEach(task => {
    let delayProbability = 0;
    let predictedDelayDays = 0;
    const reasons: string[] = [];
    let criticalPathImpact = false;
    
    // Factor 1: Already overdue
    if (task.due_date) {
      const dueDate = new Date(task.due_date);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue < 0) {
        delayProbability += 90;
        predictedDelayDays = Math.abs(daysUntilDue) + 2;
        reasons.push(`Already ${Math.abs(daysUntilDue)} days overdue`);
      } else if (daysUntilDue <= 2) {
        delayProbability += 40;
        reasons.push('Due date approaching soon');
      }
    }
    
    // Factor 2: High priority unassigned
    if (task.priority === 'high' && !task.assigned_to) {
      delayProbability += 30;
      reasons.push('High priority but unassigned');
      criticalPathImpact = true;
    }
    
    // Factor 3: No estimate
    if (!task.estimated_hours) {
      delayProbability += 15;
      reasons.push('Missing time estimate');
    }
    
    // Factor 4: Blocked status
    if (task.status === 'blocked') {
      delayProbability += 50;
      predictedDelayDays += 3;
      reasons.push('Currently blocked');
      criticalPathImpact = true;
    }
    
    // Factor 5: Work already exceeds estimate
    if (task.estimated_hours && task.tracked_hours && task.tracked_hours > task.estimated_hours * 0.8 && task.status !== 'completed') {
      delayProbability += 35;
      predictedDelayDays += Math.ceil((task.tracked_hours - task.estimated_hours * 0.8) / 4);
      reasons.push('Tracked time approaching estimate');
    }
    
    // Factor 6: Pending status for too long
    if (task.status === 'pending') {
      const createdAt = new Date(task.created_at);
      const daysSinceCreated = Math.ceil((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceCreated > 7) {
        delayProbability += 20;
        reasons.push(`In pending state for ${daysSinceCreated} days`);
      }
    }
    
    // High priority tasks on critical path
    if (task.priority === 'high') {
      criticalPathImpact = true;
    }

    // Only include tasks with meaningful delay probability
    if (delayProbability >= 25 || reasons.length >= 2) {
      predictions.push({
        taskId: task.id,
        taskTitle: task.title,
        delayProbability: Math.min(100, delayProbability),
        predictedDelayDays: Math.max(1, predictedDelayDays),
        reasons,
        criticalPathImpact,
        confidence: Math.min(95, 60 + reasons.length * 10)
      });
    }
  });

  // Sort by delay probability
  return predictions.sort((a, b) => b.delayProbability - a.delayProbability);
};

export const PredictiveDelayDetection = ({ projectId, tasks }: PredictiveDelayDetectionProps) => {
  const [predictions, setPredictions] = useState<TaskDelayPrediction[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (tasks && tasks.length > 0) {
      setPredictions(calculateDelayPredictions(tasks));
    }
  }, [tasks]);

  const handleRefresh = async () => {
    setIsAnalyzing(true);
    // Simulate AI analysis delay for UX
    await new Promise(r => setTimeout(r, 800));
    setPredictions(calculateDelayPredictions(tasks || []));
    setIsAnalyzing(false);
    toast({
      title: 'Delay Analysis Updated',
      description: `Found ${predictions.length} tasks at risk of delay`
    });
  };

  const criticalPathTasks = predictions.filter(p => p.criticalPathImpact);
  const highRiskTasks = predictions.filter(p => p.delayProbability >= 70);

  const getProbabilityColor = (prob: number) => {
    if (prob >= 70) return 'text-red-500 bg-red-500';
    if (prob >= 50) return 'text-orange-500 bg-orange-500';
    if (prob >= 30) return 'text-amber-500 bg-amber-500';
    return 'text-yellow-500 bg-yellow-500';
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <TrendingDown className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Delay Detection</CardTitle>
              <CardDescription>Predictive task slip analysis</CardDescription>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-background/50 border border-border/30">
            <div className="flex items-center gap-2 text-amber-500">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-2xl font-bold">{predictions.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">At-risk tasks</p>
          </div>
          <div className="p-3 rounded-lg bg-background/50 border border-border/30">
            <div className="flex items-center gap-2 text-red-500">
              <GitBranch className="h-4 w-4" />
              <span className="text-2xl font-bold">{criticalPathTasks.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Critical path impact</p>
          </div>
        </div>

        {/* Predictions List */}
        <ScrollArea className="h-[320px]">
          {predictions.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground">No significant delay risks detected</p>
              <p className="text-xs text-muted-foreground mt-1">Tasks are on track</p>
            </div>
          ) : (
            <div className="space-y-3">
              {predictions.map((prediction) => (
                <div 
                  key={prediction.taskId}
                  className={`p-3 rounded-lg border bg-background/50 ${
                    prediction.criticalPathImpact ? 'border-red-500/30' : 'border-border/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm line-clamp-1">{prediction.taskTitle}</span>
                        {prediction.criticalPathImpact && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="outline" className="text-red-500 border-red-500/30 text-xs px-1">
                                  <Zap className="h-3 w-3" />
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>On critical path</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                    <Badge 
                      className={`${getProbabilityColor(prediction.delayProbability).split(' ')[1]}/10 ${getProbabilityColor(prediction.delayProbability).split(' ')[0]} text-xs`}
                    >
                      {prediction.delayProbability}% likely
                    </Badge>
                  </div>

                  {/* Delay Probability Bar */}
                  <div className="mb-2">
                    <Progress 
                      value={prediction.delayProbability} 
                      className="h-1.5"
                    />
                  </div>

                  {/* Predicted Delay */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>Est. delay: ~{prediction.predictedDelayDays} day{prediction.predictedDelayDays > 1 ? 's' : ''}</span>
                    <span>{prediction.confidence}% confidence</span>
                  </div>

                  {/* Reasons */}
                  <div className="space-y-1">
                    {prediction.reasons.slice(0, 3).map((reason, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ChevronRight className="h-3 w-3" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* High Risk Alert */}
        {highRiskTasks.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2 text-red-500 mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">{highRiskTasks.length} High Risk Tasks</span>
            </div>
            <p className="text-xs text-muted-foreground">
              These tasks have &gt;70% probability of delay and need immediate attention
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PredictiveDelayDetection;
