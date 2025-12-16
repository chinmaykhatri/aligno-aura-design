import { useMemo } from 'react';
import { Sprint } from '@/hooks/useSprints';
import { Task } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';
import { format, parseISO, eachDayOfInterval, differenceInDays, isBefore, isAfter, startOfDay } from 'date-fns';
import { TrendingDown, Target, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SprintBurndownProps {
  sprint: Sprint;
  tasks: Task[];
}

interface BurndownDataPoint {
  date: string;
  displayDate: string;
  ideal: number;
  actual: number | null;
  remaining: number | null;
}

const SprintBurndown = ({ sprint, tasks }: SprintBurndownProps) => {
  const sprintTasks = tasks.filter(t => t.sprint_id === sprint.id);
  
  const burndownData = useMemo(() => {
    const startDate = startOfDay(parseISO(sprint.start_date));
    const endDate = startOfDay(parseISO(sprint.end_date));
    const today = startOfDay(new Date());
    
    // Get all days in the sprint
    const sprintDays = eachDayOfInterval({ start: startDate, end: endDate });
    const totalDays = sprintDays.length;
    
    // Calculate total work (using hours if available, otherwise task count)
    const useHours = sprintTasks.some(t => t.estimated_hours && t.estimated_hours > 0);
    const totalWork = useHours 
      ? sprintTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0)
      : sprintTasks.length;
    
    // Calculate ideal burndown (linear)
    const idealBurnPerDay = totalWork / (totalDays - 1 || 1);
    
    // Build data points
    const data: BurndownDataPoint[] = sprintDays.map((day, index) => {
      const idealRemaining = Math.max(0, totalWork - (idealBurnPerDay * index));
      
      // For past days and today, calculate actual remaining work
      let actualRemaining: number | null = null;
      
      if (!isAfter(day, today)) {
        // Count tasks completed by this day
        const completedByDay = sprintTasks.filter(task => {
          if (task.status !== 'completed') return false;
          // Use updated_at as completion date approximation
          const completedDate = startOfDay(parseISO(task.updated_at));
          return !isAfter(completedDate, day);
        });
        
        if (useHours) {
          const completedHours = completedByDay.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
          actualRemaining = totalWork - completedHours;
        } else {
          actualRemaining = totalWork - completedByDay.length;
        }
      }
      
      return {
        date: format(day, 'yyyy-MM-dd'),
        displayDate: format(day, 'MMM d'),
        ideal: Math.round(idealRemaining * 10) / 10,
        actual: actualRemaining !== null ? Math.round(actualRemaining * 10) / 10 : null,
        remaining: actualRemaining,
      };
    });
    
    return { data, totalWork, useHours };
  }, [sprint, sprintTasks]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const { data, totalWork, useHours } = burndownData;
    const today = startOfDay(new Date());
    const startDate = startOfDay(parseISO(sprint.start_date));
    const endDate = startOfDay(parseISO(sprint.end_date));
    
    const daysElapsed = Math.max(0, differenceInDays(today, startDate) + 1);
    const totalDays = differenceInDays(endDate, startDate) + 1;
    const daysRemaining = Math.max(0, differenceInDays(endDate, today));
    
    // Current actual remaining
    const todayData = data.find(d => d.date === format(today, 'yyyy-MM-dd'));
    const currentActual = todayData?.actual ?? totalWork;
    const currentIdeal = todayData?.ideal ?? 0;
    
    // Progress
    const completedWork = totalWork - currentActual;
    const progressPercent = totalWork > 0 ? Math.round((completedWork / totalWork) * 100) : 0;
    
    // Variance from ideal
    const variance = currentActual - currentIdeal;
    const variancePercent = totalWork > 0 ? Math.round((variance / totalWork) * 100) : 0;
    
    // Projected completion
    const burnRate = daysElapsed > 0 ? completedWork / daysElapsed : 0;
    const daysToComplete = burnRate > 0 ? Math.ceil(currentActual / burnRate) : Infinity;
    const projectedOnTrack = daysToComplete <= daysRemaining;
    
    return {
      totalWork,
      completedWork,
      currentActual,
      progressPercent,
      variance,
      variancePercent,
      daysElapsed,
      daysRemaining,
      totalDays,
      burnRate: Math.round(burnRate * 10) / 10,
      projectedOnTrack,
      useHours,
    };
  }, [burndownData, sprint]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">
              {entry.value !== null ? `${entry.value} ${metrics.useHours ? 'h' : 'tasks'}` : '-'}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-copper" />
            <CardTitle className="text-base">Sprint Burndown</CardTitle>
          </div>
          <Badge 
            variant="outline"
            className={cn(
              metrics.projectedOnTrack 
                ? "border-emerald-500/50 text-emerald-400" 
                : "border-red-500/50 text-red-400"
            )}
          >
            {metrics.projectedOnTrack ? 'On Track' : 'At Risk'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Metrics Row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <p className="text-2xl font-bold text-copper">{metrics.progressPercent}%</p>
            <p className="text-xs text-muted-foreground">Complete</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <p className="text-2xl font-bold">{metrics.currentActual}</p>
            <p className="text-xs text-muted-foreground">
              {metrics.useHours ? 'Hours' : 'Tasks'} Left
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <p className={cn(
              "text-2xl font-bold",
              metrics.variance > 0 ? "text-red-400" : metrics.variance < 0 ? "text-emerald-400" : ""
            )}>
              {metrics.variance > 0 ? '+' : ''}{metrics.variance}
            </p>
            <p className="text-xs text-muted-foreground">vs Ideal</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <p className="text-2xl font-bold">{metrics.daysRemaining}</p>
            <p className="text-xs text-muted-foreground">Days Left</p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={burndownData.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--copper))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--copper))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis 
                dataKey="displayDate" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                label={{ 
                  value: metrics.useHours ? 'Hours' : 'Tasks', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { fill: 'hsl(var(--muted-foreground))', fontSize: 11 }
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine 
                y={0} 
                stroke="hsl(var(--border))" 
              />
              {/* Ideal burndown line */}
              <Line
                type="linear"
                dataKey="ideal"
                name="Ideal"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
              {/* Actual burndown with area fill */}
              <Area
                type="monotone"
                dataKey="actual"
                name="Actual"
                stroke="hsl(var(--copper))"
                strokeWidth={3}
                fill="url(#actualGradient)"
                dot={{ fill: 'hsl(var(--copper))', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: 'hsl(var(--copper))' }}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-muted-foreground" style={{ borderStyle: 'dashed' }} />
            <span className="text-muted-foreground">Ideal Burndown</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-copper" />
            <span className="text-muted-foreground">Actual Progress</span>
          </div>
        </div>

        {/* Warning if behind */}
        {metrics.variance > 0 && metrics.variancePercent > 10 && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-400">Behind Schedule</p>
              <p className="text-xs text-muted-foreground">
                {metrics.variancePercent}% more work remaining than planned. 
                Consider reducing scope or extending the sprint.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SprintBurndown;
