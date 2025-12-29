import { useState, useEffect, useCallback } from 'react';
import { Task } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Search, ArrowUp, ArrowDown, CornerDownLeft, CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskNavigationProps {
  tasks: Task[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTask: (task: Task) => void;
}

export const TaskNavigation = ({
  tasks,
  open,
  onOpenChange,
  onSelectTask,
}: TaskNavigationProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedTasks = {
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    pending: filteredTasks.filter(t => t.status === 'pending'),
    completed: filteredTasks.filter(t => t.status === 'completed'),
  };

  const flatTasks = [...groupedTasks.in_progress, ...groupedTasks.pending, ...groupedTasks.completed];

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!open) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, flatTasks.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (flatTasks[selectedIndex]) {
          onSelectTask(flatTasks[selectedIndex]);
          onOpenChange(false);
        }
        break;
    }
  }, [open, flatTasks, selectedIndex, onSelectTask, onOpenChange]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Global keyboard shortcut to open navigation
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [open, onOpenChange]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-400" />;
      default:
        return <Circle className="w-4 h-4 text-muted-foreground" />;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Navigate Tasks
          </DialogTitle>
        </DialogHeader>
        <Command className="border-0">
          <CommandInput 
            placeholder="Search tasks..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No tasks found.</CommandEmpty>
            
            {groupedTasks.in_progress.length > 0 && (
              <CommandGroup heading="In Progress">
                {groupedTasks.in_progress.map((task, index) => (
                  <CommandItem
                    key={task.id}
                    value={task.id}
                    onSelect={() => {
                      onSelectTask(task);
                      onOpenChange(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 cursor-pointer",
                      flatTasks.indexOf(task) === selectedIndex && "bg-accent"
                    )}
                  >
                    {getStatusIcon(task.status)}
                    <span className="flex-1 truncate">{task.title}</span>
                    <Badge variant="outline" className={cn("text-xs", getPriorityColor(task.priority))}>
                      {task.priority}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            
            {groupedTasks.in_progress.length > 0 && groupedTasks.pending.length > 0 && (
              <CommandSeparator />
            )}
            
            {groupedTasks.pending.length > 0 && (
              <CommandGroup heading="To Do">
                {groupedTasks.pending.map((task) => (
                  <CommandItem
                    key={task.id}
                    value={task.id}
                    onSelect={() => {
                      onSelectTask(task);
                      onOpenChange(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 cursor-pointer",
                      flatTasks.indexOf(task) === selectedIndex && "bg-accent"
                    )}
                  >
                    {getStatusIcon(task.status)}
                    <span className="flex-1 truncate">{task.title}</span>
                    <Badge variant="outline" className={cn("text-xs", getPriorityColor(task.priority))}>
                      {task.priority}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            
            {(groupedTasks.in_progress.length > 0 || groupedTasks.pending.length > 0) && groupedTasks.completed.length > 0 && (
              <CommandSeparator />
            )}
            
            {groupedTasks.completed.length > 0 && (
              <CommandGroup heading="Completed">
                {groupedTasks.completed.map((task) => (
                  <CommandItem
                    key={task.id}
                    value={task.id}
                    onSelect={() => {
                      onSelectTask(task);
                      onOpenChange(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 cursor-pointer opacity-60",
                      flatTasks.indexOf(task) === selectedIndex && "bg-accent"
                    )}
                  >
                    {getStatusIcon(task.status)}
                    <span className="flex-1 truncate line-through">{task.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
        <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <ArrowUp className="w-3 h-3" />
              <ArrowDown className="w-3 h-3" />
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="w-3 h-3" />
              Select
            </span>
          </div>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px]">⌘</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px] ml-1">K</kbd>
            to open
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
};
