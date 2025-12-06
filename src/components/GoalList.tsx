import { useState } from "react";
import { useGoals, Goal, Milestone } from "@/hooks/useGoals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronRight,
  Calendar,
  Flag
} from "lucide-react";
import { format } from "date-fns";
import { GoalDialog } from "./GoalDialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface GoalListProps {
  projectId: string;
}

export const GoalList = ({ projectId }: GoalListProps) => {
  const { goals, isLoading, toggleMilestone, addMilestone, deleteMilestone, deleteGoal } = useGoals(projectId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const [newMilestone, setNewMilestone] = useState<{ goalId: string; title: string } | null>(null);

  const toggleExpand = (goalId: string) => {
    const next = new Set(expandedGoals);
    if (next.has(goalId)) {
      next.delete(goalId);
    } else {
      next.add(goalId);
    }
    setExpandedGoals(next);
  };

  const calculateProgress = (milestones: Milestone[] | undefined) => {
    if (!milestones || milestones.length === 0) return 0;
    const completed = milestones.filter((m) => m.completed).length;
    return Math.round((completed / milestones.length) * 100);
  };

  const getStatusBadge = (status: string, progress: number) => {
    if (progress === 100) return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Completed</Badge>;
    if (status === "in_progress") return <Badge className="bg-primary/20 text-primary border-primary/30">In Progress</Badge>;
    return <Badge variant="outline">Not Started</Badge>;
  };

  const handleAddMilestone = async (goalId: string) => {
    if (newMilestone && newMilestone.title.trim()) {
      await addMilestone.mutateAsync({ goalId, title: newMilestone.title });
      setNewMilestone(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-primary" />
          Goals & Milestones
        </CardTitle>
        <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          Add Goal
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No goals yet. Create your first goal to track progress.</p>
          </div>
        ) : (
          goals.map((goal) => {
            const progress = calculateProgress(goal.milestones);
            const isExpanded = expandedGoals.has(goal.id);

            return (
              <Collapsible key={goal.id} open={isExpanded} onOpenChange={() => toggleExpand(goal.id)}>
                <div className="border border-border/50 rounded-lg p-4 bg-background/50">
                  <div className="flex items-start justify-between gap-4">
                    <CollapsibleTrigger className="flex items-start gap-3 flex-1 text-left">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground mt-0.5" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium">{goal.title}</h4>
                          {getStatusBadge(goal.status, progress)}
                        </div>
                        {goal.description && (
                          <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                        )}
                        {goal.target_date && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                            <Calendar className="h-3 w-3" />
                            Target: {format(new Date(goal.target_date), "MMM d, yyyy")}
                          </div>
                        )}
                      </div>
                    </CollapsibleTrigger>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-2xl font-bold text-primary">{progress}%</span>
                        <Progress value={progress} className="w-24 h-2 mt-1" />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteGoal.mutate(goal.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <CollapsibleContent className="mt-4">
                    <div className="ml-8 space-y-2">
                      <h5 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Flag className="h-3 w-3" />
                        Milestones ({goal.milestones?.filter((m) => m.completed).length || 0}/{goal.milestones?.length || 0})
                      </h5>
                      
                      {goal.milestones && goal.milestones.length > 0 ? (
                        <div className="space-y-2">
                          {goal.milestones.map((milestone) => (
                            <div
                              key={milestone.id}
                              className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
                                milestone.completed ? "bg-emerald-500/10" : "bg-muted/30"
                              }`}
                            >
                              <Checkbox
                                checked={milestone.completed}
                                onCheckedChange={(checked) =>
                                  toggleMilestone.mutate({
                                    milestoneId: milestone.id,
                                    completed: checked as boolean,
                                  })
                                }
                              />
                              <span
                                className={`flex-1 text-sm ${
                                  milestone.completed ? "line-through text-muted-foreground" : ""
                                }`}
                              >
                                {milestone.title}
                              </span>
                              {milestone.completed_at && (
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(milestone.completed_at), "MMM d")}
                                </span>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-50 hover:opacity-100"
                                onClick={() => deleteMilestone.mutate(milestone.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No milestones yet</p>
                      )}

                      {/* Add milestone input */}
                      {newMilestone?.goalId === goal.id ? (
                        <div className="flex gap-2">
                          <Input
                            value={newMilestone.title}
                            onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                            placeholder="Milestone title..."
                            className="h-8 text-sm"
                            onKeyDown={(e) => e.key === "Enter" && handleAddMilestone(goal.id)}
                          />
                          <Button size="sm" className="h-8" onClick={() => handleAddMilestone(goal.id)}>
                            Add
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8" onClick={() => setNewMilestone(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setNewMilestone({ goalId: goal.id, title: "" })}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Milestone
                        </Button>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })
        )}
      </CardContent>

      <GoalDialog
        projectId={projectId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </Card>
  );
};
