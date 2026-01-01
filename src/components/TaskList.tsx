import { useState, useCallback } from 'react';
import { Task, useTasks, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskDialog } from '@/components/TaskDialog';
import { TimeTracker } from '@/components/TimeTracker';
import { KanbanBoard } from '@/components/KanbanBoard';
import { TaskNavigation } from '@/components/TaskNavigation';
import { QuickStatusChange } from '@/components/QuickStatusChange';
import { TaskCompletionCelebration } from '@/components/TaskCompletionCelebration';
import { TaskStreak } from '@/components/TaskStreak';
import { XPDisplay } from '@/components/XPDisplay';
import { XPGainAnimation } from '@/components/XPGainAnimation';
import { useTaskStreak } from '@/hooks/useTaskStreak';
import { useGamification, XP_REWARDS } from '@/hooks/useGamification';
import { Plus, Clock, Calendar, Trash2, Edit2, LayoutList, Kanban, Search } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group';

interface TaskListProps {
  projectId: string;
  isOwner: boolean;
}

type ViewMode = 'list' | 'kanban';

export const TaskList = ({ projectId, isOwner }: TaskListProps) => {
  const { data: tasks, isLoading } = useTasks(projectId);
  const streakData = useTaskStreak(tasks);
  const { awardXP } = useGamification();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [trackingTask, setTrackingTask] = useState<Task | null>(null);
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebratingTask, setCelebratingTask] = useState<Task | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [showXPAnimation, setShowXPAnimation] = useState(false);
  const [xpGainData, setXPGainData] = useState({ xpAmount: 0, leveledUp: false, newLevel: 0, streakBonus: 0 });

  const handleSelectTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleStatusToggle = useCallback(async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    
    // Trigger celebration and XP when completing a task
    if (newStatus === 'completed') {
      setCelebratingTask(task);
      setCompletedCount(prev => prev + 1);
      setShowCelebration(true);
      
      // Award XP based on priority
      const xpAmount = task.priority === 'high' 
        ? XP_REWARDS.TASK_COMPLETE_HIGH 
        : task.priority === 'medium' 
          ? XP_REWARDS.TASK_COMPLETE_MEDIUM 
          : XP_REWARDS.TASK_COMPLETE_LOW;
      
      try {
        const result = await awardXP.mutateAsync({ xpAmount, reason: 'task_complete' });
        setXPGainData({
          xpAmount: result.xpEarned,
          leveledUp: result.leveledUp,
          newLevel: result.newLevel,
          streakBonus: result.streakBonus,
        });
        setShowXPAnimation(true);
      } catch (error) {
        console.error('Failed to award XP:', error);
      }
    }
    
    updateTask.mutate({
      id: task.id,
      projectId: task.project_id,
      status: newStatus,
    });
  }, [updateTask, awardXP]);

  const handleCelebrationComplete = useCallback(() => {
    setShowCelebration(false);
    setCelebratingTask(null);
  }, []);

  const handleDelete = () => {
    if (deletingTask) {
      deleteTask.mutate({
        id: deletingTask.id,
        projectId: deletingTask.project_id,
        title: deletingTask.title,
      });
      setDeletingTask(null);
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

  const getDueDateColor = (dueDate: string | null) => {
    if (!dueDate) return '';
    const date = new Date(dueDate);
    if (isPast(date) && !isToday(date)) return 'text-red-400';
    if (isToday(date)) return 'text-yellow-400';
    return 'text-muted-foreground';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const pendingTasks = tasks?.filter(t => t.status !== 'completed') || [];
  const completedTasks = tasks?.filter(t => t.status === 'completed') || [];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-copper" />
            Tasks
            <TaskStreak {...streakData} />
            <XPDisplay variant="compact" />
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsNavigationOpen(true)}
              className="gap-2"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-muted border text-[10px] ml-1">⌘K</kbd>
            </Button>
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(value) => value && setViewMode(value as ViewMode)}
              className="bg-secondary rounded-lg p-1"
            >
              <ToggleGroupItem value="list" aria-label="List view" className="h-8 w-8 p-0">
                <LayoutList className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="kanban" aria-label="Kanban view" className="h-8 w-8 p-0">
                <Kanban className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Task
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {tasks?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No tasks yet. Create your first task to get started.
            </p>
          ) : viewMode === 'kanban' ? (
            <KanbanBoard tasks={tasks || []} onAddTask={() => setIsCreateOpen(true)} />
          ) : (
            <>
              {/* Pending Tasks */}
              {pendingTasks.length > 0 && (
                <div className="space-y-2">
                  {pendingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-smooth group"
                    >
                      <Checkbox
                        checked={task.status === 'completed'}
                        onCheckedChange={() => handleStatusToggle(task)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground">{task.title}</span>
                          <Badge variant="outline" className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <QuickStatusChange task={task} size="sm" />
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          {task.due_date && (
                            <span className={cn("flex items-center gap-1", getDueDateColor(task.due_date))}>
                              <Calendar className="w-3 h-3" />
                              {format(new Date(task.due_date), 'MMM d, yyyy')}
                            </span>
                          )}
                          {(task.estimated_hours || task.tracked_hours) && (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {task.tracked_hours || 0}h / {task.estimated_hours || 0}h
                            </span>
                          )}
                          {task.story_points && (
                            <Badge variant="outline" className="text-xs bg-purple-500/20 text-purple-400 border-purple-500/30">
                              {task.story_points} SP
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => setTrackingTask(task)}
                        >
                          <Clock className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => setEditingTask(task)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        {isOwner && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDeletingTask(task)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Completed Tasks */}
              {completedTasks.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Completed ({completedTasks.length})
                  </h4>
                  <div className="space-y-2">
                    {completedTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 group"
                      >
                        <Checkbox
                          checked={true}
                          onCheckedChange={() => handleStatusToggle(task)}
                        />
                        <span className="flex-1 text-muted-foreground line-through">
                          {task.title}
                        </span>
                        {isOwner && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100"
                            onClick={() => setDeletingTask(task)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <TaskDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        projectId={projectId}
      />

      <TaskDialog
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
        projectId={projectId}
        task={editingTask || undefined}
      />

      <TimeTracker
        open={!!trackingTask}
        onOpenChange={(open) => !open && setTrackingTask(null)}
        task={trackingTask}
      />

      <AlertDialog open={!!deletingTask} onOpenChange={(open) => !open && setDeletingTask(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingTask?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TaskNavigation
        tasks={tasks || []}
        open={isNavigationOpen}
        onOpenChange={setIsNavigationOpen}
        onSelectTask={handleSelectTask}
      />

      <TaskCompletionCelebration
        show={showCelebration}
        taskTitle={celebratingTask?.title}
        onComplete={handleCelebrationComplete}
        variant={completedCount % 5 === 0 && completedCount > 0 ? 'milestone' : completedCount % 3 === 0 ? 'streak' : 'confetti'}
      />

      <XPGainAnimation
        show={showXPAnimation}
        xpAmount={xpGainData.xpAmount}
        leveledUp={xpGainData.leveledUp}
        newLevel={xpGainData.newLevel}
        streakBonus={xpGainData.streakBonus}
        onComplete={() => setShowXPAnimation(false)}
      />
    </>
  );
};
