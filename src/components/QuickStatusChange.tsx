import { Task, useUpdateTask } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CheckCircle2, Circle, Clock, ChevronDown, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickStatusChangeProps {
  task: Task;
  variant?: 'dropdown' | 'buttons';
  size?: 'sm' | 'default';
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'To Do', icon: Circle, color: 'text-muted-foreground' },
  { value: 'in_progress', label: 'In Progress', icon: Clock, color: 'text-blue-400' },
  { value: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-emerald-400' },
];

export const QuickStatusChange = ({ 
  task, 
  variant = 'dropdown',
  size = 'default' 
}: QuickStatusChangeProps) => {
  const updateTask = useUpdateTask();

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === task.status) return;
    
    updateTask.mutate({
      id: task.id,
      projectId: task.project_id,
      status: newStatus,
    });
  };

  const currentStatus = STATUS_OPTIONS.find(s => s.value === task.status) || STATUS_OPTIONS[0];
  const CurrentIcon = currentStatus.icon;

  if (variant === 'buttons') {
    return (
      <div className="flex items-center gap-1">
        {STATUS_OPTIONS.map((status, index) => {
          const Icon = status.icon;
          const isActive = task.status === status.value;
          
          return (
            <div key={status.value} className="flex items-center">
              <Button
                size="sm"
                variant={isActive ? 'default' : 'ghost'}
                className={cn(
                  "h-7 px-2 text-xs gap-1.5",
                  isActive && status.value === 'pending' && "bg-muted text-muted-foreground",
                  isActive && status.value === 'in_progress' && "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30",
                  isActive && status.value === 'completed' && "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30",
                  !isActive && "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => handleStatusChange(status.value)}
                disabled={updateTask.isPending}
              >
                <Icon className="w-3.5 h-3.5" />
                {size === 'default' && status.label}
              </Button>
              {index < STATUS_OPTIONS.length - 1 && (
                <ArrowRight className="w-3 h-3 text-muted-foreground/50 mx-0.5" />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={size === 'sm' ? 'sm' : 'default'}
          className={cn(
            "gap-2",
            size === 'sm' && "h-7 px-2 text-xs"
          )}
          disabled={updateTask.isPending}
        >
          <CurrentIcon className={cn("w-4 h-4", currentStatus.color)} />
          <span>{currentStatus.label}</span>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        {STATUS_OPTIONS.map((status) => {
          const Icon = status.icon;
          const isActive = task.status === status.value;
          
          return (
            <DropdownMenuItem
              key={status.value}
              onClick={() => handleStatusChange(status.value)}
              className={cn(
                "gap-2 cursor-pointer",
                isActive && "bg-accent"
              )}
            >
              <Icon className={cn("w-4 h-4", status.color)} />
              <span>{status.label}</span>
              {isActive && (
                <CheckCircle2 className="w-3 h-3 ml-auto text-copper" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
