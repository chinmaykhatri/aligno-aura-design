import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { 
  BookOpen, 
  Calendar,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Clock,
  Search,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText,
  MessageSquare
} from "lucide-react";
import { useSprints } from "@/hooks/useSprints";
import { useTasks } from "@/hooks/useTasks";
import { useActivities } from "@/hooks/useActivities";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AIProjectHistorianProps {
  projectId: string;
  projectName: string;
}

interface SprintSummary {
  sprintId: string;
  sprintName: string;
  period: string;
  status: string;
  summary: string;
  stats: {
    tasksCompleted: number;
    tasksPlanned: number;
    storyPoints: number;
    hoursLogged: number;
  };
  keyDecisions: string[];
  scopeChanges: string[];
  learnings: string[];
  risks: string[];
}

interface HistoricalQuery {
  question: string;
  answer: string;
  sources: string[];
}

const AIProjectHistorian = ({ projectId, projectName }: AIProjectHistorianProps) => {
  const { toast } = useToast();
  const [expandedSprint, setExpandedSprint] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<SprintSummary[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [query, setQuery] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryResult, setQueryResult] = useState<HistoricalQuery | null>(null);

  const { data: sprints } = useSprints(projectId);
  const { data: tasks } = useTasks(projectId);
  const { data: activitiesData } = useActivities({ projectId });
  const activities = activitiesData?.data || [];

  const generateSprintSummaries = async () => {
    setIsGenerating(true);

    try {
      const completedSprints = sprints?.filter(s => s.status === 'completed') || [];
      const activeSprint = sprints?.find(s => s.status === 'active');
      const allSprints = activeSprint ? [...completedSprints, activeSprint] : completedSprints;

      const newSummaries: SprintSummary[] = allSprints.map(sprint => {
        const sprintTasks = tasks?.filter(t => t.sprint_id === sprint.id) || [];
        const completedTasks = sprintTasks.filter(t => t.status === 'completed');
        const totalPoints = sprintTasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
        const completedPoints = completedTasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
        const trackedHours = sprintTasks.reduce((sum, t) => sum + (t.tracked_hours || 0), 0);

        // Analyze activities for this sprint period
        const sprintStart = new Date(sprint.start_date);
        const sprintEnd = new Date(sprint.end_date);
        const sprintActivities = activities?.filter(a => {
          const actDate = new Date(a.created_at);
          return actDate >= sprintStart && actDate <= sprintEnd;
        }) || [];

        // Generate insights
        const completionRate = sprintTasks.length > 0 
          ? Math.round((completedTasks.length / sprintTasks.length) * 100) 
          : 0;
        
        const keyDecisions: string[] = [];
        const scopeChanges: string[] = [];
        const learnings: string[] = [];
        const risks: string[] = [];

        // Analyze task patterns
        const highPriorityIncomplete = sprintTasks.filter(
          t => t.priority === 'high' && t.status !== 'completed'
        );
        if (highPriorityIncomplete.length > 0) {
          risks.push(`${highPriorityIncomplete.length} high-priority tasks not completed`);
        }

        const addedDuringSprint = sprintActivities.filter(
          a => a.activity_type === 'task_created'
        ).length;
        if (addedDuringSprint > 2) {
          scopeChanges.push(`${addedDuringSprint} tasks added during sprint`);
        }

        if (completionRate >= 90) {
          learnings.push("Sprint goals mostly achieved - maintain current velocity");
        } else if (completionRate < 50) {
          learnings.push("Consider reducing sprint scope for better predictability");
        }

        if (totalPoints > 0 && completedPoints / totalPoints < 0.7) {
          keyDecisions.push("Story point estimation may need calibration");
        }

        // Build summary text
        let summary = `${sprint.name} ran from ${sprintStart.toLocaleDateString()} to ${sprintEnd.toLocaleDateString()}. `;
        summary += `The team completed ${completedTasks.length} of ${sprintTasks.length} tasks (${completionRate}% completion rate). `;
        if (sprint.goal) {
          summary += `Sprint goal: "${sprint.goal}". `;
        }
        if (completionRate >= 80) {
          summary += "This was a successful sprint with strong delivery.";
        } else if (completionRate >= 50) {
          summary += "Mixed results with room for improvement.";
        } else {
          summary += "Challenging sprint with significant scope gaps.";
        }

        return {
          sprintId: sprint.id,
          sprintName: sprint.name,
          period: `${sprintStart.toLocaleDateString()} - ${sprintEnd.toLocaleDateString()}`,
          status: sprint.status,
          summary,
          stats: {
            tasksCompleted: completedTasks.length,
            tasksPlanned: sprintTasks.length,
            storyPoints: completedPoints,
            hoursLogged: Math.round(trackedHours)
          },
          keyDecisions,
          scopeChanges,
          learnings,
          risks
        };
      });

      setSummaries(newSummaries.reverse()); // Most recent first
      
      toast({
        title: "History Generated",
        description: `Summarized ${newSummaries.length} sprints`,
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Could not generate sprint summaries",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuery = async () => {
    if (!query.trim()) return;

    setIsQuerying(true);
    
    // Simulate AI-powered historical query
    setTimeout(() => {
      const lowerQuery = query.toLowerCase();
      let answer = "";
      const sources: string[] = [];

      if (lowerQuery.includes("delay") || lowerQuery.includes("late")) {
        const delayedTasks = tasks?.filter(t => 
          t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
        ) || [];
        answer = `Based on project history, there are ${delayedTasks.length} tasks that experienced delays. Common causes include scope changes mid-sprint, dependency blockers, and underestimated complexity.`;
        sources.push("Task history", "Sprint retrospectives");
      } else if (lowerQuery.includes("velocity") || lowerQuery.includes("performance")) {
        const completedCount = tasks?.filter(t => t.status === 'completed').length || 0;
        answer = `The team has completed ${completedCount} tasks across all sprints. Velocity has been trending ${Math.random() > 0.5 ? 'upward' : 'stable'} based on recent sprint performance.`;
        sources.push("Sprint metrics", "Velocity charts");
      } else if (lowerQuery.includes("decision") || lowerQuery.includes("why")) {
        answer = `Key decisions in this project include: prioritizing core features over nice-to-haves, adopting sprint-based delivery, and implementing automated testing. These decisions were driven by timeline constraints and quality requirements.`;
        sources.push("Activity logs", "Sprint planning notes");
      } else {
        answer = `Based on the project history for "${projectName}", I found relevant information across ${sprints?.length || 0} sprints and ${tasks?.length || 0} tasks. For more specific insights, try asking about delays, velocity, or specific decisions.`;
        sources.push("Project overview", "Sprint summaries");
      }

      setQueryResult({
        question: query,
        answer,
        sources
      });
      setIsQuerying(false);
    }, 1500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-500';
      case 'active': return 'bg-blue-500/10 text-blue-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookOpen className="h-5 w-5 text-amber-500" />
          AI Project Historian
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Query Interface */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Ask about project history..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
              className="flex-1"
            />
            <Button 
              size="icon" 
              onClick={handleQuery}
              disabled={isQuerying || !query.trim()}
            >
              {isQuerying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Try: "Why was the payments feature delayed?" or "What was our velocity trend?"
          </p>
        </div>

        {/* Query Result */}
        {queryResult && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">{queryResult.question}</p>
                <p className="text-sm text-muted-foreground mt-1">{queryResult.answer}</p>
                <div className="flex gap-1 mt-2">
                  {queryResult.sources.map((source, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {source}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generate Summaries Button */}
        <Button 
          onClick={generateSprintSummaries}
          disabled={isGenerating}
          variant="outline"
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating History...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Generate Sprint Summaries
            </>
          )}
        </Button>

        {/* Sprint Summaries */}
        {summaries.length > 0 && (
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {summaries.map((summary) => (
                <div 
                  key={summary.sprintId}
                  className="border border-border/60 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedSprint(
                      expandedSprint === summary.sprintId ? null : summary.sprintId
                    )}
                    className="w-full p-3 flex items-center justify-between hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{summary.sprintName}</span>
                      <Badge variant="outline" className={getStatusColor(summary.status)}>
                        {summary.status}
                      </Badge>
                    </div>
                    {expandedSprint === summary.sprintId ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  {expandedSprint === summary.sprintId && (
                    <div className="p-3 pt-0 space-y-3 text-sm">
                      <p className="text-xs text-muted-foreground">{summary.period}</p>
                      
                      <p className="text-muted-foreground">{summary.summary}</p>

                      {/* Stats */}
                      <div className="grid grid-cols-4 gap-2">
                        <div className="text-center p-2 bg-secondary/30 rounded">
                          <CheckCircle className="h-3 w-3 mx-auto mb-1 text-green-500" />
                          <p className="font-medium">{summary.stats.tasksCompleted}/{summary.stats.tasksPlanned}</p>
                          <p className="text-[10px] text-muted-foreground">Tasks</p>
                        </div>
                        <div className="text-center p-2 bg-secondary/30 rounded">
                          <TrendingUp className="h-3 w-3 mx-auto mb-1 text-blue-500" />
                          <p className="font-medium">{summary.stats.storyPoints}</p>
                          <p className="text-[10px] text-muted-foreground">Points</p>
                        </div>
                        <div className="text-center p-2 bg-secondary/30 rounded">
                          <Clock className="h-3 w-3 mx-auto mb-1 text-purple-500" />
                          <p className="font-medium">{summary.stats.hoursLogged}h</p>
                          <p className="text-[10px] text-muted-foreground">Logged</p>
                        </div>
                        <div className="text-center p-2 bg-secondary/30 rounded">
                          <AlertTriangle className="h-3 w-3 mx-auto mb-1 text-orange-500" />
                          <p className="font-medium">{summary.risks.length}</p>
                          <p className="text-[10px] text-muted-foreground">Risks</p>
                        </div>
                      </div>

                      {/* Learnings */}
                      {summary.learnings.length > 0 && (
                        <div>
                          <p className="text-xs font-medium mb-1">Key Learnings</p>
                          {summary.learnings.map((learning, i) => (
                            <p key={i} className="text-xs text-muted-foreground">• {learning}</p>
                          ))}
                        </div>
                      )}

                      {/* Scope Changes */}
                      {summary.scopeChanges.length > 0 && (
                        <div>
                          <p className="text-xs font-medium mb-1">Scope Changes</p>
                          {summary.scopeChanges.map((change, i) => (
                            <p key={i} className="text-xs text-muted-foreground">• {change}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {summaries.length === 0 && !isGenerating && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Generate sprint summaries to build project history</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIProjectHistorian;
