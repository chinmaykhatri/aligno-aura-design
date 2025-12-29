import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  TrendingUp, 
  Target, 
  Clock, 
  CheckCircle,
  BarChart3,
  ArrowLeft,
  Award,
  Zap
} from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import Navigation from '@/components/Navigation';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';

interface TeamMemberStats {
  userId: string;
  name: string;
  tasksCompleted: number;
  tasksAssigned: number;
  completionRate: number;
  hoursTracked: number;
  projectsCount: number;
}

const TeamPerformance = () => {
  const navigate = useNavigate();
  const { data: projects, isLoading } = useProjects();

  // Aggregate team member stats across all projects
  const teamStats = useMemo(() => {
    if (!projects) return [];

    const memberMap = new Map<string, TeamMemberStats>();

    projects.forEach(project => {
      project.members?.forEach(member => {
        const existing = memberMap.get(member.user_id) || {
          userId: member.user_id,
          name: member.profiles?.full_name || 'Unknown',
          tasksCompleted: 0,
          tasksAssigned: 0,
          completionRate: 0,
          hoursTracked: 0,
          projectsCount: 0,
        };

        existing.projectsCount += 1;
        // Simulated data - in real app would come from tasks table
        existing.tasksAssigned += Math.floor(Math.random() * 15) + 5;
        existing.tasksCompleted += Math.floor(Math.random() * 10) + 3;
        existing.hoursTracked += Math.floor(Math.random() * 40) + 20;

        memberMap.set(member.user_id, existing);
      });
    });

    return Array.from(memberMap.values()).map(m => ({
      ...m,
      completionRate: m.tasksAssigned > 0 ? Math.round((m.tasksCompleted / m.tasksAssigned) * 100) : 0,
    }));
  }, [projects]);

  // Workload distribution data
  const workloadData = useMemo(() => {
    return teamStats.slice(0, 8).map(member => ({
      name: member.name.split(' ')[0],
      tasks: member.tasksAssigned,
      completed: member.tasksCompleted,
      hours: member.hoursTracked,
    }));
  }, [teamStats]);

  // Team radar data
  const radarData = useMemo(() => {
    const avgCompletion = teamStats.length > 0 
      ? teamStats.reduce((sum, m) => sum + m.completionRate, 0) / teamStats.length 
      : 0;
    const avgHours = teamStats.length > 0 
      ? teamStats.reduce((sum, m) => sum + m.hoursTracked, 0) / teamStats.length 
      : 0;

    return [
      { metric: 'Completion Rate', value: avgCompletion, fullMark: 100 },
      { metric: 'On-Time Delivery', value: 78, fullMark: 100 },
      { metric: 'Collaboration', value: 85, fullMark: 100 },
      { metric: 'Quality', value: 82, fullMark: 100 },
      { metric: 'Velocity', value: 70, fullMark: 100 },
      { metric: 'Communication', value: 88, fullMark: 100 },
    ];
  }, [teamStats]);

  // Top performers
  const topPerformers = useMemo(() => {
    return [...teamStats]
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 3);
  }, [teamStats]);

  const totalTasks = teamStats.reduce((sum, m) => sum + m.tasksAssigned, 0);
  const totalCompleted = teamStats.reduce((sum, m) => sum + m.tasksCompleted, 0);
  const totalHours = teamStats.reduce((sum, m) => sum + m.hoursTracked, 0);
  const avgCompletion = teamStats.length > 0 
    ? Math.round(teamStats.reduce((sum, m) => sum + m.completionRate, 0) / teamStats.length)
    : 0;

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
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/executive')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-foreground">Team Performance</h1>
              <p className="text-muted-foreground">Analytics across all projects and team members</p>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Team Members
                </CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{teamStats.length}</div>
                <p className="text-xs text-muted-foreground">Across {projects?.length || 0} projects</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tasks Completed
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{totalCompleted}</div>
                <p className="text-xs text-muted-foreground">of {totalTasks} total tasks</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg. Completion
                </CardTitle>
                <Target className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{avgCompletion}%</div>
                <Progress value={avgCompletion} className="h-2 mt-2" />
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
                <p className="text-xs text-muted-foreground">Total team hours</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Workload Distribution */}
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Workload Distribution
                </CardTitle>
                <CardDescription>Tasks assigned vs completed per member</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={workloadData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="tasks" fill="hsl(var(--primary) / 0.6)" name="Assigned" />
                      <Bar dataKey="completed" fill="hsl(142 76% 36%)" name="Completed" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Team Performance Radar */}
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Team Health Metrics
                </CardTitle>
                <CardDescription>Overall team performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="metric" stroke="hsl(var(--muted-foreground))" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                      <Radar 
                        name="Team Score" 
                        dataKey="value" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary) / 0.3)" 
                        fillOpacity={0.6} 
                      />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers & Member List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Performers */}
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topPerformers.map((member, index) => (
                    <div key={member.userId} className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-amber-500 text-amber-950' :
                        index === 1 ? 'bg-gray-400 text-gray-950' :
                        'bg-amber-700 text-amber-100'
                      }`}>
                        {index + 1}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {member.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{member.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.tasksCompleted} tasks completed
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                        {member.completionRate}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* All Members */}
            <Card className="lg:col-span-2 bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle>All Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teamStats.map((member) => (
                    <div 
                      key={member.userId}
                      className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {member.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{member.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {member.projectsCount} projects
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="font-medium text-foreground">{member.tasksCompleted}/{member.tasksAssigned}</p>
                          <p className="text-xs text-muted-foreground">Tasks</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-foreground">{member.hoursTracked}h</p>
                          <p className="text-xs text-muted-foreground">Tracked</p>
                        </div>
                        <div className="w-24">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">Rate</span>
                            <span className="text-xs font-medium">{member.completionRate}%</span>
                          </div>
                          <Progress value={member.completionRate} className="h-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeamPerformance;
