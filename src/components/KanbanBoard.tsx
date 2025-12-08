import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Task, useUpdateTask } from "@/hooks/useTasks";
import { Calendar, Clock, GripVertical, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface KanbanBoardProps {
  tasks: Task[];
  onAddTask?: () => void;
}

const COLUMNS = [
  { id: "pending", title: "To Do", color: "bg-muted" },
  { id: "in_progress", title: "In Progress", color: "bg-blue-500/10" },
  { id: "completed", title: "Completed", color: "bg-green-500/10" },
];

const priorityColors: Record<string, string> = {
  high: "bg-destructive/20 text-destructive border-destructive/30",
  medium: "bg-amber-500/20 text-amber-600 border-amber-500/30",
  low: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30",
};

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
}

function TaskCard({ task, isDragging }: TaskCardProps) {
  return (
    <Card
      className={cn(
        "cursor-grab active:cursor-grabbing transition-all duration-200",
        isDragging && "opacity-50 rotate-2 scale-105 shadow-xl"
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <p className="font-medium text-sm leading-tight truncate">{task.title}</p>
            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={cn("text-xs", priorityColors[task.priority])}
              >
                {task.priority}
              </Badge>
              {task.due_date && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(task.due_date), "MMM d")}
                </div>
              )}
              {task.estimated_hours && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {task.tracked_hours || 0}/{task.estimated_hours}h
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface SortableTaskProps {
  task: Task;
}

function SortableTask({ task }: SortableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} isDragging={isDragging} />
    </div>
  );
}

interface KanbanColumnProps {
  column: typeof COLUMNS[0];
  tasks: Task[];
  onAddTask?: () => void;
}

function KanbanColumn({ column, tasks, onAddTask }: KanbanColumnProps) {
  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] flex-1">
      <Card className={cn("h-full", column.color)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              {column.title}
              <Badge variant="secondary" className="text-xs">
                {tasks.length}
              </Badge>
            </CardTitle>
            {column.id === "pending" && onAddTask && (
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onAddTask}>
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-2 pt-0">
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2 min-h-[200px]">
              {tasks.map((task) => (
                <SortableTask key={task.id} task={task} />
              ))}
              {tasks.length === 0 && (
                <div className="flex items-center justify-center h-[100px] text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                  No tasks
                </div>
              )}
            </div>
          </SortableContext>
        </CardContent>
      </Card>
    </div>
  );
}

export function KanbanBoard({ tasks, onAddTask }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const updateTask = useUpdateTask();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const getTasksByStatus = (status: string) =>
    tasks.filter((task) => task.status === status);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    // Find which column the task was dropped on
    let newStatus = activeTask.status;

    // Check if dropped on a column (empty area)
    const overColumn = COLUMNS.find((col) => col.id === over.id);
    if (overColumn) {
      newStatus = overColumn.id;
    } else {
      // Dropped on another task - find that task's status
      const overTask = tasks.find((t) => t.id === over.id);
      if (overTask) {
        newStatus = overTask.status;
      }
    }

    // Update task status if changed
    if (newStatus !== activeTask.status) {
      updateTask.mutate({
        id: activeTask.id,
        projectId: activeTask.project_id,
        status: newStatus,
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={getTasksByStatus(column.id)}
            onAddTask={column.id === "pending" ? onAddTask : undefined}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} isDragging />}
      </DragOverlay>
    </DndContext>
  );
}
