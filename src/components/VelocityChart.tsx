import { useMemo } from 'react';
import { Sprint } from '@/hooks/useSprints';
import { Task } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart, ReferenceLine } from 'recharts';
import { format, parseISO } from 'date-fns';
import { TrendingUp, Target, Zap, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VelocityChartProps {
  sprints: Sprint[];
  tasks: Task[];
}

interface VelocityDataPoint {
  name: string;
  sprintId: string;
  committed: number;
  completed: number;
  velocity: number;
  completionRate: number;
}

const VelocityChart = ({ sprints, tasks }: VelocityChartProps) => {
  const velocityData = useMemo(() => {
    // Only include completed sprints and current active sprint
    const relevantSprints = sprints
      .filter(s => s.status === 'completed' || s.status === 'active')
      .sort((a, b) => parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime());

    // Determine measurement type: prefer story points, then hours, then task count
    const hasStoryPoints = tasks.some(t => t.story_points && t.story_points > 0);
    const hasHours = tasks.some(t => t.estimated_hours && t.estimated_hours > 0);
    const measurementType = hasStoryPoints ? 'points' : hasHours ? 'hours' : 'tasks';

    const data: VelocityDataPoint[] = relevantSprints.map(sprint => {
      const sprintTasks = tasks.filter(t => t.sprint_id === sprint.id);
      
      let committed: number;
      let completed: number;
      
      if (measurementType === 'points') {
        committed = sprintTasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
        completed = sprintTasks
          .filter(t => t.status === 'completed')
          .reduce((sum, t) => sum + (t.story_points || 0), 0);
      } else if (measurementType === 'hours') {
        committed = sprintTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
        completed = sprintTasks
          .filter(t => t.status === 'completed')
          .reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
      } else {
        committed = sprintTasks.length;
        completed = sprintTasks.filter(t => t.status === 'completed').length;
      }

      const completionRate = committed > 0 ? Math.round((completed / committed) * 100) : 0;

      return {
        name: sprint.name,
        sprintId: sprint.id,
        committed,
        completed,
        velocity: completed,
        completionRate,
      };
    });

    return { data, measurementType };
  }, [sprints, tasks]);

  // Calculate statistics
  const stats = useMemo(() => {
    const completedSprints = velocityData.data.filter(d => 
      sprints.find(s => s.id === d.sprintId)?.status === 'completed'
    );

    if (completedSprints.length === 0) {
      return {
        averageVelocity: 0,
        highestVelocity: 0,
        lowestVelocity: 0,
        trend: 0,
        avgCompletionRate: 0,
        predictedCapacity: 0,
      };
    }

    const velocities = completedSprints.map(d => d.velocity);
    const sum = velocities.reduce((a, b) => a + b, 0);
    const avg = sum / velocities.length;
    
    // Calculate trend (comparing recent vs older sprints)
    let trend = 0;
    if (completedSprints.length >= 2) {
      const midPoint = Math.floor(completedSprints.length / 2);
      const olderAvg = completedSprints.slice(0, midPoint).reduce((s, d) => s + d.velocity, 0) / midPoint;
      const recentAvg = completedSprints.slice(midPoint).reduce((s, d) => s + d.velocity, 0) / (completedSprints.length - midPoint);
      trend = olderAvg > 0 ? Math.round(((recentAvg - olderAvg) / olderAvg) * 100) : 0;
    }

    const avgCompletionRate = Math.round(
      completedSprints.reduce((s, d) => s + d.completionRate, 0) / completedSprints.length
    );

    // Predicted capacity for next sprint (rolling average of last 3)
    const recentSprints = completedSprints.slice(-3);
    const predictedCapacity = Math.round(
      recentSprints.reduce((s, d) => s + d.velocity, 0) / recentSprints.length
    );

    return {
      averageVelocity: Math.round(avg * 10) / 10,
      highestVelocity: Math.max(...velocities),
      lowestVelocity: Math.min(...velocities),
      trend,
      avgCompletionRate,
      predictedCapacity,
    };
  }, [velocityData, sprints]);

  const getUnitLabel = () => {
    switch (velocityData.measurementType) {
      case 'points': return 'SP';
      case 'hours': return 'h';
      default: return 'tasks';
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    
    const data = payload[0]?.payload;
    const unit = getUnitLabel();
    
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-sm mb-2">{label}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">Committed:</span>
            <span className="font-medium">{data?.committed} {unit}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">Completed:</span>
            <span className="font-medium text-copper">{data?.completed} {unit}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">Completion:</span>
            <span className={cn(
              "font-medium",
              data?.completionRate >= 90 ? "text-emerald-400" : 
              data?.completionRate >= 70 ? "text-amber-400" : "text-red-400"
            )}>
              {data?.completionRate}%
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (velocityData.data.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="py-12 text-center">
          <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">Complete at least one sprint to see velocity data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-copper" />
            <CardTitle className="text-base">Team Velocity</CardTitle>
          </div>
          {stats.trend !== 0 && (
            <Badge 
              variant="outline"
              className={cn(
                stats.trend > 0 
                  ? "border-emerald-500/50 text-emerald-400" 
                  : "border-red-500/50 text-red-400"
              )}
            >
              {stats.trend > 0 ? '↑' : '↓'} {Math.abs(stats.trend)}% trend
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Statistics Row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="h-4 w-4 text-copper" />
            </div>
            <p className="text-2xl font-bold text-copper">{stats.averageVelocity}</p>
            <p className="text-xs text-muted-foreground">
              Avg Velocity
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Award className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold">{stats.highestVelocity}</p>
            <p className="text-xs text-muted-foreground">
              Best Sprint
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="h-4 w-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold">{stats.avgCompletionRate}%</p>
            <p className="text-xs text-muted-foreground">
              Avg Completion
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30 border border-copper/30">
            <p className="text-xs text-muted-foreground mb-1">Next Sprint</p>
            <p className="text-2xl font-bold text-copper">{stats.predictedCapacity}</p>
            <p className="text-xs text-muted-foreground">
              Predicted
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={velocityData.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                label={{ 
                  value: velocityData.measurementType === 'points' ? 'Story Points' : 
                         velocityData.measurementType === 'hours' ? 'Hours' : 'Tasks', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { fill: 'hsl(var(--muted-foreground))', fontSize: 11 }
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Average velocity reference line */}
              <ReferenceLine 
                y={stats.averageVelocity} 
                stroke="hsl(var(--copper))"
                strokeDasharray="5 5"
                strokeWidth={2}
              />
              
              {/* Committed (lighter bar) */}
              <Bar 
                dataKey="committed" 
                fill="hsl(var(--muted-foreground))"
                opacity={0.3}
                radius={[4, 4, 0, 0]}
                name="Committed"
              />
              
              {/* Completed (main bar) */}
              <Bar 
                dataKey="completed" 
                fill="hsl(var(--copper))"
                radius={[4, 4, 0, 0]}
                name="Completed"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded bg-muted-foreground/30" />
            <span className="text-muted-foreground">Committed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded bg-copper" />
            <span className="text-muted-foreground">Completed (Velocity)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-copper" style={{ borderStyle: 'dashed' }} />
            <span className="text-muted-foreground">Average</span>
          </div>
        </div>

        {/* Insights */}
        <div className="mt-4 p-3 rounded-lg bg-muted/20 border border-border/30">
          <p className="text-sm">
            <span className="font-medium text-copper">Planning Tip:</span>{' '}
            <span className="text-muted-foreground">
              Based on recent velocity, plan approximately{' '}
              <span className="font-medium text-foreground">{stats.predictedCapacity} {getUnitLabel()}</span>{' '}
              for the next sprint. Your team completes{' '}
              <span className="font-medium text-foreground">{stats.avgCompletionRate}%</span>{' '}
              of committed work on average.
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default VelocityChart;
