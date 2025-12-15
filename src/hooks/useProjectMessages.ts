import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface ProjectMessage {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  created_at: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
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

interface SendMessageParams {
  projectId: string;
  content: string;
  attachment?: {
    url: string;
    name: string;
    type: string;
  };
}

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, content, attachment }: SendMessageParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('project_messages')
        .insert({
          project_id: projectId,
          user_id: user.id,
          content: content.trim(),
          attachment_url: attachment?.url || null,
          attachment_name: attachment?.name || null,
          attachment_type: attachment?.type || null,
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

export const useUploadAttachment = () => {
  return useMutation({
    mutationFn: async ({ projectId, file }: { projectId: string; file: File }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${projectId}/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Store the file path instead of public URL for security
      // Signed URLs will be generated when displaying attachments
      return {
        url: filePath, // Store path, not public URL
        name: file.name,
        type: file.type,
      };
    },
  });
};

// Helper function to get signed URL for an attachment
export const getAttachmentSignedUrl = async (attachmentUrl: string | null | undefined): Promise<string | null> => {
  if (!attachmentUrl) return null;
  
  // Check if it's already a full URL (legacy data) or a file path
  if (attachmentUrl.startsWith('http')) {
    // Legacy public URL - return as-is (these won't work after bucket is private)
    // Consider migrating old data or showing a placeholder
    return attachmentUrl;
  }
  
  // Generate signed URL for file path (1 hour expiry)
  const { data, error } = await supabase.storage
    .from('chat-attachments')
    .createSignedUrl(attachmentUrl, 3600);
  
  if (error) {
    console.error('Error creating signed URL:', error);
    return null;
  }
  
  return data.signedUrl;
};
