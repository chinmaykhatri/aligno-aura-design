import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface ProjectMessage {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export const useProjectMessages = (projectId: string | undefined) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['project-messages', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      // Fetch messages
      const { data: messages, error: messagesError } = await supabase
        .from('project_messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Fetch profiles for message authors
      const userIds = [...new Set(messages.map(m => m.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      // Map profiles to messages
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      return messages.map(msg => ({
        ...msg,
        profile: profileMap.get(msg.user_id) || undefined,
      })) as ProjectMessage[];
    },
    enabled: !!projectId,
  });

  // Set up realtime subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`project-messages-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_messages',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['project-messages', projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  return query;
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, content }: { projectId: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('project_messages')
        .insert({
          project_id: projectId,
          user_id: user.id,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-messages', variables.projectId] });
    },
  });
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, projectId }: { messageId: string; projectId: string }) => {
      const { error } = await supabase
        .from('project_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      return { messageId, projectId };
    },
    onSuccess: (variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-messages', variables.projectId] });
    },
  });
};
