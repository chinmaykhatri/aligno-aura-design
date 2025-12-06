import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export interface Milestone {
  id: string;
  goal_id: string;
  title: string;
  completed: boolean;
  target_date: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface Goal {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  status: string;
  progress: number;
  created_at: string;
  updated_at: string;
  milestones?: Milestone[];
}

export const useGoals = (projectId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const goalsQuery = useQuery<Goal[]>({
    queryKey: ["goals", projectId],
    queryFn: async (): Promise<Goal[]> => {
      const { data: goals, error: goalsError } = await supabase
        .from("goals")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (goalsError) throw goalsError;

      const goalIds = goals?.map((g) => g.id) || [];
      
      if (goalIds.length === 0) {
        return (goals || []).map(g => ({ ...g, milestones: [] })) as Goal[];
      }

      const { data: milestones, error: milestonesError } = await supabase
        .from("milestones")
        .select("*")
        .in("goal_id", goalIds)
        .order("created_at", { ascending: true });

      if (milestonesError) throw milestonesError;

      return goals?.map((goal) => ({
        ...goal,
        milestones: (milestones?.filter((m) => m.goal_id === goal.id) || []) as Milestone[],
      })) as Goal[];
    },
    enabled: !!projectId,
  });

  // Real-time subscription
  useEffect(() => {
    const goalsChannel = supabase
      .channel(`goals-${projectId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "goals", filter: `project_id=eq.${projectId}` },
        () => queryClient.invalidateQueries({ queryKey: ["goals", projectId] })
      )
      .subscribe();

    const milestonesChannel = supabase
      .channel(`milestones-${projectId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "milestones" },
        () => queryClient.invalidateQueries({ queryKey: ["goals", projectId] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(goalsChannel);
      supabase.removeChannel(milestonesChannel);
    };
  }, [projectId, queryClient]);

  const createGoal = useMutation({
    mutationFn: async (goalData: { title: string; description?: string; target_date?: string; milestones?: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: goal, error: goalError } = await supabase
        .from("goals")
        .insert({
          project_id: projectId,
          user_id: user.id,
          title: goalData.title,
          description: goalData.description,
          target_date: goalData.target_date,
        })
        .select()
        .single();

      if (goalError) throw goalError;

      if (goalData.milestones && goalData.milestones.length > 0) {
        const milestonesData = goalData.milestones.map((title) => ({
          goal_id: goal.id,
          title,
        }));

        const { error: milestonesError } = await supabase
          .from("milestones")
          .insert(milestonesData);

        if (milestonesError) throw milestonesError;
      }

      return goal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", projectId] });
      toast({ title: "Goal created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create goal", description: error.message, variant: "destructive" });
    },
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Goal> & { id: string }) => {
      const { error } = await supabase.from("goals").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", projectId] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update goal", description: error.message, variant: "destructive" });
    },
  });

  const deleteGoal = useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase.from("goals").delete().eq("id", goalId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", projectId] });
      toast({ title: "Goal deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete goal", description: error.message, variant: "destructive" });
    },
  });

  const toggleMilestone = useMutation({
    mutationFn: async ({ milestoneId, completed }: { milestoneId: string; completed: boolean }) => {
      const { error } = await supabase
        .from("milestones")
        .update({ 
          completed, 
          completed_at: completed ? new Date().toISOString() : null 
        })
        .eq("id", milestoneId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", projectId] });
    },
  });

  const addMilestone = useMutation({
    mutationFn: async ({ goalId, title }: { goalId: string; title: string }) => {
      const { error } = await supabase
        .from("milestones")
        .insert({ goal_id: goalId, title });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", projectId] });
    },
  });

  const deleteMilestone = useMutation({
    mutationFn: async (milestoneId: string) => {
      const { error } = await supabase.from("milestones").delete().eq("id", milestoneId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", projectId] });
    },
  });

  return {
    goals: goalsQuery.data || [],
    isLoading: goalsQuery.isLoading,
    createGoal,
    updateGoal,
    deleteGoal,
    toggleMilestone,
    addMilestone,
    deleteMilestone,
  };
};
