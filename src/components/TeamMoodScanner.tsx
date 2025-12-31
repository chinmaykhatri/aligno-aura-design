import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  Smile, 
  Meh, 
  Frown,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  RefreshCw,
  Loader2,
  Flag
} from "lucide-react";
import { useProjectMessages } from "@/hooks/useProjectMessages";
import { useRetrospectives } from "@/hooks/useRetrospectives";
import { useSprints } from "@/hooks/useSprints";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TeamMoodScannerProps {
  projectId: string;
}

interface SentimentResult {
  overall: 'positive' | 'neutral' | 'negative';
  score: number; // -100 to 100
  confidence: number;
  riskSignals: {
    message: string;
    severity: 'low' | 'medium' | 'high';
    source: string;
    timestamp: string;
  }[];
  trends: {
    period: string;
    score: number;
  }[];
  keywords: {
    word: string;
    sentiment: 'positive' | 'negative';
    count: number;
  }[];
}

const TeamMoodScanner = ({ projectId }: TeamMoodScannerProps) => {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<SentimentResult | null>(null);
  
  const { data: messages } = useProjectMessages(projectId);
  const { data: sprints } = useSprints(projectId);
  const activeSprintId = sprints?.find(s => s.status === 'active')?.id;
  const { data: retrospectives } = useRetrospectives(activeSprintId);

  // Sentiment keywords for local analysis
  const sentimentKeywords = useMemo(() => ({
    positive: ['great', 'excellent', 'good', 'amazing', 'awesome', 'love', 'happy', 'excited', 'progress', 'success', 'completed', 'achieved', 'proud', 'confident', 'smooth', 'efficient'],
    negative: ['problem', 'issue', 'bug', 'stuck', 'blocked', 'frustrated', 'delay', 'late', 'failed', 'broken', 'worried', 'concerned', 'stress', 'overload', 'behind', 'risk', 'difficult', 'impossible', 'angry', 'disappointed']
  }), []);

  const analyzeSentiment = (text: string): { score: number; keywords: string[] } => {
    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    const foundKeywords: string[] = [];

    words.forEach(word => {
      if (sentimentKeywords.positive.some(kw => word.includes(kw))) {
        positiveCount++;
        foundKeywords.push(word);
      }
      if (sentimentKeywords.negative.some(kw => word.includes(kw))) {
        negativeCount++;
        foundKeywords.push(word);
      }
    });

    const total = positiveCount + negativeCount;
    if (total === 0) return { score: 0, keywords: [] };
    
    const score = ((positiveCount - negativeCount) / total) * 100;
    return { score, keywords: foundKeywords };
  };

  const scanTeamMood = async () => {
    setIsScanning(true);

    try {
      // Collect all text sources
      const allTexts: { text: string; source: string; timestamp: string }[] = [];

      // Add project messages
      messages?.forEach(msg => {
        allTexts.push({
          text: msg.content,
          source: 'chat',
          timestamp: msg.created_at
        });
      });

      // Add retrospective items
      retrospectives?.forEach(retro => {
        allTexts.push({
          text: retro.content,
          source: `retro-${retro.category}`,
          timestamp: retro.created_at
        });
      });

      // Analyze each text
      const analyses = allTexts.map(item => ({
        ...item,
        analysis: analyzeSentiment(item.text)
      }));

      // Calculate overall sentiment
      const validAnalyses = analyses.filter(a => a.analysis.score !== 0);
      const avgScore = validAnalyses.length > 0
        ? validAnalyses.reduce((sum, a) => sum + a.analysis.score, 0) / validAnalyses.length
        : 0;

      // Identify risk signals (negative sentiment messages)
      const riskSignals = analyses
        .filter(a => a.analysis.score < -30)
        .map(a => ({
          message: a.text.substring(0, 100) + (a.text.length > 100 ? '...' : ''),
          severity: (a.analysis.score < -70 ? 'high' : a.analysis.score < -50 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
          source: a.source,
          timestamp: a.timestamp
        }))
        .slice(0, 5);

      // Build keyword frequency
      const keywordMap: Record<string, { sentiment: 'positive' | 'negative'; count: number }> = {};
      analyses.forEach(a => {
        a.analysis.keywords.forEach(kw => {
          const sentiment = sentimentKeywords.positive.some(p => kw.includes(p)) ? 'positive' : 'negative';
          if (!keywordMap[kw]) {
            keywordMap[kw] = { sentiment, count: 0 };
          }
          keywordMap[kw].count++;
        });
      });

      const keywords = Object.entries(keywordMap)
        .map(([word, data]) => ({ word, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      // Build trend data (last 4 weeks)
      const now = new Date();
      const trends: { period: string; score: number }[] = [];
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - i * 7);

        const weekAnalyses = analyses.filter(a => {
          const date = new Date(a.timestamp);
          return date >= weekStart && date < weekEnd;
        });

        const weekScore = weekAnalyses.length > 0
          ? weekAnalyses.reduce((sum, a) => sum + a.analysis.score, 0) / weekAnalyses.length
          : 0;

        trends.push({
          period: `Week ${4 - i}`,
          score: Math.round(weekScore)
        });
      }

      setResult({
        overall: avgScore > 20 ? 'positive' : avgScore < -20 ? 'negative' : 'neutral',
        score: Math.round(avgScore),
        confidence: Math.min(95, 50 + validAnalyses.length * 5),
        riskSignals,
        trends,
        keywords
      });

      toast({
        title: "Scan Complete",
        description: `Analyzed ${allTexts.length} messages and comments`,
      });
    } catch (error) {
      toast({
        title: "Scan Failed",
        description: "Could not complete sentiment analysis",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'positive': return <Smile className="h-5 w-5 text-green-500" />;
      case 'negative': return <Frown className="h-5 w-5 text-red-500" />;
      default: return <Meh className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'positive': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'negative': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500/10 text-red-500';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500';
      default: return 'bg-blue-500/10 text-blue-500';
    }
  };

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-pink-500" />
            Team Mood Scanner
          </CardTitle>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={scanTeamMood}
            disabled={isScanning}
          >
            {isScanning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!result ? (
          <div className="text-center py-6 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Click refresh to scan team communications</p>
            <p className="text-xs">Analyzes chat, comments, and retrospectives</p>
          </div>
        ) : (
          <>
            {/* Overall Mood */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
              <div className="flex items-center gap-3">
                {getMoodIcon(result.overall)}
                <div>
                  <p className="font-medium capitalize">{result.overall} Mood</p>
                  <p className="text-xs text-muted-foreground">
                    Confidence: {result.confidence}%
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${
                  result.score > 0 ? 'text-green-500' : result.score < 0 ? 'text-red-500' : 'text-yellow-500'
                }`}>
                  {result.score > 0 ? '+' : ''}{result.score}
                </p>
                <p className="text-xs text-muted-foreground">Sentiment Score</p>
              </div>
            </div>

            {/* Trend */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Mood Trend</h4>
                {result.trends.length >= 2 && (
                  result.trends[result.trends.length - 1].score > result.trends[0].score ? (
                    <Badge variant="outline" className="bg-green-500/10 text-green-500">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Improving
                    </Badge>
                  ) : result.trends[result.trends.length - 1].score < result.trends[0].score ? (
                    <Badge variant="outline" className="bg-red-500/10 text-red-500">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      Declining
                    </Badge>
                  ) : (
                    <Badge variant="outline">Stable</Badge>
                  )
                )}
              </div>
              <div className="flex gap-1 h-16">
                {result.trends.map((trend, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end">
                    <div 
                      className={`w-full rounded-t ${
                        trend.score > 0 ? 'bg-green-500' : trend.score < 0 ? 'bg-red-500' : 'bg-yellow-500'
                      }`}
                      style={{ height: `${Math.abs(trend.score) / 2 + 20}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground mt-1">{trend.period}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Signals */}
            {result.riskSignals.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Flag className="h-4 w-4 text-red-500" />
                  Risk Signals ({result.riskSignals.length})
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {result.riskSignals.map((signal, i) => (
                    <div key={i} className="p-2 rounded bg-secondary/30 text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getSeverityColor(signal.severity)}>
                          {signal.severity}
                        </Badge>
                        <span className="text-muted-foreground">{signal.source}</span>
                      </div>
                      <p className="text-muted-foreground">{signal.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Keywords */}
            {result.keywords.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Key Themes</h4>
                <div className="flex flex-wrap gap-1">
                  {result.keywords.map((kw, i) => (
                    <Badge 
                      key={i} 
                      variant="outline"
                      className={kw.sentiment === 'positive' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}
                    >
                      {kw.word} ({kw.count})
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamMoodScanner;
