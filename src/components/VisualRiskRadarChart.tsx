import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { Crosshair, AlertTriangle, Clock, Users, Layers, Target } from 'lucide-react';

interface RiskDimension {
  dimension: string;
  risk: number;
  threshold: number;
  fullMark: 100;
}

interface VisualRiskRadarChartProps {
  projectId: string;
  tasks: any[];
  sprints: any[];
}

const calculateRiskDimensions = (tasks: any[], sprints: any[]): RiskDimension[] => {
  const now = new Date();
  const totalTasks = tasks.length || 1;
  
  // Schedule Risk - overdue tasks ratio
  const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'completed');
  const scheduleRisk = Math.min(100, (overdueTasks.length / totalTasks) * 200);
  
  // Scope Risk - tasks without estimates or with scope changes
  const noEstimateTasks = tasks.filter(t => !t.estimated_hours && t.status !== 'completed');
  const scopeRisk = Math.min(100, (noEstimateTasks.length / totalTasks) * 150);
  
  // Resource Risk - unassigned high priority tasks
  const unassignedHighPriority = tasks.filter(t => !t.assigned_to && t.priority === 'high' && t.status !== 'completed');
  const resourceRisk = Math.min(100, (unassignedHighPriority.length / totalTasks) * 200);
  
  // Dependency Risk - blocked tasks or tasks waiting on others
  const blockedTasks = tasks.filter(t => t.status === 'blocked');
  const dependencyRisk = Math.min(100, (blockedTasks.length / totalTasks) * 250);
  
  // Quality Risk - rushed tasks (estimated vs tracked)
  const rushedTasks = tasks.filter(t => 
    t.tracked_hours && t.estimated_hours && t.tracked_hours < t.estimated_hours * 0.5 && t.status === 'completed'
  );
  const qualityRisk = Math.min(100, (rushedTasks.length / Math.max(tasks.filter(t => t.status === 'completed').length, 1)) * 150);

  return [
    { dimension: 'Schedule', risk: Math.round(scheduleRisk), threshold: 50, fullMark: 100 },
    { dimension: 'Scope', risk: Math.round(scopeRisk), threshold: 50, fullMark: 100 },
    { dimension: 'Resource', risk: Math.round(resourceRisk), threshold: 50, fullMark: 100 },
    { dimension: 'Dependency', risk: Math.round(dependencyRisk), threshold: 50, fullMark: 100 },
    { dimension: 'Quality', risk: Math.round(qualityRisk), threshold: 50, fullMark: 100 },
  ];
};

const getRiskIcon = (dimension: string) => {
  switch (dimension) {
    case 'Schedule': return <Clock className="h-4 w-4" />;
    case 'Scope': return <Layers className="h-4 w-4" />;
    case 'Resource': return <Users className="h-4 w-4" />;
    case 'Dependency': return <Target className="h-4 w-4" />;
    case 'Quality': return <AlertTriangle className="h-4 w-4" />;
    default: return <Crosshair className="h-4 w-4" />;
  }
};

const getRiskLevel = (score: number): { label: string; color: string } => {
  if (score >= 70) return { label: 'Critical', color: 'text-red-500 bg-red-500/10' };
  if (score >= 50) return { label: 'High', color: 'text-orange-500 bg-orange-500/10' };
  if (score >= 30) return { label: 'Medium', color: 'text-amber-500 bg-amber-500/10' };
  return { label: 'Low', color: 'text-green-500 bg-green-500/10' };
};

export const VisualRiskRadarChart = ({ projectId, tasks, sprints }: VisualRiskRadarChartProps) => {
  const riskData = calculateRiskDimensions(tasks || [], sprints || []);
  const highestRisk = riskData.reduce((max, r) => r.risk > max.risk ? r : max, riskData[0]);
  const avgRisk = Math.round(riskData.reduce((sum, r) => sum + r.risk, 0) / riskData.length);

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Crosshair className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Risk Radar</CardTitle>
              <CardDescription>Multi-dimensional risk view</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={getRiskLevel(avgRisk).color}>
            Avg: {avgRisk}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Radar Chart */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={riskData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis 
                dataKey="dimension" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              />
              <Radar
                name="Risk Level"
                dataKey="risk"
                stroke="hsl(var(--destructive))"
                fill="hsl(var(--destructive))"
                fillOpacity={0.3}
              />
              <Radar
                name="Threshold"
                dataKey="threshold"
                stroke="hsl(var(--primary))"
                fill="none"
                strokeDasharray="5 5"
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Breakdown */}
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Risk Breakdown</h4>
          {riskData.map((risk) => {
            const level = getRiskLevel(risk.risk);
            return (
              <div 
                key={risk.dimension} 
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-background/50 border border-border/30"
              >
                <div className="flex items-center gap-2">
                  <span className={level.color.split(' ')[0]}>
                    {getRiskIcon(risk.dimension)}
                  </span>
                  <span className="text-sm">{risk.dimension}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        risk.risk >= 70 ? 'bg-red-500' :
                        risk.risk >= 50 ? 'bg-orange-500' :
                        risk.risk >= 30 ? 'bg-amber-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${risk.risk}%` }}
                    />
                  </div>
                  <Badge variant="outline" className={`${level.color} text-xs px-2`}>
                    {risk.risk}%
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>

        {/* Highest Risk Callout */}
        {highestRisk.risk > 30 && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Highest Risk: {highestRisk.dimension}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {highestRisk.dimension === 'Schedule' && 'Multiple tasks are overdue or at risk of slipping'}
              {highestRisk.dimension === 'Scope' && 'Many tasks lack proper estimates or have undefined scope'}
              {highestRisk.dimension === 'Resource' && 'High priority tasks need assignees'}
              {highestRisk.dimension === 'Dependency' && 'Blocked tasks are impacting progress'}
              {highestRisk.dimension === 'Quality' && 'Tasks may be rushed - review quality controls'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VisualRiskRadarChart;
