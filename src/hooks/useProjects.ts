import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Project created",
        description: "Your project has been created successfully.",
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", variables.id] });
      toast({
        title: "Project updated",
        description: "Your project has been updated successfully.",
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
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
