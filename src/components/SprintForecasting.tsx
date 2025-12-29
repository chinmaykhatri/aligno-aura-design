import { useMemo } from 'react';
import { Sprint } from '@/hooks/useSprints';
import { Task } from '@/hooks/useTasks';
import { useHistoricalVelocity } from '@/hooks/useSprintCapacity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Calendar, 
  Target, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap
} from 'lucide-react';
import { differenceInDays, format, addDays, isAfter, isBefore } from 'date-fns';
import { cn } from '@/lib/utils';

interface SprintForecastingProps {
  sprint: Sprint;
  tasks: Task[];
  projectId: string;
}

interface ForecastResult {
  estimatedCompletionDate: Date;
  confidence: 'high' | 'medium' | 'low';
  riskLevel: 'on_track' | 'at_risk' | 'behind';
  completionLikelihood: number;
  velocityTrend: 'increasing' | 'stable' | 'decreasing';
  recommendedActions: string[];
  daysRemaining: number;
  projectedVelocity: number;
  requiredVelocity: number;
}

export const SprintForecasting = ({ sprint, tasks, projectId }: SprintForecastingProps) => {
  const { data: velocityData } = useHistoricalVelocity(projectId);

  const forecast = useMemo((): ForecastResult | null => {
    const sprintTasks = tasks.filter(t => t.sprint_id === sprint.id);
    if (sprintTasks.length === 0) return null;

    const totalPoints = sprintTasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
    const completedPoints = sprintTasks
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.story_points || 0), 0);
    const remainingPoints = totalPoints - completedPoints;

    const startDate = new Date(sprint.start_date);
    const endDate = new Date(sprint.end_date);
    const today = new Date();
    
    const totalDays = differenceInDays(endDate, startDate);
    const elapsedDays = Math.max(0, differenceInDays(today, startDate));
    const daysRemaining = Math.max(0, differenceInDays(endDate, today));

    // Calculate current velocity (points per day)
    const currentVelocity = elapsedDays > 0 ? completedPoints / elapsedDays : 0;
    
    // Use historical velocity if available, otherwise use current
    const avgVelocity = velocityData?.averagePoints 
      ? velocityData.averagePoints / 14 // Assuming 2-week sprints historically
      : currentVelocity;
    
    const projectedVelocity = currentVelocity > 0 ? currentVelocity : avgVelocity;
    
    // Calculate required velocity to complete on time
    const requiredVelocity = daysRemaining > 0 ? remainingPoints / daysRemaining : remainingPoints;

    // Estimate completion date
    const daysToComplete = projectedVelocity > 0 ? remainingPoints / projectedVelocity : Infinity;
    const estimatedCompletionDate = addDays(today, Math.ceil(daysToComplete));

    // Calculate completion likelihood (0-100)
    let completionLikelihood: number;
    if (remainingPoints === 0) {
      completionLikelihood = 100;
    } else if (projectedVelocity === 0) {
      completionLikelihood = elapsedDays === 0 ? 50 : 10;
    } else {
      const ratio = projectedVelocity / requiredVelocity;
      completionLikelihood = Math.min(100, Math.max(0, Math.round(ratio * 100)));
    }

    // Determine risk level
    let riskLevel: 'on_track' | 'at_risk' | 'behind';
    if (completionLikelihood >= 80) {
      riskLevel = 'on_track';
    } else if (completionLikelihood >= 50) {
      riskLevel = 'at_risk';
    } else {
      riskLevel = 'behind';
    }

    // Determine confidence based on data availability
    let confidence: 'high' | 'medium' | 'low';
    if (velocityData && velocityData.sprints.length >= 3 && elapsedDays >= 3) {
      confidence = 'high';
    } else if (elapsedDays >= 2 || velocityData?.sprints.length >= 1) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    // Determine velocity trend
    let velocityTrend: 'increasing' | 'stable' | 'decreasing';
    if (velocityData && velocityData.trend > 2) {
      velocityTrend = 'increasing';
    } else if (velocityData && velocityData.trend < -2) {
      velocityTrend = 'decreasing';
    } else {
      velocityTrend = 'stable';
    }

    // Generate recommendations
    const recommendedActions: string[] = [];
    
    if (riskLevel === 'behind') {
      recommendedActions.push('Consider reducing sprint scope');
      recommendedActions.push('Identify and remove blockers');
    }
    if (riskLevel === 'at_risk') {
      recommendedActions.push('Focus on high-priority items');
      recommendedActions.push('Review task estimates');
    }
    if (sprintTasks.some(t => t.status === 'pending' && t.priority === 'high')) {
      recommendedActions.push('Start high-priority pending tasks');
    }
    if (currentVelocity < avgVelocity * 0.8) {
      recommendedActions.push('Current pace is below historical average');
    }

    return {
      estimatedCompletionDate,
      confidence,
      riskLevel,
      completionLikelihood,
      velocityTrend,
      recommendedActions,
      daysRemaining,
      projectedVelocity: Math.round(projectedVelocity * 100) / 100,
      requiredVelocity: Math.round(requiredVelocity * 100) / 100,
    };
  }, [sprint, tasks, velocityData]);

  if (!forecast) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="w-4 h-4 text-copper" />
            Sprint Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Add tasks to this sprint to see forecasting data
          </p>
        </CardContent>
      </Card>
    );
  }

  const sprintTasks = tasks.filter(t => t.sprint_id === sprint.id);
  const totalPoints = sprintTasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
  const completedPoints = sprintTasks
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + (t.story_points || 0), 0);
  const progressPercent = totalPoints > 0 ? (completedPoints / totalPoints) * 100 : 0;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'on_track': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
      case 'at_risk': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'behind': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'on_track': return <CheckCircle2 className="w-4 h-4" />;
      case 'at_risk': return <AlertTriangle className="w-4 h-4" />;
      case 'behind': return <AlertTriangle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'decreasing': return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-copper" />
            Sprint Forecast
          </span>
          <Badge variant="outline" className={cn("text-xs", getRiskColor(forecast.riskLevel))}>
            {getRiskIcon(forecast.riskLevel)}
            <span className="ml-1 capitalize">{forecast.riskLevel.replace('_', ' ')}</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Completion Likelihood */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Completion Likelihood</span>
            <span className="font-medium">{forecast.completionLikelihood}%</span>
          </div>
          <Progress 
            value={forecast.completionLikelihood} 
            className={cn(
              "h-2",
              forecast.completionLikelihood >= 80 && "[&>div]:bg-emerald-500",
              forecast.completionLikelihood >= 50 && forecast.completionLikelihood < 80 && "[&>div]:bg-yellow-500",
              forecast.completionLikelihood < 50 && "[&>div]:bg-red-500"
            )}
          />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Calendar className="w-3 h-3" />
              Est. Completion
            </div>
            <p className="text-sm font-medium">
              {isAfter(forecast.estimatedCompletionDate, new Date(sprint.end_date))
                ? <span className="text-red-400">
                    {format(forecast.estimatedCompletionDate, 'MMM d')}
                    <span className="text-xs ml-1">
                      (+{differenceInDays(forecast.estimatedCompletionDate, new Date(sprint.end_date))}d)
                    </span>
                  </span>
                : <span className="text-emerald-400">
                    {format(forecast.estimatedCompletionDate, 'MMM d')}
                  </span>
              }
            </p>
          </div>
          
          <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Clock className="w-3 h-3" />
              Days Remaining
            </div>
            <p className="text-sm font-medium">{forecast.daysRemaining} days</p>
          </div>
        </div>

        {/* Velocity Comparison */}
        <div className="p-3 rounded-lg bg-muted/30 border border-border/30 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Velocity Trend</span>
            <span className="flex items-center gap-1 capitalize">
              {getTrendIcon(forecast.velocityTrend)}
              {forecast.velocityTrend}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Current Pace</span>
            <span className="font-medium">{forecast.projectedVelocity} pts/day</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Required Pace</span>
            <span className={cn(
              "font-medium",
              forecast.requiredVelocity > forecast.projectedVelocity ? "text-yellow-400" : "text-emerald-400"
            )}>
              {forecast.requiredVelocity} pts/day
            </span>
          </div>
        </div>

        {/* Confidence Indicator */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Forecast Confidence</span>
          <Badge variant="outline" className={cn(
            "text-xs",
            forecast.confidence === 'high' && "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
            forecast.confidence === 'medium' && "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
            forecast.confidence === 'low' && "bg-muted text-muted-foreground"
          )}>
            {forecast.confidence}
          </Badge>
        </div>

        {/* Recommendations */}
        {forecast.recommendedActions.length > 0 && (
          <div className="pt-2 border-t border-border/30">
            <p className="text-xs text-muted-foreground mb-2">Recommendations</p>
            <ul className="space-y-1">
              {forecast.recommendedActions.slice(0, 3).map((action, index) => (
                <li key={index} className="text-xs flex items-start gap-2">
                  <Target className="w-3 h-3 mt-0.5 text-copper shrink-0" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
