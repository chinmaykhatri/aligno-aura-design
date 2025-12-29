import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();
    
    if (!token) {
      return new Response(JSON.stringify({ error: 'Token is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Client portal access request for token:', token.slice(0, 8) + '...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the token and check if valid
    const { data: tokenData, error: tokenError } = await supabase
      .from('client_portal_tokens')
      .select('*, projects(*)')
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (tokenError || !tokenData) {
      console.error('Token not found or invalid:', tokenError);
      return new Response(JSON.stringify({ error: 'Invalid or expired link' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check expiration
    if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
      console.log('Token expired');
      return new Response(JSON.stringify({ error: 'This link has expired' }), {
        status: 410,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const projectId = tokenData.project_id;

    // Update view count
    await supabase
      .from('client_portal_tokens')
      .update({ 
        views_count: (tokenData.views_count || 0) + 1,
        last_viewed_at: new Date().toISOString()
      })
      .eq('id', tokenData.id);

    // Fetch project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, description, progress, status, created_at, updated_at')
      .eq('id', projectId)
      .single();

    if (projectError) {
      console.error('Project fetch error:', projectError);
      throw projectError;
    }

    // Fetch tasks (limited info for clients)
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, status, priority, due_date, story_points')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    // Fetch goals
    const { data: goals } = await supabase
      .from('goals')
      .select('id, title, description, progress, status, target_date')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    // Fetch sprints
    const { data: sprints } = await supabase
      .from('sprints')
      .select('id, name, goal, status, start_date, end_date')
      .eq('project_id', projectId)
      .order('start_date', { ascending: false });

    // Calculate metrics
    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const activeSprint = sprints?.find(s => s.status === 'active');
    const sprintTasks = activeSprint 
      ? tasks?.filter(t => true) // Would need sprint_id but we don't expose it
      : [];

    console.log('Returning portal data for project:', project.name);

    return new Response(JSON.stringify({
      project: {
        ...project,
        taskCompletionRate,
        totalTasks,
        completedTasks,
      },
      tasks: tasks?.slice(0, 20) || [], // Limit to 20 for clients
      goals: goals || [],
      sprints: sprints?.slice(0, 5) || [], // Limit to recent 5
      activeSprint,
      portalName: tokenData.name,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Client portal error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch project data' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
