import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  User, 
  TrendingUp, 
  TrendingDown,
  Target, 
  Clock, 
  CheckCircle,
  Calendar,
  ArrowLeft,
  Flame,
  Award,
  BarChart3
} from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useMyTasks } from '@/hooks/useAllTasks';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { format, subDays, parseISO, isAfter, startOfDay } from 'date-fns';

const MyMetrics = () => {
  const navigate = useNavigate();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: myTasks, isLoading: tasksLoading } = useMyTasks();
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  const isLoading = projectsLoading || tasksLoading;

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .maybeSingle();
        setUserName(profile?.full_name || 'Team Member');
      }
    };
    fetchUser();
  }, []);

  // Generate productivity data from real tasks
  const productivityData = useMemo(() => {
    if (!myTasks) return [];
    
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      
      // Count tasks completed on this day
      const tasksOnDay = myTasks.filter(task => {
        if (!task.updated_at || task.status !== 'completed') return false;
        const taskDate = parseISO(task.updated_at);
        return taskDate >= dayStart && taskDate < dayEnd;
      });
      
      const hoursOnDay = tasksOnDay.reduce((sum, t) => sum + (t.tracked_hours || 0), 0);
      
      data.push({
        date: format(date, 'MMM d'),
        tasks: tasksOnDay.length,
        hours: hoursOnDay,
      });
    }
    return data;
  }, [myTasks]);

  // Weekly comparison from real data
  const weeklyData = useMemo(() => {
    if (!myTasks) return [];
    
    const weeks = [];
    for (let w = 4; w >= 0; w--) {
      const weekStart = subDays(new Date(), w * 7 + 6);
      const weekEnd = subDays(new Date(), w * 7);
      
      const tasksInWeek = myTasks.filter(task => {
        if (!task.updated_at || task.status !== 'completed') return false;
        const taskDate = parseISO(task.updated_at);
        return taskDate >= weekStart && taskDate <= weekEnd;
      });
      
      weeks.push({
        week: w === 0 ? 'This week' : w === 1 ? 'Last week' : `${w} weeks ago`,
        completed: tasksInWeek.length,
        hours: tasksInWeek.reduce((sum, t) => sum + (t.tracked_hours || 0), 0),
      });
    }
    return weeks;
  }, [myTasks]);

  // Calculate metrics from real data
  const myProjects = projects?.filter(p => 
    p.members?.some(m => m.user_id === userId)
  ) || [];

  const totalTasks = myTasks?.filter(t => t.status === 'completed').length || 0;
  const totalHours = myTasks?.reduce((sum, t) => sum + (t.tracked_hours || 0), 0) || 0;
  const avgTasksPerDay = Math.round(totalTasks / 30 * 10) / 10;
  const avgHoursPerDay = Math.round(totalHours / 30 * 10) / 10;
  
  const thisWeekTasks = productivityData.slice(-7).reduce((sum, d) => sum + d.tasks, 0);
  const lastWeekTasks = productivityData.slice(-14, -7).reduce((sum, d) => sum + d.tasks, 0);
  const tasksTrend = lastWeekTasks > 0 ? Math.round((thisWeekTasks - lastWeekTasks) / lastWeekTasks * 100) : 0;

  // Calculate streak from real data (consecutive days with completed tasks)
  const currentStreak = useMemo(() => {
    if (!productivityData.length) return 0;
    let streak = 0;
    for (let i = productivityData.length - 1; i >= 0; i--) {
      if (productivityData[i].tasks > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [productivityData]);

  // Productivity score based on real metrics
  const productivityScore = useMemo(() => {
    if (!myTasks?.length) return 0;
    const completionRate = myTasks.filter(t => t.status === 'completed').length / myTasks.length;
    const streakBonus = Math.min(currentStreak * 2, 20);
    return Math.min(Math.round(completionRate * 80 + streakBonus), 100);
  }, [myTasks, currentStreak]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-6 py-24">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-6 py-24">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-4xl font-bold text-foreground">My Metrics</h1>
                <p className="text-muted-foreground">Personal productivity insights for {userName}</p>
              </div>
            </div>
            <Badge variant="outline" className="flex items-center gap-1 bg-amber-500/10 text-amber-500 border-amber-500/20">
              <Flame className="h-4 w-4" />
              {currentStreak} day streak
            </Badge>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tasks This Month
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{totalTasks}</div>
                <div className="flex items-center gap-1 mt-1">
                  {tasksTrend >= 0 ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-green-500">+{tasksTrend}% vs last week</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      <span className="text-xs text-red-500">{tasksTrend}% vs last week</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Hours Tracked
                </CardTitle>
                <Clock className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{totalHours}h</div>
                <p className="text-xs text-muted-foreground">{avgHoursPerDay}h avg per day</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Projects
                </CardTitle>
                <Target className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{myProjects.length}</div>
                <p className="text-xs text-muted-foreground">{avgTasksPerDay} tasks/day avg</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Productivity Score
                </CardTitle>
                <Award className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{productivityScore}</div>
                <Progress value={productivityScore} className="h-2 mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Activity */}
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Daily Activity (30 days)
                </CardTitle>
                <CardDescription>Tasks completed and hours tracked</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={productivityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fontSize: 10 }}
                        interval={4}
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="tasks" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary) / 0.3)" 
                        name="Tasks"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Trends */}
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Weekly Trends
                </CardTitle>
                <CardDescription>Your performance over the past 5 weeks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="week" 
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="completed" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        name="Tasks Completed"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="hours" 
                        stroke="hsl(142 76% 36%)" 
                        strokeWidth={2}
                        name="Hours"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* My Projects */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle>My Active Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myProjects.slice(0, 6).map(project => (
                  <div 
                    key={project.id}
                    className="p-4 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-foreground truncate">{project.name}</h3>
                      <Badge variant="outline" className={
                        project.status === 'active' ? 'bg-green-500/10 text-green-500' :
                        project.status === 'completed' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-muted text-muted-foreground'
                      }>
                        {project.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Progress value={project.progress} className="flex-1 h-2" />
                      <span className="text-sm font-medium text-foreground">{project.progress}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {project.members?.length || 0} team members
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default MyMetrics;
