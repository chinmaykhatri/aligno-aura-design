import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  Clock, 
  Target,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useRiskAnalysis, RiskAnalysisResult } from '@/hooks/useRiskAnalysis';

interface RiskRadarProps {
  projectId: string;
}

const getRiskColor = (level: string) => {
  switch (level) {
    case 'critical': return 'bg-red-500 text-white';
    case 'high': return 'bg-orange-500 text-white';
    case 'medium': return 'bg-amber-500 text-black';
    case 'low': return 'bg-green-500 text-white';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getRiskBorderColor = (level: string) => {
  switch (level) {
    case 'critical': return 'border-red-500/50';
    case 'high': return 'border-orange-500/50';
    case 'medium': return 'border-amber-500/50';
    case 'low': return 'border-green-500/50';
    default: return 'border-border';
  }
};

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'immediate': return <Zap className="h-4 w-4 text-red-500" />;
    case 'soon': return <Clock className="h-4 w-4 text-amber-500" />;
    default: return <Target className="h-4 w-4 text-muted-foreground" />;
  }
};

const RiskRadar = ({ projectId }: RiskRadarProps) => {
  const { isAnalyzing, analysis, analyzeRisks } = useRiskAnalysis(projectId);

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Risk Radar</CardTitle>
              <CardDescription>AI-powered early warning system</CardDescription>
            </div>
          </div>
          <Button 
            onClick={analyzeRisks} 
            disabled={isAnalyzing}
            size="sm"
            className="gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Scan Risks
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!analysis ? (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground mb-4">
              Click "Scan Risks" to analyze your project for potential issues
            </p>
            <p className="text-xs text-muted-foreground">
              AI will analyze schedules, workload, and history to predict risks
            </p>
          </div>
        ) : (
          <RiskAnalysisDisplay analysis={analysis} />
        )}
      </CardContent>
    </Card>
  );
};

const RiskAnalysisDisplay = ({ analysis }: { analysis: RiskAnalysisResult }) => {
  const { projectRisk, taskRisks, sprintRisks } = analysis;

  return (
    <div className="space-y-6">
      {/* Risk Score Overview */}
      <div className={`p-4 rounded-lg border-2 ${getRiskBorderColor(projectRisk.riskLevel)} bg-background/50`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${getRiskColor(projectRisk.riskLevel)}`}>
              {projectRisk.riskLevel === 'low' ? (
                <CheckCircle className="h-6 w-6" />
              ) : projectRisk.riskLevel === 'critical' ? (
                <XCircle className="h-6 w-6" />
              ) : (
                <AlertTriangle className="h-6 w-6" />
              )}
            </div>
            <div>
              <h3 className="text-2xl font-bold">{projectRisk.riskScore}</h3>
              <p className="text-sm text-muted-foreground">Risk Score</p>
            </div>
          </div>
          <div className="text-right">
            <Badge className={getRiskColor(projectRisk.riskLevel)}>
              {projectRisk.riskLevel.toUpperCase()}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              {projectRisk.confidenceScore}% confidence
            </p>
          </div>
        </div>
        
        <Progress 
          value={projectRisk.riskScore} 
          className="h-2 mb-3"
        />
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {projectRisk.predictedSlipDays > 0 
                ? `~${projectRisk.predictedSlipDays} days slip predicted`
                : 'On track'}
            </span>
          </div>
        </div>
        
        {projectRisk.summary && (
          <p className="text-sm mt-3 text-muted-foreground">{projectRisk.summary}</p>
        )}
      </div>

      <Tabs defaultValue="factors" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="factors">Risk Factors</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="tasks">At-Risk Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="factors" className="mt-4">
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {projectRisk.riskFactors.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No significant risk factors identified</p>
              ) : (
                projectRisk.riskFactors.map((factor, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg border ${getRiskBorderColor(factor.severity)} bg-background/50`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className={`h-4 w-4 ${
                            factor.severity === 'high' ? 'text-red-500' :
                            factor.severity === 'medium' ? 'text-amber-500' : 'text-muted-foreground'
                          }`} />
                          <span className="font-medium text-sm">{factor.factor}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{factor.impact}</p>
                      </div>
                      <Badge variant="outline" className={
                        factor.severity === 'high' ? 'border-red-500/50 text-red-500' :
                        factor.severity === 'medium' ? 'border-amber-500/50 text-amber-500' :
                        'border-green-500/50 text-green-500'
                      }>
                        {factor.severity}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="actions" className="mt-4">
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {projectRisk.mitigationActions.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No mitigation actions needed</p>
              ) : (
                projectRisk.mitigationActions.map((action, index) => (
                  <div 
                    key={index}
                    className="p-3 rounded-lg border border-border bg-background/50"
                  >
                    <div className="flex items-start gap-3">
                      {getPriorityIcon(action.priority)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{action.action}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {action.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {action.effort} effort
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {taskRisks.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No tasks at risk</p>
              ) : (
                taskRisks.map((task) => (
                  <div 
                    key={task.taskId}
                    className={`p-3 rounded-lg border ${getRiskBorderColor(task.riskLevel)} bg-background/50`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-medium text-sm">{task.taskTitle}</span>
                      <Badge className={getRiskColor(task.riskLevel)}>
                        {task.riskScore}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {task.factors.map((f, i) => (
                        <p key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                          {f}
                        </p>
                      ))}
                    </div>
                    {task.suggestion && (
                      <div className="mt-2 p-2 rounded bg-primary/5 border border-primary/10">
                        <p className="text-xs text-primary">
                          <TrendingUp className="h-3 w-3 inline mr-1" />
                          {task.suggestion}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RiskRadar;
