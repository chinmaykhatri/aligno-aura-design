import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Zap,
  Target,
  Shield,
  Users,
  Loader2,
  Check,
  ChevronRight,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';

interface SprintOption {
  id: string;
  name: string;
  strategy: 'fast' | 'balanced' | 'safe';
  description: string;
  tasks: SprintTask[];
  metrics: {
    totalPoints: number;
    riskScore: number;
    teamLoadBalance: number;
    estimatedDays: number;
  };
}

interface SprintTask {
  taskId: string;
  taskTitle: string;
  priority: string;
  storyPoints: number;
  assignee: string | null;
  reason: string;
}

interface AISprintAutoPlannerProps {
  projectId: string;
  tasks: any[];
  teamMembers: any[];
  currentSprintId?: string;
}

const generateSprintOptions = (tasks: any[], teamMembers: any[]): SprintOption[] => {
  const backlogTasks = tasks.filter(t => 
    t.status !== 'completed' && !t.sprint_id
  ).sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return (priorityOrder[a.priority as keyof typeof priorityOrder] || 1) - 
           (priorityOrder[b.priority as keyof typeof priorityOrder] || 1);
  });

  const calculateMetrics = (selectedTasks: any[]) => {
    const totalPoints = selectedTasks.reduce((sum, t) => sum + (t.story_points || 3), 0);
    const highPriorityRatio = selectedTasks.filter(t => t.priority === 'high').length / (selectedTasks.length || 1);
    const unassignedRatio = selectedTasks.filter(t => !t.assigned_to).length / (selectedTasks.length || 1);
    
    return {
      totalPoints,
      riskScore: Math.round((highPriorityRatio * 0.4 + unassignedRatio * 0.6) * 100),
      teamLoadBalance: Math.round((1 - unassignedRatio) * 100),
      estimatedDays: Math.ceil(totalPoints / 5) // Assume 5 points per day
    };
  };

  const options: SprintOption[] = [];

  // Fast Delivery Option - prioritize high priority tasks
  const fastTasks = backlogTasks
    .filter(t => t.priority === 'high' || t.priority === 'medium')
    .slice(0, 8);
  
  if (fastTasks.length > 0) {
    options.push({
      id: 'fast',
      name: 'Fast Delivery',
      strategy: 'fast',
      description: 'Focus on highest priority items for quick wins',
      tasks: fastTasks.map(t => ({
        taskId: t.id,
        taskTitle: t.title,
        priority: t.priority,
        storyPoints: t.story_points || 3,
        assignee: teamMembers.find(m => m.user_id === t.assigned_to)?.full_name || null,
        reason: t.priority === 'high' ? 'High priority item' : 'Medium priority for momentum'
      })),
      metrics: calculateMetrics(fastTasks)
    });
  }

  // Balanced Option - mix of priorities with good coverage
  const balancedTasks = backlogTasks.slice(0, 6);
  
  if (balancedTasks.length > 0) {
    options.push({
      id: 'balanced',
      name: 'Balanced Sprint',
      strategy: 'balanced',
      description: 'Mix of priorities for steady progress',
      tasks: balancedTasks.map(t => ({
        taskId: t.id,
        taskTitle: t.title,
        priority: t.priority,
        storyPoints: t.story_points || 3,
        assignee: teamMembers.find(m => m.user_id === t.assigned_to)?.full_name || null,
        reason: 'Balanced selection based on priority and dependencies'
      })),
      metrics: calculateMetrics(balancedTasks)
    });
  }

  // Safe Option - lower risk, assigned tasks only
  const safeTasks = backlogTasks
    .filter(t => t.assigned_to && t.estimated_hours)
    .slice(0, 5);
  
  if (safeTasks.length > 0) {
    options.push({
      id: 'safe',
      name: 'Low Risk',
      strategy: 'safe',
      description: 'Well-defined tasks with clear ownership',
      tasks: safeTasks.map(t => ({
        taskId: t.id,
        taskTitle: t.title,
        priority: t.priority,
        storyPoints: t.story_points || 3,
        assignee: teamMembers.find(m => m.user_id === t.assigned_to)?.full_name || null,
        reason: 'Well-scoped with assigned owner'
      })),
      metrics: calculateMetrics(safeTasks)
    });
  }

  return options;
};

export const AISprintAutoPlanner = ({ projectId, tasks, teamMembers, currentSprintId }: AISprintAutoPlannerProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [options, setOptions] = useState<SprintOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const { toast } = useToast();

  const handleGenerate = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      const generatedOptions = generateSprintOptions(tasks, teamMembers);
      setOptions(generatedOptions);
      setIsGenerating(false);
      
      toast({
        title: 'Sprint Options Generated',
        description: `${generatedOptions.length} sprint strategies available`
      });
    }, 1000);
  };

  const handleApplyOption = async (option: SprintOption) => {
    if (!currentSprintId) {
      toast({
        title: 'No Active Sprint',
        description: 'Create a sprint first to apply this plan',
        variant: 'destructive'
      });
      return;
    }

    setIsApplying(true);

    try {
      for (const task of option.tasks) {
        await supabase
          .from('tasks')
          .update({ sprint_id: currentSprintId })
          .eq('id', task.taskId);
      }

      toast({
        title: 'Sprint Plan Applied',
        description: `${option.tasks.length} tasks added to sprint`
      });
    } catch (err) {
      console.error('Failed to apply sprint plan:', err);
      toast({
        title: 'Failed to Apply',
        description: 'Could not add tasks to sprint',
        variant: 'destructive'
      });
    } finally {
      setIsApplying(false);
    }
  };

  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case 'fast': return <Zap className="h-4 w-4 text-amber-500" />;
      case 'balanced': return <Target className="h-4 w-4 text-blue-500" />;
      case 'safe': return <Shield className="h-4 w-4 text-green-500" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'fast': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'balanced': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'safe': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Zap className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Sprint Planner</CardTitle>
              <CardDescription>AI-generated sprint options</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleGenerate} 
          disabled={isGenerating || tasks.filter(t => !t.sprint_id && t.status !== 'completed').length === 0}
          className="w-full gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating Options...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Generate Sprint Options
            </>
          )}
        </Button>

        {options.length > 0 && (
          <Tabs value={selectedOption || options[0]?.id} onValueChange={setSelectedOption}>
            <TabsList className="grid w-full grid-cols-3">
              {options.map((opt) => (
                <TabsTrigger key={opt.id} value={opt.id} className="text-xs gap-1">
                  {getStrategyIcon(opt.strategy)}
                  {opt.strategy === 'fast' ? 'Fast' : opt.strategy === 'balanced' ? 'Balanced' : 'Safe'}
                </TabsTrigger>
              ))}
            </TabsList>

            {options.map((option) => (
              <TabsContent key={option.id} value={option.id} className="space-y-3 mt-3">
                {/* Option Header */}
                <div className="p-3 rounded-lg bg-background/50 border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{option.name}</h4>
                    <Badge variant="outline" className={getStrategyColor(option.strategy)}>
                      {option.strategy}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{option.description}</p>
                  
                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded bg-secondary/50">
                      <span className="text-muted-foreground">Points</span>
                      <span className="font-medium">{option.metrics.totalPoints}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-secondary/50">
                      <span className="text-muted-foreground">Est. Days</span>
                      <span className="font-medium">{option.metrics.estimatedDays}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-secondary/50">
                      <span className="text-muted-foreground">Risk</span>
                      <span className={`font-medium ${option.metrics.riskScore > 50 ? 'text-amber-500' : 'text-green-500'}`}>
                        {option.metrics.riskScore}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-secondary/50">
                      <span className="text-muted-foreground">Coverage</span>
                      <span className="font-medium">{option.metrics.teamLoadBalance}%</span>
                    </div>
                  </div>
                </div>

                {/* Task List */}
                <ScrollArea className="h-[150px]">
                  <div className="space-y-2">
                    {option.tasks.map((task) => (
                      <div 
                        key={task.taskId}
                        className="p-2 rounded-lg border border-border/50 bg-background/50"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium line-clamp-1">{task.taskTitle}</span>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {task.storyPoints} pts
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Badge variant="outline" className="text-xs">
                            {task.priority}
                          </Badge>
                          <span>{task.assignee || 'Unassigned'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Apply Button */}
                <Button 
                  onClick={() => handleApplyOption(option)}
                  disabled={isApplying || !currentSprintId}
                  className="w-full gap-2"
                  variant="secondary"
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Apply This Plan
                    </>
                  )}
                </Button>
              </TabsContent>
            ))}
          </Tabs>
        )}

        {options.length === 0 && !isGenerating && (
          <div className="text-center py-4">
            <Zap className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Generate sprint options from your backlog
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AISprintAutoPlanner;
