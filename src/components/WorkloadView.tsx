import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Task, useUpdateTask } from '@/hooks/useTasks';
import { format, parseISO, isWithinInterval, startOfWeek, endOfWeek, addWeeks } from 'date-fns';
import { Loader2, User, AlertTriangle, Sparkles, ArrowRight, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface WorkloadViewProps {
  projectId?: string;
  weeksToShow?: number;
  hoursPerWeek?: number;
}

interface Profile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface TaskWithProject extends Task {
  project_name?: string;
}

interface MemberWorkload {
  userId: string;
  name: string;
  avatarUrl: string | null;
  tasks: TaskWithProject[];
  totalEstimatedHours: number;
  totalTrackedHours: number;
  weeklyBreakdown: { week: Date; hours: number }[];
}

interface Reassignment {
  taskId: string;
  taskTitle: string;
  currentAssignee: string | null;
  suggestedAssignee: string;
  reason: string;
}

interface WorkloadAnalysis {
  overloaded: string[];
  underutilized: string[];
}

interface AIResult {
  analysis?: WorkloadAnalysis;
  reassignments?: Reassignment[];
}

const WorkloadView = ({ projectId, weeksToShow = 4, hoursPerWeek = 40 }: WorkloadViewProps) => {
  const queryClient = useQueryClient();
  const updateTask = useUpdateTask();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [appliedReassignments, setAppliedReassignments] = useState<Set<string>>(new Set());

  // Fetch all team members with their profiles
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['workload-members', projectId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let memberIds: string[] = [];

      if (projectId) {
        // Get project members
        const { data: projectMembers } = await supabase
          .from('project_members')
          .select('user_id')
          .eq('project_id', projectId);
        
        memberIds = projectMembers?.map(m => m.user_id) || [];
      } else {
        // Get all unique members from user's projects
        const { data: userProjects } = await supabase
          .from('project_members')
          .select('project_id')
          .eq('user_id', user.id);

        if (userProjects && userProjects.length > 0) {
          const projectIds = userProjects.map(p => p.project_id);
          const { data: allMembers } = await supabase
            .from('project_members')
            .select('user_id')
            .in('project_id', projectIds);
          
          memberIds = [...new Set(allMembers?.map(m => m.user_id) || [])];
        }
      }

      if (memberIds.length === 0) return [];

      // Get profiles for all members
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', memberIds);

      return profiles as Profile[];
    },
  });

  // Fetch tasks with assignments
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['workload-tasks', projectId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('tasks')
        .select(`
          *,
          projects:project_id (name)
        `)
        .neq('status', 'completed');

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(task => ({
        ...task,
        project_name: (task.projects as any)?.name || 'Unknown Project'
      })) as TaskWithProject[];
    },
  });

  // Calculate workload per member
  const workloadData = useMemo(() => {
    if (!members || !tasks) return [];

    const weeks = Array.from({ length: weeksToShow }, (_, i) => 
      startOfWeek(addWeeks(new Date(), i), { weekStartsOn: 1 })
    );

    return members.map(member => {
      const memberTasks = tasks.filter(t => t.assigned_to === member.user_id);
      
      const totalEstimatedHours = memberTasks.reduce(
        (sum, t) => sum + (t.estimated_hours || 0), 
        0
      );
      
      const totalTrackedHours = memberTasks.reduce(
        (sum, t) => sum + (t.tracked_hours || 0), 
        0
      );

      const weeklyBreakdown = weeks.map(weekStart => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const weekTasks = memberTasks.filter(t => {
          if (!t.due_date) return false;
          const dueDate = parseISO(t.due_date);
          return isWithinInterval(dueDate, { start: weekStart, end: weekEnd });
        });
        
        const hours = weekTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
        return { week: weekStart, hours };
      });

      return {
        userId: member.user_id,
        name: member.full_name || 'Unknown User',
        avatarUrl: member.avatar_url,
        tasks: memberTasks,
        totalEstimatedHours,
        totalTrackedHours,
        weeklyBreakdown,
      } as MemberWorkload;
    }).filter(m => m.tasks.length > 0 || projectId);
  }, [members, tasks, weeksToShow, projectId]);

  // AI Optimization function
  const handleOptimize = async () => {
    if (!tasks || tasks.length === 0 || !members || members.length === 0) {
      toast.error('Need tasks and team members to optimize');
      return;
    }

    setIsOptimizing(true);
    setAiResult(null);
    setAppliedReassignments(new Set());

    try {
      const teamMembers = members.map(m => ({
        user_id: m.user_id,
        full_name: m.full_name,
        role: 'member'
      }));

      const taskData = tasks.map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        status: t.status,
        due_date: t.due_date,
        estimated_hours: t.estimated_hours,
        tracked_hours: t.tracked_hours,
        assigned_to: members.find(m => m.user_id === t.assigned_to)?.full_name || null
      }));

      const { data, error } = await supabase.functions.invoke('smart-scheduling', {
        body: {
          type: 'workload',
          tasks: taskData,
          teamMembers,
          projectId
        }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setAiResult(data.result);
      toast.success('AI analysis complete');
    } catch (error) {
      console.error('Optimization error:', error);
      toast.error('Failed to optimize workload');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Apply a single reassignment
  const handleApplyReassignment = async (reassignment: Reassignment) => {
    const task = tasks?.find(t => t.id === reassignment.taskId);
    if (!task) {
      toast.error('Task not found');
      return;
    }

    // Find the user ID for the suggested assignee
    const newAssignee = members?.find(m => m.full_name === reassignment.suggestedAssignee);
    if (!newAssignee) {
      toast.error('Team member not found');
      return;
    }

    try {
      await updateTask.mutateAsync({
        id: task.id,
        projectId: task.project_id,
        assigned_to: newAssignee.user_id
      });

      setAppliedReassignments(prev => new Set([...prev, reassignment.taskId]));
      queryClient.invalidateQueries({ queryKey: ['workload-tasks'] });
      toast.success(`Reassigned "${reassignment.taskTitle}" to ${reassignment.suggestedAssignee}`);
    } catch (error) {
      toast.error('Failed to apply reassignment');
    }
  };

  // Calculate capacity status
  const getCapacityStatus = (hours: number, capacity: number) => {
    const percentage = (hours / capacity) * 100;
    if (percentage > 100) return { status: 'overloaded', color: 'text-red-500', bg: 'bg-red-500' };
    if (percentage > 80) return { status: 'high', color: 'text-amber-500', bg: 'bg-amber-500' };
    if (percentage > 50) return { status: 'moderate', color: 'text-emerald-500', bg: 'bg-emerald-500' };
    return { status: 'available', color: 'text-blue-500', bg: 'bg-blue-500' };
  };

  const weeks = Array.from({ length: weeksToShow }, (_, i) => 
    startOfWeek(addWeeks(new Date(), i), { weekStartsOn: 1 })
  );

  if (membersLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!workloadData || workloadData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <User className="h-12 w-12 mb-4 opacity-50" />
        <p>No team members with assigned tasks</p>
        <p className="text-sm">Assign tasks to team members to see workload</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* AI Optimization Panel */}
      <div className="p-4 border-b border-border/50 bg-gradient-to-r from-copper/5 to-transparent">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-copper/20">
              <Sparkles className="h-5 w-5 text-copper" />
            </div>
            <div>
              <h3 className="font-medium">AI Workload Optimizer</h3>
              <p className="text-sm text-muted-foreground">
                Analyze team capacity and get smart reassignment suggestions
              </p>
            </div>
          </div>
          <Button
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="bg-copper hover:bg-copper/90 text-white"
          >
            {isOptimizing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Optimize Workload
              </>
            )}
          </Button>
        </div>
      </div>

      {/* AI Results */}
      {aiResult && (
        <div className="p-4 space-y-4">
          {/* Analysis Summary */}
          {aiResult.analysis && (
            <Card className="bg-muted/20 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Workload Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {aiResult.analysis.overloaded?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">Overloaded</Badge>
                    <span className="text-sm">{aiResult.analysis.overloaded.join(', ')}</span>
                  </div>
                )}
                {aiResult.analysis.underutilized?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-400">Available</Badge>
                    <span className="text-sm">{aiResult.analysis.underutilized.join(', ')}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Reassignment Suggestions */}
          {aiResult.reassignments && aiResult.reassignments.length > 0 && (
            <Card className="bg-muted/20 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Suggested Reassignments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {aiResult.reassignments.map((r, i) => {
                  const isApplied = appliedReassignments.has(r.taskId);
                  return (
                    <div 
                      key={i} 
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border transition-all",
                        isApplied 
                          ? "bg-emerald-500/10 border-emerald-500/30" 
                          : "bg-card/50 border-border/50 hover:border-copper/50"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium truncate">{r.taskTitle}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{r.currentAssignee || 'Unassigned'}</span>
                          <ArrowRight className="h-3 w-3 text-copper" />
                          <span className="text-copper font-medium">{r.suggestedAssignee}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{r.reason}</p>
                      </div>
                      {isApplied ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
                          <Check className="h-3 w-3 mr-1" />
                          Applied
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApplyReassignment(r)}
                          className="shrink-0 ml-3"
                        >
                          Apply
                        </Button>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {aiResult.reassignments?.length === 0 && (
            <Card className="bg-emerald-500/10 border-emerald-500/30">
              <CardContent className="py-4 text-center">
                <Check className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-medium">Workload is well balanced!</p>
                <p className="text-xs text-muted-foreground">No reassignments needed</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Workload Table */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="flex border-b border-border/50 bg-card/50 sticky top-0 z-10">
            <div className="w-[250px] shrink-0 px-4 py-3 border-r border-border/50 font-medium text-sm">
              Team Member
            </div>
            <div className="w-[120px] shrink-0 px-4 py-3 border-r border-border/50 font-medium text-sm text-center">
              Total Load
            </div>
            {weeks.map((week, i) => (
              <div
                key={i}
                className="flex-1 min-w-[100px] px-2 py-3 border-r border-border/30 font-medium text-xs text-center"
              >
                <div className="text-muted-foreground">Week of</div>
                <div>{format(week, 'MMM d')}</div>
              </div>
            ))}
          </div>

          {/* Member rows */}
          {workloadData.map((member) => {
            const capacityStatus = getCapacityStatus(member.totalEstimatedHours, hoursPerWeek * weeksToShow);
            
            return (
              <div
                key={member.userId}
                className="flex border-b border-border/20 hover:bg-muted/10 transition-colors"
              >
                {/* Member info */}
                <div className="w-[250px] shrink-0 px-4 py-3 border-r border-border/30">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-copper/20 text-copper text-xs">
                        {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.tasks.length} task{member.tasks.length !== 1 ? 's' : ''} assigned
                      </p>
                    </div>
                  </div>
                </div>

                {/* Total workload */}
                <div className="w-[120px] shrink-0 px-3 py-3 border-r border-border/30">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className={cn("font-medium", capacityStatus.color)}>
                            {member.totalEstimatedHours}h
                          </span>
                          <span className="text-muted-foreground">
                            / {hoursPerWeek * weeksToShow}h
                          </span>
                        </div>
                        <Progress 
                          value={Math.min((member.totalEstimatedHours / (hoursPerWeek * weeksToShow)) * 100, 100)} 
                          className="h-2"
                        />
                        <div className="flex items-center justify-center">
                          <Badge 
                            variant="outline" 
                            className={cn("text-[10px] px-1.5", capacityStatus.color)}
                          >
                            {capacityStatus.status === 'overloaded' && <AlertTriangle className="h-3 w-3 mr-1" />}
                            {capacityStatus.status}
                          </Badge>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        <p className="font-medium">{member.name}</p>
                        <p className="text-xs">Estimated: {member.totalEstimatedHours}h</p>
                        <p className="text-xs">Tracked: {member.totalTrackedHours}h</p>
                        <p className="text-xs">Capacity: {hoursPerWeek * weeksToShow}h ({weeksToShow} weeks)</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Weekly breakdown */}
                {member.weeklyBreakdown.map((week, i) => {
                  const weekCapacity = getCapacityStatus(week.hours, hoursPerWeek);
                  const percentage = Math.min((week.hours / hoursPerWeek) * 100, 100);
                  
                  return (
                    <div
                      key={i}
                      className="flex-1 min-w-[100px] px-2 py-3 border-r border-border/20"
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="space-y-2">
                            <div className="text-center">
                              <span className={cn("text-sm font-medium", weekCapacity.color)}>
                                {week.hours}h
                              </span>
                            </div>
                            <div className="relative h-16 bg-muted/20 rounded overflow-hidden">
                              <div 
                                className={cn(
                                  "absolute bottom-0 left-0 right-0 transition-all rounded-t",
                                  weekCapacity.bg,
                                  week.hours > hoursPerWeek && "animate-pulse"
                                )}
                                style={{ height: `${percentage}%`, opacity: 0.7 }}
                              />
                              {week.hours > hoursPerWeek && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <AlertTriangle className="h-4 w-4 text-red-500" />
                                </div>
                              )}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            <p className="font-medium">Week of {format(week.week, 'MMM d')}</p>
                            <p className="text-xs">Scheduled: {week.hours}h</p>
                            <p className="text-xs">Capacity: {hoursPerWeek}h</p>
                            {week.hours > hoursPerWeek && (
                              <p className="text-xs text-red-400">
                                Over capacity by {week.hours - hoursPerWeek}h
                              </p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Summary row */}
          <div className="flex border-t-2 border-border/50 bg-muted/10">
            <div className="w-[250px] shrink-0 px-4 py-3 border-r border-border/50 font-medium text-sm">
              Team Total
            </div>
            <div className="w-[120px] shrink-0 px-3 py-3 border-r border-border/50">
              <div className="text-center">
                <span className="text-sm font-bold text-copper">
                  {workloadData.reduce((sum, m) => sum + m.totalEstimatedHours, 0)}h
                </span>
              </div>
            </div>
            {weeks.map((week, i) => {
              const weekTotal = workloadData.reduce((sum, m) => sum + m.weeklyBreakdown[i].hours, 0);
              return (
                <div key={i} className="flex-1 min-w-[100px] px-2 py-3 border-r border-border/20">
                  <div className="text-center">
                    <span className="text-sm font-bold">{weekTotal}h</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkloadView;
