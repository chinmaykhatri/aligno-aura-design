import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ExecutiveReport {
  summary: string;
  achievements: string[];
  risks: { text: string; severity: string }[] | string[];
  velocityInsight: string;
  recommendations: string[];
  outlook: string;
}

export const useExecutiveReport = () => {
  const [report, setReport] = useState<ExecutiveReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateReport = async (
    projects: any[],
    tasks: any[],
    sprints: any[],
    dateRange: string = 'past week'
  ) => {
    setIsLoading(true);
    setReport(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to generate reports.",
          variant: "destructive",
        });
        return null;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/executive-report`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ projects, tasks, sprints, dateRange }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast({
            title: "Rate limit exceeded",
            description: "Please try again later.",
            variant: "destructive",
          });
          return null;
        }
        if (response.status === 402) {
          toast({
            title: "Payment required",
            description: "Please add funds to continue using AI features.",
            variant: "destructive",
          });
          return null;
        }
        throw new Error("Failed to generate report");
      }

      const data = await response.json();
      
      // Normalize risks to always have text and severity
      const normalizedReport: ExecutiveReport = {
        ...data.report,
        risks: (data.report.risks || []).map((risk: any) => {
          if (typeof risk === 'string') {
            const severityMatch = risk.match(/\((high|medium|low)\)/i);
            return {
              text: risk.replace(/\s*\((high|medium|low)\)/i, ''),
              severity: severityMatch ? severityMatch[1].toLowerCase() : 'medium'
            };
          }
          return risk;
        })
      };
      
      setReport(normalizedReport);
      return normalizedReport;
    } catch (error) {
      console.error("Report generation error:", error);
      toast({
        title: "Error",
        description: "Failed to generate executive report.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    report,
    isLoading,
    generateReport,
  };
};
