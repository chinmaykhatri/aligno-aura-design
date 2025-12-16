import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';

export type RetroCategory = 'went_well' | 'to_improve' | 'action_item';

export interface Retrospective {
  id: string;
  sprint_id: string;
  user_id: string;
  category: RetroCategory;
  content: string;
  is_resolved: boolean;
  created_at: string;
}

export const useRetrospectives = (sprintId: string | undefined) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['retrospectives', sprintId],
    queryFn: async () => {
      if (!sprintId) return [];
      
      const { data, error } = await supabase
        .from('sprint_retrospectives')
        .select('*')
        .eq('sprint_id', sprintId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Retrospective[];
    },
    enabled: !!sprintId,
  });

  useEffect(() => {
    if (!sprintId) return;

    const channel = supabase
      .channel(`retrospectives-${sprintId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sprint_retrospectives',
          filter: `sprint_id=eq.${sprintId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['retrospectives', sprintId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sprintId, queryClient]);

  return query;
};

export const useCreateRetrospective = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (retro: {
      sprint_id: string;
      category: RetroCategory;
      content: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('sprint_retrospectives')
        .insert({
          ...retro,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['retrospectives', data.sprint_id] });
      toast.success('Item added');
    },
  });
};

export const useUpdateRetrospective = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, sprintId, ...updates }: {
      id: string;
      sprintId: string;
      content?: string;
      is_resolved?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('sprint_retrospectives')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, sprintId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['retrospectives', data.sprintId] });
    },
  });
};

export const useDeleteRetrospective = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, sprintId }: { id: string; sprintId: string }) => {
      const { error } = await supabase
        .from('sprint_retrospectives')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { sprintId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['retrospectives', data.sprintId] });
      toast.success('Item removed');
    },
  });
};
