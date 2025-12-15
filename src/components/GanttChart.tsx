import { useState, useRef, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUpdateTask, Task } from '@/hooks/useTasks';
import { format, addDays, differenceInDays, isSameDay, isWithinInterval, startOfDay, parseISO } from 'date-fns';
import { Loader2, GripVertical, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface GanttChartProps {
  projectId?: string;
  startDate: Date;
  daysToShow: number;
}

interface TaskWithProject extends Task {
  project_name?: string;
}

const GanttChart = ({ projectId, startDate, daysToShow }: GanttChartProps) => {
  const queryClient = useQueryClient();
  const updateTask = useUpdateTask();
  const [draggingTask, setDraggingTask] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const chartRef = useRef<HTMLDivElement>(null);

  // Fetch tasks (all or by project)
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['gantt-tasks', projectId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('tasks')
        .select(`
          *,
          projects:project_id (name)
        `)
        .not('due_date', 'is', null)
        .order('due_date', { ascending: true });

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

  // Generate date columns
  const dateColumns = useMemo(() => {
    return Array.from({ length: daysToShow }, (_, i) => addDays(startDate, i));
  }, [startDate, daysToShow]);

  const today = startOfDay(new Date());
  const columnWidth = 60; // pixels per day

  // Calculate task position and width
  const getTaskStyle = useCallback((task: TaskWithProject) => {
    if (!task.due_date) return null;

    const taskDate = startOfDay(parseISO(task.due_date));
    const estimatedDays = task.estimated_hours ? Math.ceil(task.estimated_hours / 8) : 1;
    const taskStart = addDays(taskDate, -estimatedDays + 1);
    
    const startOffset = differenceInDays(taskStart, startDate);
    const endOffset = differenceInDays(taskDate, startDate);

    // Check if task is visible in current view
    if (endOffset < 0 || startOffset >= daysToShow) return null;

    const visibleStart = Math.max(0, startOffset);
    const visibleEnd = Math.min(daysToShow - 1, endOffset);
    const width = (visibleEnd - visibleStart + 1) * columnWidth;
    const left = visibleStart * columnWidth;

    return { left, width, startOffset, endOffset };
  }, [startDate, daysToShow, columnWidth]);

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    setDraggingTask(taskId);
    
    const chartRect = chartRef.current?.getBoundingClientRect();
    if (chartRect) {
      setDragOffset(e.clientX - chartRect.left);
    }
  };

  // Handle drag move
  const handleDragMove = useCallback((e: React.MouseEvent) => {
    if (!draggingTask || !chartRef.current) return;

    const chartRect = chartRef.current.getBoundingClientRect();
    const newX = e.clientX - chartRect.left;
    const daysDelta = Math.round((newX - dragOffset) / columnWidth);
    
    // Visual feedback during drag would go here
  }, [draggingTask, dragOffset, columnWidth]);

  // Handle drag end
  const handleDragEnd = useCallback(async (e: React.MouseEvent) => {
    if (!draggingTask || !chartRef.current) return;

    const chartRect = chartRef.current.getBoundingClientRect();
    const newX = e.clientX - chartRect.left;
    const daysDelta = Math.round((newX - dragOffset) / columnWidth);

    if (daysDelta !== 0) {
      const task = tasks?.find(t => t.id === draggingTask);
      if (task?.due_date) {
        const newDueDate = addDays(parseISO(task.due_date), daysDelta);
        
        try {
          await updateTask.mutateAsync({
            id: task.id,
            projectId: task.project_id,
            due_date: newDueDate.toISOString(),
          });
          queryClient.invalidateQueries({ queryKey: ['gantt-tasks'] });
        } catch (error) {
          toast.error('Failed to reschedule task');
        }
      }
    }

    setDraggingTask(null);
    setDragOffset(0);
  }, [draggingTask, dragOffset, columnWidth, tasks, updateTask, queryClient]);

  // Get priority color
  const getPriorityColor = (priority: string, status: string) => {
    if (status === 'completed') return 'bg-muted/50 border-dashed border-border';
    switch (priority) {
      case 'high': return 'bg-red-500/80 hover:bg-red-500';
      case 'medium': return 'bg-amber-500/80 hover:bg-amber-500';
      case 'low': return 'bg-emerald-500/80 hover:bg-emerald-500';
      default: return 'bg-primary/80 hover:bg-primary';
    }
  };

  // Group tasks by project
  const tasksByProject = useMemo(() => {
    if (!tasks) return {};
    return tasks.reduce((acc, task) => {
      const key = task.project_name || 'Unknown';
      if (!acc[key]) acc[key] = [];
      acc[key].push(task);
      return acc;
    }, {} as Record<string, TaskWithProject[]>);
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <p>No tasks with due dates found</p>
        <p className="text-sm">Add due dates to your tasks to see them on the timeline</p>
      </div>
    );
  }

  return (
    <div
      ref={chartRef}
      className="overflow-x-auto"
      onMouseMove={draggingTask ? handleDragMove : undefined}
      onMouseUp={draggingTask ? handleDragEnd : undefined}
      onMouseLeave={draggingTask ? handleDragEnd : undefined}
    >
      <div style={{ minWidth: daysToShow * columnWidth + 200 }}>
        {/* Header with dates */}
        <div className="flex border-b border-border/50 sticky top-0 bg-card z-10">
          <div className="w-[200px] shrink-0 px-4 py-2 border-r border-border/50 font-medium text-sm">
            Task
          </div>
          <div className="flex">
            {dateColumns.map((date, i) => (
              <div
                key={i}
                className={cn(
                  "flex flex-col items-center justify-center py-2 border-r border-border/30 text-xs",
                  isSameDay(date, today) && "bg-copper/10"
                )}
                style={{ width: columnWidth }}
              >
                <span className="text-muted-foreground">
                  {format(date, 'EEE')}
                </span>
                <span className={cn(
                  "font-medium",
                  isSameDay(date, today) && "text-copper"
                )}>
                  {format(date, 'd')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks grouped by project */}
        {Object.entries(tasksByProject).map(([projectName, projectTasks]) => (
          <div key={projectName}>
            {/* Project header */}
            {!projectId && (
              <div className="flex border-b border-border/30 bg-muted/20">
                <div className="w-[200px] shrink-0 px-4 py-2 font-medium text-sm text-copper truncate">
                  {projectName}
                </div>
                <div className="flex-1" />
              </div>
            )}

            {/* Task rows */}
            {projectTasks.map((task) => {
              const style = getTaskStyle(task);
              
              return (
                <div
                  key={task.id}
                  className="flex border-b border-border/20 hover:bg-muted/10 transition-colors"
                >
                  {/* Task name */}
                  <div className="w-[200px] shrink-0 px-4 py-3 border-r border-border/30">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                      <span className={cn(
                        "text-sm truncate",
                        task.status === 'completed' && "line-through text-muted-foreground"
                      )}>
                        {task.title}
                      </span>
                    </div>
                  </div>

                  {/* Timeline area */}
                  <div className="flex relative" style={{ height: 44 }}>
                    {/* Grid lines */}
                    {dateColumns.map((date, i) => (
                      <div
                        key={i}
                        className={cn(
                          "border-r border-border/20",
                          isSameDay(date, today) && "bg-copper/5"
                        )}
                        style={{ width: columnWidth }}
                      />
                    ))}

                    {/* Task bar */}
                    {style && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "absolute top-2 h-7 rounded-md cursor-move flex items-center px-2 transition-all border",
                              getPriorityColor(task.priority, task.status),
                              draggingTask === task.id && "opacity-70 scale-105 shadow-lg"
                            )}
                            style={{
                              left: style.left,
                              width: Math.max(style.width, 30),
                            }}
                            onMouseDown={(e) => handleDragStart(e, task.id)}
                          >
                            <span className="text-xs text-white truncate font-medium">
                              {task.title}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <div className="space-y-1">
                            <p className="font-medium">{task.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Due: {task.due_date ? format(parseISO(task.due_date), 'MMM d, yyyy') : 'No due date'}
                            </p>
                            {task.estimated_hours && (
                              <p className="text-xs text-muted-foreground">
                                Est: {task.estimated_hours}h
                              </p>
                            )}
                            <p className="text-xs capitalize">
                              {task.priority} priority • {task.status}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Today indicator line */}
        {dateColumns.some(date => isSameDay(date, today)) && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-copper z-20 pointer-events-none"
            style={{
              left: 200 + differenceInDays(today, startDate) * columnWidth + columnWidth / 2,
            }}
          />
        )}
      </div>
    </div>
  );
};

export default GanttChart;