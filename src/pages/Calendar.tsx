import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Target,
  CheckSquare,
  Clock
} from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek
} from "date-fns";
import { cn } from "@/lib/utils";

interface CalendarTask {
  id: string;
  title: string;
  due_date: string;
  status: string;
  priority: string;
  project_id: string;
  project_name?: string;
}

interface CalendarGoal {
  id: string;
  title: string;
  target_date: string;
  status: string;
  progress: number;
  project_id: string;
  project_name?: string;
}

const Calendar = () => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [goals, setGoals] = useState<CalendarGoal[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      fetchData();
    };
    checkAuth();
  }, [navigate]);

  const fetchData = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get accessible project IDs
    const { data: memberProjects } = await supabase
      .from("project_members")
      .select("project_id")
      .eq("user_id", user.id);

    const projectIds = memberProjects?.map(pm => pm.project_id) || [];

    if (projectIds.length === 0) {
      setIsLoading(false);
      return;
    }

    // Fetch projects for names
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name")
      .in("id", projectIds);

    const projectMap = new Map(projects?.map(p => [p.id, p.name]) || []);

    // Fetch tasks with due dates
    const { data: tasksData } = await supabase
      .from("tasks")
      .select("id, title, due_date, status, priority, project_id")
      .in("project_id", projectIds)
      .not("due_date", "is", null);

    // Fetch goals with target dates
    const { data: goalsData } = await supabase
      .from("goals")
      .select("id, title, target_date, status, progress, project_id")
      .in("project_id", projectIds)
      .not("target_date", "is", null);

    setTasks((tasksData || []).map(t => ({
      ...t,
      project_name: projectMap.get(t.project_id)
    })));

    setGoals((goalsData || []).map(g => ({
      ...g,
      project_name: projectMap.get(g.project_id)
    })));

    setIsLoading(false);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getItemsForDate = (date: Date) => {
    const dayTasks = tasks.filter(t => isSameDay(new Date(t.due_date), date));
    const dayGoals = goals.filter(g => isSameDay(new Date(g.target_date), date));
    return { tasks: dayTasks, goals: dayGoals };
  };

  const selectedDateItems = useMemo(() => {
    if (!selectedDate) return { tasks: [], goals: [] };
    return getItemsForDate(selectedDate);
  }, [selectedDate, tasks, goals]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-destructive/20 text-destructive border-destructive/30";
      case "medium": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "low": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "completed" || status === "done") return "bg-emerald-500/20 text-emerald-400";
    if (status === "in_progress") return "bg-primary/20 text-primary";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-6 py-24">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Calendar</h1>
          <p className="text-muted-foreground">View tasks and goals with upcoming deadlines</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <Card className="lg:col-span-2 bg-card/50 border-border/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                {format(currentMonth, "MMMM yyyy")}
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map(day => {
                  const { tasks: dayTasks, goals: dayGoals } = getItemsForDate(day);
                  const hasItems = dayTasks.length > 0 || dayGoals.length > 0;
                  const isSelected = selectedDate && isSameDay(day, selectedDate);

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "min-h-[80px] p-1 rounded-lg border transition-all text-left",
                        "hover:border-primary/50 hover:bg-accent/50",
                        !isSameMonth(day, currentMonth) && "opacity-40",
                        isToday(day) && "border-primary bg-primary/10",
                        isSelected && "border-primary ring-2 ring-primary/30",
                        !isSelected && !isToday(day) && "border-border/30 bg-background/50"
                      )}
                    >
                      <div className={cn(
                        "text-sm font-medium mb-1",
                        isToday(day) && "text-primary",
                        !isSameMonth(day, currentMonth) && "text-muted-foreground"
                      )}>
                        {format(day, "d")}
                      </div>
                      
                      {hasItems && (
                        <div className="space-y-0.5">
                          {dayTasks.slice(0, 2).map(task => (
                            <div
                              key={task.id}
                              className={cn(
                                "text-[10px] px-1 py-0.5 rounded truncate",
                                task.status === "completed" 
                                  ? "bg-emerald-500/20 text-emerald-400 line-through"
                                  : "bg-primary/20 text-primary"
                              )}
                            >
                              {task.title}
                            </div>
                          ))}
                          {dayGoals.slice(0, 1).map(goal => (
                            <div
                              key={goal.id}
                              className="text-[10px] px-1 py-0.5 rounded truncate bg-amber-500/20 text-amber-400"
                            >
                              🎯 {goal.title}
                            </div>
                          ))}
                          {(dayTasks.length + dayGoals.length) > 3 && (
                            <div className="text-[10px] text-muted-foreground px-1">
                              +{(dayTasks.length + dayGoals.length) - 3} more
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Selected Date Details */}
          <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedDate 
                  ? format(selectedDate, "EEEE, MMMM d, yyyy")
                  : "Select a date"
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedDate ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Click on a date to see details</p>
                </div>
              ) : isLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-16 bg-muted rounded" />
                  <div className="h-16 bg-muted rounded" />
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {/* Tasks Section */}
                    {selectedDateItems.tasks.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-3">
                          <CheckSquare className="h-4 w-4" />
                          Tasks ({selectedDateItems.tasks.length})
                        </h4>
                        <div className="space-y-2">
                          {selectedDateItems.tasks.map(task => (
                            <div
                              key={task.id}
                              className="p-3 rounded-lg border border-border/50 bg-background/50 hover:border-primary/30 transition-colors cursor-pointer"
                              onClick={() => navigate(`/projects/${task.project_id}`)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className={cn(
                                    "font-medium truncate",
                                    task.status === "completed" && "line-through text-muted-foreground"
                                  )}>
                                    {task.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {task.project_name}
                                  </p>
                                </div>
                                <Badge variant="outline" className={getPriorityColor(task.priority)}>
                                  {task.priority}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge className={getStatusColor(task.status)}>
                                  {task.status.replace("_", " ")}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Goals Section */}
                    {selectedDateItems.goals.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-3">
                          <Target className="h-4 w-4" />
                          Goals ({selectedDateItems.goals.length})
                        </h4>
                        <div className="space-y-2">
                          {selectedDateItems.goals.map(goal => (
                            <div
                              key={goal.id}
                              className="p-3 rounded-lg border border-border/50 bg-background/50 hover:border-primary/30 transition-colors cursor-pointer"
                              onClick={() => navigate(`/projects/${goal.project_id}`)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{goal.title}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {goal.project_name}
                                  </p>
                                </div>
                                <span className="text-lg font-bold text-primary">
                                  {goal.progress}%
                                </span>
                              </div>
                              <Badge className={getStatusColor(goal.status)} >
                                {goal.status.replace("_", " ")}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No Items */}
                    {selectedDateItems.tasks.length === 0 && selectedDateItems.goals.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-10 w-10 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No tasks or goals due on this date</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary/20" />
            <span>Task</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-500/20" />
            <span>Completed Task</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-500/20" />
            <span>Goal</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Calendar;
