import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, tasks, teamMembers, projectId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Smart scheduling request: ${type} for project ${projectId}`);
    console.log(`Tasks count: ${tasks?.length || 0}, Team members: ${teamMembers?.length || 0}`);

    let systemPrompt = '';
    let userPrompt = '';

    const tasksContext = tasks?.map((t: any) => 
      `- "${t.title}" (Priority: ${t.priority}, Status: ${t.status}, Due: ${t.due_date || 'No deadline'}, Estimated: ${t.estimated_hours || 'N/A'}h, Tracked: ${t.tracked_hours || 0}h, Assigned to: ${t.assigned_to || 'Unassigned'})`
    ).join('\n') || 'No tasks';

    const teamContext = teamMembers?.map((m: any) => 
      `- ${m.full_name || 'Unknown'} (${m.role})`
    ).join('\n') || 'No team members';

    switch (type) {
      case 'suggestions':
        systemPrompt = `You are an AI scheduling assistant. Analyze tasks and provide smart scheduling suggestions. Be concise and actionable. Return JSON format only.`;
        userPrompt = `Analyze these tasks and provide 3-5 scheduling suggestions:

Tasks:
${tasksContext}

Return JSON: { "suggestions": [{ "title": "suggestion title", "description": "what to do", "priority": "high|medium|low", "taskIds": ["affected task ids"] }] }`;
        break;

      case 'auto-schedule':
        systemPrompt = `You are an AI scheduling assistant. Create an optimal schedule for tasks based on priorities and deadlines. Return JSON format only.`;
        userPrompt = `Create an optimal schedule for these tasks:

Tasks:
${tasksContext}

Return JSON: { "schedule": [{ "taskId": "id", "taskTitle": "title", "suggestedDate": "YYYY-MM-DD", "suggestedTimeBlock": "morning|afternoon|evening", "reason": "why this timing" }] }`;
        break;

      case 'workload':
        systemPrompt = `You are an AI workload balancer. Analyze team workload and suggest task reassignments for optimal balance. Return JSON format only.`;
        userPrompt = `Balance workload for this team:

Team Members:
${teamContext}

Tasks:
${tasksContext}

Return JSON: { "analysis": { "overloaded": ["member names"], "underutilized": ["member names"] }, "reassignments": [{ "taskId": "id", "taskTitle": "title", "currentAssignee": "name or null", "suggestedAssignee": "name", "reason": "why reassign" }] }`;
        break;

      case 'deadline-alerts':
        systemPrompt = `You are an AI deadline monitor. Analyze tasks and identify deadline risks. Consider task complexity and remaining time. Return JSON format only.`;
        userPrompt = `Analyze deadline risks for these tasks (today is ${new Date().toISOString().split('T')[0]}):

Tasks:
${tasksContext}

Return JSON: { "alerts": [{ "taskId": "id", "taskTitle": "title", "alertLevel": "critical|warning|info", "dueDate": "date", "daysRemaining": number, "message": "what action needed", "suggestedAction": "specific recommendation" }] }`;
        break;

      default:
        throw new Error(`Unknown scheduling type: ${type}`);
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log('AI response:', content);

    // Parse JSON from response
    let result;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      result = JSON.parse(jsonMatch[1] || content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      result = { error: 'Failed to parse AI response', raw: content };
    }

    return new Response(JSON.stringify({ type, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Smart scheduling error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
