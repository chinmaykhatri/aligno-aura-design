import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { analytics } from "@/lib/analytics";
import { createActivity } from "@/hooks/useActivities";
import { 
  sendStatusChangeNotification, 
  sendProgressMilestoneNotification, 
  sendMemberInvitationNotification,
  isProgressMilestone 
} from "@/lib/emailNotifications";

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  progress: number;
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
  members?: ProjectMember[];
  memberCount?: number;
}

export interface ProjectMember {
  id: string;
  project_id?: string;
  user_id: string;
  role: 'owner' | 'member';
  created_at?: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export const useProjects = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["projects"] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_members'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["projects"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get projects where user is owner or member
      const { data: memberProjects, error: memberError } = await supabase
        .from("project_members")
        .select("project_id")
        .eq("user_id", user.id);

      if (memberError) throw memberError;

      const projectIds = memberProjects?.map(pm => pm.project_id) || [];

      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          project_members (
            id,
            user_id,
            role,
            profiles (
              full_name,
              avatar_url
            )
          )
        `)
        .in("id", projectIds)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      return (data || []).map(project => ({
        ...project,
        members: project.project_members as any,
        memberCount: project.project_members?.length || 0,
      })) as Project[];
    },
  });
};

export const useProject = (id: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`project-${id}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["project", id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_members',
          filter: `project_id=eq.${id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["project", id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, queryClient]);

  return useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      if (!id) throw new Error("Project ID is required");

      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          project_members (
            id,
            user_id,
            role,
            profiles (
              full_name,
              avatar_url
            )
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      return {
        ...data,
        members: data.project_members as any,
        memberCount: data.project_members?.length || 0,
      } as Project;
    },
    enabled: !!id,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (project: {
      name: string;
      description?: string;
      progress?: number;
      status?: 'active' | 'completed' | 'archived';
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          name: project.name,
          description: project.description || null,
          progress: project.progress || 0,
          status: project.status || 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (newProject) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["projects"] });

      // Snapshot the previous value
      const previousProjects = queryClient.getQueryData(["projects"]);

      // Optimistically update to the new value
      queryClient.setQueryData(["projects"], (old: Project[] = []) => [
        {
          id: 'temp-' + Date.now(),
          user_id: '',
          name: newProject.name,
          description: newProject.description || null,
          progress: newProject.progress || 0,
          status: newProject.status || 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          members: [],
          memberCount: 1,
        },
        ...old,
      ]);

      return { previousProjects };
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      analytics.trackProjectCreated(data.id, data.name);
      
      // Create activity
      await createActivity({
        user_id: data.user_id,
        project_id: data.id,
        activity_type: 'project_created',
        metadata: { projectName: data.name },
      });
      
      toast({
        title: "Project created",
        description: "Your project has been created successfully.",
      });
    },
    onError: (error: Error, _newProject, context) => {
      // Rollback on error
      if (context?.previousProjects) {
        queryClient.setQueryData(["projects"], context.previousProjects);
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'members' | 'memberCount'>>;
    }) => {
      const { data, error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["projects"] });
      await queryClient.cancelQueries({ queryKey: ["project", id] });

      // Snapshot the previous values
      const previousProjects = queryClient.getQueryData(["projects"]);
      const previousProject = queryClient.getQueryData(["project", id]);

      // Optimistically update
      queryClient.setQueryData(["projects"], (old: Project[] = []) =>
        old.map((project) =>
          project.id === id ? { ...project, ...updates } : project
        )
      );

      queryClient.setQueryData(["project", id], (old: Project | undefined) =>
        old ? { ...old, ...updates } : old
      );

      return { previousProjects, previousProject };
    },
    onSuccess: async (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", variables.id] });
      const updatedFields = Object.keys(variables.updates);
      analytics.trackProjectUpdated(variables.id, updatedFields);
      
      // Get user email for notifications
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", data.user_id)
        .single();
      
      // Create activity based on what was updated
      if (variables.updates.status) {
        await createActivity({
          user_id: data.user_id,
          project_id: data.id,
          activity_type: 'project_status_changed',
          metadata: { newStatus: variables.updates.status, projectName: data.name },
        });
        
        // Send status change email to project owner
        if (userEmail) {
          const oldProject = context?.previousProject as Project | undefined;
          sendStatusChangeNotification(
            userEmail,
            profile?.full_name || undefined,
            data.name,
            oldProject?.status || 'unknown',
            variables.updates.status,
            profile?.full_name || undefined
          );
        }
      } else if (variables.updates.progress !== undefined) {
        await createActivity({
          user_id: data.user_id,
          project_id: data.id,
          activity_type: 'project_progress_updated',
          metadata: { newProgress: variables.updates.progress, projectName: data.name },
        });
        
        // Send milestone email if progress hit a milestone
        const oldProject = context?.previousProject as Project | undefined;
        const oldProgress = oldProject?.progress || 0;
        if (userEmail && isProgressMilestone(oldProgress, variables.updates.progress)) {
          sendProgressMilestoneNotification(
            userEmail,
            profile?.full_name || undefined,
            data.name,
            variables.updates.progress
          );
        }
      } else {
        await createActivity({
          user_id: data.user_id,
          project_id: data.id,
          activity_type: 'project_updated',
          metadata: { updatedFields, projectName: data.name },
        });
      }
      
      toast({
        title: "Project updated",
        description: "Your project has been updated successfully.",
      });
    },
    onError: (error: Error, variables, context) => {
      // Rollback on error
      if (context?.previousProjects) {
        queryClient.setQueryData(["projects"], context.previousProjects);
      }
      if (context?.previousProject) {
        queryClient.setQueryData(["project", variables.id], context.previousProject);
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: async (_data, projectId) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      analytics.trackProjectDeleted(projectId);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await createActivity({
          user_id: user.id,
          project_id: projectId,
          activity_type: 'project_deleted',
        });
      }
      
      toast({
        title: "Project deleted",
        description: "Your project has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useAddProjectMember = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      projectId,
      userId,
      role,
    }: {
      projectId: string;
      userId: string;
      role: 'owner' | 'member';
    }) => {
      const { data, error } = await supabase
        .from("project_members")
        .insert({
          project_id: projectId,
          user_id: userId,
          role,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", variables.projectId] });
      analytics.trackMemberInvited(variables.projectId, variables.role);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await createActivity({
          user_id: user.id,
          project_id: variables.projectId,
          activity_type: 'member_added',
          metadata: { role: variables.role },
        });
        
        // Get project name and invitee info for email notification
        const { data: project } = await supabase
          .from("projects")
          .select("name, description")
          .eq("id", variables.projectId)
          .single();
        
        const { data: inviteeProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", variables.userId)
          .single();
        
        const { data: inviterProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user.id)
          .single();
        
        // Get invitee email from auth (we'll use their user_id profile for now)
        // Note: In production, you'd want to store email in profiles or use a different lookup
        if (project) {
          // For now, we log the invitation - in production you'd get the actual email
          console.log(`Member invitation: ${variables.userId} invited to ${project.name} as ${variables.role}`);
        }
      }
      
      toast({
        title: "Member added",
        description: "Team member has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useRemoveProjectMember = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      projectId,
      memberId,
    }: {
      projectId: string;
      memberId: string;
    }) => {
      const { error } = await supabase
        .from("project_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", variables.projectId] });
      analytics.trackMemberRemoved(variables.projectId);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await createActivity({
          user_id: user.id,
          project_id: variables.projectId,
          activity_type: 'member_removed',
        });
      }
      
      toast({
        title: "Member removed",
        description: "Team member has been removed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
