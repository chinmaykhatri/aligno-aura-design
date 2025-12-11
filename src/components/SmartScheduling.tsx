import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, 
  Calendar, 
  Users, 
  AlertTriangle, 
  Loader2,
  Lightbulb,
  Clock,
  UserCheck,
  Bell,
  ChevronRight,
  Check,
  Play
} from 'lucide-react';
import { useSmartScheduling, SchedulingSuggestion, ScheduleItem, DeadlineAlert } from '@/hooks/useSmartScheduling';

interface Task {
  id: string;
  title: string;
  priority: string;
  status: string;
  due_date: string | null;
  estimated_hours: number | null;
  tracked_hours: number | null;
  assigned_to: string | null;
}

interface TeamMember {
  user_id: string;
  full_name: string | null;
  role: string;
}

interface SmartSchedulingProps {
  projectId: string;
  tasks: Task[];
  teamMembers: TeamMember[];
}

const SmartScheduling = ({ projectId, tasks, teamMembers }: SmartSchedulingProps) => {
  const [activeTab, setActiveTab] = useState('suggestions');
  const { 
    isLoading, 
    isApplying,
    suggestions, 
    schedule, 
    workload, 
    alerts, 
    fetchSchedulingData,
    applyScheduleItem,
    applyReassignment,
    applyAllSchedule,
    applyAllReassignments
  } = useSmartScheduling(projectId);

  const handleAnalyze = (type: 'suggestions' | 'auto-schedule' | 'workload' | 'deadline-alerts') => {
    fetchSchedulingData(type, tasks, teamMembers, projectId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'medium': return 'bg-primary/20 text-primary border-primary/30';
      case 'low': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'warning': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
      case 'info': return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getTimeBlockIcon = (block: string) => {
    switch (block) {
      case 'morning': return '🌅';
      case 'afternoon': return '☀️';
      case 'evening': return '🌙';
      default: return '📅';
    }
  };

  const unappliedScheduleCount = schedule.filter(s => !s.applied).length;
  const unappliedReassignmentCount = workload?.reassignments.filter(r => !r.applied).length || 0;

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Smart Scheduling
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="suggestions" className="text-xs">
              <Lightbulb className="h-3 w-3 mr-1" />
              Suggestions
            </TabsTrigger>
            <TabsTrigger value="auto-schedule" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="workload" className="text-xs">
              <UserCheck className="h-3 w-3 mr-1" />
              Workload
            </TabsTrigger>
            <TabsTrigger value="alerts" className="text-xs">
              <Bell className="h-3 w-3 mr-1" />
              Alerts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suggestions" className="space-y-3">
            <Button 
              onClick={() => handleAnalyze('suggestions')} 
              disabled={isLoading || tasks.length === 0}
              className="w-full"
              size="sm"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Analyze Tasks
            </Button>
            
            <ScrollArea className="h-[200px]">
              {suggestions.length > 0 ? (
                <div className="space-y-2">
                  {suggestions.map((s, i) => (
                    <div key={i} className="p-3 rounded-lg bg-background/50 border border-border/50">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium">{s.title}</h4>
                        <Badge className={`text-xs ${getPriorityColor(s.priority)}`}>
                          {s.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Lightbulb className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-xs">Click analyze to get AI suggestions</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="auto-schedule" className="space-y-3">
            <div className="flex gap-2">
              <Button 
                onClick={() => handleAnalyze('auto-schedule')} 
                disabled={isLoading || tasks.length === 0}
                className="flex-1"
                size="sm"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Calendar className="h-4 w-4 mr-2" />}
                Generate Schedule
              </Button>
              {unappliedScheduleCount > 0 && (
                <Button 
                  onClick={applyAllSchedule} 
                  disabled={!!isApplying}
                  size="sm"
                  variant="secondary"
                >
                  <Play className="h-4 w-4 mr-1" />
                  Apply All ({unappliedScheduleCount})
                </Button>
              )}
            </div>
            
            <ScrollArea className="h-[200px]">
              {schedule.length > 0 ? (
                <div className="space-y-2">
                  {schedule.map((s, i) => (
                    <div key={i} className={`p-3 rounded-lg border ${s.applied ? 'bg-green-500/10 border-green-500/30' : 'bg-background/50 border-border/50'}`}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span>{getTimeBlockIcon(s.suggestedTimeBlock)}</span>
                          <h4 className="text-sm font-medium truncate">{s.taskTitle}</h4>
                        </div>
                        {s.applied ? (
                          <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-xs shrink-0">
                            <Check className="h-3 w-3 mr-1" />
                            Applied
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs shrink-0"
                            onClick={() => applyScheduleItem(s)}
                            disabled={isApplying === s.taskId}
                          >
                            {isApplying === s.taskId ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <Check className="h-3 w-3 mr-1" />
                                Apply
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {s.suggestedDate} · {s.suggestedTimeBlock}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{s.reason}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Clock className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-xs">Generate an optimal schedule</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="workload" className="space-y-3">
            <div className="flex gap-2">
              <Button 
                onClick={() => handleAnalyze('workload')} 
                disabled={isLoading || tasks.length === 0}
                className="flex-1"
                size="sm"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Users className="h-4 w-4 mr-2" />}
                Analyze Workload
              </Button>
              {unappliedReassignmentCount > 0 && (
                <Button 
                  onClick={() => applyAllReassignments(teamMembers)} 
                  disabled={!!isApplying}
                  size="sm"
                  variant="secondary"
                >
                  <Play className="h-4 w-4 mr-1" />
                  Apply All ({unappliedReassignmentCount})
                </Button>
              )}
            </div>
            
            <ScrollArea className="h-[200px]">
              {workload ? (
                <div className="space-y-3">
                  {workload.analysis && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-xs font-medium text-destructive mb-1">Overloaded</p>
                        {workload.analysis.overloaded?.length > 0 ? (
                          workload.analysis.overloaded.map((name, i) => (
                            <Badge key={i} variant="outline" className="text-xs mr-1 mb-1">{name}</Badge>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground">None</p>
                        )}
                      </div>
                      <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                        <p className="text-xs font-medium text-green-600 mb-1">Available</p>
                        {workload.analysis.underutilized?.length > 0 ? (
                          workload.analysis.underutilized.map((name, i) => (
                            <Badge key={i} variant="outline" className="text-xs mr-1 mb-1">{name}</Badge>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground">None</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {workload.reassignments?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium">Suggested Reassignments</p>
                      {workload.reassignments.map((r, i) => (
                        <div key={i} className={`p-2 rounded-lg border ${r.applied ? 'bg-green-500/10 border-green-500/30' : 'bg-background/50 border-border/50'}`}>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium truncate">{r.taskTitle}</p>
                            {r.applied ? (
                              <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-xs shrink-0">
                                <Check className="h-3 w-3 mr-1" />
                                Applied
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-xs shrink-0"
                                onClick={() => applyReassignment(r, teamMembers)}
                                disabled={isApplying === r.taskId}
                              >
                                {isApplying === r.taskId ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <Check className="h-3 w-3 mr-1" />
                                    Apply
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <span>{r.currentAssignee || 'Unassigned'}</span>
                            <ChevronRight className="h-3 w-3" />
                            <span className="text-primary">{r.suggestedAssignee}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{r.reason}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <UserCheck className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-xs">Analyze team workload balance</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-3">
            <Button 
              onClick={() => handleAnalyze('deadline-alerts')} 
              disabled={isLoading || tasks.length === 0}
              className="w-full"
              size="sm"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
              Check Deadlines
            </Button>
            
            <ScrollArea className="h-[200px]">
              {alerts.length > 0 ? (
                <div className="space-y-2">
                  {alerts.map((a, i) => (
                    <div key={i} className={`p-3 rounded-lg border ${getAlertColor(a.alertLevel)}`}>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium">{a.taskTitle}</h4>
                        <Badge className={`text-xs ${getAlertColor(a.alertLevel)}`}>
                          {a.alertLevel}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs mt-1">
                        <Calendar className="h-3 w-3" />
                        {a.dueDate} · {a.daysRemaining} days left
                      </div>
                      <p className="text-xs mt-1">{a.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        💡 {a.suggestedAction}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Bell className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-xs">Check for deadline risks</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SmartScheduling;
