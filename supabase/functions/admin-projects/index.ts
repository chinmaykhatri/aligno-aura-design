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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || roleData.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all projects (bypassing RLS with service role key)
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      throw projectsError;
    }

    // Fetch all project members
    const { data: members } = await supabase
      .from('project_members')
      .select('project_id, user_id, role');

    // Fetch auth users for owner info
    const { data: authUsers } = await supabase.auth.admin.listUsers();

    // Fetch profiles for names
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name');

    // Combine data
    const enrichedProjects = projects.map(project => {
      const projectMembers = members?.filter(m => m.project_id === project.id) || [];
      const owner = projectMembers.find(m => m.role === 'owner');
      const ownerAuth = authUsers?.users?.find(u => u.id === owner?.user_id);
      const ownerProfile = profiles?.find(p => p.user_id === owner?.user_id);

      return {
        ...project,
        member_count: projectMembers.length,
        owner_id: owner?.user_id || project.user_id,
        owner_email: ownerAuth?.email || null,
        owner_name: ownerProfile?.full_name || ownerAuth?.user_metadata?.full_name || null,
      };
    });

    return new Response(JSON.stringify({ projects: enrichedProjects }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Admin projects error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch projects' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
