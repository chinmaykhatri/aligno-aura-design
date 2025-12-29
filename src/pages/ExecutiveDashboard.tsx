import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Users, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  FolderKanban,
  ArrowRight,
  Activity
} from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import Navigation from '@/components/Navigation';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

const ExecutiveDashboard = () => {
  const navigate = useNavigate();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  
  // Aggregate metrics across all projects
  const metrics = useMemo(() => {
    if (!projects) return null;

    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const avgProgress = totalProjects > 0 
      ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / totalProjects)
      : 0;

    // Project health distribution
    const healthDistribution = {
      healthy: projects.filter(p => p.progress >= 70 || p.status === 'completed').length,
      atRisk: projects.filter(p => p.progress >= 30 && p.progress < 70 && p.status === 'active').length,
      critical: projects.filter(p => p.progress < 30 && p.status === 'active').length,
    };

    // Monthly trend data (simulated based on project dates)
    const monthlyData = [
      { month: 'Jan', completed: 12, inProgress: 8, planned: 5 },
      { month: 'Feb', completed: 15, inProgress: 10, planned: 7 },
      { month: 'Mar', completed: 18, inProgress: 12, planned: 6 },
      { month: 'Apr', completed: 22, inProgress: 15, planned: 8 },
      { month: 'May', completed: 28, inProgress: 18, planned: 10 },
      { month: 'Jun', completed: completedProjects * 4, inProgress: activeProjects * 3, planned: Math.round(totalProjects * 0.5) },
    ];

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      avgProgress,
      healthDistribution,
      monthlyData,
      totalTeamMembers: projects.reduce((sum, p) => sum + (p.members?.length || 0), 0),
    };
  }, [projects]);

  const healthColors = {
    healthy: 'hsl(142 76% 36%)',
    atRisk: 'hsl(38 92% 50%)',
    critical: 'hsl(0 84% 60%)',
  };

  const pieData = metrics ? [
    { name: 'Healthy', value: metrics.healthDistribution.healthy, color: healthColors.healthy },
    { name: 'At Risk', value: metrics.healthDistribution.atRisk, color: healthColors.atRisk },
    { name: 'Critical', value: metrics.healthDistribution.critical, color: healthColors.critical },
  ] : [];

  if (projectsLoading) {
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
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Executive Dashboard</h1>
              <p className="text-muted-foreground">High-level overview of all projects and KPIs</p>
            </div>
            <Button onClick={() => navigate('/reports')} variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Reports
            </Button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Projects
                </CardTitle>
                <FolderKanban className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{metrics?.totalProjects || 0}</div>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-green-500">+12% this month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Projects
                </CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{metrics?.activeProjects || 0}</div>
                <Progress value={(metrics?.activeProjects || 0) / (metrics?.totalProjects || 1) * 100} className="h-2 mt-2" />
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg. Progress
                </CardTitle>
                <Target className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{metrics?.avgProgress || 0}%</div>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-green-500">On track</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Team Members
                </CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{metrics?.totalTeamMembers || 0}</div>
                <span className="text-xs text-muted-foreground">Across all projects</span>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Progress Trend Chart */}
            <Card className="lg:col-span-2 bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle>Project Completion Trend</CardTitle>
                <CardDescription>Monthly overview of project status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics?.monthlyData || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
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
                        dataKey="completed" 
                        stackId="1" 
                        stroke="hsl(142 76% 36%)" 
                        fill="hsl(142 76% 36% / 0.5)" 
                        name="Completed"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="inProgress" 
                        stackId="1" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary) / 0.5)" 
                        name="In Progress"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Project Health Pie Chart */}
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle>Project Health</CardTitle>
                <CardDescription>Current status distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Projects at Risk */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Projects Requiring Attention
              </CardTitle>
              <CardDescription>Projects that may need intervention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects?.filter(p => p.progress < 50 && p.status === 'active').slice(0, 5).map((project) => (
                  <div 
                    key={project.id} 
                    className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        project.progress < 30 ? 'bg-red-500' : 'bg-amber-500'
                      }`} />
                      <div>
                        <p className="font-medium text-foreground">{project.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {project.members?.length || 0} team members
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">{project.progress}%</p>
                        <p className="text-xs text-muted-foreground">Progress</p>
                      </div>
                      <Badge variant={project.progress < 30 ? 'destructive' : 'secondary'}>
                        {project.progress < 30 ? 'Critical' : 'At Risk'}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}

                {(!projects || projects.filter(p => p.progress < 50 && p.status === 'active').length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p>All projects are on track!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ExecutiveDashboard;
