import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface QueryResult {
  answer: string;
  details: string[];
  relatedItems: {
    type: 'project' | 'task' | 'sprint';
    id: string;
    name: string;
    relevance: string;
  }[];
  suggestions: string[];
}

export const useNaturalLanguageQuery = () => {
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<{ query: string; result: QueryResult }[]>([]);
  const { toast } = useToast();

  const executeQuery = async (
    query: string,
    context: {
      projects?: any[];
      tasks?: any[];
      sprints?: any[];
    }
  ) => {
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to use queries.",
          variant: "destructive",
        });
        return null;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/natural-language-query`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ query, context }),
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
        throw new Error("Query failed");
      }

      const data = await response.json();
      setResult(data.result);
      setHistory(prev => [...prev, { query, result: data.result }]);
      return data.result;
    } catch (error) {
      console.error("Query error:", error);
      toast({
        title: "Error",
        description: "Failed to process query.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    setResult(null);
  };

  return {
    result,
    isLoading,
    history,
    executeQuery,
    clearHistory,
  };
};
