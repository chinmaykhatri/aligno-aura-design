import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Target,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HealthMetric {
  name: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
  description: string;
}

interface ProjectHealthData {
  overallScore: number;
  status: 'healthy' | 'at-risk' | 'critical';
  metrics: {
    velocity: HealthMetric;
    onTimeDelivery: HealthMetric;
    scopeStability: HealthMetric;
    teamLoad: HealthMetric;
    blockersRatio: HealthMetric;
  };
  summary: string;
}

interface ProjectHealthScoreProps {
  projectId: string;
  tasks: any[];
  sprints: any[];
}

const calculateHealthScore = (tasks: any[], sprints: any[]): ProjectHealthData => {
  const now = new Date();
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'completed');
  const blockedTasks = tasks.filter(t => t.status === 'blocked');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  
  // Velocity - based on completed tasks in recent period
  const recentCompletions = completedTasks.filter(t => {
    const completedDate = new Date(t.updated_at);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    return completedDate > twoWeeksAgo;
  });
  const velocityScore = Math.min(100, (recentCompletions.length / Math.max(tasks.length * 0.2, 1)) * 100);
  
  // On-time delivery
  const onTimeDeliveryScore = tasks.length > 0 
    ? Math.max(0, 100 - (overdueTasks.length / tasks.length) * 200)
    : 100;
  
  // Scope stability - fewer overdue = more stable
  const scopeScore = tasks.length > 0 
    ? Math.max(0, 100 - (overdueTasks.length + blockedTasks.length) / tasks.length * 150)
    : 100;
  
  // Team load - balance of in-progress vs completed
  const teamLoadScore = inProgressTasks.length <= tasks.length * 0.3 ? 100 : 
    Math.max(0, 100 - (inProgressTasks.length / tasks.length - 0.3) * 200);
  
  // Blockers ratio
  const blockersScore = tasks.length > 0 
    ? Math.max(0, 100 - (blockedTasks.length / tasks.length) * 300)
    : 100;

  const overallScore = Math.round(
    (velocityScore * 0.25 + onTimeDeliveryScore * 0.30 + scopeScore * 0.20 + teamLoadScore * 0.15 + blockersScore * 0.10)
  );

  const getStatus = (score: number): 'good' | 'warning' | 'critical' => {
    if (score >= 70) return 'good';
    if (score >= 40) return 'warning';
    return 'critical';
  };

  const getTrend = (score: number): 'up' | 'down' | 'stable' => {
    // Simulate trend based on score thresholds
    if (score >= 75) return 'up';
    if (score <= 40) return 'down';
    return 'stable';
  };

  return {
    overallScore,
    status: overallScore >= 70 ? 'healthy' : overallScore >= 40 ? 'at-risk' : 'critical',
    metrics: {
      velocity: {
        name: 'Velocity',
        score: Math.round(velocityScore),
        trend: getTrend(velocityScore),
        status: getStatus(velocityScore),
        description: 'Team completion rate over time'
      },
      onTimeDelivery: {
        name: 'On-Time Delivery',
        score: Math.round(onTimeDeliveryScore),
        trend: getTrend(onTimeDeliveryScore),
        status: getStatus(onTimeDeliveryScore),
        description: 'Tasks delivered by due date'
      },
      scopeStability: {
        name: 'Scope Stability',
        score: Math.round(scopeScore),
        trend: getTrend(scopeScore),
        status: getStatus(scopeScore),
        description: 'Scope changes and blockers'
      },
      teamLoad: {
        name: 'Team Load',
        score: Math.round(teamLoadScore),
        trend: getTrend(teamLoadScore),
        status: getStatus(teamLoadScore),
        description: 'Work distribution balance'
      },
      blockersRatio: {
        name: 'Blockers',
        score: Math.round(blockersScore),
        trend: getTrend(blockersScore),
        status: getStatus(blockersScore),
        description: 'Blocked tasks ratio'
      }
    },
    summary: overallScore >= 70 
      ? 'Project is on track with healthy metrics'
      : overallScore >= 40 
        ? `${overdueTasks.length} overdue tasks and ${blockedTasks.length} blockers need attention`
        : 'Critical issues detected - immediate action required'
  };
};

export const ProjectHealthScore = ({ projectId, tasks, sprints }: ProjectHealthScoreProps) => {
  const [healthData, setHealthData] = useState<ProjectHealthData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (tasks && tasks.length >= 0) {
      setHealthData(calculateHealthScore(tasks, sprints || []));
    }
  }, [tasks, sprints]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setHealthData(calculateHealthScore(tasks || [], sprints || []));
      setIsRefreshing(false);
      toast({
        title: 'Health Score Updated',
        description: 'Project health metrics have been recalculated'
      });
    }, 500);
  };

  if (!healthData) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="py-8 text-center">
          <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground animate-pulse" />
          <p className="text-sm text-muted-foreground">Calculating health score...</p>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
  };

  const getStatusBadge = (status: 'healthy' | 'at-risk' | 'critical') => {
    switch (status) {
      case 'healthy': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'at-risk': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
    }
  };

  const MetricRow = ({ metric }: { metric: HealthMetric }) => (
    <div className="flex items-center justify-between py-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 cursor-help">
              <span className="text-sm">{metric.name}</span>
              {metric.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
              {metric.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{metric.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <div className="flex items-center gap-2">
        <Progress value={metric.score} className="w-20 h-2" />
        <span className={`text-sm font-medium w-8 ${getScoreColor(metric.score)}`}>
          {metric.score}
        </span>
      </div>
    </div>
  );

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Health Score</CardTitle>
              <CardDescription>Real-time project health</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Score */}
        <div className="text-center p-4 rounded-lg bg-background/50 border border-border/50">
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className={`text-5xl font-bold ${getScoreColor(healthData.overallScore)}`}>
              {healthData.overallScore}
            </span>
            <div className="text-left">
              <Badge variant="outline" className={getStatusBadge(healthData.status)}>
                {healthData.status === 'healthy' && <CheckCircle className="h-3 w-3 mr-1" />}
                {healthData.status === 'at-risk' && <AlertTriangle className="h-3 w-3 mr-1" />}
                {healthData.status === 'critical' && <AlertTriangle className="h-3 w-3 mr-1" />}
                {healthData.status.replace('-', ' ')}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">out of 100</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{healthData.summary}</p>
        </div>

        {/* Metrics Breakdown */}
        <div className="space-y-1 divide-y divide-border/50">
          <MetricRow metric={healthData.metrics.velocity} />
          <MetricRow metric={healthData.metrics.onTimeDelivery} />
          <MetricRow metric={healthData.metrics.scopeStability} />
          <MetricRow metric={healthData.metrics.teamLoad} />
          <MetricRow metric={healthData.metrics.blockersRatio} />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectHealthScore;
