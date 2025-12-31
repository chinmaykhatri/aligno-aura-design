import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCw,
  UserPlus,
  Building
} from "lucide-react";
import { useTeamTimeOff } from "@/hooks/useTeamTimeOff";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Task {
  id: string;
  title: string;
  status: string;
  estimated_hours?: number | null;
  due_date?: string | null;
  assigned_to?: string | null;
}

interface TeamMember {
  user_id: string;
  full_name: string | null;
  role: string;
}

interface AICapacityForecasterProps {
  projectId: string;
  tasks: Task[];
  teamMembers: TeamMember[];
}

interface ForecastData {
  month: string;
  capacity: number;
  demand: number;
  utilization: number;
}

interface HiringRecommendation {
  role: string;
  count: number;
  urgency: 'low' | 'medium' | 'high';
  reason: string;
  startMonth: string;
}

const AICapacityForecaster = ({ projectId, tasks, teamMembers }: AICapacityForecasterProps) => {
  const [isForecasting, setIsForecasting] = useState(false);
  const [forecastMonths, setForecastMonths] = useState(6);
  const { data: timeOff } = useTeamTimeOff(projectId);

  const getSeasonalFactor = (month: number): number => {
    // Lower capacity during holiday months
    const seasonalFactors: Record<number, number> = {
      0: 0.9,  // January
      6: 0.85, // July
      7: 0.85, // August
      11: 0.8, // December
    };
    return seasonalFactors[month] || 1;
  };

  const generateForecast = useMemo(() => {
    const today = new Date();
    const forecast: ForecastData[] = [];
    const baseCapacityPerPerson = 160; // hours per month
    const teamSize = teamMembers.length || 1;
    
    // Calculate time-off patterns
    const timeOffByMonth: Record<string, number> = {};
    timeOff?.forEach(to => {
      const start = new Date(to.start_date);
      const end = new Date(to.end_date);
      const monthKey = `${start.getFullYear()}-${start.getMonth()}`;
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      timeOffByMonth[monthKey] = (timeOffByMonth[monthKey] || 0) + (days * to.hours_per_day);
    });

    // Calculate remaining work
    const remainingTasks = tasks.filter(t => t.status !== 'completed');
    const totalRemainingHours = remainingTasks.reduce((sum, t) => sum + (t.estimated_hours || 4), 0);
    const avgMonthlyDemand = totalRemainingHours / forecastMonths;

    for (let i = 0; i < forecastMonths; i++) {
      const monthDate = new Date(today);
      monthDate.setMonth(monthDate.getMonth() + i);
      const monthKey = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;
      
      // Calculate capacity with time-off deductions
      const timeOffHours = timeOffByMonth[monthKey] || 0;
      const seasonalFactor = getSeasonalFactor(monthDate.getMonth());
      const capacity = Math.max(0, (teamSize * baseCapacityPerPerson - timeOffHours) * seasonalFactor);
      
      // Estimate demand with some variance
      const demandVariance = 0.8 + Math.random() * 0.4; // 80-120% variance
      const demand = avgMonthlyDemand * demandVariance * (1 + i * 0.05); // Slight increase over time
      
      const utilization = capacity > 0 ? Math.min(150, (demand / capacity) * 100) : 0;

      forecast.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        capacity: Math.round(capacity),
        demand: Math.round(demand),
        utilization: Math.round(utilization)
      });
    }

    return forecast;
  }, [tasks, teamMembers, timeOff, forecastMonths]);

  const hiringRecommendations = useMemo((): HiringRecommendation[] => {
    const recommendations: HiringRecommendation[] = [];
    
    // Analyze forecast for capacity gaps
    const overutilizedMonths = generateForecast.filter(f => f.utilization > 100);
    const severelyOverutilized = generateForecast.filter(f => f.utilization > 130);

    if (severelyOverutilized.length >= 2) {
      const avgGap = severelyOverutilized.reduce((sum, f) => sum + (f.demand - f.capacity), 0) / severelyOverutilized.length;
      const devsNeeded = Math.ceil(avgGap / 160);
      
      recommendations.push({
        role: 'Developer',
        count: devsNeeded,
        urgency: 'high',
        reason: `${severelyOverutilized.length} months show >130% utilization`,
        startMonth: generateForecast[0]?.month || 'Immediately'
      });
    } else if (overutilizedMonths.length >= 3) {
      recommendations.push({
        role: 'Developer',
        count: 1,
        urgency: 'medium',
        reason: `${overutilizedMonths.length} months exceed capacity`,
        startMonth: overutilizedMonths[0]?.month || 'Soon'
      });
    }

    // Check for specific skill gaps (simulated)
    if (tasks.some(t => t.title.toLowerCase().includes('design') || t.title.toLowerCase().includes('ui'))) {
      const designTasks = tasks.filter(t => 
        t.title.toLowerCase().includes('design') || t.title.toLowerCase().includes('ui')
      );
      if (designTasks.length > teamMembers.length * 2) {
        recommendations.push({
          role: 'UI/UX Designer',
          count: 1,
          urgency: 'medium',
          reason: 'High volume of design-related tasks detected',
          startMonth: generateForecast[1]?.month || 'Next month'
        });
      }
    }

    // Contractor recommendation for short-term gaps
    const shortTermOverload = generateForecast.slice(0, 2).filter(f => f.utilization > 110);
    if (shortTermOverload.length > 0 && !recommendations.some(r => r.urgency === 'high')) {
      recommendations.push({
        role: 'Contractor',
        count: 1,
        urgency: 'low',
        reason: 'Short-term capacity gap in next 2 months',
        startMonth: 'Immediate'
      });
    }

    return recommendations;
  }, [generateForecast, tasks, teamMembers]);

  const avgUtilization = useMemo(() => {
    if (generateForecast.length === 0) return 0;
    return Math.round(generateForecast.reduce((sum, f) => sum + f.utilization, 0) / generateForecast.length);
  }, [generateForecast]);

  const getUtilizationColor = (util: number) => {
    if (util < 70) return 'text-blue-500';
    if (util < 90) return 'text-green-500';
    if (util < 110) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  const handleRefresh = () => {
    setIsForecasting(true);
    setTimeout(() => setIsForecasting(false), 1000);
  };

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            AI Capacity Forecaster
          </CardTitle>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={handleRefresh}
            disabled={isForecasting}
          >
            <RefreshCw className={`h-4 w-4 ${isForecasting ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Metrics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-lg bg-secondary/30 text-center">
            <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-bold">{teamMembers.length}</p>
            <p className="text-xs text-muted-foreground">Team Size</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/30 text-center">
            <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className={`text-lg font-bold ${getUtilizationColor(avgUtilization)}`}>
              {avgUtilization}%
            </p>
            <p className="text-xs text-muted-foreground">Avg Utilization</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/30 text-center">
            <Calendar className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-bold">{forecastMonths}</p>
            <p className="text-xs text-muted-foreground">Months Ahead</p>
          </div>
        </div>

        {/* Capacity vs Demand Chart */}
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={generateForecast}>
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value: number, name: string) => [
                  `${value} hrs`,
                  name === 'capacity' ? 'Capacity' : 'Demand'
                ]}
              />
              <Area 
                type="monotone" 
                dataKey="capacity" 
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="demand" 
                stroke="#f97316"
                fill="#f97316"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex gap-4 justify-center text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-primary/60" />
            <span>Capacity</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-orange-500/60" />
            <span>Demand</span>
          </div>
        </div>

        {/* Monthly Utilization */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Monthly Utilization</h4>
          {generateForecast.slice(0, 4).map((month, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>{month.month}</span>
                <span className={getUtilizationColor(month.utilization)}>
                  {month.utilization}%
                </span>
              </div>
              <Progress 
                value={Math.min(100, month.utilization)} 
                className={`h-2 ${
                  month.utilization > 100 
                    ? '[&>div]:bg-red-500' 
                    : month.utilization > 90 
                      ? '[&>div]:bg-yellow-500' 
                      : ''
                }`}
              />
            </div>
          ))}
        </div>

        {/* Hiring Recommendations */}
        {hiringRecommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Hiring Recommendations
            </h4>
            {hiringRecommendations.map((rec, index) => (
              <div 
                key={index}
                className="p-3 rounded-lg border border-border/60 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {rec.role === 'Contractor' ? (
                      <Building className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Users className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-medium text-sm">
                      {rec.count}x {rec.role}
                    </span>
                  </div>
                  <Badge variant="outline" className={getUrgencyColor(rec.urgency)}>
                    {rec.urgency}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{rec.reason}</p>
                <p className="text-xs">
                  <span className="text-muted-foreground">Start by: </span>
                  <span className="font-medium">{rec.startMonth}</span>
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Alerts */}
        {generateForecast.some(f => f.utilization > 120) && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium text-red-500">Capacity Risk Detected</p>
              <p className="text-muted-foreground">
                Some months show &gt;120% utilization. Consider hiring or scope adjustments.
              </p>
            </div>
          </div>
        )}

        {avgUtilization >= 70 && avgUtilization <= 90 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium text-green-500">Healthy Capacity</p>
              <p className="text-muted-foreground">
                Team utilization is in the optimal range (70-90%).
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AICapacityForecaster;
