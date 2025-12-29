import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Lightbulb, 
  Loader2, 
  TrendingUp, 
  Users, 
  Wrench, 
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Retrospective {
  id: string;
  category: string;
  content: string;
  is_resolved: boolean;
}

interface RetrospectiveInsightsProps {
  sprintId: string;
  sprintName: string;
  retrospectives: Retrospective[];
  sprintStats?: {
    completionRate: number;
    completedPoints: number;
    completedTasks: number;
    totalTasks: number;
  };
}

interface Theme {
  theme: string;
  category: string;
  frequency: number;
  items: string[];
}

interface Insight {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'team' | 'process' | 'technical' | 'communication';
}

interface ActionItem {
  action: string;
  owner: string;
  priority: 'high' | 'medium' | 'low';
  timeframe: 'immediate' | 'next_sprint' | 'ongoing';
}

export const RetrospectiveInsights = ({ 
  sprintId,
  sprintName, 
  retrospectives,
  sprintStats 
}: RetrospectiveInsightsProps) => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [actionPlan, setActionPlan] = useState<ActionItem[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const generateInsights = async () => {
    if (retrospectives.length < 2) {
      toast.error('Add at least 2 retrospective items to generate insights');
      return;
    }

    setIsLoading(true);
    setThemes([]);
    setInsights([]);
    setActionPlan([]);
    setSummary('');

    try {
      const { data, error } = await supabase.functions.invoke('ai-insights', {
        body: {
          type: 'retrospective-insights',
          data: {
            retrospectives,
            sprintName,
            sprintStats,
          },
        },
      });

      if (error) throw error;

      if (data.result?.themes) setThemes(data.result.themes);
      if (data.result?.insights) setInsights(data.result.insights);
      if (data.result?.actionPlan) setActionPlan(data.result.actionPlan);
      if (data.result?.summary) setSummary(data.result.summary);

      if (data.result?.error) {
        throw new Error(data.result.error);
      }
    } catch (err) {
      console.error('Failed to generate insights:', err);
      toast.error('Failed to analyze retrospective');
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'team': return <Users className="w-4 h-4 text-blue-400" />;
      case 'process': return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'technical': return <Wrench className="w-4 h-4 text-purple-400" />;
      case 'communication': return <MessageSquare className="w-4 h-4 text-yellow-400" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTimeframeIcon = (timeframe: string) => {
    switch (timeframe) {
      case 'immediate': return <AlertTriangle className="w-3 h-3 text-red-400" />;
      case 'next_sprint': return <Clock className="w-3 h-3 text-yellow-400" />;
      case 'ongoing': return <TrendingUp className="w-3 h-3 text-blue-400" />;
      default: return null;
    }
  };

  const hasResults = themes.length > 0 || insights.length > 0 || actionPlan.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-copper" />
            AI Retrospective Analysis
          </span>
          <Button
            size="sm"
            onClick={generateInsights}
            disabled={isLoading || retrospectives.length < 2}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Lightbulb className="w-4 h-4" />
            )}
            {isLoading ? 'Analyzing...' : 'Analyze'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {retrospectives.length < 2 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Add retrospective items to analyze</p>
            <p className="text-xs mt-1">At least 2 items needed for analysis</p>
          </div>
        ) : !hasResults && !isLoading ? (
          <div className="text-center py-6 text-muted-foreground">
            <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Get AI-powered retrospective insights</p>
            <p className="text-xs mt-1">{retrospectives.length} items to analyze</p>
          </div>
        ) : (
          <>
            {/* Summary */}
            {summary && (
              <div className="p-3 rounded-lg bg-copper/10 border border-copper/30">
                <p className="text-sm">{summary}</p>
              </div>
            )}

            {/* Themes */}
            {themes.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Key Themes</span>
                <div className="flex flex-wrap gap-2">
                  {themes.map((theme, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className={cn(
                        "text-xs",
                        theme.category === 'went_well' && "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
                        theme.category === 'to_improve' && "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
                        theme.category === 'action_item' && "bg-blue-500/20 text-blue-400 border-blue-500/30"
                      )}
                    >
                      {theme.theme} ({theme.frequency})
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Insights */}
            {insights.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Insights</span>
                {insights.map((insight, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-muted/20 border border-border/20"
                  >
                    <div className="flex items-start gap-2">
                      {getCategoryIcon(insight.category)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{insight.title}</span>
                          <Badge variant="outline" className={cn("text-xs", getImpactColor(insight.impact))}>
                            {insight.impact} impact
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Action Plan */}
            {actionPlan.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Suggested Actions</span>
                {actionPlan.map((action, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-muted/20 border border-border/20"
                  >
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-copper mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm">{action.action}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>Owner: {action.owner}</span>
                          <span className="flex items-center gap-1">
                            {getTimeframeIcon(action.timeframe)}
                            <span className="capitalize">{action.timeframe.replace('_', ' ')}</span>
                          </span>
                          <Badge variant="outline" className={cn("text-xs", getImpactColor(action.priority))}>
                            {action.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
