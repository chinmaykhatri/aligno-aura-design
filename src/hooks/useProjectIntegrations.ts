import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProjectIntegration {
  id: string;
  project_id: string;
  integration_type: 'slack' | 'github' | 'google_calendar';
  config: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useProjectIntegrations = (projectId: string) => {
  return useQuery({
    queryKey: ['project-integrations', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_integrations')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;
      return data as ProjectIntegration[];
    },
    enabled: !!projectId,
  });
};

export const useUpsertIntegration = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      projectId, 
      integrationType, 
      config, 
      isActive = true 
    }: { 
      projectId: string; 
      integrationType: 'slack' | 'github' | 'google_calendar';
      config: Record<string, any>;
      isActive?: boolean;
    }) => {
      // Check if integration exists
      const { data: existing } = await supabase
        .from('project_integrations')
        .select('id')
        .eq('project_id', projectId)
        .eq('integration_type', integrationType)
        .single();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('project_integrations')
          .update({ config, is_active: isActive })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data as ProjectIntegration;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('project_integrations')
          .insert({
            project_id: projectId,
            integration_type: integrationType,
            config,
            is_active: isActive,
          })
          .select()
          .single();

        if (error) throw error;
        return data as ProjectIntegration;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-integrations', variables.projectId] });
      toast({
        title: 'Integration Saved',
        description: 'Your integration settings have been updated',
      });
    },
    onError: (error) => {
      console.error('Integration error:', error);
      toast({
        title: 'Error',
        description: 'Failed to save integration settings',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteIntegration = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('project_integrations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-integrations', variables.projectId] });
      toast({
        title: 'Integration Removed',
        description: 'The integration has been disconnected',
      });
    },
  });
};

// Helper to send Slack notification
export const sendSlackNotification = async (webhookUrl: string, message: {
  text: string;
  blocks?: any[];
}) => {
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      mode: 'no-cors',
      body: JSON.stringify(message),
    });
    return { success: true };
  } catch (error) {
    console.error('Slack notification error:', error);
    return { success: false, error };
  }
};
