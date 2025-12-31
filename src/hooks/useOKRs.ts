import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export interface OKR {
  id: string;
  project_id: string | null;
  user_id: string;
  title: string;
  description: string | null;
  type: 'objective' | 'key_result';
  parent_id: string | null;
  target_value: number | null;
  current_value: number | null;
  unit: string | null;
  start_date: string | null;
  end_date: string | null;
  status: 'active' | 'completed' | 'cancelled';
  progress: number;
  created_at: string;
  updated_at: string;
  key_results?: OKR[];
  linked_tasks?: string[];
}

export const useOKRs = (projectId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const okrsQuery = useQuery<OKR[]>({
    queryKey: ["okrs", projectId],
    queryFn: async (): Promise<OKR[]> => {
      let query = supabase
        .from("okrs")
        .select("*")
        .eq("type", "objective")
        .order("created_at", { ascending: false });
      
      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      const { data: objectives, error } = await query;
      if (error) throw error;

      // Fetch key results for each objective
      const objectiveIds = objectives?.map(o => o.id) || [];
      if (objectiveIds.length === 0) {
        return (objectives || []) as OKR[];
      }

      const { data: keyResults, error: krError } = await supabase
        .from("okrs")
        .select("*")
        .eq("type", "key_result")
        .in("parent_id", objectiveIds);

      if (krError) throw krError;

      // Fetch task links
      const { data: taskLinks } = await supabase
        .from("okr_task_links")
        .select("okr_id, task_id")
        .in("okr_id", [...objectiveIds, ...(keyResults?.map(kr => kr.id) || [])]);

      return objectives?.map(obj => ({
        ...obj,
        type: obj.type as 'objective' | 'key_result',
        status: obj.status as 'active' | 'completed' | 'cancelled',
        key_results: (keyResults?.filter(kr => kr.parent_id === obj.id) || []).map(kr => ({
          ...kr,
          type: kr.type as 'objective' | 'key_result',
          status: kr.status as 'active' | 'completed' | 'cancelled',
          linked_tasks: taskLinks?.filter(tl => tl.okr_id === kr.id).map(tl => tl.task_id) || []
        })),
        linked_tasks: taskLinks?.filter(tl => tl.okr_id === obj.id).map(tl => tl.task_id) || []
      })) as OKR[];
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`okrs-${projectId || 'all'}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "okrs" },
        () => queryClient.invalidateQueries({ queryKey: ["okrs", projectId] })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "okr_task_links" },
        () => queryClient.invalidateQueries({ queryKey: ["okrs", projectId] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  const createObjective = useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      project_id?: string;
      start_date?: string;
      end_date?: string;
      key_results?: { title: string; target_value?: number; unit?: string }[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: objective, error } = await supabase
        .from("okrs")
        .insert({
          title: data.title,
          description: data.description,
          project_id: data.project_id || projectId,
          user_id: user.id,
          type: 'objective',
          start_date: data.start_date,
          end_date: data.end_date,
        })
        .select()
        .single();

      if (error) throw error;

      // Create key results if provided
      if (data.key_results && data.key_results.length > 0) {
        const krData = data.key_results.map(kr => ({
          title: kr.title,
          project_id: data.project_id || projectId,
          user_id: user.id,
          type: 'key_result' as const,
          parent_id: objective.id,
          target_value: kr.target_value,
          unit: kr.unit,
          start_date: data.start_date,
          end_date: data.end_date,
        }));

        const { error: krError } = await supabase.from("okrs").insert(krData);
        if (krError) throw krError;
      }

      return objective;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["okrs", projectId] });
      toast({ title: "Objective created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create objective", description: error.message, variant: "destructive" });
    },
  });

  const updateOKR = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<OKR> & { id: string }) => {
      const { error } = await supabase.from("okrs").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["okrs", projectId] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update OKR", description: error.message, variant: "destructive" });
    },
  });

  const deleteOKR = useMutation({
    mutationFn: async (okrId: string) => {
      const { error } = await supabase.from("okrs").delete().eq("id", okrId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["okrs", projectId] });
      toast({ title: "OKR deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete OKR", description: error.message, variant: "destructive" });
    },
  });

  const linkTask = useMutation({
    mutationFn: async ({ okrId, taskId }: { okrId: string; taskId: string }) => {
      const { error } = await supabase
        .from("okr_task_links")
        .insert({ okr_id: okrId, task_id: taskId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["okrs", projectId] });
      toast({ title: "Task linked to OKR" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to link task", description: error.message, variant: "destructive" });
    },
  });

  const unlinkTask = useMutation({
    mutationFn: async ({ okrId, taskId }: { okrId: string; taskId: string }) => {
      const { error } = await supabase
        .from("okr_task_links")
        .delete()
        .eq("okr_id", okrId)
        .eq("task_id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["okrs", projectId] });
    },
  });

  const updateProgress = useMutation({
    mutationFn: async ({ okrId, currentValue }: { okrId: string; currentValue: number }) => {
      const { data: okr } = await supabase
        .from("okrs")
        .select("target_value")
        .eq("id", okrId)
        .single();

      const progress = okr?.target_value 
        ? Math.min(100, Math.round((currentValue / okr.target_value) * 100))
        : 0;

      const { error } = await supabase
        .from("okrs")
        .update({ current_value: currentValue, progress })
        .eq("id", okrId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["okrs", projectId] });
    },
  });

  return {
    okrs: okrsQuery.data || [],
    isLoading: okrsQuery.isLoading,
    createObjective,
    updateOKR,
    deleteOKR,
    linkTask,
    unlinkTask,
    updateProgress,
  };
};
