import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task, useCreateTask } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Plus, Loader2, Target, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Goal {
  id: string;
  title: string;
  description: string | null;
  progress: number;
  status: string;
  target_date: string | null;
}

interface AITaskSuggestionsProps {
  projectId: string;
  projectName: string;
  goals: Goal[];
  existingTasks: Task[];
}

interface TaskSuggestion {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedHours: number;
  relatedGoal: string;
  reasoning: string;
}

export const AITaskSuggestions = ({ 
  projectId, 
  projectName, 
  goals, 
  existingTasks 
}: AITaskSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addingIndex, setAddingIndex] = useState<number | null>(null);
  const createTask = useCreateTask();

  const generateSuggestions = async () => {
    if (goals.length === 0) {
      toast.error('Add some project goals first to get AI suggestions');
      return;
    }

    setIsLoading(true);
    setSuggestions([]);

    try {
      const { data, error } = await supabase.functions.invoke('ai-insights', {
        body: {
          type: 'task-suggestions',
          data: {
            goals,
            existingTasks,
            projectName,
          },
        },
      });

      if (error) throw error;

      if (data.result?.suggestions) {
        setSuggestions(data.result.suggestions);
      } else if (data.result?.error) {
        throw new Error(data.result.error);
      }
    } catch (err) {
      console.error('Failed to generate suggestions:', err);
      toast.error('Failed to generate task suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  const addSuggestionAsTask = async (suggestion: TaskSuggestion, index: number) => {
    setAddingIndex(index);
    try {
      await createTask.mutateAsync({
        project_id: projectId,
        title: suggestion.title,
        description: suggestion.description,
        priority: suggestion.priority,
        estimated_hours: suggestion.estimatedHours,
      });
      
      // Remove the added suggestion from the list
      setSuggestions(prev => prev.filter((_, i) => i !== index));
      toast.success('Task created from suggestion');
    } catch (err) {
      toast.error('Failed to create task');
    } finally {
      setAddingIndex(null);
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-copper" />
            AI Task Suggestions
          </span>
          <Button
            size="sm"
            onClick={generateSuggestions}
            disabled={isLoading || goals.length === 0}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isLoading ? 'Analyzing...' : 'Generate'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {goals.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Add project goals to get AI task suggestions</p>
          </div>
        ) : suggestions.length === 0 && !isLoading ? (
          <div className="text-center py-6 text-muted-foreground">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Click "Generate" to get AI-powered task suggestions</p>
            <p className="text-xs mt-1">Based on your {goals.length} project goals</p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-muted/30 border border-border/30 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{suggestion.title}</span>
                      <Badge variant="outline" className={cn("text-xs", getPriorityColor(suggestion.priority))}>
                        {suggestion.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {suggestion.description}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 shrink-0"
                    onClick={() => addSuggestionAsTask(suggestion, index)}
                    disabled={addingIndex === index}
                  >
                    {addingIndex === index ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    ~{suggestion.estimatedHours}h
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    {suggestion.relatedGoal}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground/70 italic">
                  {suggestion.reasoning}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
