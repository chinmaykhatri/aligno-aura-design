export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at: string
          id: string
          metadata: Json | null
          project_id: string | null
          user_id: string
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          id?: string
          metadata?: Json | null
          project_id?: string | null
          user_id: string
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          id?: string
          metadata?: Json | null
          project_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      client_portal_tokens: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          last_viewed_at: string | null
          name: string
          project_id: string
          token: string
          updated_at: string
          user_id: string
          views_count: number
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_viewed_at?: string | null
          name?: string
          project_id: string
          token?: string
          updated_at?: string
          user_id: string
          views_count?: number
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_viewed_at?: string | null
          name?: string
          project_id?: string
          token?: string
          updated_at?: string
          user_id?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_portal_tokens_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          description: string | null
          id: string
          progress: number
          project_id: string
          status: string
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          progress?: number
          project_id: string
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          progress?: number
          project_id?: string
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          goal_id: string
          id: string
          target_date: string | null
          title: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          goal_id: string
          id?: string
          target_date?: string | null
          title: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          goal_id?: string
          id?: string
          target_date?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_integrations: {
        Row: {
          config: Json
          created_at: string
          id: string
          integration_type: string
          is_active: boolean
          project_id: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          integration_type: string
          is_active?: boolean
          project_id: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          integration_type?: string
          is_active?: boolean
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_integrations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      project_messages: {
        Row: {
          attachment_name: string | null
          attachment_type: string | null
          attachment_url: string | null
          content: string
          created_at: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          created_at?: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          progress: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          progress?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          progress?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      risk_assessments: {
        Row: {
          assessed_at: string
          confidence_score: number | null
          created_at: string
          id: string
          mitigation_actions: Json
          predicted_slip_days: number | null
          project_id: string
          risk_factors: Json
          risk_level: string
          risk_score: number
          sprint_id: string | null
          task_id: string | null
          updated_at: string
        }
        Insert: {
          assessed_at?: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          mitigation_actions?: Json
          predicted_slip_days?: number | null
          project_id: string
          risk_factors?: Json
          risk_level?: string
          risk_score?: number
          sprint_id?: string | null
          task_id?: string | null
          updated_at?: string
        }
        Update: {
          assessed_at?: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          mitigation_actions?: Json
          predicted_slip_days?: number | null
          project_id?: string
          risk_factors?: Json
          risk_level?: string
          risk_score?: number
          sprint_id?: string | null
          task_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_assessments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_assessments_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_assessments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_items: {
        Row: {
          ai_suggestions: Json | null
          color: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          lane: string
          linked_goals: string[] | null
          linked_sprints: string[] | null
          linked_tasks: string[] | null
          priority: number | null
          project_id: string
          start_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          ai_suggestions?: Json | null
          color?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          lane?: string
          linked_goals?: string[] | null
          linked_sprints?: string[] | null
          linked_tasks?: string[] | null
          priority?: number | null
          project_id: string
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          ai_suggestions?: Json | null
          color?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          lane?: string
          linked_goals?: string[] | null
          linked_sprints?: string[] | null
          linked_tasks?: string[] | null
          priority?: number | null
          project_id?: string
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduling_history: {
        Row: {
          action_type: string
          created_at: string
          details: Json
          id: string
          previous_value: Json | null
          project_id: string
          task_id: string | null
          task_title: string
          undone: boolean | null
          undone_at: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          details?: Json
          id?: string
          previous_value?: Json | null
          project_id: string
          task_id?: string | null
          task_title: string
          undone?: boolean | null
          undone_at?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: Json
          id?: string
          previous_value?: Json | null
          project_id?: string
          task_id?: string | null
          task_title?: string
          undone?: boolean | null
          undone_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduling_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduling_history_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      sprint_member_capacity: {
        Row: {
          available_hours: number
          created_at: string
          id: string
          notes: string | null
          sprint_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          available_hours?: number
          created_at?: string
          id?: string
          notes?: string | null
          sprint_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          available_hours?: number
          created_at?: string
          id?: string
          notes?: string | null
          sprint_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprint_member_capacity_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      sprint_retrospectives: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_resolved: boolean | null
          sprint_id: string
          user_id: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          id?: string
          is_resolved?: boolean | null
          sprint_id: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_resolved?: boolean | null
          sprint_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprint_retrospectives_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      sprint_templates: {
        Row: {
          created_at: string
          duration_days: number
          goal_template: string | null
          id: string
          is_default: boolean | null
          name: string
          project_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_days?: number
          goal_template?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          project_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_days?: number
          goal_template?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          project_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprint_templates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      sprints: {
        Row: {
          created_at: string
          end_date: string
          goal: string | null
          id: string
          name: string
          project_id: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          goal?: string | null
          id?: string
          name: string
          project_id: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          goal?: string | null
          id?: string
          name?: string
          project_id?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprints_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      task_dependencies: {
        Row: {
          created_at: string
          depends_on_task_id: string
          id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          depends_on_task_id: string
          id?: string
          task_id: string
        }
        Update: {
          created_at?: string
          depends_on_task_id?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_depends_on_task_id_fkey"
            columns: ["depends_on_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          baseline_due_date: string | null
          baseline_estimated_hours: number | null
          baseline_story_points: number | null
          created_at: string
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          priority: string
          project_id: string
          sprint_id: string | null
          status: string
          story_points: number | null
          title: string
          tracked_hours: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          baseline_due_date?: string | null
          baseline_estimated_hours?: number | null
          baseline_story_points?: number | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: string
          project_id: string
          sprint_id?: string | null
          status?: string
          story_points?: number | null
          title: string
          tracked_hours?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          baseline_due_date?: string | null
          baseline_estimated_hours?: number | null
          baseline_story_points?: number | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: string
          project_id?: string
          sprint_id?: string | null
          status?: string
          story_points?: number | null
          title?: string
          tracked_hours?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      team_time_off: {
        Row: {
          created_at: string
          end_date: string
          hours_per_day: number
          id: string
          project_id: string
          reason: string | null
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          hours_per_day?: number
          id?: string
          project_id: string
          reason?: string | null
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          hours_per_day?: number
          id?: string
          project_id?: string
          reason?: string | null
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_time_off_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_project_access: {
        Args: { project_id: string; user_id: string }
        Returns: boolean
      }
      is_project_owner: {
        Args: { project_id: string; user_id: string }
        Returns: boolean
      }
      log_activity: {
        Args: {
          p_activity_type: Database["public"]["Enums"]["activity_type"]
          p_metadata?: Json
          p_project_id: string
        }
        Returns: string
      }
    }
    Enums: {
      activity_type:
        | "project_created"
        | "project_updated"
        | "project_deleted"
        | "project_status_changed"
        | "project_progress_updated"
        | "member_added"
        | "member_removed"
        | "member_role_changed"
        | "task_created"
        | "task_updated"
        | "task_completed"
        | "task_deleted"
        | "goal_created"
        | "goal_updated"
        | "goal_completed"
        | "milestone_completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_type: [
        "project_created",
        "project_updated",
        "project_deleted",
        "project_status_changed",
        "project_progress_updated",
        "member_added",
        "member_removed",
        "member_role_changed",
        "task_created",
        "task_updated",
        "task_completed",
        "task_deleted",
        "goal_created",
        "goal_updated",
        "goal_completed",
        "milestone_completed",
      ],
    },
  },
} as const
