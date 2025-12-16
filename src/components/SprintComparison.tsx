import React, { useState, useMemo } from 'react';
import { Sprint } from '@/hooks/useSprints';
import { Task } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { BarChart3, TrendingUp, TrendingDown, Minus, Target } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface SprintComparisonProps {
  sprints: Sprint[];
  tasks: Task[];
}

interface SprintMetrics {
  id: string;
  name: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  totalHours: number;
  completedHours: number;
  totalPoints: number;
  completedPoints: number;
  hoursEfficiency: number;
  duration: number;
  velocity: number; // tasks per day
  avgTaskSize: number;
}

const SprintComparison = ({ sprints, tasks }: SprintComparisonProps) => {
  const completedSprints = sprints.filter(s => s.status === 'completed' || s.status === 'active');
  const [selectedSprints, setSelectedSprints] = useState<string[]>(
    completedSprints.slice(0, 4).map(s => s.id)
  );

  const sprintMetrics = useMemo((): SprintMetrics[] => {
    return completedSprints.map(sprint => {
      const sprintTasks = tasks.filter(t => t.sprint_id === sprint.id);
      const completedTasks = sprintTasks.filter(t => t.status === 'completed');
      const totalHours = sprintTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
      const completedHours = completedTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
      const totalPoints = sprintTasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
      const completedPoints = completedTasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
      const duration = differenceInDays(parseISO(sprint.end_date), parseISO(sprint.start_date)) || 1;

      return {
        id: sprint.id,
        name: sprint.name,
        totalTasks: sprintTasks.length,
        completedTasks: completedTasks.length,
        completionRate: sprintTasks.length > 0 
          ? Math.round((completedTasks.length / sprintTasks.length) * 100) 
          : 0,
        totalHours,
        completedHours,
        totalPoints,
        completedPoints,
        hoursEfficiency: totalHours > 0 
          ? Math.round((completedHours / totalHours) * 100) 
          : 0,
        duration,
        velocity: Math.round((completedTasks.length / duration) * 10) / 10,
        avgTaskSize: completedTasks.length > 0 
          ? Math.round((completedHours / completedTasks.length) * 10) / 10 
          : 0,
      };
    });
  }, [completedSprints, tasks]);

  const selectedMetrics = sprintMetrics.filter(m => selectedSprints.includes(m.id));

  const toggleSprint = (sprintId: string) => {
    setSelectedSprints(prev => 
      prev.includes(sprintId)
        ? prev.filter(id => id !== sprintId)
        : [...prev, sprintId]
    );
  };

  const chartData = selectedMetrics.map(m => ({
    name: m.name.length > 12 ? m.name.substring(0, 12) + '...' : m.name,
    'Tasks Completed': m.completedTasks,
    'Completion %': m.completionRate,
    'Hours Completed': m.completedHours,
  }));

  const radarData = [
    { metric: 'Completion Rate', ...Object.fromEntries(selectedMetrics.map(m => [m.name, m.completionRate])) },
    { metric: 'Hours Efficiency', ...Object.fromEntries(selectedMetrics.map(m => [m.name, m.hoursEfficiency])) },
    { metric: 'Velocity Score', ...Object.fromEntries(selectedMetrics.map(m => [m.name, Math.min(m.velocity * 20, 100)])) },
    { metric: 'Task Volume', ...Object.fromEntries(selectedMetrics.map(m => [m.name, Math.min(m.totalTasks * 5, 100)])) },
  ];

  const getTrend = (current: number, previous: number) => {
    if (current > previous) return { icon: TrendingUp, color: 'text-emerald-400', label: 'up' };
    if (current < previous) return { icon: TrendingDown, color: 'text-red-400', label: 'down' };
    return { icon: Minus, color: 'text-muted-foreground', label: 'same' };
  };

  const colors = ['#CF8B5A', '#60A5FA', '#34D399', '#F472B6', '#A78BFA'];

  if (completedSprints.length < 2) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="py-12 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            Complete at least 2 sprints to see comparison analysis
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-copper" />
            <CardTitle className="text-lg">Sprint Comparison</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {selectedSprints.length} selected
          </Badge>
        </div>
        
        {/* Sprint Selection */}
        <div className="flex flex-wrap gap-2 mt-3">
          {completedSprints.map((sprint, index) => (
            <label
              key={sprint.id}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors border",
                selectedSprints.includes(sprint.id)
                  ? "bg-copper/20 border-copper/50"
                  : "bg-muted/30 border-border/30 hover:bg-muted/50"
              )}
            >
              <Checkbox
                checked={selectedSprints.includes(sprint.id)}
                onCheckedChange={() => toggleSprint(sprint.id)}
              />
              <span className="text-sm">{sprint.name}</span>
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
            </label>
          ))}
        </div>
      </CardHeader>

      {selectedMetrics.length > 0 && (
        <CardContent className="space-y-6">
          {/* Metrics Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">Metric</th>
                  {selectedMetrics.map((m, i) => (
                    <th key={m.id} className="text-center py-2 px-2">
                      <div className="flex items-center justify-center gap-1">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: colors[completedSprints.findIndex(s => s.id === m.id) % colors.length] }}
                        />
                        <span className="font-medium">{m.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/30">
                  <td className="py-2 px-2 text-muted-foreground">Tasks Completed</td>
                  {selectedMetrics.map((m, i) => (
                    <td key={m.id} className="text-center py-2 px-2 font-medium">
                      {m.completedTasks}/{m.totalTasks}
                      {i > 0 && (
                        <span className={cn("ml-1", getTrend(m.completedTasks, selectedMetrics[i-1].completedTasks).color)}>
                          {React.createElement(getTrend(m.completedTasks, selectedMetrics[i-1].completedTasks).icon, { className: "inline h-3 w-3" })}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-border/30">
                  <td className="py-2 px-2 text-muted-foreground">Completion Rate</td>
                  {selectedMetrics.map((m, i) => (
                    <td key={m.id} className="text-center py-2 px-2">
                      <Badge className={cn(
                        "font-medium",
                        m.completionRate >= 80 ? "bg-emerald-500/20 text-emerald-400" :
                        m.completionRate >= 60 ? "bg-amber-500/20 text-amber-400" :
                        "bg-red-500/20 text-red-400"
                      )}>
                        {m.completionRate}%
                      </Badge>
                    </td>
                  ))}
                </tr>
                {selectedMetrics.some(m => m.totalPoints > 0) && (
                  <tr className="border-b border-border/30">
                    <td className="py-2 px-2 text-muted-foreground">Story Points</td>
                    {selectedMetrics.map(m => (
                      <td key={m.id} className="text-center py-2 px-2 font-medium text-purple-400">
                        {m.completedPoints} / {m.totalPoints} SP
                      </td>
                    ))}
                  </tr>
                )}
                <tr className="border-b border-border/30">
                  <td className="py-2 px-2 text-muted-foreground">Hours Completed</td>
                  {selectedMetrics.map(m => (
                    <td key={m.id} className="text-center py-2 px-2 font-medium">
                      {m.completedHours}h / {m.totalHours}h
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-border/30">
                  <td className="py-2 px-2 text-muted-foreground">Velocity (tasks/day)</td>
                  {selectedMetrics.map(m => (
                    <td key={m.id} className="text-center py-2 px-2 font-medium text-copper">
                      {m.velocity}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 px-2 text-muted-foreground">Avg Task Size</td>
                  {selectedMetrics.map(m => (
                    <td key={m.id} className="text-center py-2 px-2 font-medium">
                      {m.avgTaskSize}h
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bar Chart */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Tasks & Completion Overview</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Tasks Completed" fill="#CF8B5A" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Completion %" fill="#60A5FA" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Radar Chart for Multi-dimensional Comparison */}
          {selectedMetrics.length >= 2 && selectedMetrics.length <= 4 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Performance Radar</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis 
                      dataKey="metric" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    />
                    <PolarRadiusAxis 
                      angle={30} 
                      domain={[0, 100]}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                    />
                    {selectedMetrics.map((m, i) => (
                      <Radar
                        key={m.id}
                        name={m.name}
                        dataKey={m.name}
                        stroke={colors[completedSprints.findIndex(s => s.id === m.id) % colors.length]}
                        fill={colors[completedSprints.findIndex(s => s.id === m.id) % colors.length]}
                        fillOpacity={0.2}
                      />
                    ))}
                    <Legend />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Insights */}
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-copper" />
              <span className="text-sm font-medium">Key Insights</span>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {selectedMetrics.length > 1 && (
                <>
                  <li>
                    • Best completion rate: <span className="text-foreground font-medium">
                      {selectedMetrics.reduce((best, m) => m.completionRate > best.completionRate ? m : best).name}
                    </span> ({Math.max(...selectedMetrics.map(m => m.completionRate))}%)
                  </li>
                  <li>
                    • Highest velocity: <span className="text-foreground font-medium">
                      {selectedMetrics.reduce((best, m) => m.velocity > best.velocity ? m : best).name}
                    </span> ({Math.max(...selectedMetrics.map(m => m.velocity))} tasks/day)
                  </li>
                  <li>
                    • Average completion rate across sprints: <span className="text-foreground font-medium">
                      {Math.round(selectedMetrics.reduce((sum, m) => sum + m.completionRate, 0) / selectedMetrics.length)}%
                    </span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default SprintComparison;
