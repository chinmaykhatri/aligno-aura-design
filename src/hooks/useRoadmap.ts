import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface RoadmapItem {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  lane: 'backlog' | 'q1' | 'q2' | 'q3' | 'q4' | 'now' | 'next' | 'later';
  start_date: string | null;
  end_date: string | null;
  color: string;
  linked_tasks: string[];
  linked_goals: string[];
  linked_sprints: string[];
  status: 'planned' | 'in_progress' | 'completed' | 'at_risk';
  priority: number;
  ai_suggestions: any[];
  created_at: string;
  updated_at: string;
}

export const useRoadmapItems = (projectId: string) => {
  return useQuery({
    queryKey: ['roadmap-items', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roadmap_items')
        .select('*')
        .eq('project_id', projectId)
        .order('priority', { ascending: true });

      if (error) throw error;
      return data as RoadmapItem[];
    },
    enabled: !!projectId,
  });
};

export const useCreateRoadmapItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (item: {
      project_id: string;
      title: string;
      description?: string;
      lane?: string;
      start_date?: string;
      end_date?: string;
      color?: string;
      status?: string;
      priority?: number;
    }) => {
      const { data, error } = await supabase
        .from('roadmap_items')
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['roadmap-items', data.project_id] });
      toast({ title: 'Roadmap item created' });
    },
    onError: (error) => {
      console.error('Create roadmap item error:', error);
      toast({ title: 'Failed to create item', variant: 'destructive' });
    },
  });
};

export const useUpdateRoadmapItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, projectId, ...updates }: {
      id: string;
      projectId: string;
      title?: string;
      description?: string;
      lane?: string;
      start_date?: string | null;
      end_date?: string | null;
      color?: string;
      status?: string;
      priority?: number;
      linked_tasks?: string[];
      linked_goals?: string[];
      linked_sprints?: string[];
    }) => {
      const { data, error } = await supabase
        .from('roadmap_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['roadmap-items', data.projectId] });
    },
    onError: (error) => {
      console.error('Update roadmap item error:', error);
      toast({ title: 'Failed to update item', variant: 'destructive' });
    },
  });
};

export const useDeleteRoadmapItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('roadmap_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['roadmap-items', data.projectId] });
      toast({ title: 'Roadmap item deleted' });
    },
    onError: (error) => {
      console.error('Delete roadmap item error:', error);
      toast({ title: 'Failed to delete item', variant: 'destructive' });
    },
  });
};
