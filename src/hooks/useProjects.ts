import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { analytics } from "@/lib/analytics";

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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      analytics.trackProjectCreated(data.id, data.name);
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", variables.id] });
      const updatedFields = Object.keys(variables.updates);
      analytics.trackProjectUpdated(variables.id, updatedFields);
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
    onSuccess: (_data, projectId) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      analytics.trackProjectDeleted(projectId);
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", variables.projectId] });
      analytics.trackMemberInvited(variables.projectId, variables.role);
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", variables.projectId] });
      analytics.trackMemberRemoved(variables.projectId);
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
