import { useState, useMemo } from 'react';
import { useSprints, useCreateSprint, useUpdateSprint, useDeleteSprint, useAssignTaskToSprint, Sprint } from '@/hooks/useSprints';
import { useTasks, Task } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar, Plus, Target, Clock, CheckCircle2, Circle, PlayCircle, Trash2, GripVertical, ArrowRight } from 'lucide-react';
import { format, parseISO, differenceInDays, isWithinInterval, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SprintPlanningProps {
  projectId: string;
}

type TaskWithSprint = Task;

const SprintPlanning = ({ projectId }: SprintPlanningProps) => {
  const { data: sprints, isLoading: sprintsLoading } = useSprints(projectId);
  const { data: tasks, isLoading: tasksLoading } = useTasks(projectId);
  const createSprint = useCreateSprint();
  const updateSprint = useUpdateSprint();
  const deleteSprint = useDeleteSprint();
  const assignTask = useAssignTaskToSprint();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSprintName, setNewSprintName] = useState('');
  const [newSprintGoal, setNewSprintGoal] = useState('');
  const [newSprintStart, setNewSprintStart] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newSprintEnd, setNewSprintEnd] = useState(format(addDays(new Date(), 14), 'yyyy-MM-dd'));
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  // Group tasks by sprint
  const tasksBySprint = useMemo(() => {
    const grouped: Record<string, TaskWithSprint[]> = { backlog: [] };
    
    sprints?.forEach(sprint => {
      grouped[sprint.id] = [];
    });

    (tasks as TaskWithSprint[] | undefined)?.forEach(task => {
      if (task.sprint_id && grouped[task.sprint_id]) {
        grouped[task.sprint_id].push(task);
      } else {
        grouped.backlog.push(task);
      }
    });

    return grouped;
  }, [tasks, sprints]);

  // Calculate sprint statistics
  const getSprintStats = (sprintId: string) => {
    const sprintTasks = tasksBySprint[sprintId] || [];
    const total = sprintTasks.length;
    const completed = sprintTasks.filter(t => t.status === 'completed').length;
    const inProgress = sprintTasks.filter(t => t.status === 'in_progress').length;
    const totalHours = sprintTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
    const completedHours = sprintTasks
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.estimated_hours || 0), 0);

    return { total, completed, inProgress, totalHours, completedHours };
  };

  const handleCreateSprint = async () => {
    if (!newSprintName.trim()) {
      toast.error('Sprint name is required');
      return;
    }

    await createSprint.mutateAsync({
      project_id: projectId,
      name: newSprintName,
      goal: newSprintGoal || undefined,
      start_date: new Date(newSprintStart).toISOString(),
      end_date: new Date(newSprintEnd).toISOString(),
    });

    setShowCreateDialog(false);
    setNewSprintName('');
    setNewSprintGoal('');
    setNewSprintStart(format(new Date(), 'yyyy-MM-dd'));
    setNewSprintEnd(format(addDays(new Date(), 14), 'yyyy-MM-dd'));
  };

  const handleStartSprint = async (sprint: Sprint) => {
    await updateSprint.mutateAsync({
      id: sprint.id,
      projectId: sprint.project_id,
      status: 'active',
    });
  };

  const handleCompleteSprint = async (sprint: Sprint) => {
    await updateSprint.mutateAsync({
      id: sprint.id,
      projectId: sprint.project_id,
      status: 'completed',
    });
  };

  const handleDeleteSprint = async (sprint: Sprint) => {
    await deleteSprint.mutateAsync({
      id: sprint.id,
      projectId: sprint.project_id,
    });
  };

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (sprintId: string | null) => {
    if (!draggedTask) return;

    await assignTask.mutateAsync({
      taskId: draggedTask,
      sprintId,
      projectId,
    });

    setDraggedTask(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'completed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getSprintProgress = (sprint: Sprint) => {
    const stats = getSprintStats(sprint.id);
    if (stats.total === 0) return 0;
    return Math.round((stats.completed / stats.total) * 100);
  };

  if (sprintsLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-copper" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Sprint Planning</h2>
          <p className="text-sm text-muted-foreground">
            Organize tasks into time-boxed iterations
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-copper hover:bg-copper/90">
              <Plus className="h-4 w-4 mr-2" />
              New Sprint
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Sprint</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">Sprint Name</label>
                <Input
                  value={newSprintName}
                  onChange={(e) => setNewSprintName(e.target.value)}
                  placeholder="e.g., Sprint 1"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Sprint Goal (optional)</label>
                <Textarea
                  value={newSprintGoal}
                  onChange={(e) => setNewSprintGoal(e.target.value)}
                  placeholder="What do you want to achieve this sprint?"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={newSprintStart}
                    onChange={(e) => setNewSprintStart(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={newSprintEnd}
                    onChange={(e) => setNewSprintEnd(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <Button 
                onClick={handleCreateSprint} 
                className="w-full bg-copper hover:bg-copper/90"
                disabled={createSprint.isPending}
              >
                Create Sprint
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sprint Cards */}
      <div className="grid gap-4">
        {/* Active/Planning Sprints */}
        {sprints?.filter(s => s.status !== 'completed').map(sprint => {
          const stats = getSprintStats(sprint.id);
          const progress = getSprintProgress(sprint);
          const daysLeft = differenceInDays(parseISO(sprint.end_date), new Date());
          const isActive = sprint.status === 'active';

          return (
            <Card 
              key={sprint.id}
              className={cn(
                "bg-card/50 backdrop-blur border-border/50",
                isActive && "border-copper/50"
              )}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(sprint.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{sprint.name}</CardTitle>
                      <Badge className={getStatusColor(sprint.status)}>
                        {sprint.status}
                      </Badge>
                    </div>
                    {sprint.goal && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {sprint.goal}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(parseISO(sprint.start_date), 'MMM d')} - {format(parseISO(sprint.end_date), 'MMM d')}
                      </span>
                      {isActive && (
                        <span className={cn(
                          "flex items-center gap-1",
                          daysLeft < 3 && "text-red-400"
                        )}>
                          <Clock className="h-3 w-3" />
                          {daysLeft > 0 ? `${daysLeft} days left` : 'Ending today'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {sprint.status === 'planning' && (
                      <Button
                        size="sm"
                        onClick={() => handleStartSprint(sprint)}
                        className="bg-emerald-600 hover:bg-emerald-500"
                      >
                        <PlayCircle className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    )}
                    {sprint.status === 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCompleteSprint(sprint)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-red-400"
                      onClick={() => handleDeleteSprint(sprint)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Progress */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{stats.completed}/{stats.total} tasks</span>
                    <span>{stats.completedHours}/{stats.totalHours}h</span>
                    <span className="text-amber-400">{stats.inProgress} in progress</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Sprint Tasks */}
                <div className="space-y-2">
                  {tasksBySprint[sprint.id]?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border/50 rounded-lg">
                      <p className="text-sm">Drag tasks here to add to sprint</p>
                    </div>
                  ) : (
                    tasksBySprint[sprint.id]?.map(task => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => handleDragStart(task.id)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30 cursor-move hover:bg-muted/50 transition-colors",
                          draggedTask === task.id && "opacity-50"
                        )}
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : task.status === 'in_progress' ? (
                          <PlayCircle className="h-4 w-4 text-amber-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={cn(
                          "flex-1 text-sm",
                          task.status === 'completed' && "line-through text-muted-foreground"
                        )}>
                          {task.title}
                        </span>
                        {task.estimated_hours && (
                          <Badge variant="outline" className="text-xs">
                            {task.estimated_hours}h
                          </Badge>
                        )}
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs",
                            task.priority === 'high' && "border-red-500/50 text-red-400",
                            task.priority === 'medium' && "border-amber-500/50 text-amber-400",
                            task.priority === 'low' && "border-emerald-500/50 text-emerald-400"
                          )}
                        >
                          {task.priority}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Completed Sprints (collapsed) */}
        {sprints?.filter(s => s.status === 'completed').length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Completed Sprints</h3>
            {sprints?.filter(s => s.status === 'completed').map(sprint => (
              <Card key={sprint.id} className="bg-muted/20 border-border/30">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-400" />
                      <span className="text-sm">{sprint.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(sprint.start_date), 'MMM d')} - {format(parseISO(sprint.end_date), 'MMM d')}
                      </span>
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-400">
                      {getSprintStats(sprint.id).completed} tasks completed
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Backlog */}
        <Card 
          className="bg-card/30 border-border/30"
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(null)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-muted-foreground">Backlog</CardTitle>
              <Badge variant="outline">
                {tasksBySprint.backlog?.length || 0} tasks
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tasksBySprint.backlog?.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm">No tasks in backlog</p>
                </div>
              ) : (
                tasksBySprint.backlog?.map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/20 cursor-move hover:bg-muted/30 transition-colors",
                      draggedTask === task.id && "opacity-50"
                    )}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : task.status === 'in_progress' ? (
                      <PlayCircle className="h-4 w-4 text-amber-500" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={cn(
                      "flex-1 text-sm",
                      task.status === 'completed' && "line-through text-muted-foreground"
                    )}>
                      {task.title}
                    </span>
                    {task.due_date && (
                      <span className="text-xs text-muted-foreground">
                        Due {format(parseISO(task.due_date), 'MMM d')}
                      </span>
                    )}
                    {task.estimated_hours && (
                      <Badge variant="outline" className="text-xs">
                        {task.estimated_hours}h
                      </Badge>
                    )}
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs",
                        task.priority === 'high' && "border-red-500/50 text-red-400",
                        task.priority === 'medium' && "border-amber-500/50 text-amber-400",
                        task.priority === 'low' && "border-emerald-500/50 text-emerald-400"
                      )}
                    >
                      {task.priority}
                    </Badge>
                    <Tooltip>
                      <TooltipTrigger>
                        <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
                      </TooltipTrigger>
                      <TooltipContent>Drag to add to sprint</TooltipContent>
                    </Tooltip>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SprintPlanning;
