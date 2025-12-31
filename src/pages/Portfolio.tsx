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
  AlertTriangle,
  CheckCircle,
  FolderKanban,
  ArrowRight,
  LayoutGrid,
  BarChart3,
  Clock,
  Zap
} from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useAllTasks } from '@/hooks/useAllTasks';
import { useOKRs } from '@/hooks/useOKRs';
import Navigation from '@/components/Navigation';
import NaturalLanguageQuery from '@/components/NaturalLanguageQuery';
import { 
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const Portfolio = () => {
  const navigate = useNavigate();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: tasks } = useAllTasks();
  const { okrs } = useOKRs();

  const metrics = useMemo(() => {
    if (!projects) return null;

    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const avgProgress = totalProjects > 0 
      ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / totalProjects)
      : 0;

    // Health distribution
    const healthDistribution = {
      healthy: projects.filter(p => p.progress >= 70 || p.status === 'completed').length,
      atRisk: projects.filter(p => p.progress >= 30 && p.progress < 70 && p.status === 'active').length,
      critical: projects.filter(p => p.progress < 30 && p.status === 'active').length,
    };

    // Task metrics
    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
    const overdueTasks = tasks?.filter(t => {
      if (!t.due_date) return false;
      return new Date(t.due_date) < new Date() && t.status !== 'completed';
    }).length || 0;

    // OKR metrics
    const activeOKRs = okrs?.filter(o => o.status === 'active').length || 0;
    const okrAvgProgress = okrs?.length > 0
      ? Math.round(okrs.reduce((sum, o) => sum + (o.progress || 0), 0) / okrs.length)
      : 0;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      avgProgress,
      healthDistribution,
      totalTasks,
      completedTasks,
      overdueTasks,
      taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      totalTeamMembers: projects.reduce((sum, p) => sum + (p.members?.length || 0), 0),
      activeOKRs,
      okrAvgProgress,
    };
  }, [projects, tasks, okrs]);

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

  const projectProgressData = projects?.slice(0, 8).map(p => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
    progress: p.progress || 0,
  })) || [];

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
              <h1 className="text-4xl font-bold text-foreground mb-2">Portfolio Dashboard</h1>
              <p className="text-muted-foreground">Cross-project visibility and strategic alignment</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/executive')}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Executive View
              </Button>
              <Button onClick={() => navigate('/reports')}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Reports
              </Button>
            </div>
          </div>

          {/* Natural Language Query */}
          <NaturalLanguageQuery />

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <FolderKanban className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Projects</span>
                </div>
                <p className="text-2xl font-bold">{metrics?.totalProjects || 0}</p>
                <p className="text-xs text-muted-foreground">{metrics?.activeProjects} active</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Avg Progress</span>
                </div>
                <p className="text-2xl font-bold">{metrics?.avgProgress || 0}%</p>
                <Progress value={metrics?.avgProgress || 0} className="h-1 mt-1" />
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">Tasks Done</span>
                </div>
                <p className="text-2xl font-bold">{metrics?.taskCompletionRate || 0}%</p>
                <p className="text-xs text-muted-foreground">{metrics?.completedTasks} / {metrics?.totalTasks}</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span className="text-xs text-muted-foreground">Overdue</span>
                </div>
                <p className="text-2xl font-bold">{metrics?.overdueTasks || 0}</p>
                <p className="text-xs text-muted-foreground">tasks need attention</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Team Size</span>
                </div>
                <p className="text-2xl font-bold">{metrics?.totalTeamMembers || 0}</p>
                <p className="text-xs text-muted-foreground">across projects</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="h-4 w-4 text-purple-500" />
                  <span className="text-xs text-muted-foreground">Active OKRs</span>
                </div>
                <p className="text-2xl font-bold">{metrics?.activeOKRs || 0}</p>
                <p className="text-xs text-muted-foreground">{metrics?.okrAvgProgress}% avg progress</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Project Progress Bar Chart */}
            <Card className="lg:col-span-2 bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle>Project Progress</CardTitle>
                <CardDescription>Current progress across all projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectProgressData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                      <YAxis type="category" dataKey="name" width={100} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="progress" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Health Distribution Pie */}
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle>Portfolio Health</CardTitle>
                <CardDescription>Project status distribution</CardDescription>
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

          {/* Projects Grid */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5" />
                All Projects
              </CardTitle>
              <CardDescription>Click to view project details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects?.map((project) => {
                  const healthStatus = project.progress >= 70 ? 'healthy' : 
                                       project.progress >= 30 ? 'atRisk' : 'critical';
                  
                  return (
                    <div
                      key={project.id}
                      className="p-4 rounded-lg border bg-background/50 hover:border-primary/30 transition-all cursor-pointer group"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: healthColors[healthStatus] }} />
                          <h3 className="font-medium text-foreground truncate">{project.name}</h3>
                        </div>
                        <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
                          {project.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{project.progress}%</span>
                        </div>
                        <Progress value={project.progress || 0} className="h-2" />
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {project.members?.length || 0} members
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Projects Requiring Attention */}
          {projects?.some(p => p.progress < 50 && p.status === 'active') && (
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Projects Requiring Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {projects?.filter(p => p.progress < 50 && p.status === 'active').slice(0, 5).map((project) => (
                    <div 
                      key={project.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-background/50 border cursor-pointer hover:border-primary/30"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${project.progress < 30 ? 'bg-red-500' : 'bg-amber-500'}`} />
                        <span className="font-medium">{project.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm">{project.progress}%</span>
                        <Badge variant={project.progress < 30 ? 'destructive' : 'secondary'}>
                          {project.progress < 30 ? 'Critical' : 'At Risk'}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Portfolio;
