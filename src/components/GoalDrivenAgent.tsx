import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Bot, 
  Target,
  Play,
  Pause,
  Settings,
  Calendar,
  Users,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface AgentGoal {
  id: string;
  description: string;
  targetDate: string;
  status: 'planning' | 'executing' | 'paused' | 'completed';
  progress: number;
  actions: AgentAction[];
  constraints: string[];
}

interface AgentAction {
  id: string;
  type: 'schedule' | 'assign' | 'reschedule' | 'alert';
  description: string;
  status: 'pending' | 'approved' | 'executed' | 'rejected';
  taskId?: string;
  details: Record<string, any>;
}

interface GoalDrivenAgentProps {
  projectId: string;
  projectName: string;
  tasks: any[];
  teamMembers: any[];
}

export const GoalDrivenAgent = ({ projectId, projectName, tasks, teamMembers }: GoalDrivenAgentProps) => {
  const [isActive, setIsActive] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [constraints, setConstraints] = useState('');
  const [currentGoal, setCurrentGoal] = useState<AgentGoal | null>(null);
  const [pendingActions, setPendingActions] = useState<AgentAction[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleCreateGoal = async () => {
    if (!goalInput.trim() || !targetDate) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a goal and target date',
        variant: 'destructive'
      });
      return;
    }

    setIsPlanning(true);

    try {
      const constraintsList = constraints.split('\n').filter(c => c.trim());
      
      const { data, error } = await supabase.functions.invoke('smart-scheduling', {
        body: {
          type: 'agent-plan',
          goal: goalInput,
          targetDate,
          constraints: constraintsList,
          tasks,
          teamMembers,
          projectId
        }
      });

      if (error) throw error;

      const plan = data.result;
      
      const newGoal: AgentGoal = {
        id: `goal-${Date.now()}`,
        description: goalInput,
        targetDate,
        status: 'planning',
        progress: 0,
        actions: plan?.actions?.map((a: any, i: number) => ({
          id: `action-${Date.now()}-${i}`,
          type: a.type || 'schedule',
          description: a.description,
          status: 'pending',
          taskId: a.taskId,
          details: a.details || {}
        })) || [],
        constraints: constraintsList
      };

      setCurrentGoal(newGoal);
      setPendingActions(newGoal.actions);
      
      toast({
        title: 'Agent Plan Created',
        description: `${newGoal.actions.length} actions planned to achieve your goal`
      });
    } catch (err: any) {
      console.error('Agent planning error:', err);
      toast({
        title: 'Planning Failed',
        description: err.message || 'Failed to create agent plan',
        variant: 'destructive'
      });
    } finally {
      setIsPlanning(false);
    }
  };

  const handleApproveAction = async (actionId: string) => {
    setPendingActions(prev => prev.map(a => 
      a.id === actionId ? { ...a, status: 'approved' } : a
    ));

    if (currentGoal) {
      setCurrentGoal({
        ...currentGoal,
        actions: currentGoal.actions.map(a => 
          a.id === actionId ? { ...a, status: 'approved' } : a
        )
      });
    }

    toast({
      title: 'Action Approved',
      description: 'The agent will execute this action'
    });
  };

  const handleRejectAction = (actionId: string) => {
    setPendingActions(prev => prev.map(a => 
      a.id === actionId ? { ...a, status: 'rejected' } : a
    ));

    if (currentGoal) {
      setCurrentGoal({
        ...currentGoal,
        actions: currentGoal.actions.map(a => 
          a.id === actionId ? { ...a, status: 'rejected' } : a
        )
      });
    }
  };

  const handleExecuteApproved = async () => {
    const approvedActions = pendingActions.filter(a => a.status === 'approved');
    
    if (approvedActions.length === 0) {
      toast({
        title: 'No Actions to Execute',
        description: 'Approve some actions first',
        variant: 'destructive'
      });
      return;
    }

    setIsActive(true);

    for (const action of approvedActions) {
      try {
        if (action.type === 'schedule' && action.taskId && action.details.dueDate) {
          await supabase
            .from('tasks')
            .update({ due_date: action.details.dueDate })
            .eq('id', action.taskId);
        } else if (action.type === 'assign' && action.taskId && action.details.assignTo) {
          await supabase
            .from('tasks')
            .update({ assigned_to: action.details.assignTo })
            .eq('id', action.taskId);
        }

        setPendingActions(prev => prev.map(a => 
          a.id === action.id ? { ...a, status: 'executed' } : a
        ));
      } catch (err) {
        console.error('Action execution error:', err);
      }
    }

    queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    
    const executedCount = approvedActions.length;
    const totalActions = currentGoal?.actions.length || 0;
    const newProgress = Math.round((executedCount / totalActions) * 100);
    
    if (currentGoal) {
      setCurrentGoal({
        ...currentGoal,
        progress: newProgress,
        status: newProgress === 100 ? 'completed' : 'executing'
      });
    }

    setIsActive(false);
    
    toast({
      title: 'Actions Executed',
      description: `${executedCount} actions completed successfully`
    });
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'schedule': return <Calendar className="h-4 w-4" />;
      case 'assign': return <Users className="h-4 w-4" />;
      case 'reschedule': return <Calendar className="h-4 w-4" />;
      case 'alert': return <AlertTriangle className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'approved': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'executed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Agent</CardTitle>
              <CardDescription>Goal-driven autonomous planning</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={isActive ? 'bg-green-500/10 text-green-500' : ''}>
            {isActive ? 'Active' : 'Idle'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!currentGoal ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full gap-2">
                <Target className="h-4 w-4" />
                Set Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Agent Goal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">What do you want to achieve?</label>
                  <Textarea
                    placeholder="e.g., Ship v2 of onboarding by March 31 with current team"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Target Date</label>
                  <Input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Constraints (one per line)</label>
                  <Textarea
                    placeholder="e.g., Don't schedule on weekends&#10;John is on vacation next week"
                    value={constraints}
                    onChange={(e) => setConstraints(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button 
                  onClick={handleCreateGoal} 
                  className="w-full gap-2"
                  disabled={isPlanning}
                >
                  {isPlanning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Planning...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Create Plan
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <div className="space-y-4">
            {/* Goal Status */}
            <div className="p-3 rounded-lg bg-background/50 border border-border/50">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-medium text-sm">{currentGoal.description}</p>
                  <p className="text-xs text-muted-foreground">Target: {currentGoal.targetDate}</p>
                </div>
                <Badge variant="outline" className={
                  currentGoal.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                  currentGoal.status === 'executing' ? 'bg-blue-500/10 text-blue-500' :
                  'bg-amber-500/10 text-amber-500'
                }>
                  {currentGoal.status}
                </Badge>
              </div>
              <Progress value={currentGoal.progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{currentGoal.progress}% complete</p>
            </div>

            {/* Pending Actions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Planned Actions</h4>
                <Button 
                  size="sm" 
                  onClick={handleExecuteApproved}
                  disabled={isActive || pendingActions.filter(a => a.status === 'approved').length === 0}
                  className="gap-1"
                >
                  {isActive ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                  Execute
                </Button>
              </div>
              
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {pendingActions.map((action) => (
                    <div 
                      key={action.id}
                      className="p-2 rounded-lg border border-border/50 bg-background/50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <span className="text-muted-foreground mt-0.5">
                            {getActionIcon(action.type)}
                          </span>
                          <div>
                            <p className="text-sm">{action.description}</p>
                            <Badge variant="outline" className={`${getStatusColor(action.status)} text-xs mt-1`}>
                              {action.status}
                            </Badge>
                          </div>
                        </div>
                        {action.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 w-6 p-0 text-green-500"
                              onClick={() => handleApproveAction(action.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 w-6 p-0 text-red-500"
                              onClick={() => handleRejectAction(action.id)}
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Reset */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setCurrentGoal(null);
                setPendingActions([]);
                setGoalInput('');
                setTargetDate('');
                setConstraints('');
              }}
              className="w-full"
            >
              Reset Agent
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoalDrivenAgent;
