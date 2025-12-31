import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Wrench, 
  Calendar,
  Users,
  ArrowRight,
  Check,
  X,
  Loader2,
  AlertTriangle,
  RefreshCw,
  GitCompare
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';

interface ScheduleChange {
  id: string;
  type: 'reschedule' | 'reassign' | 'scope_cut';
  taskId: string;
  taskTitle: string;
  before: {
    dueDate?: string;
    assignee?: string;
    status?: string;
  };
  after: {
    dueDate?: string;
    assignee?: string;
    status?: string;
  };
  reason: string;
  impact: 'low' | 'medium' | 'high';
}

interface ChangeSet {
  id: string;
  trigger: string;
  createdAt: string;
  changes: ScheduleChange[];
  status: 'pending' | 'approved' | 'rejected';
}

interface SelfHealingScheduleProps {
  projectId: string;
  tasks: any[];
  teamMembers: any[];
}

const detectScheduleIssues = (tasks: any[]): { issues: string[], affectedTasks: any[] } => {
  const now = new Date();
  const issues: string[] = [];
  const affectedTasks: any[] = [];

  // Overdue tasks
  const overdueTasks = tasks.filter(t => 
    t.due_date && new Date(t.due_date) < now && t.status !== 'completed'
  );
  if (overdueTasks.length > 0) {
    issues.push(`${overdueTasks.length} overdue task(s)`);
    affectedTasks.push(...overdueTasks);
  }

  // Blocked tasks
  const blockedTasks = tasks.filter(t => t.status === 'blocked');
  if (blockedTasks.length > 0) {
    issues.push(`${blockedTasks.length} blocked task(s)`);
    affectedTasks.push(...blockedTasks.filter(t => !affectedTasks.includes(t)));
  }

  // Unassigned high priority
  const unassignedHigh = tasks.filter(t => 
    t.priority === 'high' && !t.assigned_to && t.status !== 'completed'
  );
  if (unassignedHigh.length > 0) {
    issues.push(`${unassignedHigh.length} unassigned high priority task(s)`);
    affectedTasks.push(...unassignedHigh.filter(t => !affectedTasks.includes(t)));
  }

  return { issues, affectedTasks };
};

const generateChanges = (affectedTasks: any[], teamMembers: any[]): ScheduleChange[] => {
  const now = new Date();
  const changes: ScheduleChange[] = [];

  affectedTasks.forEach((task, index) => {
    // Overdue -> reschedule
    if (task.due_date && new Date(task.due_date) < now && task.status !== 'completed') {
      const newDate = addDays(now, 3 + index);
      changes.push({
        id: `change-${Date.now()}-${index}`,
        type: 'reschedule',
        taskId: task.id,
        taskTitle: task.title,
        before: { dueDate: task.due_date },
        after: { dueDate: format(newDate, 'yyyy-MM-dd') },
        reason: 'Task is overdue - suggesting new realistic deadline',
        impact: task.priority === 'high' ? 'high' : 'medium'
      });
    }

    // Unassigned high priority -> assign
    if (task.priority === 'high' && !task.assigned_to && task.status !== 'completed') {
      const availableMember = teamMembers.find(m => m.role !== 'owner');
      if (availableMember) {
        changes.push({
          id: `change-${Date.now()}-assign-${index}`,
          type: 'reassign',
          taskId: task.id,
          taskTitle: task.title,
          before: { assignee: 'Unassigned' },
          after: { assignee: availableMember.full_name || 'Team Member' },
          reason: 'High priority task needs an owner',
          impact: 'high'
        });
      }
    }
  });

  return changes;
};

export const SelfHealingSchedule = ({ projectId, tasks, teamMembers }: SelfHealingScheduleProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentChangeSet, setCurrentChangeSet] = useState<ChangeSet | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { issues, affectedTasks } = detectScheduleIssues(tasks || []);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const changes = generateChanges(affectedTasks, teamMembers);
      
      if (changes.length > 0) {
        setCurrentChangeSet({
          id: `changeset-${Date.now()}`,
          trigger: issues.join(', '),
          createdAt: new Date().toISOString(),
          changes,
          status: 'pending'
        });
      }
      
      setIsAnalyzing(false);
      
      toast({
        title: 'Schedule Analyzed',
        description: changes.length > 0 
          ? `${changes.length} fixes proposed`
          : 'No issues requiring fixes'
      });
    }, 1000);
  };

  const handleApproveAll = async () => {
    if (!currentChangeSet) return;
    
    setIsApplying(true);

    for (const change of currentChangeSet.changes) {
      try {
        if (change.type === 'reschedule' && change.after.dueDate) {
          await supabase
            .from('tasks')
            .update({ due_date: change.after.dueDate })
            .eq('id', change.taskId);
        } else if (change.type === 'reassign') {
          // Find team member ID by name
          const member = teamMembers.find(m => m.full_name === change.after.assignee);
          if (member) {
            await supabase
              .from('tasks')
              .update({ assigned_to: member.user_id })
              .eq('id', change.taskId);
          }
        }
      } catch (err) {
        console.error('Failed to apply change:', err);
      }
    }

    queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    
    setCurrentChangeSet({
      ...currentChangeSet,
      status: 'approved'
    });
    
    setIsApplying(false);
    
    toast({
      title: 'Changes Applied',
      description: `${currentChangeSet.changes.length} schedule fixes applied`
    });
  };

  const handleReject = () => {
    setCurrentChangeSet(null);
    toast({
      title: 'Changes Rejected',
      description: 'No changes were applied'
    });
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'low': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Wrench className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Self-Healing</CardTitle>
              <CardDescription>Automatic schedule recovery</CardDescription>
            </div>
          </div>
          {issues.length > 0 && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-500">
              {issues.length} issue{issues.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Issues */}
        {issues.length > 0 && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 text-amber-500 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Detected Issues</span>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              {issues.map((issue, i) => (
                <li key={i}>• {issue}</li>
              ))}
            </ul>
          </div>
        )}

        {!currentChangeSet ? (
          <Button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing || issues.length === 0}
            className="w-full gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Generate Fixes
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-3">
            {/* Change Set Header */}
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
                {currentChangeSet.changes.length} proposed changes
              </Badge>
              <div className="flex gap-1">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 gap-1 text-green-500"
                  onClick={handleApproveAll}
                  disabled={isApplying || currentChangeSet.status !== 'pending'}
                >
                  {isApplying ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                  Apply All
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 gap-1 text-red-500"
                  onClick={handleReject}
                  disabled={currentChangeSet.status !== 'pending'}
                >
                  <X className="h-3 w-3" />
                  Reject
                </Button>
              </div>
            </div>

            {/* Changes Diff */}
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {currentChangeSet.changes.map((change) => (
                  <div 
                    key={change.id}
                    className="p-2 rounded-lg border border-border/50 bg-background/50"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-sm font-medium">{change.taskTitle}</span>
                      <Badge variant="outline" className={`${getImpactColor(change.impact)} text-xs`}>
                        {change.impact}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      {change.type === 'reschedule' ? (
                        <Calendar className="h-3 w-3" />
                      ) : (
                        <Users className="h-3 w-3" />
                      )}
                      <span className="line-through text-red-400">
                        {change.before.dueDate || change.before.assignee}
                      </span>
                      <ArrowRight className="h-3 w-3" />
                      <span className="text-green-400">
                        {change.after.dueDate || change.after.assignee}
                      </span>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">{change.reason}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {currentChangeSet.status === 'approved' && (
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                <p className="text-xs text-green-500">✓ All changes applied successfully</p>
              </div>
            )}
          </div>
        )}

        {issues.length === 0 && !currentChangeSet && (
          <div className="text-center py-4">
            <Wrench className="h-8 w-8 mx-auto mb-2 text-green-500/50" />
            <p className="text-sm text-muted-foreground">Schedule is healthy</p>
            <p className="text-xs text-muted-foreground">No fixes needed</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SelfHealingSchedule;
