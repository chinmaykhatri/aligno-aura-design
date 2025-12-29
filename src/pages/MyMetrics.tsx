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
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';

const MyMetrics = () => {
  const navigate = useNavigate();
  const { data: projects, isLoading } = useProjects();
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .single();
        setUserName(profile?.full_name || 'Team Member');
      }
    };
    fetchUser();
  }, []);

  // Generate mock productivity data
  const productivityData = useMemo(() => {
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      data.push({
        date: format(date, 'MMM d'),
        tasks: Math.floor(Math.random() * 5) + 1,
        hours: Math.floor(Math.random() * 6) + 2,
      });
    }
    return data;
  }, []);

  // Weekly comparison
  const weeklyData = useMemo(() => {
    return [
      { week: '4 weeks ago', completed: 12, hours: 32 },
      { week: '3 weeks ago', completed: 15, hours: 38 },
      { week: '2 weeks ago', completed: 18, hours: 42 },
      { week: 'Last week', completed: 14, hours: 35 },
      { week: 'This week', completed: 8, hours: 24 },
    ];
  }, []);

  // Calculate metrics
  const myProjects = projects?.filter(p => 
    p.members?.some(m => m.user_id === userId)
  ) || [];

  const totalTasks = productivityData.reduce((sum, d) => sum + d.tasks, 0);
  const totalHours = productivityData.reduce((sum, d) => sum + d.hours, 0);
  const avgTasksPerDay = Math.round(totalTasks / 30 * 10) / 10;
  const avgHoursPerDay = Math.round(totalHours / 30 * 10) / 10;
  
  const thisWeekTasks = productivityData.slice(-7).reduce((sum, d) => sum + d.tasks, 0);
  const lastWeekTasks = productivityData.slice(-14, -7).reduce((sum, d) => sum + d.tasks, 0);
  const tasksTrend = lastWeekTasks > 0 ? Math.round((thisWeekTasks - lastWeekTasks) / lastWeekTasks * 100) : 0;

  // Streak calculation (mock)
  const currentStreak = Math.floor(Math.random() * 10) + 3;

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
                <div className="text-3xl font-bold text-foreground">87</div>
                <Progress value={87} className="h-2 mt-2" />
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
