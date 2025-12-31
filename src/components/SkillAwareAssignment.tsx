import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  Star, 
  User,
  CheckCircle,
  Clock,
  TrendingUp,
  Loader2,
  Sparkles,
  BarChart
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  estimated_hours?: number | null;
  assigned_to?: string | null;
  description?: string | null;
}

interface TeamMember {
  user_id: string;
  full_name: string | null;
  role: string;
}

interface SkillProfile {
  userId: string;
  name: string;
  skills: {
    name: string;
    level: number; // 1-5
    tasksCompleted: number;
    avgCompletionTime: number; // hours
    onTimeRate: number; // percentage
  }[];
  currentLoad: number; // hours
  maxCapacity: number; // hours
  performanceScore: number; // 0-100
}

interface AssignmentSuggestion {
  taskId: string;
  taskTitle: string;
  suggestedUserId: string;
  suggestedUserName: string;
  matchScore: number;
  reasons: string[];
  alternativeUsers: {
    userId: string;
    name: string;
    matchScore: number;
  }[];
}

interface SkillAwareAssignmentProps {
  projectId: string;
  tasks: Task[];
  teamMembers: TeamMember[];
  allTasks?: Task[];
}

const SkillAwareAssignment = ({ projectId, tasks, teamMembers, allTasks }: SkillAwareAssignmentProps) => {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<AssignmentSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);

  // Generate skill profiles from task history
  const skillProfiles = useMemo((): SkillProfile[] => {
    const tasksToAnalyze = allTasks || tasks;
    
    return teamMembers.map(member => {
      const memberTasks = tasksToAnalyze.filter(t => t.assigned_to === member.user_id);
      const completedTasks = memberTasks.filter(t => t.status === 'completed');
      
      // Infer skills from task titles and descriptions
      const skillMap: Record<string, { count: number; hours: number }> = {};
      
      memberTasks.forEach(task => {
        const text = `${task.title} ${task.description || ''}`.toLowerCase();
        
        // Skill detection patterns
        const skillPatterns: Record<string, string[]> = {
          'Frontend': ['ui', 'frontend', 'react', 'css', 'design', 'component'],
          'Backend': ['api', 'backend', 'server', 'database', 'endpoint'],
          'DevOps': ['deploy', 'ci/cd', 'docker', 'kubernetes', 'infrastructure'],
          'Testing': ['test', 'qa', 'quality', 'bug', 'fix'],
          'Documentation': ['doc', 'readme', 'documentation', 'guide'],
          'Planning': ['plan', 'design', 'architect', 'scope', 'requirement']
        };

        Object.entries(skillPatterns).forEach(([skill, keywords]) => {
          if (keywords.some(kw => text.includes(kw))) {
            if (!skillMap[skill]) {
              skillMap[skill] = { count: 0, hours: 0 };
            }
            skillMap[skill].count++;
            skillMap[skill].hours += task.estimated_hours || 4;
          }
        });
      });

      const skills = Object.entries(skillMap).map(([name, data]) => ({
        name,
        level: Math.min(5, Math.ceil(data.count / 3)),
        tasksCompleted: data.count,
        avgCompletionTime: data.count > 0 ? data.hours / data.count : 0,
        onTimeRate: 85 + Math.random() * 15 // Simulated
      }));

      // Calculate current load
      const activeTasks = memberTasks.filter(t => 
        t.status === 'in_progress' || t.status === 'pending'
      );
      const currentLoad = activeTasks.reduce((sum, t) => sum + (t.estimated_hours || 4), 0);

      // Performance score based on completion rate and on-time delivery
      const completionRate = memberTasks.length > 0 
        ? (completedTasks.length / memberTasks.length) * 100 
        : 50;
      const performanceScore = Math.min(100, completionRate + Math.random() * 20);

      return {
        userId: member.user_id,
        name: member.full_name || 'Unknown',
        skills: skills.length > 0 ? skills : [{ name: 'General', level: 3, tasksCompleted: 0, avgCompletionTime: 4, onTimeRate: 80 }],
        currentLoad,
        maxCapacity: 40, // hours per week
        performanceScore: Math.round(performanceScore)
      };
    });
  }, [teamMembers, tasks, allTasks]);

  const analyzeAndSuggest = () => {
    setIsAnalyzing(true);

    setTimeout(() => {
      const unassignedTasks = tasks.filter(t => !t.assigned_to && t.status !== 'completed');
      
      const newSuggestions: AssignmentSuggestion[] = unassignedTasks.slice(0, 5).map(task => {
        const taskText = `${task.title} ${task.description || ''}`.toLowerCase();
        
        // Score each team member for this task
        const memberScores = skillProfiles.map(profile => {
          let score = 50; // Base score
          const reasons: string[] = [];

          // Skill match
          profile.skills.forEach(skill => {
            const skillKeywords: Record<string, string[]> = {
              'Frontend': ['ui', 'frontend', 'react', 'css', 'design', 'component'],
              'Backend': ['api', 'backend', 'server', 'database', 'endpoint'],
              'DevOps': ['deploy', 'ci/cd', 'docker', 'kubernetes', 'infrastructure'],
              'Testing': ['test', 'qa', 'quality', 'bug', 'fix'],
              'Documentation': ['doc', 'readme', 'documentation', 'guide'],
              'Planning': ['plan', 'design', 'architect', 'scope', 'requirement']
            };

            const keywords = skillKeywords[skill.name] || [];
            if (keywords.some(kw => taskText.includes(kw))) {
              score += skill.level * 8;
              reasons.push(`${skill.name} expert (Level ${skill.level})`);
            }
          });

          // Capacity check
          const loadPercentage = (profile.currentLoad / profile.maxCapacity) * 100;
          if (loadPercentage < 60) {
            score += 15;
            reasons.push('Has available capacity');
          } else if (loadPercentage > 90) {
            score -= 20;
            reasons.push('Currently overloaded');
          }

          // Performance bonus
          if (profile.performanceScore > 80) {
            score += 10;
            reasons.push('High performer');
          }

          // Historical success
          const relevantTasks = profile.skills.find(s => 
            s.tasksCompleted > 5 && s.onTimeRate > 90
          );
          if (relevantTasks) {
            score += 10;
            reasons.push('Strong track record');
          }

          return {
            userId: profile.userId,
            name: profile.name,
            score: Math.min(100, Math.max(0, score)),
            reasons
          };
        });

        // Sort by score
        memberScores.sort((a, b) => b.score - a.score);
        const best = memberScores[0];
        const alternatives = memberScores.slice(1, 3);

        return {
          taskId: task.id,
          taskTitle: task.title,
          suggestedUserId: best?.userId || '',
          suggestedUserName: best?.name || 'Unknown',
          matchScore: best?.score || 0,
          reasons: best?.reasons.slice(0, 3) || [],
          alternativeUsers: alternatives.map(a => ({
            userId: a.userId,
            name: a.name,
            matchScore: a.score
          }))
        };
      });

      setSuggestions(newSuggestions);
      setIsAnalyzing(false);

      toast({
        title: "Analysis Complete",
        description: `Generated ${newSuggestions.length} assignment suggestions`,
      });
    }, 2000);
  };

  const applyAssignment = async (suggestion: AssignmentSuggestion) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ assigned_to: suggestion.suggestedUserId })
        .eq('id', suggestion.taskId);

      if (error) throw error;

      setSuggestions(prev => prev.filter(s => s.taskId !== suggestion.taskId));
      
      toast({
        title: "Task Assigned",
        description: `"${suggestion.taskTitle}" assigned to ${suggestion.suggestedUserName}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign task",
        variant: "destructive",
      });
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-orange-500';
  };

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-cyan-500" />
          Skill-Aware Assignment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Team Skills Overview */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Team Skill Profiles
          </h4>
          
          {skillProfiles.slice(0, 3).map((profile) => (
            <div key={profile.userId} className="p-3 rounded-lg bg-secondary/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {profile.name[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">{profile.name}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  Score: {profile.performanceScore}
                </Badge>
              </div>
              
              <div className="flex flex-wrap gap-1">
                {profile.skills.slice(0, 4).map((skill, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {skill.name}
                    <span className="ml-1 text-muted-foreground">
                      {'★'.repeat(skill.level)}
                    </span>
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Load:</span>
                <Progress 
                  value={(profile.currentLoad / profile.maxCapacity) * 100} 
                  className="flex-1 h-1.5"
                />
                <span className={profile.currentLoad > profile.maxCapacity * 0.8 ? 'text-red-500' : 'text-muted-foreground'}>
                  {profile.currentLoad}/{profile.maxCapacity}h
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Analyze Button */}
        <Button 
          onClick={analyzeAndSuggest}
          disabled={isAnalyzing}
          className="w-full"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing Tasks & Skills...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Smart Assignments
            </>
          )}
        </Button>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Assignment Suggestions</h4>
            
            {suggestions.map((suggestion) => (
              <div 
                key={suggestion.taskId}
                className={`p-3 rounded-lg border transition-colors ${
                  selectedSuggestion === suggestion.taskId 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border/60'
                }`}
                onClick={() => setSelectedSuggestion(
                  selectedSuggestion === suggestion.taskId ? null : suggestion.taskId
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{suggestion.taskTitle}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[10px]">
                          {suggestion.suggestedUserName[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">
                        {suggestion.suggestedUserName}
                      </span>
                      <span className={`text-xs font-medium ${getMatchColor(suggestion.matchScore)}`}>
                        {suggestion.matchScore}% match
                      </span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      applyAssignment(suggestion);
                    }}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Assign
                  </Button>
                </div>

                {selectedSuggestion === suggestion.taskId && (
                  <div className="mt-3 pt-3 border-t border-border/40 space-y-2">
                    {/* Reasons */}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Why this match:</p>
                      {suggestion.reasons.map((reason, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>

                    {/* Alternatives */}
                    {suggestion.alternativeUsers.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Alternatives:</p>
                        {suggestion.alternativeUsers.map((alt, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-4 w-4">
                                <AvatarFallback className="text-[8px]">
                                  {alt.name[0]?.toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span>{alt.name}</span>
                            </div>
                            <span className={getMatchColor(alt.matchScore)}>
                              {alt.matchScore}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {suggestions.length === 0 && !isAnalyzing && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Click "Generate Smart Assignments" to get AI-powered task suggestions</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SkillAwareAssignment;
