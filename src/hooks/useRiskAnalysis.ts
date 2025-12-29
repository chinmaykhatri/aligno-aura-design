import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface RiskFactor {
  factor: string;
  severity: 'low' | 'medium' | 'high';
  impact: string;
}

export interface MitigationAction {
  action: string;
  priority: 'immediate' | 'soon' | 'later';
  effort: 'low' | 'medium' | 'high';
}

export interface TaskRisk {
  taskId: string;
  taskTitle: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  predictedSlipDays: number;
  factors: string[];
  suggestion: string;
}

export interface SprintRisk {
  sprintId: string;
  sprintName: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  suggestion: string;
}

export interface ProjectRisk {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  predictedSlipDays: number;
  confidenceScore: number;
  summary: string;
  riskFactors: RiskFactor[];
  mitigationActions: MitigationAction[];
}

export interface RiskAnalysisResult {
  projectRisk: ProjectRisk;
  taskRisks: TaskRisk[];
  sprintRisks: SprintRisk[];
}

export const useRiskAnalysis = (projectId: string) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<RiskAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const analyzeRisks = async () => {
    if (!projectId) return;
    
    setIsAnalyzing(true);
    setError(null);

    try {
      const { data, error: funcError } = await supabase.functions.invoke('risk-analysis', {
        body: { projectId, analysisType: 'full' },
      });

      if (funcError) throw funcError;

      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysis(data);
      toast({
        title: 'Risk Analysis Complete',
        description: `Project risk level: ${data.projectRisk.riskLevel.toUpperCase()}`,
      });

      return data;
    } catch (err: any) {
      console.error('Risk analysis error:', err);
      const message = err.message || 'Failed to analyze risks';
      setError(message);
      toast({
        title: 'Analysis Failed',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    isAnalyzing,
    analysis,
    error,
    analyzeRisks,
    clearAnalysis: () => setAnalysis(null),
  };
};
