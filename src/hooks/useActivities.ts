import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export type ActivityType =
  | 'project_created'
  | 'project_updated'
  | 'project_deleted'
  | 'project_status_changed'
  | 'project_progress_updated'
  | 'member_added'
  | 'member_removed'
  | 'member_role_changed'
  | 'task_created'
  | 'task_updated'
  | 'task_completed'
  | 'task_deleted';

export interface Activity {
  id: string;
  user_id: string;
  project_id: string | null;
  activity_type: ActivityType;
  metadata: Record<string, any>;
  created_at: string;
  projects?: {
    name: string;
  } | null;
  profiles?: {
    full_name: string | null;
  } | null;
}

export interface ActivitiesFilters {
  activityTypes?: ActivityType[];
  projectId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

const ITEMS_PER_PAGE = 20;

export const useActivities = (filters: ActivitiesFilters = {}) => {
  const queryClient = useQueryClient();
  const page = filters.page || 1;
  const pageSize = filters.pageSize || ITEMS_PER_PAGE;

  useEffect(() => {
    const channel = supabase
      .channel('activities-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["activities"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["activities", filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get accessible project IDs
      const { data: memberProjects } = await supabase
        .from("project_members")
        .select("project_id")
        .eq("user_id", user.id);

      const projectIds = memberProjects?.map(pm => pm.project_id) || [];

      if (projectIds.length === 0) {
        return { data: [], count: 0, hasMore: false };
      }

      let query = supabase
        .from("activities")
        .select(`
          *,
          projects (name)
        `, { count: 'exact' })
        .in("project_id", projectIds)
        .order("created_at", { ascending: false });

      // Apply filters
      if (filters.activityTypes && filters.activityTypes.length > 0) {
        query = query.in("activity_type", filters.activityTypes);
      }

      if (filters.projectId) {
        query = query.eq("project_id", filters.projectId);
      }

      if (filters.startDate) {
        query = query.gte("created_at", filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte("created_at", filters.endDate);
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Fetch user profiles separately
      const userIds = Array.from(new Set(data?.map(a => a.user_id) || []));
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const activitiesWithProfiles = (data || []).map(activity => ({
        ...activity,
        profiles: profileMap.get(activity.user_id) || null,
      }));

      return {
        data: activitiesWithProfiles as Activity[],
        count: count || 0,
        hasMore: count ? (page * pageSize) < count : false,
      };
    },
  });
};

export const createActivity = async (
  activity: {
    user_id: string;
    project_id: string;
    activity_type: ActivityType;
    metadata?: Record<string, any>;
  }
) => {
  const { error } = await supabase
    .from("activities")
    .insert({
      user_id: activity.user_id,
      project_id: activity.project_id,
      activity_type: activity.activity_type,
      metadata: activity.metadata || {},
    });

  if (error) {
    console.error("Failed to create activity:", error);
  }
};
